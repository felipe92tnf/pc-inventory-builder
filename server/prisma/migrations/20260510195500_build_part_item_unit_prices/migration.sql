-- Snapshot por linea: coste y venta unitarios en el montaje (deja de usar override + Part para totales).

ALTER TABLE "BuildPartItem" ADD COLUMN "unitCost" DECIMAL(65,30);
ALTER TABLE "BuildPartItem" ADD COLUMN "unitSalePrice" DECIMAL(65,30);

UPDATE "BuildPartItem" AS b
SET
  "unitCost" = p."costPrice",
  "unitSalePrice" = COALESCE(b."salePriceUnitOverride", p."salePrice")
FROM "Part" AS p
WHERE b."partId" = p."id";

ALTER TABLE "BuildPartItem" ALTER COLUMN "unitCost" SET NOT NULL;
ALTER TABLE "BuildPartItem" ALTER COLUMN "unitSalePrice" SET NOT NULL;

ALTER TABLE "BuildPartItem" DROP COLUMN "salePriceUnitOverride";
