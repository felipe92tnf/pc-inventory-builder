import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import * as salesApi from "../../api/sales";
import { PRIMARY_ACTION_BUTTON } from "../../theme/actionButtons";
import { SECTION_SHELL } from "../../theme/layoutDensity";
export function RegisterSaleForm({ buildId, suggestedSalePrice, disabled, onSuccess, variant = "card", submitLabel }) {
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [customerEmail, setCustomerEmail] = useState("");
    const [finalPrice, setFinalPrice] = useState(() => suggestedSalePrice.toFixed(2));
    const [paymentMethod, setPaymentMethod] = useState("");
    const [warrantyMonths, setWarrantyMonths] = useState("");
    const [notes, setNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);
    useEffect(() => {
        setFinalPrice(suggestedSalePrice.toFixed(2));
    }, [suggestedSalePrice]);
    const handleSubmit = async (event) => {
        event.preventDefault();
        const name = customerName.trim();
        const phone = customerPhone.trim();
        if (!name || !phone) {
            window.alert("Nombre y telefono del cliente son obligatorios.");
            return;
        }
        const normalized = Number(finalPrice.replace(",", ".").trim());
        if (!Number.isFinite(normalized) || normalized < 0) {
            window.alert("Introduce un precio de venta valido.");
            return;
        }
        const payload = {
            customerName: name,
            customerPhone: phone,
            customerEmail: customerEmail.trim() ? customerEmail.trim() : undefined,
            finalSalePrice: Math.round(normalized * 100) / 100,
            paymentMethod: paymentMethod.trim() ? paymentMethod.trim() : undefined,
            warrantyMonths: warrantyMonths.trim() === "" ? undefined : Math.max(0, parseInt(warrantyMonths, 10) || 0),
            notes: notes.trim() ? notes.trim() : undefined
        };
        setSubmitting(true);
        try {
            const sale = await salesApi.createSaleFromBuild(buildId, payload);
            onSuccess(sale);
        }
        catch (err) {
            window.alert(err instanceof Error ? err.message : "No se pudo registrar la venta.");
        }
        finally {
            setSubmitting(false);
        }
    };
    const form = (_jsxs("form", { onSubmit: handleSubmit, className: "grid grid-cols-1 gap-4 md:grid-cols-2", children: [_jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-2", children: ["Nombre del cliente", _jsx("input", { value: customerName, onChange: (e) => setCustomerName(e.target.value), disabled: disabled || submitting, required: true, className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring disabled:opacity-50" })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Telefono", _jsx("input", { value: customerPhone, onChange: (e) => setCustomerPhone(e.target.value), disabled: disabled || submitting, required: true, className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring disabled:opacity-50" })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Email (opcional)", _jsx("input", { type: "email", value: customerEmail, onChange: (e) => setCustomerEmail(e.target.value), disabled: disabled || submitting, className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring disabled:opacity-50" })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Precio final de venta (EUR)", _jsx("input", { value: finalPrice, onChange: (e) => setFinalPrice(e.target.value), disabled: disabled || submitting, inputMode: "decimal", className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring disabled:opacity-50" }), _jsxs("span", { className: "text-xs font-normal text-slate-500", children: ["Por defecto: precio de venta del montaje (", suggestedSalePrice.toFixed(2), " EUR)."] })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Metodo de pago (opcional)", _jsx("input", { value: paymentMethod, onChange: (e) => setPaymentMethod(e.target.value), disabled: disabled || submitting, placeholder: "Efectivo, transferencia, Bizum...", className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 placeholder:text-slate-500 focus:border-indigo-400 focus:ring disabled:opacity-50" })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Garantia (meses, opcional)", _jsx("input", { type: "number", min: 0, step: 1, value: warrantyMonths, onChange: (e) => setWarrantyMonths(e.target.value), disabled: disabled || submitting, className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring disabled:opacity-50" })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-2", children: ["Notas (opcional)", _jsx("textarea", { value: notes, onChange: (e) => setNotes(e.target.value), disabled: disabled || submitting, rows: 2, className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 placeholder:text-slate-500 focus:border-indigo-400 focus:ring disabled:opacity-50" })] }), _jsx("div", { className: "md:col-span-2", children: _jsx("button", { type: "submit", disabled: disabled || submitting, className: PRIMARY_ACTION_BUTTON, children: submitting ? "Registrando..." : submitLabel ?? "Registrar venta" }) })] }));
    if (variant === "plain") {
        return form;
    }
    return (_jsxs("section", { className: SECTION_SHELL, children: [_jsx("h2", { className: "text-lg font-semibold text-slate-100", children: "Registrar venta" }), _jsx("p", { className: "mt-1 text-sm text-slate-400", children: "El montaje esta ensamblado. Completa los datos del cliente y confirma el precio final de venta." }), _jsx("div", { className: "mt-3", children: form })] }));
}
