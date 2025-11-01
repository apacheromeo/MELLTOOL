# Deployment Guide

## Quick Deploy with Docker

### Local Development
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Production Deployment

### Option 1: Fly.io (Backend)

1. **Install Fly CLI**
```bash
curl -L https://fly.io/install.sh | sh
```

2. **Login**
```bash
fly auth login
```

3. **Deploy Backend**
```bash
cd backend

# Create app
fly launch --name inventory-api

# Set secrets
fly secrets set \
  DATABASE_URL="your-database-url" \
  SUPABASE_URL="your-supabase-url" \
  SUPABASE_ANON_KEY="your-anon-key" \
  SUPABASE_SERVICE_ROLE_KEY="your-service-key" \
  REDIS_URL="your-redis-url" \
  SHOPEE_PARTNER_ID="your-partner-id" \
  SHOPEE_PARTNER_KEY="your-partner-key" \
  JWT_SECRET="your-jwt-secret" \
  FRONTEND_URL="https://your-frontend.vercel.app"

# Deploy
fly deploy

# View logs
fly logs
```

4. **Scale (Optional)**
```bash
# Scale to 2 instances
fly scale count 2

# Upgrade resources
fly scale vm shared-cpu-2x
```

### Option 2: Railway (Backend)

1. **Install Railway CLI**
```bash
npm install -g @railway/cli
```

2. **Login**
```bash
railway login
```

3. **Deploy**
```bash
cd backend

# Initialize project
railway init

# Add PostgreSQL
railway add postgresql

# Add Redis
railway add redis

# Set environment variables
railway variables set \
  SUPABASE_URL="your-supabase-url" \
  SUPABASE_ANON_KEY="your-anon-key" \
  SHOPEE_PARTNER_ID="your-partner-id" \
  JWT_SECRET="your-jwt-secret"

# Deploy
railway up
```

### Option 3: Vercel (Frontend)

1. **Install Vercel CLI**
```bash
npm i -g vercel
```

2. **Deploy**
```bash
cd frontend

# Login
vercel login

# Deploy
vercel

# Set environment variables in dashboard
# Project Settings > Environment Variables:
# - NEXT_PUBLIC_API_URL
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY

# Deploy to production
vercel --prod
```

### Option 4: Netlify (Frontend)

1. **Install Netlify CLI**
```bash
npm install -g netlify-cli
```

2. **Deploy**
```bash
cd frontend

# Login
netlify login

# Initialize
netlify init

# Deploy
netlify deploy --prod
```

## Database Setup

### Supabase (Recommended)

1. Create account at https://supabase.com
2. Create new project
3. Get connection string from Settings > Database
4. Use as `DATABASE_URL`

### Neon (Alternative)

1. Create account at https://neon.tech
2. Create database
3. Copy connection string
4. Use as `DATABASE_URL`

### Run Migrations

```bash
# After setting DATABASE_URL
cd backend
npx prisma migrate deploy
```

## Redis Setup

### Upstash (Recommended)

1. Create account at https://upstash.com
2. Create Redis database
3. Copy REST URL and token
4. Use as `REDIS_URL`

### Redis Cloud (Alternative)

1. Create account at https://redis.com/try-free
2. Create database
3. Copy connection string
4. Use as `REDIS_URL`

## Environment Variables

### Backend (.env)
```env
# Database
DATABASE_URL="postgresql://..."

# Supabase
SUPABASE_URL="https://xxx.supabase.co"
SUPABASE_ANON_KEY="eyJhbGc..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGc..."

# Redis
REDIS_URL="redis://..."

# Shopee
SHOPEE_PARTNER_ID="123456"
SHOPEE_PARTNER_KEY="abc123..."
SHOPEE_REDIRECT_URI="https://your-domain.com/api/auth/shopee/callback"

# JWT
JWT_SECRET="your-super-secret-key-min-32-chars"

# Application
NODE_ENV="production"
PORT=3001
FRONTEND_URL="https://your-frontend.vercel.app"

# Optional
SENTRY_DSN="https://..."
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=https://your-api.fly.dev
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

## Post-Deployment Checklist

- [ ] Database migrations run successfully
- [ ] All environment variables set
- [ ] Health check endpoints responding
- [ ] CORS configured correctly
- [ ] SSL/HTTPS enabled
- [ ] Monitoring configured (Sentry)
- [ ] Backup strategy in place
- [ ] Rate limiting configured
- [ ] Logs accessible
- [ ] Test all critical features

## Monitoring

### Sentry Setup

1. Create account at https://sentry.io
2. Create project
3. Copy DSN
4. Add to environment variables

### Health Checks

- Backend: `https://your-api.fly.dev/health`
- Frontend: `https://your-frontend.vercel.app`

### Logs

**Fly.io:**
```bash
fly logs
fly logs --app inventory-api
```

**Railway:**
```bash
railway logs
```

**Vercel:**
```bash
vercel logs
```

## Scaling

### Horizontal Scaling

**Fly.io:**
```bash
# Scale to 3 instances
fly scale count 3

# Scale by region
fly scale count 2 --region sin
fly scale count 1 --region hkg
```

**Railway:**
- Automatic scaling based on traffic
- Configure in dashboard

### Vertical Scaling

**Fly.io:**
```bash
# Upgrade to 2x CPU/RAM
fly scale vm shared-cpu-2x

# Upgrade to 4x
fly scale vm shared-cpu-4x
```

## Backup Strategy

### Database Backups

**Supabase:**
- Automatic daily backups (Pro plan)
- Point-in-time recovery

**Manual Backup:**
```bash
# Backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup_20240101.sql
```

### File Backups

```bash
# Backup uploads directory
tar -czf uploads_backup.tar.gz backend/uploads/

# Restore
tar -xzf uploads_backup.tar.gz
```

## Rollback

### Fly.io
```bash
# List releases
fly releases

# Rollback to previous
fly releases rollback
```

### Vercel
```bash
# List deployments
vercel ls

# Rollback to specific deployment
vercel rollback [deployment-url]
```

## Troubleshooting

### Database Connection Issues

```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check migrations
npx prisma migrate status
```

### Redis Connection Issues

```bash
# Test connection
redis-cli -u $REDIS_URL ping
```

### Application Not Starting

```bash
# Check logs
fly logs
vercel logs

# Check environment variables
fly secrets list
```

### High Memory Usage

```bash
# Check metrics
fly metrics

# Scale up
fly scale vm shared-cpu-2x
```

## Cost Optimization

### Fly.io
- Use shared CPU for lower cost
- Scale down during off-hours
- Use autoscaling

### Vercel
- Free for hobby projects
- Pro plan for production

### Database
- Use connection pooling
- Optimize queries
- Regular vacuum/analyze

### Redis
- Set appropriate TTLs
- Monitor memory usage
- Use compression

## Security Checklist

- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] Database SSL enabled
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] API keys rotated regularly
- [ ] Backups encrypted
- [ ] Monitoring alerts set up
- [ ] Security headers configured
- [ ] Regular security updates

## Support

- Fly.io: https://fly.io/docs
- Vercel: https://vercel.com/docs
- Railway: https://docs.railway.app
- Supabase: https://supabase.com/docs

---

**Deployment complete! 🚀**


