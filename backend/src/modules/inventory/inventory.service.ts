import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { RedisService } from '@/common/redis/redis.service';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async getOverview() {
    const cacheKey = 'inventory:overview';
    
    return this.redis.cache(cacheKey, async () => {
      const [
        totalProducts,
        totalCategories,
        totalBrands,
        lowStockProducts,
        totalValue,
        recentProducts,
      ] = await Promise.all([
        this.prisma.product.count({ where: { isActive: true } }),
        this.prisma.category.count({ where: { isActive: true } }),
        this.prisma.brand.count({ where: { isActive: true } }),
        this.prisma.product.count({
          where: {
            isActive: true,
            stockQty: { lte: this.prisma.product.fields.minStock },
          },
        }),
        this.prisma.product.aggregate({
          where: { isActive: true },
          _sum: {
            costPrice: true,
          },
        }),
        this.prisma.product.findMany({
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            sku: true,
            name: true,
            stockQty: true,
            costPrice: true,
            brand: { select: { name: true } },
            category: { select: { name: true } },
          },
        }),
      ]);

      return {
        totalProducts,
        totalCategories,
        totalBrands,
        lowStockProducts,
        totalValue: totalValue._sum.costPrice || 0,
        recentProducts,
      };
    }, 300); // 5 minutes cache
  }

  async getLowStockProducts() {
    const cacheKey = 'inventory:low-stock';

    return this.redis.cache(cacheKey, async () => {
      // Fetch all active products with their relations
      const allProducts = await this.prisma.product.findMany({
        where: { isActive: true },
        include: {
          brand: { select: { name: true } },
          category: { select: { name: true } },
        },
        orderBy: { stockQty: 'asc' },
      });

      // Filter products where stockQty <= minStock
      const lowStockProducts = allProducts.filter(
        (product) => product.stockQty <= product.minStock
      );

      return lowStockProducts;
    }, 600); // 10 minutes cache
  }

  async getStockMovements(days: number = 30) {
    const cacheKey = `inventory:stock-movements:${days}`;
    
    return this.redis.cache(cacheKey, async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const [stockIns, stockInItems] = await Promise.all([
        this.prisma.stockIn.findMany({
          where: {
            createdAt: { gte: startDate },
            status: 'RECEIVED',
          },
          include: {
            user: { select: { name: true } },
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    sku: true,
                    name: true,
                    brand: { select: { name: true } },
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.stockInItem.findMany({
          where: {
            stockIn: {
              createdAt: { gte: startDate },
              status: 'RECEIVED',
            },
          },
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                name: true,
                brand: { select: { name: true } },
              },
            },
            stockIn: {
              select: {
                reference: true,
                createdAt: true,
                user: { select: { name: true } },
              },
            },
          },
          orderBy: { stockIn: { createdAt: 'desc' } },
        }),
      ]);

      return {
        stockIns,
        stockInItems,
        summary: {
          totalStockIns: stockIns.length,
          totalItemsReceived: stockInItems.reduce((sum, item) => sum + item.qty, 0),
          totalValue: stockInItems.reduce((sum, item) => sum + item.totalCost, 0),
        },
      };
    }, 300); // 5 minutes cache
  }

  async getProductAnalytics(productId: string) {
    const cacheKey = `inventory:product-analytics:${productId}`;
    
    return this.redis.cache(cacheKey, async () => {
      const [product, stockInItems, recentMovements] = await Promise.all([
        this.prisma.product.findUnique({
          where: { id: productId },
          include: {
            brand: { select: { name: true } },
            category: { select: { name: true } },
          },
        }),
        this.prisma.stockInItem.findMany({
          where: { productId },
          include: {
            stockIn: {
              select: {
                reference: true,
                createdAt: true,
                user: { select: { name: true } },
              },
            },
          },
          orderBy: { stockIn: { createdAt: 'desc' } },
          take: 10,
        }),
        this.prisma.stockInItem.aggregate({
          where: { productId },
          _sum: { qty: true, totalCost: true },
          _avg: { unitCost: true },
        }),
      ]);

      if (!product) {
        return null;
      }

      return {
        product,
        recentMovements: stockInItems,
        analytics: {
          totalReceived: recentMovements._sum.qty || 0,
          totalCost: recentMovements._sum.totalCost || 0,
          averageCost: recentMovements._avg.unitCost || 0,
        },
      };
    }, 300); // 5 minutes cache
  }

  async searchProducts(query: string, filters: any = {}) {
    const cacheKey = `inventory:search:${JSON.stringify({ query, filters })}`;
    
    return this.redis.cache(cacheKey, async () => {
      const where: any = {
        isActive: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { nameTh: { contains: query, mode: 'insensitive' } },
          { sku: { contains: query, mode: 'insensitive' } },
          { barcode: { contains: query, mode: 'insensitive' } },
        ],
      };

      if (filters.category) {
        where.categoryId = filters.category;
      }

      if (filters.brand) {
        where.brandId = filters.brand;
      }

      if (filters.lowStock) {
        where.stockQty = { lte: where.minStock };
      }

      return this.prisma.product.findMany({
        where,
        include: {
          brand: { select: { name: true } },
          category: { select: { name: true } },
        },
        orderBy: { name: 'asc' },
      });
    }, 180); // 3 minutes cache
  }

  async clearCache() {
    const patterns = [
      'inventory:overview',
      'inventory:low-stock',
      'inventory:stock-movements:*',
      'inventory:product-analytics:*',
      'inventory:search:*',
    ];

    for (const pattern of patterns) {
      await this.redis.clearPattern(pattern);
    }

    this.logger.log('Inventory cache cleared');
  }
}
