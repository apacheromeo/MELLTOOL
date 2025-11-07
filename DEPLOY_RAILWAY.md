# 🚀 Deploy to Vercel + Railway + Supabase

**The BEST stack for beginners in 2025! Deploy in 25 minutes.**

---

## 🎯 Why This Stack?

```
┌─────────────────────────────────────────────────────┐
│           YOUR PRODUCTION ARCHITECTURE              │
└─────────────────────────────────────────────────────┘

Frontend              Backend                Database
┌─────────────┐      ┌──────────────┐      ┌──────────────┐
│   VERCEL    │ ←──→ │   RAILWAY    │ ←──→ │  SUPABASE    │
│             │      │              │      │              │
│ • Next.js   │      │ • NestJS API │      │ • PostgreSQL │
│ • React     │      │ • Redis      │      │ • 500MB Free │
│ • iPad UI   │      │ • Auto Scale │      │ • Dashboard  │
│ • Global CDN│      │ • No Sleep!  │      │ • Backups    │
│ • Auto SSL  │      │ • $5 Credit  │      │ • Storage    │
│             │      │              │      │              │
│   $0/mo     │      │ $0-5/mo      │      │  $0-25/mo    │
└─────────────┘      └──────────────┘      └──────────────┘
```

**Monthly Cost:** $0 (Railway gives $5 credit/month!)

---

## ⚡ Why Railway > Render?

| Feature | Railway | Render |
|---------|---------|--------|
| **Cold Starts** | ✅ None | ❌ 60s wake time |
| **Free Credit** | ✅ $5/month | ❌ Limited hours |
| **Deploy Speed** | ✅ 2-3 min | ⏱️ 5-10 min |
| **Auto-detect** | ✅ Yes | ⚠️ Needs config |
| **Rollback** | ✅ One-click | ⚠️ Manual |
| **Metrics** | ✅ Built-in | ✅ Built-in |
| **CLI** | ✅ Excellent | ✅ Good |
| **DX** | ✅ Best in class | ✅ Good |

**→ Railway = Better free tier + No sleep + Faster deploys!**

---

## ⏱️ Time Required

| Step | Time |
|------|------|
| 1. Supabase Database | 5 min |
| 2. Railway Backend | 8 min |
| 3. Vercel Frontend | 5 min |
| 4. Connect All | 5 min |
| 5. Database Setup | 2 min |
| **Total** | **25 min** |

---

## 📋 Part 1: Create Supabase Database (5 minutes)

### Quick Setup

1. Go to https://supabase.com → Sign up with GitHub
2. Click "**New Project**"
3. Fill in:
   - **Name:** `inventory-pos`
   - **Password:** Generate → **SAVE IT!**
   - **Region:** Singapore (or closest)
   - **Plan:** Free
4. Click "**Create**"

⏱️ Wait 2 minutes...

### Get Connection String

1. Settings (⚙️) → **Database**
2. Scroll to "**Connection Pooling**"
3. Copy **Transaction mode** URL
4. Add `?pgbouncer=true` at the end:

```
postgresql://postgres.[project]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Save this!** ✅

**Need help?** See [SUPABASE_SETUP.md](SUPABASE_SETUP.md)

---

## 📋 Part 2: Deploy Backend to Railway (8 minutes)

### Step 1: Create Railway Account

1. Go to https://railway.app
2. Click "**Login**" → Sign in with GitHub
3. Authorize Railway

### Step 2: Create New Project

1. Click "**New Project**"
2. Select "**Deploy from GitHub repo**"
3. Choose your `MELLTOOL` repository
4. Railway auto-detects Node.js ✅

### Step 3: Configure Service

1. Railway creates a service automatically
2. Click on the service
3. Go to "**Settings**" tab
4. Update:
   - **Service Name:** `inventory-backend`
   - **Root Directory:** `backend`
5. Click "**Deploy**"

⏱️ Wait 2-3 minutes for first build...

### Step 4: Add Redis Plugin

1. In your project dashboard, click "**New**"
2. Select "**Database**" → "**Add Redis**"
3. Railway automatically creates Redis ✅
4. Railway auto-sets `REDIS_URL` in your backend ✅

### Step 5: Add Environment Variables

1. Click your backend service
2. Go to "**Variables**" tab
3. Click "**New Variable**" or "**Raw Editor**"

**Paste all these variables:**

```env
NODE_ENV=production
PORT=3001

