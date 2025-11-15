-- AlterEnum: Update UserRole enum from ACCOUNTANT to MOD
-- Step 1: Create new enum type with updated values
CREATE TYPE "UserRole_new" AS ENUM ('OWNER', 'MOD', 'STAFF');

-- Step 2: Update existing users with ACCOUNTANT role to MOD
-- (Do this before altering the column type)
UPDATE "users" SET "role" = 'OWNER'::"UserRole" WHERE "role" = 'ACCOUNTANT'::"UserRole";

-- Step 3: Alter the column to use the new enum type
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");

-- Step 4: Drop the old enum type
DROP TYPE "UserRole";

-- Step 5: Rename the new enum type to the original name
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
