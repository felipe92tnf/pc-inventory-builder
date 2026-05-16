-- Montajes por piezas: PC completo en inventario vinculado al montaje (1:1; coincide con schema Prisma).
ALTER TABLE "Part" ADD COLUMN "assembledFromBuildId" TEXT;

CREATE UNIQUE INDEX "Part_assembledFromBuildId_key" ON "Part"("assembledFromBuildId");

ALTER TABLE "Part" ADD CONSTRAINT "Part_assembledFromBuildId_fkey" FOREIGN KEY ("assembledFromBuildId") REFERENCES "Build"("id") ON DELETE SET NULL ON UPDATE CASCADE;
