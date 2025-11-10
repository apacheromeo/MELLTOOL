import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { ForecastingModule } from '../forecasting/forecasting.module';
import { PrismaModule } from '@/common/prisma/prisma.module';

@Module({
  imports: [PrismaModule, ForecastingModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}


