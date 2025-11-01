import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';

@Injectable()
export class ShopeeService {
  private readonly logger = new Logger(ShopeeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async getShops(userId: string) {
    const shops = await this.prisma.shopeeShop.findMany({
      where: { userId },
      select: {
        id: true,
        shopId: true,
        shopName: true,
        shopRegion: true,
        isActive: true,
        lastSyncAt: true,
        createdAt: true,
        _count: {
          select: { items: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return shops;
  }

  async getShop(shopId: string) {
    const shop = await this.prisma.shopeeShop.findUnique({
      where: { shopId },
      include: {
        _count: {
          select: { items: true, syncLogs: true },
        },
      },
    });

    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    return shop;
  }

  async getShopItems(shopId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const shop = await this.prisma.shopeeShop.findUnique({
      where: { shopId },
    });

    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    const [items, total] = await Promise.all([
      this.prisma.shopeeItem.findMany({
        where: { shopId: shop.id },
        include: {
          product: {
            select: {
              id: true,
              sku: true,
              name: true,
              stockQty: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.shopeeItem.count({
        where: { shopId: shop.id },
      }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async linkItemToProduct(shopId: string, itemId: string, productId: string) {
    const shop = await this.prisma.shopeeShop.findUnique({
      where: { shopId },
    });

    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    const item = await this.prisma.shopeeItem.update({
      where: { shopeeItemId: itemId },
      data: { productId },
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
          },
        },
      },
    });

    this.logger.log(`Linked Shopee item ${itemId} to product ${productId}`);

    return {
      message: 'Item linked successfully',
      item,
    };
  }

  async disconnectShop(shopId: string) {
    const shop = await this.prisma.shopeeShop.findUnique({
      where: { shopId },
    });

    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    await this.prisma.shopeeShop.update({
      where: { shopId },
      data: { isActive: false },
    });

    this.logger.log(`Disconnected shop: ${shop.shopName}`);

    return {
      message: 'Shop disconnected successfully',
    };
  }

  async getSyncLogs(shopId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const shop = await this.prisma.shopeeShop.findUnique({
      where: { shopId },
    });

    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    const [logs, total] = await Promise.all([
      this.prisma.shopeeSyncLog.findMany({
        where: { shopId: shop.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.shopeeSyncLog.count({
        where: { shopId: shop.id },
      }),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
}
