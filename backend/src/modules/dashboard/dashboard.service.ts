import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { RedisService } from '@/common/redis/redis.service';
import { ForecastingService } from '../forecasting/forecasting.service';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly forecastingService: ForecastingService,
  ) {}

  async getOverview() {
    const cacheKey = 'dashboard:overview';

    return this.redis.cache(cacheKey, async () => {
      const [
        totalProducts,
        activeProducts,
        lowStockCount,
        outOfStockCount,
        inventoryStats,
        totalStockIns,
        pendingStockIns,
        shopeeShops,
        recentStockIns,
        forecastingInsights,
      ] = await Promise.all([
        this.prisma.product.count(),
        this.prisma.product.count({ where: { isActive: true } }),
        this.prisma.product.count({
          where: {
            isActive: true,
            stockQty: { lte: this.prisma.product.fields.minStock },
          },
        }),
        this.prisma.product.count({
          where: { isActive: true, stockQty: 0 },
        }),
        // Calculate total quantity and value correctly
        this.prisma.product.aggregate({
          where: { isActive: true },
          _sum: {
            stockQty: true,
          },
        }),
        this.prisma.stockIn.count(),
        this.prisma.stockIn.count({ where: { status: 'PENDING' } }),
        this.prisma.shopeeShop.findMany({
          where: { isActive: true },
          select: {
            id: true,
            shopName: true,
            shopRegion: true,
            lastSyncAt: true,
            _count: { select: { items: true } },
          },
        }),
        this.prisma.stockIn.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { name: true } },
            _count: { select: { items: true } },
          },
        }),
        this.forecastingService.getDashboardInsights(),
      ]);

      // Calculate total inventory value (costPrice * stockQty for each product)
      const products = await this.prisma.product.findMany({
        where: { isActive: true },
        select: {
          costPrice: true,
          stockQty: true,
        },
      });

      const totalValue = products.reduce((sum, p) => sum + (p.costPrice * p.stockQty), 0);
      const totalQuantity = inventoryStats._sum.stockQty || 0;

      return {
        inventory: {
          totalProducts,
          activeProducts,
          lowStockCount,
          outOfStockCount,
          totalQuantity,
          totalValue,
          healthScore: this.calculateHealthScore(
            activeProducts,
            lowStockCount,
            outOfStockCount,
          ),
        },
        stockIns: {
          total: totalStockIns,
          pending: pendingStockIns,
          recent: recentStockIns,
        },
        shopee: {
          connectedShops: shopeeShops.length,
          shops: shopeeShops,
        },
        forecasting: forecastingInsights,
        lastUpdated: new Date(),
      };
    }, 300); // 5 minutes cache
  }

  async getMetrics() {
    const [inventoryTurnover, fillRate, avgLeadTime] = await Promise.all([
      this.calculateInventoryTurnover(),
      this.calculateFillRate(),
      this.calculateAvgLeadTime(),
    ]);

    return {
      inventoryTurnover,
      fillRate,
      avgLeadTime,
      stockAccuracy: 95, // Placeholder
    };
  }

  async getRecentActivities() {
    const [recentStockIns, recentSyncs] = await Promise.all([
      this.prisma.stockIn.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true } },
        },
      }),
      this.prisma.shopeeSyncLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          shop: { select: { shopName: true } },
        },
      }),
    ]);

    const activities = [
      ...recentStockIns.map(si => ({
        type: 'stock-in',
        title: `Stock-in ${si.reference}`,
        description: `${si.totalQty} items received`,
        user: si.user.name,
        timestamp: si.createdAt,
        status: si.status,
      })),
      ...recentSyncs.map(sync => ({
        type: 'shopee-sync',
        title: `Shopee ${sync.action}`,
        description: sync.message,
        shop: sync.shop.shopName,
        timestamp: sync.createdAt,
        status: sync.status,
      })),
    ];

    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 15);
  }

  async getInventoryValueChart() {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const stockIns = await this.prisma.stockIn.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        status: 'RECEIVED',
      },
      select: {
        createdAt: true,
        totalCost: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by day
    const dailyData = new Map<string, number>();
    
    stockIns.forEach(si => {
      const date = si.createdAt.toISOString().split('T')[0];
      const current = dailyData.get(date) || 0;
      dailyData.set(date, current + si.totalCost);
    });

    return Array.from(dailyData.entries()).map(([date, value]) => ({
      date,
      value,
    }));
  }

  async getStockMovementsChart() {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const stockIns = await this.prisma.stockIn.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        status: 'RECEIVED',
      },
      select: {
        createdAt: true,
        totalQty: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const dailyData = new Map<string, number>();
    
    stockIns.forEach(si => {
      const date = si.createdAt.toISOString().split('T')[0];
      const current = dailyData.get(date) || 0;
      dailyData.set(date, current + si.totalQty);
    });

    return Array.from(dailyData.entries()).map(([date, quantity]) => ({
      date,
      quantity,
    }));
  }

  async getCategoryDistribution() {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { products: true } },
        products: {
          where: { isActive: true },
          select: { costPrice: true, stockQty: true },
        },
      },
    });

    return categories.map(category => ({
      name: category.name,
      nameTh: category.nameTh,
      productCount: category._count.products,
      totalValue: category.products.reduce(
        (sum, p) => sum + p.costPrice * p.stockQty,
        0,
      ),
    }));
  }

  private calculateHealthScore(
    total: number,
    lowStock: number,
    outOfStock: number,
  ): number {
    if (total === 0) return 0;
    const healthyStock = total - lowStock - outOfStock;
    return Math.round((healthyStock / total) * 100);
  }

  private async calculateInventoryTurnover(): Promise<number> {
    // Simplified calculation
    const [totalCost, avgInventory] = await Promise.all([
      this.prisma.stockIn.aggregate({
        where: { status: 'RECEIVED' },
        _sum: { totalCost: true },
      }),
      this.prisma.product.aggregate({
        where: { isActive: true },
        _avg: { costPrice: true },
      }),
    ]);

    const cogs = totalCost._sum.totalCost || 0;
    const avgInv = avgInventory._avg.costPrice || 1;

    return cogs / avgInv;
  }

  private async calculateFillRate(): Promise<number> {
    // Placeholder - would need order data
    return 92.5;
  }

  private async calculateAvgLeadTime(): Promise<number> {
    const stockIns = await this.prisma.stockIn.findMany({
      where: {
        status: 'RECEIVED',
        receivedAt: { not: null },
      },
      select: {
        createdAt: true,
        receivedAt: true,
      },
      take: 50,
    });

    if (stockIns.length === 0) return 7;

    const totalDays = stockIns.reduce((sum, si) => {
      const days = Math.floor(
        (si.receivedAt.getTime() - si.createdAt.getTime()) / (1000 * 60 * 60 * 24),
      );
      return sum + days;
    }, 0);

    return Math.round(totalDays / stockIns.length);
  }
}


