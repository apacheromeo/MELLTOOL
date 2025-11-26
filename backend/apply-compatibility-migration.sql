-- Product Compatibility Migration
-- This migration adds the product_compatibilities table for linking related products

-- CreateTable
CREATE TABLE IF NOT EXISTS "product_compatibilities" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "compatibleProductId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_compatibilities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "product_compatibilities_productId_idx" ON "product_compatibilities"("productId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "product_compatibilities_compatibleProductId_idx" ON "product_compatibilities"("compatibleProductId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "product_compatibilities_productId_compatibleProductId_key" ON "product_compatibilities"("productId", "compatibleProductId");

-- AddForeignKey (only if not exists - PostgreSQL will error if constraint already exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'product_compatibilities_productId_fkey'
    ) THEN
        ALTER TABLE "product_compatibilities" ADD CONSTRAINT "product_compatibilities_productId_fkey"
        FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'product_compatibilities_compatibleProductId_fkey'
    ) THEN
        ALTER TABLE "product_compatibilities" ADD CONSTRAINT "product_compatibilities_compatibleProductId_fkey"
        FOREIGN KEY ("compatibleProductId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Verify the migration
SELECT
    'Migration completed successfully!' as status,
    COUNT(*) as compatibility_count
FROM product_compatibilities;
