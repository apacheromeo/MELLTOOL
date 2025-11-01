import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Logger,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';

import { ShopeeService } from './shopee.service';
import { ShopeeAuthService } from './shopee-auth.service';
import { ShopeeSyncService } from './shopee-sync.service';
import { ShopeeWebhookService } from './shopee-webhook.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('shopee')
@Controller('shopee')
export class ShopeeController {
  private readonly logger = new Logger(ShopeeController.name);

  constructor(
    private readonly shopeeService: ShopeeService,
    private readonly shopeeAuthService: ShopeeAuthService,
    private readonly shopeeSyncService: ShopeeSyncService,
    private readonly shopeeWebhookService: ShopeeWebhookService,
  ) {}

  @Get('auth/url')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Shopee OAuth authorization URL' })
  @ApiResponse({ status: 200, description: 'Authorization URL generated' })
  getAuthUrl(@Request() req) {
    this.logger.log(`Generating Shopee auth URL for user: ${req.user.email}`);
    return this.shopeeAuthService.getAuthorizationUrl();
  }

  @Get('auth/callback')
  @ApiOperation({ summary: 'Shopee OAuth callback' })
  @ApiResponse({ status: 302, description: 'Redirect to frontend' })
  async handleCallback(
    @Query('code') code: string,
    @Query('shop_id') shopId: string,
    @Res() res: Response,
  ) {
    try {
      this.logger.log(`Shopee OAuth callback received for shop: ${shopId}`);
      
      const result = await this.shopeeAuthService.handleCallback(code, shopId);
      
      // Redirect to frontend with success
      return res.redirect(
        `${process.env.FRONTEND_URL}/settings/shopee?status=success&shop_id=${shopId}`
      );
    } catch (error) {
      this.logger.error(`Shopee OAuth callback error: ${error.message}`, error);
      
      // Redirect to frontend with error
      return res.redirect(
        `${process.env.FRONTEND_URL}/settings/shopee?status=error&message=${encodeURIComponent(error.message)}`
      );
    }
  }

  @Post('shops/:shopId/connect')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Connect Shopee shop (Owner only)' })
  @ApiResponse({ status: 200, description: 'Shop connected successfully' })
  async connectShop(
    @Param('shopId') shopId: string,
    @Body() body: { code: string },
    @Request() req,
  ) {
    this.logger.log(`Connecting Shopee shop: ${shopId} by user: ${req.user.email}`);
    return this.shopeeAuthService.connectShop(shopId, body.code, req.user.id);
  }

  @Get('shops')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all connected Shopee shops' })
  @ApiResponse({ status: 200, description: 'Shops retrieved successfully' })
  async getShops(@Request() req) {
    return this.shopeeService.getShops(req.user.id);
  }

  @Get('shops/:shopId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Shopee shop details' })
  @ApiResponse({ status: 200, description: 'Shop details retrieved' })
  async getShop(@Param('shopId') shopId: string) {
    return this.shopeeService.getShop(shopId);
  }

  @Post('shops/:shopId/sync/catalog')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.OWNER, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sync catalog from Shopee' })
  @ApiResponse({ status: 200, description: 'Catalog sync started' })
  async syncCatalog(@Param('shopId') shopId: string, @Request() req) {
    this.logger.log(`Starting catalog sync for shop: ${shopId} by user: ${req.user.email}`);
    return this.shopeeSyncService.syncCatalog(shopId);
  }

  @Post('shops/:shopId/sync/stock')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.OWNER, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sync stock to Shopee' })
  @ApiResponse({ status: 200, description: 'Stock sync started' })
  async syncStock(@Param('shopId') shopId: string, @Request() req) {
    this.logger.log(`Starting stock sync for shop: ${shopId} by user: ${req.user.email}`);
    return this.shopeeSyncService.syncStock(shopId);
  }

  @Post('shops/:shopId/sync/full')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.OWNER, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Full sync (catalog + stock)' })
  @ApiResponse({ status: 200, description: 'Full sync started' })
  async fullSync(@Param('shopId') shopId: string, @Request() req) {
    this.logger.log(`Starting full sync for shop: ${shopId} by user: ${req.user.email}`);
    return this.shopeeSyncService.fullSync(shopId);
  }

  @Get('shops/:shopId/sync/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get sync status' })
  @ApiResponse({ status: 200, description: 'Sync status retrieved' })
  async getSyncStatus(@Param('shopId') shopId: string) {
    return this.shopeeSyncService.getSyncStatus(shopId);
  }

  @Get('shops/:shopId/items')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Shopee items for shop' })
  @ApiResponse({ status: 200, description: 'Items retrieved successfully' })
  async getShopItems(
    @Param('shopId') shopId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.shopeeService.getShopItems(shopId, page, limit);
  }

  @Post('shops/:shopId/items/:itemId/link')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.OWNER, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Link Shopee item to product' })
  @ApiResponse({ status: 200, description: 'Item linked successfully' })
  async linkItemToProduct(
    @Param('shopId') shopId: string,
    @Param('itemId') itemId: string,
    @Body('productId') productId: string,
    @Request() req,
  ) {
    this.logger.log(`Linking Shopee item ${itemId} to product ${productId} by user: ${req.user.email}`);
    return this.shopeeService.linkItemToProduct(shopId, itemId, productId);
  }

  @Post('shops/:shopId/disconnect')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disconnect Shopee shop (Owner only)' })
  @ApiResponse({ status: 200, description: 'Shop disconnected successfully' })
  async disconnectShop(@Param('shopId') shopId: string, @Request() req) {
    this.logger.log(`Disconnecting Shopee shop: ${shopId} by user: ${req.user.email}`);
    return this.shopeeService.disconnectShop(shopId);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Shopee webhook endpoint' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async handleWebhook(@Body() body: any) {
    this.logger.log(`Shopee webhook received: ${JSON.stringify(body)}`);
    return this.shopeeWebhookService.handleWebhook(body);
  }

  @Get('shops/:shopId/logs')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get sync logs for shop' })
  @ApiResponse({ status: 200, description: 'Logs retrieved successfully' })
  async getSyncLogs(
    @Param('shopId') shopId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.shopeeService.getSyncLogs(shopId, page, limit);
  }
}
