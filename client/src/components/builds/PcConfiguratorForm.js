import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
const CONFIGURATOR_SLOTS = [
    { id: "CPU", label: "CPU", categories: ["CPU"] },
    { id: "MOTHERBOARD", label: "Motherboard", categories: ["MOTHERBOARD"] },
    { id: "GPU", label: "GPU", categories: ["GPU"] },
    { id: "RAM", label: "RAM", categories: ["RAM"] },
    { id: "STORAGE", label: "Storage", categories: ["STORAGE"] },
    { id: "PSU", label: "PSU", categories: ["PSU"] },
    { id: "CASE", label: "Case", categories: ["CASE"] },
    { id: "COOLING", label: "Cooling", categories: ["COOLER"] },
    { id: "FANS", label: "Fans", categories: ["FAN"] },
    { id: "OTHER", label: "Other", categories: ["OTHER", "NETWORK"] }
];
function formatMoney(value) {
    return `${Number(value).toFixed(2)} EUR`;
}
function emptySelections() {
    return CONFIGURATOR_SLOTS.reduce((acc, slot) => {
        acc[slot.id] = "";
        return acc;
    }, {});
}
function emptyQuantities() {
    return CONFIGURATOR_SLOTS.reduce((acc, slot) => {
        acc[slot.id] = 1;
        return acc;
    }, {});
}
export function PcConfiguratorForm({ parts, disabled, onAddSelected }) {
    const [selections, setSelections] = useState(emptySelections);
    const [quantities, setQuantities] = useState(emptyQuantities);
    const [submitting, setSubmitting] = useState(false);
    const partsBySlot = useMemo(() => {
        const map = new Map();
        for (const slot of CONFIGURATOR_SLOTS) {
            const list = parts.filter((part) => part.stock > 0 && slot.categories.includes(part.category));
            map.set(slot.id, list.sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" })));
        }
        return map;
    }, [parts]);
    const selectedPartBySlot = useMemo(() => {
        const map = new Map();
        for (const slot of CONFIGURATOR_SLOTS) {
            const id = selections[slot.id];
            if (!id) {
                map.set(slot.id, null);
                continue;
            }
            const found = parts.find((p) => p.id === id) ?? null;
            map.set(slot.id, found);
        }
        return map;
    }, [parts, selections]);
    const handleSelectChange = (slotId, partId) => {
        setSelections((prev) => ({ ...prev, [slotId]: partId }));
        if (!partId) {
            setQuantities((prev) => ({ ...prev, [slotId]: 1 }));
            return;
        }
        const part = parts.find((p) => p.id === partId);
        const maxStock = part?.stock ?? 1;
        setQuantities((prev) => ({
            ...prev,
            [slotId]: Math.min(Math.max(1, prev[slotId]), maxStock)
        }));
    };
    const handleQuantityChange = (slotId, raw) => {
        const selected = selectedPartBySlot.get(slotId);
        const max = selected?.stock ?? 1;
        const next = Number.isFinite(raw) ? Math.floor(raw) : 1;
        const clamped = Math.min(Math.max(1, next), max);
        setQuantities((prev) => ({ ...prev, [slotId]: clamped }));
    };
    const handleAddSelected = async () => {
        const perSlot = [];
        for (const slot of CONFIGURATOR_SLOTS) {
            const partId = selections[slot.id];
            if (!partId)
                continue;
            const qty = quantities[slot.id];
            if (qty < 1)
                continue;
            perSlot.push({ partId, quantity: qty });
        }
        const merged = new Map();
        for (const { partId, quantity } of perSlot) {
            merged.set(partId, (merged.get(partId) ?? 0) + quantity);
        }
        const items = Array.from(merged.entries()).map(([partId, quantity]) => ({ partId, quantity }));
        if (items.length === 0) {
            return;
        }
        setSubmitting(true);
        try {
            await onAddSelected(items);
            setSelections(emptySelections());
            setQuantities(emptyQuantities());
        }
        finally {
            setSubmitting(false);
        }
    };
    const hasAnySelection = CONFIGURATOR_SLOTS.some((slot) => selections[slot.id] !== "");
    const busy = disabled || submitting;
    return (_jsxs("section", { className: "rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg shadow-slate-950/40", children: [_jsx("h2", { className: "mb-1 text-lg font-semibold text-slate-100", children: "Configurar montaje" }), _jsx("p", { className: "mb-4 text-sm text-slate-400", children: "Elige pieza y cantidad por ranura (opcional). La cantidad es un desplegable del 1 hasta el stock disponible. Pulsa el boton para anadirlas al montaje." }), _jsx("div", { className: "space-y-4", children: CONFIGURATOR_SLOTS.map((slot) => {
                    const options = partsBySlot.get(slot.id) ?? [];
                    const selected = selectedPartBySlot.get(slot.id) ?? null;
                    const selectValue = selections[slot.id];
                    const qtyValue = quantities[slot.id];
                    const maxQty = selected ? selected.stock : 1;
                    return (_jsxs("div", { className: "flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-4 lg:flex-row lg:items-end lg:gap-4", children: [_jsxs("label", { className: "min-w-0 flex-1 flex flex-col gap-1 text-sm font-medium text-slate-200", children: [slot.label, _jsxs("select", { value: selectValue, onChange: (event) => handleSelectChange(slot.id, event.target.value), disabled: busy || options.length === 0, className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring disabled:opacity-50", children: [_jsx("option", { value: "", children: options.length === 0 ? "Sin stock en esta categoria" : "Sin seleccionar" }), options.map((part) => (_jsx("option", { value: part.id, children: part.name }, part.id)))] })] }), _jsxs("label", { className: "flex w-full flex-col gap-1 text-sm font-medium text-slate-200 lg:w-36", children: ["Cantidad", _jsx("select", { value: selected && maxQty >= 1 ? String(Math.min(Math.max(1, qtyValue), maxQty)) : "", onChange: (event) => handleQuantityChange(slot.id, Number(event.target.value)), disabled: busy || !selected || maxQty < 1, className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring disabled:opacity-50", children: !selected || maxQty < 1 ? (_jsx("option", { value: "", children: "\u2014" })) : (Array.from({ length: maxQty }, (_, index) => index + 1).map((n) => (_jsx("option", { value: n, children: n }, n)))) })] }), _jsxs("div", { className: "flex flex-wrap gap-4 text-sm lg:shrink-0", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs uppercase tracking-wide text-slate-500", children: "Stock" }), _jsx("p", { className: "font-medium text-slate-200", children: selected ? selected.stock : "—" })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs uppercase tracking-wide text-slate-500", children: "Coste" }), _jsx("p", { className: "font-medium text-slate-200", children: selected ? formatMoney(selected.costPrice) : "—" })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs uppercase tracking-wide text-slate-500", children: "Venta" }), _jsx("p", { className: "font-medium text-slate-200", children: selected ? formatMoney(selected.salePrice) : "—" })] })] })] }, slot.id));
                }) }), _jsx("div", { className: "mt-6 flex flex-wrap items-center gap-3", children: _jsx("button", { type: "button", onClick: () => {
                        void handleAddSelected();
                    }, disabled: busy || !hasAnySelection, className: "rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50", children: submitting ? "Anadiendo..." : "Anadir piezas seleccionadas" }) })] }));
}
