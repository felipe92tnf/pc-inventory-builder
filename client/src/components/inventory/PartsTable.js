import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { PART_CATEGORIES } from "../../types/part";
function formatMoney(value) {
    return `${Number(value).toFixed(2)} EUR`;
}
function formatCostPrice(value) {
    const n = Number(value);
    if (n === 0)
        return "";
    return formatMoney(value);
}
function categoryBadgeClass(category) {
    const map = {
        CPU: "bg-sky-500/15 text-sky-300 border-sky-500/40",
        GPU: "bg-violet-500/15 text-violet-300 border-violet-500/40",
        RAM: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
        STORAGE: "bg-cyan-500/15 text-cyan-300 border-cyan-500/40"
    };
    return map[category] ?? "bg-slate-500/15 text-slate-300 border-slate-500/40";
}
function conditionBadgeClass(condition) {
    if (condition === "NEW")
        return "bg-emerald-500/15 text-emerald-300 border-emerald-500/40";
    if (condition === "USED")
        return "bg-amber-500/15 text-amber-300 border-amber-500/40";
    return "bg-indigo-500/15 text-indigo-300 border-indigo-500/40";
}
function StockBadges({ part }) {
    if (part.stock === 0)
        return null;
    return (_jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsx("span", { className: "font-medium text-slate-100", children: part.stock }), part.stock <= 2 ? (_jsx("span", { className: "rounded-full border border-amber-500/50 bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-300", children: "Stock bajo" })) : null] }));
}
function ChevronCategory({ open }) {
    return (_jsx("svg", { className: `h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`, fill: "none", viewBox: "0 0 24 24", strokeWidth: 2, stroke: "currentColor", "aria-hidden": true, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M19 9l-7 7-7-7" }) }));
}
function PartCard({ part, deletingId, onEdit, onDelete, showCategoryBadge = true }) {
    return (_jsx("article", { className: "rounded-2xl border border-slate-800 bg-slate-950/50 p-4 shadow-md shadow-black/20", children: _jsxs("div", { className: "flex flex-col gap-3", children: [_jsxs("div", { className: "flex flex-wrap items-start justify-between gap-2", children: [_jsx("h3", { className: "min-w-0 flex-1 text-base font-semibold leading-snug text-slate-100", children: part.name }), _jsxs("div", { className: "flex shrink-0 gap-2", children: [_jsx("button", { type: "button", onClick: () => onEdit(part), className: "rounded-lg border border-indigo-500/40 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-200 transition hover:bg-indigo-500/20", children: "Editar" }), _jsx("button", { type: "button", onClick: () => onDelete(part), disabled: deletingId === part.id, className: "rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60", children: deletingId === part.id ? "Eliminando..." : "Eliminar" })] })] }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [showCategoryBadge ? (_jsx("span", { className: `inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${categoryBadgeClass(part.category)}`, children: part.category })) : null, _jsx("span", { className: `inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${conditionBadgeClass(part.condition)}`, children: part.condition })] }), _jsxs("dl", { className: "grid grid-cols-1 gap-3 border-t border-slate-800/80 pt-3 text-sm sm:grid-cols-2", children: [_jsxs("div", { className: "flex justify-between gap-3 sm:flex-col sm:justify-start", children: [_jsx("dt", { className: "text-xs uppercase tracking-wide text-slate-500", children: "Precio coste" }), _jsx("dd", { className: "font-medium text-slate-200", children: formatCostPrice(part.costPrice) })] }), _jsxs("div", { className: "flex justify-between gap-3 sm:flex-col sm:justify-start", children: [_jsx("dt", { className: "text-xs uppercase tracking-wide text-slate-500", children: "Precio venta" }), _jsx("dd", { className: "font-medium text-emerald-300/95", children: formatMoney(part.salePrice) })] }), part.stock !== 0 ? (_jsxs("div", { className: "flex flex-col gap-1.5 sm:col-span-2", children: [_jsx("dt", { className: "text-xs uppercase tracking-wide text-slate-500", children: "Stock" }), _jsx("dd", { children: _jsx(StockBadges, { part: part }) })] })) : null] })] }) }));
}
function groupPartsByCategory(parts) {
    const map = new Map();
    for (const p of parts) {
        const list = map.get(p.category) ?? [];
        list.push(p);
        map.set(p.category, list);
    }
    return Array.from(map.entries()).map(([category, items]) => ({ category, items }));
}
function groupPartsByCategoryOrdered(parts) {
    const result = [];
    for (const cat of PART_CATEGORIES) {
        const items = parts.filter((p) => p.category === cat);
        if (items.length) {
            result.push({ category: cat, items });
        }
    }
    return result;
}
function MobilePartsByCategory({ parts, deletingId, onEdit, onDelete }) {
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
    return (_jsx("section", { className: "space-y-3 md:hidden", children: groups.map(({ category, items }) => {
            const expanded = isOpen(category);
            const panelId = `inv-cat-${category}`;
            return (_jsxs("div", { className: "overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/85 shadow-lg shadow-black/20", children: [_jsxs("button", { type: "button", className: "flex w-full items-center gap-3 px-4 py-3.5 text-left text-slate-100", onClick: () => toggle(category), "aria-expanded": expanded, "aria-controls": panelId, children: [_jsx("span", { className: `inline-flex shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${categoryBadgeClass(category)}`, children: category }), _jsxs("span", { className: "min-w-0 flex-1 text-sm text-slate-400", children: [items.length, " pieza", items.length === 1 ? "" : "s", " en esta pagina"] }), _jsx(ChevronCategory, { open: expanded })] }), _jsx("div", { id: panelId, className: expanded ? "border-t border-slate-800 px-3 pb-3 pt-1" : "hidden", children: _jsx("div", { className: "space-y-3 pt-2", children: items.map((part) => (_jsx(PartCard, { part: part, deletingId: deletingId, onEdit: onEdit, onDelete: onDelete, showCategoryBadge: false }, part.id))) }) })] }, category));
        }) }));
}
function DesktopPartsByCategory({ parts, deletingId, onEdit, onDelete }) {
    const groups = useMemo(() => groupPartsByCategoryOrdered(parts), [parts]);
    /** Sin entrada = abierto por defecto en escritorio */
    const [openMap, setOpenMap] = useState({});
    const isOpen = (category) => openMap[category] !== false;
    const toggle = (category) => {
        setOpenMap((prev) => {
            const currentlyOpen = prev[category] !== false;
            return { ...prev, [category]: !currentlyOpen };
        });
    };
    return (_jsx("section", { className: "hidden space-y-3 md:block", children: groups.map(({ category, items }) => {
            const expanded = isOpen(category);
            const panelId = `inv-desktop-cat-${category}`;
            return (_jsxs("div", { className: "overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/85 shadow-lg shadow-black/20", children: [_jsxs("button", { type: "button", className: "flex w-full items-center gap-3 px-4 py-3.5 text-left text-slate-100", onClick: () => toggle(category), "aria-expanded": expanded, "aria-controls": panelId, children: [_jsx("span", { className: `inline-flex shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${categoryBadgeClass(category)}`, children: category }), _jsxs("span", { className: "min-w-0 flex-1 text-sm text-slate-400", children: [items.length, " pieza", items.length === 1 ? "" : "s"] }), _jsx(ChevronCategory, { open: expanded })] }), _jsx("div", { id: panelId, className: expanded ? "border-t border-slate-800" : "hidden", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full text-left text-sm text-slate-200", children: [_jsx("thead", { className: "bg-slate-950/70 text-xs uppercase tracking-wide text-slate-400", children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-3", children: "Nombre" }), _jsx("th", { className: "px-4 py-3", children: "Estado" }), _jsx("th", { className: "px-4 py-3", children: "Precio coste" }), _jsx("th", { className: "px-4 py-3", children: "Precio venta" }), _jsx("th", { className: "px-4 py-3", children: "Stock" }), _jsx("th", { className: "px-4 py-3 text-right", children: "Acciones" })] }) }), _jsx("tbody", { className: "divide-y divide-slate-800", children: items.map((part) => (_jsxs("tr", { className: "transition hover:bg-slate-800/50", children: [_jsx("td", { className: "px-4 py-3 font-medium text-slate-100", children: part.name }), _jsx("td", { className: "px-4 py-3", children: _jsx("span", { className: `inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${conditionBadgeClass(part.condition)}`, children: part.condition }) }), _jsx("td", { className: "px-4 py-3 text-slate-300", children: formatCostPrice(part.costPrice) }), _jsx("td", { className: "px-4 py-3 text-slate-300", children: formatMoney(part.salePrice) }), _jsx("td", { className: "px-4 py-3", children: _jsx(StockBadges, { part: part }) }), _jsx("td", { className: "px-4 py-3", children: _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx("button", { type: "button", onClick: () => onEdit(part), className: "rounded-lg border border-indigo-500/40 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-200 transition hover:bg-indigo-500/20", children: "Editar" }), _jsx("button", { type: "button", onClick: () => onDelete(part), disabled: deletingId === part.id, className: "rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60", children: deletingId === part.id ? "Eliminando..." : "Eliminar" })] }) })] }, part.id))) })] }) }) })] }, category));
        }) }));
}
export function PartsTable({ parts, partsMobilePage, loading, deletingId, onEdit, onDelete, emptyMessage }) {
    if (loading) {
        return (_jsx("section", { className: "rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg shadow-slate-950/40", children: _jsx("p", { className: "text-sm text-slate-300", children: "Cargando piezas..." }) }));
    }
    const mobileParts = partsMobilePage ?? parts;
    if (parts.length === 0) {
        return (_jsx("section", { className: "rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg shadow-slate-950/40", children: _jsx("p", { className: "text-sm text-slate-300", children: emptyMessage ?? "No hay piezas en inventario todavia." }) }));
    }
    return (_jsxs(_Fragment, { children: [_jsx(DesktopPartsByCategory, { parts: parts, deletingId: deletingId, onEdit: onEdit, onDelete: onDelete }), _jsx(MobilePartsByCategory, { parts: mobileParts, deletingId: deletingId, onEdit: onEdit, onDelete: onDelete })] }));
}
