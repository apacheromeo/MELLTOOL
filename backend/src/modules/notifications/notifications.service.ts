import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.initializeMailer();
  }

  private initializeMailer() {
    const mailConfig = {
      host: this.configService.get<string>('SMTP_HOST', 'smtp.gmail.com'),
      port: this.configService.get<number>('SMTP_PORT', 587),
      secure: false,
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    };

    if (mailConfig.auth.user && mailConfig.auth.pass) {
      this.transporter = nodemailer.createTransporter(mailConfig);
      this.logger.log('Email transporter initialized');
    } else {
      this.logger.warn('Email credentials not configured. Notifications will be logged only.');
    }
  }

  async sendLowStockAlert(userId: string) {
    try {
      // Get user with notification settings
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          email: true,
          name: true,
          emailNotificationsEnabled: true,
          lowStockEmailEnabled: true,
        },
      });

      if (!user || !user.emailNotificationsEnabled || !user.lowStockEmailEnabled) {
        this.logger.log(`Low stock email skipped for user ${userId} (notifications disabled)`);
        return;
      }

      // Get low stock products
      // First get all products, then filter in memory
      // This is needed because Prisma doesn't support dynamic column comparisons
      const allProducts = await this.prisma.product.findMany({
        where: {
          isActive: true,
          lowStockThreshold: { not: null },
        },
        select: {
          id: true,
          sku: true,
          name: true,
          stock: true,
          lowStockThreshold: true,
          category: {
            select: {
              name: true,
            },
          },
        },
      });

      // Filter products where stock <= lowStockThreshold
      const lowStockProducts = allProducts
        .filter((p) => p.stock <= (p.lowStockThreshold || 0))
        .sort((a, b) => a.stock - b.stock);

      if (lowStockProducts.length === 0) {
        this.logger.log('No low stock products found');
        return;
      }

      // Generate email content
      const emailHtml = this.generateLowStockEmailHTML(lowStockProducts, user.name);
      const emailText = this.generateLowStockEmailText(lowStockProducts);

      // Send email
      if (this.transporter) {
        await this.transporter.sendMail({
          from: this.configService.get<string>('SMTP_FROM', '"MELLTOOL Inventory" <noreply@melltool.com>'),
          to: user.email,
          subject: `⚠️ Low Stock Alert - ${lowStockProducts.length} Products Need Restocking`,
          text: emailText,
          html: emailHtml,
        });

        this.logger.log(`Low stock alert email sent to ${user.email}`);
      } else {
        this.logger.log(`[EMAIL] Would send to ${user.email}:\n${emailText}`);
      }

      return {
        sent: !!this.transporter,
        recipientEmail: user.email,
        productCount: lowStockProducts.length,
      };
    } catch (error) {
      this.logger.error(`Failed to send low stock alert: ${error.message}`, error.stack);
      throw error;
    }
  }

  async sendLowStockAlertToAll() {
    try {
      // Get all users with low stock notifications enabled
      const users = await this.prisma.user.findMany({
        where: {
          isActive: true,
          emailNotificationsEnabled: true,
          lowStockEmailEnabled: true,
          role: {
            in: ['OWNER', 'MOD'],
          },
        },
        select: {
          id: true,
          email: true,
        },
      });

      this.logger.log(`Sending low stock alerts to ${users.length} users`);

      const results = await Promise.allSettled(
        users.map((user) => this.sendLowStockAlert(user.id)),
      );

      const successful = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      this.logger.log(`Low stock alerts sent: ${successful} successful, ${failed} failed`);

      return {
        total: users.length,
        successful,
        failed,
      };
    } catch (error) {
      this.logger.error(`Failed to send low stock alerts: ${error.message}`, error.stack);
      throw error;
    }
  }

  private generateLowStockEmailHTML(products: any[], userName: string): string {
    const productRows = products.map((p) => {
      const stockPercentage = p.lowStockThreshold
        ? Math.round((p.stock / p.lowStockThreshold) * 100)
        : 0;
      const urgencyColor = stockPercentage < 10 ? '#dc2626' : stockPercentage < 20 ? '#f59e0b' : '#3b82f6';

      return `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px;">${p.sku}</td>
          <td style="padding: 12px;">${p.name}</td>
          <td style="padding: 12px;">${p.category?.name || 'N/A'}</td>
          <td style="padding: 12px; font-weight: bold; color: ${urgencyColor};">${p.stock}</td>
          <td style="padding: 12px;">${p.lowStockThreshold || 'N/A'}</td>
        </tr>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">⚠️ Low Stock Alert</h1>
        </div>

        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; margin-bottom: 20px;">Hello ${userName},</p>

          <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
            You have <strong style="color: #dc2626;">${products.length} product${products.length > 1 ? 's' : ''}</strong> with low stock levels that need your attention.
          </p>

          <div style="background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #f3f4f6;">
                  <th style="padding: 12px; text-align: left; font-size: 12px; color: #666;">SKU</th>
                  <th style="padding: 12px; text-align: left; font-size: 12px; color: #666;">Product</th>
                  <th style="padding: 12px; text-align: left; font-size: 12px; color: #666;">Category</th>
                  <th style="padding: 12px; text-align: left; font-size: 12px; color: #666;">Stock</th>
                  <th style="padding: 12px; text-align: left; font-size: 12px; color: #666;">Min</th>
                </tr>
              </thead>
              <tbody>
                ${productRows}
              </tbody>
            </table>
          </div>

          <div style="margin-top: 30px; text-align: center;">
            <a href="${this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000')}/inventory/low-stock"
               style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              View Low Stock Products
            </a>
          </div>

          <p style="font-size: 12px; color: #999; margin-top: 30px; text-align: center;">
            To manage your notification preferences, visit your
            <a href="${this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000')}/settings/notifications" style="color: #667eea;">settings page</a>.
          </p>
        </div>
      </body>
      </html>
    `;
  }

  private generateLowStockEmailText(products: any[]): string {
    const productList = products.map((p) =>
      `- ${p.sku}: ${p.name} (${p.category?.name || 'N/A'}) - Stock: ${p.stock}/${p.lowStockThreshold || 'N/A'}`
    ).join('\n');

    return `
Low Stock Alert

You have ${products.length} product(s) with low stock levels:

${productList}

Please restock these items soon to avoid stockouts.

View all low stock products: ${this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000')}/inventory/low-stock

---
To manage your notification preferences, visit your settings page.
    `.trim();
  }
}
