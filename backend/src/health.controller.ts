import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('health')
  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get()
  root() {
    return {
      message: 'MELLTOOL Inventory API',
      version: '1.0.0',
      status: 'running',
      documentation: '/api/docs',
    };
  }
}
