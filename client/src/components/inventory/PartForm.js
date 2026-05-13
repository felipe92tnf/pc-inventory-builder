import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { Cpu, PackageSearch } from "lucide-react";
import { OS_PART_CONDITION, PART_CATEGORIES, PART_CONDITIONS, isNonStockCategory, partCategoryLabel } from "../../types/part";
import { calculateSalePrice } from "../../utils/pricing";
import { PRIMARY_ACTION_BUTTON, STICKY_PRIMARY_MOBILE_DOCK } from "../../theme/actionButtons";
import { SECTION_SHELL } from "../../theme/layoutDensity";
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
function FormCollapsibleSection({ narrow, sectionKey, title, open, onToggle, children, tone = "default" }) {
    const panelId = `part-form-section-${sectionKey}`;
    const shell = tone === "aside"
        ? "rounded-xl border border-slate-800/90 bg-slate-950/50"
        : "rounded-xl border border-slate-800/90 bg-slate-950/30";
    return (_jsx("section", { className: `${shell} ${narrow ? "overflow-hidden" : "p-4"}`, children: !narrow ? (_jsxs(_Fragment, { children: [_jsx("p", { className: "mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400", children: title }), children] })) : (_jsxs(_Fragment, { children: [_jsxs("button", { type: "button", className: "flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-slate-900/40 md:hidden", onClick: () => onToggle(sectionKey), "aria-expanded": open, "aria-controls": panelId, children: [_jsx("span", { className: "text-xs font-semibold uppercase tracking-wide text-slate-300", children: title }), _jsx("svg", { className: `h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`, fill: "none", viewBox: "0 0 24 24", strokeWidth: 2, stroke: "currentColor", "aria-hidden": true, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M19 9l-7 7-7-7" }) })] }), open ? (_jsx("div", { id: panelId, className: "border-t border-slate-800/90 p-4 md:hidden", children: children })) : null] })) }));
}
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
export function PartForm({ selectedPart, onSubmit, onCancelEdit, submitting, className = "", createInventoryKindDefault = "PART" }) {
    const [form, setForm] = useState(defaultValues);
    const [accordionOpen, setAccordionOpen] = useState({
        basic: true,
        pricing: false,
        notes: false,
        summary: false
    });
    const [isNarrowViewport, setIsNarrowViewport] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches);
    useEffect(() => {
        const mq = window.matchMedia("(max-width: 767px)");
        const apply = () => setIsNarrowViewport(mq.matches);
        apply();
        mq.addEventListener("change", apply);
        return () => mq.removeEventListener("change", apply);
    }, []);
    useEffect(() => {
        setAccordionOpen({
            basic: true,
            pricing: false,
            notes: false,
            summary: false
        });
    }, [selectedPart]);
    const toggleAccordion = (key) => {
        setAccordionOpen((prev) => ({ ...prev, [key]: !prev[key] }));
    };
    const isEditMode = useMemo(() => selectedPart !== null, [selectedPart]);
    const isPrebuilt = form.inventoryKind === "PREBUILT_PC";
    const hideInventoryKindPicker = !isEditMode && createInventoryKindDefault === "PREBUILT_PC";
    useEffect(() => {
        if (!selectedPart) {
            if (createInventoryKindDefault === "PREBUILT_PC") {
                setForm({
                    ...defaultValues,
                    inventoryKind: "PREBUILT_PC",
                    manualSalePrice: true,
                    description: PREBUILT_DESCRIPTION_TEMPLATE,
                    salePrice: calculateSalePrice(0, "USED"),
                    condition: "USED"
                });
            }
            else {
                setForm(defaultValues);
            }
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
    }, [selectedPart, createInventoryKindDefault]);
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
            if (createInventoryKindDefault === "PREBUILT_PC") {
                setForm({
                    ...defaultValues,
                    inventoryKind: "PREBUILT_PC",
                    manualSalePrice: true,
                    description: PREBUILT_DESCRIPTION_TEMPLATE,
                    salePrice: calculateSalePrice(0, "USED"),
                    condition: "USED"
                });
            }
            else {
                setForm(defaultValues);
            }
        }
    };
    const formTitle = isEditMode
        ? isPrebuilt
            ? "Editar PC completo"
            : "Editar pieza"
        : isPrebuilt
            ? "Nuevo PC completo"
            : "Nueva pieza";
    return (_jsxs("section", { className: `${SECTION_SHELL} backdrop-blur ${className}`.trim(), children: [_jsxs("div", { className: "mb-4 flex items-center justify-between", children: [_jsx("h2", { className: "text-lg font-semibold text-slate-100", children: formTitle }), isEditMode ? (_jsx("button", { type: "button", onClick: onCancelEdit, className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-1.5 text-sm font-medium text-slate-200 transition hover:bg-slate-800", children: "Cancelar" })) : null] }), _jsxs("form", { id: "inventory-part-form", onSubmit: handleSubmit, className: "max-md:pb-32 space-y-4", children: [!hideInventoryKindPicker ? (_jsxs("section", { className: "space-y-3 rounded-xl border border-slate-800/90 bg-slate-950/30 p-4", children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-wide text-slate-400", children: "Tipo de articulo" }), _jsxs("div", { className: "grid grid-cols-1 gap-3 sm:grid-cols-2", children: [_jsxs("button", { type: "button", disabled: isEditMode || submitting, onClick: () => {
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
                                            : "border-slate-700 bg-slate-950/80 hover:border-slate-500"}`, children: [_jsxs("div", { className: "mb-2 flex items-center gap-2", children: [_jsx(Cpu, { className: `h-5 w-5 ${isPrebuilt ? "text-cyan-300" : "text-slate-400"}` }), _jsx("h3", { className: "text-sm font-semibold text-slate-100", children: "PC completo / premontado" })] }), _jsx("p", { className: "text-xs text-slate-400", children: "Equipos terminados con descripci\u00F3n de componentes y stock por unidad." })] })] }), isEditMode ? (_jsx("p", { className: "text-xs text-slate-500", children: "El tipo no se puede cambiar al editar; crea un art\u00EDculo nuevo." })) : null] })) : (_jsxs("p", { className: "text-xs text-slate-500", children: ["Alta de ", _jsx("span", { className: "font-medium text-slate-300", children: "PC completo" }), " en inventario (sin plantilla de cat\u00E1logo)."] })), _jsxs("div", { className: "grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_280px] xl:items-start", children: [_jsxs("div", { className: "space-y-4", children: [_jsx(FormCollapsibleSection, { narrow: isNarrowViewport, sectionKey: "basic", title: "Informacion basica", open: accordionOpen.basic, onToggle: toggleAccordion, children: _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("label", { className: `col-span-2 flex flex-col gap-1 text-sm font-medium text-slate-200 ${isPrebuilt ? "md:col-span-2" : "md:col-span-1"}`, children: [isPrebuilt ? "Nombre del PC" : "Nombre", _jsx("input", { value: form.name, onChange: (event) => updateField("name", event.target.value), className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring", required: true })] }), !isPrebuilt ? (_jsxs("label", { className: "col-span-1 flex min-w-0 flex-col gap-1 text-sm font-medium text-slate-200", children: ["Categoria", _jsx("select", { value: form.category, onChange: (event) => {
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
                                                            }, className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring", children: PART_CATEGORIES.map((category) => (_jsx("option", { value: category, children: partCategoryLabel(category) }, category))) })] })) : null, !isPrebuilt && isNonStockCategory(form.category) ? (_jsx("p", { className: "col-span-2 rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm text-slate-400", children: "Sin estado aplicable (se guarda internamente como licencia nueva)." })) : (_jsxs("label", { className: `flex min-w-0 flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-1 ${isPrebuilt ? "col-span-2" : "col-span-1"}`, children: ["Estado", _jsx("select", { value: form.condition, onChange: (event) => updateField("condition", event.target.value), className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring", children: PART_CONDITIONS.map((condition) => (_jsx("option", { value: condition, children: condition }, condition))) })] })), isPrebuilt ? (_jsxs("label", { className: "col-span-2 flex flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-2", children: ["Descripcion de componentes", _jsx("textarea", { value: form.description, onChange: (event) => updateField("description", event.target.value), rows: 5, placeholder: "CPU, RAM, GPU, almacenamiento, torre, Windows...", className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 placeholder:text-slate-500 focus:border-indigo-400 focus:ring" })] })) : null] }) }), _jsxs("div", { className: "flex flex-col gap-4 sm:max-xl:grid sm:max-xl:grid-cols-2 sm:max-xl:items-stretch sm:max-xl:gap-3 xl:flex xl:flex-col xl:gap-4", children: [_jsx(FormCollapsibleSection, { narrow: isNarrowViewport, sectionKey: "pricing", title: "Precios y stock", open: accordionOpen.pricing, onToggle: toggleAccordion, children: _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("label", { className: "flex min-w-0 flex-col gap-1 text-sm font-medium text-slate-200", children: [isPrebuilt ? "Precio de coste total" : "Precio de coste", _jsx("input", { type: "number", min: 0, step: "0.01", value: form.costPrice === 0 ? "" : form.costPrice, onChange: (event) => {
                                                                        const raw = event.target.value;
                                                                        if (raw === "") {
                                                                            updateField("costPrice", 0);
                                                                            return;
                                                                        }
                                                                        const n = Number(raw);
                                                                        if (!Number.isNaN(n)) {
                                                                            updateField("costPrice", n);
                                                                        }
                                                                    }, className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring" })] }), _jsxs("div", { className: "flex min-w-0 flex-col gap-1 text-sm font-medium text-slate-200", children: [_jsx("span", { children: "Precio de venta estimado" }), _jsx("input", { id: "part-sale-price", type: "number", min: 0, step: "0.01", value: form.manualSalePrice ? (form.salePrice === 0 ? "" : form.salePrice) : autoSalePrice.toFixed(2), readOnly: !form.manualSalePrice, onChange: (event) => {
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
                                                                            }, className: "h-4 w-4 shrink-0 rounded border-slate-600 bg-slate-950 text-indigo-500 focus:ring-indigo-400" }), "Precio manual"] }), form.manualSalePrice ? (_jsx("span", { className: "text-xs font-normal text-amber-300/90", children: "Este precio no se recalcular\u00E1 autom\u00E1ticamente." })) : null] }), !isPrebuilt && isNonStockCategory(form.category) ? (_jsx("p", { className: "col-span-2 text-sm text-slate-400", children: "Sin stock: define solo costes y precio de venta (licencia, mano de obra, etc.)." })) : (_jsxs("label", { className: "col-span-2 flex flex-col gap-1.5 text-sm font-medium text-slate-200", children: ["Stock", _jsxs("div", { className: "grid grid-cols-2 gap-2", children: [_jsxs("label", { className: "flex min-w-0 shrink-0 flex-col gap-1 text-xs font-normal text-slate-400", children: ["Stock rapido", _jsxs("select", { value: STOCK_QUICK_OPTIONS.includes(form.stock) ? String(form.stock) : "", onChange: (event) => {
                                                                                        const v = event.target.value;
                                                                                        if (v === "")
                                                                                            return;
                                                                                        updateField("stock", Number(v));
                                                                                    }, className: "min-h-[42px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring", children: [_jsx("option", { value: "", children: "Elegir..." }), STOCK_QUICK_OPTIONS.map((n) => (_jsx("option", { value: n, children: n }, n)))] })] }), _jsxs("label", { className: "flex min-w-0 flex-col gap-1 text-xs font-normal text-slate-400", children: ["Stock manual", _jsx("input", { type: "number", min: 0, step: "1", value: form.stock, onChange: (event) => updateField("stock", Number(event.target.value)), className: "min-h-[42px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring", required: true })] })] })] }))] }) }), _jsx(FormCollapsibleSection, { narrow: isNarrowViewport, sectionKey: "notes", title: "Notas y detalles", open: accordionOpen.notes, onToggle: toggleAccordion, children: _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Notas", _jsx("textarea", { value: form.notes, onChange: (event) => updateField("notes", event.target.value), rows: 3, className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 placeholder:text-slate-500 focus:border-indigo-400 focus:ring", placeholder: "Incidencias, embalaje, garantia..." })] }) })] })] }), _jsx("aside", { className: "h-fit min-w-0 xl:sticky xl:top-3", children: _jsx(FormCollapsibleSection, { narrow: isNarrowViewport, sectionKey: "summary", title: "Resumen estimado", open: accordionOpen.summary, onToggle: toggleAccordion, tone: "aside", children: _jsxs("div", { className: "grid grid-cols-1 gap-2 text-sm sm:max-xl:grid-cols-2 sm:max-xl:gap-2 md:mt-3 xl:grid-cols-1", children: [_jsxs("div", { className: "flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2", children: [_jsx("span", { className: "text-slate-400", children: "Coste total" }), _jsxs("strong", { className: "text-slate-100", children: [form.costPrice.toFixed(2), " EUR"] })] }), _jsxs("div", { className: "flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2", children: [_jsx("span", { className: "text-slate-400", children: "Venta estimada" }), _jsxs("strong", { className: "text-emerald-300", children: [activeSalePrice.toFixed(2), " EUR"] })] }), _jsxs("div", { className: "flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2", children: [_jsx("span", { className: "text-slate-400", children: "Beneficio potencial" }), _jsxs("strong", { className: estimatedProfit >= 0 ? "text-emerald-300" : "text-rose-300", children: [estimatedProfit.toFixed(2), " EUR"] })] }), _jsxs("div", { className: "flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2", children: [_jsx("span", { className: "text-slate-400", children: "Margen %" }), _jsxs("strong", { className: estimatedMargin >= 0 ? "text-emerald-300" : "text-rose-300", children: [estimatedMargin.toFixed(1), "%"] })] })] }) }) })] }), _jsx("div", { className: "max-md:hidden", children: _jsx("button", { type: "submit", disabled: submitting, className: PRIMARY_ACTION_BUTTON, children: submitting ? "Guardando..." : isPrebuilt ? "Guardar PC completo" : "Guardar pieza" }) })] }), _jsx("div", { className: STICKY_PRIMARY_MOBILE_DOCK, children: _jsx("button", { type: "submit", form: "inventory-part-form", disabled: submitting, className: PRIMARY_ACTION_BUTTON, children: submitting ? "Guardando..." : isPrebuilt ? "Guardar PC completo" : "Guardar pieza" }) })] }));
}
