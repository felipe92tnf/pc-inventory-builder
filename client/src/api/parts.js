import { http } from "./http";
export function listParts() {
    return http("/parts");
}
export function createStockFromCatalog(payload) {
    return http("/parts/from-catalog", {
        method: "POST",
        body: payload
    });
}
export function createPart(payload) {
    return http("/parts", {
        method: "POST",
        body: payload
    });
}
export function updatePart(partId, payload) {
    return http(`/parts/${partId}`, {
        method: "PATCH",
        body: payload
    });
}
export function deletePart(partId) {
    return http(`/parts/${partId}`, {
        method: "DELETE"
    });
}
