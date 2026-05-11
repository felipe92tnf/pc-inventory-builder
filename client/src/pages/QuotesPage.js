import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import * as quotesApi from "../api/quotes";
import { QUOTE_STATUSES } from "../types/quote";
import { aggregateQuoteFinancials } from "../utils/quoteFinancials";
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
    EXPIRED: "Caducado"
};
function statusBadgeClass(status) {
    switch (status) {
        case "DRAFT":
            return "border-slate-500/40 bg-slate-500/15 text-slate-200";
        case "SENT":
            return "border-sky-500/40 bg-sky-500/15 text-sky-200";
        case "ACCEPTED":
            return "border-emerald-500/40 bg-emerald-500/15 text-emerald-200";
        case "REJECTED":
            return "border-rose-500/40 bg-rose-500/15 text-rose-200";
        case "EXPIRED":
            return "border-amber-500/40 bg-amber-500/15 text-amber-200";
        default:
            return "border-slate-600 bg-slate-800 text-slate-300";
    }
}
export function QuotesPage() {
    const [quotes, setQuotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [creating, setCreating] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [newCustomerName, setNewCustomerName] = useState("");
    const [newCustomerPhone, setNewCustomerPhone] = useState("");
    const [newCustomerEmail, setNewCustomerEmail] = useState("");
    const [newTitle, setNewTitle] = useState("");
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
    const handleCreate = async (event) => {
        event.preventDefault();
        if (!newCustomerName.trim() || !newTitle.trim()) {
            window.alert("Cliente y titulo son obligatorios.");
            return;
        }
        setCreating(true);
        setError(null);
        try {
            const payload = {
                customerName: newCustomerName.trim(),
                customerPhone: newCustomerPhone.trim() || null,
                customerEmail: newCustomerEmail.trim() || null,
                title: newTitle.trim()
            };
            const created = await quotesApi.createQuote(payload);
            setQuotes((prev) => [created, ...prev]);
            setNewCustomerName("");
            setNewCustomerPhone("");
            setNewCustomerEmail("");
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
    return (_jsxs("div", { className: "mx-auto w-full max-w-7xl space-y-6 px-2 pb-8 text-slate-100 md:px-4", children: [_jsxs("section", { className: "rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 shadow-[0_20px_50px_-24px_rgba(79,70,229,0.75)]", children: [_jsx("h1", { className: "text-2xl font-bold", children: "Presupuestos" }), _jsx("p", { className: "mt-2 text-sm text-slate-300", children: "Propuestas para clientes con lineas desde inventario o manuales. No descuenta stock hasta convertirlo en venta u operacion posterior." })] }), error ? (_jsxs("div", { className: "flex flex-col gap-3 rounded-xl border border-rose-800/70 bg-rose-950/40 px-4 py-3 text-sm text-rose-200 md:flex-row md:items-center md:justify-between", children: [_jsx("span", { children: error }), _jsx("button", { type: "button", onClick: () => void reload(), className: "rounded-lg border border-rose-700 bg-rose-900/50 px-3 py-1.5 font-semibold text-rose-100 transition hover:bg-rose-800/70", children: "Reintentar" })] })) : null, _jsx("div", { className: "flex flex-wrap items-center justify-between gap-3", children: _jsx("button", { type: "button", onClick: () => setShowForm((v) => !v), className: "rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:bg-indigo-500", children: showForm ? "Ocultar formulario" : "Nuevo presupuesto" }) }), showForm ? (_jsxs("form", { onSubmit: handleCreate, className: "rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg shadow-slate-950/40 md:p-6", children: [_jsx("h2", { className: "text-lg font-semibold text-slate-100", children: "Crear presupuesto" }), _jsxs("div", { className: "mt-4 grid grid-cols-1 gap-4 md:grid-cols-2", children: [_jsxs("label", { className: "flex flex-col gap-1.5 text-sm font-medium text-slate-200", children: ["Cliente", _jsx("input", { required: true, value: newCustomerName, onChange: (e) => setNewCustomerName(e.target.value), className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring" })] }), _jsxs("label", { className: "flex flex-col gap-1.5 text-sm font-medium text-slate-200", children: ["Telefono (opcional)", _jsx("input", { value: newCustomerPhone, onChange: (e) => setNewCustomerPhone(e.target.value), className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring" })] }), _jsxs("label", { className: "flex flex-col gap-1.5 text-sm font-medium text-slate-200 md:col-span-2", children: ["Email (opcional)", _jsx("input", { type: "email", value: newCustomerEmail, onChange: (e) => setNewCustomerEmail(e.target.value), className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring" })] }), _jsxs("label", { className: "flex flex-col gap-1.5 text-sm font-medium text-slate-200 md:col-span-2", children: ["Titulo del presupuesto", _jsx("input", { required: true, value: newTitle, onChange: (e) => setNewTitle(e.target.value), placeholder: "Ej: PC gaming Ryzen + RTX", className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none ring-indigo-400/60 placeholder:text-slate-500 focus:border-indigo-400 focus:ring" })] })] }), _jsx("div", { className: "mt-4 flex flex-wrap gap-2", children: _jsx("button", { type: "submit", disabled: creating, className: "rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-500 disabled:opacity-50", children: creating ? "Creando..." : "Crear y editar despues" }) })] })) : null, _jsxs("section", { className: "rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/40 md:p-5", children: [_jsx("h2", { className: "text-lg font-semibold text-slate-100", children: "Buscar y filtrar" }), _jsxs("div", { className: "mt-4 grid grid-cols-1 gap-4 md:grid-cols-3", children: [_jsxs("label", { className: "flex flex-col gap-1.5 text-sm font-medium text-slate-200 md:col-span-2", children: ["Buscar por cliente o titulo", _jsx("input", { value: query, onChange: (e) => setQuery(e.target.value), placeholder: "Nombre del cliente o titulo...", className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none ring-indigo-400/60 placeholder:text-slate-500 focus:border-indigo-400 focus:ring" })] }), _jsxs("label", { className: "flex flex-col gap-1.5 text-sm font-medium text-slate-200", children: ["Estado", _jsxs("select", { value: statusFilter, onChange: (e) => setStatusFilter(e.target.value), className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring", children: [_jsx("option", { value: "ALL", children: "Todos" }), QUOTE_STATUSES.map((s) => (_jsx("option", { value: s, children: STATUS_LABELS[s] }, s)))] })] })] })] }), loading ? (_jsx("p", { className: "text-sm text-slate-400", children: "Cargando presupuestos..." })) : filtered.length === 0 ? (_jsx("section", { className: "rounded-2xl border border-slate-800 bg-slate-900/80 p-8 text-center text-slate-400", children: "No hay presupuestos que coincidan." })) : (_jsxs(_Fragment, { children: [_jsx("section", { className: "hidden overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-lg shadow-slate-950/40 md:block", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full text-left text-sm text-slate-200", children: [_jsx("thead", { className: "bg-slate-950/70 text-xs uppercase tracking-wide text-slate-400", children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-3", children: "N\u00BA" }), _jsx("th", { className: "px-4 py-3", children: "Cliente" }), _jsx("th", { className: "px-4 py-3", children: "Titulo" }), _jsx("th", { className: "px-4 py-3", children: "Estado" }), _jsx("th", { className: "px-4 py-3", children: "Coste total" }), _jsx("th", { className: "px-4 py-3", children: "Total venta" }), _jsx("th", { className: "px-4 py-3", children: "Beneficio" }), _jsx("th", { className: "px-4 py-3", children: "Fecha" }), _jsx("th", { className: "px-4 py-3 text-right", children: "Acciones" })] }) }), _jsx("tbody", { className: "divide-y divide-slate-800", children: filtered.map((row) => {
                                            const fin = aggregateQuoteFinancials(row);
                                            return (_jsxs("tr", { className: "transition hover:bg-slate-800/40", children: [_jsxs("td", { className: "px-4 py-3 font-mono text-slate-300", children: ["#", row.quoteNumber] }), _jsx("td", { className: "px-4 py-3 font-medium text-slate-100", children: row.customerName }), _jsx("td", { className: "max-w-xs truncate px-4 py-3 text-slate-300", children: row.title }), _jsx("td", { className: "px-4 py-3", children: _jsx("span", { className: `inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(row.status)}`, children: STATUS_LABELS[row.status] }) }), _jsxs("td", { className: "whitespace-nowrap px-4 py-3 text-slate-300", title: fin.linesWithoutCost > 0 ? "Coste parcial (hay lineas sin coste)" : undefined, children: [money(fin.totalCost), fin.linesWithoutCost > 0 ? (_jsx("span", { className: "ml-1 text-[10px] text-amber-400/90", children: "*" })) : null] }), _jsx("td", { className: "px-4 py-3 font-semibold text-emerald-300/95", children: money(row.total) }), _jsx("td", { className: `whitespace-nowrap px-4 py-3 font-semibold ${fin.profitNet >= 0 ? "text-violet-300/95" : "text-rose-300"}`, children: money(fin.profitNet) }), _jsx("td", { className: "whitespace-nowrap px-4 py-3 text-slate-400", children: formatDate(row.createdAt) }), _jsx("td", { className: "px-4 py-3 text-right", children: _jsx(Link, { to: `/quotes/${row.id}`, className: "inline-flex rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md transition hover:bg-indigo-500", children: "Ver detalle" }) })] }, row.id));
                                        }) })] }) }) }), _jsx("section", { className: "space-y-3 md:hidden", children: filtered.map((row) => {
                            const fin = aggregateQuoteFinancials(row);
                            return (_jsxs("article", { className: "rounded-2xl border border-slate-800 bg-slate-950/50 p-4 shadow-md shadow-black/20", children: [_jsxs("div", { className: "flex flex-wrap items-start justify-between gap-2", children: [_jsxs("div", { children: [_jsxs("p", { className: "font-mono text-xs text-slate-500", children: ["#", row.quoteNumber] }), _jsx("h3", { className: "mt-1 text-base font-semibold text-slate-100", children: row.title }), _jsx("p", { className: "mt-1 text-sm text-slate-400", children: row.customerName })] }), _jsx("span", { className: `shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(row.status)}`, children: STATUS_LABELS[row.status] })] }), _jsxs("dl", { className: "mt-3 grid grid-cols-2 gap-2 border-t border-slate-800 pt-3 text-sm", children: [_jsxs("div", { children: [_jsx("dt", { className: "text-xs text-slate-500", children: "Coste total" }), _jsxs("dd", { className: "text-slate-300", children: [money(fin.totalCost), fin.linesWithoutCost > 0 ? (_jsx("span", { className: "text-[10px] text-amber-400/90", children: " *" })) : null] })] }), _jsxs("div", { children: [_jsx("dt", { className: "text-xs text-slate-500", children: "Total venta" }), _jsx("dd", { className: "font-semibold text-emerald-300", children: money(row.total) })] }), _jsxs("div", { children: [_jsx("dt", { className: "text-xs text-slate-500", children: "Beneficio" }), _jsx("dd", { className: `font-semibold ${fin.profitNet >= 0 ? "text-violet-300" : "text-rose-300"}`, children: money(fin.profitNet) })] }), _jsxs("div", { children: [_jsx("dt", { className: "text-xs text-slate-500", children: "Fecha" }), _jsx("dd", { className: "text-slate-300", children: formatDate(row.createdAt) })] })] }), _jsx(Link, { to: `/quotes/${row.id}`, className: "mt-4 flex w-full justify-center rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white", children: "Ver detalle" })] }, row.id));
                        }) })] }))] }));
}
