-- Ficha de cliente: notas centralizadas por clave estable (telefono normalizado + nombre).
CREATE TABLE "CustomerProfile" (
    "id" TEXT NOT NULL,
    "lookupKey" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CustomerProfile_lookupKey_key" ON "CustomerProfile"("lookupKey");