# Database (from Supabase)
DATABASE_URL=postgresql://postgres.[project]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true

# Frontend (will update after Vercel deploy)
FRONTEND_URL=https://your-app.vercel.app
ALLOWED_ORIGINS=https://your-app.vercel.app

# Generate these secrets
JWT_SECRET=use-railway-secret-generator-or-openssl-rand-base64-64
JWT_REFRESH_SECRET=different-secret-use-openssl-rand-base64-64
SESSION_SECRET=use-openssl-rand-base64-32

# Defaults
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
RATE_LIMIT_TTL=900
RATE_LIMIT_MAX=100
MAX_FILE_SIZE=5242880
LOG_LEVEL=info
```

**Tip:** Railway has a secret generator! Click the icon next to each field.

4. Click away to save (auto-saves)
5. Service auto-redeploys (2 min)

### Step 6: Get Your Backend URL

1. Go to "**Settings**" tab
2. Scroll to "**Networking**"
3. Click "**Generate Domain**"
4. Your URL: `https://inventory-backend-production-xxxx.up.railway.app`

**Save this URL!**

Test it:
```
https://inventory-backend-production-xxxx.up.railway.app/health
```

Should show: `{"status":"ok"}` ✅

---

## 📋 Part 3: Deploy Frontend to Vercel (5 minutes)

### Step 1: Import Project

1. Go to https://vercel.com → Sign in with GitHub
2. Click "**Add New...**" → "**Project**"
3. Find `MELLTOOL` → "**Import**"

### Step 2: Configure

**Root Directory:**
- Click "**Edit**"
- Enter: `frontend`

**Environment Variables:**
```
Name: NEXT_PUBLIC_API_URL
Value: https://inventory-backend-production-xxxx.up.railway.app
```
(Your Railway URL from Part 2)

**NO trailing slash!** ✅

### Step 3: Deploy

1. Click "**Deploy**"
2. ⏱️ Wait 2-3 minutes
3. 🎉 Done!

Your app: `https://your-project.vercel.app`

**Save this URL!**

---

## 📋 Part 4: Connect Frontend & Backend (5 minutes)

### Update Railway Variables

Go back to Railway:

1. Click backend service
2. "**Variables**" tab
3. Update these:

```env
FRONTEND_URL=https://your-project.vercel.app
ALLOWED_ORIGINS=https://your-project.vercel.app
```

4. Auto-redeploys (2 min)

### Test Connection

Open your Vercel URL:
```
https://your-project.vercel.app
```

✅ Login page should load!

Press **F12** (browser console):
- ✅ No CORS errors
- ✅ No network errors

---

## 📋 Part 5: Setup Database (2 minutes)

### Run Migrations

**Option A: From Your Computer** (Recommended)

```bash
# Clone if you haven't
git clone https://github.com/YOUR_USERNAME/MELLTOOL.git
cd MELLTOOL/backend

# Install
npm install

# Add your Supabase URL
echo 'DATABASE_URL="postgresql://..."' > .env

# Run migrations
npx prisma generate
npx prisma migrate deploy
```

