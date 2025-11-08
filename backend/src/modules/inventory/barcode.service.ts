import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/common/prisma/prisma.service';
import * as JsBarcode from 'jsbarcode';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class BarcodeService {
  private readonly logger = new Logger(BarcodeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async generateBarcodeValue(): Promise<string> {
    const prefix = this.configService.get('barcode.prefix', 'VAC');
    const length = this.configService.get('barcode.length', 8);
    
    // Generate a unique barcode
    let barcode: string;
    let exists = true;
    
    while (exists) {
      const randomPart = Math.random().toString(36).substring(2, 2 + length - prefix.length).toUpperCase();
      barcode = `${prefix}${randomPart}`;
      
      const existing = await this.prisma.product.findUnique({
        where: { barcode },
      });
      
      exists = !!existing;
    }
    
    this.logger.log(`Generated barcode: ${barcode}`);
    return barcode;
  }

  async generateBarcode(productId: string, options: any = {}) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    // Generate barcode if not exists
    let barcode = product.barcode;
    if (!barcode) {
      barcode = await this.generateBarcodeValue();
      
      await this.prisma.product.update({
        where: { id: productId },
        data: { barcode },
      });
    }

    // Generate barcode image
    const barcodeImage = this.createBarcodeImage(barcode, options);
    
    return {
      barcode,
      image: barcodeImage,
      product: {
        id: product.id,
        sku: product.sku,
        name: product.name,
        nameTh: product.nameTh,
      },
    };
  }

  private createBarcodeImage(barcode: string, options: any = {}) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const config = {
      format: 'CODE128',
      width: options.width || 2,
      height: options.height || 100,
      displayValue: options.displayValue !== false,
      fontSize: options.fontSize || 14,
      textAlign: 'center',
      textPosition: 'bottom',
      textMargin: options.textMargin || 2,
      background: options.background || '#ffffff',
      lineColor: options.lineColor || '#000000',
    };

    try {
      JsBarcode(canvas, barcode, config);
      return canvas.toDataURL('image/png');
    } catch (error) {
      this.logger.error(`Error generating barcode image: ${error.message}`);
      throw new Error('Failed to generate barcode image');
    }
  }

  async generateBarcodePDF(productIds: string[], options: any = {}) {
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        brand: { select: { name: true } },
        category: { select: { name: true } },
      },
    });

    if (products.length === 0) {
      throw new Error('No products found');
    }

    // Generate PDF
    const doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: 20,
        bottom: 20,
        left: 20,
        right: 20,
      },
    });

    const filename = `barcodes_${Date.now()}.pdf`;
    const filepath = path.join(this.configService.get('upload.path', './uploads'), filename);
    
    // Ensure directory exists
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    doc.pipe(fs.createWriteStream(filepath));

    // Add barcodes to PDF
    const barcodesPerRow = options.barcodesPerRow || 3;
    const barcodeWidth = (doc.page.width - 40) / barcodesPerRow;
    const barcodeHeight = 80;
    let currentX = 20;
    let currentY = 20;
    let itemsInRow = 0;

    for (const product of products) {
      if (itemsInRow >= barcodesPerRow) {
        currentX = 20;
        currentY += barcodeHeight + 20;
        itemsInRow = 0;
        
        // Check if we need a new page
        if (currentY + barcodeHeight > doc.page.height - 20) {
          doc.addPage();
          currentY = 20;
        }
      }

      // Add product info
      doc.fontSize(10)
         .text(product.name, currentX, currentY)
         .text(`SKU: ${product.sku}`, currentX, currentY + 12)
         .text(`Brand: ${product.brand.name}`, currentX, currentY + 24);

      // Add barcode
      if (product.barcode) {
        try {
          const barcodeImage = this.createBarcodeImage(product.barcode, {
            width: 1,
            height: 40,
            fontSize: 8,
          });

          // For PDF, we need to convert the canvas to a buffer
          // This is a simplified version - in production, you'd use a proper image library
          doc.text(`Barcode: ${product.barcode}`, currentX, currentY + 50);
        } catch (error) {
          this.logger.error(`Error adding barcode for product ${product.sku}: ${error.message}`);
          doc.text(`Barcode: ${product.barcode}`, currentX, currentY + 50);
        }
      }

      currentX += barcodeWidth;
      itemsInRow++;
    }

    doc.end();

    this.logger.log(`Barcode PDF generated: ${filename}`);

    return {
      filename,
      filepath,
      products: products.map(p => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        barcode: p.barcode,
      })),
    };
  }

  async validateBarcode(barcode: string): Promise<boolean> {
    // Check if barcode format is valid
    const prefix = this.configService.get('barcode.prefix', 'VAC');
    const length = this.configService.get('barcode.length', 8);
    
    if (!barcode.startsWith(prefix)) {
      return false;
    }
    
    if (barcode.length !== length) {
      return false;
    }
    
    // Check if barcode already exists
    const existing = await this.prisma.product.findUnique({
      where: { barcode },
    });
    
    return !existing;
  }

  async getBarcodeStats() {
    const [totalProducts, productsWithBarcode, productsWithoutBarcode] = await Promise.all([
      this.prisma.product.count({ where: { isActive: true } }),
      this.prisma.product.count({ 
        where: { 
          isActive: true,
          barcode: { not: null },
        },
      }),
      this.prisma.product.count({ 
        where: { 
          isActive: true,
          barcode: null,
        },
      }),
    ]);

    return {
      totalProducts,
      productsWithBarcode,
      productsWithoutBarcode,
      barcodeCoverage: totalProducts > 0 ? (productsWithBarcode / totalProducts) * 100 : 0,
    };
  }
}
