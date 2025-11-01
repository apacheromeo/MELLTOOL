# Setup Guide

## Prerequisites

- Node.js 20+ 
- PostgreSQL 15+
- Redis 7+
- npm or yarn
- Git

## Quick Start (5 minutes)

### 1. Clone and Install

```bash
# Backend
cd backend
npm install

# Frontend  
cd frontend
npm install
```

### 2. Environment Setup

Copy `env.example` to `.env` in both backend and frontend directories and configure:

**Backend `.env`:**
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/inventory_db"
SUPABASE_URL="your-supabase-url"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
REDIS_URL="redis://localhost:6379"
SHOPEE_PARTNER_ID="your-partner-id"
SHOPEE_PARTNER_KEY="your-partner-key"
SHOPEE_REDIRECT_URI="http://localhost:3000/api/auth/shopee/callback"
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
FRONTEND_URL="http://localhost:3000"
```

**Frontend `.env.local`:**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Database Setup

```bash
cd backend

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed initial data
npm run prisma:seed

# (Optional) Open Prisma Studio
npx prisma studio
```

### 4. Start Development Servers

```bash
# Terminal 1 - Backend
cd backend
npm run start:dev

# Terminal 2 - Frontend
cd frontend
npm run dev

# Terminal 3 - Redis (if not running)
redis-server
```

### 5. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Docs**: http://localhost:3001/api/docs
- **Prisma Studio**: http://localhost:5555

## Detailed Setup

### Supabase Setup

1. Create account at https://supabase.com
2. Create new project
3. Go to Settings > API
4. Copy:
   - Project URL → `SUPABASE_URL`
   - anon/public key → `SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`

### Shopee API Setup

1. Register at https://open.shopee.com
2. Create app and get:
   - Partner ID
   - Partner Key
3. Set redirect URI to your callback URL
4. Configure webhook URL (optional)

### Redis Setup

**macOS:**
```bash
brew install redis
brew services start redis
```

**Ubuntu:**
```bash
sudo apt install redis-server
sudo systemctl start redis
```

**Windows:**
```bash
# Use Docker
docker run -d -p 6379:6379 redis:7-alpine
```

### PostgreSQL Setup

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
createdb inventory_db
```

**Ubuntu:**
```bash
sudo apt install postgresql-15
sudo systemctl start postgresql
sudo -u postgres createdb inventory_db
```

**Docker:**
```bash
docker run -d \
  --name postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=inventory_db \
  -p 5432:5432 \
  postgres:15-alpine
```

## Production Deployment

### Backend (Fly.io)

```bash
cd backend

# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Create app
fly launch

# Set secrets
fly secrets set DATABASE_URL="your-production-db-url"
fly secrets set SUPABASE_URL="your-supabase-url"
fly secrets set JWT_SECRET="your-jwt-secret"
# ... set all other secrets

# Deploy
fly deploy
```

### Frontend (Vercel)

```bash
cd frontend

# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Set environment variables in Vercel dashboard
# Project Settings > Environment Variables
```

### Database (Supabase/Neon)

**Option 1: Supabase**
1. Use Supabase's built-in PostgreSQL
2. Already configured if using Supabase Auth

**Option 2: Neon**
1. Create account at https://neon.tech
2. Create database
3. Copy connection string to `DATABASE_URL`

### Redis (Upstash)

1. Create account at https://upstash.com
2. Create Redis database
3. Copy REST URL and token
4. Update environment variables

## Environment Variables Reference

### Backend

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | `postgresql://...` |
| `SUPABASE_URL` | Supabase project URL | Yes | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase anon key | Yes | `eyJhbGc...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service key | Yes | `eyJhbGc...` |
| `REDIS_URL` | Redis connection string | Yes | `redis://localhost:6379` |
| `SHOPEE_PARTNER_ID` | Shopee Partner ID | Yes | `123456` |
| `SHOPEE_PARTNER_KEY` | Shopee Partner Key | Yes | `abc123...` |
| `SHOPEE_REDIRECT_URI` | OAuth callback URL | Yes | `http://...` |
| `JWT_SECRET` | JWT signing secret (32+ chars) | Yes | `your-secret` |
| `FRONTEND_URL` | Frontend URL | Yes | `http://localhost:3000` |
| `SENTRY_DSN` | Sentry error tracking | No | `https://...` |

