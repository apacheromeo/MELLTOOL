-- AlterTable
ALTER TABLE "products" ADD COLUMN     "isMaster" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isVisible" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "masterProductId" TEXT;

-- CreateIndex
CREATE INDEX "products_isMaster_idx" ON "products"("isMaster");

-- CreateIndex
CREATE INDEX "products_masterProductId_idx" ON "products"("masterProductId");

-- CreateIndex
CREATE INDEX "products_isMaster_isVisible_idx" ON "products"("isMaster", "isVisible");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_masterProductId_fkey" FOREIGN KEY ("masterProductId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
