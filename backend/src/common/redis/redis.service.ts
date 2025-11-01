import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  constructor(private configService: ConfigService) {
    const redisUrl = this.configService.get('redis.url');
    
    if (redisUrl) {
      this.client = new Redis(redisUrl);
    } else {
      this.client = new Redis({
        host: this.configService.get('redis.host', 'localhost'),
        port: this.configService.get('redis.port', 6379),
        password: this.configService.get('redis.password'),
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
      });
    }

    this.client.on('connect', () => {
      this.logger.log('✅ Redis connected successfully');
    });

    this.client.on('error', (error) => {
      this.logger.error('❌ Redis connection error:', error);
    });

    this.client.on('close', () => {
      this.logger.warn('🔌 Redis connection closed');
    });
  }

  async onModuleDestroy() {
    await this.client.quit();
    this.logger.log('🔌 Redis disconnected');
  }

  // Basic operations
  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<'OK'> {
    if (ttl) {
      return this.client.setex(key, ttl, value);
    }
    return this.client.set(key, value);
  }

  async del(key: string): Promise<number> {
    return this.client.del(key);
  }

  async exists(key: string): Promise<number> {
    return this.client.exists(key);
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
    return this.client.expire(key, seconds);
  }

  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
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
