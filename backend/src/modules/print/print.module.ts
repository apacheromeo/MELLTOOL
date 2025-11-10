import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { PrismaModule } from '@/common/prisma/prisma.module';
import { PrintController } from './print.controller';
import { PrintService } from './print.service';
import { BarcodeGeneratorService } from './barcode-generator.service';
import { PdfGeneratorService } from './pdf-generator.service';
import { PrintProcessor } from './processors/print.processor';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: 'print',
    }),
  ],
  controllers: [PrintController],
  providers: [
    PrintService,
    BarcodeGeneratorService,
    PdfGeneratorService,
    PrintProcessor,
  ],
  exports: [PrintService, BarcodeGeneratorService],
})
export class PrintModule {}

