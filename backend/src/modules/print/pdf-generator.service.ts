import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';
import { BarcodeGeneratorService } from './barcode-generator.service';

@Injectable()
export class PdfGeneratorService {
  private readonly logger = new Logger(PdfGeneratorService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly barcodeGenerator: BarcodeGeneratorService,
  ) {}

  async generateBarcodePDF(
    products: Array<{
      sku: string;
      name: string;
      nameTh?: string;
      barcode: string;
      brand?: string;
      copies: number;
    }>,
  ): Promise<string> {
    const uploadPath = this.configService.get('upload.path', './uploads');
    const filename = `barcodes_${Date.now()}.pdf`;
    const filepath = path.join(uploadPath, filename);

    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 20, bottom: 20, left: 20, right: 20 },
        });

        const stream = fs.createWriteStream(filepath);
        doc.pipe(stream);

        // Title
        doc.fontSize(16).text('Barcode Labels', { align: 'center' });
        doc.moveDown();

        // Label dimensions (3 per row)
        const labelWidth = (doc.page.width - 60) / 3;
        const labelHeight = 100;
        const margin = 10;

        let currentX = 20;
        let currentY = doc.y;
        let labelsInRow = 0;

        // Generate labels for each product
        for (const product of products) {
          for (let copy = 0; copy < product.copies; copy++) {
            // Check if we need a new row
            if (labelsInRow >= 3) {
              currentX = 20;
              currentY += labelHeight + margin;
              labelsInRow = 0;

              // Check if we need a new page
              if (currentY + labelHeight > doc.page.height - 20) {
                doc.addPage();
                currentY = 20;
              }
            }

            // Draw label border
            doc.rect(currentX, currentY, labelWidth, labelHeight).stroke();

            // Product info
            doc.fontSize(10)
               .text(product.name, currentX + 5, currentY + 5, {
                 width: labelWidth - 10,
                 height: 20,
                 ellipsis: true,
               });

            if (product.nameTh) {
              doc.fontSize(8)
                 .text(product.nameTh, currentX + 5, currentY + 20, {
                   width: labelWidth - 10,
                   height: 15,
                   ellipsis: true,
                 });
            }

            // SKU
            doc.fontSize(8)
               .text(`SKU: ${product.sku}`, currentX + 5, currentY + 35);

            if (product.brand) {
              doc.fontSize(8)
                 .text(product.brand, currentX + 5, currentY + 45);
            }

            // Barcode
            try {
              const barcodeImage = this.barcodeGenerator.generateBarcodeImage(
                product.barcode,
                { width: 1, height: 30, fontSize: 8 }
              );

              doc.image(barcodeImage, currentX + 5, currentY + 60, {
                width: labelWidth - 10,
                height: 35,
              });
            } catch (error) {
              this.logger.error(`Error adding barcode for ${product.sku}: ${error.message}`);
              doc.fontSize(8).text(product.barcode, currentX + 5, currentY + 70);
            }

            currentX += labelWidth + margin;
            labelsInRow++;
          }
        }

        doc.end();

        stream.on('finish', () => {
          this.logger.log(`PDF generated: ${filename}`);
          resolve(filepath);
        });

        stream.on('error', (error) => {
          this.logger.error(`PDF generation error: ${error.message}`, error);
          reject(error);
        });
      } catch (error) {
        this.logger.error(`PDF generation error: ${error.message}`, error);
        reject(error);
      }
    });
  }

  async generateInventoryReportPDF(data: any): Promise<string> {
    const uploadPath = this.configService.get('upload.path', './uploads');
    const filename = `inventory_report_${Date.now()}.pdf`;
    const filepath = path.join(uploadPath, filename);

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const stream = fs.createWriteStream(filepath);
        doc.pipe(stream);

        // Title
        doc.fontSize(20).text('Inventory Report', { align: 'center' });
        doc.moveDown();

        // Date
        doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'right' });
        doc.moveDown();

        // Summary
        doc.fontSize(14).text('Summary', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10)
           .text(`Total Products: ${data.totalProducts}`)
           .text(`Total Value: ฿${data.totalValue.toLocaleString()}`)
           .text(`Low Stock Items: ${data.lowStockCount}`);
        doc.moveDown();

        // Products table
        doc.fontSize(14).text('Products', { underline: true });
        doc.moveDown(0.5);

        // Table headers
        const tableTop = doc.y;
        doc.fontSize(10)
           .text('SKU', 50, tableTop, { width: 80 })
           .text('Name', 130, tableTop, { width: 150 })
           .text('Stock', 280, tableTop, { width: 60 })
           .text('Price', 340, tableTop, { width: 80 });

        doc.moveDown();

        // Table rows (sample - you'd loop through actual data)
        if (data.products && data.products.length > 0) {
          data.products.forEach((product: any, index: number) => {
            const y = doc.y;
            doc.fontSize(9)
               .text(product.sku, 50, y, { width: 80 })
               .text(product.name, 130, y, { width: 150, ellipsis: true })
               .text(product.stockQty.toString(), 280, y, { width: 60 })
               .text(`฿${product.costPrice}`, 340, y, { width: 80 });
            doc.moveDown(0.5);
          });
        }

        doc.end();

        stream.on('finish', () => {
          this.logger.log(`Inventory report PDF generated: ${filename}`);
          resolve(filepath);
        });

        stream.on('error', reject);
      } catch (error) {
        this.logger.error(`Report PDF generation error: ${error.message}`, error);
        reject(error);
      }
    });
  }
}

