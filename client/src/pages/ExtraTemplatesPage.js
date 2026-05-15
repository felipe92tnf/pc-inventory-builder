import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as extraTemplatesApi from "../api/extraTemplates";
import { DESTRUCTIVE_BUTTON_SM, PRIMARY_ACTION_BUTTON, SECONDARY_BUTTON_SM } from "../theme/actionButtons";
import { PAGE_HERO, PAGE_OUTER_7XL, SECTION_SHELL, TABLE_CELL } from "../theme/layoutDensity";
function money(n) {
    return `${n.toFixed(2)} EUR`;
}
export function ExtraTemplatesPage({ embedded = false, onTemplatesChanged }) {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [defaultCostPrice, setDefaultCostPrice] = useState("");
    const [defaultSalePrice, setDefaultSalePrice] = useState("");
    const reload = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await extraTemplatesApi.listExtraTemplates(false);
            setRows(data);
        }
        catch (e) {
            setError(e instanceof Error ? e.message : "No se pudo cargar.");
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => {
        void reload();
    }, [reload]);
    const handleCreate = async (e) => {
        e.preventDefault();
        const cost = Number(defaultCostPrice.replace(",", ".").trim());
        const sale = Number(defaultSalePrice.replace(",", ".").trim());
        if (!name.trim()) {
            window.alert("Nombre obligatorio.");
            return;
        }
        if (!Number.isFinite(cost) || cost < 0 || !Number.isFinite(sale) || sale < 0) {
            window.alert("Indica coste y PVP por defecto validos.");
            return;
        }
        setSaving(true);
        setError(null);
        try {
            await extraTemplatesApi.createExtraTemplate({
                name: name.trim(),
                description: description.trim() || null,
                category: category.trim() || null,
                defaultCostPrice: Math.round(cost * 100) / 100,
                defaultSalePrice: Math.round(sale * 100) / 100,
                active: true
            });
            setName("");
            setDescription("");
            setCategory("");
            setDefaultCostPrice("");
            setDefaultSalePrice("");
            await reload();
            onTemplatesChanged?.();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo crear.");
        }
        finally {
            setSaving(false);
        }
    };
    const toggleActive = async (row) => {
        setSaving(true);
        setError(null);
        try {
            await extraTemplatesApi.patchExtraTemplate(row.id, { active: !row.active });
            await reload();
            onTemplatesChanged?.();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo actualizar.");
        }
        finally {
            setSaving(false);
        }
    };
    const remove = async (row) => {
        const ok = window.confirm(`Eliminar plantilla "${row.name}"? Las lineas existentes quedaran sin enlace.`);
        if (!ok)
            return;
        setSaving(true);
        setError(null);
        try {
            await extraTemplatesApi.deleteExtraTemplate(row.id);
            await reload();
            onTemplatesChanged?.();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo eliminar.");
        }
        finally {
            setSaving(false);
        }
    };
    const intro = (_jsxs(_Fragment, { children: [embedded ? (_jsxs("div", { className: "rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-inner shadow-black/20 md:p-5", children: [_jsx("h2", { className: "text-lg font-semibold text-slate-100", children: "Plantillas extra" }), _jsx("p", { className: "mt-2 text-sm text-slate-400", children: "Servicios y conceptos reutilizables sin inventario fisico (Windows, instalaciones, packs). Se usan en montajes, presupuestos y servicios." })] })) : (_jsxs("section", { className: PAGE_HERO, children: [_jsx("h1", { className: "text-2xl font-bold", children: "Plantillas extra" }), _jsx("p", { className: "mt-1 text-sm text-slate-300", children: "Servicios y conceptos reutilizables sin inventario fisico (Windows, instalaciones, packs). Se usan en montajes, presupuestos y servicios." }), _jsx(Link, { to: "/", className: "mt-4 inline-flex text-sm font-medium text-indigo-300 hover:text-indigo-200", children: "\u2190 Volver al inventario" })] })), error ? (_jsx("div", { className: "mb-4 rounded-xl border border-rose-800/70 bg-rose-950/40 px-4 py-3 text-sm text-rose-200", children: error })) : null] }));
    const body = (_jsxs(_Fragment, { children: [intro, _jsxs("section", { className: SECTION_SHELL, children: [_jsx("h2", { className: "text-lg font-semibold text-slate-100", children: "Nueva plantilla" }), _jsxs("form", { onSubmit: (e) => void handleCreate(e), className: "mt-4 grid max-w-2xl grid-cols-1 gap-3 md:grid-cols-2", children: [_jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-2", children: ["Nombre", _jsx("input", { value: name, onChange: (e) => setName(e.target.value), required: true, className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none focus:border-indigo-400 focus:ring", placeholder: "Ej: Instalacion Windows 11" })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-2", children: ["Descripcion", _jsx("input", { value: description, onChange: (e) => setDescription(e.target.value), className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none focus:border-indigo-400 focus:ring" })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Categoria (texto libre)", _jsx("input", { value: category, onChange: (e) => setCategory(e.target.value), className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none focus:border-indigo-400 focus:ring", placeholder: "SO, Instalacion, Software\u2026" })] }), _jsx("div", { className: "hidden md:block" }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Coste por defecto (EUR)", _jsx("input", { value: defaultCostPrice, onChange: (e) => setDefaultCostPrice(e.target.value), required: true, inputMode: "decimal", className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none focus:border-indigo-400 focus:ring" })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["PVP por defecto (EUR)", _jsx("input", { value: defaultSalePrice, onChange: (e) => setDefaultSalePrice(e.target.value), required: true, inputMode: "decimal", className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none focus:border-indigo-400 focus:ring" })] }), _jsx("div", { className: "md:col-span-2", children: _jsx("button", { type: "submit", disabled: saving, className: PRIMARY_ACTION_BUTTON, children: saving ? "Guardando…" : "Crear plantilla" }) })] })] }), _jsxs("section", { className: `${SECTION_SHELL} mt-6`, children: [_jsx("h2", { className: "text-lg font-semibold text-slate-100", children: "Listado" }), loading ? (_jsx("p", { className: "mt-3 text-sm text-slate-400", children: "Cargando\u2026" })) : rows.length === 0 ? (_jsx("p", { className: "mt-3 text-sm text-slate-400", children: "No hay plantillas. Crea la primera arriba." })) : (_jsx("div", { className: "mt-3 overflow-x-auto rounded-xl border border-slate-800", children: _jsxs("table", { className: "min-w-full text-left text-sm text-slate-200", children: [_jsx("thead", { className: "bg-slate-950/70 text-xs uppercase tracking-wide text-slate-400", children: _jsxs("tr", { children: [_jsx("th", { className: TABLE_CELL, children: "Nombre" }), _jsx("th", { className: TABLE_CELL, children: "Categoria" }), _jsx("th", { className: TABLE_CELL, children: "Coste" }), _jsx("th", { className: TABLE_CELL, children: "PVP" }), _jsx("th", { className: TABLE_CELL, children: "Activa" }), _jsx("th", { className: `${TABLE_CELL} text-right`, children: "Acciones" })] }) }), _jsx("tbody", { className: "divide-y divide-slate-800", children: rows.map((r) => (_jsxs("tr", { className: "hover:bg-slate-800/40", children: [_jsx("td", { className: `${TABLE_CELL} font-medium text-slate-100`, children: r.name }), _jsx("td", { className: `${TABLE_CELL} text-slate-400`, children: r.category?.trim() || "—" }), _jsx("td", { className: TABLE_CELL, children: money(Number(r.defaultCostPrice)) }), _jsx("td", { className: TABLE_CELL, children: money(Number(r.defaultSalePrice)) }), _jsx("td", { className: TABLE_CELL, children: r.active ? "Si" : "No" }), _jsxs("td", { className: `${TABLE_CELL} text-right`, children: [_jsx("button", { type: "button", disabled: saving, onClick: () => void toggleActive(r), className: SECONDARY_BUTTON_SM, children: r.active ? "Desactivar" : "Activar" }), _jsx("button", { type: "button", disabled: saving, onClick: () => void remove(r), className: `${DESTRUCTIVE_BUTTON_SM} ml-2`, children: "Eliminar" })] })] }, r.id))) })] }) }))] }), _jsxs("section", { className: `${SECTION_SHELL} mt-6`, children: [_jsx("h2", { className: "text-sm font-semibold uppercase tracking-wide text-slate-400", children: "Herramientas" }), _jsx("p", { className: "mt-2 text-sm text-slate-400", children: _jsx(Link, { to: "/sales/import", className: "font-medium text-indigo-300 underline-offset-2 hover:text-indigo-200 hover:underline", children: "Importaci\u00F3n hist\u00F3rica de ventas (Excel e historial de lotes)" }) })] })] }));
    if (embedded) {
        return _jsx("div", { className: "space-y-6", children: body });
    }
    return _jsx("div", { className: PAGE_OUTER_7XL, children: body });
}
