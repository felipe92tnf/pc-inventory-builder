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
export function addBuildItem(buildId, partId, quantity) {
    return http(`/builds/${buildId}/items`, {
        method: "POST",
        body: { partId, quantity }
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
