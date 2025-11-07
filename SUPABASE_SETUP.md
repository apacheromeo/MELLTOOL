# 🔥 Supabase Database Setup Guide

**Complete guide to setting up Supabase as your database for the POS system.**

---

## 🌟 Why Supabase?

✅ **Free Tier:** 500MB database, 2GB file storage, 50MB file uploads
✅ **Easy Setup:** 5-minute configuration
✅ **Great Dashboard:** Visual database management
✅ **Built-in Auth:** (Optional) Can replace custom auth
✅ **File Storage:** Upload product images directly
✅ **Real-time:** Live data updates (advanced)
✅ **Backups:** Automatic on paid plans
✅ **Global:** Fast from anywhere

**Cost:**
- 🆓 Free: $0/month (perfect for starting)
- 💰 Pro: $25/month (more storage, daily backups)

---

## 📋 Part 1: Create Supabase Project (5 minutes)

### Step 1: Sign Up

1. Go to https://supabase.com
2. Click "**Start your project**"
3. Sign up with **GitHub** (recommended) or email
4. Verify your email

### Step 2: Create New Project

1. Click "**New Project**"
2. Fill in:
   - **Name:** `inventory-pos` (or your choice)
   - **Database Password:** Click "Generate" (save this!)
   - **Region:** Choose closest to your users:
     - `Southeast Asia (Singapore)` - Asia/Australia
     - `West US (North California)` - US West
     - `Northeast US (N. Virginia)` - US East
     - `Central EU (Frankfurt)` - Europe
   - **Plan:** Free (can upgrade later)

3. Click "**Create new project**"

**Wait 2-3 minutes** while Supabase sets up your database.

### Step 3: Get Your Database URL

Once ready:

1. Go to "**Project Settings**" (⚙️ icon in left sidebar)
2. Click "**Database**" tab
3. Scroll down to "**Connection String**"
4. Find "**URI**" format
5. It looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres
   ```

6. **Copy this entire URL** - you'll need it soon!

**Important:** Replace `[YOUR-PASSWORD]` with your actual database password if it's not already filled in.

---

## 📋 Part 2: Configure Prisma for Supabase (5 minutes)

### Step 1: Update Connection Pooler (Important!)

For production, use Supabase's connection pooler:

1. In Supabase: **Project Settings** → **Database**
2. Scroll to "**Connection Pooling**"
3. Copy the "**Connection string**" (Transaction mode)
4. It looks like:
   ```
   postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```

**This is what you'll use in production!**

### Step 2: Add Connection String to Render

1. Go to Render dashboard
2. Click your "**inventory-backend**" service
3. Go to "**Environment**" tab
4. Find **DATABASE_URL** (or add it if not there)
5. Set value to your Supabase pooler URL:
   ```
   postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
   ```

**Important:** Add `?pgbouncer=true` at the end!

6. Click "**Save Changes**"
7. Service will auto-redeploy

### Step 3: Add to Vercel (for migrations)

If you want to run migrations from your local machine:

1. Create a `.env` file in `backend/` folder:
   ```bash
   cd backend
   cp .env.example .env
   nano .env
   ```

2. Add your Supabase URL:
   ```env
   DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
   ```

3. Save (Ctrl+X, Y, Enter)

---

## 📋 Part 3: Run Database Migrations (5 minutes)

### Option A: From Your Computer (Recommended)

**If you have Node.js installed:**

```bash
# Navigate to backend folder
cd backend

# Install dependencies (if not done)
npm install

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Verify
npx prisma studio
```

This opens a visual database editor at http://localhost:5555

### Option B: From Render Shell

**If you don't have Node.js locally:**

1. Go to Render → **inventory-backend** service
2. Click "**Shell**" tab (may not be available on free tier)
3. Run:
   ```bash
   cd backend
   npx prisma migrate deploy
   npx prisma generate
   ```

### Option C: Run SQL Directly in Supabase

**If other options don't work:**

1. Go to Supabase dashboard
2. Click "**SQL Editor**" in left sidebar
3. Click "**New query**"
4. Run this SQL to create all tables:

```sql
-- This will be generated from your Prisma schema
-- You can get it by running: npx prisma migrate dev --create-only
-- Then copy the SQL from the migration file
```

**Better approach:** Run migrations locally (Option A) which will work with Supabase.

---

## 📋 Part 4: Verify Setup (2 minutes)

### Check Database Tables

1. Go to Supabase → "**Table Editor**"
2. You should see tables like:
   - users
   - products
   - categories
   - brands
   - sales_orders
   - (and more)

If you don't see tables, migrations didn't run. Go back to Part 3.

### Test Connection from Backend

1. Go to your Render backend URL:
   ```
   https://inventory-backend-xxxx.onrender.com/health
   ```

2. Should return:
   ```json
   {"status":"ok"}
   ```

3. If you see error, check Render logs:
   - Render → Backend → **Logs** tab
   - Look for "database connection" errors

### Create First Admin User

**Option A: Via Supabase Dashboard**

1. Supabase → **Table Editor**
2. Click "**users**" table
3. Click "**Insert row**" → "**Insert row**"
4. Fill in:
   - **id:** `admin-001` (or leave auto-generated)
   - **email:** `admin@yourdomain.com`
   - **name:** `Admin User`
   - **role:** `OWNER`
   - **isActive:** `true`
   - **createdAt:** (leave default)
   - **updatedAt:** (leave default)

5. Click "**Save**"

**Option B: Via Prisma Studio**

```bash
cd backend
npx prisma studio
# Opens at http://localhost:5555
# Click users → Add record
```

---

## 📋 Part 5: Configure File Storage (Optional, 5 minutes)

Supabase Storage can replace your local file uploads!

### Enable Storage

1. Supabase → "**Storage**" in left sidebar
2. Click "**New bucket**"
3. Name: `product-images`
4. Public: ✅ Yes (so images can be viewed)
5. Click "**Create bucket**"

### Get Storage URL

1. Storage → "**Settings**"
2. Copy "**URL**": `https://[project-ref].supabase.co/storage/v1/`

