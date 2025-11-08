# Supabase Setup Guide for MELLTOOL

**Complete beginner-friendly guide to setup your PostgreSQL database on Supabase**

Estimated time: **10 minutes**

---

## 📋 What is Supabase?

Supabase is a managed PostgreSQL database service (like a spreadsheet in the cloud, but much more powerful). Your backend app will store all data here:
- User accounts
- Products & inventory
- Orders & sales
- Categories & brands
- Stock movements

---

## 🚀 Step-by-Step Setup

### Step 1: Create Supabase Account (2 minutes)

1. **Go to Supabase**: Open https://supabase.com in your browser
2. **Click "Start your project"** (green button)
3. **Sign up with GitHub**:
   - Click "Continue with GitHub"
   - Authorize Supabase (if asked)
   - OR use email/password if you prefer

✅ **You're now logged into Supabase!**

---

### Step 2: Create a New Project (3 minutes)

1. **Click "New Project"** (you'll see this on the dashboard)

2. **Fill in the project details**:

   ```
   Organization: Choose your organization (or create new one)

   Name: melltool
   (or any name you like - no spaces!)

   Database Password: Click the "Generate a password" button
   ⚠️ IMPORTANT: Copy this password immediately!
   Save it somewhere safe (Notes app, password manager)
   You'll need this later!

   Region: ap-southeast-1 (Singapore)
   Choose the closest region to your users:
   - Singapore: ap-southeast-1
   - Tokyo: ap-northeast-1
   - Sydney: ap-southeast-2
   - US East: us-east-1
   - Europe: eu-west-1

   Pricing Plan: Free
   (Includes 500MB database, perfect to start)
   ```

3. **Click "Create new project"**

4. **Wait 2-3 minutes** ⏳
   - You'll see a progress screen
   - It says "Setting up your project..."
   - Grab a coffee ☕
   - The database is being created!

5. **✅ Done!** When you see the project dashboard, you're ready!

---

### Step 3: Get Your Connection String (2 minutes)

This is the "address" your backend will use to connect to the database.

1. **In your Supabase project, look at the left sidebar**
2. **Click the ⚙️ Settings icon** (bottom left)
3. **Click "Database"** in the settings menu
4. **Scroll down to "Connection string" section**
5. **Click the "Connection pooling" tab** (NOT the "URI" tab)

   You'll see something like:
   ```
   postgresql://postgres.xxxxxxxxxx:[YOUR-PASSWORD]@xxx.pooler.supabase.com:6543/postgres
   ```

6. **Copy this connection string**:
   - Click the copy icon 📋 on the right
   - OR manually select all and copy

7. **Replace `[YOUR-PASSWORD]` with your actual password**:
   - Remember the password you saved in Step 2?
   - Replace `[YOUR-PASSWORD]` with that password
   - NO brackets! Just the password

   Example:
   ```
   Before: postgresql://postgres.abcxxx:[YOUR-PASSWORD]@aws-0-...
   After:  postgresql://postgres.abcxxx:MySecurePass123@aws-0-...
   ```

8. **Save this complete connection string** somewhere safe!
   - You'll use this with Fly.io later
   - Keep it secret! Don't share publicly!

---

### Step 4: Verify Connection String Format (1 minute)

**Your connection string MUST have these parts:**

✅ Correct format:
```
postgresql://postgres.xxxxx:PASSWORD@xxx.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Check:**
- ✓ Starts with `postgresql://`
- ✓ Contains `pooler.supabase.com`
- ✓ Port is `:6543` (NOT 5432)
- ✓ Ends with `?pgbouncer=true` (or add it if missing)
- ✓ Password is filled in (no `[YOUR-PASSWORD]`)

❌ Wrong format (don't use):
```
postgresql://postgres:password@xxx.supabase.co:5432/postgres
```
(This is the direct connection - we need the pooler!)

**If missing `?pgbouncer=true`, add it to the end:**
```
postgresql://postgres.xxx:pass@xxx.pooler.supabase.com:6543/postgres?pgbouncer=true
```

---

### Step 5: Test Connection (Optional but Recommended)

Let's verify the database is working!

**Option A: Using Supabase SQL Editor**

1. In Supabase dashboard, click **"SQL Editor"** (left sidebar)
2. Click **"New query"**
3. Paste this code:
   ```sql
   SELECT version();
   ```
4. Click **"Run"** (or press Ctrl+Enter)
5. You should see PostgreSQL version info
6. ✅ Database is working!

**Option B: Using Command Line (if you have Node.js)**

```bash
# Install Prisma CLI globally
npm install -g prisma

# Go to your project backend folder
cd /path/to/MELLTOOL/backend

# Create a temporary .env file
echo 'DATABASE_URL="your-connection-string-here"' > .env

# Test the connection
npx prisma db pull

# If it works, you'll see "Introspecting based on datasource..."
# This means connection successful!
```

---

### Step 6: Understanding Your Database Plan

**Free Plan Includes:**

| Feature | Free Tier | Pro Plan ($25/mo) |
|---------|-----------|-------------------|
| Database Size | 500 MB | 8 GB |
| Transfer | 5 GB/month | 250 GB/month |
| Connections | 60 direct | 200 direct |
| Pooled Connections | 200 | 400 |
| Storage | 1 GB | 100 GB |
| Backups | None | Daily |

**How long will 500MB last?**
- ~100,000 product records
- ~50,000 orders
- ~10,000 users
- Perfect for testing and small businesses!

**When to upgrade to Pro ($25/month)?**
- Growing past 500MB
- Need automatic backups
- Want better performance
- More than 50,000 rows

---

## 🔐 Security Best Practices

### Enable Row Level Security (RLS)

1. In Supabase dashboard, click **"Authentication"** → **"Policies"**
2. Click **"Enable RLS"** for all tables (do this after running migrations)
3. Create policies to protect your data

**For now:** Your backend handles security with JWT tokens, so RLS is optional but recommended for extra protection.

### Network Security

Supabase has built-in security:
- ✅ SSL/TLS encryption enabled by default
- ✅ Connection pooling prevents overload
- ✅ Automatic DDoS protection
- ✅ Password hashing in transit

---

## 💾 Backup Strategy

### Free Plan (No automatic backups):

**Manual backup option:**
```bash
# Install pg_dump (comes with PostgreSQL)

# Backup your database
pg_dump "your-connection-string" > backup-$(date +%Y%m%d).sql

# Restore from backup
psql "your-connection-string" < backup-20250108.sql
```

**Better option:** Upgrade to Pro plan ($25/month) for:
- Automatic daily backups
- Point-in-time recovery
- 7-day retention

---

## 🎯 Your Connection Details Summary

**Save these somewhere safe!**

```plaintext
========================================
MELLTOOL - Supabase Connection Details
========================================

Project Name: melltool
Region: ap-southeast-1 (Singapore)
Dashboard URL: https://supabase.com/dashboard/project/YOUR_PROJECT_ID

Database Password:
[YOUR-PASSWORD-HERE]

Connection String (Connection Pooling):
postgresql://postgres.xxxxx:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true

Important:
- Keep this connection string SECRET
- Never commit to GitHub
- Use environment variables only
- Port 6543 with pgbouncer=true is required

Created: 2025-01-08
========================================
```

---

## ✅ Checklist - Are You Ready?

Before moving to Fly.io deployment, check:

- [ ] ✓ Supabase account created
- [ ] ✓ Project "melltool" created
- [ ] ✓ Database password saved securely
- [ ] ✓ Connection string copied (with pooler, port 6543)
- [ ] ✓ Password filled in the connection string
- [ ] ✓ Added `?pgbouncer=true` to the end
- [ ] ✓ Connection tested (optional)

**If all checked ✅, you're ready for Fly.io deployment!**

---

## 🆘 Troubleshooting

### Problem: "Invalid connection string"

**Solution:**
- Make sure port is `6543` (not 5432)
- Must use `pooler.supabase.com` hostname
- Add `?pgbouncer=true` at the end
- Password should not have `[` or `]` brackets

### Problem: "Password authentication failed"

**Solution:**
- Double-check you copied the password correctly
- No spaces before/after the password
- If lost, reset password:
  1. Supabase → Settings → Database
  2. Scroll to "Reset database password"
  3. Generate new password
  4. Update your connection string

### Problem: "Database not responding"

**Solution:**
- Wait - project might still be setting up (takes 2-3 min)
- Check Supabase status: https://status.supabase.com
- Try refreshing the dashboard
- Check your internet connection

### Problem: "Too many connections"

**Solution:**
- You're using direct connection instead of pooler
- Make sure connection string has `pooler.supabase.com`
- Port should be `6543` not `5432`
- Pooler allows 200 connections (free tier)

---

## 📱 Supabase Dashboard Quick Tour

**Main sections you'll use:**

1. **Table Editor**: View/edit your data (like Excel)
2. **SQL Editor**: Run SQL queries
3. **Database**: Connection strings, extensions
4. **Authentication**: User management (optional)
5. **Storage**: File uploads (alternative to local storage)
6. **Logs**: See database queries and errors

---

## 🎓 What Happens Next?

After Supabase is setup:

1. **Fly.io Deployment**: Your backend will connect to this database
2. **Prisma Migrations**: Creates all tables automatically
   - Users table
   - Products table
   - Orders table
   - Inventory table
   - And more!
3. **Your app starts**: Backend connects to Supabase successfully!

---

## 💡 Pro Tips

1. **Bookmark your Supabase dashboard**
   - Quick access: https://supabase.com/dashboard

2. **Use Supabase Studio** (Table Editor)
   - View data like a spreadsheet
   - Edit records manually
   - Export to CSV

3. **Enable database extensions** (if needed later)
   - pgvector for AI features
   - postgis for location data
   - full text search

4. **Monitor usage**
   - Dashboard shows database size
   - See connection count
   - Track API requests

5. **Keep backups**
   - Export important data regularly
   - Consider Pro plan for auto-backups
   - Test restore process

---

## 🔗 Useful Links

- **Supabase Dashboard**: https://supabase.com/dashboard
- **Documentation**: https://supabase.com/docs
- **Status Page**: https://status.supabase.com
- **Community**: https://supabase.com/community
- **Pricing**: https://supabase.com/pricing

---

## ✨ You're All Set!

**Your Supabase database is ready!** 🎉

**Next Steps:**
1. Keep your connection string safe
2. Go back to `DEPLOY_FLY_IO.md`
3. Follow the Fly.io deployment guide
4. Use your Supabase connection string when setting secrets

---

**Need help?** Re-read the troubleshooting section or check Supabase docs!
