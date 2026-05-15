-- Datos de cliente en ficha de montaje (borrador / antes de venta).
ALTER TABLE "Build" ADD COLUMN "customerName" TEXT;
ALTER TABLE "Build" ADD COLUMN "customerPhone" TEXT;
ALTER TABLE "Build" ADD COLUMN "customerEmail" TEXT;
