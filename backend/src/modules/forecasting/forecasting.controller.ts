import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

import { ForecastingService } from './forecasting.service';
import { StockPredictionService } from './stock-prediction.service';
import { PromotionForecastService } from './promotion-forecast.service';
import { TrendAnalysisService } from './trend-analysis.service';
import { ReorderPointService } from './reorder-point.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('forecasting')
@Controller('forecasting')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ForecastingController {
  private readonly logger = new Logger(ForecastingController.name);

  constructor(
    private readonly forecastingService: ForecastingService,
    private readonly stockPredictionService: StockPredictionService,
    private readonly promotionForecastService: PromotionForecastService,
    private readonly trendAnalysisService: TrendAnalysisService,
    private readonly reorderPointService: ReorderPointService,
  ) {}

  @Get('predict/:productId')
  @ApiOperation({ summary: 'Get stock prediction for a product' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Forecast days ahead' })
  @ApiResponse({ status: 200, description: 'Prediction generated successfully' })
  async predictStock(
    @Param('productId') productId: string,
    @Query('days') days: number = 30,
  ) {
    this.logger.log(`Generating stock prediction for product: ${productId}`);
    return this.stockPredictionService.predictStock(productId, days);
  }

  @Get('predict/all')
  @ApiOperation({ summary: 'Get stock predictions for all products' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Predictions generated successfully' })
  async predictAllProducts(@Query('days') days: number = 30) {
    this.logger.log('Generating stock predictions for all products');
    return this.stockPredictionService.predictAllProducts(days);
  }

  @Post('promotion/forecast')
  @Roles(UserRole.OWNER, UserRole.STAFF)
  @ApiOperation({ summary: 'Forecast stock needs for promotion day' })
  @ApiResponse({ status: 200, description: 'Promotion forecast generated' })
  async forecastPromotion(
    @Body() body: {
      promotionDate: string;
      promotionType: string;
      expectedMultiplier?: number;
      productIds?: string[];
    },
  ) {
    this.logger.log(`Generating promotion forecast for: ${body.promotionDate}`);
    return this.promotionForecastService.forecastPromotion(
      new Date(body.promotionDate),
      body.promotionType,
      body.expectedMultiplier,
      body.productIds,
    );
  }

  @Get('promotion/templates')
  @ApiOperation({ summary: 'Get promotion templates (11/11, Black Friday, etc.)' })
  @ApiResponse({ status: 200, description: 'Templates retrieved successfully' })
  async getPromotionTemplates() {
    return this.promotionForecastService.getPromotionTemplates();
  }

  @Get('reorder-point/:productId')
  @ApiOperation({ summary: 'Calculate optimal reorder point for product' })
  @ApiResponse({ status: 200, description: 'Reorder point calculated' })
  async calculateReorderPoint(@Param('productId') productId: string) {
    this.logger.log(`Calculating reorder point for product: ${productId}`);
    return this.reorderPointService.calculateReorderPoint(productId);
  }

  @Get('reorder-point/all')
  @ApiOperation({ summary: 'Calculate reorder points for all products' })
  @ApiResponse({ status: 200, description: 'Reorder points calculated' })
  async calculateAllReorderPoints() {
    this.logger.log('Calculating reorder points for all products');
    return this.reorderPointService.calculateAllReorderPoints();
  }

  @Get('trends/:productId')
  @ApiOperation({ summary: 'Get trend analysis for product' })
  @ApiQuery({ name: 'period', required: false, type: String, description: 'Analysis period (7d, 30d, 90d, 1y)' })
  @ApiResponse({ status: 200, description: 'Trend analysis generated' })
  async getTrendAnalysis(
    @Param('productId') productId: string,
    @Query('period') period: string = '30d',
  ) {
    this.logger.log(`Generating trend analysis for product: ${productId}`);
    return this.trendAnalysisService.analyzeTrends(productId, period);
  }

  @Get('trends/category/:categoryId')
  @ApiOperation({ summary: 'Get trend analysis for category' })
  @ApiQuery({ name: 'period', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Category trend analysis generated' })
  async getCategoryTrends(
    @Param('categoryId') categoryId: string,
    @Query('period') period: string = '30d',
  ) {
    this.logger.log(`Generating category trend analysis: ${categoryId}`);
    return this.trendAnalysisService.analyzeCategoryTrends(categoryId, period);
  }

  @Get('insights/dashboard')
  @ApiOperation({ summary: 'Get forecasting insights for dashboard' })
  @ApiResponse({ status: 200, description: 'Dashboard insights retrieved' })
  async getDashboardInsights() {
    this.logger.log('Generating dashboard forecasting insights');
    return this.forecastingService.getDashboardInsights();
  }

  @Get('alerts/low-stock')
  @ApiOperation({ summary: 'Get low stock alerts with predictions' })
  @ApiResponse({ status: 200, description: 'Low stock alerts retrieved' })
  async getLowStockAlerts() {
    return this.forecastingService.getLowStockAlerts();
  }

  @Get('alerts/stockout-risk')
  @ApiOperation({ summary: 'Get products at risk of stockout' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Days to look ahead' })
  @ApiResponse({ status: 200, description: 'Stockout risk analysis retrieved' })
  async getStockoutRisk(@Query('days') days: number = 7) {
    return this.forecastingService.getStockoutRisk(days);
  }

  @Post('optimize/inventory')
  @Roles(UserRole.OWNER, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Get inventory optimization recommendations' })
  @ApiResponse({ status: 200, description: 'Optimization recommendations generated' })
  async optimizeInventory() {
    this.logger.log('Generating inventory optimization recommendations');
    return this.forecastingService.optimizeInventory();
  }

  @Get('seasonal-analysis')
  @ApiOperation({ summary: 'Get seasonal demand analysis' })
  @ApiResponse({ status: 200, description: 'Seasonal analysis retrieved' })
  async getSeasonalAnalysis() {
    return this.trendAnalysisService.getSeasonalAnalysis();
  }

  @Get('abc-analysis')
  @ApiOperation({ summary: 'Get ABC analysis of inventory' })
  @ApiResponse({ status: 200, description: 'ABC analysis retrieved' })
  async getABCAnalysis() {
    return this.forecastingService.getABCAnalysis();
  }
}
