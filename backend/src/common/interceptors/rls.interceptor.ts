import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../prisma/prisma.service';

/**
 * RLS (Row Level Security) Interceptor
 *
 * This interceptor sets the database session context for RLS policies
 * before each request is processed. It extracts the user information
 * from the authenticated request and sets it in PostgreSQL session variables.
 *
 * The RLS policies use these session variables to enforce row-level access control.
 */
@Injectable()
export class RLSInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RLSInterceptor.name);

  constructor(private readonly prisma: PrismaService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // If user is authenticated, set RLS context
    if (user && user.id && user.role) {
      try {
        await this.prisma.setRLSContext(user.id, user.role);
        this.logger.debug(`RLS context set for user ${user.id} with role ${user.role}`);
      } catch (error) {
        this.logger.error('Failed to set RLS context:', error);
        // Continue anyway - let the request fail naturally if RLS is critical
      }
    } else {
      this.logger.debug('No authenticated user - RLS context not set');
    }

    return next.handle().pipe(
      tap(() => {
        // Clean up RLS context after request (optional, as it's session-scoped)
        if (user && user.id) {
          // Note: We don't await this to avoid blocking the response
          this.prisma.clearRLSContext().catch((error) => {
            this.logger.error('Failed to clear RLS context:', error);
          });
        }
      }),
    );
  }
}
