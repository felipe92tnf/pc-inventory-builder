import { http } from "./http";
import type {
  CreateSaleFromBuildPayload,
  MonthlySalesSummaryRow,
  PatchSalePayload,
  SaleDetail,
  SaleListRow,
  SalesImportBatchPreview,
  SalesImportBatchRow,
  SalesImportConfirmPayload,
  SalesImportConfirmResult,
  SalesImportPreviewRow
} from "../types/sale";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";

export function listSales() {
  return http<SaleListRow[]>("/sales");
}

export function getMonthlySalesSummary() {
  return http<MonthlySalesSummaryRow[]>("/sales/summary/monthly");
}

export function listSalesImportBatches() {
  return http<{ batches: SalesImportBatchRow[] }>("/sales/import-batches");
}

export function previewSalesImportBatchRevert(batchId: string) {
  return http<SalesImportBatchPreview>(`/sales/import-batches/${encodeURIComponent(batchId)}/preview`);
}

export function revertSalesImportBatch(batchId: string, confirmPhrase: string) {
  return http<{ deleted: number }>(`/sales/import-batches/${encodeURIComponent(batchId)}/revert`, {
    method: "POST",
    body: { confirmPhrase }
  });
}

export function createSaleFromBuild(buildId: string, payload: CreateSaleFromBuildPayload) {
  return http<SaleDetail>(`/sales/from-build/${buildId}`, {
    method: "POST",
    body: payload
  });
}

export function getSale(saleId: string) {
  return http<SaleDetail>(`/sales/${saleId}`);
}

export function patchSale(saleId: string, payload: PatchSalePayload) {
  return http<SaleDetail>(`/sales/${saleId}`, {
    method: "PATCH",
    body: payload
  });
}

export function deleteSale(saleId: string) {
  return http<void>(`/sales/${saleId}`, {
    method: "DELETE"
  });
}

export function revertSale(saleId: string) {
  return http<SaleDetail>(`/sales/${saleId}/revert`, {
    method: "POST"
  });
}

export function recalculateSaleFromBuild(saleId: string) {
  return http<SaleDetail>(`/sales/${saleId}/recalculate-from-build`, {
    method: "POST"
  });
}

export async function salesImportPreview(file: File): Promise<{ rows: SalesImportPreviewRow[] }> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(`${API_BASE_URL}/sales/import-preview`, {
    method: "POST",
    body: formData
  });
  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const data = (await response.json()) as { message?: string };
      if (data.message) message = data.message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  return (await response.json()) as { rows: SalesImportPreviewRow[] };
}

export function salesImportConfirm(payload: SalesImportConfirmPayload) {
  return http<SalesImportConfirmResult>("/sales/import-confirm", {
    method: "POST",
    body: payload
  });
}