### Update Backend to Use Supabase Storage

**If you want to use Supabase instead of local storage:**

1. Install Supabase client:
   ```bash
   cd backend
   npm install @supabase/supabase-js
   ```

2. Add to Render environment variables:
   ```
   SUPABASE_URL = https://[project-ref].supabase.co
   SUPABASE_SERVICE_KEY = [your-service-role-key]
   ```

3. Update your upload code (see product.service.ts)

---

## 🔧 Environment Variables Summary

### What You Need to Set:

#### In Render (Backend):

```env
DATABASE_URL=postgresql://postgres.[project]:[pass]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
FRONTEND_URL=https://your-app.vercel.app
ALLOWED_ORIGINS=https://your-app.vercel.app

# Optional - if using Supabase Storage
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_SERVICE_KEY=[your-service-key]
```

#### In Vercel (Frontend):

```env
NEXT_PUBLIC_API_URL=https://inventory-backend-xxxx.onrender.com

# Optional - if using Supabase Storage/Auth
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
```

---

## 💾 Database Backups

### Free Tier:
- No automatic backups
- Manual backup: Export SQL from Supabase dashboard
- Or use `pg_dump` (see below)

### Pro Tier ($25/month):
- Daily automatic backups
- Point-in-time recovery
- 7-day retention

### Manual Backup:

**Option 1: Supabase Dashboard**

1. Supabase → **Database** → **Backups**
2. Click "**Manual backup**"
3. Download SQL file

**Option 2: Command Line**

```bash
# Install PostgreSQL client first
# Mac: brew install postgresql
# Linux: apt install postgresql-client

# Create backup
pg_dump "postgresql://postgres.[project]:[pass]@db.xxx.supabase.co:5432/postgres" > backup.sql

# Compressed backup
pg_dump "postgresql://postgres.[project]:[pass]@db.xxx.supabase.co:5432/postgres" | gzip > backup.sql.gz
```

**Option 3: GitHub Actions** (Automated)

Create `.github/workflows/backup-supabase.yml`:

```yaml
name: Backup Supabase Database

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
  workflow_dispatch:  # Manual trigger

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Backup Database
        run: |
          pg_dump "${{ secrets.SUPABASE_DATABASE_URL }}" | gzip > backup_$(date +%Y%m%d).sql.gz

      - name: Upload to Storage
        # Add your storage upload here (S3, Google Drive, etc.)
```

---

## 🔍 Monitoring

### Supabase Dashboard Metrics

1. Go to Supabase → "**Reports**"
2. View:
   - API requests
   - Database size
   - Active connections
   - CPU usage
   - Bandwidth

### Set Up Alerts

Free tier: No built-in alerts

**DIY Solution:**

Use UptimeRobot to monitor your backend:
1. Sign up at https://uptimerobot.com (free)
2. Add monitor:
   - Type: HTTPS
   - URL: `https://inventory-backend-xxxx.onrender.com/health`
3. Get alerts if backend goes down

---

## 🚀 Performance Optimization

### Connection Pooling (Required!)

✅ Already set up if you used the pooler URL:
```
?pgbouncer=true
```

### Indexes (Recommended)

Add to your Prisma schema:

```prisma
model Product {
  // ... existing fields

  @@index([sku])
  @@index([barcode])
  @@index([categoryId, isActive])
  @@index([brandId, isActive])
}
```

Run migration:
```bash
npx prisma migrate dev --name add_indexes
npx prisma migrate deploy
```

### Query Optimization

In Supabase Dashboard:

