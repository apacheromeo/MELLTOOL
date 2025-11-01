import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // Application
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3001),

  // Database
  DATABASE_URL: Joi.string().required(),
  DIRECT_URL: Joi.string().optional(),

  // Supabase
  SUPABASE_URL: Joi.string().uri().required(),
  SUPABASE_ANON_KEY: Joi.string().required(),
  SUPABASE_SERVICE_ROLE_KEY: Joi.string().required(),

  // Redis
  REDIS_URL: Joi.string().uri().optional(),
  REDIS_HOST: Joi.string().optional(),
  REDIS_PORT: Joi.number().optional(),
  REDIS_PASSWORD: Joi.string().optional(),

  // JWT
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('7d'),

  // Shopee API
  SHOPEE_PARTNER_ID: Joi.string().required(),
  SHOPEE_PARTNER_KEY: Joi.string().required(),
  SHOPEE_BASE_URL: Joi.string().uri().default('https://partner.shopeemobile.com'),
  SHOPEE_REDIRECT_URI: Joi.string().uri().required(),

  // File upload
  MAX_FILE_SIZE: Joi.number().default(10485760), // 10MB
  UPLOAD_PATH: Joi.string().default('./uploads'),

  // Barcode
  BARCODE_PREFIX: Joi.string().default('VAC'),
  BARCODE_LENGTH: Joi.number().default(8),

  // Print
  PRINTER_NAME: Joi.string().default('Aimo D520'),
  PDF_TEMPLATE_PATH: Joi.string().default('./templates/barcode.pdf'),

  // Rate limiting
  THROTTLE_TTL: Joi.number().default(60),
  THROTTLE_LIMIT: Joi.number().default(100),

  // Sentry
  SENTRY_DSN: Joi.string().uri().optional(),

  // Frontend
  FRONTEND_URL: Joi.string().uri().default('http://localhost:3000'),
});
