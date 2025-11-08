import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.product.findUnique({
      where: { id },
      include: {
        brand: true,
        category: true,
      },
    });
  }

  async findBySku(sku: string) {
    return this.prisma.product.findUnique({
      where: { sku },
      include: {
        brand: true,
        category: true,
      },
    });
  }

  async findByBarcode(barcode: string) {
    return this.prisma.product.findUnique({
      where: { barcode },
      include: {
        brand: true,
        category: true,
      },
    });
  }

  async search(query: string) {
    return this.prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { nameTh: { contains: query, mode: 'insensitive' } },
          { sku: { contains: query, mode: 'insensitive' } },
          { barcode: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        brand: { select: { name: true } },
        category: { select: { name: true } },
      },
      take: 20,
    });
  }

  async updateStock(id: string, quantity: number) {
    return this.prisma.product.update({
      where: { id },
      data: {
        stockQty: {
          increment: quantity,
        },
      },
    });
  }

  async bulkUpdateStock(updates: Array<{ id: string; quantity: number }>) {
    const promises = updates.map(({ id, quantity }) =>
      this.prisma.product.update({
        where: { id },
        data: {
          stockQty: {
            increment: quantity,
          },
        },
      })
    );

    return Promise.all(promises);
  }

  async getLowStockProducts(threshold?: number) {
    return this.prisma.product.findMany({
      where: {
        isActive: true,
        stockQty: threshold 
          ? { lte: threshold }
          : { lte: this.prisma.product.fields.minStock },
      },
      include: {
        brand: { select: { name: true } },
        category: { select: { name: true } },
      },
      orderBy: { stockQty: 'asc' },
    });
  }

  async getOutOfStockProducts() {
    return this.prisma.product.findMany({
      where: {
        isActive: true,
        stockQty: 0,
      },
      include: {
        brand: { select: { name: true } },
        category: { select: { name: true } },
      },
    });
  }
}
