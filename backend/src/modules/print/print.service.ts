import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CreatePrintJobDto } from './dto/create-print-job.dto';

@Injectable()
export class PrintService {
  private readonly logger = new Logger(PrintService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('print') private readonly printQueue: Queue,
  ) {}

  async createBarcodeJob(createPrintJobDto: CreatePrintJobDto, userId: string) {
    const { productIds, copiesPerProduct = 1 } = createPrintJobDto;

    // Verify products exist
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        brand: { select: { name: true } },
        category: { select: { name: true } },
      },
    });

    if (products.length === 0) {
      throw new NotFoundException('No products found');
    }

    // Create print job
    const printJob = await this.prisma.printJob.create({
      data: {
        type: productIds.length === 1 ? 'BARCODE_SINGLE' : 'BARCODE_BATCH',
        status: 'PENDING',
        userId,
        data: {
          productIds,
          copiesPerProduct,
        },
        products: {
          create: products.map(product => ({
            productId: product.id,
            qty: copiesPerProduct,
          })),
        },
      },
      include: {
        products: {
          include: {
            product: {
              select: {
                sku: true,
                name: true,
                barcode: true,
              },
            },
          },
        },
      },
    });

    // Add to queue for processing
    await this.printQueue.add('generate-barcode-pdf', {
      printJobId: printJob.id,
      products: products.map(p => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        nameTh: p.nameTh,
        barcode: p.barcode,
        brand: p.brand.name,
        category: p.category.name,
        copies: copiesPerProduct,
      })),
    });

    this.logger.log(`Print job created: ${printJob.id} for ${products.length} products`);

    return {
      message: 'Print job created successfully',
      printJob,
    };
  }

  async createBatchBarcodeJob(
    productIds: string[],
    copiesPerProduct: number,
    userId: string,
  ) {
    return this.createBarcodeJob({ productIds, copiesPerProduct }, userId);
  }

  async getPrintJobs(userId: string) {
    return this.prisma.printJob.findMany({
      where: { userId },
      include: {
        products: {
          include: {
            product: {
              select: {
                sku: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPrintJob(id: string) {
    const printJob = await this.prisma.printJob.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true } },
        products: {
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                name: true,
                barcode: true,
                brand: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    if (!printJob) {
      throw new NotFoundException('Print job not found');
    }

    return printJob;
  }

  async updatePrintJobStatus(
    id: string,
    status: 'PROCESSING' | 'COMPLETED' | 'FAILED',
    filePath?: string,
  ) {
    return this.prisma.printJob.update({
      where: { id },
      data: {
        status,
        filePath,
        ...(status === 'COMPLETED' && { printedAt: new Date() }),
      },
    });
  }

  async retryPrintJob(id: string) {
    const printJob = await this.getPrintJob(id);

    if (printJob.status !== 'FAILED') {
      throw new Error('Can only retry failed print jobs');
    }

    // Update status to pending
    await this.prisma.printJob.update({
      where: { id },
      data: { status: 'PENDING' },
    });

    // Re-add to queue
    await this.printQueue.add('generate-barcode-pdf', {
      printJobId: printJob.id,
      products: printJob.products.map(p => ({
        id: p.product.id,
        sku: p.product.sku,
        name: p.product.name,
        barcode: p.product.barcode,
        brand: p.product.brand.name,
        copies: p.qty,
      })),
    });

    this.logger.log(`Print job retried: ${id}`);

    return {
      message: 'Print job retried successfully',
      printJob,
    };
  }
}

