# 🚀 Deploy to Vercel + Render - Complete Guide

**Perfect for beginners! Get your POS system online in 20 minutes.**

**Why Vercel + Render?**
- ✅ **Super Easy** - No server management
- ✅ **Free Tier** - Start for free, upgrade when needed
- ✅ **Automatic HTTPS** - SSL included free
- ✅ **Auto Deploy** - Push code → automatically deployed
- ✅ **Global CDN** - Fast worldwide
- ✅ **No Credit Card** - Free tier doesn't need payment info initially

**Monthly Cost:**
- 🆓 **Free Tier:** $0/month (perfect for testing)
- 💰 **Production:** ~$14/month (Render Starter plans)

---

## 📋 What You'll Deploy

```
Frontend (Vercel)          Backend (Render)
┌─────────────┐           ┌──────────────────┐
│  Next.js    │  ←────→   │   NestJS API     │
│  React App  │           │   PostgreSQL     │
│  iPad UI    │           │   Redis Cache    │
└─────────────┘           └──────────────────┘
     FREE                    FREE or $7/mo
```

---

## Part 1: Deploy Backend to Render (10 minutes)

### Step 1: Create Render Account

1. Go to https://render.com
2. Click "Get Started"
3. Sign up with **GitHub** (recommended) or email
4. Verify your email

### Step 2: Connect Your GitHub Repository

1. On Render dashboard, click "New +"
2. Select "Blueprint"
3. Click "Connect GitHub"
4. Authorize Render
5. Select your repository: `MELLTOOL`
6. Click "Connect"

### Step 3: Deploy with Blueprint

Render will automatically detect `render.yaml` and show:

**Services to be created:**
- ✅ inventory-backend (Web Service)
- ✅ inventory-redis (Redis)
- ✅ inventory-db (PostgreSQL)

Click "**Apply**"

**Wait 5-10 minutes** while Render:
- Creates database
- Creates Redis
- Builds your backend
- Deploys everything

### Step 4: Configure Environment Variables

Once deployed, go to your backend service:

1. Click on "**inventory-backend**"
2. Go to "**Environment**" tab
3. Add these variables:

```
FRONTEND_URL = https://your-app.vercel.app
ALLOWED_ORIGINS = https://your-app.vercel.app
```

