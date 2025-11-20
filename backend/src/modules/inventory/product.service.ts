import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { BarcodeService } from './barcode.service';
import * as fs from 'fs';
import * as path from 'path';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { SearchProductsDto } from './dto/search-products.dto';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly barcodeService: BarcodeService,
  ) {}

  async create(createProductDto: CreateProductDto) {
    const {
      sku,
      name,
      nameTh,
      description,
      descriptionTh,
      weight,
      dimensions,
      color,
      costPrice,
      sellPrice,
      stockQty,
      minStock,
      maxStock,
      categoryId,
      brandId,
      isDigital = false,
    } = createProductDto;

    try {
      // Check if SKU already exists
      const existingProduct = await this.prisma.product.findUnique({
        where: { sku },
      });

      if (existingProduct) {
        throw new ConflictException('Product with this SKU already exists');
      }

      // Generate barcode if not provided
      let barcode = createProductDto.barcode;
      if (!barcode) {
        barcode = await this.barcodeService.generateBarcodeValue();
      }

      // Check if barcode already exists
      if (barcode) {
        const existingBarcode = await this.prisma.product.findUnique({
          where: { barcode },
        });

        if (existingBarcode) {
          barcode = await this.barcodeService.generateBarcodeValue();
        }
      }

      const product = await this.prisma.product.create({
        data: {
          sku,
          name,
          nameTh,
          description,
          descriptionTh,
          weight,
          dimensions,
          color,
          costPrice,
          sellPrice,
          stockQty: stockQty || 0,
          minStock: minStock || 0,
          maxStock,
          barcode,
          categoryId,
          brandId,
          isDigital,
        },
        include: {
          brand: { select: { name: true } },
          category: { select: { name: true } },
        },
      });

      this.logger.log(`Product created: ${product.sku} - ${product.name}`);

      return product;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Error creating product: ${error.message}`, error);
      throw new BadRequestException('Failed to create product');
    }
  }

  async findAll(searchDto: SearchProductsDto) {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      brand,
      lowStock,
      sortBy = 'name',
      sortOrder = 'asc',
    } = searchDto;

    const skip = (page - 1) * limit;

    const where: any = {
      isActive: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nameTh: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.categoryId = category;
    }

    if (brand) {
      where.brandId = brand;
    }

    // Note: Prisma doesn't support field-to-field comparison in where clause
    // For low stock, we need to use raw SQL or filter after fetch
    let products: any[];
    let total: number;

    if (lowStock) {
      // Use raw SQL for field comparison
      const allProducts = await this.prisma.product.findMany({
        where: {
          ...where,
          isActive: true,
        },
        include: {
          brand: { select: { name: true } },
          category: { select: { name: true } },
        },
        orderBy: { [sortBy]: sortOrder },
      });

      // Filter in memory for field comparison
      const filteredProducts = allProducts.filter(p => p.stockQty <= p.minStock);
      total = filteredProducts.length;
      products = filteredProducts.slice(skip, skip + limit);
    } else {
      [products, total] = await Promise.all([
        this.prisma.product.findMany({
          where,
          include: {
            brand: { select: { name: true } },
            category: { select: { name: true } },
          },
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit,
        }),
        this.prisma.product.count({ where }),
      ]);
    }

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        brand: { select: { name: true } },
        category: { select: { name: true } },
        stockIns: {
          include: {
            stockIn: {
              select: {
                reference: true,
                createdAt: true,
                user: { select: { name: true } },
              },
            },
          },
          orderBy: { stockIn: { createdAt: 'desc' } },
          take: 5,
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    try {
      const updatedProduct = await this.prisma.product.update({
        where: { id },
        data: updateProductDto,
        include: {
          brand: { select: { name: true } },
          category: { select: { name: true } },
        },
      });

      this.logger.log(`Product updated: ${updatedProduct.sku} - ${updatedProduct.name}`);

      return updatedProduct;
    } catch (error) {
      this.logger.error(`Error updating product ${id}: ${error.message}`, error);

      // Check for specific Prisma errors
      if (error.code === 'P2003') {
        throw new BadRequestException('Invalid category or brand ID provided');
      }
      if (error.code === 'P2002') {
        throw new ConflictException('Product with this SKU or barcode already exists');
      }

      // Return more detailed error message
      throw new BadRequestException(error.message || 'Failed to update product');
    }
  }

  async remove(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    try {
      // Check if product has any related records
      const [stockInCount, shopeeItemCount, printJobCount, salesItemCount] = await Promise.all([
        this.prisma.stockInItem.count({ where: { productId: id } }),
        this.prisma.shopeeItem.count({ where: { productId: id } }),
        this.prisma.printJobProduct.count({ where: { productId: id } }),
        this.prisma.salesItem.count({ where: { productId: id } }),
      ]);

      const hasRelations = stockInCount > 0 || shopeeItemCount > 0 || printJobCount > 0 || salesItemCount > 0;

      if (hasRelations) {
        // Soft delete - mark as inactive if product has any relations
        const updatedProduct = await this.prisma.product.update({
          where: { id },
          data: { isActive: false },
        });

        this.logger.log(`Product soft deleted (has relations): ${updatedProduct.sku} - ${updatedProduct.name}`);

        return { message: 'Product deactivated successfully (has transaction history)' };
      } else {
        // Hard delete if no relations
        await this.prisma.product.delete({
          where: { id },
        });

        this.logger.log(`Product hard deleted: ${product.sku} - ${product.name}`);

        return { message: 'Product deleted successfully' };
      }
    } catch (error) {
      this.logger.error(`Error deleting product ${id}: ${error.message}`, error);
      throw new BadRequestException('Failed to delete product');
    }
  }

  async updateStock(productId: string, quantity: number, operation: 'add' | 'subtract' = 'add') {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const newStock = operation === 'add' 
      ? product.stockQty + quantity 
      : product.stockQty - quantity;

    if (newStock < 0) {
      throw new BadRequestException('Insufficient stock');
    }

    const updatedProduct = await this.prisma.product.update({
      where: { id: productId },
      data: { stockQty: newStock },
    });

    this.logger.log(`Stock updated for product ${product.sku}: ${product.stockQty} -> ${newStock}`);

    return updatedProduct;
  }

  async getByBarcode(barcode: string) {
    const product = await this.prisma.product.findUnique({
      where: { barcode },
      include: {
        brand: { select: { name: true } },
        category: { select: { name: true } },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async getBySku(sku: string) {
    const product = await this.prisma.product.findUnique({
      where: { sku },
      include: {
        brand: { select: { name: true } },
        category: { select: { name: true } },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async uploadImage(productId: string, file: Express.Multer.File) {
    // Verify product exists
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Validate file type (images only)
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Only image files are allowed (JPEG, PNG, GIF, WebP)');
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'uploads', 'products');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const fileExtension = path.extname(file.originalname);
    const fileName = `${productId}-${Date.now()}${fileExtension}`;
    const filePath = path.join(uploadsDir, fileName);

    // Save file to disk
    fs.writeFileSync(filePath, file.buffer);

    // Generate URL (relative path)
    const imageUrl = `/uploads/products/${fileName}`;

    // Update product with image URL
    const updatedProduct = await this.prisma.product.update({
      where: { id: productId },
      data: { imageUrl },
      include: {
        brand: { select: { name: true } },
        category: { select: { name: true } },
      },
    });

    this.logger.log(`Image uploaded for product: ${product.sku} - ${fileName}`);

    return {
      message: 'Image uploaded successfully',
      product: updatedProduct,
      imageUrl,
    };
  }
}
