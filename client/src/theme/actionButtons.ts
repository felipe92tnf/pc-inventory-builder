/**
 * Botones de acción principal — degradado morado → índigo → cyan (misma estética en toda la app).
 * Exporta strings de clases Tailwind para usar en `className` (tipado como `string`).
 */
export const PRIMARY_ACTION_BUTTON =
  "inline-flex min-h-[44px] w-full shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 ring-1 ring-white/10 transition hover:from-violet-500 hover:via-indigo-500 hover:to-cyan-500 hover:shadow-[0_0_28px_-8px_rgba(99,102,241,0.5)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400/50 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto";

/** Misma estética en filas de tabla / tarjetas (Registrar venta, Vender PC, etc.) */
export const PRIMARY_ACTION_BUTTON_COMPACT =
  "inline-flex min-h-[38px] shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-900/35 ring-1 ring-white/10 transition hover:from-violet-500 hover:via-indigo-500 hover:to-cyan-500 hover:shadow-[0_0_20px_-8px_rgba(99,102,241,0.45)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400/50 disabled:cursor-not-allowed disabled:opacity-50";

/** Secundario: utilidades, cancelar, mes actual, paginación */
export const SECONDARY_BUTTON =
  "inline-flex min-h-[40px] items-center justify-center rounded-lg border border-slate-600 bg-slate-900/70 px-4 py-2 text-sm font-medium text-slate-200 shadow-sm transition hover:border-slate-500 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50";

export const SECONDARY_BUTTON_SM =
  "inline-flex items-center justify-center rounded-lg border border-slate-600 bg-slate-900/70 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-800 disabled:opacity-50";

/** Ver detalle, enlaces discretos con acento índigo */
export const SECONDARY_GHOST_SM =
  "inline-flex items-center justify-center rounded-lg border border-indigo-500/45 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-200 transition hover:bg-indigo-500/20";

/** Cabeceras de filtros colapsables (<details><summary> o botón) */
export const FILTER_TOGGLE_ROW =
  "flex w-full cursor-pointer list-none items-center justify-between gap-3 rounded-xl border border-slate-700 bg-slate-950/40 px-4 py-3 text-left text-sm font-semibold text-slate-200 transition hover:border-slate-600 hover:bg-slate-900/60";

export const DESTRUCTIVE_BUTTON_SM =
  "inline-flex items-center justify-center rounded-lg border border-rose-500/45 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/20 disabled:opacity-50";
