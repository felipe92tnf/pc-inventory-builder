-- AlterEnum (PostgreSQL: new values at end of enum type)
ALTER TYPE "BuildStatus" ADD VALUE 'PENDING_PICKUP';
ALTER TYPE "BuildStatus" ADD VALUE 'PENDING_PAYMENT';
ALTER TYPE "BuildStatus" ADD VALUE 'RESERVED';

-- AlterTable Build
ALTER TABLE "Build" ADD COLUMN "reservationDeposit" DECIMAL(12,2),
ADD COLUMN "reservationRemaining" DECIMAL(12,2),
ADD COLUMN "pendingPaymentPaid" DECIMAL(12,2),
ADD COLUMN "pendingPaymentRemaining" DECIMAL(12,2),
ADD COLUMN "partialAccruedAt" TIMESTAMP(3);

-- AlterTable Sale: entrega al cliente
ALTER TABLE "Sale" ADD COLUMN "pickupConfirmedAt" TIMESTAMP(3);
UPDATE "Sale" SET "pickupConfirmedAt" = "soldAt" WHERE "pickupConfirmedAt" IS NULL;
