import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getCustomerOverview, patchCustomerNotes } from "../api/customers";
import { PRIMARY_ACTION_BUTTON_COMPACT, SECONDARY_GHOST_SM, SECONDARY_BUTTON_SM } from "../theme/actionButtons";
import { PAGE_HERO, PAGE_OUTER_7XL, SECTION_SHELL, TABLE_CELL } from "../theme/layoutDensity";
const QUOTE_STATUS_LABELS = {
    DRAFT: "Borrador",
    SENT: "Enviado",
    ACCEPTED: "Aceptado",
    REJECTED: "Rechazado",
    EXPIRED: "Caducado"
};
const SERVICE_LABELS = {
    SPARE_PART_SALE: "Venta pieza suelta",
    PC_CLEANING: "Limpieza PC",
    FORMATTING: "Formateo",
    OS_INSTALLATION: "Instalacion SO",
    DIAGNOSTIC: "Diagnostico",
    THERMAL_PASTE_CHANGE: "Pasta termica",
    PARTIAL_ASSEMBLY: "Montaje parcial",
    HOME_SERVICE: "Domicilio",
    OTHER: "Otro"
};
const SERVICE_STATUS_LABELS = {
    PENDING: "Pendiente",
    COMPLETED: "Completado",
    CANCELLED: "Cancelado"
};
function money(n) {
    return `${n.toFixed(2)} EUR`;
}
function formatShortDate(iso) {
    try {
        return new Date(iso).toLocaleDateString("es-ES");
    }
    catch {
        return iso;
    }
}
export function CustomerDetailPage() {
    const [searchParams] = useSearchParams();
    const name = searchParams.get("name")?.trim() ?? "";
    const phone = searchParams.get("phone")?.trim() ?? "";
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [notesDraft, setNotesDraft] = useState("");
    const [savingNotes, setSavingNotes] = useState(false);
    const load = useCallback(async () => {
        if (!name) {
            setData(null);
            setError(null);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const overview = await getCustomerOverview(name, phone);
            setData(overview);
            setNotesDraft(overview.notes ?? "");
        }
        catch (e) {
            setData(null);
            setError(e instanceof Error ? e.message : "No se pudo cargar la ficha.");
        }
        finally {
            setLoading(false);
        }
    }, [name, phone]);
    useEffect(() => {
        void load();
    }, [load]);
    const handleSaveNotes = async () => {
        if (!name)
            return;
        setSavingNotes(true);
        setError(null);
        try {
            const res = await patchCustomerNotes({
                name,
                phone,
                notes: notesDraft.trim() === "" ? null : notesDraft.trim()
            });
            setData((prev) => (prev ? { ...prev, notes: res.notes } : prev));
            setNotesDraft(res.notes ?? "");
        }
        catch (e) {
            setError(e instanceof Error ? e.message : "No se pudieron guardar las notas.");
        }
        finally {
            setSavingNotes(false);
        }
    };
    if (!name) {
        return (_jsx("div", { className: PAGE_OUTER_7XL, children: _jsxs("section", { className: SECTION_SHELL, children: [_jsx("p", { className: "text-sm text-slate-300", children: "Indica un cliente en la URL (nombre y telefono), o abre la ficha desde un presupuesto, servicio o venta." }), _jsxs("div", { className: "mt-4 flex flex-wrap gap-2", children: [_jsx(Link, { to: "/quotes", className: SECONDARY_GHOST_SM, children: "Presupuestos" }), _jsx(Link, { to: "/services", className: SECONDARY_GHOST_SM, children: "Servicios" }), _jsx(Link, { to: "/sales", className: SECONDARY_GHOST_SM, children: "Ventas" })] })] }) }));
    }
    return (_jsxs("div", { className: PAGE_OUTER_7XL, children: [_jsx("section", { className: PAGE_HERO, children: _jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold tracking-tight text-slate-100", children: "Cliente" }), _jsx("p", { className: "mt-1 text-lg font-semibold text-slate-100", children: name }), _jsxs("p", { className: "mt-0.5 text-sm text-slate-400", children: ["Telefono: ", _jsx("span", { className: "text-slate-200", children: phone || "—" })] })] }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsx(Link, { to: "/quotes", className: SECONDARY_GHOST_SM, children: "Presupuestos" }), _jsx(Link, { to: "/services", className: SECONDARY_GHOST_SM, children: "Servicios" }), _jsx(Link, { to: "/sales", className: SECONDARY_GHOST_SM, children: "Ventas" })] })] }) }), error ? (_jsxs("div", { className: "mb-4 rounded-xl border border-rose-800/70 bg-rose-950/40 px-4 py-3 text-sm text-rose-200", children: [error, _jsx("button", { type: "button", onClick: () => void load(), className: `${SECONDARY_BUTTON_SM} ml-3`, children: "Reintentar" })] })) : null, loading && !data ? (_jsx("div", { className: "h-40 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60" })) : null, data ? (_jsxs(_Fragment, { children: [_jsxs("section", { className: `${SECTION_SHELL} mb-4`, children: [_jsx("h2", { className: "text-lg font-semibold text-slate-100", children: "Notas" }), _jsx("p", { className: "mt-1 text-xs text-slate-500", children: "Notas internas de la ficha (no sustituyen las notas de cada presupuesto o venta)." }), _jsx("textarea", { value: notesDraft, onChange: (e) => setNotesDraft(e.target.value), rows: 4, className: "mt-3 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring", placeholder: "Ej: prefiere contacto por WhatsApp, horario tarde..." }), _jsx("button", { type: "button", disabled: savingNotes, onClick: () => void handleSaveNotes(), className: `${PRIMARY_ACTION_BUTTON_COMPACT} mt-3`, children: savingNotes ? "Guardando..." : "Guardar notas" })] }), _jsxs("section", { className: `${SECTION_SHELL} mb-4`, children: [_jsxs("h2", { className: "text-lg font-semibold text-slate-100", children: ["Presupuestos ", _jsxs("span", { className: "text-slate-500", children: ["(", data.quotes.length, ")"] })] }), data.quotes.length === 0 ? (_jsx("p", { className: "mt-2 text-sm text-slate-500", children: "Ninguno con este nombre y telefono." })) : (_jsx("div", { className: "mt-3 overflow-x-auto rounded-xl border border-slate-800", children: _jsxs("table", { className: "min-w-full text-left text-sm text-slate-200", children: [_jsx("thead", { className: "bg-slate-950/80 text-xs uppercase tracking-wide text-slate-500", children: _jsxs("tr", { children: [_jsx("th", { className: TABLE_CELL, children: "N\u00BA" }), _jsx("th", { className: TABLE_CELL, children: "Titulo" }), _jsx("th", { className: TABLE_CELL, children: "Estado" }), _jsx("th", { className: TABLE_CELL, children: "Total" }), _jsx("th", { className: TABLE_CELL, children: "Fecha" }), _jsx("th", { className: `${TABLE_CELL} text-right`, children: "Accion" })] }) }), _jsx("tbody", { className: "divide-y divide-slate-800", children: data.quotes.map((q) => (_jsxs("tr", { className: "transition hover:bg-slate-800/40", children: [_jsxs("td", { className: `${TABLE_CELL} font-mono text-slate-400`, children: ["#", q.quoteNumber] }), _jsx("td", { className: `${TABLE_CELL} max-w-[200px] truncate`, children: q.title }), _jsx("td", { className: TABLE_CELL, children: QUOTE_STATUS_LABELS[q.status] }), _jsx("td", { className: `${TABLE_CELL} font-medium text-emerald-300/95`, children: money(q.total) }), _jsx("td", { className: `${TABLE_CELL} text-slate-400`, children: formatShortDate(q.createdAt) }), _jsx("td", { className: `${TABLE_CELL} text-right`, children: _jsx(Link, { to: `/quotes/${q.id}`, className: SECONDARY_GHOST_SM, children: "Ver" }) })] }, q.id))) })] }) }))] }), _jsxs("section", { className: `${SECTION_SHELL} mb-4`, children: [_jsxs("h2", { className: "text-lg font-semibold text-slate-100", children: ["Servicios ", _jsxs("span", { className: "text-slate-500", children: ["(", data.services.length, ")"] })] }), data.services.length === 0 ? (_jsx("p", { className: "mt-2 text-sm text-slate-500", children: "Ninguno con este nombre y telefono." })) : (_jsx("div", { className: "mt-3 overflow-x-auto rounded-xl border border-slate-800", children: _jsxs("table", { className: "min-w-full text-left text-sm text-slate-200", children: [_jsx("thead", { className: "bg-slate-950/80 text-xs uppercase tracking-wide text-slate-500", children: _jsxs("tr", { children: [_jsx("th", { className: TABLE_CELL, children: "Fecha" }), _jsx("th", { className: TABLE_CELL, children: "Titulo" }), _jsx("th", { className: TABLE_CELL, children: "Tipo" }), _jsx("th", { className: TABLE_CELL, children: "Estado" }), _jsx("th", { className: TABLE_CELL, children: "Venta" })] }) }), _jsx("tbody", { className: "divide-y divide-slate-800", children: data.services.map((s) => (_jsxs("tr", { className: "transition hover:bg-slate-800/40", children: [_jsx("td", { className: `${TABLE_CELL} text-slate-400`, children: formatShortDate(s.serviceDate) }), _jsx("td", { className: `${TABLE_CELL} max-w-[220px] truncate`, children: s.title }), _jsx("td", { className: `${TABLE_CELL} text-slate-400`, children: SERVICE_LABELS[s.type] }), _jsx("td", { className: TABLE_CELL, children: SERVICE_STATUS_LABELS[s.status] }), _jsx("td", { className: `${TABLE_CELL} text-emerald-300/95`, children: money(s.salePrice) })] }, s.id))) })] }) }))] }), _jsxs("section", { className: SECTION_SHELL, children: [_jsxs("h2", { className: "text-lg font-semibold text-slate-100", children: ["Ventas ", _jsxs("span", { className: "text-slate-500", children: ["(", data.sales.length, ")"] })] }), data.sales.length === 0 ? (_jsx("p", { className: "mt-2 text-sm text-slate-500", children: "Ninguna con este nombre y telefono." })) : (_jsx("div", { className: "mt-3 overflow-x-auto rounded-xl border border-slate-800", children: _jsxs("table", { className: "min-w-full text-left text-sm text-slate-200", children: [_jsx("thead", { className: "bg-slate-950/80 text-xs uppercase tracking-wide text-slate-500", children: _jsxs("tr", { children: [_jsx("th", { className: TABLE_CELL, children: "Fecha" }), _jsx("th", { className: TABLE_CELL, children: "Montaje" }), _jsx("th", { className: TABLE_CELL, children: "Venta" }), _jsx("th", { className: TABLE_CELL, children: "Beneficio" }), _jsx("th", { className: `${TABLE_CELL} text-right`, children: "Accion" })] }) }), _jsx("tbody", { className: "divide-y divide-slate-800", children: data.sales.map((s) => (_jsxs("tr", { className: "transition hover:bg-slate-800/40", children: [_jsx("td", { className: `${TABLE_CELL} text-slate-400`, children: formatShortDate(s.soldAt) }), _jsx("td", { className: `${TABLE_CELL} font-medium text-slate-100`, children: s.buildName }), _jsx("td", { className: `${TABLE_CELL} text-emerald-300/95`, children: money(s.finalSalePrice) }), _jsx("td", { className: `${TABLE_CELL} text-emerald-200/90`, children: money(s.profit) }), _jsx("td", { className: `${TABLE_CELL} text-right`, children: _jsx(Link, { to: `/sales/${s.id}`, className: SECONDARY_GHOST_SM, children: "Ver" }) })] }, s.id))) })] }) }))] })] })) : null] }));
}
