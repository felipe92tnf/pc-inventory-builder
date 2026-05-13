import { prisma } from "../../db/prisma.js";

/** ID virtual en API para ventas importadas sin `importBatchId` (datos anteriores a esta función). */
export const LEGACY_UNBATCHED_BATCH_ID = "unbatched-legacy";

/** Frase exacta que el usuario debe enviar para ejecutar el borrado. */
export const REVERT_IMPORT_CONFIRM_PHRASE = "REVERTIR IMPORTACIÓN";

const PREVIEW_SAMPLE_LIMIT = 40;

export type ImportBatchListItem = {
  batchId: string;
  importedAt: string | null;
  sourceFileName: string | null;
  salesCount: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  isLegacyUnbatched: boolean;
};

export type ImportBatchPreview = {
  batchId: string;
  isLegacyUnbatched: boolean;
  sourceFileName: string | null;
  salesCount: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  samples: {
    id: string;
    customerName: string;
    soldAt: string;
    finalSalePrice: number;
    profit: number;
  }[];
};

function dec(n: unknown): number {
  if (n == null) return 0;
  return Number(n);
}

export async function listSalesImportBatches(): Promise<ImportBatchListItem[]> {
  const grouped = await prisma.sale.groupBy({
    by: ["importBatchId"],
    where: { isImported: true, importBatchId: { not: null } },
    _count: { _all: true },
    _sum: {
      finalSalePrice: true,
      totalCost: true,
      profit: true
    }
  });

  const withDates = await Promise.all(
    grouped.map(async (g) => {
      const first = await prisma.sale.findFirst({
        where: { importBatchId: g.importBatchId! },
        select: { importedAt: true, importFileName: true },
        orderBy: { importedAt: "asc" }
      });
      const importedAtIso = first?.importedAt ? first.importedAt.toISOString() : null;
      const sourceFileName = first?.importFileName?.trim() || null;
      return {
        batchId: g.importBatchId!,
        importedAt: importedAtIso,
        sourceFileName,
        salesCount: g._count._all,
        totalRevenue: dec(g._sum.finalSalePrice),
        totalCost: dec(g._sum.totalCost),
        totalProfit: dec(g._sum.profit),
        isLegacyUnbatched: false
      };
    })
  );

  withDates.sort((a, b) => {
    const ta = a.importedAt ? new Date(a.importedAt).getTime() : 0;
    const tb = b.importedAt ? new Date(b.importedAt).getTime() : 0;
    return tb - ta;
  });

  const legacyAgg = await prisma.sale.aggregate({
    where: { isImported: true, importBatchId: null },
    _count: { _all: true },
    _sum: {
      finalSalePrice: true,
      totalCost: true,
      profit: true
    }
  });

  const legacyCount = legacyAgg._count._all;
  if (legacyCount > 0) {
    withDates.push({
      batchId: LEGACY_UNBATCHED_BATCH_ID,
      importedAt: null,
      sourceFileName: null,
      salesCount: legacyCount,
      totalRevenue: dec(legacyAgg._sum.finalSalePrice),
      totalCost: dec(legacyAgg._sum.totalCost),
      totalProfit: dec(legacyAgg._sum.profit),
      isLegacyUnbatched: true
    });
  }

  return withDates;
}

async function loadPreviewWhere(
  where: { isImported: boolean; importBatchId: string | null }
): Promise<ImportBatchPreview> {
  const [agg, samples, meta] = await Promise.all([
    prisma.sale.aggregate({
      where,
      _count: { _all: true },
      _sum: {
        finalSalePrice: true,
        totalCost: true,
        profit: true
      }
    }),
    prisma.sale.findMany({
      where,
      select: {
        id: true,
        customerName: true,
        soldAt: true,
        finalSalePrice: true,
        profit: true
      },
      orderBy: { soldAt: "desc" },
      take: PREVIEW_SAMPLE_LIMIT
    }),
    prisma.sale.findFirst({
      where,
      select: { importFileName: true }
    })
  ]);

  const salesCount = agg._count._all;
  const isLegacy = where.importBatchId === null;
  const sourceFileName = meta?.importFileName?.trim() || null;
  return {
    batchId: isLegacy ? LEGACY_UNBATCHED_BATCH_ID : where.importBatchId!,
    isLegacyUnbatched: isLegacy,
    sourceFileName,
    salesCount,
    totalRevenue: dec(agg._sum.finalSalePrice),
    totalCost: dec(agg._sum.totalCost),
    totalProfit: dec(agg._sum.profit),
    samples: samples.map((s) => ({
      id: s.id,
      customerName: s.customerName,
      soldAt: s.soldAt.toISOString(),
      finalSalePrice: dec(s.finalSalePrice),
      profit: dec(s.profit)
    }))
  };
}

export async function previewSalesImportBatchRevert(batchId: string): Promise<ImportBatchPreview> {
  if (batchId === LEGACY_UNBATCHED_BATCH_ID) {
    const preview = await loadPreviewWhere({ isImported: true, importBatchId: null });
    if (preview.salesCount === 0) {
      throw new Error("IMPORT_BATCH_NOT_FOUND");
    }
    return preview;
  }

  const preview = await loadPreviewWhere({ isImported: true, importBatchId: batchId });
  if (preview.salesCount === 0) {
    throw new Error("IMPORT_BATCH_NOT_FOUND");
  }
  return { ...preview, batchId, isLegacyUnbatched: false, sourceFileName: preview.sourceFileName };
}

export async function revertSalesImportBatch(batchId: string, confirmPhrase: string): Promise<{ deleted: number }> {
  const trimmed = confirmPhrase.trim();
  if (trimmed !== REVERT_IMPORT_CONFIRM_PHRASE) {
    throw new Error("CONFIRMATION_MISMATCH");
  }

  const where =
    batchId === LEGACY_UNBATCHED_BATCH_ID
      ? ({ isImported: true, importBatchId: null } as const)
      : ({ isImported: true, importBatchId: batchId } as const);

  return prisma.$transaction(async (tx) => {
    const sales = await tx.sale.findMany({
      where,
      select: { id: true, buildId: true, isImported: true, importBatchId: true }
    });

    if (sales.length === 0) {
      throw new Error("IMPORT_BATCH_NOT_FOUND");
    }

    for (const s of sales) {
      if (!s.isImported) {
        throw new Error("IMPORT_REVERT_SAFETY");
      }
      if (batchId !== LEGACY_UNBATCHED_BATCH_ID && s.importBatchId !== batchId) {
        throw new Error("IMPORT_REVERT_SAFETY");
      }
      if (batchId === LEGACY_UNBATCHED_BATCH_ID && s.importBatchId !== null) {
        throw new Error("IMPORT_REVERT_SAFETY");
      }
    }

    const saleIds = sales.map((s) => s.id);
    const buildIds = [...new Set(sales.map((s) => s.buildId))];

    await tx.sale.deleteMany({ where: { id: { in: saleIds } } });
    await tx.build.deleteMany({ where: { id: { in: buildIds } } });

    return { deleted: saleIds.length };
  });
}
