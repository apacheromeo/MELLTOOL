import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';

@Injectable()
export class BrandRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.brand.findMany({
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
    return this.prisma.brand.findUnique({
      where: { id },
      include: {
        products: {
          where: { isActive: true },
          include: {
            category: { select: { name: true } },
          },
        },
        _count: {
          select: { products: true },
        },
      },
    });
  }

  async findByName(name: string) {
    return this.prisma.brand.findFirst({
      where: {
        OR: [
          { name: { equals: name, mode: 'insensitive' } },
          { nameTh: { equals: name, mode: 'insensitive' } },
        ],
      },
    });
  }

  async getBrandWithStats(id: string) {
    const brand = await this.prisma.brand.findUnique({
      where: { id },
      include: {
        products: {
          where: { isActive: true },
        },
      },
    });

    if (!brand) return null;

    const totalProducts = brand.products.length;
    const totalValue = brand.products.reduce((sum, p) => sum + p.costPrice * p.stockQty, 0);
    const lowStockProducts = brand.products.filter(p => p.stockQty <= p.minStock).length;

    return {
      ...brand,
      stats: {
        totalProducts,
        totalValue,
        lowStockProducts,
      },
    };
  }
}