1. Go to **SQL Editor**
2. Run:
   ```sql
   -- Find slow queries
   SELECT * FROM pg_stat_statements
   ORDER BY total_exec_time DESC
   LIMIT 10;
   ```

---

## 🔐 Security Best Practices

### 1. Secure Your Database Password

- ✅ Use the generated strong password
- ✅ Never commit to git
- ✅ Store in Render environment variables
- ✅ Rotate every 90 days

### 2. Enable Row Level Security (RLS)

In Supabase, RLS protects your data:

```sql
-- Example: Only allow users to see their own orders
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
ON sales_orders FOR SELECT
USING (auth.uid() = staff_id::text);
```

### 3. Use Connection Pooler

✅ Already done if you followed Part 2

### 4. Regular Backups

- Free: Manual backups weekly
- Pro: Automatic daily backups

---

## 🆘 Troubleshooting

### "Connection timeout" Error

**Problem:** Can't connect to Supabase

**Fix:**
1. Check DATABASE_URL is correct
2. Make sure you're using **pooler URL** (port 6543)
3. Verify `?pgbouncer=true` is at the end
4. Check Supabase project is not paused (free tier pauses after 7 days inactivity)

### "Too many connections" Error

**Problem:** Connection limit reached

**Fix:**
1. Use connection pooler (port 6543, not 5432)
2. Add `connection_limit=10` to DATABASE_URL:
   ```
   postgresql://...?pgbouncer=true&connection_limit=10
   ```

### "Database is paused" Error

**Problem:** Free tier auto-pauses after 7 days inactivity

**Fix:**
1. Go to Supabase dashboard
2. Project will auto-resume when you access it
3. Or: Upgrade to Pro ($25/month) - never pauses

### Migrations Fail

**Problem:** Prisma migrations won't run

**Fix:**
1. Ensure `DATABASE_URL` has `?pgbouncer=true`
2. For migrations, you might need direct connection (port 5432):
   ```bash
   # Use direct URL for migrations only
   DATABASE_URL="postgresql://postgres:pass@db.xxx.supabase.co:5432/postgres" npx prisma migrate deploy
   ```

---

## 📊 Supabase Dashboard Quick Tour

### Key Sections:

1. **Table Editor** - Visual database browser
   - View/edit data
   - Insert rows
   - Create tables manually

2. **SQL Editor** - Run SQL queries
   - Custom queries
   - Saved queries
   - Query history

3. **Database** - Database settings
   - Connection strings
   - Connection pooling
   - Backups

4. **Storage** - File storage
   - Upload files
   - Manage buckets
   - CDN URLs

5. **Reports** - Metrics
   - Usage stats
   - Performance
   - Billing

---

## 🎓 Next Steps

After setup:

1. ✅ **Test connection** - Verify backend can connect
2. ✅ **Run migrations** - Create all tables
3. ✅ **Create admin user** - First user for login
4. ✅ **Test your app** - Login and create product
5. ✅ **Set up backups** - Weekly manual or upgrade to Pro
6. ✅ **Monitor usage** - Check Supabase Reports tab

---

## 💡 Pro Tips

1. **Upgrade to Pro for production** ($25/month)
   - Daily backups
   - 8GB database (vs 500MB)
   - No auto-pause
   - Better performance

2. **Use Supabase Storage** for product images
   - Direct CDN URLs
   - Automatic optimization
   - 2GB free storage

3. **Enable RLS** for better security
   - Row-level access control
   - Automatic data protection

4. **Monitor connection count**
   - Supabase → Reports
   - Keep under limits

5. **Use indexes** for faster queries
   - Add to Prisma schema
   - Run migrations

---

## 📞 Getting Help

### Supabase Resources:
- Docs: https://supabase.com/docs
- Community: https://github.com/supabase/supabase/discussions
- Status: https://status.supabase.com

### Your App:
- Check Render logs for backend errors
- Check Supabase Reports for database issues
- Test connection: `npx prisma db pull`

---

## ✅ Supabase Setup Checklist

- [ ] Created Supabase project
- [ ] Copied database URL
- [ ] Got connection pooler URL
- [ ] Added DATABASE_URL to Render
- [ ] Ran Prisma migrations
- [ ] Verified tables exist in Supabase
- [ ] Created admin user
- [ ] Tested backend health check
- [ ] Tested login in app
- [ ] Set up manual backups (or upgrade to Pro)

---

**Congratulations! Your Supabase database is ready! 🎉**

**Full Stack:**
- 🌐 Frontend: Vercel
- 🔧 Backend: Render
- 🗄️ Database: Supabase
- 💾 Cache: Redis (Render)

**Monthly Cost: $0** (all free tiers) or **~$32/month** (all pro tiers)

**Next:** Go back to [DEPLOY_VERCEL_RENDER.md](DEPLOY_VERCEL_RENDER.md) and continue with deployment!
