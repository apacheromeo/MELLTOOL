import { Controller, Post, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('low-stock/send')
  @Roles(UserRole.OWNER, UserRole.MOD)
  @ApiOperation({ summary: 'Send low stock alert email to current user' })
  @ApiResponse({ status: 200, description: 'Email sent successfully' })
  async sendLowStockAlert(@Request() req) {
    return this.notificationsService.sendLowStockAlert(req.user.id);
  }

  @Post('low-stock/send-all')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Send low stock alerts to all eligible users (Owner only)' })
  @ApiResponse({ status: 200, description: 'Emails sent successfully' })
  async sendLowStockAlertToAll() {
    return this.notificationsService.sendLowStockAlertToAll();
  }

  @Get('settings')
  @ApiOperation({ summary: 'Get current user notification settings' })
  @ApiResponse({ status: 200, description: 'Notification settings retrieved' })
  async getSettings(@Request() req) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        emailNotificationsEnabled: true,
        lowStockEmailEnabled: true,
        stockInApprovalEmailEnabled: true,
      },
    });

    return user;
  }

  @Patch('settings')
  @ApiOperation({ summary: 'Update notification settings' })
  @ApiResponse({ status: 200, description: 'Settings updated successfully' })
  async updateSettings(
    @Request() req,
    @Body() settings: {
      emailNotificationsEnabled?: boolean;
      lowStockEmailEnabled?: boolean;
      stockInApprovalEmailEnabled?: boolean;
    },
  ) {
    const updatedUser = await this.prisma.user.update({
      where: { id: req.user.id },
      data: settings,
      select: {
        emailNotificationsEnabled: true,
        lowStockEmailEnabled: true,
        stockInApprovalEmailEnabled: true,
      },
    });

    return {
      message: 'Notification settings updated successfully',
      settings: updatedUser,
    };
  }
}
