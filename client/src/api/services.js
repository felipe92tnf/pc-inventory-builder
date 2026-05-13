import { http } from "./http";
export function listServices(params) {
    const sp = new URLSearchParams();
    if (params?.type)
        sp.set("type", params.type);
    if (params?.status)
        sp.set("status", params.status);
    if (params?.month !== undefined)
        sp.set("month", String(params.month));
    if (params?.year !== undefined)
        sp.set("year", String(params.year));
    const q = sp.toString();
    return http(`/services${q ? `?${q}` : ""}`);
}
export function getMonthlyServicesSummary() {
    return http("/services/summary/monthly");
}
export function createService(payload) {
    return http("/services", {
        method: "POST",
        body: {
            ...payload,
            serviceDate: payload.serviceDate
        }
    });
}
export function getService(id) {
    return http(`/services/${id}`);
}
export function patchService(id, payload) {
    return http(`/services/${id}`, {
        method: "PATCH",
        body: payload
    });
}
export function registerServicePayment(id, amount) {
    return http(`/services/${id}/register-payment`, {
        method: "POST",
        body: { amount }
    });
}
export function deleteService(id) {
    return http(`/services/${id}`, {
        method: "DELETE"
    });
}
export function completeService(id) {
    return http(`/services/${id}/complete`, {
        method: "POST"
    });
}
