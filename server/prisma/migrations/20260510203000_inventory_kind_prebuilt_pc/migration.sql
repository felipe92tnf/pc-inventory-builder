-- CreateEnum
CREATE TYPE "InventoryKind" AS ENUM ('PART', 'PREBUILT_PC');

-- AlterTable
ALTER TABLE "Part" ADD COLUMN "inventoryKind" "InventoryKind" NOT NULL DEFAULT 'PART';
ALTER TABLE "Part" ADD COLUMN "description" TEXT NOT NULL DEFAULT '';

-- Piezas existentes siguen siendo PART con categoria.
ALTER TABLE "Part" ALTER COLUMN "category" DROP NOT NULL;
