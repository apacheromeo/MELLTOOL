# 🧪 TESTING GUIDE - MELLTOOL
**Quick Start Guide for Testing Bug Fixes**

---

## ✅ COMPLETED WORK

All bugs have been identified, fixed, documented, and committed to git:
- **Branch**: `claude/app-bug-review-011CUrwgV8BtfXgnP1MRJHQo`
- **Commit**: `303735d`
- **Files Changed**: 7 files
- **Bugs Fixed**: 6 (3 critical, 2 high, 1 medium)

Full details in: [`BUG_REPORT.md`](./BUG_REPORT.md)

---

## 🚀 QUICK START FOR TESTING

### Prerequisites
- Node.js 20+ installed
- PostgreSQL database running
- Redis server running
- Supabase account (for authentication)

---

## 📦 STEP 1: SETUP ENVIRONMENT

### Backend Setup

1. **Navigate to backend**:
```bash
cd /home/user/MELLTOOL/backend
```

2. **Dependencies are already installed** ✅
   - If you need to reinstall: `npm install`

3. **Create `.env` file**:
```bash
cp .env.example .env
```

4. **Configure environment variables** (edit `.env`):
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/melltool"
DIRECT_URL="postgresql://user:password@localhost:5432/melltool"

# Supabase (Get from https://supabase.com)
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-super-secret-jwt-key-min-32-chars-long"
JWT_EXPIRES_IN="7d"

# Shopee (Optional for testing)
SHOPEE_PARTNER_ID="your-partner-id"
SHOPEE_PARTNER_KEY="your-partner-key"
SHOPEE_BASE_URL="https://partner.shopeemobile.com"
SHOPEE_REDIRECT_URI="http://localhost:3000/shopee/callback"

# Application
NODE_ENV="development"
PORT=3001
FRONTEND_URL="http://localhost:3000"
```

5. **Setup database**:
```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Seed test data
npm run prisma:seed
```

6. **Start backend server**:
```bash
npm run start:dev
```

Expected output:
```
🚀 Application is running on: http://localhost:3001
📚 API Documentation: http://localhost:3001/api/docs
```

---

### Frontend Setup

1. **Navigate to frontend** (in new terminal):
```bash
cd /home/user/MELLTOOL/frontend
```

2. **Dependencies are already installed** ✅
   - If you need to reinstall: `npm install`

3. **Create `.env.local` file**:
```bash
touch .env.local
```

4. **Configure environment** (edit `.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

5. **Start frontend server**:
```bash
npm run dev
```

Expected output:
```
▲ Next.js 14.0.4
- Local:        http://localhost:3000
- Ready in XXXXms
```

---

## 🧪 STEP 2: TEST EACH BUG FIX

### Test #1: Application Startup (Bug #1 - Joi Dependency)
**Expected**: Backend should start without errors

```bash
cd /home/user/MELLTOOL/backend
npm run start:dev
```

✅ **PASS**: Server starts successfully
❌ **FAIL**: Error about missing 'joi' module

---

### Test #2: Low Stock Filter (Bug #2)
**Expected**: Correctly filter products with low stock

1. Open browser: `http://localhost:3000/inventory/low-stock`
2. Create test products with different stock levels:
   - Product A: stockQty=5, minStock=10 (LOW - should appear)
   - Product B: stockQty=20, minStock=10 (OK - should NOT appear)
3. Apply low stock filter

✅ **PASS**: Only Product A appears in low stock list
❌ **FAIL**: Wrong products shown or error

---

### Test #3: Password Change Security (Bug #3)
**Expected**: Requires current password verification

1. Login to application
2. Navigate to Settings → Change Password
3. Try changing password with **WRONG** current password

✅ **PASS**: Error "Current password is incorrect"
❌ **FAIL**: Password changes without verification (CRITICAL!)

4. Try changing password with **CORRECT** current password

✅ **PASS**: Password changes successfully

---

### Test #4: Stock Percentage Display (Bug #4)
**Expected**: Progress bar shows correctly

1. Open: `http://localhost:3000/inventory`
2. View product cards with different stock levels:
   - Product: stockQty=5, minStock=10

✅ **PASS**: Progress bar shows as LOW/RED (not half-full)
❌ **FAIL**: Progress bar looks half-full or shows 50%

---

### Test #5: Manual Product Addition (Bug #5)
**Expected**: Can add products manually to cart

1. Open: `http://localhost:3000/sales`
2. Click "Start New Sale"
3. Click "Search Products" button
4. Search for a product
5. Click on product to add to cart

✅ **PASS**: Product added to cart successfully
❌ **FAIL**: Error about undefined method

---

### Test #6: Barcode Scanner Feedback (Bug #6)
**Expected**: Clear error when product not found

1. Open: `http://localhost:3000/sales`
2. Click "Start New Sale"
3. Scan/enter an invalid barcode (e.g., "INVALID123")

✅ **PASS**: Clear error message: "Product not found with barcode/SKU: INVALID123"
❌ **FAIL**: Silent failure or confusing order number update

---

## 📊 STEP 3: VERIFY API DOCUMENTATION

Backend API docs should be accessible:

```bash
# Open in browser:
http://localhost:3001/api/docs
```

✅ **PASS**: Swagger UI loads with all endpoints documented
❌ **FAIL**: 404 or errors

---

## 🔍 STEP 4: CHECK LOGS

### Backend Logs Should Show:
```
[Nest] LOG [Bootstrap] 🚀 Application is running on: http://localhost:3001
[Nest] LOG [Bootstrap] 📚 API Documentation: http://localhost:3001/api/docs
[Nest] LOG [AuthService] Successful login for user: user@example.com
```

### No Errors Like:
```
❌ Cannot find module 'joi'
❌ TypeError: Cannot read property 'minStock' of undefined
❌ UnhandledPromiseRejection
```

---

## 🐳 ALTERNATIVE: DOCKER TESTING

If you prefer Docker:

```bash
cd /home/user/MELLTOOL
docker-compose up
```

This will start:
- PostgreSQL (port 5432)
- Redis (port 6379)
- Backend (port 3001)
- Frontend (port 3000)

---

## ⚠️ TROUBLESHOOTING

### Issue: "Cannot connect to database"
**Solution**: Ensure PostgreSQL is running and DATABASE_URL is correct

### Issue: "Redis connection failed"
**Solution**: Ensure Redis is running on port 6379

### Issue: "Supabase auth error"
**Solution**: Check Supabase credentials in .env

### Issue: "Module not found errors"
**Solution**: Run `npm install` in both backend and frontend directories

### Issue: "Port already in use"
**Solution**:
```bash
# Kill process on port 3001 (backend)
lsof -ti:3001 | xargs kill -9

# Kill process on port 3000 (frontend)
lsof -ti:3000 | xargs kill -9
```

---

## 📝 TESTING CHECKLIST

- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Can access Swagger docs at http://localhost:3001/api/docs
- [ ] Low stock filter works correctly
- [ ] Password change requires current password
- [ ] Stock percentage displays correctly
- [ ] Can add products manually to cart
- [ ] Barcode scanner gives clear errors
- [ ] No console errors in browser
- [ ] No errors in backend logs

---

## 🎉 SUCCESS CRITERIA

All tests pass = **Ready for production deployment!**

---

## 📞 SUPPORT

For issues or questions:
1. Check `BUG_REPORT.md` for detailed bug information
2. Review git commit `303735d` for code changes
3. Check application logs for error details

---

**Last Updated**: 2025-11-06
**Branch**: `claude/app-bug-review-011CUrwgV8BtfXgnP1MRJHQo`
