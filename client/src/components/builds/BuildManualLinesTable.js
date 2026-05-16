import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { TABLE_CELL } from "../../theme/layoutDensity";
import { DESTRUCTIVE_BUTTON_SM } from "../../theme/actionButtons";
function money(value) {
    return `${Number(value).toFixed(2)} EUR`;
}
export function isManualBuildLine(line) {
    return line.extraTemplateId == null;
}
export function BuildManualLinesTable({ lines, status, actionLoading, onRemove, onUpdateLine }) {
    const manualLines = lines.filter(isManualBuildLine);
    if (manualLines.length === 0) {
        return null;
    }
    const editable = status === "DRAFT" && onUpdateLine !== undefined;
    return (_jsxs("section", { className: "overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-lg shadow-slate-950/40", children: [_jsx("div", { className: "border-b border-slate-800 px-3 py-2 md:px-4", children: _jsx("h3", { className: "text-sm font-semibold text-slate-100", children: "Conceptos manuales" }) }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full text-left text-sm text-slate-200", children: [_jsx("thead", { className: "bg-slate-950/70 text-xs uppercase tracking-wide text-slate-400", children: _jsxs("tr", { children: [_jsx("th", { className: TABLE_CELL, children: "Concepto" }), _jsx("th", { className: TABLE_CELL, children: "Cant." }), _jsx("th", { className: TABLE_CELL, children: "Coste unit." }), _jsx("th", { className: TABLE_CELL, children: "Venta unit." }), _jsx("th", { className: `${TABLE_CELL} text-right`, children: "Acciones" })] }) }), _jsx("tbody", { className: "divide-y divide-slate-800", children: manualLines.map((line) => {
                                const sale = Number(line.unitSalePrice);
                                const cost = Number(line.unitCost);
                                return (_jsxs("tr", { className: "transition hover:bg-slate-800/50", children: [_jsxs("td", { className: TABLE_CELL, children: [_jsx("div", { className: "font-medium text-slate-100", children: line.name }), line.description?.trim() ? (_jsx("p", { className: "mt-0.5 text-xs text-slate-500", children: line.description })) : null] }), _jsx("td", { className: `${TABLE_CELL} tabular-nums`, children: line.quantity }), _jsx("td", { className: TABLE_CELL, children: editable ? (_jsx("input", { type: "text", inputMode: "decimal", defaultValue: cost.toFixed(2), disabled: actionLoading, className: "w-24 rounded border border-slate-700 bg-slate-950/70 px-2 py-1 text-sm tabular-nums outline-none focus:border-indigo-400 focus:ring", onBlur: (e) => {
                                                    const v = Number(e.target.value.replace(",", "."));
                                                    const nextSale = Number(line.unitSalePrice);
                                                    if (!Number.isFinite(v) || v < 0)
                                                        return;
                                                    if (Math.abs(v - cost) < 0.005)
                                                        return;
                                                    void onUpdateLine(line.id, nextSale, v);
                                                } })) : (money(cost)) }), _jsx("td", { className: TABLE_CELL, children: editable ? (_jsx("input", { type: "text", inputMode: "decimal", defaultValue: sale.toFixed(2), disabled: actionLoading, className: "w-24 rounded border border-slate-700 bg-slate-950/70 px-2 py-1 text-sm tabular-nums outline-none focus:border-indigo-400 focus:ring", onBlur: (e) => {
                                                    const v = Number(e.target.value.replace(",", "."));
                                                    if (!Number.isFinite(v) || v < 0)
                                                        return;
                                                    if (Math.abs(v - sale) < 0.005)
                                                        return;
                                                    void onUpdateLine(line.id, v, cost);
                                                } })) : (money(sale)) }), _jsx("td", { className: `${TABLE_CELL} text-right`, children: status === "DRAFT" ? (_jsx("button", { type: "button", disabled: actionLoading, onClick: () => void onRemove(line.id), className: DESTRUCTIVE_BUTTON_SM, children: "Quitar" })) : null })] }, line.id));
                            }) })] }) })] }));
}
