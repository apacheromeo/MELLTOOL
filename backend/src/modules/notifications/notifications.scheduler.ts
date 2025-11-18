import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationsScheduler {
  private readonly logger = new Logger(NotificationsScheduler.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  // Run every day at 9 AM
  @Cron('0 9 * * *', {
    name: 'lowStockDailyCheck',
    timeZone: 'Asia/Bangkok',
  })
  async handleLowStockDailyCheck() {
    this.logger.log('Running daily low stock check...');
    try {
      const result = await this.notificationsService.sendLowStockAlertToAll();
      this.logger.log(
        `Daily low stock check completed: ${result.successful}/${result.total} emails sent`,
      );
    } catch (error) {
      this.logger.error('Failed to run daily low stock check', error.stack);
    }
  }

  // Can also run weekly on Monday at 9 AM
  @Cron('0 9 * * 1', {
    name: 'lowStockWeeklyCheck',
    timeZone: 'Asia/Bangkok',
  })
  async handleLowStockWeeklyCheck() {
    this.logger.log('Running weekly low stock summary...');
    try {
      const result = await this.notificationsService.sendLowStockAlertToAll();
      this.logger.log(
        `Weekly low stock summary completed: ${result.successful}/${result.total} emails sent`,
      );
    } catch (error) {
      this.logger.error('Failed to run weekly low stock summary', error.stack);
    }
  }
}
