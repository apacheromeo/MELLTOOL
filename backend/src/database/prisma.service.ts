import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      log: process.env.NODE_ENV === 'development' 
        ? ['query', 'error', 'warn'] 
        : ['error'],
      errorFormat: 'pretty',
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Database connected successfully');
      
      // Enable query logging in development
      if (process.env.NODE_ENV === 'development') {
        this.$on('query' as never, (e: any) => {
          this.logger.debug(`Query: ${e.query}`);
          this.logger.debug(`Duration: ${e.duration}ms`);
        });
      }
    } catch (error) {
      this.logger.error('❌ Database connection failed', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }

  /**
   * Enable query result extensions for better performance
   */
  async enableShutdownHooks(app: any) {
    // Type assertion needed for Prisma event listener
    (this.$on as any)('beforeExit', async () => {
      await app.close();
    });
  }

  /**
   * Clean up old records (maintenance task)
   */
  async cleanupOldRecords() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Example: Clean up old sync logs
    const deleted = await this.shopeeSyncLog.deleteMany({
      where: {
        createdAt: {
          lt: thirtyDaysAgo,
        },
      },
    });

    this.logger.log(`Cleaned up ${deleted.count} old sync logs`);
    return deleted.count;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.error('Health check failed', error);
      return false;
    }
  }
}



