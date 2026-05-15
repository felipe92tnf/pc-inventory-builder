import { http } from "./http";
export function listExtraTemplates(activeOnly) {
    const q = activeOnly ? "?activeOnly=1" : "";
    return http(`/extra-templates${q}`);
}
export function createExtraTemplate(payload) {
    return http("/extra-templates", {
        method: "POST",
        body: payload
    });
}
export function patchExtraTemplate(id, payload) {
    return http(`/extra-templates/${id}`, {
        method: "PATCH",
        body: payload
    });
}
export function deleteExtraTemplate(id) {
    return http(`/extra-templates/${id}`, {
        method: "DELETE"
    });
}
