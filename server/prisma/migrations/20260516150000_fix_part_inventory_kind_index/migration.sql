-- Índice movido desde 20260510200001_nombre_cambio (debe ejecutarse después de existir `inventoryKind`).
CREATE INDEX IF NOT EXISTS "Part_inventoryKind_idx" ON "Part"("inventoryKind");
