# Row Level Security (RLS) Fix - Implementation Guide

## 🔐 Security Issue
Supabase detected that Row Level Security (RLS) was **disabled** on all public tables, which is a critical security vulnerability. Without RLS, any authenticated user could potentially access or modify data they shouldn't have access to.

## ✅ Solution Implemented
This fix enables RLS on all database tables and creates role-based access policies that enforce proper authorization based on user roles (OWNER, MOD, STAFF).

---

## 📋 What Was Changed

### 1. **Database Migration** (`backend/prisma/migrations/20251203_enable_rls_policies/migration.sql`)
   - Enabled RLS on all tables
   - Created helper functions: `get_user_role()` and `get_current_user_id()`
   - Implemented role-based policies for each table:
     - **OWNER**: Full access to everything
     - **MOD**: Full operational access, limited admin access
     - **STAFF**: Limited operational access, no sensitive data

### 2. **PrismaService Enhanced** (`backend/src/common/prisma/prisma.service.ts`)
   - Added `setRLSContext(userId, userRole)` method
   - Added `clearRLSContext()` method
   - These methods set PostgreSQL session variables that RLS policies use

### 3. **RLS Interceptor** (`backend/src/common/interceptors/rls.interceptor.ts`)
   - Automatically sets user context before each request
   - Extracts user info from JWT token
   - Sets database session variables for RLS enforcement

### 4. **App Module Updated** (`backend/src/app.module.ts`)
   - Registered RLS interceptor globally
   - Ensures RLS context is set for all authenticated requests

---

## 🚀 How to Apply This Fix

### Step 1: Apply the Database Migration

**Option A: Using Prisma Migrate (Recommended)**
```bash
cd backend
npx prisma migrate deploy
```

**Option B: Run the SQL Directly in Supabase**
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `backend/prisma/migrations/20251203_enable_rls_policies/migration.sql`
4. Paste and execute the SQL

### Step 2: Deploy the Backend Code
The backend code changes are already in place:
- RLS interceptor will automatically set user context
- PrismaService has methods to manage RLS sessions

Simply deploy the updated backend:
```bash
cd backend
npm install  # In case there are any new dependencies
npm run build
npm run start:prod  # Or deploy to your hosting service
```

### Step 3: Verify RLS is Working

**Check RLS Status:**
```sql
-- Run this in Supabase SQL Editor to verify RLS is enabled
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

All tables should show `rowsecurity = true`.

**Test Access Control:**
1. Log in as different users (OWNER, MOD, STAFF)
2. Try accessing different resources
3. Verify that users only see data they're authorized to access

---

## 🔍 Security Model

### User Roles and Permissions

#### OWNER (Full Administrative Access)
- ✅ View, create, update, delete all data
- ✅ Manage users
- ✅ View audit logs
- ✅ Access financial reports
- ✅ Manage system settings

#### MOD (Operational Manager)
- ✅ View and manage products, categories, brands
- ✅ Manage stock-ins and adjustments
- ✅ View all sales orders
- ✅ Approve cancellation requests
- ✅ View and update expenses (limited)
- ❌ Cannot delete most data (only OWNER can)
- ❌ Cannot access audit logs
- ❌ Cannot view detailed financial summaries

#### STAFF (Limited Operational Access)
- ✅ View products, categories, brands
- ✅ View own sales orders
- ✅ Create sales orders and stock-ins
- ✅ View own expenses
- ❌ Cannot modify products or pricing
- ❌ Cannot view other staff's data
- ❌ Cannot access sensitive financial data
- ❌ Cannot approve or manage admin functions

---

## 📊 Tables Protected by RLS

All tables now have RLS enabled:
- `users` - User accounts
- `categories` - Product categories
- `brands` - Product brands
- `products` - Product inventory
- `product_compatibilities` - Product relationships
- `stock_ins` - Stock purchases
- `stock_in_items` - Stock purchase items
- `stock_adjustments` - Manual stock corrections
- `sales_orders` - Sales transactions
- `sales_items` - Sale line items
- `cancellation_requests` - Order cancellations
- `expenses` - Business expenses
- `expense_categories` - Expense types
- `payment_methods` - Payment types
- `shopee_shops` - Shopee integrations
- `shopee_items` - Shopee products
- `print_jobs` - Barcode printing jobs
- `settings` - System settings
- `audit_logs` - System audit trail
- `daily_sales_summaries` - Sales reports
- `monthly_financial_summaries` - Financial reports

---

## 🧪 Testing RLS Policies

### Test as OWNER:
```typescript
// Should succeed - OWNER has full access
await prisma.user.findMany();
await prisma.product.delete({ where: { id: 'some-id' } });
await prisma.auditLog.findMany();
```

### Test as MOD:
```typescript
// Should succeed
await prisma.product.findMany();
await prisma.salesOrder.findMany();

// Should fail - MOD cannot delete products
await prisma.product.delete({ where: { id: 'some-id' } }); // ❌
```

### Test as STAFF:
```typescript
// Should succeed - own data only
await prisma.salesOrder.findMany({ where: { staffId: currentUserId } });

// Should fail - cannot access other staff's orders
await prisma.salesOrder.findMany(); // ❌
```

---

## ⚠️ Important Notes

### 1. **Session Variables**
RLS policies rely on PostgreSQL session variables:
- `app.user_id` - Current user's ID
- `app.user_role` - Current user's role

These are set automatically by the RLS interceptor for each request.

### 2. **Background Jobs**
For background jobs or system operations, you may need to bypass RLS:
```typescript
// For admin operations, set OWNER context
await this.prisma.setRLSContext('system', 'OWNER');
// Run your operation
await this.prisma.clearRLSContext();
```

### 3. **Migration Safety**
The migration is **non-destructive** and only adds security:
- No data is deleted
- No schema changes to existing tables
- Only adds RLS policies
- Can be rolled back if needed

### 4. **Performance Impact**
RLS policies are evaluated at the database level and have minimal performance impact. PostgreSQL optimizes RLS checks efficiently.

---

## 🔄 Rollback (If Needed)

If you need to temporarily disable RLS for debugging:

```sql
-- Disable RLS on a specific table
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- To re-enable
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

**Warning**: Never disable RLS in production!

---

## 📞 Support

If you encounter issues:
1. Check the backend logs for RLS-related errors
2. Verify user authentication is working properly
3. Ensure the migration was applied successfully
4. Test with different user roles to isolate the issue

---

## ✅ Checklist

- [ ] Review the RLS policies in the migration file
- [ ] Apply the database migration
- [ ] Deploy the updated backend code
- [ ] Verify RLS is enabled on all tables
- [ ] Test with different user roles (OWNER, MOD, STAFF)
- [ ] Monitor logs for any RLS-related errors
- [ ] Update Supabase security alerts status

Once completed, your Supabase security alert should be resolved! 🎉
