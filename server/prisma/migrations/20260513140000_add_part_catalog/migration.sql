-- CreateTable
CREATE TABLE "PartCatalog" (
    "id" TEXT NOT NULL,
    "sku" TEXT,
    "name" TEXT NOT NULL,
    "category" "PartCategory" NOT NULL,
    "brand" TEXT NOT NULL DEFAULT '',
    "model" TEXT NOT NULL DEFAULT '',
    "defaultCostPrice" DECIMAL(12,2) NOT NULL,
    "defaultSalePrice" DECIMAL(12,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PartCatalog_sku_key" ON "PartCatalog"("sku");

-- CreateIndex
CREATE INDEX "PartCatalog_name_idx" ON "PartCatalog"("name");

-- CreateIndex
CREATE INDEX "PartCatalog_category_idx" ON "PartCatalog"("category");

-- AlterTable
ALTER TABLE "Part" ADD COLUMN "catalogPartId" TEXT;

-- CreateIndex
CREATE INDEX "Part_catalogPartId_idx" ON "Part"("catalogPartId");

-- AddForeignKey
ALTER TABLE "Part" ADD CONSTRAINT "Part_catalogPartId_fkey" FOREIGN KEY ("catalogPartId") REFERENCES "PartCatalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;
