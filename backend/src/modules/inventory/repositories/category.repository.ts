import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';

@Injectable()
export class CategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.category.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    return this.prisma.category.findUnique({
      where: { id },
      include: {
        products: {
          where: { isActive: true },
          include: {
            brand: { select: { name: true } },
          },
        },
        _count: {
          select: { products: true },
        },
      },
    });
  }

  async findByName(name: string) {
    return this.prisma.category.findFirst({
      where: {
        OR: [
          { name: { equals: name, mode: 'insensitive' } },
          { nameTh: { equals: name, mode: 'insensitive' } },
        ],
      },
    });
  }

  async getCategoryWithStats(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        products: {
          where: { isActive: true },
        },
      },
    });

    if (!category) return null;

    const totalProducts = category.products.length;
    const totalValue = category.products.reduce((sum, p) => sum + p.costPrice * p.stockQty, 0);
    const lowStockProducts = category.products.filter(p => p.stockQty <= p.minStock).length;

    return {
      ...category,
      stats: {
        totalProducts,
        totalValue,
        lowStockProducts,
      },
    };
  }
}
