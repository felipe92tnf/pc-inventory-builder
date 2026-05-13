import { http } from "./http";
export function listSales() {
    return http("/sales");
}
export function getMonthlySalesSummary() {
    return http("/sales/summary/monthly");
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
export function registerSalePayment(saleId, amount) {
    return http(`/sales/${saleId}/register-payment`, {
        method: "POST",
        body: { amount }
    });
}
export function deleteSale(saleId) {
    return http(`/sales/${saleId}`, {
        method: "DELETE"
    });
}
