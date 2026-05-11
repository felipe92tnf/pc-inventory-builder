-- AlterTable
ALTER TABLE "Quote" ADD COLUMN "convertedAt" TIMESTAMP(3),
ADD COLUMN "convertedToBuildId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Quote_convertedToBuildId_key" ON "Quote"("convertedToBuildId");

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_convertedToBuildId_fkey" FOREIGN KEY ("convertedToBuildId") REFERENCES "Build"("id") ON DELETE SET NULL ON UPDATE CASCADE;
