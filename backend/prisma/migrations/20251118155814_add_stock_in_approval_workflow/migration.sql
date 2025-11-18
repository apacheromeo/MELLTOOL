-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "stock_ins" ADD COLUMN     "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "rejectionReason" TEXT;

-- CreateIndex
CREATE INDEX "stock_ins_approvalStatus_idx" ON "stock_ins"("approvalStatus");

-- CreateIndex
CREATE INDEX "stock_ins_approvedBy_idx" ON "stock_ins"("approvedBy");

-- AddForeignKey
ALTER TABLE "stock_ins" ADD CONSTRAINT "stock_ins_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
