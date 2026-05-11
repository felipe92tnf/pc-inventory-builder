import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { Cpu, PackageSearch } from "lucide-react";
import { OS_PART_CONDITION, PART_CATEGORIES, PART_CONDITIONS, isNonStockCategory, partCategoryLabel } from "../../types/part";
import { calculateSalePrice } from "../../utils/pricing";
const STOCK_QUICK_OPTIONS = [1, 2, 3, 4, 5];
const PREBUILT_DESCRIPTION_TEMPLATE = `CPU:
GPU:
RAM:
PSU:
PLACA:
ALMACENAMIENTO:
CASE:
COOLER:
OTRO:`;
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
                description: selectedPart.description?.trim()
                    ? selectedPart.description
                    : PREBUILT_DESCRIPTION_TEMPLATE
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
        if (form.manualSalePrice)
            return;
        setForm((prev) => ({
            ...prev,
            salePrice: calculateSalePrice(prev.costPrice || 0, prev.inventoryKind === "PREBUILT_PC"
                ? prev.condition
                : conditionForPricing(prev.category, prev.condition))
        }));
    }, [form.costPrice, form.condition, form.category, form.inventoryKind, form.manualSalePrice]);
    const calculatedSalePrice = useMemo(() => calculateSalePrice(form.costPrice || 0, conditionForPricing(form.category, form.condition)), [form.costPrice, form.category, form.condition]);
    const referenceSalePrebuilt = useMemo(() => calculateSalePrice(form.costPrice || 0, form.condition), [form.costPrice, form.condition]);
    const autoSalePrice = isPrebuilt ? referenceSalePrebuilt : calculatedSalePrice;
    const activeSalePrice = form.manualSalePrice ? form.salePrice : autoSalePrice;
    const estimatedProfit = activeSalePrice - form.costPrice;
    const estimatedMargin = form.costPrice > 0 ? (estimatedProfit / form.costPrice) * 100 : 0;
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
    return (_jsxs("section", { className: `rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg shadow-slate-950/40 backdrop-blur ${className}`.trim(), children: [_jsxs("div", { className: "mb-4 flex items-center justify-between", children: [_jsx("h2", { className: "text-lg font-semibold text-slate-100", children: formTitle }), isEditMode ? (_jsx("button", { type: "button", onClick: onCancelEdit, className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-1.5 text-sm font-medium text-slate-200 transition hover:bg-slate-800", children: "Cancelar" })) : null] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-5", children: [_jsxs("section", { className: "space-y-3 rounded-xl border border-slate-800/90 bg-slate-950/30 p-4", children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-wide text-slate-400", children: "Tipo de articulo" }), _jsxs("div", { className: "grid grid-cols-1 gap-3 sm:grid-cols-2", children: [_jsxs("button", { type: "button", disabled: isEditMode || submitting, onClick: () => {
                                            setForm((prev) => ({
                                                ...defaultValues,
                                                inventoryKind: "PART",
                                                name: prev.name,
                                                notes: prev.notes
                                            }));
                                        }, className: `group rounded-xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${!isPrebuilt
                                            ? "border-indigo-400/70 bg-indigo-500/15 shadow-[0_0_0_1px_rgba(129,140,248,0.3)]"
                                            : "border-slate-700 bg-slate-950/80 hover:border-slate-500"}`, children: [_jsxs("div", { className: "mb-2 flex items-center gap-2", children: [_jsx(PackageSearch, { className: `h-5 w-5 ${!isPrebuilt ? "text-indigo-300" : "text-slate-400"}` }), _jsx("h3", { className: "text-sm font-semibold text-slate-100", children: "Pieza suelta" })] }), _jsx("p", { className: "text-xs text-slate-400", children: "Componentes individuales con categor\u00EDa, stock y precio din\u00E1mico." })] }), _jsxs("button", { type: "button", disabled: isEditMode || submitting, onClick: () => {
                                            setForm((prev) => ({
                                                ...defaultValues,
                                                inventoryKind: "PREBUILT_PC",
                                                manualSalePrice: true,
                                                name: prev.name,
                                                notes: prev.notes,
                                                description: PREBUILT_DESCRIPTION_TEMPLATE,
                                                salePrice: calculateSalePrice(prev.costPrice || 0, "USED"),
                                                condition: "USED"
                                            }));
                                        }, className: `group rounded-xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${isPrebuilt
                                            ? "border-cyan-400/70 bg-cyan-500/15 shadow-[0_0_0_1px_rgba(34,211,238,0.3)]"
                                            : "border-slate-700 bg-slate-950/80 hover:border-slate-500"}`, children: [_jsxs("div", { className: "mb-2 flex items-center gap-2", children: [_jsx(Cpu, { className: `h-5 w-5 ${isPrebuilt ? "text-cyan-300" : "text-slate-400"}` }), _jsx("h3", { className: "text-sm font-semibold text-slate-100", children: "PC completo / premontado" })] }), _jsx("p", { className: "text-xs text-slate-400", children: "Equipos terminados con descripci\u00F3n de componentes y stock por unidad." })] })] }), isEditMode ? (_jsx("p", { className: "text-xs text-slate-500", children: "El tipo no se puede cambiar al editar; crea un art\u00EDculo nuevo." })) : null] }), _jsxs("div", { className: "grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_280px] xl:items-start", children: [_jsxs("div", { className: "space-y-4", children: [_jsxs("section", { className: "rounded-xl border border-slate-800/90 bg-slate-950/30 p-4", children: [_jsx("p", { className: "mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400", children: "Informacion basica" }), _jsxs("div", { className: "grid grid-cols-1 gap-3 md:grid-cols-2", children: [_jsxs("label", { className: `flex flex-col gap-1 text-sm font-medium text-slate-200 ${isPrebuilt ? "md:col-span-2" : ""}`, children: [isPrebuilt ? "Nombre del PC" : "Nombre", _jsx("input", { value: form.name, onChange: (event) => updateField("name", event.target.value), className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring", required: true })] }), !isPrebuilt ? (_jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Categoria", _jsx("select", { value: form.category, onChange: (event) => {
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
                                                                }, className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring", children: PART_CATEGORIES.map((category) => (_jsx("option", { value: category, children: partCategoryLabel(category) }, category))) })] })) : null, !isPrebuilt && isNonStockCategory(form.category) ? (_jsx("p", { className: "self-end rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm text-slate-400", children: "Sin estado aplicable (se guarda internamente como licencia nueva)." })) : (_jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Estado", _jsx("select", { value: form.condition, onChange: (event) => updateField("condition", event.target.value), className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring", children: PART_CONDITIONS.map((condition) => (_jsx("option", { value: condition, children: condition }, condition))) })] })), isPrebuilt ? (_jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-2", children: ["Descripcion de componentes", _jsx("textarea", { value: form.description, onChange: (event) => updateField("description", event.target.value), rows: 5, placeholder: "CPU, RAM, GPU, almacenamiento, torre, Windows...", className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 placeholder:text-slate-500 focus:border-indigo-400 focus:ring" })] })) : null] })] }), _jsxs("section", { className: "rounded-xl border border-slate-800/90 bg-slate-950/30 p-4", children: [_jsx("p", { className: "mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400", children: "Precios y stock" }), _jsxs("div", { className: "grid grid-cols-1 gap-3 md:grid-cols-2", children: [_jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: [isPrebuilt ? "Precio coste total" : "Precio coste", _jsx("input", { type: "number", min: 0, step: "0.01", value: form.costPrice === 0 ? "" : form.costPrice, onChange: (event) => {
                                                                    const raw = event.target.value;
                                                                    if (raw === "") {
                                                                        updateField("costPrice", 0);
                                                                        return;
                                                                    }
                                                                    const n = Number(raw);
                                                                    if (!Number.isNaN(n)) {
                                                                        updateField("costPrice", n);
                                                                    }
                                                                }, className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring" })] }), _jsxs("div", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: [_jsx("span", { children: "Precio venta estimado (EUR)" }), _jsx("input", { id: "part-sale-price", type: "number", min: 0, step: "0.01", value: form.manualSalePrice ? (form.salePrice === 0 ? "" : form.salePrice) : autoSalePrice.toFixed(2), readOnly: !form.manualSalePrice, onChange: (event) => {
                                                                    const raw = event.target.value;
                                                                    if (raw === "") {
                                                                        updateField("salePrice", 0);
                                                                        return;
                                                                    }
                                                                    const n = Number(raw);
                                                                    if (!Number.isNaN(n)) {
                                                                        updateField("salePrice", n);
                                                                    }
                                                                }, className: `rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring ${form.manualSalePrice ? "bg-slate-950/70" : "cursor-not-allowed bg-slate-950/50 text-slate-400"}` }), _jsx("span", { className: "text-xs font-normal text-slate-400", children: "Calculado automaticamente segun estado y coste." }), _jsxs("label", { className: "mt-1 flex cursor-pointer items-center gap-2 text-xs font-normal text-slate-300", children: [_jsx("input", { type: "checkbox", checked: form.manualSalePrice, onChange: (event) => {
                                                                            const checked = event.target.checked;
                                                                            setForm((prev) => ({
                                                                                ...prev,
                                                                                manualSalePrice: checked,
                                                                                salePrice: checked
                                                                                    ? prev.salePrice
                                                                                    : calculateSalePrice(prev.costPrice || 0, prev.inventoryKind === "PREBUILT_PC"
                                                                                        ? prev.condition
                                                                                        : conditionForPricing(prev.category, prev.condition))
                                                                            }));
                                                                        }, className: "h-4 w-4 shrink-0 rounded border-slate-600 bg-slate-950 text-indigo-500 focus:ring-indigo-400" }), "Precio manual"] }), form.manualSalePrice ? (_jsx("span", { className: "text-xs font-normal text-amber-300/90", children: "Este precio no se recalcular\u00E1 autom\u00E1ticamente." })) : null] }), !isPrebuilt && isNonStockCategory(form.category) ? (_jsx("p", { className: "text-sm text-slate-400 md:col-span-2", children: "Sin stock: define solo costes y precio de venta (licencia, mano de obra, etc.)." })) : (_jsxs("label", { className: "flex flex-col gap-1.5 text-sm font-medium text-slate-200 md:col-span-2", children: ["Stock", _jsxs("div", { className: "grid grid-cols-1 gap-2 sm:grid-cols-2", children: [_jsxs("label", { className: "flex min-w-0 shrink-0 flex-col gap-1 text-xs font-normal text-slate-400", children: ["Stock rapido", _jsxs("select", { value: STOCK_QUICK_OPTIONS.includes(form.stock) ? String(form.stock) : "", onChange: (event) => {
                                                                                    const v = event.target.value;
                                                                                    if (v === "")
                                                                                        return;
                                                                                    updateField("stock", Number(v));
                                                                                }, className: "min-h-[42px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring", children: [_jsx("option", { value: "", children: "Elegir..." }), STOCK_QUICK_OPTIONS.map((n) => (_jsx("option", { value: n, children: n }, n)))] })] }), _jsxs("label", { className: "flex min-w-0 flex-col gap-1 text-xs font-normal text-slate-400", children: ["Cantidad manual", _jsx("input", { type: "number", min: 0, step: "1", value: form.stock, onChange: (event) => updateField("stock", Number(event.target.value)), className: "min-h-[42px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring", required: true })] })] })] }))] })] }), _jsxs("section", { className: "rounded-xl border border-slate-800/90 bg-slate-950/30 p-4", children: [_jsx("p", { className: "mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400", children: "Notas y detalles" }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Notas", _jsx("textarea", { value: form.notes, onChange: (event) => updateField("notes", event.target.value), rows: 3, className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 placeholder:text-slate-500 focus:border-indigo-400 focus:ring", placeholder: "Incidencias, embalaje, garantia..." })] })] })] }), _jsxs("aside", { className: "h-fit rounded-xl border border-slate-800/90 bg-slate-950/50 p-4 xl:sticky xl:top-3", children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-wide text-slate-400", children: "Resumen estimado" }), _jsxs("div", { className: "mt-3 space-y-2 text-sm", children: [_jsxs("div", { className: "flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2", children: [_jsx("span", { className: "text-slate-400", children: "Coste total" }), _jsxs("strong", { className: "text-slate-100", children: [form.costPrice.toFixed(2), " EUR"] })] }), _jsxs("div", { className: "flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2", children: [_jsx("span", { className: "text-slate-400", children: "Venta estimada" }), _jsxs("strong", { className: "text-emerald-300", children: [activeSalePrice.toFixed(2), " EUR"] })] }), _jsxs("div", { className: "flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2", children: [_jsx("span", { className: "text-slate-400", children: "Beneficio potencial" }), _jsxs("strong", { className: estimatedProfit >= 0 ? "text-emerald-300" : "text-rose-300", children: [estimatedProfit.toFixed(2), " EUR"] })] }), _jsxs("div", { className: "flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2", children: [_jsx("span", { className: "text-slate-400", children: "Margen %" }), _jsxs("strong", { className: estimatedMargin >= 0 ? "text-emerald-300" : "text-rose-300", children: [estimatedMargin.toFixed(1), "%"] })] })] })] })] }), _jsx("div", { className: "sticky bottom-2 z-10 rounded-xl border border-slate-800/90 bg-slate-900/90 p-3 backdrop-blur md:static md:border-0 md:bg-transparent md:p-0", children: _jsx("button", { type: "submit", disabled: submitting, className: "w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto", children: submitting ? "Guardando..." : isPrebuilt ? "Guardar PC completo" : "Guardar pieza" }) })] })] }));
}
