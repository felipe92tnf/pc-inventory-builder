-- Ventas creadas antes del enum o sin valor explícito: tratarlas como completadas.
UPDATE "Sale"
SET "status" = 'COMPLETED'
WHERE "status" IS NULL;
