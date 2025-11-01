import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ShopeeApiService } from './shopee-api.service';
import * as crypto from 'crypto';

@Injectable()
export class ShopeeAuthService {
  private readonly logger = new Logger(ShopeeAuthService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly shopeeApi: ShopeeApiService,
  ) {}

  getAuthorizationUrl(): { url: string; state: string } {
    const partnerId = this.configService.get('shopee.partnerId');
    const redirectUri = this.configService.get('shopee.redirectUri');
    const baseUrl = this.configService.get('shopee.baseUrl');

    // Generate random state for CSRF protection
    const state = crypto.randomBytes(16).toString('hex');

    const authUrl = `${baseUrl}/api/v2/shop/auth_partner?partner_id=${partnerId}&redirect=${encodeURIComponent(redirectUri)}&state=${state}`;

    this.logger.log('Generated Shopee authorization URL');

    return {
      url: authUrl,
      state,
    };
  }

  async handleCallback(code: string, shopId: string): Promise<any> {
    try {
      this.logger.log(`Processing Shopee OAuth callback for shop: ${shopId}`);

      // Get access token
      const tokenResponse = await this.shopeeApi.getAccessToken(code, shopId);

      if (!tokenResponse.access_token) {
        throw new BadRequestException('Failed to get access token from Shopee');
      }

      // Calculate token expiration
      const tokenExpiresAt = new Date();
      tokenExpiresAt.setSeconds(tokenExpiresAt.getSeconds() + tokenResponse.expire_in);

      // Get shop info
      const shopInfo = await this.shopeeApi.getShopInfo(
        shopId,
        tokenResponse.access_token
      );

      this.logger.log(`Successfully authenticated shop: ${shopInfo.shop_name}`);

      return {
        shopId,
        shopName: shopInfo.shop_name,
        shopRegion: shopInfo.region || 'TH',
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        tokenExpiresAt,
      };
    } catch (error) {
      this.logger.error(`OAuth callback error: ${error.message}`, error);
      throw new BadRequestException('Failed to authenticate with Shopee');
    }
  }

  async connectShop(shopId: string, code: string, userId: string) {
    try {
      const authData = await this.handleCallback(code, shopId);

      // Check if shop already exists
      const existingShop = await this.prisma.shopeeShop.findUnique({
        where: { shopId },
      });

      let shop;

      if (existingShop) {
        // Update existing shop
        shop = await this.prisma.shopeeShop.update({
          where: { shopId },
          data: {
            shopName: authData.shopName,
            shopRegion: authData.shopRegion,
            accessToken: authData.accessToken,
            refreshToken: authData.refreshToken,
            tokenExpiresAt: authData.tokenExpiresAt,
            isActive: true,
            userId,
          },
        });

        this.logger.log(`Updated existing shop: ${shop.shopName}`);
      } else {
        // Create new shop
        shop = await this.prisma.shopeeShop.create({
          data: {
            shopId,
            shopName: authData.shopName,
            shopRegion: authData.shopRegion,
            accessToken: authData.accessToken,
            refreshToken: authData.refreshToken,
            tokenExpiresAt: authData.tokenExpiresAt,
            userId,
          },
        });

        this.logger.log(`Created new shop: ${shop.shopName}`);
      }

      // Log the connection
      await this.prisma.shopeeSyncLog.create({
        data: {
          shopId: shop.id,
          action: 'SHOP_INFO_UPDATE',
          status: 'SYNCED',
          message: 'Shop connected successfully',
        },
      });

      return {
        message: 'Shop connected successfully',
        shop: {
          id: shop.id,
          shopId: shop.shopId,
          shopName: shop.shopName,
          shopRegion: shop.shopRegion,
        },
      };
    } catch (error) {
      this.logger.error(`Error connecting shop: ${error.message}`, error);
      throw new BadRequestException('Failed to connect shop');
    }
  }

  async refreshAccessToken(shopId: string): Promise<string> {
    try {
      const shop = await this.prisma.shopeeShop.findUnique({
        where: { shopId },
      });

      if (!shop) {
        throw new BadRequestException('Shop not found');
      }

      this.logger.log(`Refreshing access token for shop: ${shop.shopName}`);

      // Get new access token using refresh token
      const tokenResponse = await this.shopeeApi.refreshAccessToken(
        shop.shopId,
        shop.refreshToken
      );

      if (!tokenResponse.access_token) {
        throw new BadRequestException('Failed to refresh access token');
      }

      // Calculate new token expiration
      const tokenExpiresAt = new Date();
      tokenExpiresAt.setSeconds(tokenExpiresAt.getSeconds() + tokenResponse.expire_in);

      // Update shop with new tokens
      await this.prisma.shopeeShop.update({
        where: { shopId },
        data: {
          accessToken: tokenResponse.access_token,
          refreshToken: tokenResponse.refresh_token,
          tokenExpiresAt,
        },
      });

      // Log the token refresh
      await this.prisma.shopeeSyncLog.create({
        data: {
          shopId: shop.id,
          action: 'TOKEN_REFRESH',
          status: 'SYNCED',
          message: 'Access token refreshed successfully',
        },
      });

      this.logger.log(`Access token refreshed for shop: ${shop.shopName}`);

      return tokenResponse.access_token;
    } catch (error) {
      this.logger.error(`Error refreshing access token: ${error.message}`, error);
      
      // Log the error
      const shop = await this.prisma.shopeeShop.findUnique({
        where: { shopId },
      });

      if (shop) {
        await this.prisma.shopeeSyncLog.create({
          data: {
            shopId: shop.id,
            action: 'TOKEN_REFRESH',
            status: 'ERROR',
            message: `Failed to refresh token: ${error.message}`,
          },
        });
      }

      throw error;
    }
  }

  async getValidAccessToken(shopId: string): Promise<string> {
    const shop = await this.prisma.shopeeShop.findUnique({
      where: { shopId },
    });

    if (!shop) {
      throw new BadRequestException('Shop not found');
    }

    // Check if token is expired or will expire in the next 5 minutes
    const now = new Date();
    const expirationBuffer = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes

    if (shop.tokenExpiresAt <= expirationBuffer) {
      this.logger.log(`Token expired or expiring soon for shop: ${shop.shopName}, refreshing...`);
      return this.refreshAccessToken(shopId);
    }

    return shop.accessToken;
  }
}
