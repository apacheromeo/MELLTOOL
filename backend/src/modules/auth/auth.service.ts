import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { SupabaseService } from './supabase.service';
import { RedisService } from '../../common/redis/redis.service';

import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
    private readonly jwtService: JwtService,
    private readonly redis: RedisService,
    private readonly configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    try {
      // Authenticate with Supabase
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        this.logger.warn(`Login failed for email: ${email} - ${error.message}`);
        throw new UnauthorizedException('Invalid credentials');
      }

      // Get user from database
      const user = await this.prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
        },
      });

      if (!user) {
        this.logger.warn(`User not found in database: ${email}`);
        throw new UnauthorizedException('User not found');
      }

      if (!user.isActive) {
        this.logger.warn(`Inactive user login attempt: ${email}`);
        throw new UnauthorizedException('Account is deactivated');
      }

      // Generate JWT tokens
      const payload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };

      // Generate access token with shorter expiry (15 minutes)
      const accessToken = this.jwtService.sign(payload, {
        expiresIn: '15m', // Short-lived for security
      });
      
      const refreshToken = this.jwtService.sign(payload, {
        expiresIn: '30d',
      });

      // Store refresh token in Redis
      await this.redis.set(
        `refresh_token:${user.id}`,
        refreshToken,
        30 * 24 * 60 * 60, // 30 days
      );

      this.logger.log(`Successful login for user: ${email}`);

      return {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Login error for email: ${email}`, error);
      throw new UnauthorizedException('Login failed');
    }
  }

  async register(registerDto: RegisterDto) {
    const { email, password, name, role = UserRole.STAFF } = registerDto;

    try {
      // Check if user already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new ConflictException('User already exists');
      }

      // Create user in Supabase
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        this.logger.error(`Supabase registration error: ${error.message}`);
        throw new BadRequestException('Registration failed');
      }

      // Create user in database
      const user = await this.prisma.user.create({
        data: {
          email,
          name,
          role,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });

      this.logger.log(`User registered successfully: ${email}`);

      return {
        message: 'User registered successfully',
        user,
      };
    } catch (error) {
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Registration error for email: ${email}`, error);
      throw new BadRequestException('Registration failed');
    }
  }

  async logout(userId: string, accessToken?: string) {
    try {
      // Remove refresh token from Redis
      const refreshToken = await this.redis.get(`refresh_token:${userId}`);
      if (refreshToken) {
        await this.redis.del(`refresh_token:${userId}`);
        // Blacklist refresh token
        await this.redis.set(
          `blacklisted_token:${refreshToken}`,
          userId,
          60 * 60, // 1 hour
        );
      }
      
      // Blacklist access token if provided
      if (accessToken) {
        await this.redis.set(
          `blacklisted_token:${accessToken}`,
          userId,
          15 * 60, // 15 minutes (access token expiry)
        );
      }
      
      this.logger.log(`User logged out: ${userId}`);
      
      return { message: 'Logout successful' };
    } catch (error) {
      this.logger.error(`Logout error for user: ${userId}`, error);
      throw new BadRequestException('Logout failed');
    }
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const { currentPassword, newPassword } = changePasswordDto;

    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Verify current password before allowing change
      const { error: signInError } = await this.supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        this.logger.warn(`Invalid current password attempt for user: ${user.email}`);
        throw new UnauthorizedException('Current password is incorrect');
      }

      // Update password in Supabase
      const { error } = await this.supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        this.logger.error(`Password change error: ${error.message}`);
        throw new BadRequestException('Password change failed');
      }

      this.logger.log(`Password changed for user: ${user.email}`);

      return { message: 'Password changed successfully' };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException || error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Password change error for user: ${userId}`, error);
      throw new BadRequestException('Password change failed');
    }
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const userId = payload.sub;

      // Verify refresh token exists in Redis
      const storedToken = await this.redis.get(`refresh_token:${userId}`);
      if (!storedToken || storedToken !== refreshToken) {
        this.logger.warn(`Invalid refresh token attempt for user: ${userId}`);
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Get current user to verify they're still active
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
        },
      });

      if (!user || !user.isActive) {
        // Invalidate token if user is inactive
        await this.redis.del(`refresh_token:${userId}`);
        throw new UnauthorizedException('User account is deactivated');
      }

      // Generate new access token with shorter expiry (15 minutes)
      const newPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };

      const accessToken = this.jwtService.sign(newPayload, {
        expiresIn: '15m', // Short-lived access token
      });

      // Token rotation: Generate new refresh token and invalidate old one
      const newRefreshToken = this.jwtService.sign(newPayload, {
        expiresIn: '30d',
      });

      // Store new refresh token and remove old one
      await this.redis.set(
        `refresh_token:${userId}`,
        newRefreshToken,
        30 * 24 * 60 * 60, // 30 days
      );

      // Blacklist old refresh token (optional: store for a short period to detect reuse)
      await this.redis.set(
        `blacklisted_token:${refreshToken}`,
        userId,
        60 * 60, // 1 hour - detect token reuse
      );

      this.logger.log(`Token refreshed and rotated for user: ${user.email}`);

      return {
        accessToken,
        refreshToken: newRefreshToken, // New rotated refresh token
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error('Token refresh error:', error);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async toggleUserStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    this.logger.log(`User status toggled: ${user.email} - Active: ${updatedUser.isActive}`);

    return updatedUser;
  }

  async validateUser(email: string, password: string) {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return null;
      }

      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      return user;
    } catch (error) {
      return null;
    }
  }
}
