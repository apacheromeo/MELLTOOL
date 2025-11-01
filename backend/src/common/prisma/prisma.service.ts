import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
      ],
    });

    // Log database queries in development
    if (process.env.NODE_ENV === 'development') {
      (this.$on as any)('query', (e: any) => {
        this.logger.debug(`Query: ${e.query}`);
        this.logger.debug(`Params: ${e.params}`);
        this.logger.debug(`Duration: ${e.duration}ms`);
      });
    }

    (this.$on as any)('error', (e: any) => {
      this.logger.error('Database error:', e);
    });

    (this.$on as any)('warn', (e: any) => {
      this.logger.warn('Database warning:', e);
    });

    (this.$on as any)('info', (e: any) => {
      this.logger.log('Database info:', e);
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Database connected successfully');
    } catch (error) {
      this.logger.error('❌ Failed to connect to database:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('🔌 Database disconnected');
  }

  async enableShutdownHooks(app: any) {
    (this.$on as any)('beforeExit', async () => {
      await app.close();
    });
  }
}
