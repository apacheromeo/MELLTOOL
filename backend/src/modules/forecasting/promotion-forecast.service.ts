import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';

interface PromotionTemplate {
  id: string;
  name: string;
  nameTh: string;
  date: string;
  expectedMultiplier: number;
  description: string;
  descriptionTh: string;
  icon: string;
  color: string;
}

interface PromotionForecast {
  promotionDate: Date;
  promotionType: string;
  expectedMultiplier: number;
  products: Array<{
    productId: string;
    sku: string;
    name: string;
    currentStock: number;
    normalDailyDemand: number;
    expectedPromotionDemand: number;
    recommendedStock: number;
    stockGap: number;
    urgency: 'critical' | 'high' | 'medium' | 'low';
  }>;
  summary: {
    totalProducts: number;
    productsNeedingRestock: number;
    totalStockGap: number;
    estimatedCost: number;
  };
}

@Injectable()
export class PromotionForecastService {
  private readonly logger = new Logger(PromotionForecastService.name);

  private readonly promotionTemplates: PromotionTemplate[] = [
    {
      id: '11-11',
      name: '11.11 Singles Day',
      nameTh: 'วันคนโสด 11.11',
      date: '11-11',
      expectedMultiplier: 5.0,
      description: 'Biggest shopping day in Southeast Asia',
      descriptionTh: 'วันช้อปปิ้งที่ใหญ่ที่สุดในเอเชียตะวันออกเฉียงใต้',
      icon: '🎉',
      color: '#FF6B6B',
    },
    {
      id: '12-12',
      name: '12.12 Birthday Sale',
      nameTh: 'วันเกิด Shopee 12.12',
      date: '12-12',
      expectedMultiplier: 4.5,
      description: 'Year-end mega sale',
      descriptionTh: 'เซลส์ใหญ่สิ้นปี',
      icon: '🎂',
      color: '#EE4D2D',
    },
    {
      id: 'black-friday',
      name: 'Black Friday',
      nameTh: 'แบล็คฟรายเดย์',
      date: 'last-friday-november',
      expectedMultiplier: 3.5,
      description: 'Global shopping event',
      descriptionTh: 'งานช้อปปิ้งระดับโลก',
      icon: '🛍️',
      color: '#000000',
    },
    {
      id: 'cyber-monday',
      name: 'Cyber Monday',
      nameTh: 'ไซเบอร์มันเดย์',
      date: 'monday-after-black-friday',
      expectedMultiplier: 3.0,
      description: 'Online shopping deals',
      descriptionTh: 'ดีลช้อปปิ้งออนไลน์',
      icon: '💻',
      color: '#4A90E2',
    },
    {
      id: '9-9',
      name: '9.9 Super Shopping Day',
      nameTh: 'วันช้อปปิ้งสุดพิเศษ 9.9',
      date: '09-09',
      expectedMultiplier: 4.0,
      description: 'Mid-year mega sale',
      descriptionTh: 'เซลส์ใหญ่กลางปี',
      icon: '⚡',
      color: '#FF9500',
    },
    {
      id: '6-6',
      name: '6.6 Mid Year Sale',
      nameTh: 'เซลส์กลางปี 6.6',
      date: '06-06',
      expectedMultiplier: 3.5,
      description: 'Mid-year shopping festival',
      descriptionTh: 'เทศกาลช้อปปิ้งกลางปี',
      icon: '🎪',
      color: '#34C759',
    },
    {
      id: 'new-year',
      name: 'New Year Sale',
      nameTh: 'เซลส์ปีใหม่',
      date: '01-01',
      expectedMultiplier: 3.0,
      description: 'New Year shopping deals',
      descriptionTh: 'ดีลช้อปปิ้งปีใหม่',
      icon: '🎆',
      color: '#FFD700',
    },
    {
      id: 'chinese-new-year',
      name: 'Chinese New Year',
      nameTh: 'ตรุษจีน',
      date: 'varies',
      expectedMultiplier: 3.5,
      description: 'Lunar New Year celebration',
      descriptionTh: 'เทศกาลตรุษจีน',
      icon: '🧧',
      color: '#DC143C',
    },
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async getPromotionTemplates(): Promise<PromotionTemplate[]> {
    return this.promotionTemplates;
  }

  async forecastPromotion(
    promotionDate: Date,
    promotionType: string,
    expectedMultiplier?: number,
    productIds?: string[]
  ): Promise<PromotionForecast> {
    const cacheKey = `forecast:promotion:${promotionDate.toISOString()}:${promotionType}`;

    return this.redis.cache(cacheKey, async () => {
      this.logger.log(`Generating promotion forecast for: ${promotionDate}`);

      // Get multiplier from template or use provided
      const template = this.promotionTemplates.find(t => t.id === promotionType);
      const multiplier = expectedMultiplier || template?.expectedMultiplier || 3.0;

      // Get products to forecast
      const whereClause: any = { isActive: true };
      if (productIds && productIds.length > 0) {
        whereClause.id = { in: productIds };
      }

      const products = await this.prisma.product.findMany({
        where: whereClause,
        include: {
          brand: { select: { name: true } },
          category: { select: { name: true } },
        },
      });

      const forecasts = await Promise.all(
        products.map(async (product) => {
          // Get historical demand
          const historicalDemand = await this.getHistoricalDemand(product.id);
          const normalDailyDemand = historicalDemand.avgDailyDemand || 1;

          // Calculate expected promotion demand
          const expectedPromotionDemand = Math.ceil(normalDailyDemand * multiplier);

          // Calculate recommended stock (promotion demand + safety buffer)
          const safetyBuffer = 1.2; // 20% safety buffer
          const recommendedStock = Math.ceil(expectedPromotionDemand * safetyBuffer);

          // Calculate stock gap
          const stockGap = Math.max(0, recommendedStock - product.stockQty);

          // Determine urgency
          const daysUntilPromotion = Math.floor(
            (promotionDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
          );
          
          let urgency: 'critical' | 'high' | 'medium' | 'low';
          if (stockGap > 0 && daysUntilPromotion <= 3) urgency = 'critical';
          else if (stockGap > 0 && daysUntilPromotion <= 7) urgency = 'high';
          else if (stockGap > 0 && daysUntilPromotion <= 14) urgency = 'medium';
          else urgency = 'low';

          return {
            productId: product.id,
            sku: product.sku,
            name: product.name,
            currentStock: product.stockQty,
            normalDailyDemand,
            expectedPromotionDemand,
            recommendedStock,
            stockGap,
            urgency,
            costPrice: product.costPrice,
          };
        })
      );

      // Calculate summary
      const productsNeedingRestock = forecasts.filter(f => f.stockGap > 0).length;
      const totalStockGap = forecasts.reduce((sum, f) => sum + f.stockGap, 0);
      const estimatedCost = forecasts.reduce(
        (sum, f) => sum + (f.stockGap * f.costPrice),
        0
      );

      return {
        promotionDate,
        promotionType,
        expectedMultiplier: multiplier,
        products: forecasts.map(({ costPrice, ...rest }) => rest),
        summary: {
          totalProducts: products.length,
          productsNeedingRestock,
          totalStockGap,
          estimatedCost,
        },
      };
    }, 3600); // Cache for 1 hour
  }

  async getUpcomingPromotions(days: number = 90) {
    const today = new Date();
    const upcoming = [];

    for (const template of this.promotionTemplates) {
      const promotionDate = this.getNextPromotionDate(template.date, today);
      
      if (promotionDate) {
        const daysUntil = Math.floor(
          (promotionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysUntil >= 0 && daysUntil <= days) {
          upcoming.push({
            ...template,
            promotionDate,
            daysUntil,
          });
        }
      }
    }

    return upcoming.sort((a, b) => a.daysUntil - b.daysUntil);
  }

  private getNextPromotionDate(dateStr: string, fromDate: Date): Date | null {
    const year = fromDate.getFullYear();

    if (dateStr.includes('-')) {
      const [month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      
      // If date has passed this year, use next year
      if (date < fromDate) {
        date.setFullYear(year + 1);
      }
      
      return date;
    }

    // Handle special cases like "last-friday-november"
    if (dateStr === 'last-friday-november') {
      return this.getLastFridayOfNovember(year);
    }

    return null;
  }

  private getLastFridayOfNovember(year: number): Date {
    const lastDay = new Date(year, 10, 30); // November 30
    
    while (lastDay.getDay() !== 5) { // 5 = Friday
      lastDay.setDate(lastDay.getDate() - 1);
    }
    
    return lastDay;
  }

  private async getHistoricalDemand(productId: string) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Last 30 days

    const stockIns = await this.prisma.stockInItem.findMany({
      where: {
        productId,
        stockIn: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          status: 'RECEIVED',
        },
      },
    });

    const totalQty = stockIns.reduce((sum, item) => sum + item.qty, 0);
    const avgDailyDemand = totalQty / 30;

    return {
      totalQty,
      avgDailyDemand,
      days: 30,
    };
  }

  async getPromotionHistory() {
    // Get historical promotion performance
    // This would analyze past promotions and their actual vs predicted performance
    return {
      message: 'Historical promotion data',
      promotions: [],
    };
  }

  async comparePromotions() {
    // Compare different promotion types and their effectiveness
    const templates = this.promotionTemplates;
    
    return templates.map(template => ({
      id: template.id,
      name: template.name,
      nameTh: template.nameTh,
      expectedMultiplier: template.expectedMultiplier,
      historicalAccuracy: 0.85, // Placeholder
      avgRevenue: 0, // Placeholder
    }));
  }
}
