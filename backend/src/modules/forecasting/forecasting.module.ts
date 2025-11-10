import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';

import { PrismaModule } from '@/common/prisma/prisma.module';
import { ForecastingController } from './forecasting.controller';
import { ForecastingService } from './forecasting.service';
import { StockPredictionService } from './stock-prediction.service';
import { PromotionForecastService } from './promotion-forecast.service';
import { TrendAnalysisService } from './trend-analysis.service';
import { ReorderPointService } from './reorder-point.service';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: 'forecasting',
    }),
  ],
  controllers: [ForecastingController],
  providers: [
    ForecastingService,
    StockPredictionService,
    PromotionForecastService,
    TrendAnalysisService,
    ReorderPointService,
  ],
  exports: [ForecastingService, StockPredictionService],
})
export class ForecastingModule {}
