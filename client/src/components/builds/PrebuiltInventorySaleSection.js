import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { isPrebuiltPc } from "../../types/part";
function conditionLabel(condition) {
    if (condition === "NEW")
        return "Nuevo";
    if (condition === "USED")
        return "Usado";
    if (condition === "REFURBISHED")
        return "Refurbished";
    return condition;
}
export function PrebuiltInventorySaleSection({ parts, loading, preparingPartId, onPrepareSale }) {
    const prebuiltWithStock = parts.filter((p) => isPrebuiltPc(p) && p.stock > 0);
    if (loading) {
        return (_jsx("section", { className: "rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg shadow-slate-950/40", children: _jsx("p", { className: "text-sm text-slate-300", children: "Cargando inventario de PCs completos..." }) }));
    }
    return (_jsxs("section", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-xl font-semibold text-slate-100", children: "PCs completos en inventario" }), _jsxs("p", { className: "mt-1 text-sm text-slate-400", children: ["Cada venta reserva una unidad del stock y abre un montaje ya ensamblado para usar", " ", _jsx("span", { className: "font-semibold text-cyan-300", children: "Registrar venta" }), " y pasarlo al apartado Ventas."] })] }), prebuiltWithStock.length === 0 ? (_jsx("div", { className: "rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg shadow-slate-950/40", children: _jsx("p", { className: "text-sm text-slate-300", children: "No hay PCs premontados con stock. A\u00F1adelos en Inventario (tipo PC completo)." }) })) : (_jsx("div", { className: "grid grid-cols-1 gap-4 lg:grid-cols-2", children: prebuiltWithStock.map((part) => (_jsxs("article", { className: "rounded-2xl border border-violet-500/25 bg-slate-900/80 p-5 shadow-lg shadow-slate-950/40", children: [_jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [_jsx("h3", { className: "text-lg font-semibold text-slate-100", children: part.name }), _jsx("span", { className: "rounded-full border border-violet-500/40 bg-violet-500/15 px-2.5 py-1 text-xs font-semibold text-violet-200", children: "Inventario" })] }), _jsx("p", { className: "mt-2 line-clamp-3 text-sm text-slate-400", children: part.description?.trim() || part.notes?.trim() || "Sin descripcion del equipo." }), _jsxs("dl", { className: "mt-4 grid grid-cols-2 gap-2 text-xs text-slate-400", children: [_jsxs("div", { children: [_jsx("dt", { className: "uppercase tracking-wide text-slate-500", children: "Stock" }), _jsx("dd", { className: "mt-0.5 font-semibold text-slate-200", children: part.stock })] }), _jsxs("div", { children: [_jsx("dt", { className: "uppercase tracking-wide text-slate-500", children: "Estado" }), _jsx("dd", { className: "mt-0.5 font-semibold text-slate-200", children: conditionLabel(part.condition) })] }), _jsxs("div", { children: [_jsx("dt", { className: "uppercase tracking-wide text-slate-500", children: "Venta estimada" }), _jsxs("dd", { className: "mt-0.5 font-semibold text-emerald-300", children: [Number(part.salePrice).toFixed(2), " EUR"] })] }), _jsxs("div", { children: [_jsx("dt", { className: "uppercase tracking-wide text-slate-500", children: "Coste" }), _jsxs("dd", { className: "mt-0.5 font-semibold text-slate-300", children: [Number(part.costPrice).toFixed(2), " EUR"] })] })] }), _jsx("div", { className: "mt-4 flex flex-wrap gap-2", children: _jsx("button", { type: "button", disabled: preparingPartId === part.id, onClick: () => {
                                    void onPrepareSale(part);
                                }, className: "inline-flex rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan-900/30 transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50", children: preparingPartId === part.id ? "Preparando..." : "Registrar venta" }) })] }, part.id))) }))] }));
}
