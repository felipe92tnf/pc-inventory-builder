/** Marcador para API cuando el título aún no se ha indicado (min length 1). */
export const API_EMPTY_SERVICE_TITLE_MARKER = "\u200B";

const UNSET_TITLE_LITERALS = new Set(["nuevo servicio", "\u200b"]);

export function serviceTitleToForm(title: string | null | undefined): string {
  const t = (title ?? "").trim();
  if (!t || UNSET_TITLE_LITERALS.has(t.toLowerCase()) || t === API_EMPTY_SERVICE_TITLE_MARKER) {
    return "";
  }
  return t;
}

export function serviceTitleForApi(title: string): string {
  const t = title.trim();
  return t || API_EMPTY_SERVICE_TITLE_MARKER;
}

/** Cabecera y listados cuando no hay título. */
export function displayServiceTitle(title: string | null | undefined, fallback = "Servicio"): string {
  const t = serviceTitleToForm(title);
  return t || fallback;
}

export function displayServiceTitleLabel(title: string | null | undefined): string {
  const t = serviceTitleToForm(title);
  return t || "—";
}
