# Product Compatibility Feature - Deployment Guide

## Current Status
✅ Code committed to git (commit: 5758656)
✅ Backend API endpoints created
✅ Frontend UI components created
⚠️ **Deployment needed**

## What's Been Added

### Backend Changes:
- ✅ ProductCompatibility table in database schema
- ✅ Migration file: `backend/prisma/migrations/20251126020633_add_product_compatibility/migration.sql`
- ✅ API endpoints:
  - POST `/inventory/products/:id/compatibility` - Add compatible products
  - GET `/inventory/products/:id/compatibility` - Get compatible products
  - DELETE `/inventory/products/:id/compatibility/:compatibleId` - Remove compatibility

### Frontend Changes:
- ✅ ProductCompatibilityModal component
- ✅ API client methods
- ✅ "Compatible Products" button on inventory product cards

## Deployment Steps

### Option 1: Full Redeploy (Recommended)

If you're using Fly.io:

```bash
# 1. Make sure you're in the project root
cd /home/user/MELLTOOL

# 2. Verify changes are committed
git log --oneline -1
# Should show: "5758656 Add product compatibility feature for linking related products"

# 3. Deploy to Fly.io (this will rebuild everything)
fly deploy

# The deployment will automatically:
# - Build the backend Docker image
# - Generate Prisma client with the new ProductCompatibility model
# - Run database migrations (via release_command in fly.toml)
# - Start the updated backend
```

### Option 2: Manual Database Migration (If needed)

If the migration didn't run automatically, you can apply it manually:

```bash
# Connect to your Fly.io Postgres database
fly postgres connect -a your-postgres-app-name

# Then run the migration SQL
\i /path/to/apply-compatibility-migration.sql
```

Or use the Prisma CLI:

```bash
# Set your database URL
export DATABASE_URL="your-production-database-url"

# Run migrations
cd backend
npx prisma migrate deploy
```

### Option 3: Frontend Rebuild (If frontend wasn't redeployed)

If only the backend was redeployed, you need to rebuild the frontend:

```bash
cd /home/user/MELLTOOL/frontend

# Install dependencies (if needed)
npm install

# Build the frontend
npm run build

# Deploy to your hosting service (Vercel, Netlify, etc.)
```

## Verification Steps

After deployment, verify the feature works:

### 1. Check Backend Health
```bash
curl https://melltool-backend.fly.dev/health
# Should return: {"status":"ok"}
```

### 2. Check Database Migration
```bash
# SSH into your Fly.io app
fly ssh console

# Check if table exists
echo "SELECT COUNT(*) FROM product_compatibilities;" | npx prisma db execute --stdin
```

### 3. Check Frontend
1. Open your app: https://your-app-url.com/inventory
2. You should see a "Compatible Products" button on each product card
3. Click the button - a modal should open
4. Try adding compatible products

### 4. Check Browser Console
If the button shows but doesn't work:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for any errors related to:
   - ProductCompatibilityModal
   - API calls to `/inventory/products/:id/compatibility`

## Troubleshooting

### Issue: "Compatible Products" button not showing

**Possible causes:**
1. Frontend not rebuilt/redeployed
2. Browser cache showing old version
3. Build failed

**Solutions:**
```bash
# Clear browser cache
# Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)

# Or rebuild frontend
cd /home/user/MELLTOOL/frontend
rm -rf .next
npm run build
```

### Issue: Button shows but modal doesn't work

**Possible causes:**
1. Backend migration not applied
2. Prisma client not regenerated
3. API endpoints not accessible

**Solutions:**
```bash
# Check if backend has the endpoints
curl https://melltool-backend.fly.dev/api

# Rebuild backend with Prisma regeneration
cd /home/user/MELLTOOL
fly deploy --build-only
fly deploy
```

### Issue: API returns 404 or 500 errors

**Possible causes:**
1. Database table doesn't exist (migration not run)
2. Prisma client outdated

**Solutions:**
```bash
# SSH into backend
fly ssh console -a melltool-backend

# Check Prisma schema
npx prisma migrate status

# Apply pending migrations
npx prisma migrate deploy
```

## Testing the Feature

Once deployed, test with these steps:

1. **Go to Inventory page**
2. **Click "Compatible Products"** on any product
3. **Search for products** to link (e.g., if you have phone cases, link them to phone models)
4. **Select multiple products** using checkboxes
5. **Add optional notes** (e.g., "Compatible models")
6. **Click "Add Compatible Products"**
7. **Verify** the products appear in the "Currently Compatible Products" section
8. **Test removal** by clicking the trash icon
9. **Refresh the page** and verify relationships persist

## Quick Deploy Commands

```bash
# Full deployment from scratch
cd /home/user/MELLTOOL
git status  # Verify commit 5758656 is there
fly deploy  # Deploy everything

# If you have separate frontend deployment (Vercel/Netlify)
cd frontend
npm run build
vercel --prod  # or your deployment command
```

## Need Help?

If issues persist:

1. Check deployment logs:
   ```bash
   fly logs -a melltool-backend
   ```

2. Check migration status:
   ```bash
   fly ssh console -a melltool-backend
   npx prisma migrate status
   ```

3. Verify Prisma client includes ProductCompatibility:
   ```bash
   fly ssh console -a melltool-backend
   node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); console.log(prisma.productCompatibility ? 'ProductCompatibility model exists!' : 'Model missing!');"
   ```

## Success Indicators

✅ Backend responds to health check
✅ "Compatible Products" button visible on product cards
✅ Modal opens when clicked
✅ Can search and select products
✅ Can add compatible products
✅ Can remove compatible products
✅ Relationships persist after page refresh

---

**All code is committed and ready to deploy!**
Commit: `5758656 Add product compatibility feature for linking related products`
