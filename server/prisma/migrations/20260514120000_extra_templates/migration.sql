-- Extra templates (no stock) and lines on builds, services, quote items.

CREATE TABLE "ExtraTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "defaultCostPrice" DECIMAL(12,2) NOT NULL,
    "defaultSalePrice" DECIMAL(12,2) NOT NULL,
    "category" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExtraTemplate_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ExtraTemplate_active_idx" ON "ExtraTemplate"("active");
CREATE INDEX "ExtraTemplate_category_idx" ON "ExtraTemplate"("category");
CREATE INDEX "ExtraTemplate_name_idx" ON "ExtraTemplate"("name");

CREATE TABLE "BuildExtraLine" (
    "id" TEXT NOT NULL,
    "buildId" TEXT NOT NULL,
    "extraTemplateId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitCost" DECIMAL(12,2) NOT NULL,
    "unitSalePrice" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "BuildExtraLine_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BuildExtraLine_buildId_idx" ON "BuildExtraLine"("buildId");
CREATE INDEX "BuildExtraLine_extraTemplateId_idx" ON "BuildExtraLine"("extraTemplateId");

ALTER TABLE "BuildExtraLine" ADD CONSTRAINT "BuildExtraLine_buildId_fkey" FOREIGN KEY ("buildId") REFERENCES "Build"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BuildExtraLine" ADD CONSTRAINT "BuildExtraLine_extraTemplateId_fkey" FOREIGN KEY ("extraTemplateId") REFERENCES "ExtraTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "ServiceExtraLine" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "extraTemplateId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitCost" DECIMAL(12,2) NOT NULL,
    "unitSalePrice" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "ServiceExtraLine_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ServiceExtraLine_serviceId_idx" ON "ServiceExtraLine"("serviceId");
CREATE INDEX "ServiceExtraLine_extraTemplateId_idx" ON "ServiceExtraLine"("extraTemplateId");

ALTER TABLE "ServiceExtraLine" ADD CONSTRAINT "ServiceExtraLine_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServiceExtraLine" ADD CONSTRAINT "ServiceExtraLine_extraTemplateId_fkey" FOREIGN KEY ("extraTemplateId") REFERENCES "ExtraTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TYPE "QuoteItemType" ADD VALUE 'EXTRA_TEMPLATE';

ALTER TABLE "QuoteItem" ADD COLUMN "extraTemplateId" TEXT;

CREATE INDEX "QuoteItem_extraTemplateId_idx" ON "QuoteItem"("extraTemplateId");

ALTER TABLE "QuoteItem" ADD CONSTRAINT "QuoteItem_extraTemplateId_fkey" FOREIGN KEY ("extraTemplateId") REFERENCES "ExtraTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