### Frontend

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | Yes | `http://localhost:3001` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL | Yes | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Yes | `eyJhbGc...` |

## Testing

### Backend Tests

```bash
cd backend

# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

### Frontend Tests

```bash
cd frontend

# Run tests
npm run test

# Watch mode
npm run test:watch
```

## Common Issues

### Database Connection Error

**Problem:** `Can't reach database server`

**Solution:**
1. Check PostgreSQL is running: `pg_isready`
2. Verify DATABASE_URL is correct
3. Check firewall/network settings

### Redis Connection Error

**Problem:** `Redis connection refused`

**Solution:**
1. Check Redis is running: `redis-cli ping`
2. Verify REDIS_URL is correct
3. Check Redis is bound to correct port

### Shopee API Error

**Problem:** `Invalid signature`

**Solution:**
1. Verify Partner ID and Key are correct
2. Check system time is synchronized
3. Ensure redirect URI matches exactly

### Build Errors

**Problem:** `Module not found`

**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Performance Optimization

### Backend

1. **Database Indexing**
```sql
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_stock_ins_created ON stock_ins(created_at);
```

2. **Redis Caching**
- Enable caching for frequently accessed data
- Set appropriate TTLs
- Monitor cache hit rates

3. **Query Optimization**
- Use `select` to limit returned fields
- Implement pagination
- Use database views for complex queries

### Frontend

1. **Code Splitting**
- Already configured with Next.js
- Use dynamic imports for heavy components

2. **Image Optimization**
- Use Next.js Image component
- Serve images from CDN

3. **Caching**
- Configure SWR revalidation
- Use React.memo for expensive components

## Monitoring

### Logs

**Backend logs:**
```bash
# Development
tail -f logs/combined.log

# Production
fly logs
```

**Frontend logs:**
```bash
# Vercel
vercel logs
```

### Metrics

**Sentry:**
- Error tracking
- Performance monitoring
- User feedback

**Custom Metrics:**
- API response times
- Database query performance
- Cache hit rates
- Queue processing times

## Backup & Recovery

### Database Backup

```bash
# Backup
pg_dump inventory_db > backup_$(date +%Y%m%d).sql

# Restore
psql inventory_db < backup_20240101.sql
```

### Automated Backups

**Supabase:** Automatic daily backups included

**Self-hosted:**
```bash
# Add to crontab
0 2 * * * pg_dump inventory_db > /backups/backup_$(date +\%Y\%m\%d).sql
```

## Security Checklist

- [ ] Change all default passwords
- [ ] Use strong JWT secret (32+ characters)
- [ ] Enable HTTPS in production
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable database SSL
- [ ] Rotate API keys regularly
- [ ] Set up monitoring and alerts
- [ ] Regular security updates
- [ ] Backup encryption

## Scaling

### Horizontal Scaling

1. **Multiple Backend Instances**
```bash
# Fly.io
fly scale count 3
```

2. **Load Balancer**
- Configured automatically by Fly.io/Vercel

3. **Database Connection Pooling**
```env
DATABASE_URL="postgresql://...?pgbouncer=true"
```

### Vertical Scaling

```bash
# Fly.io - Increase resources
fly scale vm shared-cpu-2x

# Database - Upgrade plan
# Via Supabase/Neon dashboard
```

## Support

### Documentation
- Architecture: `/docs/architecture.md`
- Implementation: `/docs/IMPLEMENTATION_GUIDE.md`
- API: http://localhost:3001/api/docs

### Community
- GitHub Issues
- Discord/Slack channel
- Email support

## Maintenance

### Regular Tasks

**Daily:**
- Monitor error logs
- Check system health
- Review alerts

**Weekly:**
- Review performance metrics
- Check database size
- Update dependencies (security patches)

**Monthly:**
- Full dependency updates
- Database optimization
- Security audit
- Backup verification

### Update Process

```bash
# Backend
cd backend
npm update
npm audit fix
npm run test

# Frontend
cd frontend
npm update
npm audit fix
npm run build
```

---

**Need help?** Check the [Implementation Guide](./IMPLEMENTATION_GUIDE.md) or open an issue.
