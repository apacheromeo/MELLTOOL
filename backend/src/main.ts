import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import * as Sentry from '@sentry/nestjs';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';

import { AppModule } from './app.module';
import { winstonConfig } from './config/winston.config';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  // Initialize Sentry
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
  });

  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger(winstonConfig),
  });

  const configService = app.get(ConfigService);
  const port = configService.get('PORT', 3001);
  const isProduction = configService.get('NODE_ENV') === 'production';

  // ============================================
  // SECURITY MIDDLEWARE
  // ============================================

  // Helmet.js - Security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }));

  // Cookie parser
  app.use(cookieParser(configService.get('JWT_SECRET')));

  // Request size limits (prevent DoS attacks)
  app.use((req, res, next) => {
    // Limit JSON payload size to 10MB
    if (req.headers['content-type']?.includes('application/json')) {
      req.setTimeout(30000); // 30 second timeout
    }
    next();
  });

  // Global validation pipe with enhanced security
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages: isProduction, // Hide validation errors in production
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global logging interceptor
  app.useGlobalInterceptors(new LoggingInterceptor());

  // CORS configuration
  app.enableCors({
    origin: isProduction 
      ? [configService.get('FRONTEND_URL')]
      : [
          configService.get('FRONTEND_URL', 'http://localhost:3000'),
          'http://localhost:3000',
        ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    maxAge: 3600,
  });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Inventory Management API')
    .setDescription('Thai E-commerce Inventory Management System API')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('inventory', 'Inventory management')
    .addTag('stock-in', 'Stock-in operations')
    .addTag('shopee', 'Shopee integration')
    .addTag('print', 'Barcode printing')
    .addTag('dashboard', 'Dashboard and analytics')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port);
  
  const logger = new Logger('Bootstrap');
  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  logger.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
