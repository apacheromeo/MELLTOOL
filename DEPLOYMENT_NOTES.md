# Deployment Notes - Three-Tier Role System

## ⚠️ Important: Database Migration Required

The Prisma schema has been updated to change the `UserRole` enum:

**Before:**
```prisma
enum UserRole {
  OWNER
  STAFF
  ACCOUNTANT
}
```

**After:**
```prisma
enum UserRole {
  OWNER
  MOD      // Changed from ACCOUNTANT
  STAFF
}
```

## Deployment Steps

### Backend Deployment (Fly.io)

1. **Pull the latest changes:**
   ```bash
   git pull origin claude/fix-redis-connection-closed-011CV3rs5m253KX5WY7NMNrc
   ```

2. **Regenerate Prisma Client:**
   ```bash
   cd backend
   npx prisma generate
   ```

3. **Create and apply migration:**
   ```bash
   npx prisma migrate dev --name update_user_roles_to_mod
   ```

   This will create a migration that:
   - Removes the `ACCOUNTANT` value from the enum
   - Adds the `MOD` value to the enum
   - ⚠️ **Note:** Any existing users with `ACCOUNTANT` role will need to be manually updated

4. **Deploy to Fly.io:**
   ```bash
   fly deploy
   ```

### Frontend Deployment (Vercel)

The frontend will auto-deploy when you merge the PR. No additional steps needed!

## Manual Data Migration

If you have existing users with the `ACCOUNTANT` role, you'll need to update them manually:

```sql
-- Option 1: Update all ACCOUNTANT users to MOD
UPDATE users SET role = 'MOD' WHERE role = 'ACCOUNTANT';

-- Option 2: Update specific accountants to OWNER (for full access)
UPDATE users SET role = 'OWNER' WHERE email = 'accountant@example.com';
```

Or use Prisma Studio:
```bash
cd backend
npx prisma studio
```

Then manually update user roles in the UI.

## Testing the Role System

### Test User Roles

Create test users for each role:

1. **OWNER** (admin@example.com):
   - ✅ Full access to everything
   - ✅ Can see cost, profit, financial reports

2. **MOD** (mod@example.com):
   - ✅ Dashboard, Inventory, Stock-in, POS, Forecasting, Settings
   - ❌ No Accounting module
   - ❌ Cannot see product cost or profit

3. **STAFF** (staff@example.com):
   - ✅ POS only (auto-redirected on login)
   - ❌ No access to main app
   - ❌ Cannot see any financial data

### Testing Checklist

- [ ] OWNER can access all menus
- [ ] OWNER can see cost/profit in inventory
- [ ] MOD can access dashboard and inventory
- [ ] MOD cannot see cost/profit in inventory
- [ ] MOD cannot access accounting module
- [ ] STAFF is auto-redirected to POS on login
- [ ] STAFF cannot access other pages (redirected back to POS)
- [ ] Backend API returns 403 for unauthorized role access

## Rollback Plan

If you need to rollback:

1. **Revert the migration:**
   ```bash
   cd backend
   npx prisma migrate resolve --rolled-back <migration_name>
   ```

2. **Revert the code:**
   ```bash
   git revert <commit_hash>
   ```

3. **Redeploy:**
   ```bash
   fly deploy
   ```

## Questions?

If you encounter any issues during deployment, check:
- Prisma client is regenerated: `npx prisma generate`
- Migration ran successfully: `npx prisma migrate status`
- Environment variables are set correctly on Fly.io
- Database connection string is valid
