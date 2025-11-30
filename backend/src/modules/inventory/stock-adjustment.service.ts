import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { RedisService } from '@/common/redis/redis.service';

export interface CreateStockAdjustmentDto {
  productId: string;
  type: 'INCREASE' | 'DECREASE';
  reason: 'DAMAGED' | 'LOST' | 'FOUND' | 'EXPIRED' | 'STOLEN' | 'INVENTORY_COUNT' | 'OTHER';
  quantity: number;
  notes?: string;
}

@Injectable()
export class StockAdjustmentService {
  private readonly logger = new Logger(StockAdjustmentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async createAdjustment(
    dto: CreateStockAdjustmentDto,
    userId: string,
  ) {
    // Validate quantity
    if (dto.quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }

    // Get current product stock
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      select: { id: true, sku: true, name: true, stockQty: true },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${dto.productId} not found`);
    }

    const oldStock = product.stockQty;
    let newStock: number;

    // Calculate new stock based on adjustment type
    if (dto.type === 'INCREASE') {
      newStock = oldStock + dto.quantity;
    } else {
      newStock = oldStock - dto.quantity;

      // Prevent negative stock
      if (newStock < 0) {
        throw new BadRequestException(
          `Cannot decrease stock by ${dto.quantity}. Current stock is ${oldStock}`,
        );
      }
    }

    // Create adjustment record and update product stock in a transaction
    const adjustment = await this.prisma.$transaction(async (tx) => {
      // Create adjustment record
      const adj = await tx.stockAdjustment.create({
        data: {
          productId: dto.productId,
          type: dto.type,
          reason: dto.reason,
          quantity: dto.quantity,
          oldStock,
          newStock,
          notes: dto.notes,
          adjustedBy: userId,
        },
        include: {
          product: {
            select: {
              sku: true,
              name: true,
              imageUrl: true,
            },
          },
          adjustedUser: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      // Update product stock
      await tx.product.update({
        where: { id: dto.productId },
        data: { stockQty: newStock },
      });

      return adj;
    });

    // Clear relevant caches
    await Promise.all([
      this.redis.del('inventory:overview'),
      this.redis.del('inventory:low-stock'),
      this.redis.del('dashboard:overview'),
      this.redis.del(`stock-adjustments:${dto.productId}`),
    ]);

    this.logger.log(
      `Stock adjustment created: ${dto.type} ${dto.quantity} units for product ${product.sku} by user ${userId}`,
    );

    return adjustment;
  }

  async getAdjustments(params?: {
    productId?: string;
    type?: 'INCREASE' | 'DECREASE';
    reason?: string;
    limit?: number;
    offset?: number;
  }) {
    const { productId, type, reason, limit = 50, offset = 0 } = params || {};

    const where: any = {};
    if (productId) where.productId = productId;
    if (type) where.type = type;
    if (reason) where.reason = reason;

    const [adjustments, total] = await Promise.all([
      this.prisma.stockAdjustment.findMany({
        where,
        include: {
          product: {
            select: {
              sku: true,
              name: true,
              imageUrl: true,
            },
          },
          adjustedUser: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.stockAdjustment.count({ where }),
    ]);

    return {
      adjustments,
      total,
      limit,
      offset,
      hasMore: offset + adjustments.length < total,
    };
  }

  async getAdjustmentsByProduct(productId: string) {
    const cacheKey = `stock-adjustments:${productId}`;

    return this.redis.cache(
      cacheKey,
      async () => {
        const adjustments = await this.prisma.stockAdjustment.findMany({
          where: { productId },
          include: {
            adjustedUser: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 100,
        });

        return adjustments;
      },
      300, // 5 minutes cache
    );
  }

  async getAdjustmentStats() {
    const [totalAdjustments, recentAdjustments, adjustmentsByReason] = await Promise.all([
      this.prisma.stockAdjustment.count(),
      this.prisma.stockAdjustment.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      }),
      this.prisma.stockAdjustment.groupBy({
        by: ['reason'],
        _count: {
          id: true,
        },
      }),
    ]);

    return {
      totalAdjustments,
      recentAdjustments,
      byReason: adjustmentsByReason.map((item) => ({
        reason: item.reason,
        count: item._count.id,
      })),
    };
  }
}
