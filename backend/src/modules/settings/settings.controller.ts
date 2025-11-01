import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('settings')
@Controller('settings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SettingsController {
  private readonly logger = new Logger(SettingsController.name);

  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all settings' })
  async findAll() {
    return this.settingsService.findAll();
  }

  @Get('public')
  @ApiOperation({ summary: 'Get public settings (no auth required)' })
  async getPublicSettings() {
    return this.settingsService.getPublicSettings();
  }

  @Get(':key')
  @ApiOperation({ summary: 'Get setting by key' })
  async findOne(@Param('key') key: string) {
    return this.settingsService.findOne(key);
  }

  @Post()
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Create or update setting (Owner only)' })
  async upsert(@Body() body: { key: string; value: string; description?: string; category?: string; isPublic?: boolean }) {
    return this.settingsService.upsert(body);
  }

  @Patch(':key')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Update setting (Owner only)' })
  async update(@Param('key') key: string, @Body() body: { value: string }) {
    return this.settingsService.update(key, body.value);
  }

  @Delete(':key')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Delete setting (Owner only)' })
  async remove(@Param('key') key: string) {
    return this.settingsService.remove(key);
  }
}


