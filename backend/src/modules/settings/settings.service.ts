import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async findAll() {
    return this.prisma.setting.findMany({
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });
  }

  async getPublicSettings() {
    const cacheKey = 'settings:public';
    
    return this.redis.cache(cacheKey, async () => {
      return this.prisma.setting.findMany({
        where: { isPublic: true },
        select: { key: true, value: true, description: true },
      });
    }, 3600); // 1 hour cache
  }

  async findOne(key: string) {
    const setting = await this.prisma.setting.findUnique({
      where: { key },
    });

    if (!setting) {
      throw new NotFoundException(`Setting with key '${key}' not found`);
    }

    return setting;
  }

  async upsert(data: {
    key: string;
    value: string;
    description?: string;
    category?: string;
    isPublic?: boolean;
  }) {
    const setting = await this.prisma.setting.upsert({
      where: { key: data.key },
      update: {
        value: data.value,
        description: data.description,
        category: data.category,
        isPublic: data.isPublic,
      },
      create: data,
    });

    // Clear cache
    await this.redis.del('settings:public');

    return setting;
  }

  async update(key: string, value: string) {
    const setting = await this.prisma.setting.update({
      where: { key },
      data: { value },
    });

    // Clear cache
    await this.redis.del('settings:public');

    return setting;
  }

  async remove(key: string) {
    await this.prisma.setting.delete({
      where: { key },
    });

    // Clear cache
    await this.redis.del('settings:public');

    return { message: 'Setting deleted successfully' };
  }

  async getValue(key: string, defaultValue?: string): Promise<string | null> {
    try {
      const setting = await this.findOne(key);
      return setting.value;
    } catch (error) {
      return defaultValue || null;
    }
  }
}


