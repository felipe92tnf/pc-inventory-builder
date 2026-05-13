import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import * as catalogApi from "../../api/catalog";
import { PART_CATEGORIES, partCategoryLabel } from "../../types/part";
import { SECONDARY_BUTTON_SM } from "../../theme/actionButtons";
export function NewCatalogPartForm({ onSuccess }) {
    const [createSubmitting, setCreateSubmitting] = useState(false);
    const [createError, setCreateError] = useState(null);
    const [newSku, setNewSku] = useState("");
    const [newName, setNewName] = useState("");
    const [newCategory, setNewCategory] = useState("OTHER");
    const [newBrand, setNewBrand] = useState("");
    const [newModel, setNewModel] = useState("");
    const [newDefaultCost, setNewDefaultCost] = useState(0);
    const [newDefaultSale, setNewDefaultSale] = useState(0);
    const [newNotes, setNewNotes] = useState("");
    const handleCreateCatalog = async (event) => {
        event.preventDefault();
        if (!newName.trim())
            return;
        setCreateSubmitting(true);
        setCreateError(null);
        try {
            const created = await catalogApi.createCatalogPart({
                sku: newSku.trim() ? newSku.trim() : null,
                name: newName.trim(),
                category: newCategory,
                brand: newBrand.trim(),
                model: newModel.trim(),
                defaultCostPrice: Math.max(0, newDefaultCost),
                defaultSalePrice: Math.max(0, newDefaultSale),
                notes: newNotes.trim() ? newNotes.trim() : null
            });
            setNewSku("");
            setNewName("");
            setNewCategory("OTHER");
            setNewBrand("");
            setNewModel("");
            setNewDefaultCost(0);
            setNewDefaultSale(0);
            setNewNotes("");
            onSuccess?.(created);
        }
        catch (e) {
            setCreateError(e instanceof Error ? e.message : "No se pudo crear la pieza en el catalogo.");
        }
        finally {
            setCreateSubmitting(false);
        }
    };
    return (_jsxs("div", { className: "rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/40 md:p-5", children: [_jsx("h2", { className: "text-xl font-semibold text-slate-100", children: "Nueva plantilla en el cat\u00E1logo" }), _jsx("p", { className: "mt-2 text-sm text-slate-400", children: "Define la pieza una sola vez (nombre, marca, modelo, categor\u00EDa, SKU y precios recomendados). Luego a\u00F1ade stock f\u00EDsico en la pesta\u00F1a \u00ABA\u00F1adir stock\u00BB." }), createError ? (_jsx("p", { className: "mt-3 rounded-lg border border-rose-800/60 bg-rose-950/40 px-3 py-2 text-sm text-rose-100", children: createError })) : null, _jsxs("form", { onSubmit: handleCreateCatalog, className: "mt-4 space-y-3", children: [_jsxs("div", { className: "grid grid-cols-1 gap-3 sm:grid-cols-2", children: [_jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["SKU (opcional)", _jsx("input", { value: newSku, onChange: (e) => setNewSku(e.target.value), className: "min-h-[40px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring" })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Nombre", _jsx("input", { value: newName, onChange: (e) => setNewName(e.target.value), required: true, className: "min-h-[40px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring" })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Categor\u00EDa", _jsx("select", { value: newCategory, onChange: (e) => setNewCategory(e.target.value), className: "min-h-[40px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring", children: PART_CATEGORIES.map((c) => (_jsx("option", { value: c, children: partCategoryLabel(c) }, c))) })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Marca", _jsx("input", { value: newBrand, onChange: (e) => setNewBrand(e.target.value), className: "min-h-[40px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring" })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Modelo", _jsx("input", { value: newModel, onChange: (e) => setNewModel(e.target.value), className: "min-h-[40px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring" })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Coste recomendado", _jsx("input", { type: "number", min: 0, step: "0.01", value: newDefaultCost, onChange: (e) => setNewDefaultCost(Number(e.target.value)), className: "min-h-[40px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring" })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["PVP recomendado", _jsx("input", { type: "number", min: 0, step: "0.01", value: newDefaultSale, onChange: (e) => setNewDefaultSale(Number(e.target.value)), className: "min-h-[40px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring" })] })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Notas del cat\u00E1logo", _jsx("textarea", { value: newNotes, onChange: (e) => setNewNotes(e.target.value), rows: 2, className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring" })] }), _jsx("button", { type: "submit", disabled: createSubmitting || !newName.trim(), className: `${SECONDARY_BUTTON_SM} disabled:cursor-not-allowed disabled:opacity-50`, children: createSubmitting ? "Creando..." : "Guardar en catálogo" })] })] }));
}
