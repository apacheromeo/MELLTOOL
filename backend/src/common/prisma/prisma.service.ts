import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    // Fix for connection pooling - add pgbouncer=true if not present
    let databaseUrl = process.env.DATABASE_URL;
    if (databaseUrl && !databaseUrl.includes('pgbouncer=true')) {
      const separator = databaseUrl.includes('?') ? '&' : '?';
      databaseUrl = `${databaseUrl}${separator}pgbouncer=true`;
    }

    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
      ],
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
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
      // Don't throw - allow app to start for health checks
      // The app will fail when trying to use Prisma, but health endpoint will work
      this.logger.warn('⚠️  App starting without database connection - some features will fail');
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

  /**
   * Set RLS (Row Level Security) context for the current database session
   * This must be called before any query to enforce RLS policies
   * @param userId - The current user's ID
   * @param userRole - The current user's role (OWNER, MOD, STAFF)
   */
  async setRLSContext(userId: string, userRole: string) {
    await this.$executeRaw`SELECT set_config('app.user_id', ${userId}, true)`;
    await this.$executeRaw`SELECT set_config('app.user_role', ${userRole}, true)`;
  }

  /**
   * Clear RLS context (useful for cleanup)
   */
  async clearRLSContext() {
    await this.$executeRaw`SELECT set_config('app.user_id', '', true)`;
    await this.$executeRaw`SELECT set_config('app.user_role', '', true)`;
  }
}
