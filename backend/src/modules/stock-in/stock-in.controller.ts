import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

import { StockInService } from './stock-in.service';
import { CreateStockInDto } from './dto/create-stock-in.dto';
import { UpdateStockInDto } from './dto/update-stock-in.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('stock-in')
@Controller('stock-in')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class StockInController {
  private readonly logger = new Logger(StockInController.name);

  constructor(private readonly stockInService: StockInService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.MOD)
  @ApiOperation({ summary: 'Create stock-in order' })
  @ApiResponse({ status: 201, description: 'Stock-in created successfully' })
  async create(@Body() createStockInDto: CreateStockInDto, @Request() req) {
    this.logger.log(`Creating stock-in order by user: ${req.user.email}`);
    return this.stockInService.create(createStockInDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all stock-in orders' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'approvalStatus', required: false, type: String })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('approvalStatus') approvalStatus?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.stockInService.findAll(pageNum, limitNum, status, approvalStatus);
  }

  @Get('approvals/pending')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Get pending approval stock-ins (Owner only)' })
  @ApiResponse({ status: 200, description: 'Pending approvals retrieved successfully' })
  async getPendingApprovals(@Request() req) {
    this.logger.log(`Getting pending approvals by user: ${req.user.email}`);
    return this.stockInService.getPendingApprovals();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get stock-in order by ID' })
  @ApiResponse({ status: 200, description: 'Stock-in found' })
  @ApiResponse({ status: 404, description: 'Stock-in not found' })
  async findOne(@Param('id') id: string) {
    return this.stockInService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.MOD)
  @ApiOperation({ summary: 'Update stock-in order' })
  @ApiResponse({ status: 200, description: 'Stock-in updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() updateStockInDto: UpdateStockInDto,
    @Request() req,
  ) {
    this.logger.log(`Updating stock-in ${id} by user: ${req.user.email}`);
    return this.stockInService.update(id, updateStockInDto);
  }

  @Post(':id/receive')
  @Roles(UserRole.OWNER, UserRole.MOD)
  @ApiOperation({ summary: 'Receive stock-in order (updates product stock)' })
  @ApiResponse({ status: 200, description: 'Stock received successfully' })
  async receive(@Param('id') id: string, @Request() req) {
    this.logger.log(`Receiving stock-in ${id} by user: ${req.user.email}`);
    return this.stockInService.receive(id);
  }

  @Post(':id/cancel')
  @Roles(UserRole.OWNER, UserRole.MOD)
  @ApiOperation({ summary: 'Cancel stock-in order' })
  @ApiResponse({ status: 200, description: 'Stock-in cancelled successfully' })
  async cancel(@Param('id') id: string, @Request() req) {
    this.logger.log(`Cancelling stock-in ${id} by user: ${req.user.email}`);
    return this.stockInService.cancel(id);
  }

  @Post(':id/approve')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Approve stock-in order (Owner only)' })
  @ApiResponse({ status: 200, description: 'Stock-in approved successfully' })
  @ApiResponse({ status: 400, description: 'Cannot approve stock-in' })
  async approve(@Param('id') id: string, @Request() req) {
    this.logger.log(`Approving stock-in ${id} by user: ${req.user.email}`);
    return this.stockInService.approve(id, req.user.id);
  }

  @Post(':id/reject')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Reject stock-in order (Owner only)' })
  @ApiResponse({ status: 200, description: 'Stock-in rejected successfully' })
  @ApiResponse({ status: 400, description: 'Cannot reject stock-in' })
  async reject(
    @Param('id') id: string,
    @Body('rejectionReason') rejectionReason: string,
    @Request() req,
  ) {
    this.logger.log(`Rejecting stock-in ${id} by user: ${req.user.email} - Reason: ${rejectionReason}`);
    return this.stockInService.reject(id, req.user.id, rejectionReason);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Delete stock-in order (Owner only)' })
  @ApiResponse({ status: 200, description: 'Stock-in deleted successfully' })
  async remove(@Param('id') id: string, @Request() req) {
    this.logger.log(`Deleting stock-in ${id} by user: ${req.user.email}`);
    return this.stockInService.remove(id);
  }

  @Get('analytics/summary')
  @ApiOperation({ summary: 'Get stock-in analytics summary' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  async getAnalytics(@Query('days') days: number = 30) {
    return this.stockInService.getAnalytics(days);
  }

  @Get('supplier/:supplier')
  @ApiOperation({ summary: 'Get stock-ins by supplier' })
  async getBySupplier(@Param('supplier') supplier: string) {
    return this.stockInService.getBySupplier(supplier);
  }
}

