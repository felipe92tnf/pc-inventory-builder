-- CreateTable
CREATE TABLE "ServiceSparePartLine" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "ServiceSparePartLine_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ServiceSparePartLine_serviceId_idx" ON "ServiceSparePartLine"("serviceId");

CREATE INDEX "ServiceSparePartLine_partId_idx" ON "ServiceSparePartLine"("partId");

ALTER TABLE "ServiceSparePartLine" ADD CONSTRAINT "ServiceSparePartLine_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ServiceSparePartLine" ADD CONSTRAINT "ServiceSparePartLine_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "ServiceSparePartLine" ("id", "serviceId", "partId", "quantity")
SELECT gen_random_uuid()::text, s."id", s."selectedPartId", s."quantity"
FROM "Service" s
WHERE s."type" = 'SPARE_PART_SALE'
  AND s."selectedPartId" IS NOT NULL
  AND s."quantity" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "ServiceSparePartLine" l WHERE l."serviceId" = s."id"
  );
