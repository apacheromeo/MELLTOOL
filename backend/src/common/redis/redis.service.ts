import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  constructor(private configService: ConfigService) {
    const redisUrl = this.configService.get('app.redis.url');

    if (redisUrl) {
      this.client = new Redis(redisUrl);
    } else {
      this.client = new Redis({
        host: this.configService.get('app.redis.host', 'localhost'),
        port: this.configService.get('app.redis.port', 6379),
        password: this.configService.get('app.redis.password'),
        retryStrategy: (times) => {
          // Stop retrying after 3 attempts
          if (times > 3) {
            this.logger.warn('⚠️ Redis unavailable - continuing without cache');
            return null;
          }
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
        lazyConnect: true, // Don't connect immediately
      });
    }

    // Try to connect, but don't fail if Redis is unavailable
    this.client.connect().catch((error) => {
      this.logger.warn('⚠️ Redis connection failed - running without cache:', error.message);
    });

    this.client.on('connect', () => {
      this.logger.log('✅ Redis connected successfully');
    });

    this.client.on('error', (error) => {
      this.logger.warn('⚠️ Redis error (non-critical):', error.message);
    });

    this.client.on('close', () => {
      this.logger.warn('🔌 Redis connection closed');
    });
  }

  async onModuleDestroy() {
    await this.client.quit();
    this.logger.log('🔌 Redis disconnected');
  }

  // Check if Redis is connected
  isConnected(): boolean {
    return this.client.status === 'ready' || this.client.status === 'connect';
  }

  // Basic operations
  async get(key: string): Promise<string | null> {
    try {
      if (!this.isConnected()) {
        this.logger.warn('Redis not connected, skipping get operation');
        return null;
      }
      return await this.client.get(key);
    } catch (error) {
      this.logger.warn(`Redis get failed for key ${key}:`, error.message);
      return null;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<'OK' | null> {
    try {
      if (!this.isConnected()) {
        this.logger.warn('Redis not connected, skipping set operation');
        return null;
      }
      if (ttl) {
        return await this.client.setex(key, ttl, value);
      }
      return await this.client.set(key, value);
    } catch (error) {
      this.logger.warn(`Redis set failed for key ${key}:`, error.message);
      return null;
    }
  }

  async del(key: string): Promise<number> {
    try {
      if (!this.isConnected()) {
        this.logger.warn('Redis not connected, skipping del operation');
        return 0;
      }
      return await this.client.del(key);
    } catch (error) {
      this.logger.warn(`Redis del failed for key ${key}:`, error.message);
      return 0;
    }
  }

  async exists(key: string): Promise<number> {
    try {
      if (!this.isConnected()) {
        this.logger.warn('Redis not connected, skipping exists operation');
        return 0;
      }
      return await this.client.exists(key);
    } catch (error) {
      this.logger.warn(`Redis exists failed for key ${key}:`, error.message);
      return 0;
    }
  }

  // Hash operations
  async hget(key: string, field: string): Promise<string | null> {
    return this.client.hget(key, field);
  }

  async hset(key: string, field: string, value: string): Promise<number> {
    return this.client.hset(key, field, value);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return this.client.hgetall(key);
  }

  async hdel(key: string, field: string): Promise<number> {
    return this.client.hdel(key, field);
  }

  // List operations
  async lpush(key: string, ...values: string[]): Promise<number> {
    return this.client.lpush(key, ...values);
  }

  async rpush(key: string, ...values: string[]): Promise<number> {
    return this.client.rpush(key, ...values);
  }

  async lpop(key: string): Promise<string | null> {
    return this.client.lpop(key);
  }

  async rpop(key: string): Promise<string | null> {
    return this.client.rpop(key);
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    return this.client.lrange(key, start, stop);
  }

  // Set operations
  async sadd(key: string, ...members: string[]): Promise<number> {
    return this.client.sadd(key, ...members);
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    return this.client.srem(key, ...members);
  }

  async smembers(key: string): Promise<string[]> {
    return this.client.smembers(key);
  }

  async sismember(key: string, member: string): Promise<number> {
    return this.client.sismember(key, member);
  }

  // Expiration
  async expire(key: string, seconds: number): Promise<number> {
    try {
      if (!this.isConnected()) {
        this.logger.warn('Redis not connected, skipping expire operation');
        return 0;
      }
      return await this.client.expire(key, seconds);
    } catch (error) {
      this.logger.warn(`Redis expire failed for key ${key}:`, error.message);
      return 0;
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      if (!this.isConnected()) {
        this.logger.warn('Redis not connected, skipping ttl operation');
        return -2; // Redis returns -2 for non-existent keys
      }
      return await this.client.ttl(key);
    } catch (error) {
      this.logger.warn(`Redis ttl failed for key ${key}:`, error.message);
      return -2;
    }
  }

  // JSON operations (for complex data)
  async setJson(key: string, value: any, ttl?: number): Promise<'OK'> {
    const jsonString = JSON.stringify(value);
    return this.set(key, jsonString, ttl);
  }

  async getJson<T>(key: string): Promise<T | null> {
    const jsonString = await this.get(key);
    if (!jsonString) return null;
    
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      this.logger.error(`Failed to parse JSON for key ${key}:`, error);
      return null;
    }
  }

  // Cache helpers
  async cache<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 3600
  ): Promise<T> {
    const cached = await this.getJson<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await fetcher();
    await this.setJson(key, data, ttl);
    return data;
  }

  // Clear cache by pattern
  async clearPattern(pattern: string): Promise<void> {
    const keys = await this.client.keys(pattern);
    if (keys.length > 0) {
      await this.client.del(...keys);
    }
  }
}
