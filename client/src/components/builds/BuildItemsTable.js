import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
function money(value) {
    return `${Number(value).toFixed(2)} EUR`;
}
export function BuildItemsTable({ items, status, actionLoading, onRemove }) {
    if (items.length === 0) {
        return (_jsx("section", { className: "rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg shadow-slate-950/40", children: _jsx("p", { className: "text-sm text-slate-300", children: "Este montaje aun no tiene piezas." }) }));
    }
    return (_jsx("section", { className: "overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-lg shadow-slate-950/40", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full text-left text-sm text-slate-200", children: [_jsx("thead", { className: "bg-slate-950/70 text-xs uppercase tracking-wide text-slate-400", children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-3", children: "Pieza" }), _jsx("th", { className: "px-4 py-3", children: "Cantidad" }), _jsx("th", { className: "px-4 py-3", children: "Coste unitario" }), _jsx("th", { className: "px-4 py-3", children: "Venta unitaria" }), _jsx("th", { className: "px-4 py-3 text-right", children: "Acciones" })] }) }), _jsx("tbody", { className: "divide-y divide-slate-800", children: items.map((item) => (_jsxs("tr", { className: "transition hover:bg-slate-800/50", children: [_jsx("td", { className: "px-4 py-3 font-medium text-slate-100", children: item.part.name }), _jsx("td", { className: "px-4 py-3 text-slate-300", children: item.quantity }), _jsx("td", { className: "px-4 py-3 text-slate-300", children: money(item.part.costPrice) }), _jsx("td", { className: "px-4 py-3 text-slate-300", children: money(item.part.salePrice) }), _jsx("td", { className: "px-4 py-3 text-right", children: _jsx("button", { type: "button", onClick: () => {
                                            void onRemove(item.id);
                                        }, disabled: status !== "DRAFT" || actionLoading, className: "rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50", children: "Quitar" }) })] }, item.id))) })] }) }) }));
}
