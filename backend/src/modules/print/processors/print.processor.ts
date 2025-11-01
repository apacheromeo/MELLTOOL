import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PdfGeneratorService } from '../pdf-generator.service';
import { PrintService } from '../print.service';

@Processor('print')
export class PrintProcessor {
  private readonly logger = new Logger(PrintProcessor.name);

  constructor(
    private readonly pdfGenerator: PdfGeneratorService,
    private readonly printService: PrintService,
  ) {}

  @Process('generate-barcode-pdf')
  async handleBarcodeGeneration(job: Job) {
    const { printJobId, products } = job.data;

    this.logger.log(`Processing print job: ${printJobId}`);

    try {
      // Update status to processing
      await this.printService.updatePrintJobStatus(printJobId, 'PROCESSING');

      // Generate PDF
      const filePath = await this.pdfGenerator.generateBarcodePDF(products);

      // Update status to completed
      await this.printService.updatePrintJobStatus(printJobId, 'COMPLETED', filePath);

      this.logger.log(`Print job completed: ${printJobId}`);

      return { success: true, filePath };
    } catch (error) {
      this.logger.error(`Print job failed: ${printJobId}`, error);

      // Update status to failed
      await this.printService.updatePrintJobStatus(printJobId, 'FAILED');

      throw error;
    }
  }
}


