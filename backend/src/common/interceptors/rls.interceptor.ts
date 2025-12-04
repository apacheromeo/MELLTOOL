import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { ClsService } from '../cls/cls.service';

/**
 * RLS (Row Level Security) Interceptor
 *
 * This interceptor stores user context in AsyncLocalStorage (CLS) for the entire
 * request lifecycle. The PrismaService middleware will read this context and
 * set it in PostgreSQL session variables for each database query, ensuring
 * RLS policies are properly enforced on the same connection.
 */
@Injectable()
export class RLSInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RLSInterceptor.name);

  constructor(private readonly cls: ClsService) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // If user is authenticated, store context in CLS
    if (user && user.id && user.role) {
      this.logger.debug(`Storing RLS context for user ${user.id} with role ${user.role}`);
      return new Observable((subscriber) => {
        this.cls.run({ userId: user.id, userRole: user.role }, () => {
          next.handle().subscribe(subscriber);
        });
      });
    } else {
      this.logger.debug('No authenticated user - no RLS context stored');
      return next.handle();
    }
  }
}
