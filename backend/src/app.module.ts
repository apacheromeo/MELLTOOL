import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';

import { PrismaModule } from './common/prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { LoggerModule } from './common/logger/logger.module';
import { SanitizeMiddleware } from './common/middleware/sanitize.middleware';

// Feature modules
import { AuthModule } from './modules/auth/auth.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { StockInModule } from './modules/stock-in/stock-in.module';
import { ShopeeModule } from './modules/shopee/shopee.module';
import { PrintModule } from './modules/print/print.module';
import { SettingsModule } from './modules/settings/settings.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ForecastingModule } from './modules/forecasting/forecasting.module';
import { SalesModule } from './modules/sales/sales.module';
import { AccountingModule } from './modules/accounting/accounting.module';

import { configuration } from './config/configuration';
import { validationSchema } from './config/validation';
import { HealthController } from './health.controller';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        throttlers: [{
          ttl: configService.get('THROTTLE_TTL', 60) * 1000, // Convert to milliseconds
          limit: configService.get('THROTTLE_LIMIT', 100),
        }],
      }),
      inject: [ConfigService],
    }),

    // Task scheduling
    ScheduleModule.forRoot(),

    // Queue management
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD'),
        },
      }),
      inject: [ConfigService],
    }),

    // Common modules
    PrismaModule,
    RedisModule,
    LoggerModule,

    // Feature modules
    AuthModule,
    InventoryModule,
    StockInModule,
    ShopeeModule,
    PrintModule,
    SettingsModule,
    DashboardModule,
    ForecastingModule,
    SalesModule,
    AccountingModule,
  ],
  controllers: [HealthController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply sanitization middleware to all routes
    consumer.apply(SanitizeMiddleware).forRoutes('*');
  }
}