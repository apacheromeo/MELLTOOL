# System Architecture

## Overview

This is a production-grade, scalable inventory management system designed for Thai e-commerce companies selling vacuum parts (Dyson, Mister Robot, etc.).

## Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: React Context + SWR for data fetching
- **Internationalization**: next-i18next (English + Thai)
- **Charts**: Recharts / Chart.js
- **Forms**: React Hook Form + Zod validation

### Backend
- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Supabase Auth with JWT
- **Cache**: Upstash Redis / ioredis
- **Queue**: Bull (Redis-based)
- **Logging**: Winston + Sentry
- **API Documentation**: Swagger/OpenAPI

### Infrastructure
- **Frontend Deployment**: Vercel
- **Backend Deployment**: Fly.io / Railway
- **Database**: Supabase / Neon PostgreSQL
- **Cache**: Upstash Redis
- **File Storage**: Supabase Storage / AWS S3
- **Monitoring**: Sentry

## System Modules

### 1. Authentication Module (`/modules/auth`)
- **Features**:
  - Email/password authentication via Supabase
  - JWT token management
  - Role-based access control (Owner, Staff, Accountant)
  - Session management with Redis
  - Password reset and change
  
- **Roles**:
  - **Owner**: Full system access, user management, critical operations
  - **Staff**: Inventory management, stock-in, printing
  - **Accountant**: Read-only access, reports, cost analysis

### 2. Inventory Module (`/modules/inventory`)
- **Features**:
  - Product CRUD operations
  - Category and Brand management
  - Barcode generation (Code128)
  - Advanced search and filtering
  - Stock level tracking
  - Multi-language support (EN/TH)
  
- **Components**:
  - ProductService: Core product operations
  - CategoryService: Category management
  - BrandService: Brand management
  - BarcodeService: Barcode generation and validation
  - Repository pattern for data access

### 3. Stock-In Module (`/modules/stock-in`)
- **Features**:
  - Purchase order management
  - Supplier tracking
  - Cost price recording
  - Automatic stock updates
  - Receipt generation
  - Batch import support
  
- **Workflow**:
  1. Create stock-in record with supplier info
  2. Add items with quantities and costs
  3. Receive items (updates product stock)
  4. Generate receipt/report

### 4. Shopee Integration Module (`/modules/shopee`)
- **Features**:
  - OAuth2 authentication
  - Multi-shop support
  - Catalog synchronization
  - Stock synchronization (bi-directional)
  - Automatic token refresh
  - Webhook support
  - Sync logging and error handling
  
- **API Integration**:
  - Shop authentication and connection
  - Product listing sync
  - Stock level updates
  - Price updates
  - Order notifications (webhook)
  
- **Background Jobs**:
  - Scheduled token refresh (cron)
  - Automatic stock sync
  - Catalog updates

### 5. Forecasting Module (`/modules/forecasting`)
- **Features**:
  - AI-powered stock prediction
  - Demand forecasting
  - Promotion day calculator (11/11, 12/12, Black Friday, etc.)
  - Reorder point calculation
  - Economic Order Quantity (EOQ)
  - Trend analysis
  - Seasonal patterns detection
  - ABC analysis
  - Stockout risk alerts
  
- **Algorithms**:
  - Exponential smoothing for predictions
  - Linear regression for trends
  - Moving averages
  - Safety stock calculations
  - Service level optimization
  
- **Promotion Templates**:
  - 11.11 Singles Day (5x multiplier)
  - 12.12 Birthday Sale (4.5x)
  - 9.9 Super Shopping Day (4x)
  - Black Friday (3.5x)
  - 6.6 Mid Year Sale (3.5x)
  - Custom promotions

### 6. Print Module (`/modules/print`)
- **Features**:
  - Barcode label printing
  - Batch printing support
  - PDF generation
  - Aimo D520 printer support
  - Custom label templates
  - Print job queue
  
- **Label Types**:
  - Product barcode labels
  - Price tags
  - Shelf labels
  - Inventory reports

### 7. Dashboard Module (`/modules/dashboard`)
- **Features**:
  - Real-time inventory overview
  - Stock level indicators
  - Low stock alerts
  - Sync status monitoring
  - Sales trends
  - Forecasting insights
  - Performance metrics
  - Quick actions
  
- **Widgets**:
  - Inventory value
  - Product count
  - Low stock count
  - Recent activities
  - Shopee sync status
  - Forecast alerts
  - Top products
  - Category breakdown

### 8. Settings Module (`/modules/settings`)
- **Features**:
  - System configuration
  - User management
  - Shop connections
  - Language preferences
  - Notification settings
  - Barcode configuration
  - Print settings
  - API keys management

## Database Schema

### Core Tables
- **users**: User accounts and roles
- **products**: Product catalog
- **categories**: Product categories
- **brands**: Product brands
- **stock_ins**: Purchase orders
- **stock_in_items**: Purchase order line items
- **shopee_shops**: Connected Shopee shops
- **shopee_items**: Shopee product listings
- **shopee_sync_logs**: Sync history
- **print_jobs**: Print queue
- **settings**: System configuration
- **audit_logs**: Activity tracking

## API Architecture

### RESTful Endpoints

#### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/logout` - User logout
- `GET /auth/profile` - Get user profile
- `POST /auth/refresh` - Refresh token

#### Inventory
- `GET /inventory/products` - List products (paginated, filtered)
- `POST /inventory/products` - Create product
- `GET /inventory/products/:id` - Get product details
- `PATCH /inventory/products/:id` - Update product
- `DELETE /inventory/products/:id` - Delete product
- `GET /inventory/categories` - List categories
- `GET /inventory/brands` - List brands
- `GET /inventory/analytics/overview` - Inventory overview
- `GET /inventory/analytics/low-stock` - Low stock products

