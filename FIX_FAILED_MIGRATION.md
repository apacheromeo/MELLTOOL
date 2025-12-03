# Fixing Failed RLS Migration - Manual Database Fix

## Problem
The migration `20251203_enable_rls_policies` failed and Prisma won't run any new migrations until it's resolved.

## Solution: Run This SQL in Supabase

Go to your Supabase dashboard → SQL Editor and run this SQL:

```sql
-- ============================================
-- STEP 1: Remove the failed migration record
-- ============================================
DELETE FROM "_prisma_migrations"
WHERE migration_name = '20251203_enable_rls_policies';

-- Verify it's gone
SELECT migration_name, finished_at, success
FROM "_prisma_migrations"
ORDER BY started_at DESC
LIMIT 10;
```

## After Running the SQL

Once you've run the above SQL in Supabase:

1. **Verify the failed migration is removed** - You should see it's no longer in the list
2. **Deploy again** - Your Fly.io deployment will now succeed
3. **The new migration will apply** - `20251203000001_enable_rls_policies` will run successfully

## What This Does

- Removes the failed migration record from Prisma's tracking table
- Allows Prisma to proceed with new migrations
- The new RLS migration will then apply all security policies

## Alternative: Using Prisma CLI Locally

If you have access to the database from your local machine:

```bash
# Mark the failed migration as rolled back
cd backend
npx prisma migrate resolve --rolled-back 20251203_enable_rls_policies

# Then deploy
fly deploy
```

---

## Quick Steps:

1. ✅ Open Supabase SQL Editor
2. ✅ Run the DELETE command above
3. ✅ Verify with the SELECT command
4. ✅ Deploy to Fly.io again

Your deployment should then succeed! 🚀
