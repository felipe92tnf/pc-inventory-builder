-- Lotes de importación Excel (revertir por batch sin tocar ventas manuales).
ALTER TABLE "Sale" ADD COLUMN "importBatchId" TEXT;
ALTER TABLE "Sale" ADD COLUMN "importedAt" TIMESTAMP(3);

CREATE INDEX "Sale_importBatchId_idx" ON "Sale"("importBatchId");
