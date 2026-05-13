/**
 * Migración única: inventario existente (Part) -> catálogo (PartCatalog) + vincular catalogPartId.
 *
 * - Solo filas inventoryKind = PART con categoría (no PCs premontados).
 * - No borra datos; no modifica QuoteItem, BuildPartItem, Sale, etc. (solo Part.catalogPartId).
 * - Emparejamiento simple: misma categoría + mismo nombre (trim, sin distinguir mayúsculas).
 *   brand/model en PartCatalog quedan "" (el modelo Part no tiene marca/modelo en BD).
 * - Idempotente: Part con catalogPartId ya informado se omiten.
 *
 * Uso:
 *   cd server && node scripts/migrate-inventory-to-catalog.mjs
 *   cd server && node scripts/migrate-inventory-to-catalog.mjs --dry-run
 */

import "dotenv/config";
import { PrismaClient, InventoryKind } from "@prisma/client";

const prisma = new PrismaClient();

const MIGRATION_NOTE = "Plantilla generada por migración SecondByte (inventario existente).";

function normName(name) {
  return name.trim().toLowerCase();
}

function dedupKey(category, name) {
  return `${category}|${normName(name)}`;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  console.log("============================================================");
  console.log("SecondByte — migración inventario (Part) -> catálogo (PartCatalog)");
  console.log(dryRun ? "MODO --dry-run (sin escrituras en Part ni creación real de catálogo)" : "MODO ESCRITURA");
  console.log("============================================================\n");

  const parts = await prisma.part.findMany({
    where: {
      inventoryKind: InventoryKind.PART,
      category: { not: null }
    },
    orderBy: { createdAt: "asc" }
  });

  let skippedAlreadyLinked = 0;
  let skippedNoCategory = 0;

  let catalogsCreated = 0;
  let catalogsMatchedInDb = 0;
  /** Segunda y siguientes Part con la misma clave nombre+categoría en esta corrida. */
  let partsSharingTemplateInRun = 0;

  let partsUpdated = 0;

  const keyToCatalogId = new Map();

  for (const part of parts) {
    if (!part.category) {
      skippedNoCategory++;
      continue;
    }
    if (part.catalogPartId) {
      skippedAlreadyLinked++;
      continue;
    }

    const key = dedupKey(part.category, part.name);
    let catalogId = keyToCatalogId.get(key);

    if (!catalogId) {
      const existing = await prisma.partCatalog.findFirst({
        where: {
          category: part.category,
          name: { equals: part.name.trim(), mode: "insensitive" }
        },
        orderBy: { createdAt: "asc" }
      });

      if (existing) {
        catalogId = existing.id;
        catalogsMatchedInDb++;
        console.log(
          `[catálogo ya en BD] id=${catalogId} nombre="${existing.name}" categoría=${existing.category} (clave ${key})`
        );
      } else if (dryRun) {
        catalogsCreated++;
        catalogId = `__dry_run__${key.replace(/[^a-zA-Z0-9_|]/g, "_")}`;
        console.log(
          `[dry-run] crearía PartCatalog + vincularía Part id=${part.id} clave=${key} nombre="${part.name.trim()}"`
        );
      } else {
        const created = await prisma.partCatalog.create({
          data: {
            name: part.name.trim(),
            category: part.category,
            brand: "",
            model: "",
            defaultCostPrice: part.costPrice,
            defaultSalePrice: part.salePrice,
            notes: part.notes ? `${MIGRATION_NOTE}\n\n${part.notes}` : MIGRATION_NOTE
          }
        });
        catalogId = created.id;
        catalogsCreated++;
        console.log(
          `[creado PartCatalog] id=${catalogId} <- Part id=${part.id} "${part.name.trim()}" (${part.category})`
        );
      }
      keyToCatalogId.set(key, catalogId);
    } else {
      partsSharingTemplateInRun++;
      console.log(
        `[duplicado misma clave] Part id=${part.id} "${part.name.trim()}" -> mismo catalogPartId=${catalogId} (clave ${key})`
      );
    }

    if (!dryRun) {
      await prisma.part.update({
        where: { id: part.id },
        data: { catalogPartId: catalogId }
      });
      partsUpdated++;
    }
  }

  console.log("\n------------------------------------------------------------");
  console.log("Resumen");
  console.log("------------------------------------------------------------");
  console.log(`Part candidatas (PART con categoría):     ${parts.length}`);
  console.log(`Omitidas (ya tenían catalogPartId):       ${skippedAlreadyLinked}`);
  console.log(`Omitidas (sin categoría):                 ${skippedNoCategory}`);
  console.log(`---`);
  if (dryRun) {
    console.log(`PartCatalog que se crearían (simulado):   ${catalogsCreated}`);
  } else {
    console.log(`PartCatalog creados en esta ejecución:    ${catalogsCreated}`);
  }
  console.log(`PartCatalog reutilizados (ya en BD):      ${catalogsMatchedInDb}`);
  console.log(`Part con misma plantilla (clave duplicada): ${partsSharingTemplateInRun}`);
  if (dryRun) {
    console.log(`Part que se vincularían (simulado):       ${parts.length - skippedAlreadyLinked - skippedNoCategory}`);
  } else {
    console.log(`Part actualizadas (catalogPartId):        ${partsUpdated}`);
  }
  console.log("------------------------------------------------------------\n");

  if (dryRun) {
    console.log("Ejecuta sin --dry-run para aplicar cambios.\n");
  } else {
    console.log("Migración aplicada. Re-ejecutar: las Part ya vinculadas se omitirán.\n");
  }
}

main()
  .catch((e) => {
    console.error("[error]", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
