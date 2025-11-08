# Vercel Frontend Deployment Guide - MELLTOOL

**Complete step-by-step guide to deploy your Next.js frontend to Vercel**

Estimated time: **10 minutes**

---

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start (10 minutes)](#quick-start-10-minutes)
- [Detailed Setup](#detailed-setup)
- [Environment Variables](#environment-variables)
- [Custom Domain (Optional)](#custom-domain-optional)
- [Testing Your Deployment](#testing-your-deployment)
- [Troubleshooting](#troubleshooting)
- [Cost](#cost)

---

## Prerequisites

1. **GitHub Account**: Your code should be on GitHub
2. **Vercel Account**: Sign up at https://vercel.com (free)
3. **Backend Deployed**: Your Fly.io backend should be live (we'll do this after)

**Note:** You can deploy the frontend first, then update the API URL later!

---

## Quick Start (10 minutes)

### Step 1: Push Code to GitHub (if not already done)

**If your code is already on GitHub, skip to Step 2!**

```bash
# Navigate to your project
cd /path/to/MELLTOOL

# Initialize git (if not done)
git init
git add .
git commit -m "Initial commit"

# Create repository on GitHub first
# Then push to GitHub
git remote add origin https://github.com/YOUR_USERNAME/MELLTOOL.git
git branch -M main
git push -u origin main
```

---

### Step 2: Sign Up for Vercel (2 minutes)

1. **Go to** https://vercel.com
2. **Click** "Sign Up"
3. **Choose** "Continue with GitHub"
4. **Authorize** Vercel to access your repositories

✅ **You're now logged into Vercel!**

---

### Step 3: Import Your Project (3 minutes)

1. **Click** "Add New Project" or "Import Project"
2. **Select** "Import Git Repository"
3. **Find** your MELLTOOL repository
4. **Click** "Import"

**Configure Project:**

```
Framework Preset: Next.js (should auto-detect)

Root Directory: frontend
⚠️ IMPORTANT: Click "Edit" and set to "frontend"
This tells Vercel where your Next.js app is!

Build Command: npm run build (default)
Output Directory: .next (default)
Install Command: npm install (default)
```

**Don't click Deploy yet!** We need to add environment variables first.

---

### Step 4: Add Environment Variables (2 minutes)

Before deploying, scroll down to **"Environment Variables"** section:

**Option A: Deploy Frontend First (Recommended)**

If you haven't deployed Fly.io backend yet:

```
Name: NEXT_PUBLIC_API_URL
Value: http://localhost:3001
Environment: Production
```

**Click "Add"**

We'll update this after deploying Fly.io backend!

---

**Option B: If Fly.io Backend is Already Deployed**

```
Name: NEXT_PUBLIC_API_URL
Value: https://melltool-backend.fly.dev
Environment: Production
```

**Click "Add"**

**⚠️ IMPORTANT:**
- No trailing slash! ❌ `https://melltool-backend.fly.dev/`
- Must start with `https://` ✅

---

### Step 5: Deploy! (3 minutes)

1. **Click** "Deploy"
2. **Wait** 2-3 minutes while Vercel builds your app
3. **Watch** the build logs (fascinating! 🚀)

**You'll see:**
```
Building...
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization
✓ Build completed successfully!
```

4. **Click** "Go to Dashboard" when done

---

### Step 6: Get Your Frontend URL (30 seconds)

After deployment:

1. You'll see a preview of your site
2. Your URL is shown at the top
3. Usually: `https://melltool-xxx.vercel.app`

**Click** "Visit" to open your frontend!

✅ **Your frontend is now live!** 🎉

---

### Step 7: Update Backend with Frontend URL (if Fly.io is deployed)

**If your Fly.io backend is already running:**

```bash
# Update the FRONTEND_URL secret
flyctl secrets set FRONTEND_URL="https://melltool-xxx.vercel.app"
```

**Replace `melltool-xxx` with your actual Vercel URL!**

This allows your backend to accept requests from your frontend (CORS).

---

## 📖 Detailed Setup

### Project Structure

Vercel needs to know where your Next.js app is:

```
MELLTOOL/
├── frontend/          ← Your Next.js app is here
│   ├── app/
│   ├── components/
│   ├── package.json
│   └── next.config.js
├── backend/
├── fly.toml
└── README.md
```

**Root Directory must be set to `frontend`!**

---

### Build Settings Explained

```
Framework: Next.js
- Vercel auto-detects this
- Optimizes build for Next.js

Root Directory: frontend
- Tells Vercel to build from /frontend folder
- Without this, build will fail!

Build Command: npm run build
- Runs Next.js production build
- Creates optimized .next folder

Output Directory: .next
- Where Next.js puts compiled files
- Vercel serves from here

Install Command: npm install
- Installs all dependencies
- Runs automatically
```

---

## 🔧 Environment Variables

### Required Variables

**NEXT_PUBLIC_API_URL** (Required)

Your backend API URL. This tells your frontend where to send API requests.

```
Production Backend (Fly.io):
NEXT_PUBLIC_API_URL=https://melltool-backend.fly.dev

Local Development:
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**⚠️ Important Rules:**
- Must start with `NEXT_PUBLIC_` to be accessible in browser
- NO trailing slash
- Must be HTTPS in production
- Changes require redeployment

---

### Optional Variables

**Google Analytics (Optional)**

```
Name: NEXT_PUBLIC_GA_ID
Value: G-XXXXXXXXXX
Environment: Production
```

Get from: https://analytics.google.com

---

**Sentry Error Tracking (Optional)**

```
Name: NEXT_PUBLIC_SENTRY_DSN
Value: https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
Environment: Production
```

Get from: https://sentry.io

---

**Feature Flags (Optional)**

```
Name: NEXT_PUBLIC_ENABLE_SHOPEE_INTEGRATION
Value: true
Environment: Production

Name: NEXT_PUBLIC_ENABLE_CAMERA_SCANNER
Value: true
Environment: Production
```

---

### How to Add/Update Environment Variables

**Method 1: During Deployment** (already covered above)

**Method 2: After Deployment**

1. Go to your project dashboard
2. Click **"Settings"** tab
3. Click **"Environment Variables"** (left sidebar)
4. Click **"Add New"**
5. Fill in:
   - **Key**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://melltool-backend.fly.dev`
   - **Environment**: Check `Production` (and `Preview` if wanted)
6. Click **"Save"**
7. **Redeploy** for changes to take effect:
   - Go to **"Deployments"** tab
   - Click **"⋯"** (three dots) on latest deployment
   - Click **"Redeploy"**

---

### Method 3: Using Vercel CLI (Advanced)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Add environment variable
vercel env add NEXT_PUBLIC_API_URL

# When prompted:
# Value: https://melltool-backend.fly.dev
# Environment: Production

# Redeploy
vercel --prod
```

---

## 🌐 Custom Domain (Optional)

### Add Your Own Domain

Instead of `melltool-xxx.vercel.app`, use your own domain like `app.yourdomain.com`

**Steps:**

1. **Buy a domain** (if you don't have one)
   - Namecheap, GoDaddy, Google Domains, etc.
   - Cost: ~$10-15/year

2. **Add domain in Vercel:**
   - Project → Settings → Domains
   - Click "Add"
   - Enter your domain: `app.yourdomain.com`
   - Click "Add"

3. **Update DNS records** (in your domain registrar):

   **Option A: CNAME Record** (Subdomain)
   ```
   Type: CNAME
   Name: app
   Value: cname.vercel-dns.com
   ```

   **Option B: A Record** (Root domain)
   ```
   Type: A
   Name: @
   Value: 76.76.19.19
   ```

4. **Wait** 5-60 minutes for DNS propagation

5. **Vercel automatically** provisions SSL certificate

6. ✅ **Done!** Your site is now at your custom domain with HTTPS!

---

## 🧪 Testing Your Deployment

### Basic Tests

**1. Visit Your Site**
```
https://melltool-xxx.vercel.app
```

Should load without errors.

---

**2. Check Console (F12)**

Open browser console:
- Press F12
- Click "Console" tab
- Look for errors (red text)

**Common errors:**
- `Failed to fetch` = Backend not running or wrong URL
- `CORS error` = Backend FRONTEND_URL not set correctly
- `404` = Page not found

---

**3. Test Login Flow**

Try to login:
- Go to login page
- Enter credentials
- Check if API call works

**In console, you should see:**
```
POST https://melltool-backend.fly.dev/api/auth/login 200
```

✅ If `200` = Working!
❌ If `404`/`500` = Backend issue
❌ If `CORS error` = Backend FRONTEND_URL needs updating

---

**4. Check Network Tab**

In browser console:
- Click **"Network"** tab
- Reload page
- Look for API calls
- Click on any API call
- Check **"Headers"** section
- Verify Request URL is correct

---

### Advanced Tests

**Check Environment Variables:**

In your frontend code, add a debug log:

```javascript
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);
```

Deploy, open console, should see:
```
API URL: https://melltool-backend.fly.dev
```

---

**Test API Connection:**

In browser console, run:

```javascript
fetch(process.env.NEXT_PUBLIC_API_URL + '/health')
  .then(r => r.json())
  .then(d => console.log(d))
  .catch(e => console.error(e));
```

Should see:
```javascript
{status: "ok"}
```

---

## 🆘 Troubleshooting

### Build Fails with "Cannot find module"

**Error:**
```
Error: Cannot find module 'next'
```

**Solution:**
- Make sure Root Directory is set to `frontend`
- Check package.json exists in frontend folder
- Try clearing build cache:
  - Settings → General → Clear Build Cache

---

### API Calls Fail with CORS Error

**Error in console:**
```
Access to fetch at 'https://melltool-backend.fly.dev' has been blocked by CORS policy
```

**Solution:**

1. **Update Fly.io backend FRONTEND_URL:**
   ```bash
   flyctl secrets set FRONTEND_URL="https://your-vercel-url.vercel.app"
   ```

2. **Check both URLs have no trailing slash:**
   ```
   ✅ https://melltool-backend.fly.dev
   ❌ https://melltool-backend.fly.dev/
   ```

3. **Restart Fly.io backend:**
   ```bash
   flyctl apps restart melltool-backend
   ```

---

### Environment Variables Not Working

**Symptoms:**
- `NEXT_PUBLIC_API_URL` is `undefined`
- API calls go to wrong URL

**Solution:**

1. **Check variable name** starts with `NEXT_PUBLIC_`
2. **Verify in Vercel dashboard:**
   - Settings → Environment Variables
   - Should see your variables listed
3. **Redeploy after adding variables:**
   - Deployments → ⋯ → Redeploy
4. **Clear browser cache** (Ctrl+Shift+Delete)

---

### Deployment Keeps Failing

**Error:**
```
Build exceeded maximum duration of 45 minutes
```

**Solution:**
- Your build is too slow
- Check for infinite loops in code
- Remove heavy dependencies
- Contact Vercel support

---

### Page Shows 404

**Error:**
```
404 - This page could not be found
```

**Solution:**
- Check your Next.js routing
- Make sure pages exist in `app/` or `pages/` directory
- Check for typos in URLs
- Verify build completed successfully

---

### Slow Loading

**Symptoms:**
- Pages take long to load
- Images loading slowly

**Solution:**

1. **Optimize images:**
   - Use Next.js Image component
   - Convert to WebP format
   - Use smaller sizes

2. **Enable caching:**
   - Already enabled by default in Vercel
   - Check Cache-Control headers

3. **Use CDN:**
   - Vercel automatically uses edge network
   - Deploy to multiple regions

4. **Check backend performance:**
   - Slow API responses affect frontend
   - Monitor Fly.io backend logs

---

## 💰 Cost

### Vercel Pricing

**Free Tier (Hobby):**
- **100 GB bandwidth/month**
- **100 GB-hours serverless execution**
- **Automatic SSL certificates**
- **Custom domains**
- **Perfect for:** Personal projects, testing, small apps

**Cost: $0/month** 🎉

---

**Pro Plan ($20/month):**
- **1 TB bandwidth/month**
- **1000 GB-hours execution**
- **Team collaboration**
- **Analytics**
- **Password protection**
- **For:** Production apps, businesses

---

**Your Usage Estimate:**

For small to medium business:
- Traffic: ~10-50GB/month
- Execution: ~20-100 GB-hours/month
- **Fits within free tier!** ✅

You likely won't pay anything unless you get huge traffic!

---

## 📊 Monitoring & Analytics

### Vercel Analytics (Optional)

Enable built-in analytics:

1. Project → Analytics tab
2. Click "Enable"
3. See real-time visitors, page views, performance

**Free tier includes:**
- 100k events/month
- Real-time data
- Core Web Vitals
- Page speed scores

---

### View Deployment Logs

1. Project → Deployments
2. Click any deployment
3. Click "Build Logs" or "Function Logs"
4. See detailed output

Useful for debugging issues!

---

## 🚀 Continuous Deployment

**Automatic Deployments:**

Every time you push to GitHub:
- Vercel automatically detects changes
- Builds your app
- Deploys to production
- Takes 2-3 minutes

**Branches:**
```
main branch → Production
other branches → Preview deployments
```

**Preview Deployments:**
- Every branch gets its own URL
- Test changes before merging
- Example: `melltool-git-feature-xxx.vercel.app`

---

## ✅ Deployment Checklist

**Before Deploying:**
- [ ] Code pushed to GitHub
- [ ] `frontend/` folder exists with Next.js app
- [ ] `package.json` in frontend folder
- [ ] `.env.vercel` file created (optional, for reference)

**During Deployment:**
- [ ] Root Directory set to `frontend`
- [ ] Environment variables added
- [ ] `NEXT_PUBLIC_API_URL` configured
- [ ] Build completes successfully

**After Deployment:**
- [ ] Site loads without errors
- [ ] Can navigate between pages
- [ ] API URL is correct (check console)
- [ ] Backend FRONTEND_URL updated (if Fly.io deployed)
- [ ] Test login/authentication works
- [ ] Check mobile responsiveness

---

## 🎯 Next Steps

1. ✅ **Frontend deployed** - You are here!
2. ⏭️ **Deploy backend to Fly.io** - Do this next
3. ⏭️ **Update environment variables:**
   - Update Vercel `NEXT_PUBLIC_API_URL` with Fly.io URL
   - Update Fly.io `FRONTEND_URL` with Vercel URL
4. ⏭️ **Test complete flow** - Login, add products, etc.
5. ⏭️ **Create admin user**
6. ⏭️ **Add custom domain** (optional)

---

## 🔗 Quick Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Documentation**: https://vercel.com/docs
- **Support**: https://vercel.com/support
- **Status**: https://vercel-status.com

---

## 📱 Vercel CLI Cheatsheet

```bash
# Install
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod

# List deployments
vercel ls

# View logs
vercel logs

# Remove deployment
vercel remove [deployment-url]

# List environment variables
vercel env ls

# Add environment variable
vercel env add [name]

# Pull environment variables
vercel env pull

# Link local project
vercel link
```

---

**Your frontend is ready to deploy!** 🚀

**Important Note:** You can deploy the frontend now even if the backend isn't ready. Just use `http://localhost:3001` as the API URL temporarily, then update it later when Fly.io backend is deployed!

**Need help with Fly.io backend next?** Let me know and we'll deploy your backend!
