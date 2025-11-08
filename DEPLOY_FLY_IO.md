# Fly.io Deployment Guide - MELLTOOL

Complete step-by-step guide to deploy your MELLTOOL backend to Fly.io.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start (10 minutes)](#quick-start-10-minutes)
- [Detailed Setup](#detailed-setup)
- [Environment Variables](#environment-variables)
- [Database Setup (Supabase)](#database-setup-supabase)
- [Deployment](#deployment)
- [Monitoring & Logs](#monitoring--logs)
- [Scaling & Performance](#scaling--performance)
- [Troubleshooting](#troubleshooting)
- [Cost Estimate](#cost-estimate)

---

## Prerequisites

1. **Fly.io Account**: Sign up at https://fly.io/app/sign-up
2. **Flyctl CLI**: Install the Fly.io CLI tool
3. **Supabase Account**: For PostgreSQL database (https://supabase.com)
4. **Payment Method**: Credit card for Fly.io (free tier available)

---

## Quick Start (10 minutes)

### Step 1: Install Flyctl CLI

```bash
# macOS
brew install flyctl

# Linux
curl -L https://fly.io/install.sh | sh

# Windows (PowerShell)
pwsh -Command "iwr https://fly.io/install.ps1 -useb | iex"

# Verify installation
flyctl version
```

### Step 2: Login to Fly.io

```bash
flyctl auth login
# This will open your browser for authentication
```

### Step 3: Setup Supabase Database

1. Go to https://supabase.com and create a new project
2. Wait 2-3 minutes for database to provision
3. Go to **Settings** → **Database** → **Connection String**
4. Copy the **Connection Pooling** string (port 6543 with `?pgbouncer=true`)

Example connection string:
```
postgresql://postgres.xxxxx:password@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true
```

### Step 4: Launch Your Fly.io App

```bash
cd /path/to/MELLTOOL

# Launch the app (follow the prompts)
flyctl launch --no-deploy

# When prompted:
# - App name: melltool-backend (or your choice)
# - Region: Choose closest to your users (e.g., sin for Singapore)
# - Postgres database: NO (we're using Supabase)
# - Redis: NO (optional, add later if needed)
```

This creates a `fly.toml` file (already configured in your project).

### Step 5: Create Persistent Volume for Uploads

```bash
# Create a 1GB volume for file uploads
flyctl volumes create melltool_uploads --region sin --size 1
```

### Step 6: Set Environment Variables

```bash
# Database
flyctl secrets set DATABASE_URL="postgresql://postgres.xxxxx:password@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true"

# JWT Secrets (generate random strings)
flyctl secrets set JWT_SECRET="$(openssl rand -base64 32)"
flyctl secrets set JWT_REFRESH_SECRET="$(openssl rand -base64 32)"

# Frontend URL (will be your Vercel URL)
flyctl secrets set FRONTEND_URL="https://your-frontend.vercel.app"

# Optional: Redis (if needed)
# flyctl secrets set REDIS_HOST="your-redis-host"
# flyctl secrets set REDIS_PASSWORD="your-redis-password"

# Optional: Sentry for error tracking
# flyctl secrets set SENTRY_DSN="your-sentry-dsn"
```

### Step 7: Deploy!

```bash
# Deploy your application
flyctl deploy

# This will:
# ✓ Build Docker image
# ✓ Push to Fly.io registry
# ✓ Run database migrations
# ✓ Start your application
# ✓ Run health checks
```

### Step 8: Verify Deployment

```bash
# Check app status
flyctl status

# View logs
flyctl logs

# Open your app in browser
flyctl open /health

# Should see: {"status":"ok"}
```

Your backend is now live at: `https://melltool-backend.fly.dev`

---

## Detailed Setup

### Fly.io Configuration (`fly.toml`)

Your app is configured with:

```toml
app = "melltool-backend"
primary_region = "sin"  # Singapore

[build]
  dockerfile = "backend/Dockerfile"

[deploy]
  release_command = "npx prisma migrate deploy"  # Runs migrations

[env]
  PORT = "3001"
  NODE_ENV = "production"

[http_service]
  internal_port = 3001
  force_https = true
  min_machines_running = 1

  [[http_service.checks]]
    path = "/health"
    interval = "30s"

[mounts]
  source = "melltool_uploads"      # Persistent storage
  destination = "/app/uploads"
  initial_size = "1gb"

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 512                  # Increase if needed
```

### Dockerfile Optimization

Your Dockerfile uses:
- **Multi-stage build**: Smaller production image
- **Non-root user**: Security best practice
- **dumb-init**: Proper signal handling
- **Health checks**: Automatic restart on failure
- **Cache optimization**: Faster rebuilds

---

## Environment Variables

### Required Variables

```bash
# Database (Supabase)
DATABASE_URL="postgresql://user:pass@host:6543/postgres?pgbouncer=true"

# JWT Authentication
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
JWT_REFRESH_SECRET="your-refresh-token-secret"

# Frontend URL (for CORS)
FRONTEND_URL="https://your-frontend.vercel.app"
```

### Optional Variables

```bash
# Redis (for caching, sessions, queues)
REDIS_HOST="your-redis-host"
REDIS_PORT="6379"
REDIS_PASSWORD="your-redis-password"

# File Upload
MAX_FILE_SIZE="10485760"  # 10MB in bytes
UPLOAD_DIR="./uploads"

# Rate Limiting
THROTTLE_TTL="60"         # seconds
THROTTLE_LIMIT="100"      # requests per TTL

# Sentry (Error Tracking)
SENTRY_DSN="https://xxx@xxx.ingest.sentry.io/xxx"

# Shopee Integration (if used)
SHOPEE_PARTNER_ID="your-partner-id"
SHOPEE_PARTNER_KEY="your-partner-key"
SHOPEE_REDIRECT_URL="https://melltool-backend.fly.dev/api/shopee/callback"
```

### Setting Secrets

```bash
# Set a single secret
flyctl secrets set KEY="value"

# Set multiple secrets at once
flyctl secrets set \
  JWT_SECRET="secret1" \
  JWT_REFRESH_SECRET="secret2" \
  DATABASE_URL="connection-string"

# Import from .env file
flyctl secrets import < .env.production

# List all secrets (values hidden)
flyctl secrets list

# Remove a secret
flyctl secrets unset KEY
```

---

## Database Setup (Supabase)

### 1. Create Supabase Project

1. Go to https://supabase.com
2. Click **New Project**
3. Fill in:
   - Name: `melltool`
   - Database Password: Generate strong password
   - Region: Same as Fly.io region (Singapore = ap-southeast-1)
4. Click **Create Project** (takes 2-3 minutes)

### 2. Get Connection String

1. Go to **Settings** → **Database**
2. Scroll to **Connection String** → **Connection Pooling**
3. Copy the string (should have port **6543** and `?pgbouncer=true`)
4. Replace `[YOUR-PASSWORD]` with your actual password

```
postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

### 3. Run Initial Migration

```bash
# Set DATABASE_URL secret
flyctl secrets set DATABASE_URL="your-connection-string"

# Deploy (this will run migrations automatically)
flyctl deploy
```

### 4. Verify Database Connection

```bash
# Check logs for database connection
flyctl logs --app melltool-backend

# Should see: "✅ Database connected successfully"
```

---

## Deployment

### First Deployment

```bash
# From project root
flyctl deploy

# Watch deployment progress
flyctl logs -a melltool-backend
```

### Redeployment (Updates)

```bash
# After code changes
git add .
git commit -m "Update feature"

# Deploy to Fly.io
flyctl deploy

# Fly.io will:
# 1. Build new Docker image
# 2. Run tests (if configured)
# 3. Run database migrations
# 4. Rolling deployment (zero downtime)
# 5. Health checks
```

### Rollback Deployment

```bash
# List recent releases
flyctl releases

# Rollback to previous version
flyctl releases rollback
```

### Scaling

```bash
# Scale to 2 machines (high availability)
flyctl scale count 2

# Scale VM resources
flyctl scale vm shared-cpu-2x --memory 1024

# Auto-scaling (based on load)
flyctl autoscale set min=1 max=3

# Check current scale
flyctl scale show
```

---

## Monitoring & Logs

### View Logs

```bash
# Tail logs in real-time
flyctl logs

# Filter by region
flyctl logs --region sin

# Last 200 lines
flyctl logs --limit 200

# JSON format
flyctl logs --json
```

### App Status

```bash
# Overall status
flyctl status

# Detailed VM info
flyctl vm status

# List all machines
flyctl machines list
```

### Health Checks

```bash
# Your app has automatic health checks at /health

# Manual check
curl https://melltool-backend.fly.dev/health

# Response: {"status":"ok"}
```

### Monitoring Dashboard

Access Fly.io dashboard: https://fly.io/dashboard

Shows:
- CPU usage
- Memory usage
- Request rate
- Response time
- Error rate

---

## Scaling & Performance

### Horizontal Scaling (Multiple Machines)

```bash
# Add more machines for high availability
flyctl scale count 2

# Traffic is load-balanced automatically
```

### Vertical Scaling (Bigger Machines)

```bash
# Upgrade to 2 CPUs, 1GB RAM
flyctl scale vm shared-cpu-2x --memory 1024

# Available options:
# - shared-cpu-1x: 1 vCPU, 256MB-2GB
# - shared-cpu-2x: 2 vCPU, 512MB-4GB
# - dedicated-cpu-1x: 1 CPU, 2GB-8GB
# - dedicated-cpu-2x: 2 CPU, 4GB-16GB
```

### Regional Deployment

```bash
# Deploy to multiple regions for global reach
flyctl regions add sin  # Singapore
flyctl regions add nrt  # Tokyo
flyctl regions add syd  # Sydney

# List regions
flyctl regions list
```

### Volume Management

```bash
# List volumes
flyctl volumes list

# Extend volume size
flyctl volumes extend melltool_uploads --size 5

# Create snapshot
flyctl volumes snapshots create melltool_uploads

# List snapshots
flyctl volumes snapshots list melltool_uploads
```

---

## Troubleshooting

### App Not Starting

```bash
# Check logs
flyctl logs

# Common issues:
# - Database connection failed → Check DATABASE_URL secret
# - Missing secrets → flyctl secrets list
# - Port mismatch → Ensure PORT=3001 in fly.toml
```

### Database Migration Errors

```bash
# SSH into the machine
flyctl ssh console

# Run migrations manually
npx prisma migrate deploy

# Check Prisma client
npx prisma generate
```

### High Memory Usage

```bash
# Check current usage
flyctl vm status

# Scale up memory
flyctl scale vm shared-cpu-1x --memory 1024

# Or scale horizontally
flyctl scale count 2
```

### Slow Response Times

```bash
# Check if database is in same region
# Supabase region should match Fly.io region

# Add more machines
flyctl scale count 2

# Enable connection pooling (already enabled with Supabase)
```

### File Upload Issues

```bash
# Check volume is mounted
flyctl volumes list

# Verify mount in fly.toml
[mounts]
  source = "melltool_uploads"
  destination = "/app/uploads"

# Check volume space
flyctl ssh console
df -h /app/uploads
```

### Certificate/SSL Issues

```bash
# Fly.io provides automatic SSL certificates
# If having issues, run:
flyctl certs list
flyctl certs check melltool-backend.fly.dev

# Force certificate renewal
flyctl certs renew
```

---

## Cost Estimate

### Free Tier (Hobby Plan)

Fly.io includes:
- **3 shared-cpu-1x VMs** (256MB RAM each)
- **3GB persistent volume storage**
- **160GB outbound data transfer** per month

Your setup uses:
- 1 VM (shared-cpu-1x, 512MB) ≈ **$3.50/month**
- 1GB persistent volume ≈ **$0.15/month**
- Outbound traffic (first 100GB free, then $0.02/GB)

**Total: ~$3.65/month** (after free tier)

### Supabase

- **Free tier**: 500MB database, 1GB transfer/month
- **Pro plan**: $25/month (8GB database, 50GB transfer, better performance)

### Estimated Total Cost

- **Free tier**: $0 (if within limits)
- **Light usage**: $3-5/month (Fly.io) + $0-25/month (Supabase) = **$3-30/month**
- **Production**: $10-20/month (Fly.io with scaling) + $25/month (Supabase) = **$35-45/month**

Much cheaper than Heroku, AWS, or traditional hosting!

---

## Next Steps

1. **Setup Vercel Frontend**: Deploy your Next.js frontend to Vercel
2. **Configure CORS**: Update FRONTEND_URL secret with Vercel URL
3. **Setup Redis**: Add Redis for caching (optional)
4. **Enable Monitoring**: Setup Sentry for error tracking
5. **Backup Strategy**: Setup automated database backups in Supabase
6. **CI/CD**: Setup GitHub Actions for automated deployments

---

## Useful Commands Cheatsheet

```bash
# Deployment
flyctl deploy                      # Deploy app
flyctl deploy --remote-only        # Build on Fly.io (if local build fails)

# Monitoring
flyctl logs                        # View logs
flyctl status                      # App status
flyctl vm status                   # VM details

# Secrets
flyctl secrets list                # List secrets
flyctl secrets set KEY=value       # Set secret
flyctl secrets unset KEY           # Remove secret

# Scaling
flyctl scale count 2               # Scale to 2 machines
flyctl scale vm shared-cpu-2x      # Upgrade VM
flyctl autoscale set min=1 max=3   # Auto-scaling

# Volumes
flyctl volumes list                # List volumes
flyctl volumes extend ID --size 5  # Increase size

# SSH & Debug
flyctl ssh console                 # SSH into machine
flyctl ssh console -C "ls -la"     # Run command

# Regions
flyctl regions list                # List regions
flyctl regions add sin             # Add region

# Apps
flyctl apps list                   # List all your apps
flyctl apps destroy app-name       # Delete app

# Help
flyctl help                        # General help
flyctl help deploy                 # Command-specific help
```

---

## Support

- **Fly.io Docs**: https://fly.io/docs/
- **Community Forum**: https://community.fly.io/
- **Supabase Docs**: https://supabase.com/docs
- **Prisma Docs**: https://www.prisma.io/docs

---

**Your MELLTOOL backend is now production-ready on Fly.io!** 🚀

Next: Deploy your frontend to Vercel and connect them together.
