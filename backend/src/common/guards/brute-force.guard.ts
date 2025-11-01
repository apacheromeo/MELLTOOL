import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { Request } from 'express';

@Injectable()
export class BruteForceGuard implements CanActivate {
  private readonly logger = new Logger(BruteForceGuard.name);

  constructor(private readonly redis: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const ip = this.getClientIp(request);
    const email = request.body?.email;

    // Track attempts by IP and email
    const ipKey = `login_attempts_ip:${ip}`;
    const emailKey = email ? `login_attempts_email:${email}` : null;

    // Check IP-based attempts
    const ipAttempts = await this.redis.get(ipKey);
    const ipAttemptCount = ipAttempts ? parseInt(ipAttempts, 10) : 0;

    if (ipAttemptCount >= 10) {
      // Block IP for 1 hour after 10 attempts
      this.logger.warn(`IP blocked due to too many login attempts: ${ip}`);
      throw new HttpException(
        'Too many login attempts. Please try again after 1 hour.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Check email-based attempts
    if (emailKey) {
      const emailAttempts = await this.redis.get(emailKey);
      const emailAttemptCount = emailAttempts ? parseInt(emailAttempts, 10) : 0;

      if (emailAttemptCount >= 5) {
        // Block email for 30 minutes after 5 failed attempts
        const lockoutTime = await this.redis.ttl(emailKey);
        this.logger.warn(
          `Email blocked due to too many login attempts: ${email}`,
        );
        throw new HttpException(
          `Account temporarily locked due to multiple failed login attempts. Please try again in ${Math.ceil(lockoutTime / 60)} minutes.`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    return true;
  }

  async recordFailedAttempt(request: Request, email?: string): Promise<void> {
    const ip = this.getClientIp(request);
    const ipKey = `login_attempts_ip:${ip}`;
    const emailKey = email ? `login_attempts_email:${email}` : null;

    // Increment IP attempts (expire in 1 hour)
    const ipAttempts = await this.redis.get(ipKey);
    const ipAttemptCount = ipAttempts ? parseInt(ipAttempts, 10) : 0;
    await this.redis.set(ipKey, (ipAttemptCount + 1).toString(), 3600); // 1 hour

    // Increment email attempts (expire in 30 minutes)
    if (emailKey) {
      const emailAttempts = await this.redis.get(emailKey);
      const emailAttemptCount = emailAttempts
        ? parseInt(emailAttempts, 10)
        : 0;
      await this.redis.set(emailKey, (emailAttemptCount + 1).toString(), 1800); // 30 minutes
    }
  }

  async clearAttempts(request: Request, email?: string): Promise<void> {
    const ip = this.getClientIp(request);
    const ipKey = `login_attempts_ip:${ip}`;
    const emailKey = email ? `login_attempts_email:${email}` : null;

    await this.redis.del(ipKey);
    if (emailKey) {
      await this.redis.del(emailKey);
    }
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
