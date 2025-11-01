import { registerAs } from '@nestjs/config';

export const configuration = registerAs('app', () => ({
  port: parseInt(process.env.PORT, 10) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database
  database: {
    url: process.env.DATABASE_URL,
    directUrl: process.env.DIRECT_URL,
  },

  // Supabase
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },

  // Redis
  redis: {
    url: process.env.REDIS_URL,
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD,
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  // Shopee API
  shopee: {
    partnerId: process.env.SHOPEE_PARTNER_ID,
    partnerKey: process.env.SHOPEE_PARTNER_KEY,
    baseUrl: process.env.SHOPEE_BASE_URL || 'https://partner.shopeemobile.com',
    redirectUri: process.env.SHOPEE_REDIRECT_URI,
  },

  // File upload
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10485760, // 10MB
    path: process.env.UPLOAD_PATH || './uploads',
  },

  // Barcode settings
  barcode: {
    prefix: process.env.BARCODE_PREFIX || 'VAC',
    length: parseInt(process.env.BARCODE_LENGTH, 10) || 8,
  },

  // Print settings
  print: {
    printerName: process.env.PRINTER_NAME || 'Aimo D520',
    templatePath: process.env.PDF_TEMPLATE_PATH || './templates/barcode.pdf',
  },

  // Rate limiting
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL, 10) || 60,
    limit: parseInt(process.env.THROTTLE_LIMIT, 10) || 100,
  },

  // Sentry
  sentry: {
    dsn: process.env.SENTRY_DSN,
  },

  // Frontend URL
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
}));
