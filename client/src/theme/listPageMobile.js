/**
 * Patrón visual unificado para listados en móvil (Presupuestos, Montajes, Servicios).
 * Solo clases Tailwind; sin lógica de negocio.
 */
/** Bloque 2: cáscara del panel de filtros colapsable. */
export const LIST_PAGE_FILTER_SECTION = "overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 shadow-inner shadow-black/20";
/** Bloque 3: título sobre el listado agrupado. */
export const LIST_PAGE_LISTING_TITLE = "text-xl font-semibold tracking-tight text-slate-100";
/** Espacio entre título de listado y acordeones. */
export const LIST_PAGE_LISTING_REGION = "space-y-3";
/** Bloque 4: tarjeta contenedora del acordeón (details o botón + panel). */
export const LIST_PAGE_ACCORDION_SHELL = "overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-lg shadow-slate-950/40";
/**
 * Cabecera del acordeón (summary o botón).
 * `group` + `group-open:` permiten animar chevron en `<details class="group">`.
 */
export const LIST_PAGE_ACCORDION_TRIGGER = "flex w-full cursor-pointer list-none items-center justify-between gap-3 border-b border-slate-800 bg-slate-950/20 px-3.5 py-3 text-left transition hover:bg-slate-900/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400/50 md:px-4 [&::-webkit-details-marker]:hidden";
/** Contador en cabecera de sección (badge). */
export const LIST_PAGE_COUNT_BADGE = "inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold leading-none";
/** Cuerpo del acordeón bajo el trigger. */
export const LIST_PAGE_ACCORDION_BODY = "border-t border-slate-800 p-2.5 md:p-3";