(We'll get the Vercel URL in Part 2)

4. Click "**Save Changes**"

The service will automatically redeploy.

### Step 5: Get Your Backend URL

1. On your backend service page, find the URL:
   ```
   https://inventory-backend-xxxx.onrender.com
   ```

2. **Save this URL!** You'll need it for Vercel.

3. Test it - open in browser:
   ```
   https://inventory-backend-xxxx.onrender.com/health
   ```
   Should show: `{"status":"ok"}`

### Step 6: Run Database Migrations

1. Go to your backend service
2. Click "**Shell**" tab (or "**SSH**")
3. Run these commands:

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

If Shell is not available on free tier, migrations will run automatically on first build.

---

## Part 2: Deploy Frontend to Vercel (5 minutes)

### Step 1: Create Vercel Account

1. Go to https://vercel.com
2. Click "**Sign Up**"
3. Sign up with **GitHub** (same account as Render)
4. Authorize Vercel

### Step 2: Import Your Project

1. Click "**Add New...**" → "**Project**"
2. Find your repository: `MELLTOOL`
3. Click "**Import**"

### Step 3: Configure Build Settings

Vercel will auto-detect Next.js. Configure:

**Root Directory:** `frontend`
- Click "Edit" next to Root Directory
- Enter: `frontend`

**Build Command:** `npm run build` (already set)

**Output Directory:** `.next` (already set)

### Step 4: Add Environment Variables

Click "Environment Variables", add:

```
Name: NEXT_PUBLIC_API_URL
Value: https://inventory-backend-xxxx.onrender.com
```

(Use your Render backend URL from Part 1, Step 5)

**Important:** Make sure there's NO trailing slash!

✅ Correct: `https://inventory-backend-xxxx.onrender.com`
❌ Wrong: `https://inventory-backend-xxxx.onrender.com/`

### Step 5: Deploy!

1. Click "**Deploy**"
2. Wait 2-3 minutes
3. You'll see: "🎉 Congratulations!"

### Step 6: Get Your Frontend URL

Your app is now live at:
```
https://your-project-name.vercel.app
```

**Save this URL!**

---

## Part 3: Connect Frontend & Backend (5 minutes)

### Update Backend with Frontend URL

1. Go back to Render dashboard
2. Click "**inventory-backend**"
3. Go to "**Environment**" tab
4. Update these variables:

```
FRONTEND_URL = https://your-project-name.vercel.app
ALLOWED_ORIGINS = https://your-project-name.vercel.app
```

5. Click "**Save Changes**"

Backend will redeploy automatically (takes 2-3 minutes).

### Test Your Application!

Open your Vercel URL:
```
https://your-project-name.vercel.app
```

You should see:
- ✅ Login page loads
- ✅ No CORS errors (check browser console)
- ✅ Can create account / login

---

## Part 4: Create Admin User

You need an admin user to login. Two options:

### Option A: Via Render Shell (Recommended)

1. Go to Render → **inventory-backend**
2. Click "**Shell**" tab
3. Run:

```bash
cd backend
npx prisma studio
```

If Prisma Studio doesn't work in shell, use Option B.

### Option B: Via Database Console

1. Go to Render → **inventory-db**
2. Click "**Connect**" → "**External Connection**"
3. Use these credentials with a PostgreSQL client
4. Or use "**psql**" command shown

Run this SQL:
```sql
INSERT INTO users (id, email, name, role, "isActive", "createdAt", "updatedAt")
VALUES (
  'admin-001',
  'admin@yourdomain.com',
  'Admin User',
  'OWNER',
  true,
  NOW(),
  NOW()
);
```

Now you can login with:
- Email: admin@yourdomain.com
- Password: (will need to set via password reset or update directly)

---

## 🎉 You're Live!

Your POS system is now deployed!

**Your URLs:**
- 🌐 Frontend: `https://your-project-name.vercel.app`
- 🔧 Backend API: `https://inventory-backend-xxxx.onrender.com`
- 📊 API Docs: `https://inventory-backend-xxxx.onrender.com/api`

---

## 📱 Custom Domain (Optional)

### Add Custom Domain to Vercel

1. Buy domain from Namecheap, GoDaddy, etc. ($10-15/year)
2. In Vercel project:
   - Go to "**Settings**" → "**Domains**"
   - Add your domain: `mypos.com`
   - Follow DNS instructions
3. Update Render environment variables with new domain

### Add Custom Domain to Render

1. In Render backend service:
   - Go to "**Settings**" → "**Custom Domain**"
   - Add: `api.mypos.com`
   - Update DNS records as instructed

---

## 🔄 Automatic Deployments

Both platforms auto-deploy when you push to GitHub!

**Vercel:**
- Push to `main` branch → Auto deploy frontend
- See deployments in Vercel dashboard

**Render:**
- Push to `main` branch → Auto deploy backend
- See deployments in Render dashboard

### Deploy from Different Branch

**Vercel:**
1. Go to project → Settings → Git
2. Change "Production Branch"

**Render:**
1. Edit `render.yaml`, change `branch: main` to your branch
2. Or in service settings → "Branch" dropdown

---

## 💾 Database Backups

### Render PostgreSQL Backups

**Free Tier:** No automatic backups
**Paid Plans ($7+/month):** Daily automatic backups

**Manual Backup:**

1. Go to Render → **inventory-db**
2. Click "**Connect**"
3. Copy the connection string
4. Use on your computer:

```bash
# Install PostgreSQL client first
# Mac: brew install postgresql
# Linux: apt install postgresql-client
# Windows: Download from postgresql.org

# Create backup
pg_dump "YOUR_DATABASE_URL" > backup_$(date +%Y%m%d).sql

# Or compressed
pg_dump "YOUR_DATABASE_URL" | gzip > backup_$(date +%Y%m%d).sql.gz
```

**Schedule Backups with GitHub Actions:**

Create `.github/workflows/backup.yml`:

```yaml
name: Database Backup
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
          pg_dump "${{ secrets.DATABASE_URL }}" | gzip > backup.sql.gz

      - name: Upload to Storage
        # Upload to S3, Google Drive, etc.
        run: |
          echo "Upload backup to your storage"
```

---

## 📊 Monitoring

### Vercel Analytics (Free)

1. Go to your project → "**Analytics**"
2. View traffic, performance, errors
3. Free tier includes basic analytics

### Render Metrics (Free)

1. Go to your service → "**Metrics**"
2. View CPU, Memory, Response time
3. Set up alerts in Settings → Notifications

### Uptime Monitoring (Free)

Use **UptimeRobot.com**:
1. Sign up free
2. Add monitor:
   - Type: HTTPS
   - URL: Your Vercel URL
   - Interval: 5 minutes
3. Get email alerts if site goes down

---

## 🔧 Troubleshooting

### Frontend Shows "Network Error"

**Check:**
1. Is backend URL correct in Vercel environment variables?
2. Does backend health check work?
   ```
   https://inventory-backend-xxxx.onrender.com/health
   ```
3. Check browser console for CORS errors
4. Verify `ALLOWED_ORIGINS` in Render includes your Vercel URL

**Fix:**
1. Go to Render → Backend → Environment
2. Update `ALLOWED_ORIGINS`
3. Save (auto redeploys)

### Backend Shows "Database Connection Error"

**Check:**
1. Go to Render → inventory-db
2. Check status (should be "Available")
3. Go to Backend → Environment
4. Check `DATABASE_URL` is connected

**Fix:**
1. Backend → Environment
2. DATABASE_URL should show "From database: inventory-db"
3. If not, reconnect database

### "Build Failed" on Render

**Common causes:**
1. Missing dependencies in package.json
2. TypeScript errors
3. Prisma issues

**Check logs:**
1. Render → Backend → "Logs" tab
2. Look for error messages
3. Fix in your code, push to GitHub

### Render Free Tier Sleeps After 15 Minutes

**Free tier limitation:**
- Backend sleeps after 15 min of inactivity
- First request takes 30-60 seconds to wake up

**Solutions:**
1. Upgrade to paid plan ($7/month) - no sleep
2. Use a ping service (UptimeRobot) to keep it awake
3. Accept the delay for free tier

---

## 💰 Pricing Breakdown

### Free Forever:

| Service | Free Tier |
|---------|-----------|
| **Vercel** | Unlimited projects, 100GB bandwidth |
| **Render** | 750 hours/month (enough for 1 service 24/7) |
| **PostgreSQL** | Free tier available |
| **Redis** | Free tier available |

**Total: $0/month** (perfect for testing, small projects)

### Production Ready:

| Service | Paid Plan | Cost |
|---------|-----------|------|
| **Vercel Pro** | Better performance, team features | $20/month |
| **Render Starter** | No sleep, daily backups | $7/month |
| **PostgreSQL** | Starter (256MB RAM) | Included in Render |
| **Redis** | Starter (25MB) | Included in Render |

**Total: $7-27/month** depending on needs

### Recommended Start:

1. **Start Free** - Test everything
2. **Upgrade Backend** first ($7/month) - No sleep, backups
3. **Upgrade Frontend** later if needed ($20/month)

---

## 🚀 Performance Optimization

### Vercel Optimizations

1. **Enable Edge Caching:**
   - Next.js automatically optimizes
   - Static pages served from CDN

2. **Image Optimization:**
   - Use Next.js Image component
   - Automatic WebP conversion

3. **Analytics:**
   - Enable in project settings
   - Monitor Core Web Vitals

### Render Optimizations

1. **Choose Nearest Region:**
   - Singapore for Asia
   - Oregon for US West
   - Frankfurt for Europe

2. **Redis Caching:**
   - Already configured
   - Reduces database load

3. **Connection Pooling:**
   - Prisma handles this automatically
   - Set in DATABASE_URL

---

## 🔄 Updates & Maintenance

### How to Update Your App

1. **Make changes locally**
2. **Commit to GitHub:**
   ```bash
   git add .
   git commit -m "Update feature"
   git push origin main
   ```
3. **Automatic deployment:**
   - Vercel deploys frontend (2-3 min)
   - Render deploys backend (5-7 min)

### Database Migrations

When you change Prisma schema:

1. **Local:**
   ```bash
   cd backend
   npx prisma migrate dev --name your_change
   git push
   ```

2. **Render will auto-run:**
   - Migrations run during build
   - Check logs to verify

3. **Or run manually:**
   - Render → Backend → Shell
   - `npx prisma migrate deploy`

---

## ✅ Post-Deployment Checklist

- [ ] Frontend loads at Vercel URL
- [ ] Backend health check returns OK
- [ ] Can login to application
- [ ] Can create/view products
- [ ] Can create orders
- [ ] Images upload works
- [ ] QR scanner works on mobile
- [ ] Set up uptime monitoring
- [ ] Configured custom domain (optional)
- [ ] Set up database backups
- [ ] Tested on iPad

---

## 📞 Getting Help

### Vercel Support
- Docs: https://vercel.com/docs
- Community: https://github.com/vercel/vercel/discussions

### Render Support
- Docs: https://render.com/docs
- Community: https://community.render.com
- Status: https://status.render.com

### Your Application
- Check Vercel deployment logs
- Check Render service logs
- Check browser console (F12)

---

## 🎓 Next Steps

1. ✅ **Test Everything** - Create products, process orders
2. 📊 **Set Up Analytics** - Vercel Analytics + Google Analytics
3. 🔔 **Configure Alerts** - UptimeRobot for uptime monitoring
4. 💾 **Schedule Backups** - Use GitHub Actions or cron
5. 🌐 **Custom Domain** - Professional look
6. 📱 **Test on iPad** - Main use case
7. 👥 **Train Staff** - Show them how to use it
8. 📈 **Monitor Usage** - Check Vercel and Render dashboards

---

## 🎉 Congratulations!

Your POS system is now live on the cloud with:

✅ **Automatic HTTPS** - Secure by default
✅ **Global CDN** - Fast everywhere
✅ **Auto Deployments** - Push code → Live
✅ **Free Tier** - $0 to start
✅ **Scalable** - Grows with your business
✅ **Professional** - Production-ready

**Start selling! 🛍️**

---

**Need the full guide?** See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

**Quick local test?** See [DEPLOYMENT_QUICK_START.md](DEPLOYMENT_QUICK_START.md)

**Last Updated:** January 2025
**Estimated Time:** 20 minutes
**Difficulty:** ⭐⭐☆☆☆ (Beginner-friendly)
