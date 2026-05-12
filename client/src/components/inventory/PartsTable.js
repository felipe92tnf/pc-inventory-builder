import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { PART_CATEGORIES, isNonStockCategory } from "../../types/part";
import { getInventoryCategoryStyle } from "./inventoryCategoryStyles";
import { SECONDARY_GHOST_SM, DESTRUCTIVE_BUTTON_SM } from "../../theme/actionButtons";
/** Unidades en categoría para la cabecera del acordeón: mapa global o suma del stock visible. */
function categoryUnitsDisplay(category, items, categoryStockTotals) {
    const mapped = categoryStockTotals?.get(category);
    if (mapped !== undefined)
        return String(mapped);
    const sum = items.reduce((acc, p) => {
        if (p.category && isNonStockCategory(p.category))
            return acc;
        const q = p.stock;
        return acc + (typeof q === "number" && Number.isFinite(q) ? q : 0);
    }, 0);
    return String(sum);
}
function formatMoney(value) {
    return `${Number(value).toFixed(2)} EUR`;
}
function formatCostPrice(value) {
    const n = Number(value);
    if (n === 0)
        return "";
    return formatMoney(value);
}
function conditionBadgeClass(condition) {
    if (condition === "NEW")
        return "bg-emerald-500/15 text-emerald-300 border-emerald-500/40";
    if (condition === "USED")
        return "bg-amber-500/15 text-amber-300 border-amber-500/40";
    return "bg-indigo-500/15 text-indigo-300 border-indigo-500/40";
}
function PartConditionBadge({ part }) {
    if (part.category && isNonStockCategory(part.category)) {
        return _jsx("span", { className: "text-slate-500", children: "\u2014" });
    }
    return (_jsx("span", { className: `inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${conditionBadgeClass(part.condition)}`, children: part.condition }));
}
function StockBadges({ part }) {
    if (part.category && isNonStockCategory(part.category)) {
        return _jsx("span", { className: "text-slate-500", children: "No aplica" });
    }
    if (part.stock === 0)
        return null;
    return _jsx("span", { className: "font-medium text-slate-100", children: part.stock });
}
function ChevronCategory({ open, className = "text-slate-400" }) {
    return (_jsx("svg", { className: `h-5 w-5 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""} ${className}`, fill: "none", viewBox: "0 0 24 24", strokeWidth: 2, stroke: "currentColor", "aria-hidden": true, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M19 9l-7 7-7-7" }) }));
}
function CategoryAccordionTrigger({ categoryKey, pieceSummary, summaryAriaLabel, expanded, panelId, onToggle, compact = false, categoryLowStock = false }) {
    const style = getInventoryCategoryStyle(categoryKey);
    const Icon = style.Icon;
    return (_jsxs("button", { type: "button", className: `flex w-full items-center gap-3 text-left transition-colors duration-200 ${compact ? "px-3 py-2.5" : "px-4 py-3.5"} ${style.headerBg} ${style.headerHover}`, onClick: onToggle, "aria-expanded": expanded, "aria-controls": panelId, "aria-label": summaryAriaLabel, children: [_jsx("span", { className: `flex shrink-0 items-center justify-center rounded-xl border ${compact ? "h-9 w-9" : "h-10 w-10"} ${style.chipBorder} ${style.chipBg}`, "aria-hidden": true, children: _jsx(Icon, { className: `${compact ? "h-4 w-4" : "h-[1.125rem] w-[1.125rem]"} ${style.accentIcon}`, strokeWidth: 2 }) }), _jsx("span", { className: `inline-flex max-w-[min(100%,14rem)] shrink-0 truncate rounded-full border px-2.5 py-1 text-xs font-semibold ${style.chipBg} ${style.chipBorder} ${style.chipText}`, children: style.label }), _jsx("span", { className: `min-w-0 flex-1 text-sm tabular-nums ${style.accentText}`, children: pieceSummary }), categoryLowStock ? (_jsx("span", { className: "shrink-0 rounded-full border border-amber-500/50 bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-300", children: "Stock bajo" })) : null, _jsx(ChevronCategory, { open: expanded, className: style.accentIcon })] }));
}
function PartCard({ part, deletingId, onEdit, onDelete, showCategoryBadge = true, compact = false }) {
    const catStyle = getInventoryCategoryStyle((part.category ?? "OTHER"));
    return (_jsx("article", { className: `rounded-2xl border border-slate-800 bg-slate-950/50 shadow-md shadow-black/20 ${compact ? "p-3" : "p-4"}`, children: _jsxs("div", { className: "flex flex-col gap-3", children: [_jsxs("div", { className: "flex flex-wrap items-start justify-between gap-2", children: [_jsx("h3", { className: "min-w-0 flex-1 text-base font-semibold leading-snug text-slate-100", children: part.name }), _jsxs("div", { className: "flex shrink-0 gap-2", children: [_jsx("button", { type: "button", onClick: () => onEdit(part), className: SECONDARY_GHOST_SM, children: "Editar" }), _jsx("button", { type: "button", onClick: () => onDelete(part), disabled: deletingId === part.id, className: DESTRUCTIVE_BUTTON_SM, children: deletingId === part.id ? "Eliminando..." : "Eliminar" })] })] }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [showCategoryBadge ? (_jsx("span", { className: `inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${catStyle.chipBg} ${catStyle.chipBorder} ${catStyle.chipText}`, children: catStyle.label })) : null, _jsx(PartConditionBadge, { part: part })] }), _jsxs("dl", { className: `grid grid-cols-1 border-t border-slate-800/80 text-sm sm:grid-cols-2 ${compact ? "gap-2 pt-2" : "gap-3 pt-3"}`, children: [_jsxs("div", { className: "flex justify-between gap-3 sm:flex-col sm:justify-start", children: [_jsx("dt", { className: "text-xs uppercase tracking-wide text-slate-500", children: "Precio coste" }), _jsx("dd", { className: "font-medium text-slate-200", children: formatCostPrice(part.costPrice) })] }), _jsxs("div", { className: "flex justify-between gap-3 sm:flex-col sm:justify-start", children: [_jsx("dt", { className: "text-xs uppercase tracking-wide text-slate-500", children: "Precio venta" }), _jsx("dd", { className: "font-medium text-emerald-300/95", children: formatMoney(part.salePrice) })] }), part.stock !== 0 || (part.category != null && isNonStockCategory(part.category)) ? (_jsxs("div", { className: "flex flex-col gap-1.5 sm:col-span-2", children: [_jsx("dt", { className: "text-xs uppercase tracking-wide text-slate-500", children: "Stock" }), _jsx("dd", { children: _jsx(StockBadges, { part: part }) })] })) : null] })] }) }));
}
function groupPartsByCategory(parts) {
    const map = new Map();
    for (const p of parts) {
        const key = p.category ?? "OTHER";
        const list = map.get(key) ?? [];
        list.push(p);
        map.set(key, list);
    }
    return Array.from(map.entries()).map(([category, items]) => ({ category, items }));
}
function groupPartsByCategoryOrdered(parts) {
    const result = [];
    for (const cat of PART_CATEGORIES) {
        const items = parts.filter((p) => p.category != null && p.category === cat);
        if (items.length) {
            result.push({ category: cat, items });
        }
    }
    return result;
}
function MobilePartsByCategory({ parts, deletingId, onEdit, onDelete, compact = false, categoryStockTotals, categoryStockThreshold = 3 }) {
    const groups = useMemo(() => groupPartsByCategory(parts), [parts]);
    /** Solo true = abierto (por defecto cerrado en movil) */
    const [openMap, setOpenMap] = useState({});
    const isOpen = (category) => openMap[category] === true;
    const toggle = (category) => {
        setOpenMap((prev) => ({
            ...prev,
            [category]: !(prev[category] === true)
        }));
    };
    return (_jsx("section", { className: `md:hidden ${compact ? "space-y-2" : "space-y-3"}`, children: groups.map(({ category, items }) => {
            const expanded = isOpen(category);
            const panelId = `inv-cat-${category}`;
            const catStyle = getInventoryCategoryStyle(category);
            const unitTotal = categoryStockTotals?.get(category);
            const pieceSummary = categoryUnitsDisplay(category, items, categoryStockTotals);
            const categoryLowStock = unitTotal !== undefined && unitTotal < categoryStockThreshold;
            return (_jsxs("div", { className: `overflow-hidden rounded-2xl border shadow-lg shadow-black/25 transition-colors duration-200 ${catStyle.panelBg} ${catStyle.panelBorder} ${catStyle.panelHover}`, children: [_jsx(CategoryAccordionTrigger, { categoryKey: category, pieceSummary: pieceSummary, summaryAriaLabel: `${catStyle.label}: ${pieceSummary} unidades en categoría`, expanded: expanded, panelId: panelId, onToggle: () => toggle(category), compact: compact, categoryLowStock: categoryLowStock }), _jsx("div", { id: panelId, className: expanded
                            ? `border-t border-slate-800 px-3 pt-1 ${compact ? "pb-2" : "pb-3"}`
                            : "hidden", children: _jsx("div", { className: `pt-2 ${compact ? "space-y-2" : "space-y-3"}`, children: items.map((part) => (_jsx(PartCard, { part: part, deletingId: deletingId, onEdit: onEdit, onDelete: onDelete, showCategoryBadge: false, compact: compact }, part.id))) }) })] }, category));
        }) }));
}
function DesktopPartsByCategory({ parts, deletingId, onEdit, onDelete, compact = false, categoryStockTotals, categoryStockThreshold = 3 }) {
    const groups = useMemo(() => groupPartsByCategoryOrdered(parts), [parts]);
    /** Solo true = abierto (por defecto plegado, igual que en movil) */
    const [openMap, setOpenMap] = useState({});
    const isOpen = (category) => openMap[category] === true;
    const toggle = (category) => {
        setOpenMap((prev) => ({
            ...prev,
            [category]: !(prev[category] === true)
        }));
    };
    const cell = compact ? "px-3 py-2" : "px-4 py-3";
    return (_jsx("section", { className: `hidden md:block ${compact ? "space-y-2" : "space-y-3"}`, children: groups.map(({ category, items }) => {
            const expanded = isOpen(category);
            const panelId = `inv-desktop-cat-${category}`;
            const catStyle = getInventoryCategoryStyle(category);
            const unitTotal = categoryStockTotals?.get(category);
            const pieceSummary = categoryUnitsDisplay(category, items, categoryStockTotals);
            const categoryLowStock = unitTotal !== undefined && unitTotal < categoryStockThreshold;
            return (_jsxs("div", { className: `overflow-hidden rounded-2xl border shadow-lg shadow-black/25 transition-colors duration-200 ${catStyle.panelBg} ${catStyle.panelBorder} ${catStyle.panelHover}`, children: [_jsx(CategoryAccordionTrigger, { categoryKey: category, pieceSummary: pieceSummary, summaryAriaLabel: `${catStyle.label}: ${pieceSummary} unidades en categoría`, expanded: expanded, panelId: panelId, onToggle: () => toggle(category), compact: compact, categoryLowStock: categoryLowStock }), _jsx("div", { id: panelId, className: expanded ? "border-t border-slate-800" : "hidden", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: `min-w-full text-left text-slate-200 ${compact ? "text-xs" : "text-sm"}`, children: [_jsx("thead", { className: "bg-slate-950/70 text-xs uppercase tracking-wide text-slate-400", children: _jsxs("tr", { children: [_jsx("th", { className: cell, children: "Nombre" }), _jsx("th", { className: cell, children: "Estado" }), _jsx("th", { className: cell, children: "Precio coste" }), _jsx("th", { className: cell, children: "Precio venta" }), _jsx("th", { className: cell, children: "Stock" }), _jsx("th", { className: `${cell} text-right`, children: "Acciones" })] }) }), _jsx("tbody", { className: "divide-y divide-slate-800", children: items.map((part) => (_jsxs("tr", { className: "transition hover:bg-slate-800/50", children: [_jsx("td", { className: `${cell} font-medium text-slate-100`, children: part.name }), _jsx("td", { className: cell, children: _jsx(PartConditionBadge, { part: part }) }), _jsx("td", { className: `${cell} text-slate-300`, children: formatCostPrice(part.costPrice) }), _jsx("td", { className: `${cell} text-slate-300`, children: formatMoney(part.salePrice) }), _jsx("td", { className: cell, children: _jsx(StockBadges, { part: part }) }), _jsx("td", { className: cell, children: _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx("button", { type: "button", onClick: () => onEdit(part), className: SECONDARY_GHOST_SM, children: "Editar" }), _jsx("button", { type: "button", onClick: () => onDelete(part), disabled: deletingId === part.id, className: DESTRUCTIVE_BUTTON_SM, children: deletingId === part.id ? "Eliminando..." : "Eliminar" })] }) })] }, part.id))) })] }) }) })] }, category));
        }) }));
}
export function PartsTable({ parts, partsMobilePage, compact = false, loading, deletingId, categoryStockTotals, categoryStockThreshold = 3, onEdit, onDelete, emptyMessage }) {
    if (loading) {
        return (_jsx("section", { className: "rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg shadow-slate-950/40", children: _jsx("p", { className: "text-sm text-slate-300", children: "Cargando piezas..." }) }));
    }
    const mobileParts = partsMobilePage ?? parts;
    if (parts.length === 0) {
        return (_jsx("section", { className: "rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg shadow-slate-950/40", children: _jsx("p", { className: "text-sm text-slate-300", children: emptyMessage ?? "No hay piezas en inventario todavia." }) }));
    }
    return (_jsxs(_Fragment, { children: [_jsx(DesktopPartsByCategory, { parts: parts, deletingId: deletingId, onEdit: onEdit, onDelete: onDelete, compact: compact, categoryStockTotals: categoryStockTotals, categoryStockThreshold: categoryStockThreshold }), _jsx(MobilePartsByCategory, { parts: mobileParts, deletingId: deletingId, onEdit: onEdit, onDelete: onDelete, compact: compact, categoryStockTotals: categoryStockTotals, categoryStockThreshold: categoryStockThreshold })] }));
}
