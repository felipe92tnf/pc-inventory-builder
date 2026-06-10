/**
 * Repara inconsistencias de stock y estado tras revertir/re-vender PCs completos (PREBUILT_PC).
 *
 * Detecta y corrige:
 * - Stock duplicado: PREBUILT_PC con stock > 0 pero unidades ya comprometidas en montajes no borrador.
 * - Montajes disponibles (CONFIRMED, etc.) con venta activa no revertida (deberian estar SOLD / PENDING_PICKUP).
 * - Parts con assembledFromBuildId apuntando a montajes inexistentes.
 * - PCs completos con varios montajes activos para la misma pieza.
 *
 * Uso:
 *   cd server && node scripts/repair-prebuilt-sale-revert.mjs
 *   cd server && node scripts/repair-prebuilt-sale-revert.mjs --dry-run
 */

import "dotenv/config";
import { PrismaClient, BuildStatus, InventoryKind, SaleStatus } from "@prisma/client";

const prisma = new PrismaClient();

const COMMITTED_STATUSES = [
  BuildStatus.CONFIRMED,
  BuildStatus.RESERVED,
  BuildStatus.PENDING_PAYMENT,
  BuildStatus.PENDING_PICKUP,
  BuildStatus.SOLD
];

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  console.log("============================================================");
  console.log("SecondByte — reparacion ventas revertidas / PCs completos");
  console.log(dryRun ? "MODO --dry-run (sin escrituras)" : "MODO ESCRITURA");
  console.log("============================================================\n");

  let stockFixes = 0;
  let buildStatusFixes = 0;
  let orphanAssembledFixes = 0;

  const prebuiltParts = await prisma.part.findMany({
    where: { inventoryKind: InventoryKind.PREBUILT_PC },
    include: {
      buildItems: {
        include: {
          build: {
            include: {
              sales: {
                where: { NOT: { status: SaleStatus.REVERTED } },
                orderBy: { soldAt: "desc" },
                take: 1
              }
            }
          }
        }
      },
      assembledFromBuild: { select: { id: true, name: true, status: true } }
    }
  });

  for (const part of prebuiltParts) {
    const committedItems = part.buildItems.filter((item) =>
      COMMITTED_STATUSES.includes(item.build.status)
    );
    const committedUnits = committedItems.reduce((sum, item) => sum + item.quantity, 0);
    const activeBuilds = committedItems.filter(
      (item) => item.build.status !== BuildStatus.SOLD
    );

    if (activeBuilds.length > 1) {
      console.warn("[DUPLICATE_ACTIVE_BUILDS]", {
        partId: part.id,
        partName: part.name,
        buildIds: activeBuilds.map((item) => ({
          buildId: item.build.id,
          buildName: item.build.name,
          status: item.build.status
        }))
      });
    }

    if (committedUnits > 0 && part.stock > 0) {
      const correctedStock = Math.max(0, part.stock - committedUnits);
      console.log("[STOCK_FIX]", {
        partId: part.id,
        partName: part.name,
        stockBefore: part.stock,
        committedUnits,
        stockAfter: correctedStock,
        buildIds: committedItems.map((item) => item.build.id)
      });
      if (!dryRun) {
        await prisma.part.update({
          where: { id: part.id },
          data: { stock: correctedStock }
        });
      }
      stockFixes += 1;
    }

    for (const item of committedItems) {
      const build = item.build;
      const activeSale = build.sales[0];
      if (!activeSale) continue;

      const shouldBeSold =
        activeSale.pickupConfirmedAt != null ? BuildStatus.SOLD : BuildStatus.PENDING_PICKUP;
      const sellableAgain = build.status === BuildStatus.CONFIRMED;

      if (sellableAgain) {
        console.log("[BUILD_STATUS_FIX]", {
          buildId: build.id,
          buildName: build.name,
          statusBefore: build.status,
          statusAfter: shouldBeSold,
          saleId: activeSale.id,
          saleStatus: activeSale.status
        });
        if (!dryRun) {
          await prisma.build.update({
            where: { id: build.id },
            data: { status: shouldBeSold }
          });
        }
        buildStatusFixes += 1;
      }
    }

    if (part.assembledFromBuildId) {
      const linked = part.assembledFromBuild;
      if (!linked) {
        console.log("[ORPHAN_ASSEMBLED_FROM_BUILD]", {
          partId: part.id,
          partName: part.name,
          assembledFromBuildId: part.assembledFromBuildId
        });
        if (!dryRun) {
          await prisma.part.update({
            where: { id: part.id },
            data: { assembledFromBuildId: null }
          });
        }
        orphanAssembledFixes += 1;
      }
    }
  }

  const orphanAssembledParts = await prisma.part.findMany({
    where: {
      assembledFromBuildId: { not: null },
      assembledFromBuild: null
    },
    select: { id: true, name: true, assembledFromBuildId: true }
  });

  for (const part of orphanAssembledParts) {
    console.log("[ORPHAN_ASSEMBLED_FROM_BUILD]", part);
    if (!dryRun) {
      await prisma.part.update({
        where: { id: part.id },
        data: { assembledFromBuildId: null }
      });
    }
    orphanAssembledFixes += 1;
  }

  console.log("\n============================================================");
  console.log("Resumen");
  console.log(`  Stock PREBUILT_PC corregidos:     ${stockFixes}`);
  console.log(`  Estados de montaje corregidos:    ${buildStatusFixes}`);
  console.log(`  Referencias assembledFrom limpiadas: ${orphanAssembledFixes}`);
  console.log("============================================================\n");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
