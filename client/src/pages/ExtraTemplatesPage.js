import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import * as extraTemplatesApi from "../api/extraTemplates";
import { SERVICE_CATALOG_CATEGORY, isServiceCatalogCategory } from "../constants/serviceCatalog";
import { seedDefaultServiceCatalog } from "../utils/serviceCatalogSeed";
import { DESTRUCTIVE_BUTTON_SM, ORANGE_EDIT_BUTTON_SM, PRIMARY_ACTION_BUTTON, SECONDARY_BUTTON_SM } from "../theme/actionButtons";
import { PAGE_HERO, PAGE_OUTER_7XL, SECTION_SHELL, TABLE_CELL } from "../theme/layoutDensity";
function money(n) {
    return `${n.toFixed(2)} EUR`;
}
function parsePrice(raw, optional) {
    const t = raw.replace(",", ".").trim();
    if (t === "")
        return optional ? 0 : null;
    const n = Number(t);
    if (!Number.isFinite(n) || n < 0)
        return null;
    return Math.round(n * 100) / 100;
}
export function ExtraTemplatesPage({ embedded = false, onTemplatesChanged, mode = "extra" }) {
    const isServiceMode = mode === "service";
    const [allRows, setAllRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [defaultCostPrice, setDefaultCostPrice] = useState("");
    const [defaultSalePrice, setDefaultSalePrice] = useState("");
    const rows = useMemo(() => {
        if (isServiceMode)
            return allRows.filter((r) => isServiceCatalogCategory(r.category));
        return allRows.filter((r) => !isServiceCatalogCategory(r.category));
    }, [allRows, isServiceMode]);
    const resetForm = () => {
        setEditingId(null);
        setName("");
        setDescription("");
        setCategory("");
        setDefaultCostPrice("");
        setDefaultSalePrice("");
    };
    const reload = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await extraTemplatesApi.listExtraTemplates(false);
            setAllRows(data);
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
    const startEdit = (row) => {
        setEditingId(row.id);
        setName(row.name);
        setDescription(row.description ?? "");
        setCategory(row.category ?? "");
        setDefaultCostPrice(String(Number(row.defaultCostPrice)));
        setDefaultSalePrice(String(Number(row.defaultSalePrice)));
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        const cost = parsePrice(defaultCostPrice, isServiceMode);
        const sale = parsePrice(defaultSalePrice, false);
        if (!name.trim()) {
            window.alert("Nombre obligatorio.");
            return;
        }
        if (cost === null || sale === null) {
            window.alert(isServiceMode ? "Indica un PVP valido (coste opcional)." : "Indica coste y PVP validos.");
            return;
        }
        const payload = {
            name: name.trim(),
            description: description.trim() || null,
            category: isServiceMode ? SERVICE_CATALOG_CATEGORY : category.trim() || null,
            defaultCostPrice: cost,
            defaultSalePrice: sale,
            active: true
        };
        setSaving(true);
        setError(null);
        try {
            if (editingId) {
                await extraTemplatesApi.patchExtraTemplate(editingId, payload);
            }
            else {
                await extraTemplatesApi.createExtraTemplate(payload);
            }
            resetForm();
            await reload();
            onTemplatesChanged?.();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo guardar.");
        }
        finally {
            setSaving(false);
        }
    };
    const handleSeedDefaults = async () => {
        setSaving(true);
        setError(null);
        try {
            const created = await seedDefaultServiceCatalog();
            await reload();
            onTemplatesChanged?.();
            window.alert(created > 0
                ? `Se han añadido ${created} servicio(s) al catálogo.`
                : "El catálogo ya contiene los servicios sugeridos.");
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo cargar el catálogo sugerido.");
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
        const label = isServiceMode ? "servicio" : "plantilla";
        const ok = window.confirm(`Eliminar ${label} "${row.name}"? Las lineas existentes quedaran sin enlace.`);
        if (!ok)
            return;
        setSaving(true);
        setError(null);
        try {
            await extraTemplatesApi.deleteExtraTemplate(row.id);
            if (editingId === row.id)
                resetForm();
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
    const introTitle = isServiceMode ? "Catálogo de servicios" : "Plantillas extra";
    const introText = isServiceMode
        ? "Servicios técnicos frecuentes con precio base. No consumen stock ni aparecen como piezas físicas. Al registrar un servicio puedes elegirlos y ajustar el precio en cada caso."
        : "Conceptos reutilizables sin inventario físico (Windows, packs, extras de montaje). Se usan en montajes y presupuestos.";
    const intro = (_jsxs(_Fragment, { children: [embedded ? (_jsx(EmbeddedIntro, { title: introTitle, text: introText })) : (_jsxs("section", { className: PAGE_HERO, children: [_jsx("h1", { className: "text-2xl font-bold", children: introTitle }), _jsx("p", { className: "mt-1 text-sm text-slate-300", children: introText }), _jsx(Link, { to: "/", className: "mt-4 inline-flex text-sm font-medium text-indigo-300 hover:text-indigo-200", children: "\u2190 Volver al inventario" })] })), error ? (_jsx("div", { className: "mb-4 rounded-xl border border-rose-800/70 bg-rose-950/40 px-4 py-3 text-sm text-rose-200", children: error })) : null] }));
    const body = (_jsxs(_Fragment, { children: [intro, _jsxs("section", { className: SECTION_SHELL, children: [_jsxs("h2", { className: "text-lg font-semibold text-slate-100", children: [editingId ? "Editar" : "Nuevo", " ", isServiceMode ? "servicio" : "plantilla"] }), _jsxs("form", { onSubmit: (e) => void handleSubmit(e), className: "mt-4 grid max-w-2xl grid-cols-1 gap-3 md:grid-cols-2", children: [_jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-2", children: ["Nombre", _jsx("input", { value: name, onChange: (e) => setName(e.target.value), required: true, className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none focus:border-indigo-400 focus:ring", placeholder: isServiceMode ? "Ej: Formateo" : "Ej: Instalacion Windows 11" })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-2", children: ["Descripcion (opcional)", _jsx("input", { value: description, onChange: (e) => setDescription(e.target.value), className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none focus:border-indigo-400 focus:ring" })] }), !isServiceMode ? (_jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Categoria (texto libre)", _jsx("input", { value: category, onChange: (e) => setCategory(e.target.value), className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none focus:border-indigo-400 focus:ring", placeholder: "SO, Instalacion, Software\u2026" })] })) : null, !isServiceMode ? _jsx("div", { className: "hidden md:block" }) : null, _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: [isServiceMode ? "Coste interno opcional (EUR)" : "Coste por defecto (EUR)", _jsx("input", { value: defaultCostPrice, onChange: (e) => setDefaultCostPrice(e.target.value), required: !isServiceMode, inputMode: "decimal", placeholder: isServiceMode ? "0" : undefined, className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none focus:border-indigo-400 focus:ring" })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["PVP base (EUR)", _jsx("input", { value: defaultSalePrice, onChange: (e) => setDefaultSalePrice(e.target.value), required: true, inputMode: "decimal", className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none focus:border-indigo-400 focus:ring" })] }), _jsxs("div", { className: "flex flex-wrap gap-2 md:col-span-2", children: [_jsx("button", { type: "submit", disabled: saving, className: PRIMARY_ACTION_BUTTON, children: saving ? "Guardando…" : editingId ? "Guardar cambios" : isServiceMode ? "Añadir servicio" : "Crear plantilla" }), editingId ? (_jsx("button", { type: "button", disabled: saving, onClick: resetForm, className: SECONDARY_BUTTON_SM, children: "Cancelar edicion" })) : null] })] })] }), _jsxs("section", { className: `${SECTION_SHELL} mt-6`, children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [_jsx("h2", { className: "text-lg font-semibold text-slate-100", children: "Listado" }), isServiceMode ? (_jsx("button", { type: "button", disabled: saving || loading, onClick: () => void handleSeedDefaults(), className: SECONDARY_BUTTON_SM, children: "Cargar servicios sugeridos" })) : null] }), loading ? (_jsx("p", { className: "mt-3 text-sm text-slate-400", children: "Cargando\u2026" })) : rows.length === 0 ? (_jsx("p", { className: "mt-3 text-sm text-slate-400", children: isServiceMode
                            ? "No hay servicios en el catálogo. Crea uno arriba o usa «Cargar servicios sugeridos»."
                            : "No hay plantillas. Crea la primera arriba." })) : (_jsx("div", { className: "mt-3 overflow-x-auto rounded-xl border border-slate-800", children: _jsxs("table", { className: "min-w-full text-left text-sm text-slate-200", children: [_jsx("thead", { className: "bg-slate-950/70 text-xs uppercase tracking-wide text-slate-400", children: _jsxs("tr", { children: [_jsx("th", { className: TABLE_CELL, children: "Nombre" }), !isServiceMode ? _jsx("th", { className: TABLE_CELL, children: "Categoria" }) : null, _jsx("th", { className: TABLE_CELL, children: "Coste" }), _jsx("th", { className: TABLE_CELL, children: "PVP" }), _jsx("th", { className: TABLE_CELL, children: "Activo" }), _jsx("th", { className: `${TABLE_CELL} text-right`, children: "Acciones" })] }) }), _jsx("tbody", { className: "divide-y divide-slate-800", children: rows.map((r) => (_jsxs("tr", { className: editingId === r.id ? "bg-indigo-950/30" : "hover:bg-slate-800/40", children: [_jsxs("td", { className: `${TABLE_CELL} font-medium text-slate-100`, children: [r.name, r.description?.trim() ? (_jsx("p", { className: "mt-0.5 text-xs font-normal text-slate-500", children: r.description })) : null] }), !isServiceMode ? (_jsx("td", { className: `${TABLE_CELL} text-slate-400`, children: r.category?.trim() || "—" })) : null, _jsx("td", { className: TABLE_CELL, children: money(Number(r.defaultCostPrice)) }), _jsx("td", { className: TABLE_CELL, children: money(Number(r.defaultSalePrice)) }), _jsx("td", { className: TABLE_CELL, children: r.active ? "Si" : "No" }), _jsxs("td", { className: `${TABLE_CELL} text-right`, children: [_jsx("button", { type: "button", disabled: saving, onClick: () => startEdit(r), className: ORANGE_EDIT_BUTTON_SM, children: "Editar" }), _jsx("button", { type: "button", disabled: saving, onClick: () => void toggleActive(r), className: `${SECONDARY_BUTTON_SM} ml-2`, children: r.active ? "Desactivar" : "Activar" }), _jsx("button", { type: "button", disabled: saving, onClick: () => void remove(r), className: `${DESTRUCTIVE_BUTTON_SM} ml-2`, children: "Eliminar" })] })] }, r.id))) })] }) }))] }), !isServiceMode ? (_jsxs("section", { className: `${SECTION_SHELL} mt-6`, children: [_jsx("h2", { className: "text-sm font-semibold uppercase tracking-wide text-slate-400", children: "Herramientas" }), _jsx("p", { className: "mt-2 text-sm text-slate-400", children: _jsx(Link, { to: "/sales/import", className: "font-medium text-indigo-300 underline-offset-2 hover:text-indigo-200 hover:underline", children: "Importaci\u00F3n hist\u00F3rica de ventas (Excel e historial de lotes)" }) })] })) : null] }));
    if (embedded) {
        return _jsx("div", { className: "space-y-6", children: body });
    }
    return _jsx("div", { className: PAGE_OUTER_7XL, children: body });
}
function EmbeddedIntro({ title, text }) {
    return (_jsxs("div", { className: "rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-inner shadow-black/20 md:p-5", children: [_jsx("h2", { className: "text-lg font-semibold text-slate-100", children: title }), _jsx("p", { className: "mt-2 text-sm text-slate-400", children: text })] }));
}
