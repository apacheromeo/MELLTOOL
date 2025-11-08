import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Get,
  Logger,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Roles } from './decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { BruteForceGuard } from '@/common/guards/brute-force.guard';
import { LoginRateLimitGuard } from '@/common/guards/login-rate-limit.guard';

@ApiTags('auth')
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly bruteForceGuard: BruteForceGuard,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(BruteForceGuard, LoginRateLimitGuard)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 429, description: 'Too many login attempts' })
  async login(@Body() loginDto: LoginDto, @Request() req) {
    this.logger.log(`Login attempt for email: ${loginDto.email}`);
    try {
      const result = await this.authService.login(loginDto);
      // Clear failed attempts on successful login
      await this.bruteForceGuard.clearAttempts(req, loginDto.email);
      return result;
    } catch (error) {
      // Record failed attempt
      await this.bruteForceGuard.recordFailedAttempt(req, loginDto.email);
      throw error;
    }
  }

  @Post('register')
  @ApiOperation({ summary: 'User registration' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async register(@Body() registerDto: RegisterDto) {
    this.logger.log(`Registration attempt for email: ${registerDto.email}`);
    return this.authService.register(registerDto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(@Request() req) {
    this.logger.log(`Logout for user: ${req.user.email}`);
    // Extract access token from Authorization header
    const authHeader = req.headers.authorization;
    const accessToken = authHeader?.replace('Bearer ', '');
    return this.authService.logout(req.user.id, accessToken);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved' })
  async getProfile(@Request() req) {
    return this.authService.getProfile(req.user.id);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid current password' })
  async changePassword(
    @Request() req,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    this.logger.log(`Password change attempt for user: ${req.user.email}`);
    return this.authService.changePassword(req.user.id, changePasswordDto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }

  @Get('users')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users (Owner only)' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async getUsers(@Request() req) {
    this.logger.log(`Users list requested by: ${req.user.email}`);
    return this.authService.getUsers();
  }

  @Post('users/:id/activate')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activate/deactivate user (Owner only)' })
  @ApiResponse({ status: 200, description: 'User status updated' })
  async toggleUserStatus(@Request() req, @Body('userId') userId: string) {
    this.logger.log(`User status toggle by: ${req.user.email} for user: ${userId}`);
    return this.authService.toggleUserStatus(userId);
  }
}
