import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import * as catalogApi from "../../api/catalog";
import { PART_CATEGORIES, PART_CONDITIONS, partCategoryLabel } from "../../types/part";
import { calculateSalePrice } from "../../utils/pricing";
import { SECONDARY_BUTTON_SM } from "../../theme/actionButtons";
const TEMPLATE_CONDITION_LABEL = {
    NEW: "Nuevo",
    USED: "Usado",
    REFURBISHED: "Reacondicionado"
};
export function NewCatalogPartForm({ onSuccess }) {
    const [createSubmitting, setCreateSubmitting] = useState(false);
    const [createError, setCreateError] = useState(null);
    const [newSku, setNewSku] = useState("");
    const [newName, setNewName] = useState("");
    const [newCategory, setNewCategory] = useState("OTHER");
    const [newBrand, setNewBrand] = useState("");
    const [newModel, setNewModel] = useState("");
    const [newDefaultCost, setNewDefaultCost] = useState(0);
    const [templateCondition, setTemplateCondition] = useState("NEW");
    const [newDefaultSale, setNewDefaultSale] = useState(0);
    const [newNotes, setNewNotes] = useState("");
    useEffect(() => {
        setNewDefaultSale(calculateSalePrice(Math.max(0, newDefaultCost), templateCondition));
    }, [newDefaultCost, templateCondition]);
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
                defaultSalePrice: Math.max(0, Number.isFinite(newDefaultSale) ? newDefaultSale : 0),
                notes: newNotes.trim() ? newNotes.trim() : null
            });
            setNewSku("");
            setNewName("");
            setNewCategory("OTHER");
            setNewBrand("");
            setNewModel("");
            setNewDefaultCost(0);
            setTemplateCondition("NEW");
            setNewDefaultSale(calculateSalePrice(0, "NEW"));
            setNewNotes("");
            onSuccess?.(created, { condition: templateCondition });
        }
        catch (e) {
            setCreateError(e instanceof Error ? e.message : "No se pudo crear la pieza en el catalogo.");
        }
        finally {
            setCreateSubmitting(false);
        }
    };
    return (_jsxs("div", { className: "rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/40 md:p-5", children: [_jsx("h2", { className: "text-xl font-semibold text-slate-100", children: "Alta de plantilla de pieza" }), _jsx("p", { className: "mt-2 text-sm text-slate-400", children: "Define nombre, marca, modelo, categor\u00EDa, SKU opcional y coste. El PVP se rellena seg\u00FAn el estado (nuevo +15%, usado o reacondicionado +30%); puedes ajustarlo a mano si lo necesitas." }), createError ? (_jsx("p", { className: "mt-3 rounded-lg border border-rose-800/60 bg-rose-950/40 px-3 py-2 text-sm text-rose-100", children: createError })) : null, _jsxs("form", { onSubmit: handleCreateCatalog, className: "mt-4 space-y-3", children: [_jsxs("div", { className: "grid grid-cols-1 gap-3 sm:grid-cols-2", children: [_jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["SKU (opcional)", _jsx("input", { value: newSku, onChange: (e) => setNewSku(e.target.value), className: "min-h-[40px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring" })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Nombre", _jsx("input", { value: newName, onChange: (e) => setNewName(e.target.value), required: true, className: "min-h-[40px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring" })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Categor\u00EDa", _jsx("select", { value: newCategory, onChange: (e) => setNewCategory(e.target.value), className: "min-h-[40px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring", children: PART_CATEGORIES.map((c) => (_jsx("option", { value: c, children: partCategoryLabel(c) }, c))) })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Marca", _jsx("input", { value: newBrand, onChange: (e) => setNewBrand(e.target.value), className: "min-h-[40px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring" })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Modelo", _jsx("input", { value: newModel, onChange: (e) => setNewModel(e.target.value), className: "min-h-[40px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring" })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Estado (para calcular PVP recomendado)", _jsx("select", { value: templateCondition, onChange: (e) => setTemplateCondition(e.target.value), className: "min-h-[40px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring", children: PART_CONDITIONS.map((c) => (_jsx("option", { value: c, children: TEMPLATE_CONDITION_LABEL[c] }, c))) })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Coste recomendado", _jsx("input", { type: "number", min: 0, step: "0.01", value: newDefaultCost, onChange: (e) => setNewDefaultCost(Number(e.target.value)), className: "min-h-[40px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring" })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200 sm:col-span-2", children: ["PVP recomendado", _jsx("input", { type: "number", min: 0, step: "0.01", value: newDefaultSale, onChange: (e) => {
                                            const n = Number(e.target.value);
                                            setNewDefaultSale(Number.isFinite(n) ? n : 0);
                                        }, className: "min-h-[40px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring" }), _jsx("span", { className: "text-xs font-normal text-slate-500", children: "Referencia autom\u00E1tica al cambiar coste o estado: nuevo \u00D71,15 \u00B7 usado o reacondicionado \u00D71,30 (euro redondeado)." })] })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Notas del cat\u00E1logo", _jsx("textarea", { value: newNotes, onChange: (e) => setNewNotes(e.target.value), rows: 2, className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring" })] }), _jsx("button", { type: "submit", disabled: createSubmitting || !newName.trim(), className: `${SECONDARY_BUTTON_SM} disabled:cursor-not-allowed disabled:opacity-50`, children: createSubmitting ? "Creando..." : "Guardar en catálogo" })] })] }));
}
