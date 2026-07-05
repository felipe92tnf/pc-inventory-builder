import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { deleteCustomer, listCustomers, patchCustomer } from "../api/customers";
import { PAGE_HERO, PAGE_OUTER_7XL, SECTION_SHELL, TABLE_CELL } from "../theme/layoutDensity";
import { DESTRUCTIVE_BUTTON_SM, ORANGE_EDIT_BUTTON_SM, PRIMARY_ACTION_BUTTON_COMPACT, SECONDARY_BUTTON_SM, SECONDARY_GHOST_SM } from "../theme/actionButtons";
function money(n) {
    return `${n.toFixed(2)} EUR`;
}
const SORT_OPTIONS = [
    { value: "NAME_ASC", label: "Nombre A-Z" },
    { value: "NAME_DESC", label: "Nombre Z-A" },
    { value: "TOTAL_DESC", label: "Mas total generado" },
    { value: "TOTAL_ASC", label: "Menos total generado" },
    { value: "WORK_DESC", label: "Mas trabajos" },
    { value: "WORK_ASC", label: "Menos trabajos" },
    { value: "RECENT_DESC", label: "Mas recientes" },
    { value: "OLDEST", label: "Mas antiguos" }
];
function sortCustomers(rows, sort) {
    const copy = [...rows];
    const nameCmp = (a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" });
    const dateCmp = (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    copy.sort((a, b) => {
        switch (sort) {
            case "NAME_ASC":
                return nameCmp(a, b);
            case "NAME_DESC":
                return nameCmp(b, a);
            case "TOTAL_DESC":
                return b.totalSpent - a.totalSpent || nameCmp(a, b);
            case "TOTAL_ASC":
                return a.totalSpent - b.totalSpent || nameCmp(a, b);
            case "WORK_DESC":
                return b.workCount - a.workCount || nameCmp(a, b);
            case "WORK_ASC":
                return a.workCount - b.workCount || nameCmp(a, b);
            case "RECENT_DESC":
                return dateCmp(b, a);
            case "OLDEST":
                return dateCmp(a, b);
            default:
                return 0;
        }
    });
    return copy;
}
const INPUT = "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring";
export function CustomersPage() {
    const [rows, setRows] = useState([]);
    const [query, setQuery] = useState("");
    const [sort, setSort] = useState("RECENT_DESC");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionId, setActionId] = useState(null);
    const [editing, setEditing] = useState(null);
    const [editName, setEditName] = useState("");
    const [editPhone, setEditPhone] = useState("");
    const [editNotes, setEditNotes] = useState("");
    const [savingEdit, setSavingEdit] = useState(false);
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
    const sortedRows = useMemo(() => sortCustomers(rows, sort), [rows, sort]);
    const openEdit = (c) => {
        setEditing(c);
        setEditName(c.name);
        setEditPhone(c.phone);
        setEditNotes(c.notes ?? "");
        setError(null);
    };
    const closeEdit = () => {
        if (savingEdit)
            return;
        setEditing(null);
    };
    const handleSaveEdit = async () => {
        if (!editing)
            return;
        const name = editName.trim();
        if (!name) {
            window.alert("Indica el nombre del cliente.");
            return;
        }
        setSavingEdit(true);
        setError(null);
        try {
            await patchCustomer(editing.id, {
                name,
                phone: editPhone.trim(),
                notes: editNotes.trim() === "" ? null : editNotes.trim()
            });
            setEditing(null);
            await load();
        }
        catch (e) {
            setError(e instanceof Error ? e.message : "No se pudo guardar el cliente.");
        }
        finally {
            setSavingEdit(false);
        }
    };
    const handleDelete = async (c) => {
        const ok = window.confirm(`¿Eliminar al cliente "${c.name}"?\n\nSolo se permite si no tiene presupuestos, servicios, montajes ni ventas asociados.`);
        if (!ok)
            return;
        setActionId(c.id);
        setError(null);
        try {
            await deleteCustomer(c.id);
            if (editing?.id === c.id)
                setEditing(null);
            await load();
        }
        catch (e) {
            setError(e instanceof Error ? e.message : "No se pudo eliminar el cliente.");
        }
        finally {
            setActionId(null);
        }
    };
    const actionButtons = (c, compact) => (_jsxs("div", { className: `flex flex-wrap gap-1 ${compact ? "mt-2" : "justify-end"}`, children: [_jsx(Link, { to: `/customers/${c.id}`, className: `${SECONDARY_GHOST_SM} ${compact ? "flex-1 justify-center py-2" : ""}`, children: "Ver" }), _jsx("button", { type: "button", disabled: actionId === c.id || savingEdit, onClick: () => openEdit(c), className: `${ORANGE_EDIT_BUTTON_SM} ${compact ? "flex-1 justify-center py-2" : ""}`, children: "Editar" }), _jsx("button", { type: "button", disabled: actionId === c.id || savingEdit, onClick: () => void handleDelete(c), className: `${DESTRUCTIVE_BUTTON_SM} ${compact ? "flex-1 justify-center py-2" : ""}`, children: actionId === c.id ? "Eliminando…" : "Eliminar" })] }));
    return (_jsxs("div", { className: PAGE_OUTER_7XL, children: [_jsxs("section", { className: PAGE_HERO, children: [_jsx("h1", { className: "text-3xl font-bold tracking-tight text-slate-100", children: "Clientes" }), _jsx("p", { className: "mt-1 text-sm text-slate-400", children: "Fichas reutilizables. Se crean al guardar un presupuesto, montaje o servicio, o desde el buscador de cliente." })] }), _jsx("section", { className: `${SECTION_SHELL} mb-4`, children: _jsxs("div", { className: "grid grid-cols-1 gap-3 sm:grid-cols-2", children: [_jsxs("label", { className: "flex flex-col gap-1.5 text-sm font-medium text-slate-200", children: ["Buscar", _jsx("input", { type: "search", value: query, onChange: (e) => setQuery(e.target.value), placeholder: "Nombre o telefono...", className: INPUT })] }), _jsxs("label", { className: "flex flex-col gap-1.5 text-sm font-medium text-slate-200", children: ["Ordenar", _jsx("select", { value: sort, onChange: (e) => setSort(e.target.value), className: INPUT, children: SORT_OPTIONS.map((opt) => (_jsx("option", { value: opt.value, children: opt.label }, opt.value))) })] })] }) }), error ? (_jsx("div", { className: "mb-4 rounded-xl border border-rose-800/70 bg-rose-950/40 px-4 py-3 text-sm text-rose-200", children: error })) : null, _jsx("section", { className: SECTION_SHELL, children: loading ? (_jsx("div", { className: "h-32 animate-pulse rounded-xl bg-slate-900/60" })) : sortedRows.length === 0 ? (_jsx("p", { className: "text-sm text-slate-500", children: "Ningun cliente encontrado." })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "hidden overflow-x-auto rounded-xl border border-slate-800 md:block", children: _jsxs("table", { className: "min-w-full text-left text-sm text-slate-200", children: [_jsx("thead", { className: "bg-slate-950/80 text-xs uppercase tracking-wide text-slate-500", children: _jsxs("tr", { children: [_jsx("th", { className: TABLE_CELL, children: "Nombre" }), _jsx("th", { className: TABLE_CELL, children: "Telefono" }), _jsx("th", { className: TABLE_CELL, children: "Trabajos" }), _jsx("th", { className: TABLE_CELL, children: "Total generado" }), _jsx("th", { className: `${TABLE_CELL} text-right`, children: "Acciones" })] }) }), _jsx("tbody", { className: "divide-y divide-slate-800", children: sortedRows.map((c) => (_jsxs("tr", { className: "transition hover:bg-slate-800/40", children: [_jsx("td", { className: `${TABLE_CELL} font-medium text-slate-100`, children: c.name }), _jsx("td", { className: TABLE_CELL, children: c.phone || "—" }), _jsx("td", { className: TABLE_CELL, children: c.workCount }), _jsx("td", { className: `${TABLE_CELL} text-emerald-300/95`, children: money(c.totalSpent) }), _jsx("td", { className: TABLE_CELL, children: actionButtons(c) })] }, c.id))) })] }) }), _jsx("ul", { className: "space-y-3 md:hidden", children: sortedRows.map((c) => (_jsxs("li", { className: "rounded-xl border border-slate-800 bg-slate-950/50 p-3", children: [_jsx("p", { className: "font-semibold text-slate-100", children: c.name }), _jsx("p", { className: "mt-0.5 text-sm text-slate-400", children: c.phone || "Sin telefono" }), _jsxs("p", { className: "mt-2 text-xs text-slate-500", children: [c.workCount, " trabajos \u00B7 ", money(c.totalSpent), " total generado"] }), actionButtons(c, true)] }, c.id))) })] })) }), editing ? (_jsxs("div", { className: "fixed inset-0 z-[100] flex items-center justify-center p-4", children: [_jsx("button", { type: "button", "aria-label": "Cerrar", className: "absolute inset-0 bg-black/75 backdrop-blur-[2px]", onClick: closeEdit }), _jsxs("div", { role: "dialog", "aria-modal": "true", className: "relative w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl shadow-black/60", children: [_jsx("h2", { className: "text-lg font-semibold text-slate-100", children: "Editar cliente" }), _jsx("p", { className: "mt-1 text-sm text-slate-400", children: "Nombre, telefono y notas internas." }), _jsxs("div", { className: "mt-4 space-y-3", children: [_jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Nombre", _jsx("input", { value: editName, onChange: (e) => setEditName(e.target.value), disabled: savingEdit, className: INPUT })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Telefono", _jsx("input", { value: editPhone, onChange: (e) => setEditPhone(e.target.value), disabled: savingEdit, className: INPUT, placeholder: "Opcional" })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Notas", _jsx("textarea", { value: editNotes, onChange: (e) => setEditNotes(e.target.value), disabled: savingEdit, rows: 3, className: `${INPUT} min-h-[72px]`, placeholder: "Notas internas (opcional)" })] })] }), _jsxs("div", { className: "mt-5 flex flex-wrap justify-end gap-2", children: [_jsx("button", { type: "button", disabled: savingEdit, onClick: closeEdit, className: SECONDARY_BUTTON_SM, children: "Cancelar" }), _jsx("button", { type: "button", disabled: savingEdit, onClick: () => void handleSaveEdit(), className: PRIMARY_ACTION_BUTTON_COMPACT, children: savingEdit ? "Guardando…" : "Guardar" })] })] })] })) : null] }));
}
