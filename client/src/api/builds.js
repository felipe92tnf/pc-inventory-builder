import { http } from "./http";
export function listBuilds() {
    return http("/builds");
}
export function getBuild(buildId) {
    return http(`/builds/${buildId}`);
}
export function createBuild(payload) {
    return http("/builds", {
        method: "POST",
        body: payload
    });
}
/** Crea montaje confirmado desde 1 unidad de PC premontado en inventario (listo para venta). */
export function createBuildFromPrebuiltPart(partId) {
    return http("/builds/from-prebuilt-part", {
        method: "POST",
        body: { partId }
    });
}
export function updateBuild(buildId, payload) {
    return http(`/builds/${buildId}`, {
        method: "PATCH",
        body: payload
    });
}
export function deleteBuild(buildId) {
    return http(`/builds/${buildId}`, {
        method: "DELETE"
    });
}
export function addBuildItem(buildId, payload) {
    return http(`/builds/${buildId}/items`, {
        method: "POST",
        body: payload
    });
}
export function updateBuildItem(buildId, itemId, payload) {
    return http(`/builds/${buildId}/items/${itemId}`, {
        method: "PATCH",
        body: payload
    });
}
export function deleteBuildItem(buildId, itemId) {
    return http(`/builds/${buildId}/items/${itemId}`, {
        method: "DELETE"
    });
}
export function confirmBuild(buildId) {
    return http(`/builds/${buildId}/confirm`, {
        method: "POST"
    });
}
export function revertBuildToDraft(buildId) {
    return http(`/builds/${buildId}/revert-draft`, {
        method: "POST"
    });
}
