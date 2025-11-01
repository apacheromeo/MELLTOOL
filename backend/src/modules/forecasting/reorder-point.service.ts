import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class ReorderPointService {
  private readonly logger = new Logger(ReorderPointService.name);

  constructor(private readonly prisma: PrismaService) {}

  async calculateReorderPoint(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        brand: { select: { name: true } },
        category: { select: { name: true } },
      },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    // Get historical demand
    const demand = await this.getAverageDailyDemand(productId);
    
    // Calculate reorder point: ROP = (Average Daily Demand × Lead Time) + Safety Stock
    const leadTime = 7; // days
    const serviceLevel = 0.95; // 95% service level
    const zScore = 1.65; // Z-score for 95% service level
    
    const demandDuringLeadTime = demand.avgDailyDemand * leadTime;
    const safetyStock = zScore * demand.stdDev * Math.sqrt(leadTime);
    const reorderPoint = Math.ceil(demandDuringLeadTime + safetyStock);
    
    // Calculate Economic Order Quantity (EOQ)
    const annualDemand = demand.avgDailyDemand * 365;
    const orderingCost = 100; // Assumed fixed cost per order
    const holdingCostRate = 0.25; // 25% of item cost per year
    const holdingCost = product.costPrice * holdingCostRate;
    
    const eoq = Math.ceil(
      Math.sqrt((2 * annualDemand * orderingCost) / holdingCost)
    );

    return {
      productId,
      product: {
        sku: product.sku,
        name: product.name,
        currentStock: product.stockQty,
        minStock: product.minStock,
      },
      reorderPoint,
      economicOrderQuantity: eoq,
      safetyStock: Math.ceil(safetyStock),
      leadTime,
      demand: {
        avgDailyDemand: Math.round(demand.avgDailyDemand * 100) / 100,
        stdDev: Math.round(demand.stdDev * 100) / 100,
      },
      recommendation: {
        shouldReorder: product.stockQty <= reorderPoint,
        daysUntilReorder: Math.max(0, Math.ceil((product.stockQty - reorderPoint) / demand.avgDailyDemand)),
        suggestedOrderQty: eoq,
      },
    };
  }

  async calculateAllReorderPoints() {
    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    const results = await Promise.all(
      products.map(async (product) => {
        try {
          return await this.calculateReorderPoint(product.id);
        } catch (error) {
          this.logger.error(`Error calculating reorder point for ${product.id}: ${error.message}`);
          return null;
        }
      })
    );

    return results.filter(r => r !== null);
  }

  private async getAverageDailyDemand(productId: string) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const stockIns = await this.prisma.stockInItem.findMany({
      where: {
        productId,
        stockIn: {
          createdAt: { gte: startDate, lte: endDate },
          status: 'RECEIVED',
        },
      },
    });

    if (stockIns.length === 0) {
      return { avgDailyDemand: 1, stdDev: 0 };
    }

    const totalQty = stockIns.reduce((sum, item) => sum + item.qty, 0);
    const avgDailyDemand = totalQty / 30;

    // Calculate standard deviation
    const dailyDemands = stockIns.map(item => item.qty);
    const variance = dailyDemands.reduce((sum, qty) => 
      sum + Math.pow(qty - avgDailyDemand, 2), 0
    ) / dailyDemands.length;
    const stdDev = Math.sqrt(variance);

    return { avgDailyDemand, stdDev };
  }
}
