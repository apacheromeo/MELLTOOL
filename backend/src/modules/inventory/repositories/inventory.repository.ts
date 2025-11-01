import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class InventoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getInventoryValue() {
    const result = await this.prisma.product.aggregate({
      where: { isActive: true },
      _sum: {
        costPrice: true,
      },
      _count: true,
    });

    return {
      totalValue: result._sum.costPrice || 0,
      totalProducts: result._count,
    };
  }

  async getStockLevels() {
    const [lowStock, normalStock, overStock] = await Promise.all([
      this.prisma.product.count({
        where: {
          isActive: true,
          stockQty: { lte: this.prisma.product.fields.minStock },
        },
      }),
      this.prisma.product.count({
        where: {
          isActive: true,
          stockQty: {
            gt: this.prisma.product.fields.minStock,
            lte: this.prisma.product.fields.maxStock,
          },
        },
      }),
      this.prisma.product.count({
        where: {
          isActive: true,
          stockQty: { gt: this.prisma.product.fields.maxStock },
        },
      }),
    ]);

    return { lowStock, normalStock, overStock };
  }

  async getTopProducts(limit: number = 10) {
    return this.prisma.product.findMany({
      where: { isActive: true },
      include: {
        brand: { select: { name: true } },
        category: { select: { name: true } },
        _count: {
          select: { stockIns: true },
        },
      },
      orderBy: {
        stockIns: { _count: 'desc' },
      },
      take: limit,
    });
  }

  async getProductsByCategory() {
    return this.prisma.category.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: {
        products: { _count: 'desc' },
      },
    });
  }

  async getProductsByBrand() {
    return this.prisma.brand.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: {
        products: { _count: 'desc' },
      },
    });
  }

  async getInventoryTrends(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stockIns = await this.prisma.stockIn.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: { gte: startDate },
        status: 'RECEIVED',
      },
      _sum: {
        totalQty: true,
        totalCost: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return stockIns;
  }
}
