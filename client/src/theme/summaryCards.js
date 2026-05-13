/**
 * Tarjetas de resumen KPI (misma cáscara en Inventario, Presupuestos detalle, Montajes detalle, Servicios, Ventas).
 * Strings de clases Tailwind para `className`.
 */
const SUMMARY_CARD_BASE = "flex flex-col rounded-2xl border border-cyan-500/25 bg-gradient-to-br from-[#0a0f1a] via-[#0c1424] to-[#081018] p-2.5 shadow-[0_12px_40px_-16px_rgba(6,182,212,0.18)] ring-1 ring-cyan-500/10 sm:p-4";
/** Contenedor KPI: altura mínima unificada (más bajo en móvil). */
export const SUMMARY_CARD_SHELL = `${SUMMARY_CARD_BASE} min-h-[76px] sm:min-h-[100px]`;
/** Misma cáscara sin altura mínima (bloques con formulario o contenido variable). */
export const SUMMARY_CARD_SHELL_AUTO = `${SUMMARY_CARD_BASE} min-h-0`;
/** Bloque mensual con varias KPI (alto fijo solo desde sm). */
export const SUMMARY_CARD_SHELL_MONTH = `${SUMMARY_CARD_BASE} min-h-0 sm:min-h-[172px]`;
/** Label corto encima del valor. */
export const SUMMARY_CARD_LABEL = "text-[10px] font-semibold uppercase tracking-wider text-cyan-100/50 sm:text-[11px]";
/** Número principal (combinar con una clase de color). */
export const SUMMARY_CARD_VALUE = "mt-1 text-xl font-bold tabular-nums leading-tight tracking-tight sm:mt-1.5 sm:text-2xl md:text-[1.6rem]";
export const SUMMARY_VALUE_NEUTRAL = `${SUMMARY_CARD_VALUE} text-slate-100`;
export const SUMMARY_VALUE_REVENUE = `${SUMMARY_CARD_VALUE} text-emerald-300`;
export const SUMMARY_VALUE_PROFIT_POS = `${SUMMARY_CARD_VALUE} text-emerald-300`;
export const SUMMARY_VALUE_PROFIT_CYAN = `${SUMMARY_CARD_VALUE} text-cyan-300`;
export const SUMMARY_VALUE_NEGATIVE = `${SUMMARY_CARD_VALUE} text-rose-300`;
/** Rejilla habitual: 2 col en móvil, 4 en escritorio ancho. */
export const SUMMARY_CARD_GRID = "grid grid-cols-2 gap-2 sm:gap-2.5 xl:grid-cols-4";
/** Variante 3 columnas (detalle montaje / venta): 2 col móvil, 3 desde md. */
export const SUMMARY_CARD_GRID_THREE = "grid grid-cols-2 gap-2 sm:gap-2.5 md:grid-cols-3";
