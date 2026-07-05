import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { HOME_DELIVERY_LABEL, ensureHomeDeliveryLine, isHomeDeliveryLine, lineTotal, newConceptLine } from "../../utils/serviceConceptLines";
import { ServiceDetailAccordion } from "./ServiceDetailAccordion";
import { DESTRUCTIVE_BUTTON_SM, PRIMARY_ACTION_BUTTON_COMPACT } from "../../theme/actionButtons";
import { TABLE_CELL } from "../../theme/layoutDensity";
const INPUT = "min-h-[36px] w-full rounded-lg border border-slate-700 bg-slate-950/70 px-2.5 py-1.5 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring";
function sortCatalogBySaleDesc(presets) {
    return [...presets].sort((a, b) => {
        const priceDiff = Number(b.defaultSalePrice) - Number(a.defaultSalePrice);
        if (priceDiff !== 0)
            return priceDiff;
        return a.name.localeCompare(b.name, "es", { sensitivity: "base" });
    });
}
function money(n) {
    return `${n.toFixed(2)} EUR`;
}
export function ServiceConceptLinesSection({ lines, onLinesChange, servicePresets, isHomeService, onHomeServiceChange, disabled = false, accordionMode = false, showCatalog = true, showManual = true, showHomeService = true, catalogDefaultOpen = true }) {
    const [presetPickId, setPresetPickId] = useState("");
    const [catalogQuery, setCatalogQuery] = useState("");
    const [manualOpen, setManualOpen] = useState(!accordionMode);
    const [manualName, setManualName] = useState("");
    const [manualQty, setManualQty] = useState(1);
    const [manualCost, setManualCost] = useState("");
    const [manualSale, setManualSale] = useState("");
    const filteredPresets = useMemo(() => {
        const q = catalogQuery.trim().toLowerCase();
        const matched = !q
            ? servicePresets
            : servicePresets.filter((p) => p.name.toLowerCase().includes(q));
        return sortCatalogBySaleDesc(matched);
    }, [servicePresets, catalogQuery]);
    const updateLine = (key, patch) => {
        onLinesChange(lines.map((l) => (l.clientKey === key ? { ...l, ...patch } : l)));
    };
    const removeLine = (key) => {
        const row = lines.find((l) => l.clientKey === key);
        if (row && isHomeDeliveryLine(row))
            onHomeServiceChange(false);
        const next = lines.filter((l) => l.clientKey !== key);
        onLinesChange(next.length === 0 ? [newConceptLine()] : next);
    };
    const addPreset = (preset) => {
        const sale = Number(preset.defaultSalePrice);
        const cost = Number(preset.defaultCostPrice);
        if (preset.name.trim().toLowerCase() === HOME_DELIVERY_LABEL.toLowerCase()) {
            onHomeServiceChange(true);
            onLinesChange(ensureHomeDeliveryLine(lines, true, sale));
            return;
        }
        onLinesChange([
            ...lines,
            newConceptLine({
                name: preset.name.trim(),
                quantity: 1,
                unitCost: Number.isFinite(cost) ? cost : 0,
                unitSalePrice: Number.isFinite(sale) ? sale : 0
            })
        ]);
    };
    const addManualLine = () => {
        const sale = Number(manualSale.replace(",", ".").trim());
        if (!manualName.trim()) {
            window.alert("Indica la descripción del concepto.");
            return;
        }
        if (!Number.isFinite(sale) || sale < 0) {
            window.alert("Indica un precio de venta válido.");
            return;
        }
        let cost = 0;
        if (manualCost.trim() !== "") {
            const c = Number(manualCost.replace(",", ".").trim());
            if (!Number.isFinite(c) || c < 0) {
                window.alert("Coste unitario inválido.");
                return;
            }
            cost = c;
        }
        onLinesChange([
            ...lines,
            newConceptLine({
                name: manualName.trim(),
                quantity: Math.max(1, Math.floor(manualQty)),
                unitCost: cost,
                unitSalePrice: sale
            })
        ]);
        setManualName("");
        setManualQty(1);
        setManualCost("");
        setManualSale("");
        setManualOpen(false);
    };
    const handleHomeToggle = (checked) => {
        onHomeServiceChange(checked);
        onLinesChange(ensureHomeDeliveryLine(lines, checked));
    };
    const catalogBlock = (_jsx(CatalogBlock, { presetPickId: presetPickId, setPresetPickId: setPresetPickId, catalogQuery: catalogQuery, setCatalogQuery: setCatalogQuery, filteredPresets: filteredPresets, servicePresets: servicePresets, disabled: disabled, plain: accordionMode, onAddPreset: (preset) => {
            addPreset(preset);
            setPresetPickId("");
        } }));
    const manualBlock = (_jsx(ManualConceptGrid, { manualName: manualName, setManualName: setManualName, manualQty: manualQty, setManualQty: setManualQty, manualCost: manualCost, setManualCost: setManualCost, manualSale: manualSale, setManualSale: setManualSale, disabled: disabled, onAdd: addManualLine }));
    const homeBlock = showHomeService ? (_jsxs("label", { className: "flex cursor-pointer items-center gap-2.5 rounded-lg border border-violet-500/25 bg-violet-950/15 px-3 py-2.5", children: [_jsx("input", { type: "checkbox", checked: isHomeService, onChange: (e) => handleHomeToggle(e.target.checked), disabled: disabled, className: "h-4 w-4 shrink-0 rounded border-slate-600 bg-slate-950 text-violet-500" }), _jsxs("span", { className: "text-sm text-slate-200", children: ["Servicio a domicilio ", _jsx("span", { className: "text-slate-500", children: "(+20 EUR en l\u00EDneas)" })] })] })) : null;
    return (_jsxs("div", { className: "space-y-3", children: [homeBlock, showCatalog && accordionMode ? (_jsx(ServiceDetailAccordion, { title: "Cat\u00E1logo de servicios", subtitle: "A\u00F1ade servicios predefinidos", defaultOpen: catalogDefaultOpen, children: catalogBlock })) : showCatalog ? (catalogBlock) : null, showManual && accordionMode ? (_jsx(ServiceDetailAccordion, { title: "Conceptos manuales", subtitle: "L\u00EDneas personalizadas", defaultOpen: false, children: manualBlock })) : showManual ? (_jsxs("div", { className: "rounded-xl border border-slate-800 bg-slate-950/40", children: [_jsxs("button", { type: "button", disabled: disabled, onClick: () => setManualOpen((v) => !v), className: "flex w-full items-center justify-between px-3 py-2.5 text-left text-sm font-semibold text-slate-200", children: ["+ A\u00F1adir concepto manual", _jsx("span", { className: "text-slate-500", children: manualOpen ? "▲" : "▼" })] }), manualOpen ? _jsx("div", { className: "border-t border-slate-800 px-3 pb-3 pt-2", children: manualBlock }) : null] })) : null, _jsxs("section", { className: "overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60", children: [_jsx("div", { className: "border-b border-slate-800/80 px-3 py-2", children: _jsx("h3", { className: "text-sm font-semibold text-slate-100", children: "L\u00EDneas del servicio" }) }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full text-left text-sm text-slate-200", children: [_jsx("thead", { className: "bg-slate-950/70 text-xs uppercase tracking-wide text-slate-400", children: _jsxs("tr", { children: [_jsx("th", { className: TABLE_CELL, children: "Concepto" }), _jsx("th", { className: TABLE_CELL, children: "Cant." }), _jsx("th", { className: TABLE_CELL, children: "Coste u." }), _jsx("th", { className: TABLE_CELL, children: "Venta u." }), _jsx("th", { className: `${TABLE_CELL} text-right`, children: "Total" }), _jsx("th", { className: `${TABLE_CELL} text-right`, children: "Acciones" })] }) }), _jsx("tbody", { className: "divide-y divide-slate-800", children: lines.map((line) => (_jsxs("tr", { className: isHomeDeliveryLine(line) ? "bg-violet-950/25" : "hover:bg-slate-800/40", children: [_jsx("td", { className: TABLE_CELL, children: _jsx("input", { value: line.name, disabled: disabled || isHomeDeliveryLine(line), onChange: (e) => updateLine(line.clientKey, { name: e.target.value }), className: `${INPUT} min-w-[10rem]`, placeholder: "Concepto" }) }), _jsx("td", { className: TABLE_CELL, children: _jsx("input", { type: "number", min: 1, value: line.quantity, disabled: disabled, onChange: (e) => updateLine(line.clientKey, {
                                                        quantity: Math.max(1, Number(e.target.value) || 1)
                                                    }), className: `${INPUT} w-20 tabular-nums` }) }), _jsx("td", { className: TABLE_CELL, children: _jsx("input", { type: "text", inputMode: "decimal", value: line.unitCost, disabled: disabled, onChange: (e) => {
                                                        const v = Number(e.target.value.replace(",", "."));
                                                        if (Number.isFinite(v) && v >= 0)
                                                            updateLine(line.clientKey, { unitCost: v });
                                                    }, className: `${INPUT} w-24 tabular-nums` }) }), _jsx("td", { className: TABLE_CELL, children: _jsx("input", { type: "text", inputMode: "decimal", value: line.unitSalePrice, disabled: disabled, onChange: (e) => {
                                                        const v = Number(e.target.value.replace(",", "."));
                                                        if (Number.isFinite(v) && v >= 0)
                                                            updateLine(line.clientKey, { unitSalePrice: v });
                                                    }, className: `${INPUT} w-24 tabular-nums` }) }), _jsx("td", { className: `${TABLE_CELL} text-right font-medium tabular-nums text-emerald-300/90`, children: money(lineTotal(line)) }), _jsx("td", { className: `${TABLE_CELL} text-right`, children: lines.length > 1 && !disabled ? (_jsx("button", { type: "button", onClick: () => removeLine(line.clientKey), className: DESTRUCTIVE_BUTTON_SM, children: "Quitar" })) : null })] }, line.clientKey))) })] }) })] })] }));
}
function CatalogBlock({ presetPickId, setPresetPickId, catalogQuery, setCatalogQuery, filteredPresets, servicePresets, disabled, plain, onAddPreset }) {
    return (_jsxs("div", { className: plain ? "space-y-2" : "rounded-xl border border-indigo-500/25 bg-indigo-950/20 p-3", children: [!plain ? (_jsx("p", { className: "text-xs font-semibold uppercase tracking-wide text-indigo-200/80", children: "Cat\u00E1logo de servicios" })) : null, _jsxs("div", { className: `flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end ${plain ? "" : "mt-2"}`, children: [_jsxs("label", { className: "flex min-w-[10rem] flex-1 flex-col gap-1 text-xs font-medium text-slate-400", children: ["Buscar", _jsx("input", { value: catalogQuery, onChange: (e) => setCatalogQuery(e.target.value), disabled: disabled, placeholder: "Filtrar\u2026", className: INPUT })] }), _jsxs("label", { className: "flex min-w-[12rem] flex-1 flex-col gap-1 text-xs font-medium text-slate-400", children: ["Servicio", _jsxs("select", { value: presetPickId, onChange: (e) => setPresetPickId(e.target.value), disabled: disabled || servicePresets.length === 0, className: INPUT, children: [_jsx("option", { value: "", children: servicePresets.length === 0 ? "Sin catálogo" : "Elegir servicio…" }), filteredPresets.map((t) => (_jsxs("option", { value: t.id, children: [t.name, " \u2014 ", Number(t.defaultSalePrice).toFixed(2), " EUR"] }, t.id)))] })] }), _jsx("button", { type: "button", disabled: disabled || !presetPickId, className: PRIMARY_ACTION_BUTTON_COMPACT, onClick: () => {
                            const preset = servicePresets.find((t) => t.id === presetPickId);
                            if (!preset)
                                return;
                            onAddPreset(preset);
                        }, children: "A\u00F1adir al servicio" })] }), _jsx(Link, { to: "/?tab=services", className: "mt-2 inline-flex text-xs font-medium text-indigo-300 underline-offset-2 hover:text-indigo-200 hover:underline", children: "Gestionar cat\u00E1logo en Inventario" })] }));
}
function ManualConceptGrid({ manualName, setManualName, manualQty, setManualQty, manualCost, setManualCost, manualSale, setManualSale, disabled, onAdd }) {
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4", children: [_jsxs("label", { className: "flex flex-col gap-1 text-xs font-medium text-slate-300 sm:col-span-2", children: ["Descripci\u00F3n", _jsx("input", { value: manualName, onChange: (e) => setManualName(e.target.value), disabled: disabled, className: INPUT })] }), _jsxs("label", { className: "flex flex-col gap-1 text-xs font-medium text-slate-300", children: ["Cantidad", _jsx("input", { type: "number", min: 1, value: manualQty, onChange: (e) => setManualQty(Math.max(1, Number(e.target.value) || 1)), disabled: disabled, className: INPUT })] }), _jsxs("label", { className: "flex flex-col gap-1 text-xs font-medium text-slate-300", children: ["Coste u. (opc.)", _jsx("input", { value: manualCost, onChange: (e) => setManualCost(e.target.value), disabled: disabled, placeholder: "0", className: INPUT })] }), _jsxs("label", { className: "flex flex-col gap-1 text-xs font-medium text-slate-300", children: ["Venta u.", _jsx("input", { value: manualSale, onChange: (e) => setManualSale(e.target.value), disabled: disabled, className: INPUT })] })] }), _jsx("button", { type: "button", disabled: disabled, onClick: onAdd, className: `${PRIMARY_ACTION_BUTTON_COMPACT} mt-3`, children: "A\u00F1adir l\u00EDnea" })] }));
}
