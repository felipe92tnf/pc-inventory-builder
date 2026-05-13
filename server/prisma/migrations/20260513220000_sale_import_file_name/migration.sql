-- Nombre del archivo Excel/CSV asociado al lote de importación (mismo valor en todas las ventas del lote).
ALTER TABLE "Sale" ADD COLUMN "importFileName" TEXT;
