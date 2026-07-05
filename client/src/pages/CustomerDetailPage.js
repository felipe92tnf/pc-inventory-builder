import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { getCustomerById, getCustomerOverview, patchCustomer, patchCustomerNotes } from "../api/customers";
import { PRIMARY_ACTION_BUTTON_COMPACT, SECONDARY_GHOST_SM, SECONDARY_BUTTON_SM } from "../theme/actionButtons";
import { PAGE_HERO, PAGE_OUTER_7XL, SECTION_SHELL, TABLE_CELL } from "../theme/layoutDensity";
import { buildStatusLabelEs } from "../utils/buildStatusLabel";
const QUOTE_STATUS_LABELS = {
    DRAFT: "Borrador",
    SENT: "Enviado",
    ACCEPTED: "Aceptado",
    REJECTED: "Rechazado",
    EXPIRED: "Caducado",
    PENDING_PAYMENT: "Pendiente de pago"
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
function fromDetail(d) {
    return {
        customerId: d.id,
        displayName: d.name,
        displayPhone: d.phone,
        displayEmail: d.email,
        notes: d.notes,
        workCount: d.workCount,
        totalSpent: d.totalSpent,
        quotes: d.quotes,
        services: d.services,
        builds: d.builds,
        sales: d.sales
    };
}
function fromOverview(d) {
    return {
        customerId: d.customerId,
        displayName: d.displayName,
        displayPhone: d.displayPhone,
        displayEmail: d.displayEmail,
        notes: d.notes,
        quotes: d.quotes,
        services: d.services,
        builds: d.builds,
        sales: d.sales
    };
}
export function CustomerDetailPage() {
    const { id: routeId } = useParams();
    const [searchParams] = useSearchParams();
    const legacyName = searchParams.get("name")?.trim() ?? "";
    const legacyPhone = searchParams.get("phone")?.trim() ?? "";
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [notesDraft, setNotesDraft] = useState("");
    const [savingNotes, setSavingNotes] = useState(false);
    const load = useCallback(async () => {
        if (!routeId && !legacyName) {
            setData(null);
            setError(null);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            if (routeId) {
                const detail = await getCustomerById(routeId);
                const view = fromDetail(detail);
                setData(view);
                setNotesDraft(view.notes ?? "");
            }
            else {
                const overview = await getCustomerOverview(legacyName, legacyPhone);
                const view = fromOverview(overview);
                setData(view);
                setNotesDraft(view.notes ?? "");
            }
        }
        catch (e) {
            setData(null);
            setError(e instanceof Error ? e.message : "No se pudo cargar la ficha.");
        }
        finally {
            setLoading(false);
        }
    }, [routeId, legacyName, legacyPhone]);
    useEffect(() => {
        void load();
    }, [load]);
    const handleSaveNotes = async () => {
        if (!data)
            return;
        setSavingNotes(true);
        setError(null);
        try {
            if (data.customerId) {
                const res = await patchCustomer(data.customerId, {
                    notes: notesDraft.trim() === "" ? null : notesDraft.trim()
                });
                setData(fromDetail(res));
                setNotesDraft(res.notes ?? "");
            }
            else {
                const res = await patchCustomerNotes({
                    name: data.displayName,
                    phone: data.displayPhone,
                    notes: notesDraft.trim() === "" ? null : notesDraft.trim()
                });
                setData((prev) => (prev ? { ...prev, notes: res.notes } : prev));
                setNotesDraft(res.notes ?? "");
            }
        }
        catch (e) {
            setError(e instanceof Error ? e.message : "No se pudieron guardar las notas.");
        }
        finally {
            setSavingNotes(false);
        }
    };
    if (!routeId && !legacyName) {
        return (_jsx("div", { className: PAGE_OUTER_7XL, children: _jsxs("section", { className: SECTION_SHELL, children: [_jsx("p", { className: "text-sm text-slate-300", children: "Selecciona un cliente en la lista o abre la ficha desde un presupuesto, montaje o servicio." }), _jsx(Link, { to: "/customers", className: `${SECONDARY_GHOST_SM} mt-4 inline-flex`, children: "Ver todos los clientes" })] }) }));
    }
    return (_jsxs("div", { className: PAGE_OUTER_7XL, children: [_jsx("section", { className: PAGE_HERO, children: _jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold tracking-tight text-slate-100", children: "Cliente" }), data ? (_jsxs(_Fragment, { children: [_jsx("p", { className: "mt-1 text-lg font-semibold text-slate-100", children: data.displayName }), _jsxs("p", { className: "mt-0.5 text-sm text-slate-400", children: ["Telefono: ", _jsx("span", { className: "text-slate-200", children: data.displayPhone || "—" })] }), data.workCount != null ? (_jsxs("p", { className: "mt-1 text-xs text-slate-500", children: [data.workCount, " trabajos", data.totalSpent != null ? ` · ${money(data.totalSpent)} total generado` : ""] })) : null] })) : null] }), _jsx(Link, { to: "/customers", className: SECONDARY_GHOST_SM, children: "Todos los clientes" })] }) }), error ? (_jsxs("div", { className: "mb-4 rounded-xl border border-rose-800/70 bg-rose-950/40 px-4 py-3 text-sm text-rose-200", children: [error, _jsx("button", { type: "button", onClick: () => void load(), className: `${SECONDARY_BUTTON_SM} ml-3`, children: "Reintentar" })] })) : null, loading && !data ? (_jsx("div", { className: "h-40 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60" })) : null, data ? (_jsxs(_Fragment, { children: [_jsxs("section", { className: `${SECTION_SHELL} mb-4`, children: [_jsx("h2", { className: "text-lg font-semibold text-slate-100", children: "Notas" }), _jsx("textarea", { value: notesDraft, onChange: (e) => setNotesDraft(e.target.value), rows: 4, className: "mt-3 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring", placeholder: "Ej: prefiere WhatsApp, horario tarde..." }), _jsx("button", { type: "button", disabled: savingNotes, onClick: () => void handleSaveNotes(), className: `${PRIMARY_ACTION_BUTTON_COMPACT} mt-3`, children: savingNotes ? "Guardando..." : "Guardar notas" })] }), _jsx(HistorySection, { title: "Presupuestos", count: data.quotes.length, children: data.quotes.length === 0 ? (_jsx(EmptyHint, {})) : (_jsx(HistoryTable, { headers: ["Nº", "Titulo", "Estado", "Total", "Fecha", ""], rows: data.quotes.map((q) => [
                                `#${q.quoteNumber}`,
                                q.title,
                                QUOTE_STATUS_LABELS[q.status],
                                money(q.total),
                                formatShortDate(q.createdAt),
                                _jsx(Link, { to: `/quotes/${q.id}`, className: SECONDARY_GHOST_SM, children: "Ver" }, q.id)
                            ]) })) }), _jsx(HistorySection, { title: "Montajes", count: data.builds.length, children: data.builds.length === 0 ? (_jsx(EmptyHint, {})) : (_jsx(HistoryTable, { headers: ["Nombre", "Estado", "Fecha", ""], rows: data.builds.map((b) => [
                                b.name,
                                buildStatusLabelEs(b.status),
                                formatShortDate(b.createdAt),
                                _jsx(Link, { to: `/builds/${b.id}`, className: SECONDARY_GHOST_SM, children: "Ver" }, b.id)
                            ]) })) }), _jsx(HistorySection, { title: "Servicios", count: data.services.length, children: data.services.length === 0 ? (_jsx(EmptyHint, {})) : (_jsx(HistoryTable, { headers: ["Fecha", "Titulo", "Tipo", "Estado", "Venta"], rows: data.services.map((s) => [
                                formatShortDate(s.serviceDate),
                                s.title,
                                SERVICE_LABELS[s.type],
                                SERVICE_STATUS_LABELS[s.status],
                                money(s.salePrice)
                            ]) })) }), _jsx(HistorySection, { title: "Ventas", count: data.sales.length, children: data.sales.length === 0 ? (_jsx(EmptyHint, {})) : (_jsx(HistoryTable, { headers: ["Fecha", "Montaje", "Venta", "Beneficio", ""], rows: data.sales.map((s) => [
                                formatShortDate(s.soldAt),
                                s.buildName,
                                money(s.finalSalePrice),
                                money(s.profit),
                                _jsx(Link, { to: `/sales/${s.id}`, className: SECONDARY_GHOST_SM, children: "Ver" }, s.id)
                            ]) })) })] })) : null] }));
}
function HistorySection({ title, count, children }) {
    return (_jsxs("section", { className: `${SECTION_SHELL} mb-4`, children: [_jsxs("h2", { className: "text-lg font-semibold text-slate-100", children: [title, " ", _jsxs("span", { className: "text-slate-500", children: ["(", count, ")"] })] }), _jsx("div", { className: "mt-3", children: children })] }));
}
function EmptyHint() {
    return _jsx("p", { className: "text-sm text-slate-500", children: "Ninguno registrado." });
}
function HistoryTable({ headers, rows }) {
    return (_jsx("div", { className: "overflow-x-auto rounded-xl border border-slate-800", children: _jsxs("table", { className: "min-w-full text-left text-sm text-slate-200", children: [_jsx("thead", { className: "bg-slate-950/80 text-xs uppercase tracking-wide text-slate-500", children: _jsx("tr", { children: headers.map((h, i) => (_jsx("th", { className: `${TABLE_CELL}${i === headers.length - 1 && h === "" ? " text-right" : ""}`, children: h }, i))) }) }), _jsx("tbody", { className: "divide-y divide-slate-800", children: rows.map((cells, ri) => (_jsx("tr", { className: "transition hover:bg-slate-800/40", children: cells.map((cell, ci) => (_jsx("td", { className: `${TABLE_CELL}${ci === cells.length - 1 ? " text-right" : ""} max-w-[200px] truncate`, children: cell }, ci))) }, ri))) })] }) }));
}