#### Stock-In
- `GET /stock-in` - List stock-in records
- `POST /stock-in` - Create stock-in
- `GET /stock-in/:id` - Get stock-in details
- `POST /stock-in/:id/receive` - Receive stock
- `POST /stock-in/:id/cancel` - Cancel stock-in

#### Shopee
- `GET /shopee/auth/url` - Get OAuth URL
- `GET /shopee/auth/callback` - OAuth callback
- `GET /shopee/shops` - List connected shops
- `POST /shopee/shops/:id/sync/catalog` - Sync catalog
- `POST /shopee/shops/:id/sync/stock` - Sync stock
- `GET /shopee/shops/:id/items` - List shop items
- `POST /shopee/shops/:id/items/:itemId/link` - Link to product

#### Forecasting
- `GET /forecasting/predict/:productId` - Stock prediction
- `POST /forecasting/promotion/forecast` - Promotion forecast
- `GET /forecasting/promotion/templates` - Promotion templates
- `GET /forecasting/reorder-point/:productId` - Reorder point
- `GET /forecasting/trends/:productId` - Trend analysis
- `GET /forecasting/insights/dashboard` - Dashboard insights
- `GET /forecasting/alerts/low-stock` - Low stock alerts
- `GET /forecasting/abc-analysis` - ABC analysis

#### Dashboard
- `GET /dashboard/overview` - Dashboard overview
- `GET /dashboard/metrics` - Key metrics
- `GET /dashboard/recent-activities` - Recent activities

## Caching Strategy

### Redis Cache Keys
- `inventory:overview` - Inventory overview (5 min TTL)
- `inventory:low-stock` - Low stock products (10 min TTL)
- `forecast:product:{id}:{days}` - Product forecast (1 hour TTL)
- `forecast:promotion:{date}:{type}` - Promotion forecast (1 hour TTL)
- `trends:product:{id}:{period}` - Trend analysis (30 min TTL)
- `refresh_token:{userId}` - User refresh tokens (30 days TTL)

### Cache Invalidation
- Product updates → Clear inventory cache
- Stock-in received → Clear inventory + forecast cache
- Shopee sync → Clear related shop cache

## Background Jobs

### Bull Queues

#### inventory-sync
- Stock level monitoring
- Low stock notifications
- Data aggregation

#### shopee-sync
- Catalog synchronization
- Stock updates
- Token refresh

#### forecasting
- Daily prediction updates
- Trend analysis
- Report generation

### Scheduled Tasks (Cron)
- **Every 30 minutes**: Shopee token refresh check
- **Every hour**: Update forecasts
- **Every 6 hours**: Full catalog sync
- **Daily at 2 AM**: Generate reports, cleanup old logs
- **Weekly**: ABC analysis update

## Security

### Authentication
- JWT tokens with short expiration (15 min)
- Refresh tokens stored in Redis
- Supabase Auth for user management
- Password hashing with bcrypt

### Authorization
- Role-based access control (RBAC)
- Route guards on sensitive endpoints
- Resource-level permissions

### API Security
- Rate limiting (100 req/min per IP)
- CORS configuration
- Request validation
- SQL injection prevention (Prisma)
- XSS protection

### Data Security
- Encrypted sensitive data
- Secure token storage
- HTTPS only
- Environment variable management

## Monitoring & Logging

### Winston Logging
- Error logs: `logs/error.log`
- Combined logs: `logs/combined.log`
- Log rotation (5MB max, 5 files)
- Structured JSON logging

### Sentry Integration
- Error tracking
- Performance monitoring
- User feedback
- Release tracking

### Metrics
- API response times
- Database query performance
- Cache hit rates
- Queue processing times
- Shopee API success rates

## Scalability

### Horizontal Scaling
- Stateless API servers
- Redis for session storage
- Queue-based processing
- Database connection pooling

### Performance Optimization
- Database indexing
- Query optimization
- Caching strategy
- Lazy loading
- Pagination
- CDN for static assets

### Future Enhancements
- GraphQL API
- WebSocket for real-time updates
- Microservices architecture
- Event-driven architecture
- Multi-region deployment
- Advanced analytics with ML models

## Development Workflow

### Local Development
```bash
# Backend
cd backend
npm install
npm run prisma:generate
npm run start:dev

# Frontend
cd frontend
npm install
npm run dev
```

### Testing
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

### Deployment
```bash
# Build
npm run build

# Production
npm run start:prod
```

## Error Handling

### HTTP Status Codes
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict
- 500: Internal Server Error

### Error Response Format
```json
{
  "statusCode": 400,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/products",
  "method": "POST",
  "error": "BadRequest",
  "message": "Validation failed",
  "details": []
}
```

## Internationalization

### Supported Languages
- English (en)
- Thai (th)

### Translation Files
- `frontend/src/locales/en/common.json`
- `frontend/src/locales/th/common.json`

### Database Fields
- Products: `name`, `nameTh`, `description`, `descriptionTh`
- Categories: `name`, `nameTh`
- Brands: `name`, `nameTh`

## Best Practices

### Code Organization
- Modular architecture
- Service layer pattern
- Repository pattern
- Dependency injection
- Single responsibility principle

### API Design
- RESTful conventions
- Consistent naming
- Versioning support
- Comprehensive documentation
- Error handling

### Database
- Migrations for schema changes
- Seeding for test data
- Soft deletes for important data
- Audit logging
- Backup strategy
