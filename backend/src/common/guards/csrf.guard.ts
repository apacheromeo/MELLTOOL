import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { RedisService } from '../redis/redis.service';

/**
 * Simplified CSRF protection using Redis-based tokens
 * For full CSRF protection, consider using express-session with proper session storage
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  private readonly logger = new Logger(CsrfGuard.name);

  constructor(private readonly redis: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    // Skip CSRF for GET, HEAD, OPTIONS requests
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      // Generate and send CSRF token for future requests
      await this.generateToken(request, response);
      return true;
    }

    // Verify CSRF token for state-changing requests
    const tokenFromHeader = request.headers['x-csrf-token'] as string;
    const tokenFromBody = request.body?._csrf;
    const providedToken = tokenFromHeader || tokenFromBody;

    if (!providedToken) {
      this.logger.warn(
        `CSRF token missing for ${request.method} ${request.path}`,
      );
      throw new ForbiddenException('CSRF token required');
    }

    // Verify token exists in Redis (expires in 1 hour)
    const ip = this.getClientIp(request);
    const storedToken = await this.redis.get(`csrf_token:${ip}`);

    if (!storedToken || storedToken !== providedToken) {
      this.logger.warn(
        `CSRF token validation failed for ${request.method} ${request.path}`,
      );
      throw new ForbiddenException('Invalid CSRF token');
    }

    return true;
  }

  private async generateToken(request: Request, response: Response): Promise<void> {
    const ip = this.getClientIp(request);
    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    
    // Store token in Redis (expires in 1 hour)
    await this.redis.set(`csrf_token:${ip}`, token, 3600);
    
    // Send token in response header
    response.setHeader('X-CSRF-Token', token);
  }

  private getClientIp(request: Request): string {
    return (
      (request.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      (request.headers['x-real-ip'] as string) ||
      request.ip ||
      request.socket.remoteAddress ||
      'unknown'
    );
  }
}
