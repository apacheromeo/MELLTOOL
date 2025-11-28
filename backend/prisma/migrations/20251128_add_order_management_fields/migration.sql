-- Add new fields to sales_orders table for order management
ALTER TABLE "sales_orders" ADD COLUMN "shippingCost" DOUBLE PRECISION;
ALTER TABLE "sales_orders" ADD COLUMN "returnedAt" TIMESTAMP(3);
ALTER TABLE "sales_orders" ADD COLUMN "cancellationReason" TEXT;

-- Add RETURNED status to SalesStatus enum
ALTER TYPE "SalesStatus" ADD VALUE IF NOT EXISTS 'RETURNED';
