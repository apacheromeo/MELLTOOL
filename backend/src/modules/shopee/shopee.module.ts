import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';

import { PrismaModule } from '@/common/prisma/prisma.module';
import { ShopeeController } from './shopee.controller';
import { ShopeeService } from './shopee.service';
import { ShopeeAuthService } from './shopee-auth.service';
import { ShopeeSyncService } from './shopee-sync.service';
import { ShopeeWebhookService } from './shopee-webhook.service';
import { ShopeeApiService } from './shopee-api.service';
import { ShopeeTokenRefreshService } from './shopee-token-refresh.service';
import { ShopeeSyncProcessor } from './processors/shopee-sync.processor';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    ScheduleModule.forRoot(),
    BullModule.registerQueue({
      name: 'shopee-sync',
    }),
  ],
  controllers: [ShopeeController],
  providers: [
    ShopeeService,
    ShopeeAuthService,
    ShopeeSyncService,
    ShopeeWebhookService,
    ShopeeApiService,
    ShopeeTokenRefreshService,
    ShopeeSyncProcessor,
  ],
  exports: [ShopeeService, ShopeeApiService],
})
export class ShopeeModule {}
