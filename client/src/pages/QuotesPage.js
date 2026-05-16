import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import * as quotesApi from "../api/quotes";
import { QUOTE_STATUSES } from "../types/quote";
import { aggregateQuoteFinancials } from "../utils/quoteFinancials";
import { PRIMARY_ACTION_BUTTON, PRIMARY_ACTION_BUTTON_HEADER, STICKY_PRIMARY_MOBILE_DOCK, SECONDARY_GHOST_SM, FILTER_TOGGLE_ROW } from "../theme/actionButtons";
import { LIST_PAGE_ACCORDION_SHELL, LIST_PAGE_ACCORDION_TRIGGER, LIST_PAGE_FILTER_SECTION, LIST_PAGE_LISTING_REGION, LIST_PAGE_LISTING_TITLE } from "../theme/listPageMobile";
import { PAGE_HERO, PAGE_OUTER_7XL, SECTION_SHELL, TABLE_CELL } from "../theme/layoutDensity";
import { StatusBadge, quoteStatusVariant } from "../components/ui/StatusBadge";
import { CustomerProfileLink } from "../components/customers/CustomerProfileLink";
import { CustomerPicker, emptyCustomerFields } from "../components/customers/CustomerPicker";
function money(n) {
    return `${n.toFixed(2)} EUR`;
}
function formatDate(iso) {
    try {
        return new Date(iso).toLocaleString("es-ES", {
            dateStyle: "short",
            timeStyle: "short"
        });
    }
    catch {
        return iso;
    }
}
const STATUS_LABELS = {
    DRAFT: "Borrador",
    SENT: "Enviado",
    ACCEPTED: "Aceptado",
    REJECTED: "Rechazado",
    EXPIRED: "Caducado",
    PENDING_PAYMENT: "Pendiente de pago"
};
function ChevronQuoteFold({ open }) {
    return (_jsx("svg", { className: `h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`, fill: "none", viewBox: "0 0 24 24", strokeWidth: 2, stroke: "currentColor", "aria-hidden": true, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M19 9l-7 7-7-7" }) }));
}
export function QuotesPage() {
    const [quotes, setQuotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [creating, setCreating] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [newCustomer, setNewCustomer] = useState(emptyCustomerFields);
    const [newTitle, setNewTitle] = useState("");
    /** Móvil: un acordeón por estado; por defecto plegados. */
    const [mobileStatusOpen, setMobileStatusOpen] = useState({});
    const [filtersOpen, setFiltersOpen] = useState(false);
    const reload = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await quotesApi.listQuotes();
            setQuotes(data);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "No se pudieron cargar los presupuestos.");
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => {
        void reload();
    }, [reload]);
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return quotes.filter((row) => {
            const matchStatus = statusFilter === "ALL" || row.status === statusFilter;
            if (!matchStatus)
                return false;
            if (!q)
                return true;
            const inTitle = row.title.toLowerCase().includes(q);
            const inCustomer = row.customerName.toLowerCase().includes(q);
            return inTitle || inCustomer;
        });
    }, [quotes, query, statusFilter]);
    /** Solo estados con al menos un presupuesto (tras filtros), orden fijo. */
    const quotesByStatus = useMemo(() => {
        const buckets = {
            DRAFT: [],
            SENT: [],
            ACCEPTED: [],
            REJECTED: [],
            EXPIRED: [],
            PENDING_PAYMENT: []
        };
        for (const q of filtered) {
            buckets[q.status].push(q);
        }
        return QUOTE_STATUSES.map((status) => ({ status, rows: buckets[status] })).filter((g) => g.rows.length > 0);
    }, [filtered]);
    const handleCreate = async (event) => {
        event.preventDefault();
        if (!newCustomer.customerName.trim() || !newTitle.trim()) {
            window.alert("Cliente y titulo son obligatorios.");
            return;
        }
        setCreating(true);
        setError(null);
        try {
            const payload = {
                customerId: newCustomer.customerId,
                customerName: newCustomer.customerName.trim(),
                customerPhone: newCustomer.customerPhone.trim() || null,
                customerEmail: newCustomer.customerEmail.trim() || null,
                title: newTitle.trim()
            };
            const created = await quotesApi.createQuote(payload);
            setQuotes((prev) => [created, ...prev]);
            setNewCustomer(emptyCustomerFields());
            setNewTitle("");
            setShowForm(false);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo crear el presupuesto.");
        }
        finally {
            setCreating(false);
        }
    };
    return (_jsxs("div", { className: `${PAGE_OUTER_7XL} max-md:pb-32`, children: [_jsxs("section", { className: `${PAGE_HERO} flex flex-col gap-3 md:flex-row md:items-start md:justify-between`, children: [_jsx("h1", { className: "text-3xl font-bold tracking-tight", children: "Presupuestos" }), _jsx("button", { type: "button", onClick: () => setShowForm((v) => !v), className: PRIMARY_ACTION_BUTTON_HEADER, children: showForm ? "Ocultar formulario" : "Nuevo presupuesto" })] }), error ? (_jsxs("div", { className: "flex flex-col gap-3 rounded-xl border border-rose-800/70 bg-rose-950/40 px-4 py-3 text-sm text-rose-200 md:flex-row md:items-center md:justify-between", children: [_jsx("span", { children: error }), _jsx("button", { type: "button", onClick: () => void reload(), className: "rounded-lg border border-rose-700 bg-rose-900/50 px-3 py-1.5 font-semibold text-rose-100 transition hover:bg-rose-800/70", children: "Reintentar" })] })) : null, showForm ? (_jsxs("form", { onSubmit: handleCreate, className: SECTION_SHELL, children: [_jsx("h2", { className: "text-lg font-semibold text-slate-100", children: "Crear presupuesto" }), _jsxs("div", { className: "mt-3 grid grid-cols-1 gap-3 md:grid-cols-2", children: [_jsx("div", { className: "md:col-span-2", children: _jsx(CustomerPicker, { value: newCustomer, onChange: setNewCustomer, requirePhone: false }) }), _jsxs("label", { className: "flex flex-col gap-1.5 text-sm font-medium text-slate-200 md:col-span-2", children: ["Titulo del presupuesto", _jsx("input", { required: true, value: newTitle, onChange: (e) => setNewTitle(e.target.value), placeholder: "Ej: PC gaming Ryzen + RTX", className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none ring-indigo-400/60 placeholder:text-slate-500 focus:border-indigo-400 focus:ring" })] })] }), _jsx("div", { className: "mt-3 flex flex-wrap gap-2", children: _jsx("button", { type: "submit", disabled: creating, className: PRIMARY_ACTION_BUTTON, children: creating ? "Creando..." : "Crear y editar despues" }) })] })) : null, _jsxs("section", { className: LIST_PAGE_FILTER_SECTION, children: [_jsxs("button", { type: "button", className: `${FILTER_TOGGLE_ROW} md:hidden`, onClick: () => setFiltersOpen((v) => !v), "aria-expanded": filtersOpen, children: [_jsxs("span", { className: "min-w-0 text-left", children: [_jsx("span", { className: "block text-sm font-semibold text-slate-200", children: "Filtros" }), _jsx("span", { className: "mt-0.5 block text-xs font-normal text-slate-500", children: "Buscar y acotar por estado" })] }), _jsx(ChevronQuoteFold, { open: filtersOpen })] }), _jsx("div", { className: filtersOpen ? "" : "max-md:hidden", children: _jsxs("div", { className: "border-t border-slate-800 px-4 pb-4 pt-1 md:border-t-0 md:pt-4", children: [_jsx("h2", { className: "mb-3 hidden text-xl font-semibold text-slate-100 md:block", children: "Buscar y filtrar" }), _jsxs("div", { className: "mt-0 grid grid-cols-1 gap-3 md:mt-0 md:grid-cols-3", children: [_jsxs("label", { className: "flex flex-col gap-1.5 text-sm font-medium text-slate-200 md:col-span-2", children: ["Buscar por cliente o titulo", _jsx("input", { value: query, onChange: (e) => setQuery(e.target.value), placeholder: "Nombre del cliente o titulo...", className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none ring-indigo-400/60 placeholder:text-slate-500 focus:border-indigo-400 focus:ring" })] }), _jsxs("label", { className: "flex flex-col gap-1.5 text-sm font-medium text-slate-200", children: ["Estado", _jsxs("select", { value: statusFilter, onChange: (e) => setStatusFilter(e.target.value), className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring", children: [_jsx("option", { value: "ALL", children: "Todos" }), QUOTE_STATUSES.map((s) => (_jsx("option", { value: s, children: STATUS_LABELS[s] }, s)))] })] })] })] }) })] }), _jsxs("div", { className: LIST_PAGE_LISTING_REGION, children: [_jsx("h2", { className: LIST_PAGE_LISTING_TITLE, children: "Listado de presupuestos" }), loading ? (_jsx("p", { className: "text-sm text-slate-400", children: "Cargando presupuestos..." })) : filtered.length === 0 ? (_jsx("section", { className: `${SECTION_SHELL} py-6 text-center text-slate-400`, children: "No hay presupuestos que coincidan." })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "hidden space-y-4 md:block", children: quotesByStatus.map(({ status, rows }) => (_jsxs("section", { className: LIST_PAGE_ACCORDION_SHELL, children: [_jsxs("div", { className: "flex flex-wrap items-center gap-2 border-b border-slate-800 bg-slate-950/70 px-4 py-2.5", children: [_jsx("h3", { className: "text-sm font-semibold uppercase tracking-wide text-slate-200", children: STATUS_LABELS[status] }), _jsx(StatusBadge, { variant: quoteStatusVariant(status), size: "card", className: "leading-none tabular-nums", children: rows.length })] }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full text-left text-sm text-slate-200", children: [_jsx("thead", { className: "bg-slate-950/50 text-xs uppercase tracking-wide text-slate-400", children: _jsxs("tr", { children: [_jsx("th", { className: TABLE_CELL, children: "N\u00BA" }), _jsx("th", { className: TABLE_CELL, children: "Cliente" }), _jsx("th", { className: TABLE_CELL, children: "Titulo" }), _jsx("th", { className: TABLE_CELL, children: "Coste total" }), _jsx("th", { className: TABLE_CELL, children: "Total venta" }), _jsx("th", { className: TABLE_CELL, children: "Beneficio" }), _jsx("th", { className: TABLE_CELL, children: "Fecha" }), _jsx("th", { className: `${TABLE_CELL} text-right`, children: "Acciones" })] }) }), _jsx("tbody", { className: "divide-y divide-slate-800", children: rows.map((row) => {
                                                            const fin = aggregateQuoteFinancials(row);
                                                            return (_jsxs("tr", { className: "transition hover:bg-slate-800/40", children: [_jsxs("td", { className: `${TABLE_CELL} font-mono text-slate-300`, children: ["#", row.quoteNumber] }), _jsxs("td", { className: TABLE_CELL, children: [_jsx("div", { className: "font-medium text-slate-100", children: row.customerName }), _jsx(CustomerProfileLink, { customerName: row.customerName, customerPhone: row.customerPhone, className: "mt-1 inline-flex text-[11px]" })] }), _jsx("td", { className: `max-w-xs truncate ${TABLE_CELL} text-slate-300`, children: row.title }), _jsxs("td", { className: `whitespace-nowrap ${TABLE_CELL} text-slate-300`, title: fin.linesWithoutCost > 0 ? "Coste parcial (hay lineas sin coste)" : undefined, children: [money(fin.totalCost), fin.linesWithoutCost > 0 ? (_jsx("span", { className: "ml-1 text-[10px] text-amber-400/90", children: "*" })) : null] }), _jsxs("td", { className: `${TABLE_CELL} font-semibold text-emerald-300/95`, children: [_jsx("div", { children: money(row.total) }), row.status === "PENDING_PAYMENT" ? (_jsxs("p", { className: "mt-0.5 text-[11px] font-normal text-amber-200/90", children: ["Por cobrar: ", money(row.paymentRemaining)] })) : null] }), _jsx("td", { className: `whitespace-nowrap ${TABLE_CELL} font-semibold ${fin.profitNet >= 0 ? "text-violet-300/95" : "text-rose-300"}`, children: money(fin.profitNet) }), _jsx("td", { className: `whitespace-nowrap ${TABLE_CELL} text-slate-400`, children: formatDate(row.createdAt) }), _jsx("td", { className: `${TABLE_CELL} text-right`, children: _jsx(Link, { to: `/quotes/${row.id}`, className: SECONDARY_GHOST_SM, children: "Ver detalle" }) })] }, row.id));
                                                        }) })] }) })] }, status))) }), _jsx("div", { className: "space-y-3 md:hidden", children: quotesByStatus.map(({ status, rows }) => {
                                    const expanded = mobileStatusOpen[status] === true;
                                    const panelId = `quote-mobile-status-${status}`;
                                    return (_jsxs("article", { className: LIST_PAGE_ACCORDION_SHELL, children: [_jsxs("button", { type: "button", className: LIST_PAGE_ACCORDION_TRIGGER, onClick: () => setMobileStatusOpen((prev) => ({
                                                    ...prev,
                                                    [status]: !prev[status]
                                                })), "aria-expanded": expanded, "aria-controls": panelId, children: [_jsxs("div", { className: "flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:gap-3", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "text-sm font-semibold uppercase tracking-wide text-slate-200", children: STATUS_LABELS[status] }), _jsx("p", { className: "mt-0.5 text-xs text-slate-500", children: rows.length === 1 ? "1 presupuesto" : `${rows.length} presupuestos` })] }), _jsx(StatusBadge, { variant: quoteStatusVariant(status), size: "card", className: "leading-none tabular-nums", children: rows.length })] }), _jsx(ChevronQuoteFold, { open: expanded })] }), expanded ? (_jsx("div", { id: panelId, className: "space-y-2 border-t border-slate-800 p-3", children: rows.map((row) => (_jsxs("article", { className: "rounded-xl border border-slate-800/90 bg-slate-900/40 p-3 shadow-sm", children: [_jsxs("p", { className: "font-mono text-xs text-slate-500", children: ["#", row.quoteNumber] }), _jsx("h4", { className: "mt-1 text-base font-semibold leading-snug text-slate-100", children: row.title }), _jsx("p", { className: "mt-1 text-sm text-slate-400", children: row.customerName }), _jsx(CustomerProfileLink, { customerName: row.customerName, customerPhone: row.customerPhone, className: "mt-2 inline-flex text-xs" }), _jsxs("div", { className: "mt-2 border-t border-slate-800 pt-2", children: [_jsx("p", { className: "text-xs text-slate-500", children: "Total" }), _jsx("p", { className: "mt-0.5 text-lg font-bold text-emerald-300", children: money(row.total) }), row.status === "PENDING_PAYMENT" ? (_jsxs("p", { className: "mt-1 text-xs text-amber-200/90", children: ["Por cobrar: ", money(row.paymentRemaining)] })) : null] }), _jsx(Link, { to: `/quotes/${row.id}`, className: `${SECONDARY_GHOST_SM} mt-3 flex w-full min-h-[44px] justify-center py-2.5 text-sm`, children: "Ver detalle" })] }, row.id))) })) : null] }, status));
                                }) })] }))] }), _jsx("div", { className: STICKY_PRIMARY_MOBILE_DOCK, children: _jsx("button", { type: "button", onClick: () => setShowForm((v) => !v), className: PRIMARY_ACTION_BUTTON, children: showForm ? "Ocultar formulario" : "Nuevo presupuesto" }) })] }));
}
