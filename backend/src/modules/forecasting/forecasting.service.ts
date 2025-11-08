import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { RedisService } from '@/common/redis/redis.service';
import { StockPredictionService } from './stock-prediction.service';

@Injectable()
export class ForecastingService {
  private readonly logger = new Logger(ForecastingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly stockPredictionService: StockPredictionService,
  ) {}

  async getDashboardInsights() {
    const cacheKey = 'forecasting:dashboard-insights';

    return this.redis.cache(cacheKey, async () => {
      const [
        lowStockAlerts,
        stockoutRisk,
        reorderRecommendations,
        inventoryHealth,
      ] = await Promise.all([
        this.getLowStockAlerts(),
        this.getStockoutRisk(7),
        this.getReorderRecommendations(),
        this.getInventoryHealth(),
      ]);

      return {
        lowStockAlerts,
        stockoutRisk,
        reorderRecommendations,
        inventoryHealth,
        lastUpdated: new Date(),
      };
    }, 300); // Cache for 5 minutes
  }

  async getLowStockAlerts() {
    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        stockQty: { lte: this.prisma.product.fields.minStock },
      },
      include: {
        brand: { select: { name: true } },
        category: { select: { name: true } },
      },
      orderBy: { stockQty: 'asc' },
      take: 10,
    });

    return products.map(product => ({
      productId: product.id,
      sku: product.sku,
      name: product.name,
      brand: product.brand.name,
      category: product.category.name,
      currentStock: product.stockQty,
      minStock: product.minStock,
      deficit: product.minStock - product.stockQty,
      urgency: product.stockQty === 0 ? 'critical' : product.stockQty < product.minStock * 0.5 ? 'high' : 'medium',
    }));
  }

  async getStockoutRisk(days: number = 7) {
    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, sku: true, name: true, stockQty: true },
      take: 50, // Limit for performance
    });

    const risks = await Promise.all(
      products.map(async (product) => {
        try {
          const prediction = await this.stockPredictionService.predictStock(product.id, days);
          
          const stockoutDay = prediction.predictions.find(p => p.predictedStock <= 0);
          
          if (stockoutDay) {
            const daysUntilStockout = Math.floor(
              (stockoutDay.date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            );

            return {
              productId: product.id,
              sku: product.sku,
              name: product.name,
              currentStock: product.stockQty,
              daysUntilStockout,
              estimatedStockoutDate: stockoutDay.date,
              risk: daysUntilStockout <= 3 ? 'critical' : daysUntilStockout <= 7 ? 'high' : 'medium',
            };
          }

          return null;
        } catch (error) {
          return null;
        }
      })
    );

    return risks.filter(r => r !== null).sort((a, b) => a.daysUntilStockout - b.daysUntilStockout);
  }

  async getReorderRecommendations() {
    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        stockQty: { lte: this.prisma.product.fields.minStock },
      },
      include: {
        brand: { select: { name: true } },
        category: { select: { name: true } },
      },
      take: 20,
    });

    return products.map(product => ({
      productId: product.id,
      sku: product.sku,
      name: product.name,
      brand: product.brand.name,
      currentStock: product.stockQty,
      minStock: product.minStock,
      suggestedOrderQty: Math.max(product.minStock * 2 - product.stockQty, 0),
      estimatedCost: product.costPrice * Math.max(product.minStock * 2 - product.stockQty, 0),
      priority: product.stockQty === 0 ? 1 : product.stockQty < product.minStock * 0.5 ? 2 : 3,
    }));
  }

  async getInventoryHealth() {
    const [
      totalProducts,
      lowStockCount,
      outOfStockCount,
      overstockCount,
      totalValue,
    ] = await Promise.all([
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
      this.prisma.product.count({
        where: {
          isActive: true,
          stockQty: { gt: this.prisma.product.fields.maxStock },
        },
      }),
      this.prisma.product.aggregate({
        where: { isActive: true },
        _sum: { costPrice: true },
      }),
    ]);

    const healthScore = totalProducts > 0
      ? Math.round(((totalProducts - lowStockCount - outOfStockCount) / totalProducts) * 100)
      : 0;

    return {
      totalProducts,
      lowStockCount,
      outOfStockCount,
      overstockCount,
      healthyStock: totalProducts - lowStockCount - outOfStockCount - overstockCount,
      healthScore,
      totalValue: totalValue._sum.costPrice || 0,
      status: healthScore >= 80 ? 'good' : healthScore >= 60 ? 'fair' : 'poor',
    };
  }

  async optimizeInventory() {
    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      include: {
        brand: { select: { name: true } },
        category: { select: { name: true } },
      },
    });

    const recommendations = products.map(product => {
      let action: 'reorder' | 'reduce' | 'maintain' = 'maintain';
      let reason = '';
      let suggestedQty = 0;

      if (product.stockQty <= product.minStock) {
        action = 'reorder';
        suggestedQty = product.minStock * 2 - product.stockQty;
        reason = 'Stock below minimum threshold';
      } else if (product.maxStock && product.stockQty > product.maxStock) {
        action = 'reduce';
        suggestedQty = product.stockQty - product.maxStock;
        reason = 'Overstock detected';
      }

      return {
        productId: product.id,
        sku: product.sku,
        name: product.name,
        brand: product.brand.name,
        category: product.category.name,
        currentStock: product.stockQty,
        action,
        reason,
        suggestedQty,
        estimatedImpact: action === 'reorder' 
          ? product.costPrice * suggestedQty 
          : action === 'reduce'
          ? -product.costPrice * suggestedQty
          : 0,
      };
    });

    const actionableRecommendations = recommendations.filter(r => r.action !== 'maintain');

    return {
      totalProducts: products.length,
      actionableItems: actionableRecommendations.length,
      recommendations: actionableRecommendations,
      summary: {
        reorderCount: actionableRecommendations.filter(r => r.action === 'reorder').length,
        reduceCount: actionableRecommendations.filter(r => r.action === 'reduce').length,
        totalCostImpact: actionableRecommendations.reduce((sum, r) => sum + r.estimatedImpact, 0),
      },
    };
  }

  async getABCAnalysis() {
    const cacheKey = 'forecasting:abc-analysis';

    return this.redis.cache(cacheKey, async () => {
      const products = await this.prisma.product.findMany({
        where: { isActive: true },
        include: {
          brand: { select: { name: true } },
          category: { select: { name: true } },
          stockIns: {
            select: {
              qty: true,
              totalCost: true,
            },
          },
        },
      });

      // Calculate value for each product
      const productsWithValue = products.map(product => {
        const totalValue = product.stockIns.reduce((sum, item) => sum + item.totalCost, 0);
        return {
          ...product,
          totalValue,
        };
      });

      // Sort by value descending
      productsWithValue.sort((a, b) => b.totalValue - a.totalValue);

      const totalValue = productsWithValue.reduce((sum, p) => sum + p.totalValue, 0);
      let cumulativeValue = 0;

      // Classify products
      const classified = productsWithValue.map(product => {
        cumulativeValue += product.totalValue;
        const cumulativePercentage = (cumulativeValue / totalValue) * 100;

        let classification: 'A' | 'B' | 'C';
        if (cumulativePercentage <= 80) classification = 'A';
        else if (cumulativePercentage <= 95) classification = 'B';
        else classification = 'C';

        return {
          productId: product.id,
          sku: product.sku,
          name: product.name,
          brand: product.brand.name,
          category: product.category.name,
          totalValue: product.totalValue,
          classification,
        };
      });

      const summary = {
        A: classified.filter(p => p.classification === 'A').length,
        B: classified.filter(p => p.classification === 'B').length,
        C: classified.filter(p => p.classification === 'C').length,
      };

      return {
        products: classified,
        summary,
        insights: {
          A: 'High-value items requiring tight control and accurate records',
          B: 'Moderate-value items with moderate control',
          C: 'Low-value items with simple controls',
        },
      };
    }, 3600); // Cache for 1 hour
  }
}
