import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ThrottlerGuard, ThrottlerOptions } from '@nestjs/throttler';
import { Request } from 'express';

@Injectable()
export class LoginRateLimitGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Track by email for login endpoint
    return req.body?.email || req.ip || 'unknown';
  }

  protected async throwThrottlingException(context: ExecutionContext): Promise<void> {
    throw new UnauthorizedException(
      'Too many login attempts. Please wait 15 minutes before trying again.',
    );
  }
}

// Custom rate limit configuration for login endpoint
export const loginRateLimitConfig: ThrottlerOptions = {
  ttl: 900, // 15 minutes
  limit: 5, // 5 attempts per 15 minutes
};
