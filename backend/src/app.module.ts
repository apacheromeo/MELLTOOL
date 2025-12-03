import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
import { APP_INTERCEPTOR } from '@nestjs/core';

import { PrismaModule } from './common/prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { LoggerModule } from './common/logger/logger.module';
import { SanitizeMiddleware } from './common/middleware/sanitize.middleware';
import { RLSInterceptor } from './common/interceptors/rls.interceptor';

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
import { NotificationsModule } from './modules/notifications/notifications.module';

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

    // Queue management - with graceful Redis fallback
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const redisHost = configService.get('REDIS_HOST');
        const redisPort = configService.get('REDIS_PORT', 6379);

        // If Redis is not configured, return minimal config
        // Bull will attempt to connect but won't block startup
        return {
          redis: {
            host: redisHost || 'localhost',
            port: redisPort,
            password: configService.get('REDIS_PASSWORD'),
            maxRetriesPerRequest: 3,
            enableReadyCheck: false, // Don't wait for Redis to be ready
            connectTimeout: 5000, // 5 second connection timeout
            lazyConnect: true, // Don't connect immediately
            retryStrategy: (times) => {
              // Stop retrying after 3 attempts to avoid blocking
              if (times > 3) {
                return null;
              }
              return Math.min(times * 100, 1000);
            },
          },
        };
      },
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
    NotificationsModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: RLSInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply sanitization middleware to all routes
    consumer.apply(SanitizeMiddleware).forRoutes('*');
  }
}