/**
 * Tarjetas de resumen KPI (misma cáscara en Inventario, Presupuestos detalle, Montajes detalle, Servicios, Ventas).
 * Strings de clases Tailwind para `className`.
 */
const SUMMARY_CARD_BASE = "flex flex-col rounded-2xl border border-cyan-500/25 bg-gradient-to-br from-[#0a0f1a] via-[#0c1424] to-[#081018] p-5 shadow-[0_12px_40px_-16px_rgba(6,182,212,0.18)] ring-1 ring-cyan-500/10";
/** Contenedor KPI: altura mínima unificada. */
export const SUMMARY_CARD_SHELL = `${SUMMARY_CARD_BASE} min-h-[118px]`;
/** Misma cáscara sin altura mínima (bloques con formulario o contenido variable). */
export const SUMMARY_CARD_SHELL_AUTO = `${SUMMARY_CARD_BASE} min-h-0`;
/** Bloque mensual con varias KPI (un poco más alto). */
export const SUMMARY_CARD_SHELL_MONTH = `${SUMMARY_CARD_BASE} min-h-[200px]`;
/** Label corto encima del valor. */
export const SUMMARY_CARD_LABEL = "text-[11px] font-semibold uppercase tracking-wider text-cyan-100/50";
/** Número principal (combinar con una clase de color). */
export const SUMMARY_CARD_VALUE = "mt-2 text-2xl font-bold tabular-nums leading-tight tracking-tight md:text-[1.65rem]";
export const SUMMARY_VALUE_NEUTRAL = `${SUMMARY_CARD_VALUE} text-slate-100`;
export const SUMMARY_VALUE_REVENUE = `${SUMMARY_CARD_VALUE} text-emerald-300`;
export const SUMMARY_VALUE_PROFIT_POS = `${SUMMARY_CARD_VALUE} text-emerald-300`;
export const SUMMARY_VALUE_PROFIT_CYAN = `${SUMMARY_CARD_VALUE} text-cyan-300`;
export const SUMMARY_VALUE_NEGATIVE = `${SUMMARY_CARD_VALUE} text-rose-300`;
/** Rejilla habitual: 1 col móvil, 2 tablet, 4 escritorio ancho. */
export const SUMMARY_CARD_GRID = "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4";
/** Variante 3 columnas (detalle montaje / venta). */
export const SUMMARY_CARD_GRID_THREE = "grid grid-cols-1 gap-3 md:grid-cols-3";
