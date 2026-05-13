import { http } from "./http";
let loggedApiBaseOnce = false;
/**
 * Lista piezas del catalogo (plantillas). Usa GET /catalog-parts con filtro opcional.
 * Sin texto devuelve todas (ordenadas en servidor).
 */
export function listCatalogParts(search) {
    if (import.meta.env.DEV && !loggedApiBaseOnce) {
        loggedApiBaseOnce = true;
        console.log("[SecondByte catalog] URL base (VITE_API_URL):", import.meta.env.VITE_API_URL ?? "(no definida → http://localhost:4000/api/v1)");
    }
    const params = new URLSearchParams();
    if (search !== undefined && search.trim() !== "") {
        params.set("search", search.trim());
    }
    const qs = params.toString();
    const path = `/catalog-parts${qs ? `?${qs}` : ""}`;
    if (import.meta.env.DEV) {
        console.log("[SecondByte catalog] GET endpoint=", path, "search=", search?.trim() ?? "(vacío = todas)");
    }
    return http(path)
        .then((rows) => {
        if (import.meta.env.DEV) {
            console.log("[SecondByte catalog] GET ok path=", path, "filas=", rows.length, "muestra=", rows.slice(0, 5));
        }
        return rows;
    })
        .catch((err) => {
        if (import.meta.env.DEV) {
            console.error("[SecondByte catalog] GET fallo path=", path, "error=", err);
        }
        throw err;
    });
}
/** @deprecated Usar listCatalogParts; se mantiene por compatibilidad. */
export function listCatalog(query) {
    return listCatalogParts(query);
}
export function createCatalogPart(payload) {
    return http("/catalog", {
        method: "POST",
        body: payload
    });
}
