import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// TODO: Install canvas package and uncomment
// import { createCanvas } from 'canvas';
import * as JsBarcode from 'jsbarcode';

@Injectable()
export class BarcodeGeneratorService {
  private readonly logger = new Logger(BarcodeGeneratorService.name);

  constructor(private readonly configService: ConfigService) {}

  generateBarcodeImage(
    value: string,
    options: {
      width?: number;
      height?: number;
      displayValue?: boolean;
      fontSize?: number;
      format?: string;
    } = {},
  ): Buffer {
    const {
      width = 2,
      height = 100,
      displayValue = true,
      fontSize = 14,
      format = 'CODE128',
    } = options;

    // TODO: Canvas package not yet installed
    // Uncomment when canvas is added to dependencies
    throw new Error('Barcode generation temporarily disabled - canvas package needed');

    /*
    try {
      const canvas = createCanvas(200, 150);

      JsBarcode(canvas, value, {
        format,
        width,
        height,
        displayValue,
        fontSize,
        textAlign: 'center',
        textPosition: 'bottom',
        textMargin: 2,
        background: '#ffffff',
        lineColor: '#000000',
      });

      return canvas.toBuffer('image/png');
    } catch (error) {
      this.logger.error(`Error generating barcode: ${error.message}`, error);
      throw new Error('Failed to generate barcode');
    }
    */
  }

  generateBarcodeDataURL(
    value: string,
    options: {
      width?: number;
      height?: number;
      displayValue?: boolean;
    } = {},
  ): string {
    const buffer = this.generateBarcodeImage(value, options);
    return `data:image/png;base64,${buffer.toString('base64')}`;
  }

  validateBarcode(value: string): boolean {
    // TODO: Canvas package not installed yet
    // For now, just do basic validation
    try {
      // Basic barcode validation: non-empty and alphanumeric
      return value && value.length > 0 && /^[A-Za-z0-9]+$/.test(value);
    } catch (error) {
      return false;
    }
  }

  generateBarcodeValue(): string {
    const prefix = this.configService.get('barcode.prefix', 'VAC');
    const length = this.configService.get('barcode.length', 8);
    
    const randomPart = Math.random()
      .toString(36)
      .substring(2, 2 + length - prefix.length)
      .toUpperCase();
    
    return `${prefix}${randomPart}`;
  }
}

