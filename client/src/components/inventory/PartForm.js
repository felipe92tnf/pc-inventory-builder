import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { PART_CATEGORIES, PART_CONDITIONS } from "../../types/part";
import { calculateSalePrice } from "../../utils/pricing";
const STOCK_QUICK_OPTIONS = [1, 2, 3, 4, 5];
const defaultValues = {
    name: "",
    category: "CPU",
    condition: "USED",
    costPrice: 0,
    stock: 1,
    notes: ""
};
function toNumber(value) {
    return Number(value);
}
export function PartForm({ selectedPart, onSubmit, onCancelEdit, submitting, className = "" }) {
    const [form, setForm] = useState(defaultValues);
    const isEditMode = useMemo(() => selectedPart !== null, [selectedPart]);
    useEffect(() => {
        if (!selectedPart) {
            setForm(defaultValues);
            return;
        }
        setForm({
            name: selectedPart.name,
            category: selectedPart.category,
            condition: selectedPart.condition,
            costPrice: toNumber(selectedPart.costPrice),
            stock: selectedPart.stock,
            notes: selectedPart.notes ?? ""
        });
    }, [selectedPart]);
    const calculatedSalePrice = useMemo(() => calculateSalePrice(form.costPrice || 0, form.condition), [form.costPrice, form.condition]);
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
    return (_jsxs("section", { className: `rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg shadow-slate-950/40 backdrop-blur ${className}`.trim(), children: [_jsxs("div", { className: "mb-4 flex items-center justify-between", children: [_jsx("h2", { className: "text-lg font-semibold text-slate-100", children: isEditMode ? "Editar pieza" : "Nueva pieza" }), isEditMode ? (_jsx("button", { type: "button", onClick: onCancelEdit, className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-1.5 text-sm font-medium text-slate-200 transition hover:bg-slate-800", children: "Cancelar" })) : null] }), _jsxs("form", { onSubmit: handleSubmit, className: "grid grid-cols-1 gap-4 md:grid-cols-2", children: [_jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-2", children: ["Nombre", _jsx("input", { value: form.name, onChange: (event) => updateField("name", event.target.value), className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring", required: true })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Categoria", _jsx("select", { value: form.category, onChange: (event) => updateField("category", event.target.value), className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring", children: PART_CATEGORIES.map((category) => (_jsx("option", { value: category, children: category }, category))) })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Estado", _jsx("select", { value: form.condition, onChange: (event) => updateField("condition", event.target.value), className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring", children: PART_CONDITIONS.map((condition) => (_jsx("option", { value: condition, children: condition }, condition))) })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Precio coste", _jsx("input", { type: "number", min: 0, step: "0.01", value: form.costPrice === 0 ? "" : form.costPrice, onChange: (event) => {
                                    const raw = event.target.value;
                                    if (raw === "") {
                                        updateField("costPrice", 0);
                                        return;
                                    }
                                    const n = Number(raw);
                                    if (!Number.isNaN(n)) {
                                        updateField("costPrice", n);
                                    }
                                }, className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring" })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Precio venta", _jsx("input", { type: "number", min: 0, step: "0.01", value: calculatedSalePrice.toFixed(2), readOnly: true, className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring" }), _jsx("span", { className: "text-xs text-slate-400", children: "Calculado automaticamente segun estado y coste." })] }), _jsxs("label", { className: "flex flex-col gap-1.5 text-sm font-medium text-slate-200 md:col-span-2", children: ["Stock", _jsxs("div", { className: "flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3", children: [_jsxs("label", { className: "flex min-w-0 shrink-0 flex-col gap-1 text-xs font-normal text-slate-400 sm:w-44", children: ["Rapido (1 a 5)", _jsxs("select", { value: STOCK_QUICK_OPTIONS.includes(form.stock)
                                                    ? String(form.stock)
                                                    : "", onChange: (event) => {
                                                    const v = event.target.value;
                                                    if (v === "")
                                                        return;
                                                    updateField("stock", Number(v));
                                                }, className: "min-h-[42px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring", children: [_jsx("option", { value: "", children: "Elegir..." }), STOCK_QUICK_OPTIONS.map((n) => (_jsx("option", { value: n, children: n }, n)))] })] }), _jsxs("label", { className: "flex min-w-0 flex-1 flex-col gap-1 text-xs font-normal text-slate-400", children: ["Cantidad (manual)", _jsx("input", { type: "number", min: 0, step: "1", value: form.stock, onChange: (event) => updateField("stock", Number(event.target.value)), className: "min-h-[42px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring", required: true })] })] }), _jsx("span", { className: "text-xs font-normal text-slate-500", children: "Usa el desplegable para 1\u20135 o escribe otro valor en el campo." })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-2", children: ["Notas", _jsx("textarea", { value: form.notes, onChange: (event) => updateField("notes", event.target.value), rows: 3, className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 placeholder:text-slate-500 focus:border-indigo-400 focus:ring", placeholder: "Estado estetico, pruebas, accesorios incluidos..." })] }), _jsx("div", { className: "md:col-span-2", children: _jsx("button", { type: "submit", disabled: submitting, className: "rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50", children: submitting ? "Guardando..." : isEditMode ? "Guardar cambios" : "Crear pieza" }) })] })] }));
}
