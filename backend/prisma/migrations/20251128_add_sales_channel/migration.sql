-- CreateEnum
CREATE TYPE "SalesChannel" AS ENUM ('POS', 'SHOPEE', 'LAZADA', 'LINE', 'FACEBOOK', 'INSTAGRAM', 'TIKTOK', 'WEBSITE', 'OTHER');

-- AlterTable
ALTER TABLE "sales_orders" ADD COLUMN "channel" "SalesChannel" NOT NULL DEFAULT 'POS';

-- CreateIndex
CREATE INDEX "sales_orders_channel_idx" ON "sales_orders"("channel");
