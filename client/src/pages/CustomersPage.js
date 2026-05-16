import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listCustomers } from "../api/customers";
import { PAGE_HERO, PAGE_OUTER_7XL, SECTION_SHELL, TABLE_CELL } from "../theme/layoutDensity";
import { SECONDARY_GHOST_SM } from "../theme/actionButtons";
function money(n) {
    return `${n.toFixed(2)} EUR`;
}
export function CustomersPage() {
    const [rows, setRows] = useState([]);
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await listCustomers(query);
            setRows(data);
        }
        catch (e) {
            setError(e instanceof Error ? e.message : "No se pudieron cargar los clientes.");
        }
        finally {
            setLoading(false);
        }
    }, [query]);
    useEffect(() => {
        const t = setTimeout(() => void load(), query.trim() ? 300 : 0);
        return () => clearTimeout(t);
    }, [load, query]);
    return (_jsxs("div", { className: PAGE_OUTER_7XL, children: [_jsxs("section", { className: PAGE_HERO, children: [_jsx("h1", { className: "text-3xl font-bold tracking-tight text-slate-100", children: "Clientes" }), _jsx("p", { className: "mt-1 text-sm text-slate-400", children: "Fichas reutilizables. Se crean al guardar un presupuesto, montaje o servicio, o desde el buscador de cliente." })] }), _jsx("section", { className: `${SECTION_SHELL} mb-4`, children: _jsxs("label", { className: "flex flex-col gap-1.5 text-sm font-medium text-slate-200", children: ["Buscar", _jsx("input", { type: "search", value: query, onChange: (e) => setQuery(e.target.value), placeholder: "Nombre, telefono o email...", className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring" })] }) }), error ? (_jsx("div", { className: "mb-4 rounded-xl border border-rose-800/70 bg-rose-950/40 px-4 py-3 text-sm text-rose-200", children: error })) : null, _jsx("section", { className: SECTION_SHELL, children: loading ? (_jsx("div", { className: "h-32 animate-pulse rounded-xl bg-slate-900/60" })) : rows.length === 0 ? (_jsx("p", { className: "text-sm text-slate-500", children: "Ningun cliente encontrado." })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "hidden overflow-x-auto rounded-xl border border-slate-800 md:block", children: _jsxs("table", { className: "min-w-full text-left text-sm text-slate-200", children: [_jsx("thead", { className: "bg-slate-950/80 text-xs uppercase tracking-wide text-slate-500", children: _jsxs("tr", { children: [_jsx("th", { className: TABLE_CELL, children: "Nombre" }), _jsx("th", { className: TABLE_CELL, children: "Telefono" }), _jsx("th", { className: TABLE_CELL, children: "Email" }), _jsx("th", { className: TABLE_CELL, children: "Trabajos" }), _jsx("th", { className: TABLE_CELL, children: "Total ventas" }), _jsx("th", { className: `${TABLE_CELL} text-right`, children: "Ficha" })] }) }), _jsx("tbody", { className: "divide-y divide-slate-800", children: rows.map((c) => (_jsxs("tr", { className: "transition hover:bg-slate-800/40", children: [_jsx("td", { className: `${TABLE_CELL} font-medium text-slate-100`, children: c.name }), _jsx("td", { className: TABLE_CELL, children: c.phone || "—" }), _jsx("td", { className: `${TABLE_CELL} text-slate-400`, children: c.email ?? "—" }), _jsx("td", { className: TABLE_CELL, children: c.workCount }), _jsx("td", { className: `${TABLE_CELL} text-emerald-300/95`, children: money(c.totalSpent) }), _jsx("td", { className: `${TABLE_CELL} text-right`, children: _jsx(Link, { to: `/customers/${c.id}`, className: SECONDARY_GHOST_SM, children: "Ver" }) })] }, c.id))) })] }) }), _jsx("ul", { className: "space-y-3 md:hidden", children: rows.map((c) => (_jsxs("li", { className: "rounded-xl border border-slate-800 bg-slate-950/50 p-3", children: [_jsx("p", { className: "font-semibold text-slate-100", children: c.name }), _jsx("p", { className: "mt-0.5 text-sm text-slate-400", children: c.phone || "Sin telefono" }), c.email ? _jsx("p", { className: "text-sm text-slate-500", children: c.email }) : null, _jsxs("p", { className: "mt-2 text-xs text-slate-500", children: [c.workCount, " trabajos \u00B7 ", money(c.totalSpent), " en ventas"] }), _jsx(Link, { to: `/customers/${c.id}`, className: `${SECONDARY_GHOST_SM} mt-2 inline-flex`, children: "Ver ficha" })] }, c.id))) })] })) })] }));
}
