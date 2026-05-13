import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { PRIMARY_ACTION_BUTTON_COMPACT, SECONDARY_GHOST_SM, SECONDARY_BUTTON_SM, DESTRUCTIVE_BUTTON_SM } from "../../theme/actionButtons";
import { SECTION_SHELL } from "../../theme/layoutDensity";
import { StatusBadge, buildStatusVariant } from "../ui/StatusBadge";
function isInventoryPrebuiltBuild(build) {
    return build.items?.length === 1 && build.items[0]?.part?.inventoryKind === "PREBUILT_PC";
}
export function BuildsList({ builds, loading, updatingId, deletingId, onEdit, onDelete }) {
    if (loading) {
        return (_jsx("section", { className: SECTION_SHELL, children: _jsx("p", { className: "text-sm text-slate-300", children: "Cargando montajes..." }) }));
    }
    if (builds.length === 0) {
        return (_jsx("section", { className: SECTION_SHELL, children: _jsx("p", { className: "text-sm text-slate-300", children: "Todav\u00EDa no has creado montajes." }) }));
    }
    return (_jsx("section", { className: "grid grid-cols-1 gap-3 lg:grid-cols-2", children: builds.map((build) => (_jsxs("article", { className: SECTION_SHELL, children: [_jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { className: "flex min-w-0 flex-wrap items-center gap-2", children: [_jsx("h3", { className: "text-lg font-semibold text-slate-100", children: build.name }), isInventoryPrebuiltBuild(build) ? (_jsx(StatusBadge, { variant: "prebuilt", size: "table", className: "uppercase tracking-wide", children: "PC inventario" })) : null] }), _jsx(StatusBadge, { variant: buildStatusVariant(build.status), size: "card", children: build.status === "SOLD" ? "Vendido" : build.status === "CONFIRMED" ? "Assembled" : "Draft" })] }), _jsx("p", { className: "mt-2 text-sm text-slate-300", children: build.notes || "Sin descripción." }), (build.status === "CONFIRMED" || build.status === "SOLD") && build.totalSale !== undefined ? (_jsxs("p", { className: "mt-3 text-sm font-semibold text-emerald-300", children: ["Precio venta: ", Number(build.totalSale).toFixed(2), " EUR"] })) : null, _jsxs("p", { className: "mt-4 text-xs text-slate-400", children: ["Piezas: ", build.items?.length ?? 0] }), _jsxs("div", { className: "mt-4 flex flex-wrap gap-2", children: [_jsx(Link, { to: `/builds/${build.id}`, className: `${SECONDARY_GHOST_SM} px-4 py-2 text-sm`, children: "Ver detalle" }), build.status === "CONFIRMED" ? (_jsx(Link, { to: `/builds/${build.id}#registrar-venta`, className: PRIMARY_ACTION_BUTTON_COMPACT, children: "Registrar venta" })) : null, _jsx("button", { type: "button", onClick: () => onEdit(build), disabled: updatingId === build.id || build.status === "SOLD", className: `${SECONDARY_BUTTON_SM} px-4 py-2 text-sm disabled:cursor-not-allowed`, children: updatingId === build.id ? "Guardando..." : "Editar" }), _jsx("button", { type: "button", onClick: () => onDelete(build), disabled: deletingId === build.id || build.status === "SOLD", className: `${DESTRUCTIVE_BUTTON_SM} px-4 py-2 text-sm disabled:cursor-not-allowed`, children: deletingId === build.id ? "Eliminando..." : "Eliminar" })] })] }, build.id))) }));
}
