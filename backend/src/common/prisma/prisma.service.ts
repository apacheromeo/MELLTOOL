import { Injectable, OnModuleInit, OnModuleDestroy, Logger, Inject } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ClsService } from '../cls/cls.service';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private extendedClient: any;

  constructor(
    @Inject(ClsService)
    private readonly cls: ClsService,
  ) {
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

      // Set up extended client with RLS middleware
      this.setupRLSExtension();
    } catch (error) {
      this.logger.error('❌ Failed to connect to database:', error);
      // Don't throw - allow app to start for health checks
      // The app will fail when trying to use Prisma, but health endpoint will work
      this.logger.warn('⚠️  App starting without database connection - some features will fail');
    }
  }

  /**
   * Set up Prisma Client Extension for RLS
   * This uses the new Prisma 5+ extension API instead of deprecated $use middleware
   */
  private setupRLSExtension() {
    const self = this;

    this.extendedClient = this.$extends({
      query: {
        $allModels: {
          async $allOperations({ args, query, operation, model }) {
            // Get user context from CLS
            const userContext = self.cls.getUserContext();

            if (userContext) {
              // Set RLS context before the query runs
              try {
                await self.$executeRaw`SELECT set_config('app.user_id', ${userContext.userId}, true)`;
                await self.$executeRaw`SELECT set_config('app.user_role', ${userContext.userRole}, true)`;
                self.logger.debug(
                  `RLS context set: user=${userContext.userId}, role=${userContext.userRole}, operation=${operation}, model=${model}`
                );
              } catch (error) {
                self.logger.error('Failed to set RLS context:', error);
                // Continue with the query anyway
              }
            }

            // Execute the actual query
            return query(args);
          },
        },
      },
    });

    this.logger.log('✅ RLS extension registered via Prisma Client Extensions');

    // Override all model accessors to use extended client
    Object.keys(this).forEach((key) => {
      if (
        typeof (this as any)[key] === 'object' &&
        (this as any)[key] !== null &&
        !key.startsWith('_') &&
        !key.startsWith('$') &&
        key !== 'extendedClient' &&
        key !== 'logger' &&
        key !== 'cls'
      ) {
        Object.defineProperty(this, key, {
          get: () => (this.extendedClient as any)[key],
          enumerable: true,
          configurable: true,
        });
      }
    });
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
