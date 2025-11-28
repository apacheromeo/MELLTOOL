import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Delete,
  Patch,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SalesService } from './sales.service';
import {
  CreateSalesOrderDto,
  AddItemDto,
  ScanBarcodeDto,
  ConfirmSaleDto,
  UpdateItemDto,
  UpdateOrderDto,
  CancelOrderDto,
  ReturnOrderDto,
} from './dto';
import { SearchPosProductsDto } from './dto/search-pos-products.dto';
import { ApplyDiscountDto } from './dto/apply-discount.dto';
import { QuickStartDto } from './dto/quick-start.dto';
import { AutocompleteDto } from './dto/autocomplete.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * Sales Controller
 * Handles all POS (Point of Sale) HTTP endpoints
 */
@ApiTags('Sales / POS')
@Controller('sales')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  /**
   * 🚀 GET /api/sales/pos/quick-start
   * SUPER SMART: Get everything staff needs in ONE call!
   */
  @Get('pos/quick-start')
  @ApiOperation({
    summary: 'Quick Start - Get trending, recent, categories, brands in one call',
    description: 'Lightning fast! Load POS homepage with all data in a single request.'
  })
  @ApiResponse({ status: 200, description: 'Complete POS data' })
  @ApiQuery({ name: 'query', required: false, type: String })
  @ApiQuery({ name: 'trendingLimit', required: false, type: Number })
  @ApiQuery({ name: 'recentLimit', required: false, type: Number })
  async quickStart(@Request() req: any, @Query() dto: QuickStartDto) {
    const staffId = req.user.id;
    return this.salesService.quickStart(staffId, dto);
  }

  /**
   * ⚡ GET /api/sales/pos/autocomplete
   * INSTANT SEARCH: As user types (min 2 chars)
   */
  @Get('pos/autocomplete')
  @ApiOperation({
    summary: 'Autocomplete search - Super fast as-you-type search',
    description: 'Returns top 10 matches instantly. Minimum 2 characters.'
  })
  @ApiResponse({ status: 200, description: 'Top 10 matching products' })
  @ApiQuery({ name: 'query', required: true, type: String })
  async autocomplete(@Query() dto: AutocompleteDto) {
    return this.salesService.autocomplete(dto);
  }

  /**
   * POST /api/sales/start
   * Create a new draft sales order
   */
  @Post('start')
  @ApiOperation({ summary: 'Start a new sales order (draft)' })
  @ApiResponse({ status: 201, description: 'Sales order created' })
  async startSale(@Request() req: any, @Body() dto: CreateSalesOrderDto) {
    const staffId = req.user.id;
    return this.salesService.startSale(staffId, dto);
  }

  /**
   * POST /api/sales/add-item
   * Add an item to the sales order by SKU/barcode
   */
  @Post('add-item')
  @ApiOperation({ summary: 'Add item to sales order' })
  @ApiResponse({ status: 200, description: 'Item added successfully' })
  @ApiResponse({ status: 404, description: 'Product or order not found' })
  @ApiResponse({ status: 400, description: 'Insufficient stock or invalid order status' })
  async addItem(@Body() dto: AddItemDto) {
    return this.salesService.addItem(dto);
  }

  /**
   * POST /api/sales/scan
   * Scan a barcode - auto-detect product or order number
   */
  @Post('scan')
  @ApiOperation({ summary: 'Scan barcode (product or order number)' })
  @ApiResponse({ status: 200, description: 'Barcode processed' })
  async scanBarcode(@Body() dto: ScanBarcodeDto) {
    return this.salesService.scanBarcode(dto);
  }

  /**
   * PATCH /api/sales/item
   * Update an existing sales item (quantity or price)
   */
  @Patch('item')
  @ApiOperation({ summary: 'Update sales item quantity or price' })
  @ApiResponse({ status: 200, description: 'Item updated' })
  async updateItem(@Body() dto: UpdateItemDto) {
    return this.salesService.updateItem(dto);
  }

  /**
   * DELETE /api/sales/item/:itemId
   * Remove an item from the sales order
   */
  @Delete('item/:itemId')
  @ApiOperation({ summary: 'Remove item from sales order' })
  @ApiResponse({ status: 200, description: 'Item removed' })
  async removeItem(@Param('itemId') itemId: string) {
    return this.salesService.removeItem(itemId);
  }

  /**
   * POST /api/sales/confirm
   * Confirm the sale - cut stock and finalize transaction
   */
  @Post('confirm')
  @ApiOperation({ summary: 'Confirm sale and cut stock' })
  @ApiResponse({ status: 200, description: 'Sale confirmed, stock updated' })
  @ApiResponse({ status: 400, description: 'Insufficient stock or invalid order' })
  async confirmSale(@Body() dto: ConfirmSaleDto) {
    return this.salesService.confirmSale(dto);
  }

  /**
   * PATCH /api/sales/:orderId
   * Update order metadata (customer info, payment method, notes)
   */
  @Patch(':orderId')
  @ApiOperation({ summary: 'Update order metadata' })
  @ApiResponse({ status: 200, description: 'Order updated successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async updateOrder(
    @Param('orderId') orderId: string,
    @Body() dto: UpdateOrderDto,
  ) {
    return this.salesService.updateOrder(orderId, dto);
  }

  /**
   * POST /api/sales/:orderId/cancel
   * Cancel an order with reason (supports both DRAFT and CONFIRMED orders)
   * For CONFIRMED orders, restores stock to inventory
   */
  @Post(':orderId/cancel')
  @ApiOperation({ summary: 'Cancel a sales order with reason' })
  @ApiResponse({ status: 200, description: 'Order canceled and stock restored (if applicable)' })
  @ApiResponse({ status: 400, description: 'Order already canceled or requires approval' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async cancelOrder(
    @Param('orderId') orderId: string,
    @Body() dto: { reason?: string; requiresApproval?: boolean },
    @Request() req: any,
  ) {
    const userRole = req.user?.role;
    const cancelDto: CancelOrderDto = {
      orderId,
      reason: dto.reason,
      requiresApproval: dto.requiresApproval,
    };
    return this.salesService.cancelOrderWithReason(cancelDto, userRole);
  }

  /**
   * POST /api/sales/:orderId/return
   * Mark order as returned to warehouse
   * Restores stock and tracks shipping cost for expense management
   */
  @Post(':orderId/return')
  @ApiOperation({ summary: 'Mark order as returned to warehouse' })
  @ApiResponse({ status: 200, description: 'Order marked as returned, stock restored' })
  @ApiResponse({ status: 400, description: 'Only confirmed orders can be returned' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async returnOrder(
    @Param('orderId') orderId: string,
    @Body() dto: { shippingCost?: number; reason?: string },
  ) {
    const returnDto: ReturnOrderDto = {
      orderId,
      shippingCost: dto.shippingCost,
      reason: dto.reason,
    };
    return this.salesService.returnOrder(returnDto);
  }

  /**
   * GET /api/sales/report/daily
   * Get daily sales report
   * NOTE: Must come BEFORE :orderId route to avoid route collision
   */
  @Get('report/daily')
  @ApiOperation({ summary: 'Get daily sales report' })
  @ApiResponse({ status: 200, description: 'Daily sales summary' })
  async getDailyReport(@Query('date') date?: string) {
    try {
      const reportDate = date ? new Date(date) : new Date();
      return await this.salesService.getDailyReport(reportDate);
    } catch (error) {
      throw new Error(`Failed to get daily report: ${error.message}`);
    }
  }

  /**
   * GET /api/sales/report/weekly
   * Get weekly sales report
   */
  @Get('report/weekly')
  @ApiOperation({ summary: 'Get weekly sales report' })
  @ApiResponse({ status: 200, description: 'Weekly sales summary' })
  async getWeeklyReport(@Query('date') date?: string) {
    const reportDate = date ? new Date(date) : new Date();
    return this.salesService.getWeeklyReport(reportDate);
  }

  /**
   * GET /api/sales/report/monthly
   * Get monthly sales report
   */
  @Get('report/monthly')
  @ApiOperation({ summary: 'Get monthly sales report' })
  @ApiResponse({ status: 200, description: 'Monthly sales summary' })
  async getMonthlyReport(
    @Query('year') year?: number,
    @Query('month') month?: number,
  ) {
    const reportYear = year || new Date().getFullYear();
    const reportMonth = month || new Date().getMonth() + 1;
    return this.salesService.getMonthlyReport(reportYear, reportMonth);
  }

  /**
   * GET /api/sales/by-order-number/:orderNumber
   * Get sales order by order number (for QR code matching)
   */
  @Get('by-order-number/:orderNumber')
  @ApiOperation({ summary: 'Get sales order by order number' })
  @ApiResponse({ status: 200, description: 'Order details' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getOrderByNumber(@Param('orderNumber') orderNumber: string) {
    return this.salesService.getOrderByNumber(orderNumber);
  }

  /**
   * GET /api/sales (no path)
   * Get sales history with filters
   * NOTE: Must come BEFORE :orderId route
   */
  @Get()
  @ApiOperation({ summary: 'Get sales history' })
  @ApiResponse({ status: 200, description: 'Sales history with pagination' })
  async getSalesHistory(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('staffId') staffId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      // Filter out "undefined" string that may come from frontend
      const cleanStatus = status === 'undefined' ? undefined : status;
      const cleanStaffId = staffId === 'undefined' ? undefined : staffId;

      return await this.salesService.getSalesHistory({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        status: cleanStatus,
        staffId: cleanStaffId,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      });
    } catch (error) {
      throw new Error(`Failed to get sales history: ${error.message}`);
    }
  }

  /**
   * GET /api/sales/pos/products/search
   * Search products for POS (fast, optimized for quick add)
   */
  @Get('pos/products/search')
  @ApiOperation({ summary: 'Search products for POS with advanced filters' })
  @ApiResponse({ status: 200, description: 'Products found' })
  @ApiQuery({ name: 'query', required: false, type: String })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @ApiQuery({ name: 'brandId', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'inStockOnly', required: false, type: Boolean })
  async searchPosProducts(@Query() searchDto: SearchPosProductsDto) {
    return this.salesService.searchPosProducts(searchDto);
  }

  /**
   * GET /api/sales/pos/products/trending
   * Get trending products (most sold in last 30 days)
   */
  @Get('pos/products/trending')
  @ApiOperation({ summary: 'Get trending/popular products' })
  @ApiResponse({ status: 200, description: 'Trending products with sales data' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getTrendingProducts(@Query('limit') limit?: number) {
    return this.salesService.getTrendingProducts(limit || 10);
  }

  /**
   * GET /api/sales/pos/products/recent
   * Get recently sold products for quick repeat orders
   */
  @Get('pos/products/recent')
  @ApiOperation({ summary: 'Get recently sold products' })
  @ApiResponse({ status: 200, description: 'Recently sold products' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getRecentProducts(@Request() req: any, @Query('limit') limit?: number) {
    const staffId = req.user.id;
    return this.salesService.getRecentProducts(staffId, limit || 10);
  }

  /**
   * GET /api/sales/pos/products/category/:categoryId
   * Get products by category for category-based navigation
   */
  @Get('pos/products/category/:categoryId')
  @ApiOperation({ summary: 'Get products by category' })
  @ApiResponse({ status: 200, description: 'Products in category' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getProductsByCategory(
    @Param('categoryId') categoryId: string,
    @Query('limit') limit?: number,
  ) {
    return this.salesService.getProductsByCategory(categoryId, limit || 20);
  }

  /**
   * GET /api/sales/:orderId
   * Get sales order details
   * NOTE: MUST be LAST among GET routes to avoid catching other paths
   */
  @Get(':orderId')
  @ApiOperation({ summary: 'Get sales order by ID' })
  @ApiResponse({ status: 200, description: 'Order details' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getOrder(@Param('orderId') orderId: string) {
    return this.salesService.getOrderById(orderId);
  }

  /**
   * POST /api/sales/discount
   * Apply discount to order (percentage or fixed amount)
   */
  @Post('discount')
  @ApiOperation({ summary: 'Apply discount to order' })
  @ApiResponse({ status: 200, description: 'Discount applied successfully' })
  @ApiResponse({ status: 400, description: 'Invalid discount parameters' })
  async applyDiscount(@Body() dto: ApplyDiscountDto) {
    return this.salesService.applyDiscount(dto);
  }
}



