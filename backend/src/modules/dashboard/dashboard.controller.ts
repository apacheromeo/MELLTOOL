import { Controller, Get, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER, UserRole.MOD)
@ApiBearerAuth()
export class DashboardController {
  private readonly logger = new Logger(DashboardController.name);

  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get dashboard overview' })
  @ApiResponse({ status: 200, description: 'Dashboard overview retrieved' })
  async getOverview() {
    return this.dashboardService.getOverview();
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get key metrics' })
  async getMetrics() {
    return this.dashboardService.getMetrics();
  }

  @Get('recent-activities')
  @ApiOperation({ summary: 'Get recent activities' })
  async getRecentActivities() {
    return this.dashboardService.getRecentActivities();
  }

  @Get('charts/inventory-value')
  @ApiOperation({ summary: 'Get inventory value chart data' })
  async getInventoryValueChart() {
    return this.dashboardService.getInventoryValueChart();
  }

  @Get('charts/stock-movements')
  @ApiOperation({ summary: 'Get stock movements chart data' })
  async getStockMovementsChart() {
    return this.dashboardService.getStockMovementsChart();
  }

  @Get('charts/category-distribution')
  @ApiOperation({ summary: 'Get category distribution chart data' })
  async getCategoryDistribution() {
    return this.dashboardService.getCategoryDistribution();
  }
}


