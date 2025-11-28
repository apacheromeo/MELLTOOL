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

export interface ImportResult {
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
        // Check if this is a stock adjustment import (has "New Stock" column)
        const hasNewStockColumn = row['New Stock'] !== undefined || row['new stock'] !== undefined;

        // Validate required fields
        // For stock-only updates with updateExisting, we only need SKU
        // For creating new products or full updates, we need SKU and Name
        if (!row.sku) {
          result.errors.push({
            row: rowNumber,
            sku: row.sku,
            name: row.name,
            error: 'SKU is required',
          });
          result.failed++;
          continue;
        }

        // Check if product exists (for validation purposes)
        const existingProductCheck = await this.prisma.product.findUnique({
          where: { sku: String(row.sku).trim() },
        });

        // If updating existing product with stock-only mode, name is optional
        // Otherwise, name is required for new products or full updates
        if (!existingProductCheck && !row.name) {
          result.errors.push({
            row: rowNumber,
            sku: row.sku,
            name: row.name,
            error: 'Name is required for new products',
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

        // Category is required only for new products
        // For existing products, preserve the existing category if not provided
        if (!categoryId && !existingProductCheck) {
          result.errors.push({
            row: rowNumber,
            sku: row.sku,
            name: row.name,
            error: `Category not found: ${row.category || 'N/A'}. Category is required for new products.`,
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

        // Brand is required only for new products
        // For existing products, preserve the existing brand if not provided
        if (!brandId && !existingProductCheck) {
          result.errors.push({
            row: rowNumber,
            sku: row.sku,
            name: row.name,
            error: `Brand not found: ${row.brand || 'N/A'}. Brand is required for new products.`,
          });
          result.failed++;
          continue;
        }

        // Convert data types
        const productData = {
          sku: String(row.sku).trim(),
          name: row.name ? String(row.name).trim() : existingProductCheck?.name,
          nameTh: row.nameTh ? String(row.nameTh).trim() : undefined,
          description: row.description ? String(row.description).trim() : undefined,
          descriptionTh: row.descriptionTh
            ? String(row.descriptionTh).trim()
            : undefined,
          weight: row.weight ? parseFloat(String(row.weight)) : undefined,
          dimensions: row.dimensions ? String(row.dimensions).trim() : undefined,
          color: row.color ? String(row.color).trim() : undefined,
          costPrice: row.costPrice !== undefined ? parseFloat(String(row.costPrice)) : (existingProductCheck?.costPrice || 0),
          sellPrice: row.sellPrice
            ? parseFloat(String(row.sellPrice))
            : undefined,
          stockQty: row.stockQty ? parseInt(String(row.stockQty)) : 0,
          minStock: row.minStock !== undefined ? parseInt(String(row.minStock)) : 0,
          maxStock: row.maxStock ? parseInt(String(row.maxStock)) : undefined,
          barcode: row.barcode ? String(row.barcode).trim() : undefined,
          categoryId: categoryId || existingProductCheck?.categoryId,
          brandId: brandId || existingProductCheck?.brandId,
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
            // Check if this is a stock adjustment import (has "New Stock" column)
            const hasNewStockColumn = row['New Stock'] !== undefined || row['new stock'] !== undefined;
            let newStockQty: number;

            if (hasNewStockColumn) {
              // Stock adjustment mode: Use "New Stock" value directly (replace, don't add)
              const newStockValue = row['New Stock'] || row['new stock'];
              newStockQty = parseInt(String(newStockValue)) || 0;
              this.logger.log(`Stock adjustment for ${productData.sku}: ${existingProduct.stockQty} → ${newStockQty}`);
            } else {
              // Normal import mode: ADD to existing stock
              newStockQty = existingProduct.stockQty + productData.stockQty;
              this.logger.log(`Stock addition for ${productData.sku}: ${existingProduct.stockQty} + ${productData.stockQty} = ${newStockQty}`);
            }

            // Note: imageUrl and barcode are intentionally NOT updated here
            // to preserve manually uploaded images and generated barcodes
            // Build update data object - only include fields that are provided
            const updateData: any = {
              stockQty: newStockQty,
            };

            // Only update fields if they are provided in the import
            if (row.name) updateData.name = productData.name;
            if (row.nameTh !== undefined) updateData.nameTh = productData.nameTh;
            if (row.description !== undefined) updateData.description = productData.description;
            if (row.descriptionTh !== undefined) updateData.descriptionTh = productData.descriptionTh;
            if (row.weight !== undefined) updateData.weight = productData.weight;
            if (row.dimensions !== undefined) updateData.dimensions = productData.dimensions;
            if (row.color !== undefined) updateData.color = productData.color;
            if (row.costPrice !== undefined) updateData.costPrice = productData.costPrice;
            if (row.sellPrice !== undefined) updateData.sellPrice = productData.sellPrice;
            if (row.minStock !== undefined) updateData.minStock = productData.minStock;
            if (row.maxStock !== undefined) updateData.maxStock = productData.maxStock;
            if (productData.categoryId) updateData.categoryId = productData.categoryId;
            if (productData.brandId) updateData.brandId = productData.brandId;
            // imageUrl: preserved (not updated)
            // barcode: preserved (not updated)

            const updated = await this.prisma.product.update({
              where: { id: existingProduct.id },
              data: updateData,
              include: {
                brand: { select: { name: true } },
                category: { select: { name: true } },
              },
            });
            result.products.push(updated);
            result.success++;
            this.logger.log(`Updated product: ${updated.sku} - ${updated.name} (final stock: ${newStockQty})`);
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
        transformHeader: (header) => {
          // Normalize header names (case-insensitive, handle common variations)
          // Trim headers manually since trimHeaders option doesn't exist in types
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
      }) as Papa.ParseResult<ImportRow>;

      if (result.errors && result.errors.length > 0) {
        this.logger.warn(`CSV parsing warnings: ${JSON.stringify(result.errors)}`);
      }

      return result.data || [];
    } catch (error) {
      throw new BadRequestException(`Failed to parse CSV file: ${error.message}`);
    }
  }

  /**
   * Export current stock data for bulk adjustment
   */
  async exportStockData(): Promise<Buffer> {
    try {
      this.logger.log('Exporting current stock data');

      // Get all active products with current stock levels
      const products = await this.prisma.product.findMany({
        where: { isActive: true },
        include: {
          category: { select: { name: true } },
          brand: { select: { name: true } },
        },
        orderBy: { sku: 'asc' },
      });

      // Prepare data for export
      const exportData = products.map((product) => ({
        SKU: product.sku,
        'Product Name': product.name,
        'Product Name (Thai)': product.nameTh || '',
        Category: product.category?.name || '',
        Brand: product.brand?.name || '',
        'Current Stock': product.stockQty,
        'New Stock': product.stockQty, // User will update this column
        'Stock Adjustment': 0, // Will be calculated: New Stock - Current Stock
        'Min Stock': product.minStock || 0,
        'Cost Price': product.costPrice,
        'Sell Price': product.sellPrice || 0,
        Barcode: product.barcode || '',
      }));

      // Create workbook
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      worksheet['!cols'] = [
        { wch: 15 }, // SKU
        { wch: 30 }, // Product Name
        { wch: 30 }, // Product Name (Thai)
        { wch: 20 }, // Category
        { wch: 20 }, // Brand
        { wch: 15 }, // Current Stock
        { wch: 15 }, // New Stock
        { wch: 15 }, // Stock Adjustment
        { wch: 12 }, // Min Stock
        { wch: 12 }, // Cost Price
        { wch: 12 }, // Sell Price
        { wch: 20 }, // Barcode
      ];

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock Data');

      // Add instructions sheet
      const instructions = [
        ['BULK STOCK ADJUSTMENT INSTRUCTIONS'],
        [''],
        ['How to use this file:'],
        ['1. The "Current Stock" column shows your current inventory levels'],
        ['2. Update the "New Stock" column with the desired stock quantities'],
        ['3. The "Stock Adjustment" will be calculated automatically on import (New Stock - Current Stock)'],
        ['4. You can also update Cost Price and Sell Price if needed'],
        ['5. Do NOT modify the SKU column - this is used to identify products'],
        ['6. Save the file and import it back through the Inventory page'],
        [''],
        ['Important Notes:'],
        ['- Only modify the columns you want to update'],
        ['- Product images will NOT be affected by this import'],
        ['- Barcodes will NOT be affected by this import'],
        ['- Invalid SKUs will be skipped during import'],
      ];

      const instructionsSheet = XLSX.utils.aoa_to_sheet(instructions);
      instructionsSheet['!cols'] = [{ wch: 80 }];
      XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');

      // Generate buffer
      const buffer = XLSX.write(workbook, {
        type: 'buffer',
        bookType: 'xlsx',
      });

      this.logger.log(`Stock data exported: ${products.length} products`);
      return buffer;
    } catch (error) {
      this.logger.error('Error generating stock export:', error);
      throw new BadRequestException(`Failed to export stock data: ${error.message}`);
    }
  }

  /**
   * Generate import template (Excel file)
   */
  async generateTemplate(): Promise<Buffer> {
    try {
      this.logger.log('Starting template generation');

      // Get active categories and brands for reference
      const categories = await this.prisma.category.findMany({
        where: { isActive: true },
        select: { name: true },
        take: 5,
      });

      const brands = await this.prisma.brand.findMany({
        where: { isActive: true },
        select: { name: true },
        take: 5,
      });

      const categoryExample = categories[0]?.name || 'Electronics';
      const brandExample = brands[0]?.name || 'Brand Name';

      // Template data with example rows
      const templateData = [
        {
          sku: 'PROD-001',
          name: 'Sample Product 1',
          nameTh: 'ตัวอย่างสินค้า 1',
          description: 'Product description',
          descriptionTh: 'คำอธิบายสินค้า',
          weight: 500,
          dimensions: '10x10x5',
          color: 'Red',
          costPrice: 1000,
          sellPrice: 1500,
          stockQty: 50,
          minStock: 10,
          maxStock: 200,
          barcode: '',
          category: categoryExample,
          brand: brandExample,
          isDigital: 'false',
        },
        {
          sku: 'PROD-002',
          name: 'Sample Product 2',
          nameTh: 'ตัวอย่างสินค้า 2',
          description: 'Another product',
          descriptionTh: 'สินค้าอีกชิ้น',
          weight: 300,
          dimensions: '5x5x3',
          color: 'Blue',
          costPrice: 500,
          sellPrice: 800,
          stockQty: 100,
          minStock: 20,
          maxStock: 500,
          barcode: '',
          category: categoryExample,
          brand: brandExample,
          isDigital: 'false',
        },
      ];

      this.logger.log('Creating Excel workbook with template data');

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(templateData);

      // Set column widths for better readability
      worksheet['!cols'] = [
        { wch: 15 }, // sku
        { wch: 25 }, // name
        { wch: 25 }, // nameTh
        { wch: 35 }, // description
        { wch: 35 }, // descriptionTh
        { wch: 10 }, // weight
        { wch: 15 }, // dimensions
        { wch: 12 }, // color
        { wch: 12 }, // costPrice
        { wch: 12 }, // sellPrice
        { wch: 10 }, // stockQty
        { wch: 10 }, // minStock
        { wch: 10 }, // maxStock
        { wch: 18 }, // barcode
        { wch: 20 }, // category
        { wch: 20 }, // brand
        { wch: 10 }, // isDigital
      ];

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');

      // Add instructions sheet
      const instructions = [
        { Column: 'sku', Description: 'Product SKU (Required, must be unique)', Example: 'PROD-001' },
        { Column: 'name', Description: 'Product name in English (Required)', Example: 'Sample Product' },
        { Column: 'nameTh', Description: 'Product name in Thai (Optional)', Example: 'ตัวอย่างสินค้า' },
        { Column: 'description', Description: 'Product description (Optional)', Example: 'Detailed description' },
        { Column: 'descriptionTh', Description: 'Thai description (Optional)', Example: 'คำอธิบายภาษาไทย' },
        { Column: 'weight', Description: 'Product weight in grams (Optional)', Example: '500' },
        { Column: 'dimensions', Description: 'Dimensions LxWxH in cm (Optional)', Example: '10x10x5' },
        { Column: 'color', Description: 'Product color (Optional)', Example: 'Red' },
        { Column: 'costPrice', Description: 'Cost price (Required)', Example: '1000' },
        { Column: 'sellPrice', Description: 'Selling price (Optional)', Example: '1500' },
        { Column: 'stockQty', Description: 'Stock quantity (Optional, defaults to 0)', Example: '50' },
        { Column: 'minStock', Description: 'Minimum stock level (Optional)', Example: '10' },
        { Column: 'maxStock', Description: 'Maximum stock level (Optional)', Example: '200' },
        { Column: 'barcode', Description: 'Product barcode (Optional, auto-generated if empty)', Example: '1234567890123' },
        { Column: 'category', Description: `Category name (Required). Available: ${categories.map(c => c.name).join(', ')}`, Example: categoryExample },
        { Column: 'brand', Description: `Brand name (Required). Available: ${brands.map(b => b.name).join(', ')}`, Example: brandExample },
        { Column: 'isDigital', Description: 'Is this a digital product? (true/false)', Example: 'false' },
      ];

      const instructionsSheet = XLSX.utils.json_to_sheet(instructions);
      instructionsSheet['!cols'] = [
        { wch: 15 },
        { wch: 60 },
        { wch: 25 },
      ];
      XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');

      this.logger.log('Writing workbook to buffer');

      // Write to buffer with error handling
      let buffer: any;
      try {
        buffer = XLSX.write(workbook, {
          type: 'buffer',
          bookType: 'xlsx',
        });
      } catch (writeError) {
        this.logger.error(`XLSX write error: ${writeError.message}`);
        throw new Error(`Failed to write Excel file: ${writeError.message}`);
      }

      // Convert to proper Buffer
      let resultBuffer: Buffer;
      if (!buffer) {
        throw new Error('XLSX.write returned null or undefined');
      } else if (Buffer.isBuffer(buffer)) {
        resultBuffer = buffer;
      } else if (buffer instanceof Uint8Array) {
        resultBuffer = Buffer.from(buffer);
      } else if (ArrayBuffer.isView(buffer)) {
        resultBuffer = Buffer.from(buffer.buffer, buffer.byteOffset, buffer.byteLength);
      } else {
        // Last resort: try to convert whatever we got
        try {
          resultBuffer = Buffer.from(buffer);
        } catch (conversionError) {
          this.logger.error(`Buffer conversion error: ${conversionError.message}`);
          throw new Error('Failed to convert Excel data to buffer');
        }
      }

      if (!resultBuffer || resultBuffer.length === 0) {
        throw new Error('Generated template buffer is empty');
      }

      this.logger.log(`✅ Template generated successfully! Size: ${resultBuffer.length} bytes (${(resultBuffer.length / 1024).toFixed(2)} KB)`);
      return resultBuffer;
    } catch (error) {
      this.logger.error(`❌ Template generation failed: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to generate template: ${error.message}`);
    }
  }
}
