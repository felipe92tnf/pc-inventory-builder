-- CreateEnum
CREATE TYPE "SaleStatus" AS ENUM ('COMPLETED', 'REVERTED');

-- DropIndex
DROP INDEX "Sale_buildId_key";

-- AlterTable
ALTER TABLE "Sale" ADD COLUMN "status" "SaleStatus" NOT NULL DEFAULT 'COMPLETED';
ALTER TABLE "Sale" ADD COLUMN "revertedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Sale_buildId_idx" ON "Sale"("buildId");
CREATE INDEX "Sale_status_idx" ON "Sale"("status");

-- Compatibilidad: filas existentes sin status explícito (por si el default no aplicó en algún entorno).
UPDATE "Sale"
SET "status" = 'COMPLETED'
WHERE "status" IS NULL;
