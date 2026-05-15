import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { SECTION_SHELL, TABLE_CELL } from "../../theme/layoutDensity";
function money(value) {
    return `${Number(value).toFixed(2)} EUR`;
}
export function unitSaleForLine(item) {
    return Number(item.unitSalePrice);
}
function differsFromCatalog(item) {
    const catalogSale = Number(item.part.salePrice);
    return Math.abs(Number(item.unitSalePrice) - catalogSale) >= 0.005;
}
export function BuildItemsTable({ items, status, actionLoading, onRemove, onUpdateLineSale, prominent = false }) {
    if (items.length === 0) {
        return (_jsx("section", { className: SECTION_SHELL, children: _jsx("p", { className: "text-sm text-slate-300", children: "Este montaje aun no tiene piezas." }) }));
    }
    const editableSale = status === "DRAFT" && onUpdateLineSale !== undefined;
    const th = prominent ? "px-3 py-3 text-sm font-semibold" : TABLE_CELL;
    const tdBase = prominent ? "px-3 py-3 text-sm" : TABLE_CELL;
    const partCell = prominent ? `${tdBase} text-base font-semibold text-slate-50` : `${tdBase} font-medium text-slate-100`;
    const qtyCell = prominent ? `${tdBase} text-base tabular-nums text-slate-200` : `${tdBase} text-slate-300`;
    const moneyCell = prominent ? `${tdBase} text-base tabular-nums text-slate-200` : `${tdBase} text-slate-300`;
    return (_jsx("section", { className: "overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-lg shadow-slate-950/40", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full text-left text-slate-200", children: [_jsx("thead", { className: "bg-slate-950/70 text-slate-400", children: _jsxs("tr", { className: prominent ? "text-sm uppercase tracking-wide" : "text-xs uppercase tracking-wide", children: [_jsx("th", { className: th, children: "Pieza" }), _jsx("th", { className: th, children: "Cantidad" }), _jsx("th", { className: th, children: "Coste u." }), _jsx("th", { className: th, children: "Venta u." }), _jsx("th", { className: `${th} text-right`, children: "Acciones" })] }) }), _jsx("tbody", { className: "divide-y divide-slate-800", children: items.map((item) => (_jsx(BuildItemRow, { item: item, editableSale: editableSale, actionLoading: actionLoading, status: status, prominent: prominent, onRemove: onRemove, onUpdateLineSale: onUpdateLineSale }, item.id))) })] }) }) }));
}
function BuildItemRow({ item, editableSale, actionLoading, status, prominent, onRemove, onUpdateLineSale }) {
    const catalogSale = Number(item.part.salePrice);
    const lineSale = unitSaleForLine(item);
    const customized = differsFromCatalog(item);
    const tdBase = prominent ? "px-3 py-3 text-sm" : TABLE_CELL;
    const partCell = prominent ? `${tdBase} text-base font-semibold text-slate-50` : `${tdBase} font-medium text-slate-100`;
    const qtyCell = prominent ? `${tdBase} text-base tabular-nums text-slate-200` : `${tdBase} text-slate-300`;
    const moneyCell = prominent ? `${tdBase} text-base tabular-nums text-slate-200` : `${tdBase} text-slate-300`;
    return (_jsxs("tr", { className: "transition hover:bg-slate-800/50", children: [_jsx("td", { className: partCell, children: item.part.name }), _jsx("td", { className: qtyCell, children: item.quantity }), _jsx("td", { className: moneyCell, children: money(item.unitCost) }), _jsx("td", { className: tdBase, children: editableSale && onUpdateLineSale ? (_jsx("div", { className: "flex min-w-[12rem] flex-col gap-1 sm:min-w-[14rem]", children: _jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsx("input", { type: "text", inputMode: "decimal", defaultValue: lineSale.toFixed(2), disabled: actionLoading, onBlur: (event) => {
                                    const raw = event.target.value.trim().replace(",", ".");
                                    if (raw === "") {
                                        void onUpdateLineSale(item.id, catalogSale);
                                        return;
                                    }
                                    const n = Number(raw);
                                    if (!Number.isFinite(n) || n < 0) {
                                        return;
                                    }
                                    const rounded = Math.round(n * 100) / 100;
                                    void onUpdateLineSale(item.id, rounded);
                                }, className: "w-full max-w-[9rem] rounded-lg border border-slate-600 bg-slate-950/70 px-2 py-1.5 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring disabled:opacity-50", title: `Catálogo: ${catalogSale.toFixed(2)} EUR` }, `${item.id}-${lineSale.toFixed(2)}`), _jsx("button", { type: "button", disabled: actionLoading || !customized, onClick: () => {
                                    void onUpdateLineSale(item.id, catalogSale);
                                }, className: "shrink-0 rounded-md border border-slate-600 px-2 py-1 text-[11px] font-medium text-slate-400 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40", children: "Cat\u00E1logo" })] }) })) : (_jsxs("span", { className: "text-slate-300", children: [money(lineSale), customized ? (_jsx("span", { className: "ml-1.5 text-amber-300/90", title: `Precio distinto del catálogo (${catalogSale.toFixed(2)} EUR)`, children: "*" })) : null] })) }), _jsx("td", { className: `${tdBase} text-right`, children: _jsx("button", { type: "button", onClick: () => {
                        void onRemove(item.id);
                    }, disabled: status !== "DRAFT" || actionLoading, className: "rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50", children: "Quitar" }) })] }));
}
