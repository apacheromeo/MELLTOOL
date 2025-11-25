import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  Logger,
  UploadedFile,
  UseInterceptors,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { Response } from 'express';
import { Buffer } from 'buffer';

import { InventoryService } from './inventory.service';
import { ProductService } from './product.service';
import { CategoryService } from './category.service';
import { BrandService } from './brand.service';
import { BarcodeService } from './barcode.service';
import { ProductImportService } from './product-import.service';
import { FileUploadSecurityInterceptor } from '@/common/interceptors/file-upload-security.interceptor';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { SearchProductsDto } from './dto/search-products.dto';
import { GenerateBarcodeDto } from './dto/generate-barcode.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('inventory')
@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class InventoryController {
  private readonly logger = new Logger(InventoryController.name);

  constructor(
    private readonly inventoryService: InventoryService,
    private readonly productService: ProductService,
    private readonly categoryService: CategoryService,
    private readonly brandService: BrandService,
    private readonly barcodeService: BarcodeService,
    private readonly productImportService: ProductImportService,
  ) {
    this.logger.log('InventoryController initialized');
  }

  // Products
  @Post('products')
  @Roles(UserRole.OWNER, UserRole.MOD)
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  async createProduct(@Body() createProductDto: CreateProductDto) {
    this.logger.log(`Creating product: ${createProductDto.name}`);
    return this.productService.create(createProductDto);
  }

  @Get('products')
  @ApiOperation({ summary: 'Get all products with pagination and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'brand', required: false, type: String })
  @ApiQuery({ name: 'lowStock', required: false, type: Boolean })
  async getProducts(@Query() searchDto: SearchProductsDto) {
    return this.productService.findAll(searchDto);
  }

  // IMPORT/EXPORT ROUTES - Must be before products/:id to avoid route conflicts
  @Get('products/export/stock')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Export current stock data for bulk adjustment (Owner only)' })
  @ApiResponse({ status: 200, description: 'Stock data exported successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async exportStockData(@Res() res: Response): Promise<void> {
    try {
      this.logger.log('Exporting stock data for bulk adjustment');
      const stockBuffer = await this.productImportService.exportStockData();

      const filename = `stock-export-${new Date().toISOString().split('T')[0]}.xlsx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', stockBuffer.length);

      res.send(stockBuffer);
      this.logger.log(`Stock data exported successfully: ${filename}`);
    } catch (error) {
      this.logger.error('Error exporting stock data:', error);
      res.status(500).json({
        statusCode: 500,
        message: 'Failed to export stock data',
        error: error.message,
      });
    }
  }

  @Get('products/import/template')
  @ApiOperation({ summary: 'Download import template (Excel file)' })
  @ApiResponse({ status: 200, description: 'Template file downloaded successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async downloadTemplate(@Res() res: Response, @Request() req: any): Promise<void> {
    this.logger.log(`[TEMPLATE DOWNLOAD] Route accessed! Path: ${req.url}, Method: ${req.method}`);
    try {
      this.logger.log('Generating import template');
      const templateBuffer = await this.productImportService.generateTemplate();
      
      if (!templateBuffer || !Buffer.isBuffer(templateBuffer)) {
        this.logger.error('Template buffer is invalid');
        res.status(500).json({
          statusCode: 500,
          message: 'Failed to generate template: Invalid buffer',
        });
        return;
      }

      if (templateBuffer.length === 0) {
        this.logger.error('Template buffer is empty');
        res.status(500).json({
          statusCode: 500,
          message: 'Failed to generate template: Empty buffer',
        });
        return;
      }

      // Set proper headers for file download
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="product-import-template.xlsx"');
      res.setHeader('Content-Length', templateBuffer.length.toString());
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Pragma', 'no-cache');
      
      this.logger.log(`Template generated successfully, size: ${templateBuffer.length} bytes`);
      
      // Send the buffer
      res.end(templateBuffer);
    } catch (error) {
      this.logger.error(`Error generating template: ${error.message}`, error.stack);
      if (!res.headersSent) {
        res.status(500).json({
          statusCode: 500,
          message: error.message || 'Failed to generate template',
        });
      }
    }
  }

  @Post('products/import')
  @Roles(UserRole.OWNER, UserRole.MOD)
  @UseInterceptors(FileInterceptor('file'), FileUploadSecurityInterceptor)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Import products from Excel or CSV file' })
  @ApiResponse({ status: 200, description: 'Products imported successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file format or data' })
  async importProducts(
    @UploadedFile() file: Express.Multer.File,
    @Query('updateExisting') updateExisting?: string,
    @Query('skipErrors') skipErrors?: string,
  ) {
    this.logger.log(`Importing products from file: ${file.originalname}`);
    
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const result = await this.productImportService.importFromFile(file, {
      updateExisting: updateExisting === 'true',
      skipErrors: skipErrors !== 'false',
    });

    return result;
  }

  @Get('products/:id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiResponse({ status: 200, description: 'Product found' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getProduct(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Patch('products/:id')
  @Roles(UserRole.OWNER, UserRole.MOD)
  @ApiOperation({ summary: 'Update product' })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  async updateProduct(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    this.logger.log(`Updating product: ${id}`);
    return this.productService.update(id, updateProductDto);
  }

  @Delete('products/:id')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Delete product (Owner only)' })
  @ApiResponse({ status: 200, description: 'Product deleted successfully' })
  async deleteProduct(@Param('id') id: string) {
    this.logger.log(`Deleting product: ${id}`);
    return this.productService.remove(id);
  }

  @Post('products/:id/barcode')
  @Roles(UserRole.OWNER, UserRole.MOD)
  @ApiOperation({ summary: 'Generate barcode for product' })
  @ApiResponse({ status: 200, description: 'Barcode generated successfully' })
  async generateBarcode(
    @Param('id') id: string,
    @Body() generateBarcodeDto: GenerateBarcodeDto,
  ) {
    this.logger.log(`Generating barcode for product: ${id}`);
    return this.barcodeService.generateBarcode(id, generateBarcodeDto);
  }

  @Post('products/:id/image')
  @Roles(UserRole.OWNER, UserRole.MOD)
  @UseInterceptors(FileInterceptor('image'), FileUploadSecurityInterceptor)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload product image' })
  @ApiResponse({ status: 200, description: 'Image uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file' })
  async uploadProductImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    this.logger.log(`Uploading image for product: ${id}, file: ${file.originalname}`);
    return this.productService.uploadImage(id, file);
  }

  // Categories
  @Post('categories')
  @Roles(UserRole.OWNER, UserRole.MOD)
  @ApiOperation({ summary: 'Create a new category' })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  async createCategory(@Body() createCategoryDto: CreateCategoryDto) {
    this.logger.log(`Creating category: ${createCategoryDto.name}`);
    return this.categoryService.create(createCategoryDto);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all categories' })
  async getCategories() {
    return this.categoryService.findAll();
  }

  @Get('categories/:id')
  @ApiOperation({ summary: 'Get category by ID' })
  async getCategory(@Param('id') id: string) {
    return this.categoryService.findOne(id);
  }

  @Patch('categories/:id')
  @Roles(UserRole.OWNER, UserRole.MOD)
  @ApiOperation({ summary: 'Update category' })
  async updateCategory(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    this.logger.log(`Updating category: ${id}`);
    return this.categoryService.update(id, updateCategoryDto);
  }

  @Delete('categories/:id')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Delete category (Owner only)' })
  async deleteCategory(@Param('id') id: string) {
    this.logger.log(`Deleting category: ${id}`);
    return this.categoryService.remove(id);
  }

  // Brands
  @Post('brands')
  @Roles(UserRole.OWNER, UserRole.MOD)
  @ApiOperation({ summary: 'Create a new brand' })
  @ApiResponse({ status: 201, description: 'Brand created successfully' })
  async createBrand(@Body() createBrandDto: CreateBrandDto) {
    this.logger.log(`Creating brand: ${createBrandDto.name}`);
    return this.brandService.create(createBrandDto);
  }

  @Get('brands')
  @ApiOperation({ summary: 'Get all brands' })
  async getBrands() {
    return this.brandService.findAll();
  }

  @Get('brands/:id')
  @ApiOperation({ summary: 'Get brand by ID' })
  async getBrand(@Param('id') id: string) {
    return this.brandService.findOne(id);
  }

  @Patch('brands/:id')
  @Roles(UserRole.OWNER, UserRole.MOD)
  @ApiOperation({ summary: 'Update brand' })
  async updateBrand(
    @Param('id') id: string,
    @Body() updateBrandDto: UpdateBrandDto,
  ) {
    this.logger.log(`Updating brand: ${id}`);
    return this.brandService.update(id, updateBrandDto);
  }

  @Delete('brands/:id')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Delete brand (Owner only)' })
  async deleteBrand(@Param('id') id: string) {
    this.logger.log(`Deleting brand: ${id}`);
    return this.brandService.remove(id);
  }

  // Inventory Analytics
  @Get('analytics/overview')
  @ApiOperation({ summary: 'Get inventory overview analytics' })
  async getInventoryOverview() {
    return this.inventoryService.getOverview();
  }

  @Get('analytics/low-stock')
  @ApiOperation({ summary: 'Get low stock products' })
  async getLowStockProducts() {
    return this.inventoryService.getLowStockProducts();
  }

  @Get('analytics/stock-movements')
  @ApiOperation({ summary: 'Get recent stock movements' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  async getStockMovements(@Query('days') days: number = 30) {
    return this.inventoryService.getStockMovements(days);
  }
}
