import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { SECTION_SHELL, TABLE_CELL } from "../../theme/layoutDensity";
function money(value) {
    return `${Number(value).toFixed(2)} EUR`;
}
function defaultSale(line) {
    return line.extraTemplate ? Number(line.extraTemplate.defaultSalePrice) : Number(line.unitSalePrice);
}
function defaultCost(line) {
    return line.extraTemplate ? Number(line.extraTemplate.defaultCostPrice) : Number(line.unitCost);
}
export function BuildExtraLinesTable({ lines, status, actionLoading, onRemove, onUpdateLine, compactHeader = false }) {
    if (lines.length === 0) {
        return null;
    }
    const editable = status === "DRAFT" && onUpdateLine !== undefined;
    return (_jsxs("section", { className: `overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-lg shadow-slate-950/40 ${compactHeader ? "mt-3" : "mt-6"}`, children: [_jsxs("div", { className: `border-b border-slate-800 ${compactHeader ? "px-3 py-2" : "px-4 py-3"}`, children: [_jsx("h2", { className: compactHeader
                            ? "text-sm font-semibold tracking-tight text-slate-200"
                            : "text-sm font-semibold uppercase tracking-wide text-slate-400", children: "Extras" }), !compactHeader ? (_jsx("p", { className: "mt-1 text-xs text-slate-500", children: "SO, instalaciones, packs \u2014 no descuentan inventario." })) : null] }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full text-left text-sm text-slate-200", children: [_jsx("thead", { className: "bg-slate-950/70 text-xs uppercase tracking-wide text-slate-400", children: _jsxs("tr", { children: [_jsx("th", { className: TABLE_CELL, children: "Concepto" }), _jsx("th", { className: TABLE_CELL, children: "Cantidad" }), _jsx("th", { className: TABLE_CELL, children: "Coste unit." }), _jsx("th", { className: TABLE_CELL, children: "Venta unit." }), _jsx("th", { className: `${TABLE_CELL} text-right`, children: "Acciones" })] }) }), _jsx("tbody", { className: "divide-y divide-slate-800", children: lines.map((line) => {
                                const cat = line.extraTemplate?.category?.trim();
                                const sale = Number(line.unitSalePrice);
                                const cost = Number(line.unitCost);
                                const tplSale = defaultSale(line);
                                const tplCost = defaultCost(line);
                                const saleCustom = Math.abs(sale - tplSale) >= 0.005;
                                const costCustom = Math.abs(cost - tplCost) >= 0.005;
                                return (_jsxs("tr", { className: "transition hover:bg-slate-800/50", children: [_jsxs("td", { className: `${TABLE_CELL} font-medium text-slate-100`, children: [line.name, cat ? (_jsxs("span", { className: "ml-2 text-[11px] font-normal text-slate-500", children: ["(", cat, ")"] })) : null] }), _jsx("td", { className: `${TABLE_CELL} text-slate-300`, children: line.quantity }), _jsx("td", { className: TABLE_CELL, children: editable && onUpdateLine ? (_jsxs("div", { className: "flex min-w-[10rem] flex-col gap-1", children: [_jsx("input", { type: "text", inputMode: "decimal", defaultValue: cost.toFixed(2), disabled: actionLoading, onBlur: (e) => {
                                                            const raw = e.target.value.trim().replace(",", ".");
                                                            if (raw === "") {
                                                                void onUpdateLine(line.id, sale, tplCost);
                                                                return;
                                                            }
                                                            const n = Number(raw);
                                                            if (!Number.isFinite(n) || n < 0)
                                                                return;
                                                            void onUpdateLine(line.id, sale, Math.round(n * 100) / 100);
                                                        }, className: "w-full max-w-[8rem] rounded-lg border border-slate-600 bg-slate-950/70 px-2 py-1.5 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring disabled:opacity-50" }, `${line.id}-c-${cost.toFixed(2)}`), _jsx("button", { type: "button", disabled: actionLoading || !costCustom, onClick: () => void onUpdateLine(line.id, sale, tplCost), className: "self-start rounded-md border border-slate-600 px-2 py-0.5 text-[10px] font-medium text-slate-400 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40", children: "Plantilla" })] })) : (_jsx("span", { className: "text-slate-300", children: money(line.unitCost) })) }), _jsx("td", { className: TABLE_CELL, children: editable && onUpdateLine ? (_jsxs("div", { className: "flex min-w-[10rem] flex-col gap-1", children: [_jsx("input", { type: "text", inputMode: "decimal", defaultValue: sale.toFixed(2), disabled: actionLoading, onBlur: (e) => {
                                                            const raw = e.target.value.trim().replace(",", ".");
                                                            if (raw === "") {
                                                                void onUpdateLine(line.id, tplSale, cost);
                                                                return;
                                                            }
                                                            const n = Number(raw);
                                                            if (!Number.isFinite(n) || n < 0)
                                                                return;
                                                            void onUpdateLine(line.id, Math.round(n * 100) / 100, cost);
                                                        }, className: "w-full max-w-[8rem] rounded-lg border border-slate-600 bg-slate-950/70 px-2 py-1.5 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring disabled:opacity-50" }, `${line.id}-s-${sale.toFixed(2)}`), _jsx("button", { type: "button", disabled: actionLoading || !saleCustom, onClick: () => void onUpdateLine(line.id, tplSale, cost), className: "self-start rounded-md border border-slate-600 px-2 py-0.5 text-[10px] font-medium text-slate-400 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40", children: "Plantilla" })] })) : (_jsxs("span", { className: "text-slate-300", children: [money(line.unitSalePrice), saleCustom ? (_jsx("span", { className: "ml-1.5 text-amber-300/90", title: `Distinto de plantilla (${tplSale.toFixed(2)} EUR)`, children: "*" })) : null] })) }), _jsx("td", { className: `${TABLE_CELL} text-right`, children: _jsx("button", { type: "button", onClick: () => void onRemove(line.id), disabled: status !== "DRAFT" || actionLoading, className: "rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50", children: "Quitar" }) })] }, line.id));
                            }) })] }) })] }));
}
export function BuildExtraLinesEmptyHint() {
    return (_jsx("section", { className: `${SECTION_SHELL} mt-4`, children: _jsx("p", { className: "text-sm text-slate-400", children: "Anade plantillas de extras (sin stock) desde el selector en borrador, o gestionalas en Inventario: pesta\u00F1a \u00ABNueva pieza\u00BB \u2192 \u00ABServicio/extra sin stock\u00BB." }) }));
}