**Option B: Use Railway CLI**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run migrations
railway run npx prisma migrate deploy
```

### Create Admin User

**Via Supabase Dashboard:**

1. Supabase → **Table Editor** → **users**
2. **Insert row**:
   - email: `admin@yourdomain.com`
   - name: `Admin User`
   - role: `OWNER`
   - isActive: ✅ true
3. Save

✅ **Done!**

---

## 🎉 Deployment Complete!

Your POS system is live at:
```
https://your-project.vercel.app
```

### Test Checklist:

- [ ] Login page loads
- [ ] No errors in console (F12)
- [ ] Can login with admin user
- [ ] Can view products page
- [ ] Can create a product
- [ ] Can upload image
- [ ] Test on iPad

---

## 💰 Cost Breakdown

### Railway Pricing:

**Free Tier:**
- ✅ $5 usage credit/month
- ✅ No cold starts
- ✅ Shared CPU/RAM
- ✅ 500 execution hours
- ✅ 100GB network egress

**Typical Usage (Free Tier):**
- Small POS app: **$2-3/month** (covered by $5 credit!)
- **Effectively FREE** for most small businesses

**If you exceed free tier:**
- **Hobby Plan:** $5/month (removes limits)
- **Pro Plan:** $20/month (team features)

**Total Stack Cost:**
- Vercel: $0
- Railway: $0 (with $5 credit)
- Supabase: $0
- **Total: $0/month** 🎉

---

## 🚀 Railway Features

### Built-in Benefits:

✅ **No Cold Starts** - Always responsive
✅ **Auto Scaling** - Handles traffic spikes
✅ **Instant Rollbacks** - One-click undo
✅ **Real Metrics** - CPU, RAM, requests
✅ **Log Streaming** - Live logs
✅ **GitHub Integration** - Auto-deploy
✅ **Zero Config** - Auto-detects framework
✅ **Fast Deployments** - 2-3 minutes
✅ **Custom Domains** - Free SSL
✅ **Team Collaboration** - Share projects

### Railway CLI:

```bash
# Install
npm install -g @railway/cli

# Login
railway login

# Link project
railway link

# View logs
railway logs

# Run commands
railway run npm run start:dev

# Deploy
railway up

# Open dashboard
railway open
```

---

## 🔄 Automatic Deployments

### GitHub Integration:

```
Push to GitHub
     ↓
Railway detects change
     ↓
Auto-deploys backend (2-3 min)
     ↓
Vercel detects change
     ↓
Auto-deploys frontend (2-3 min)
     ↓
Your app is updated!
```

### Deployment Settings:

**In Railway:**
1. Service → **Settings**
2. **Deploy Triggers**
3. Toggle "**Automatically deploy new commits**"

**In Vercel:**
- Auto-enabled by default

### Manual Deployment:

**Railway:**
- Dashboard → Service → "**Deploy**"
- Or: `railway up` (CLI)

**Vercel:**
- Dashboard → Deployments → "**Redeploy**"
- Or: `vercel --prod` (CLI)

---

## 📱 Custom Domain

### Add to Vercel:

1. Vercel → Project → **Settings** → **Domains**
2. Add: `mypos.com`
3. Follow DNS instructions
4. Auto SSL ✅

### Add to Railway:

1. Railway → Service → **Settings**
2. Scroll to **Networking**
3. Click "**Custom Domain**"
4. Add: `api.mypos.com`
5. Update DNS with provided CNAME
6. Auto SSL ✅

### Update Environment Variables:

**Railway:**
```env
FRONTEND_URL=https://mypos.com
ALLOWED_ORIGINS=https://mypos.com
```

**Vercel:**
```env
NEXT_PUBLIC_API_URL=https://api.mypos.com
```

---

## 💾 Database Backups

### Supabase Free Tier:
- Manual backups (export SQL)
- See [SUPABASE_SETUP.md](SUPABASE_SETUP.md)

### Supabase Pro ($25/mo):
- Daily automatic backups
- Point-in-time recovery

### DIY Automated Backups:

**Using Railway CLI + Cron:**

```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
pg_dump "$SUPABASE_DATABASE_URL" | gzip > backup_$(date +%Y%m%d).sql.gz
# Upload to your storage (S3, Dropbox, etc.)
EOF

# Make executable
chmod +x backup.sh

