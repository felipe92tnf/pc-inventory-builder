import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { OS_PART_CONDITION, PART_CATEGORIES, PART_CONDITIONS, isNonStockCategory, partCategoryLabel } from "../../types/part";
import { calculateSalePrice } from "../../utils/pricing";
const STOCK_QUICK_OPTIONS = [1, 2, 3, 4, 5];
const defaultValues = {
    inventoryKind: "PART",
    name: "",
    category: "CPU",
    condition: "USED",
    costPrice: 0,
    salePrice: calculateSalePrice(0, "USED"),
    manualSalePrice: false,
    stock: 1,
    notes: "",
    description: ""
};
function toNumber(value) {
    return Number(value);
}
function salePriceDiffersFromCalculated(saved, cost, condition) {
    const calculated = calculateSalePrice(cost || 0, condition);
    return Math.abs(saved - calculated) > 0.005;
}
function conditionForPricing(category, condition) {
    return isNonStockCategory(category) ? OS_PART_CONDITION : condition;
}
export function PartForm({ selectedPart, onSubmit, onCancelEdit, submitting, className = "" }) {
    const [form, setForm] = useState(defaultValues);
    const isEditMode = useMemo(() => selectedPart !== null, [selectedPart]);
    const isPrebuilt = form.inventoryKind === "PREBUILT_PC";
    useEffect(() => {
        if (!selectedPart) {
            setForm(defaultValues);
            return;
        }
        const cost = toNumber(selectedPart.costPrice);
        const savedSale = toNumber(selectedPart.salePrice);
        if (selectedPart.inventoryKind === "PREBUILT_PC") {
            setForm({
                inventoryKind: "PREBUILT_PC",
                name: selectedPart.name,
                category: "CPU",
                condition: selectedPart.condition,
                costPrice: cost,
                salePrice: savedSale,
                manualSalePrice: true,
                stock: selectedPart.stock,
                notes: selectedPart.notes ?? "",
                description: selectedPart.description ?? ""
            });
            return;
        }
        const cat = selectedPart.category ?? "OTHER";
        const condForCalc = isNonStockCategory(cat) ? OS_PART_CONDITION : selectedPart.condition;
        setForm({
            inventoryKind: "PART",
            name: selectedPart.name,
            category: cat,
            condition: isNonStockCategory(cat) ? OS_PART_CONDITION : selectedPart.condition,
            costPrice: cost,
            salePrice: savedSale,
            manualSalePrice: salePriceDiffersFromCalculated(savedSale, cost, condForCalc),
            stock: selectedPart.stock,
            notes: selectedPart.notes ?? "",
            description: selectedPart.description ?? ""
        });
    }, [selectedPart]);
    useEffect(() => {
        if (isPrebuilt || form.manualSalePrice)
            return;
        setForm((prev) => ({
            ...prev,
            salePrice: calculateSalePrice(prev.costPrice || 0, conditionForPricing(prev.category, prev.condition))
        }));
    }, [form.costPrice, form.condition, form.category, form.manualSalePrice, isPrebuilt]);
    const calculatedSalePrice = useMemo(() => calculateSalePrice(form.costPrice || 0, conditionForPricing(form.category, form.condition)), [form.costPrice, form.category, form.condition]);
    const referenceSalePrebuilt = useMemo(() => calculateSalePrice(form.costPrice || 0, form.condition), [form.costPrice, form.condition]);
    const updateField = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };
    const handleSubmit = async (event) => {
        event.preventDefault();
        await onSubmit(form);
        if (!isEditMode) {
            setForm(defaultValues);
        }
    };
    const formTitle = isEditMode
        ? isPrebuilt
            ? "Editar PC completo"
            : "Editar pieza"
        : isPrebuilt
            ? "Nuevo PC completo"
            : "Nueva pieza";
    return (_jsxs("section", { className: `rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg shadow-slate-950/40 backdrop-blur ${className}`.trim(), children: [_jsxs("div", { className: "mb-4 flex items-center justify-between", children: [_jsx("h2", { className: "text-lg font-semibold text-slate-100", children: formTitle }), isEditMode ? (_jsx("button", { type: "button", onClick: onCancelEdit, className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-1.5 text-sm font-medium text-slate-200 transition hover:bg-slate-800", children: "Cancelar" })) : null] }), _jsxs("div", { className: "mb-4 flex flex-col gap-2", children: [_jsx("span", { className: "text-xs font-medium uppercase tracking-wide text-slate-500", children: "Tipo de articulo" }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsx("button", { type: "button", disabled: isEditMode || submitting, onClick: () => {
                                    setForm((prev) => ({
                                        ...defaultValues,
                                        inventoryKind: "PART",
                                        name: prev.name,
                                        notes: prev.notes
                                    }));
                                }, className: `rounded-lg border px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${!isPrebuilt
                                    ? "border-indigo-500/60 bg-indigo-500/20 text-indigo-100"
                                    : "border-slate-600 bg-slate-950/70 text-slate-400 hover:bg-slate-800"}`, children: "Pieza suelta" }), _jsx("button", { type: "button", disabled: isEditMode || submitting, onClick: () => {
                                    setForm((prev) => ({
                                        ...defaultValues,
                                        inventoryKind: "PREBUILT_PC",
                                        manualSalePrice: true,
                                        name: prev.name,
                                        notes: prev.notes,
                                        salePrice: calculateSalePrice(prev.costPrice || 0, "USED"),
                                        condition: "USED"
                                    }));
                                }, className: `rounded-lg border px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${isPrebuilt
                                    ? "border-cyan-500/60 bg-cyan-500/20 text-cyan-100"
                                    : "border-slate-600 bg-slate-950/70 text-slate-400 hover:bg-slate-800"}`, children: "PC completo / premontado" })] }), isEditMode ? (_jsx("p", { className: "text-xs text-slate-500", children: "El tipo no se puede cambiar al editar; crea un articulo nuevo." })) : null] }), _jsxs("form", { onSubmit: handleSubmit, className: "grid grid-cols-1 gap-4 md:grid-cols-2", children: [_jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-2", children: ["Nombre", _jsx("input", { value: form.name, onChange: (event) => updateField("name", event.target.value), className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring", required: true })] }), isPrebuilt ? (_jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-2", children: ["Descripcion / componentes incluidos", _jsx("textarea", { value: form.description, onChange: (event) => updateField("description", event.target.value), rows: 4, placeholder: "CPU, RAM, GPU, almacenamiento, torre, Windows...", className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 placeholder:text-slate-500 focus:border-indigo-400 focus:ring" })] })) : null, !isPrebuilt ? (_jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Categoria", _jsx("select", { value: form.category, onChange: (event) => {
                                    const cat = event.target.value;
                                    setForm((prev) => {
                                        const next = { ...prev, category: cat };
                                        if (isNonStockCategory(cat)) {
                                            return {
                                                ...next,
                                                stock: 0,
                                                manualSalePrice: true,
                                                condition: OS_PART_CONDITION
                                            };
                                        }
                                        const wasNonStock = isNonStockCategory(prev.category);
                                        return {
                                            ...next,
                                            stock: prev.stock < 1 ? 1 : prev.stock,
                                            condition: wasNonStock ? "USED" : prev.condition
                                        };
                                    });
                                }, className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring", children: PART_CATEGORIES.map((category) => (_jsx("option", { value: category, children: partCategoryLabel(category) }, category))) })] })) : null, !isPrebuilt && isNonStockCategory(form.category) ? (_jsx("p", { className: "text-sm text-slate-400", children: "Sin estado aplicable (se guarda internamente como licencia nueva)." })) : (_jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Estado", _jsx("select", { value: form.condition, onChange: (event) => updateField("condition", event.target.value), className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring", children: PART_CONDITIONS.map((condition) => (_jsx("option", { value: condition, children: condition }, condition))) })] })), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Precio coste", _jsx("input", { type: "number", min: 0, step: "0.01", value: form.costPrice === 0 ? "" : form.costPrice, onChange: (event) => {
                                    const raw = event.target.value;
                                    if (raw === "") {
                                        updateField("costPrice", 0);
                                        return;
                                    }
                                    const n = Number(raw);
                                    if (!Number.isNaN(n)) {
                                        updateField("costPrice", n);
                                    }
                                }, className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring" })] }), _jsxs("div", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: [_jsx("span", { children: "Precio venta estimado (EUR)" }), _jsx("input", { id: "part-sale-price", type: "number", min: 0, step: "0.01", value: isPrebuilt || form.manualSalePrice
                                    ? form.salePrice === 0
                                        ? ""
                                        : form.salePrice
                                    : calculatedSalePrice.toFixed(2), readOnly: !isPrebuilt && !form.manualSalePrice, onChange: (event) => {
                                    const raw = event.target.value;
                                    if (raw === "") {
                                        updateField("salePrice", 0);
                                        return;
                                    }
                                    const n = Number(raw);
                                    if (!Number.isNaN(n)) {
                                        updateField("salePrice", n);
                                    }
                                }, className: `rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring ${isPrebuilt || form.manualSalePrice ? "bg-slate-950/70" : "cursor-not-allowed bg-slate-950/50 text-slate-400"}` }), isPrebuilt ? (_jsxs("span", { className: "text-xs font-normal text-slate-400", children: ["Referencia por coste y estado: ", referenceSalePrebuilt.toFixed(2), " EUR (puedes fijar otro valor)."] })) : (_jsxs("label", { className: "mt-1 flex cursor-pointer items-center gap-2 text-xs font-normal text-slate-300", children: [_jsx("input", { type: "checkbox", checked: form.manualSalePrice, onChange: (event) => {
                                            const checked = event.target.checked;
                                            setForm((prev) => ({
                                                ...prev,
                                                manualSalePrice: checked,
                                                salePrice: checked
                                                    ? prev.salePrice
                                                    : calculateSalePrice(prev.costPrice || 0, conditionForPricing(prev.category, prev.condition))
                                            }));
                                        }, className: "h-4 w-4 shrink-0 rounded border-slate-600 bg-slate-950 text-indigo-500 focus:ring-indigo-400" }), "Introducir precio de venta manualmente"] })), !isPrebuilt ? (_jsx("span", { className: "text-xs font-normal text-slate-400", children: form.manualSalePrice
                                    ? `Referencia calculada: ${calculatedSalePrice.toFixed(2)} EUR${isNonStockCategory(form.category) ? " (margen tipo nuevo)." : " (segun coste y estado)."}`
                                    : isNonStockCategory(form.category)
                                        ? "Calculado segun coste (margen tipo nuevo)."
                                        : "Calculado automaticamente segun estado y coste." })) : null] }), !isPrebuilt && isNonStockCategory(form.category) ? (_jsx("p", { className: "text-sm text-slate-400 md:col-span-2", children: "Sin stock: define solo costes y precio de venta (licencia, mano de obra, etc.)." })) : (_jsxs("label", { className: "flex flex-col gap-1.5 text-sm font-medium text-slate-200 md:col-span-2", children: ["Stock", _jsxs("div", { className: "flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3", children: [_jsxs("label", { className: "flex min-w-0 shrink-0 flex-col gap-1 text-xs font-normal text-slate-400 sm:w-44", children: ["Rapido (1 a 5)", _jsxs("select", { value: STOCK_QUICK_OPTIONS.includes(form.stock) ? String(form.stock) : "", onChange: (event) => {
                                                    const v = event.target.value;
                                                    if (v === "")
                                                        return;
                                                    updateField("stock", Number(v));
                                                }, className: "min-h-[42px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring", children: [_jsx("option", { value: "", children: "Elegir..." }), STOCK_QUICK_OPTIONS.map((n) => (_jsx("option", { value: n, children: n }, n)))] })] }), _jsxs("label", { className: "flex min-w-0 flex-1 flex-col gap-1 text-xs font-normal text-slate-400", children: ["Cantidad (manual)", _jsx("input", { type: "number", min: 0, step: "1", value: form.stock, onChange: (event) => updateField("stock", Number(event.target.value)), className: "min-h-[42px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring", required: true })] })] })] })), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-2", children: ["Notas", _jsx("textarea", { value: form.notes, onChange: (event) => updateField("notes", event.target.value), rows: 3, className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 placeholder:text-slate-500 focus:border-indigo-400 focus:ring", placeholder: "Incidencias, embalaje, garantia..." })] }), _jsx("div", { className: "md:col-span-2", children: _jsx("button", { type: "submit", disabled: submitting, className: "rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50", children: submitting ? "Guardando..." : isEditMode ? "Guardar cambios" : isPrebuilt ? "Registrar PC" : "Crear pieza" }) })] })] }));
}
