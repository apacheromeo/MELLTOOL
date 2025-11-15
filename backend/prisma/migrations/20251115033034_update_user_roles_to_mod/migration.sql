-- AlterEnum: Update UserRole enum from ACCOUNTANT to MOD
-- Step 1: Create new enum type with updated values
CREATE TYPE "UserRole_new" AS ENUM ('OWNER', 'MOD', 'STAFF');

-- Step 2: Update existing users with ACCOUNTANT role to OWNER
-- (Do this before altering the column type)
UPDATE "users" SET "role" = 'OWNER'::"UserRole" WHERE "role" = 'ACCOUNTANT'::"UserRole";

-- Step 3: Drop the default value temporarily
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;

-- Step 4: Alter the column to use the new enum type
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");

-- Step 5: Drop the old enum type
DROP TYPE "UserRole";

-- Step 6: Rename the new enum type to the original name
ALTER TYPE "UserRole_new" RENAME TO "UserRole";

-- Step 7: Restore the default value with the new enum type
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'STAFF'::"UserRole";
