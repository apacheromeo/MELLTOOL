-- CreateTable
CREATE TABLE "product_compatibilities" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "compatibleProductId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_compatibilities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_compatibilities_productId_idx" ON "product_compatibilities"("productId");

-- CreateIndex
CREATE INDEX "product_compatibilities_compatibleProductId_idx" ON "product_compatibilities"("compatibleProductId");

-- CreateIndex
CREATE UNIQUE INDEX "product_compatibilities_productId_compatibleProductId_key" ON "product_compatibilities"("productId", "compatibleProductId");

-- AddForeignKey
ALTER TABLE "product_compatibilities" ADD CONSTRAINT "product_compatibilities_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_compatibilities" ADD CONSTRAINT "product_compatibilities_compatibleProductId_fkey" FOREIGN KEY ("compatibleProductId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
