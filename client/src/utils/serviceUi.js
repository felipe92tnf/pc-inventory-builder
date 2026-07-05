/** Marcador para API cuando el título aún no se ha indicado (min length 1). */
export const API_EMPTY_SERVICE_TITLE_MARKER = "\u200B";
const UNSET_TITLE_LITERALS = new Set(["nuevo servicio", "\u200b"]);
export function serviceTitleToForm(title) {
    const t = (title ?? "").trim();
    if (!t || UNSET_TITLE_LITERALS.has(t.toLowerCase()) || t === API_EMPTY_SERVICE_TITLE_MARKER) {
        return "";
    }
    return t;
}
export function serviceTitleForApi(title) {
    const t = title.trim();
    return t || API_EMPTY_SERVICE_TITLE_MARKER;
}
/** Cabecera y listados cuando no hay título. */
export function displayServiceTitle(title, fallback = "Servicio") {
    const t = serviceTitleToForm(title);
    return t || fallback;
}
export function displayServiceTitleLabel(title) {
    const t = serviceTitleToForm(title);
    return t || "—";
}
