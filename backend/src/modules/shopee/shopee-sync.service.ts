import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '@/common/prisma/prisma.service';
import { ShopeeApiService } from './shopee-api.service';
import { ShopeeAuthService } from './shopee-auth.service';

@Injectable()
export class ShopeeSyncService {
  private readonly logger = new Logger(ShopeeSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly shopeeApi: ShopeeApiService,
    private readonly shopeeAuth: ShopeeAuthService,
    @InjectQueue('shopee-sync') private readonly syncQueue: Queue,
  ) {}

  async syncCatalog(shopId: string) {
    try {
      this.logger.log(`Starting catalog sync for shop: ${shopId}`);

      const shop = await this.prisma.shopeeShop.findUnique({
        where: { shopId },
      });

      if (!shop) {
        throw new Error('Shop not found');
      }

      // Add job to queue
      await this.syncQueue.add('sync-catalog', {
        shopId,
        shopDbId: shop.id,
      });

      await this.prisma.shopeeSyncLog.create({
        data: {
          shopId: shop.id,
          action: 'CATALOG_SYNC',
          status: 'PENDING',
          message: 'Catalog sync queued',
        },
      });

      return {
        message: 'Catalog sync started',
        status: 'queued',
      };
    } catch (error) {
      this.logger.error(`Error starting catalog sync: ${error.message}`, error);
      throw error;
    }
  }

  async syncStock(shopId: string) {
    try {
      this.logger.log(`Starting stock sync for shop: ${shopId}`);

      const shop = await this.prisma.shopeeShop.findUnique({
        where: { shopId },
      });

      if (!shop) {
        throw new Error('Shop not found');
      }

      // Add job to queue
      await this.syncQueue.add('sync-stock', {
        shopId,
        shopDbId: shop.id,
      });

      await this.prisma.shopeeSyncLog.create({
        data: {
          shopId: shop.id,
          action: 'STOCK_SYNC',
          status: 'PENDING',
          message: 'Stock sync queued',
        },
      });

      return {
        message: 'Stock sync started',
        status: 'queued',
      };
    } catch (error) {
      this.logger.error(`Error starting stock sync: ${error.message}`, error);
      throw error;
    }
  }

  async fullSync(shopId: string) {
    try {
      this.logger.log(`Starting full sync for shop: ${shopId}`);

      await this.syncCatalog(shopId);
      await this.syncStock(shopId);

      return {
        message: 'Full sync started',
        status: 'queued',
      };
    } catch (error) {
      this.logger.error(`Error starting full sync: ${error.message}`, error);
      throw error;
    }
  }

  async getSyncStatus(shopId: string) {
    const shop = await this.prisma.shopeeShop.findUnique({
      where: { shopId },
      include: {
        syncLogs: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!shop) {
      throw new Error('Shop not found');
    }

    const [pendingJobs, activeJobs] = await Promise.all([
      this.syncQueue.getWaiting(),
      this.syncQueue.getActive(),
    ]);

    const shopJobs = [...pendingJobs, ...activeJobs].filter(
      (job) => job.data.shopId === shopId
    );

    return {
      shop: {
        id: shop.id,
        shopId: shop.shopId,
        shopName: shop.shopName,
        lastSyncAt: shop.lastSyncAt,
      },
      queuedJobs: shopJobs.length,
      recentLogs: shop.syncLogs,
    };
  }

  async performCatalogSync(shopId: string, shopDbId: string) {
    try {
      this.logger.log(`Performing catalog sync for shop: ${shopId}`);

      const accessToken = await this.shopeeAuth.getValidAccessToken(shopId);

      let offset = 0;
      const pageSize = 50;
      let hasMore = true;
      let totalSynced = 0;

      while (hasMore) {
        const itemList = await this.shopeeApi.getItemList(
          shopId,
          accessToken,
          offset,
          pageSize
        );

        if (!itemList.item || itemList.item.length === 0) {
          hasMore = false;
          break;
        }

        const itemIds = itemList.item.map((item: any) => item.item_id);
        const itemDetails = await this.shopeeApi.getItemBaseInfo(
          shopId,
          accessToken,
          itemIds
        );

        for (const item of itemDetails.item_list) {
          await this.prisma.shopeeItem.upsert({
            where: { shopeeItemId: item.item_id.toString() },
            update: {
              name: item.item_name,
              price: item.price_info?.[0]?.original_price || 0,
              stock: item.stock_info?.[0]?.normal_stock || 0,
              status: item.item_status,
              lastSyncAt: new Date(),
              syncStatus: 'SYNCED',
            },
            create: {
              shopeeItemId: item.item_id.toString(),
              shopeeSku: item.item_sku || item.item_id.toString(),
              name: item.item_name,
              price: item.price_info?.[0]?.original_price || 0,
              stock: item.stock_info?.[0]?.normal_stock || 0,
              status: item.item_status,
              shopId: shopDbId,
              syncStatus: 'SYNCED',
            },
          });

          totalSynced++;
        }

        offset += pageSize;
        hasMore = itemList.has_next_page;
      }

      await this.prisma.shopeeShop.update({
        where: { id: shopDbId },
        data: { lastSyncAt: new Date() },
      });

      await this.prisma.shopeeSyncLog.create({
        data: {
          shopId: shopDbId,
          action: 'CATALOG_SYNC',
          status: 'SYNCED',
          message: `Successfully synced ${totalSynced} items`,
          data: { totalSynced },
        },
      });

      this.logger.log(`Catalog sync completed for shop: ${shopId}, synced ${totalSynced} items`);

      return { totalSynced };
    } catch (error) {
      this.logger.error(`Catalog sync error for shop ${shopId}: ${error.message}`, error);

      await this.prisma.shopeeSyncLog.create({
        data: {
          shopId: shopDbId,
          action: 'CATALOG_SYNC',
          status: 'ERROR',
          message: `Sync failed: ${error.message}`,
        },
      });

      throw error;
    }
  }

  async performStockSync(shopId: string, shopDbId: string) {
    try {
      this.logger.log(`Performing stock sync for shop: ${shopId}`);

      const accessToken = await this.shopeeAuth.getValidAccessToken(shopId);

      const items = await this.prisma.shopeeItem.findMany({
        where: {
          shopId: shopDbId,
          productId: { not: null },
        },
        include: {
          product: true,
        },
      });

      const updates = items.map((item) => ({
        itemId: parseInt(item.shopeeItemId),
        stock: item.product.stockQty,
      }));

      const result = await this.shopeeApi.batchUpdateStock(
        shopId,
        accessToken,
        updates
      );

      await this.prisma.shopeeShop.update({
        where: { id: shopDbId },
        data: { lastSyncAt: new Date() },
      });

      await this.prisma.shopeeSyncLog.create({
        data: {
          shopId: shopDbId,
          action: 'STOCK_SYNC',
          status: 'SYNCED',
          message: `Stock sync completed: ${result.successful} successful, ${result.failed} failed`,
          data: JSON.parse(JSON.stringify(result)), // Serialize PromiseSettledResult properly
        },
      });

      this.logger.log(`Stock sync completed for shop: ${shopId}`);

      return result;
    } catch (error) {
      this.logger.error(`Stock sync error for shop ${shopId}: ${error.message}`, error);

      await this.prisma.shopeeSyncLog.create({
        data: {
          shopId: shopDbId,
          action: 'STOCK_SYNC',
          status: 'ERROR',
          message: `Sync failed: ${error.message}`,
        },
      });

      throw error;
    }
  }
}
