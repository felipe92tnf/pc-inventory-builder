import { http } from "./http";
const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";
export function listSales() {
    return http("/sales");
}
export function getMonthlySalesSummary() {
    return http("/sales/summary/monthly");
}
export function listSalesImportBatches() {
    return http("/sales/import-batches");
}
export function previewSalesImportBatchRevert(batchId) {
    return http(`/sales/import-batches/${encodeURIComponent(batchId)}/preview`);
}
export function revertSalesImportBatch(batchId, confirmPhrase) {
    return http(`/sales/import-batches/${encodeURIComponent(batchId)}/revert`, {
        method: "POST",
        body: { confirmPhrase }
    });
}
export function createSaleFromBuild(buildId, payload) {
    return http(`/sales/from-build/${buildId}`, {
        method: "POST",
        body: payload
    });
}
export function getSale(saleId) {
    return http(`/sales/${saleId}`);
}
export function patchSale(saleId, payload) {
    return http(`/sales/${saleId}`, {
        method: "PATCH",
        body: payload
    });
}
export function deleteSale(saleId) {
    return http(`/sales/${saleId}`, {
        method: "DELETE"
    });
}
export function revertSale(saleId) {
    return http(`/sales/${saleId}/revert`, {
        method: "POST"
    });
}
export async function salesImportPreview(file) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`${API_BASE_URL}/sales/import-preview`, {
        method: "POST",
        body: formData
    });
    if (!response.ok) {
        let message = `Request failed with status ${response.status}`;
        try {
            const data = (await response.json());
            if (data.message)
                message = data.message;
        }
        catch {
            // ignore
        }
        throw new Error(message);
    }
    return (await response.json());
}
export function salesImportConfirm(payload) {
    return http("/sales/import-confirm", {
        method: "POST",
        body: payload
    });
}
