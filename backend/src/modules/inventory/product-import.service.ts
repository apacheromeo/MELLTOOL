import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { BarcodeService } from './barcode.service';
import * as XLSX from 'xlsx';
import * as Papa from 'papaparse';

interface ImportRow {
  sku?: string;
  name?: string;
  nameTh?: string;
  description?: string;
  descriptionTh?: string;
  weight?: number | string;
  dimensions?: string;
  color?: string;
  costPrice?: number | string;
  sellPrice?: number | string;
  stockQty?: number | string;
  minStock?: number | string;
  maxStock?: number | string;
  barcode?: string;
  category?: string; // Category name (will be resolved to ID)
  brand?: string; // Brand name (will be resolved to ID)
  isDigital?: boolean | string;
  [key: string]: any;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{
    row: number;
    sku?: string;
    name?: string;
    error: string;
  }>;
  skipped: number;
  products: any[];
}

@Injectable()
export class ProductImportService {
  private readonly logger = new Logger(ProductImportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly barcodeService: BarcodeService,
  ) {}

  /**
   * Import products from Excel or CSV file
   */
  async importFromFile(
    file: Express.Multer.File,
    options?: { updateExisting?: boolean; skipErrors?: boolean },
  ): Promise<ImportResult> {
    const { updateExisting = false, skipErrors = true } = options || {};

    let rows: ImportRow[];

    try {
      // Parse file based on extension
      if (file.originalname.endsWith('.csv')) {
        rows = this.parseCSV(file.buffer);
      } else if (
        file.originalname.endsWith('.xlsx') ||
        file.originalname.endsWith('.xls')
      ) {
        rows = this.parseExcel(file.buffer);
      } else {
        throw new BadRequestException(
          'Unsupported file format. Please upload .xlsx, .xls, or .csv file',
        );
      }
    } catch (error) {
      this.logger.error('File parsing error:', error);
      throw new BadRequestException(
        `Failed to parse file: ${error.message}`,
      );
    }

    if (!rows || rows.length === 0) {
      throw new BadRequestException('File is empty or contains no data');
    }

    this.logger.log(`Importing ${rows.length} products from file`);

    // Process each row
    const result: ImportResult = {
      success: 0,
      failed: 0,
      errors: [],
      skipped: 0,
      products: [],
    };

    // Get all categories and brands for name resolution
    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
    });
    const brands = await this.prisma.brand.findMany({
      where: { isActive: true },
    });

    const categoryMap = new Map(
      categories.map((cat) => [cat.name.toLowerCase(), cat.id]),
    );
    const brandMap = new Map(
      brands.map((brand) => [brand.name.toLowerCase(), brand.id]),
    );

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // +2 because Excel rows start at 1 and we have header

      try {
        // Validate required fields
        if (!row.sku || !row.name) {
          result.errors.push({
            row: rowNumber,
            sku: row.sku,
            name: row.name,
            error: 'SKU and Name are required',
          });
          result.failed++;
          continue;
        }

        // Resolve category
        let categoryId = row.categoryId;
        if (!categoryId && row.category) {
          const categoryName = String(row.category).toLowerCase().trim();
          categoryId = categoryMap.get(categoryName);
          if (!categoryId) {
            // Try to find by partial match
            const matched = categories.find(
              (cat) => cat.name.toLowerCase().includes(categoryName),
            );
            categoryId = matched?.id;
          }
        }

        if (!categoryId) {
          result.errors.push({
            row: rowNumber,
            sku: row.sku,
            name: row.name,
            error: `Category not found: ${row.category || 'N/A'}`,
          });
          result.failed++;
          continue;
        }

        // Resolve brand
        let brandId = row.brandId;
        if (!brandId && row.brand) {
          const brandName = String(row.brand).toLowerCase().trim();
          brandId = brandMap.get(brandName);
          if (!brandId) {
            // Try to find by partial match
            const matched = brands.find(
              (brand) => brand.name.toLowerCase().includes(brandName),
            );
            brandId = matched?.id;
          }
        }

        if (!brandId) {
          result.errors.push({
            row: rowNumber,
            sku: row.sku,
            name: row.name,
            error: `Brand not found: ${row.brand || 'N/A'}`,
          });
          result.failed++;
          continue;
        }

        // Convert data types
        const productData = {
          sku: String(row.sku).trim(),
          name: String(row.name).trim(),
          nameTh: row.nameTh ? String(row.nameTh).trim() : undefined,
          description: row.description ? String(row.description).trim() : undefined,
          descriptionTh: row.descriptionTh
            ? String(row.descriptionTh).trim()
            : undefined,
          weight: row.weight ? parseFloat(String(row.weight)) : undefined,
          dimensions: row.dimensions ? String(row.dimensions).trim() : undefined,
          color: row.color ? String(row.color).trim() : undefined,
          costPrice: parseFloat(String(row.costPrice || 0)),
          sellPrice: row.sellPrice
            ? parseFloat(String(row.sellPrice))
            : undefined,
          stockQty: row.stockQty ? parseInt(String(row.stockQty)) : 0,
          minStock: row.minStock ? parseInt(String(row.minStock)) : 0,
          maxStock: row.maxStock ? parseInt(String(row.maxStock)) : undefined,
          barcode: row.barcode ? String(row.barcode).trim() : undefined,
          categoryId,
          brandId,
          isDigital:
            row.isDigital === true ||
            row.isDigital === 'true' ||
            row.isDigital === 'TRUE' ||
            String(row.isDigital).toLowerCase() === 'yes',
        };

        // Check if product exists
        const existingProduct = await this.prisma.product.findUnique({
          where: { sku: productData.sku },
        });

        if (existingProduct) {
          if (updateExisting) {
            // Update existing product
            const updated = await this.prisma.product.update({
              where: { id: existingProduct.id },
              data: {
                name: productData.name,
                nameTh: productData.nameTh,
                description: productData.description,
                descriptionTh: productData.descriptionTh,
                weight: productData.weight,
                dimensions: productData.dimensions,
                color: productData.color,
                costPrice: productData.costPrice,
                sellPrice: productData.sellPrice,
                stockQty: productData.stockQty,
                minStock: productData.minStock,
                maxStock: productData.maxStock,
                categoryId: productData.categoryId,
                brandId: productData.brandId,
              },
              include: {
                brand: { select: { name: true } },
                category: { select: { name: true } },
              },
            });
            result.products.push(updated);
            result.success++;
            this.logger.log(`Updated product: ${updated.sku} - ${updated.name}`);
          } else {
            result.skipped++;
            result.errors.push({
              row: rowNumber,
              sku: productData.sku,
              name: productData.name,
              error: 'Product with this SKU already exists (use updateExisting option to update)',
            });
          }
          continue;
        }

        // Generate barcode if not provided
        let barcode = productData.barcode;
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

        // Create new product
        const product = await this.prisma.product.create({
          data: {
            ...productData,
            barcode,
          },
          include: {
            brand: { select: { name: true } },
            category: { select: { name: true } },
          },
        });

        result.products.push(product);
        result.success++;
        this.logger.log(`Created product: ${product.sku} - ${product.name}`);
      } catch (error) {
        result.failed++;
        result.errors.push({
          row: rowNumber,
          sku: row.sku,
          name: row.name,
          error: error.message || 'Unknown error',
        });

        if (!skipErrors) {
          throw error;
        }

        this.logger.error(
          `Error importing row ${rowNumber}: ${error.message}`,
        );
      }
    }

    this.logger.log(
      `Import completed: ${result.success} succeeded, ${result.failed} failed, ${result.skipped} skipped`,
    );

    return result;
  }

  /**
   * Parse Excel file
   */
  private parseExcel(buffer: Buffer): ImportRow[] {
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Convert to JSON with header row
      const data = XLSX.utils.sheet_to_json(worksheet, {
        raw: false, // Convert all values to strings
        defval: '', // Default value for empty cells
      });

      return data as ImportRow[];
    } catch (error) {
      throw new BadRequestException(`Failed to parse Excel file: ${error.message}`);
    }
  }

  /**
   * Parse CSV file
   */
  private parseCSV(buffer: Buffer): ImportRow[] {
    try {
      const csvString = buffer.toString('utf-8');
      const result = Papa.parse<ImportRow>(csvString, {
        header: true,
        skipEmptyLines: true,
        trimHeaders: true,
        transformHeader: (header) => {
          // Normalize header names (case-insensitive, handle common variations)
          const normalized = header.toLowerCase().trim();
          const mappings: Record<string, string> = {
            'product sku': 'sku',
            'product name': 'name',
            'name (thai)': 'nameTh',
            'thai name': 'nameTh',
            'description (thai)': 'descriptionTh',
            'cost': 'costPrice',
            'cost price': 'costPrice',
            'price': 'sellPrice',
            'sell price': 'sellPrice',
            'selling price': 'sellPrice',
            'stock': 'stockQty',
            'quantity': 'stockQty',
            'stock qty': 'stockQty',
            'min stock': 'minStock',
            'minimum stock': 'minStock',
            'max stock': 'maxStock',
            'maximum stock': 'maxStock',
            'category name': 'category',
            'brand name': 'brand',
          };

          return mappings[normalized] || normalized;
        },
      });

      if (result.errors.length > 0) {
        this.logger.warn(`CSV parsing warnings: ${JSON.stringify(result.errors)}`);
      }

      return result.data;
    } catch (error) {
      throw new BadRequestException(`Failed to parse CSV file: ${error.message}`);
    }
  }

  /**
   * Generate import template (Excel file)
   */
  async generateTemplate(): Promise<Buffer> {
    try {
      const templateData = [
        {
          sku: 'PROD-001',
          name: 'Sample Product',
          nameTh: 'ตัวอย่างสินค้า',
          description: 'Product description',
          descriptionTh: 'คำอธิบายสินค้า',
          weight: '500',
          dimensions: '10x10x5',
          color: 'Red',
          costPrice: '1000',
          sellPrice: '1500',
          stockQty: '50',
          minStock: '10',
          maxStock: '200',
          barcode: '',
          category: 'Electronics',
          brand: 'Brand Name',
          isDigital: 'false',
        },
      ];

      this.logger.log('Creating Excel workbook');
      
      // Create workbook
      const workbook = XLSX.utils.book_new();
      
      // Create worksheet from JSON data
      const worksheet = XLSX.utils.json_to_sheet(templateData);
      
      // Set column widths for better readability
      worksheet['!cols'] = [
        { wch: 15 }, // sku
        { wch: 25 }, // name
        { wch: 25 }, // nameTh
        { wch: 30 }, // description
        { wch: 30 }, // descriptionTh
        { wch: 10 }, // weight
        { wch: 15 }, // dimensions
        { wch: 15 }, // color
        { wch: 12 }, // costPrice
        { wch: 12 }, // sellPrice
        { wch: 10 }, // stockQty
        { wch: 10 }, // minStock
        { wch: 10 }, // maxStock
        { wch: 15 }, // barcode
        { wch: 20 }, // category
        { wch: 20 }, // brand
        { wch: 10 }, // isDigital
      ];
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');

      this.logger.log('Writing Excel file to buffer');
      
      // Write workbook to buffer
      const buffer = XLSX.write(workbook, { 
        type: 'buffer', 
        bookType: 'xlsx',
        compression: true,
      });

      // Ensure we have a proper Buffer
      let resultBuffer: Buffer;
      if (Buffer.isBuffer(buffer)) {
        resultBuffer = buffer;
      } else if (buffer instanceof Uint8Array) {
        resultBuffer = Buffer.from(buffer);
      } else {
        resultBuffer = Buffer.from(buffer as any);
      }

      if (!resultBuffer || resultBuffer.length === 0) {
        throw new Error('Generated template buffer is empty');
      }

      this.logger.log(`Template generated successfully, size: ${resultBuffer.length} bytes`);
      return resultBuffer;
    } catch (error) {
      this.logger.error(`Error in generateTemplate: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to generate template: ${error.message}`);
    }
  }
}
