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
export function revertService(id) {
    return http(`/services/${id}/revert`, {
        method: "POST"
    });
}
export function addServiceExtraLine(serviceId, payload) {
    return http(`/services/${serviceId}/extra-lines`, {
        method: "POST",
        body: payload
    });
}
export function patchServiceExtraLine(serviceId, lineId, payload) {
    return http(`/services/${serviceId}/extra-lines/${lineId}`, {
        method: "PATCH",
        body: payload
    });
}
export function deleteServiceExtraLine(serviceId, lineId) {
    return http(`/services/${serviceId}/extra-lines/${lineId}`, {
        method: "DELETE"
    });
}
