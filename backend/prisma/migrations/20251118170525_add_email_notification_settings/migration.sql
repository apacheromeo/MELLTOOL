-- AlterTable
ALTER TABLE "users" ADD COLUMN "emailNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "lowStockEmailEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "stockInApprovalEmailEnabled" BOOLEAN NOT NULL DEFAULT true;
