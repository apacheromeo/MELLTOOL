import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';

@Injectable()
export class TrendAnalysisService {
  private readonly logger = new Logger(TrendAnalysisService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async analyzeTrends(productId: string, period: string = '30d') {
    const cacheKey = `trends:product:${productId}:${period}`;

    return this.redis.cache(cacheKey, async () => {
      const days = this.parsePeriod(period);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

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

      // Get stock movements
      const stockIns = await this.prisma.stockInItem.findMany({
        where: {
          productId,
          stockIn: {
            createdAt: { gte: startDate },
            status: 'RECEIVED',
          },
        },
        include: {
          stockIn: {
            select: {
              createdAt: true,
              receivedAt: true,
            },
          },
        },
        orderBy: {
          stockIn: {
            createdAt: 'asc',
          },
        },
      });

      // Group by week
      const weeklyData = this.groupByWeek(stockIns);

      // Calculate trend metrics
      const trendMetrics = this.calculateTrendMetrics(weeklyData);

      // Detect patterns
      const patterns = this.detectPatterns(weeklyData);

      return {
        product: {
          id: product.id,
          sku: product.sku,
          name: product.name,
          brand: product.brand.name,
          category: product.category.name,
        },
        period: {
          days,
          startDate,
          endDate: new Date(),
        },
        weeklyData,
        trendMetrics,
        patterns,
      };
    }, 1800); // Cache for 30 minutes
  }

  async analyzeCategoryTrends(categoryId: string, period: string = '30d') {
    const cacheKey = `trends:category:${categoryId}:${period}`;

    return this.redis.cache(cacheKey, async () => {
      const days = this.parsePeriod(period);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const category = await this.prisma.category.findUnique({
        where: { id: categoryId },
        include: {
          products: {
            where: { isActive: true },
            select: { id: true },
          },
        },
      });

      if (!category) {
        throw new Error('Category not found');
      }

      const productIds = category.products.map(p => p.id);

      const stockIns = await this.prisma.stockInItem.findMany({
        where: {
          productId: { in: productIds },
          stockIn: {
            createdAt: { gte: startDate },
            status: 'RECEIVED',
          },
        },
        include: {
          stockIn: {
            select: {
              createdAt: true,
            },
          },
          product: {
            select: {
              id: true,
              sku: true,
              name: true,
            },
          },
        },
      });

      const weeklyData = this.groupByWeek(stockIns);
      const trendMetrics = this.calculateTrendMetrics(weeklyData);

      return {
        category: {
          id: category.id,
          name: category.name,
          productCount: category.products.length,
        },
        period: {
          days,
          startDate,
          endDate: new Date(),
        },
        weeklyData,
        trendMetrics,
      };
    }, 1800);
  }

  async getSeasonalAnalysis() {
    const cacheKey = 'trends:seasonal-analysis';

    return this.redis.cache(cacheKey, async () => {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      const stockIns = await this.prisma.stockInItem.findMany({
        where: {
          stockIn: {
            createdAt: { gte: oneYearAgo },
            status: 'RECEIVED',
          },
        },
        include: {
          stockIn: {
            select: {
              createdAt: true,
            },
          },
        },
      });

      // Group by month
      const monthlyData = this.groupByMonth(stockIns);

      // Calculate seasonal indices
      const seasonalIndices = this.calculateSeasonalIndices(monthlyData);

      return {
        monthlyData,
        seasonalIndices,
        insights: this.generateSeasonalInsights(seasonalIndices),
      };
    }, 3600 * 24); // Cache for 24 hours
  }

  private parsePeriod(period: string): number {
    const match = period.match(/(\d+)([dwmy])/);
    if (!match) return 30;

    const [, value, unit] = match;
    const num = parseInt(value);

    switch (unit) {
      case 'd': return num;
      case 'w': return num * 7;
      case 'm': return num * 30;
      case 'y': return num * 365;
      default: return 30;
    }
  }

  private groupByWeek(stockIns: any[]) {
    const weeks = new Map<string, number>();

    stockIns.forEach(item => {
      const date = new Date(item.stockIn.createdAt);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];

      const current = weeks.get(weekKey) || 0;
      weeks.set(weekKey, current + item.qty);
    });

    return Array.from(weeks.entries())
      .map(([week, quantity]) => ({
        week: new Date(week),
        quantity,
      }))
      .sort((a, b) => a.week.getTime() - b.week.getTime());
  }

