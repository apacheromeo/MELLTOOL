import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class ShopeeApiService {
  private readonly logger = new Logger(ShopeeApiService.name);
  private readonly client: AxiosInstance;
  private readonly partnerId: string;
  private readonly partnerKey: string;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.partnerId = this.configService.get('shopee.partnerId');
    this.partnerKey = this.configService.get('shopee.partnerKey');
    this.baseUrl = this.configService.get('shopee.baseUrl');

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        this.logger.debug(`Shopee API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        this.logger.error('Shopee API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        this.logger.debug(`Shopee API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        this.logger.error('Shopee API Response Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  private generateSignature(path: string, timestamp: number, accessToken?: string, shopId?: string): string {
    const partnerId = parseInt(this.partnerId);
    let baseString = `${partnerId}${path}${timestamp}`;
    
    if (accessToken && shopId) {
      baseString += accessToken + shopId;
    }

    const sign = crypto
      .createHmac('sha256', this.partnerKey)
      .update(baseString)
      .digest('hex');

    return sign;
  }

  private getCommonParams(path: string, accessToken?: string, shopId?: string) {
    const timestamp = Math.floor(Date.now() / 1000);
    const sign = this.generateSignature(path, timestamp, accessToken, shopId);

    return {
      partner_id: parseInt(this.partnerId),
      timestamp,
      sign,
      ...(accessToken && { access_token: accessToken }),
      ...(shopId && { shop_id: parseInt(shopId) }),
    };
  }

  async getAccessToken(code: string, shopId: string) {
    const path = '/api/v2/auth/token/get';
    const params = this.getCommonParams(path);

    try {
      const response = await this.client.post(path, {
        code,
        shop_id: parseInt(shopId),
        partner_id: parseInt(this.partnerId),
      }, { params });

      if (response.data.error) {
        throw new Error(response.data.message || 'Failed to get access token');
      }

      return response.data;
    } catch (error) {
      this.logger.error('Error getting access token:', error);
      throw error;
    }
  }

  async refreshAccessToken(shopId: string, refreshToken: string) {
    const path = '/api/v2/auth/access_token/get';
    const params = this.getCommonParams(path);

    try {
      const response = await this.client.post(path, {
        refresh_token: refreshToken,
        shop_id: parseInt(shopId),
        partner_id: parseInt(this.partnerId),
      }, { params });

      if (response.data.error) {
        throw new Error(response.data.message || 'Failed to refresh access token');
      }

      return response.data;
    } catch (error) {
      this.logger.error('Error refreshing access token:', error);
      throw error;
    }
  }

  async getShopInfo(shopId: string, accessToken: string) {
    const path = '/api/v2/shop/get_shop_info';
    const params = this.getCommonParams(path, accessToken, shopId);

    try {
      const response = await this.client.get(path, { params });

      if (response.data.error) {
        throw new Error(response.data.message || 'Failed to get shop info');
      }

      return response.data;
    } catch (error) {
      this.logger.error('Error getting shop info:', error);
      throw error;
    }
  }

  async getItemList(shopId: string, accessToken: string, offset: number = 0, pageSize: number = 50) {
    const path = '/api/v2/product/get_item_list';
    const params = {
      ...this.getCommonParams(path, accessToken, shopId),
      offset,
      page_size: pageSize,
      item_status: 'NORMAL',
    };

    try {
      const response = await this.client.get(path, { params });

      if (response.data.error) {
        throw new Error(response.data.message || 'Failed to get item list');
      }

      return response.data.response;
    } catch (error) {
      this.logger.error('Error getting item list:', error);
      throw error;
    }
  }

  async getItemBaseInfo(shopId: string, accessToken: string, itemIds: number[]) {
    const path = '/api/v2/product/get_item_base_info';
    const params = this.getCommonParams(path, accessToken, shopId);

    try {
      const response = await this.client.get(path, {
        params: {
          ...params,
          item_id_list: itemIds.join(','),
        },
      });

      if (response.data.error) {
        throw new Error(response.data.message || 'Failed to get item base info');
      }

      return response.data.response;
    } catch (error) {
      this.logger.error('Error getting item base info:', error);
      throw error;
    }
  }

  async updateStock(shopId: string, accessToken: string, itemId: number, stock: number) {
    const path = '/api/v2/product/update_stock';
    const params = this.getCommonParams(path, accessToken, shopId);

    try {
      const response = await this.client.post(path, {
        item_id: itemId,
        stock_list: [
          {
            model_id: 0,
            normal_stock: stock,
          },
        ],
      }, { params });

      if (response.data.error) {
        throw new Error(response.data.message || 'Failed to update stock');
      }

      return response.data.response;
    } catch (error) {
      this.logger.error('Error updating stock:', error);
      throw error;
    }
  }

  async updatePrice(shopId: string, accessToken: string, itemId: number, price: number) {
    const path = '/api/v2/product/update_price';
    const params = this.getCommonParams(path, accessToken, shopId);

    try {
      const response = await this.client.post(path, {
        item_id: itemId,
        price_list: [
          {
            model_id: 0,
            original_price: price,
          },
        ],
      }, { params });

      if (response.data.error) {
        throw new Error(response.data.message || 'Failed to update price');
      }

      return response.data.response;
    } catch (error) {
      this.logger.error('Error updating price:', error);
      throw error;
    }
  }

  async getModelList(shopId: string, accessToken: string, itemId: number) {
    const path = '/api/v2/product/get_model_list';
    const params = {
      ...this.getCommonParams(path, accessToken, shopId),
      item_id: itemId,
    };

    try {
      const response = await this.client.get(path, { params });

      if (response.data.error) {
        throw new Error(response.data.message || 'Failed to get model list');
      }

      return response.data.response;
    } catch (error) {
      this.logger.error('Error getting model list:', error);
      throw error;
    }
  }

  async batchUpdateStock(shopId: string, accessToken: string, updates: Array<{ itemId: number; stock: number }>) {
    const promises = updates.map(({ itemId, stock }) =>
      this.updateStock(shopId, accessToken, itemId, stock)
    );

    try {
      const results = await Promise.allSettled(promises);
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      this.logger.log(`Batch stock update: ${successful} successful, ${failed} failed`);

      return {
        successful,
        failed,
        results,
      };
    } catch (error) {
      this.logger.error('Error in batch stock update:', error);
      throw error;
    }
  }
}
