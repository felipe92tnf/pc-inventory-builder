-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerEmail" TEXT,
    "description" TEXT NOT NULL DEFAULT '',
    "selectedPartId" TEXT,
    "quantity" INTEGER,
    "costPrice" DECIMAL NOT NULL,
    "salePrice" DECIMAL NOT NULL,
    "profit" DECIMAL NOT NULL,
    "isHomeService" BOOLEAN NOT NULL DEFAULT false,
    "homeServiceAddress" TEXT,
    "homeServiceSupplement" DECIMAL,
    "serviceDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Service_selectedPartId_fkey" FOREIGN KEY ("selectedPartId") REFERENCES "Part" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Service_type_idx" ON "Service"("type");

-- CreateIndex
CREATE INDEX "Service_status_idx" ON "Service"("status");

-- CreateIndex
CREATE INDEX "Service_serviceDate_idx" ON "Service"("serviceDate");