# Add to crontab
crontab -e
# Add: 0 2 * * * /path/to/backup.sh
```

**Using GitHub Actions:**

See [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for automated backup workflows.

---

## 📊 Monitoring

### Railway Dashboard:

1. **Metrics Tab:**
   - CPU usage
   - Memory usage
   - Network traffic
   - Request count

2. **Deployments Tab:**
   - Build logs
   - Deploy history
   - Rollback options

3. **Logs Tab:**
   - Live log streaming
   - Filter by severity
   - Download logs

### Recommended Additions:

**UptimeRobot** (Free):
- Monitor uptime
- Email alerts
- https://uptimerobot.com

**Sentry** (Optional):
- Error tracking
- Performance monitoring
- https://sentry.io

---

## 🔧 Troubleshooting

### Problem: "Network Error" in Frontend

**Check:**
1. Railway backend URL in Vercel env vars
2. No trailing slash in URLs
3. Backend health: `/health` endpoint

**Fix:**
1. Verify `NEXT_PUBLIC_API_URL` in Vercel
2. Check `ALLOWED_ORIGINS` in Railway
3. Redeploy both if needed

### Problem: "Database Connection Error"

**Check:**
1. `DATABASE_URL` in Railway
2. Using connection pooler (port 6543)
3. Has `?pgbouncer=true`
4. Supabase not paused

**Fix:**
1. Verify Supabase connection string
2. Test: `railway run npx prisma db pull`
3. Add `connection_limit=10` if needed

### Problem: Deployment Fails

**Check Railway build logs:**
1. Railway → Service → **Deployments**
2. Click failed deployment
3. View build logs

**Common issues:**
- Missing dependencies
- TypeScript errors
- Prisma generation failed

**Fix:**
- Fix errors in code
- Push to GitHub
- Auto-redeploys

### Problem: High Usage (Exceeding Free Credit)

**Check usage:**
1. Railway → Project → **Usage**
2. View current month usage

**Solutions:**
1. Optimize queries
2. Add caching (Redis)
3. Upgrade to Hobby plan ($5/mo)
4. Set usage limits

---

## 🎓 Railway Tips & Tricks

### 1. Environment Variable Management

**Use .env file locally:**
```bash
# Pull from Railway
railway variables

# Push to Railway
railway variables set KEY=value
```

### 2. Local Development

**Run with Railway environment:**
```bash
railway run npm run start:dev
```

### 3. Database Management

**Access Railway's database URL:**
```bash
railway run npx prisma studio
```

### 4. Quick Deploy

**Deploy specific branch:**
```bash
railway up --service backend
```

### 5. Logs

**Stream logs:**
```bash
railway logs --follow
```

### 6. Rollback

**In dashboard:**
- Deployments → Previous deployment → "**Redeploy**"

---

## 📚 Additional Resources

### Documentation:
- **Railway:** https://docs.railway.app
- **Vercel:** https://vercel.com/docs
- **Supabase:** https://supabase.com/docs

### Your Guides:
- **Main Guide:** This file
- **Supabase:** [SUPABASE_SETUP.md](SUPABASE_SETUP.md)
- **All Options:** [DEPLOY_README.md](DEPLOY_README.md)

### Dashboards:
- **Railway:** https://railway.app/dashboard
- **Vercel:** https://vercel.com/dashboard
- **Supabase:** https://app.supabase.com

---

## ✅ Final Checklist

- [ ] Supabase project created
- [ ] Database connection string saved
- [ ] Railway project created
- [ ] Redis plugin added
- [ ] Backend deployed to Railway
- [ ] All environment variables set
- [ ] Frontend deployed to Vercel
- [ ] Frontend/backend connected
- [ ] Database migrations ran
- [ ] Admin user created
- [ ] Can access login page
- [ ] No CORS errors
- [ ] Can login successfully
- [ ] Can create products
- [ ] Can upload images
- [ ] Tested on iPad
- [ ] Monitoring set up (optional)
- [ ] Backups configured (optional)

---

## 🎉 Congratulations!

You now have a production-ready POS system on the **best stack for 2025**:

✅ **Vercel** - Blazing fast frontend
✅ **Railway** - Developer-friendly backend (no cold starts!)
✅ **Supabase** - Managed database with great UX

**Your stack is:**
- 🚀 Lightning fast (no cold starts!)
- 💰 Cost-effective ($0/month with Railway credit)
- 🔒 Secure (HTTPS everywhere)
- 📈 Scalable (auto-scales)
- 🛠️ Developer-friendly (best DX)
- 🌍 Global (CDN + edge)

**Start selling! 🛍️**

---

**Questions?** Check:
- [SUPABASE_SETUP.md](SUPABASE_SETUP.md) - Database help
- [DEPLOY_README.md](DEPLOY_README.md) - All options
- Railway Docs: https://docs.railway.app

**Estimated Time:** 25 minutes
**Monthly Cost:** $0 (Railway $5 credit covers usage!)
**Difficulty:** ⭐⭐☆☆☆ (Beginner-friendly)

**Last Updated:** January 2025