  private groupByMonth(stockIns: any[]) {
    const months = new Map<string, number>();

    stockIns.forEach(item => {
      const date = new Date(item.stockIn.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      const current = months.get(monthKey) || 0;
      months.set(monthKey, current + item.qty);
    });

    return Array.from(months.entries())
      .map(([month, quantity]) => ({
        month,
        quantity,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  private calculateTrendMetrics(data: Array<{ week: Date; quantity: number }>) {
    if (data.length === 0) {
      return {
        averageQuantity: 0,
        growthRate: 0,
        volatility: 0,
        trend: 'stable' as const,
      };
    }

    const quantities = data.map(d => d.quantity);
    const averageQuantity = quantities.reduce((sum, q) => sum + q, 0) / quantities.length;

    // Calculate growth rate (first vs last)
    const firstHalf = quantities.slice(0, Math.floor(quantities.length / 2));
    const secondHalf = quantities.slice(Math.floor(quantities.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, q) => sum + q, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, q) => sum + q, 0) / secondHalf.length;
    
    const growthRate = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;

    // Calculate volatility (coefficient of variation)
    const variance = quantities.reduce((sum, q) => 
      sum + Math.pow(q - averageQuantity, 2), 0
    ) / quantities.length;
    const stdDev = Math.sqrt(variance);
    const volatility = averageQuantity > 0 ? (stdDev / averageQuantity) * 100 : 0;

    // Determine trend
    let trend: 'increasing' | 'decreasing' | 'stable';
    if (growthRate > 10) trend = 'increasing';
    else if (growthRate < -10) trend = 'decreasing';
    else trend = 'stable';

    return {
      averageQuantity: Math.round(averageQuantity),
      growthRate: Math.round(growthRate * 100) / 100,
      volatility: Math.round(volatility * 100) / 100,
      trend,
    };
  }

  private detectPatterns(data: Array<{ week: Date; quantity: number }>) {
    const patterns = [];

    // Detect spikes
    const quantities = data.map(d => d.quantity);
    const avg = quantities.reduce((sum, q) => sum + q, 0) / quantities.length;
    const threshold = avg * 1.5;

    const spikes = data.filter(d => d.quantity > threshold);
    if (spikes.length > 0) {
      patterns.push({
        type: 'spike',
        description: `Detected ${spikes.length} demand spike(s)`,
        dates: spikes.map(s => s.week),
      });
    }

    // Detect declining trend
    const recentData = data.slice(-4); // Last 4 weeks
    const isDecl ining = recentData.every((d, i) => 
      i === 0 || d.quantity < recentData[i - 1].quantity
    );

    if (isDecl ining) {
      patterns.push({
        type: 'declining',
        description: 'Consistent decline in recent weeks',
        severity: 'warning',
      });
    }

    return patterns;
  }

  private calculateSeasonalIndices(monthlyData: Array<{ month: string; quantity: number }>) {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const overallAvg = monthlyData.reduce((sum, d) => sum + d.quantity, 0) / monthlyData.length;

    const indices = monthNames.map((name, index) => {
      const monthNum = String(index + 1).padStart(2, '0');
      const monthData = monthlyData.filter(d => d.month.endsWith(`-${monthNum}`));
      
      if (monthData.length === 0) {
        return { month: name, index: 1.0 };
      }

      const monthAvg = monthData.reduce((sum, d) => sum + d.quantity, 0) / monthData.length;
      const index = overallAvg > 0 ? monthAvg / overallAvg : 1.0;

      return {
        month: name,
        index: Math.round(index * 100) / 100,
      };
    });

    return indices;
  }

  private generateSeasonalInsights(indices: Array<{ month: string; index: number }>) {
    const peakMonth = indices.reduce((max, curr) => 
      curr.index > max.index ? curr : max
    );

    const lowMonth = indices.reduce((min, curr) => 
      curr.index < min.index ? curr : min
    );

    return {
      peakMonth: peakMonth.month,
      peakIndex: peakMonth.index,
      lowMonth: lowMonth.month,
      lowIndex: lowMonth.index,
      recommendation: `Stock up before ${peakMonth.month} (${Math.round((peakMonth.index - 1) * 100)}% above average demand)`,
    };
  }
}
