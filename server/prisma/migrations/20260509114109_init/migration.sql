-- CreateTable
CREATE TABLE "Part" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "costPrice" DECIMAL NOT NULL,
    "salePrice" DECIMAL NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Build" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "confirmedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BuildPartItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "buildId" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "BuildPartItem_buildId_fkey" FOREIGN KEY ("buildId") REFERENCES "Build" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BuildPartItem_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Part_category_idx" ON "Part"("category");

-- CreateIndex
CREATE INDEX "Part_condition_idx" ON "Part"("condition");

-- CreateIndex
CREATE INDEX "Part_name_idx" ON "Part"("name");

-- CreateIndex
CREATE INDEX "Build_status_idx" ON "Build"("status");

-- CreateIndex
CREATE INDEX "Build_name_idx" ON "Build"("name");

-- CreateIndex
CREATE INDEX "BuildPartItem_buildId_idx" ON "BuildPartItem"("buildId");

-- CreateIndex
CREATE INDEX "BuildPartItem_partId_idx" ON "BuildPartItem"("partId");

-- CreateIndex
CREATE UNIQUE INDEX "BuildPartItem_buildId_partId_key" ON "BuildPartItem"("buildId", "partId");
