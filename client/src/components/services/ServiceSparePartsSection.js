import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from "react";
import { isPartPiece, PART_CATEGORIES, partCategoryLabel } from "../../types/part";
import { DESTRUCTIVE_BUTTON_SM, SECONDARY_BUTTON_SM } from "../../theme/actionButtons";
const INPUT = "min-h-[42px] w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring";
const FIELD_LABEL = "text-sm font-medium text-slate-200";
export function ServiceSparePartsSection({ spareLines, onLinesChange, parts, spareSalePrice, onSpareSalePriceChange, locked }) {
    const partsForSpare = useMemo(() => parts.filter((p) => isPartPiece(p) && p.stock > 0), [parts]);
    const sparePartsByCategory = useMemo(() => {
        const byCat = new Map();
        for (const p of partsForSpare) {
            const cat = (p.category ?? "OTHER");
            const list = byCat.get(cat);
            if (list)
                list.push(p);
            else
                byCat.set(cat, [p]);
        }
        for (const list of byCat.values()) {
            list.sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" }));
        }
        return PART_CATEGORIES.filter((c) => byCat.has(c)).map((category) => ({
            category,
            label: partCategoryLabel(category),
            parts: byCat.get(category)
        }));
    }, [partsForSpare]);
    const inventoryCost = useMemo(() => {
        let cost = 0;
        let any = false;
        for (const line of spareLines) {
            if (!line.partId || line.quantity < 1)
                continue;
            const p = parts.find((x) => x.id === line.partId);
            if (!p)
                continue;
            any = true;
            cost += Number(p.costPrice) * line.quantity;
        }
        return any ? cost : null;
    }, [spareLines, parts]);
    const update = (idx, patch) => {
        onLinesChange(spareLines.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
    };
    return (_jsxs("section", { className: "rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-md shadow-slate-950/30 md:p-5", children: [_jsx("h2", { className: "mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500", children: "Piezas del inventario" }), locked ? (_jsx("p", { className: "mb-3 text-xs text-slate-500", children: "Las piezas no se modifican en servicios completados; los conceptos y datos s\u00ED." })) : null, !locked ? (_jsx(SpareAddButton, { onAdd: () => onLinesChange([...spareLines, { partId: "", quantity: 1 }]) })) : null, _jsx("div", { className: "space-y-3", children: spareLines.map((line, idx) => (_jsxs("div", { className: "flex flex-col gap-3 rounded-lg border border-slate-800 bg-slate-950/50 p-3 sm:flex-row sm:flex-wrap sm:items-end", children: [_jsxs("label", { className: `flex min-w-0 flex-1 flex-col gap-1 ${FIELD_LABEL}`, children: ["Pieza", _jsxs("select", { value: line.partId, onChange: (e) => update(idx, { partId: e.target.value }), disabled: locked, className: INPUT, children: [_jsx("option", { value: "", children: "Seleccionar\u2026" }), sparePartsByCategory.map(({ category, label, parts: groupParts }) => (_jsx("optgroup", { label: label, children: groupParts.map((p) => (_jsxs("option", { value: p.id, children: [p.name, " \u2014 stock ", p.stock] }, p.id))) }, category)))] })] }), _jsxs("label", { className: `flex w-full flex-col gap-1 sm:w-24 ${FIELD_LABEL}`, children: ["Cant.", _jsx("input", { type: "number", min: 1, value: line.quantity, onChange: (e) => update(idx, { quantity: Number(e.target.value) }), disabled: locked, className: INPUT })] }), spareLines.length > 1 && !locked ? (_jsx("button", { type: "button", onClick: () => onLinesChange(spareLines.length <= 1 ? spareLines : spareLines.filter((_, i) => i !== idx)), className: DESTRUCTIVE_BUTTON_SM, children: "Quitar" })) : null] }, idx))) }), inventoryCost !== null ? (_jsxs("p", { className: "mt-2 text-xs text-slate-500", children: ["Coste piezas (inventario):", " ", _jsxs("span", { className: "font-medium text-slate-300", children: [inventoryCost.toFixed(2), " EUR"] })] })) : null, _jsxs("label", { className: `mt-3 flex flex-col gap-1.5 ${FIELD_LABEL}`, children: ["Precio venta de las piezas (sin conceptos del cat\u00E1logo)", _jsx("input", { type: "number", min: 0, step: "0.01", value: spareSalePrice === "" ? "" : spareSalePrice, onChange: (e) => onSpareSalePriceChange(e.target.value === "" ? "" : Number(e.target.value)), disabled: locked, className: INPUT })] })] }));
}
function SpareAddButton({ onAdd }) {
    return (_jsx("div", { className: "mb-3 flex justify-end", children: _jsx("button", { type: "button", onClick: onAdd, className: SECONDARY_BUTTON_SM, children: "A\u00F1adir pieza" }) }));
}
