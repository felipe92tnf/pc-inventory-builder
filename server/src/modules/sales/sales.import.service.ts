import { randomUUID } from "node:crypto";
import { BuildStatus, Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../db/prisma.js";
import { parseSalesImportFile, type ParsedImportRow } from "./sales.import.parser.js";

function moneyDecimal(value: number): Prisma.Decimal {
  return new Prisma.Decimal(Math.round(value * 100) / 100);
}

export type PreviewRow = ParsedImportRow & {
  profitCalculated: number | null;
  ok: boolean;
};

export function buildSalesImportPreview(buffer: Buffer, originalName: string): PreviewRow[] {
  const raw = parseSalesImportFile(buffer, originalName);
  return raw.map((r) => {
    const profitCalculated =
      r.totalCost != null && r.finalSalePrice != null
        ? Math.round((r.finalSalePrice - r.totalCost) * 100) / 100
        : null;
    return {
      ...r,
      profitCalculated,
      ok: r.errors.length === 0
    };
  });
}

const confirmRowSchema = z.object({
  sheetRow: z.number().int().positive(),
  soldAt: z.string().min(1),
  customerName: z.string().min(1).max(500),
  description: z.string().max(4000).nullable().optional(),
  totalCost: z.number().finite(),
  finalSalePrice: z.number().finite(),
  customerPhone: z.string().max(64).nullable().optional()
});

const confirmBodySchema = z.object({
  rows: z.array(confirmRowSchema).min(1).max(2000),
  /** Nombre del archivo subido (opcional; se guarda en cada venta del lote). */
  sourceFileName: z.string().max(512).optional()
});

export async function importSalesConfirm(payload: unknown): Promise<{
  created: number;
  failed: { sheetRow: number; message: string }[];
  importBatchId: string;
  importedAt: string;
}> {
  const { rows, sourceFileName } = confirmBodySchema.parse(payload);
  const failed: { sheetRow: number; message: string }[] = [];
  let created = 0;
  const importBatchId = randomUUID();
  const importedAt = new Date();
  const importFileName =
    typeof sourceFileName === "string" && sourceFileName.trim().length > 0
      ? sourceFileName.trim().slice(0, 512)
      : null;

  for (const row of rows) {
    try {
      const profit = Math.round((row.finalSalePrice - row.totalCost) * 100) / 100;
      await prisma.$transaction(async (tx) => {
        const buildName = `[Histórico Excel] ${row.customerName}`.slice(0, 200);
        const build = await tx.build.create({
          data: {
            name: buildName,
            status: BuildStatus.SOLD,
            notes: row.description?.trim() || "Importación histórica (Excel)."
          }
        });

        await tx.sale.create({
          data: {
            buildId: build.id,
            customerName: row.customerName.trim(),
            customerPhone: row.customerPhone?.trim() || "—",
            customerEmail: null,
            finalSalePrice: moneyDecimal(row.finalSalePrice),
            totalCost: moneyDecimal(row.totalCost),
            profit: moneyDecimal(profit),
            soldAt: new Date(row.soldAt),
            pickupConfirmedAt: new Date(row.soldAt),
            paymentMethod: "Importación histórica",
            warrantyMonths: null,
            notes: row.description?.trim() ? row.description.trim().slice(0, 4000) : null,
            isImported: true,
            importBatchId,
            importedAt,
            importFileName
          }
        });
      });
      created++;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Error desconocido";
      failed.push({ sheetRow: row.sheetRow, message });
    }
  }

  return { created, failed, importBatchId, importedAt: importedAt.toISOString() };
}
