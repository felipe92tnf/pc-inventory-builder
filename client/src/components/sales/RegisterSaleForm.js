import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import * as salesApi from "../../api/sales";
import { CustomerPicker } from "../customers/CustomerPicker";
import { PaymentMethodSelect } from "../ui/PaymentMethodSelect";
import { PRIMARY_ACTION_BUTTON } from "../../theme/actionButtons";
import { SECTION_SHELL } from "../../theme/layoutDensity";
export function RegisterSaleForm({ buildId, suggestedSalePrice, amountAlreadyPaid = 0, disabled, onSuccess, variant = "card", submitLabel, offerPendingPickup = false, defaultCustomer }) {
    const [customerFields, setCustomerFields] = useState(() => ({
        customerId: defaultCustomer?.customerId ?? null,
        customerName: defaultCustomer?.customerName?.trim() ?? "",
        customerPhone: defaultCustomer?.customerPhone?.trim() ?? "",
        customerEmail: defaultCustomer?.customerEmail?.trim() ?? ""
    }));
    const [finalPrice, setFinalPrice] = useState(() => suggestedSalePrice.toFixed(2));
    const [paymentMethod, setPaymentMethod] = useState("");
    const [warrantyMonths, setWarrantyMonths] = useState("");
    const [notes, setNotes] = useState("");
    const [pendingPickup, setPendingPickup] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const paidShown = Math.max(0, Math.round(amountAlreadyPaid * 100) / 100);
    const pendingShown = Math.max(0, Math.round((suggestedSalePrice - paidShown) * 100) / 100);
    useEffect(() => {
        setFinalPrice(suggestedSalePrice.toFixed(2));
        setPendingPickup(false);
    }, [suggestedSalePrice]);
    const handleSubmit = async (event) => {
        event.preventDefault();
        const name = customerFields.customerName.trim();
        const phone = customerFields.customerPhone.trim();
        if (!name || !phone) {
            window.alert("Nombre y telefono del cliente son obligatorios.");
            return;
        }
        const normalized = Number(finalPrice.replace(",", ".").trim());
        if (!Number.isFinite(normalized) || normalized < 0) {
            window.alert("Introduce un precio de venta valido.");
            return;
        }
        const warrantyRaw = warrantyMonths.trim();
        const warrantyParsed = warrantyRaw === "" ? null : Math.max(0, Number.parseInt(warrantyRaw, 10) || 0);
        const payload = {
            customerId: customerFields.customerId ?? null,
            customerName: name,
            customerPhone: phone,
            customerEmail: customerFields.customerEmail.trim() ? customerFields.customerEmail.trim() : null,
            finalSalePrice: Math.round(normalized * 100) / 100,
            paymentMethod: paymentMethod.trim() ? paymentMethod.trim() : null,
            warrantyMonths: warrantyParsed,
            notes: notes.trim() ? notes.trim() : null,
            ...(pendingPickup ? { pendingPickup: true } : {})
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
    const form = (_jsxs("form", { onSubmit: handleSubmit, className: "grid grid-cols-1 gap-4 md:grid-cols-2", children: [_jsx("div", { className: "md:col-span-2", children: _jsx(CustomerPicker, { value: customerFields, onChange: setCustomerFields, requirePhone: true }) }), paidShown > 0.005 ? (_jsxs("div", { className: "rounded-lg border border-cyan-800/50 bg-cyan-950/25 px-3 py-2 text-sm text-cyan-100/90 md:col-span-2", children: [_jsxs("p", { children: [_jsx("span", { className: "font-medium text-cyan-100", children: "Precio total del montaje:" }), " ", suggestedSalePrice.toFixed(2), " EUR"] }), _jsxs("p", { className: "mt-1", children: [_jsx("span", { className: "font-medium text-cyan-100", children: "Ya cobrado (reserva/anticipo):" }), " ", paidShown.toFixed(2), " EUR \u00B7", " ", _jsx("span", { className: "font-medium text-cyan-100", children: "Pendiente al cobrar:" }), " ", pendingShown.toFixed(2), " EUR"] }), _jsx("p", { className: "mt-1 text-xs text-cyan-200/70", children: "El precio de venta registrado es el total del montaje; la reserva no lo reduce." })] })) : null, _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Precio total de venta (EUR)", _jsx("input", { value: finalPrice, onChange: (e) => setFinalPrice(e.target.value), disabled: disabled || submitting, inputMode: "decimal", className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring disabled:opacity-50" }), _jsx("span", { className: "text-xs font-normal text-slate-500", children: paidShown > 0.005
                            ? `Total del montaje (${suggestedSalePrice.toFixed(2)} EUR). Editable si acordaste otro importe final.`
                            : `Por defecto: precio de venta del montaje (${suggestedSalePrice.toFixed(2)} EUR).` })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Metodo de pago (opcional)", _jsx(PaymentMethodSelect, { value: paymentMethod, onChange: setPaymentMethod, disabled: disabled || submitting, className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring disabled:opacity-50" })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Garantia (meses, opcional)", _jsx("input", { type: "number", min: 0, step: 1, value: warrantyMonths, onChange: (e) => setWarrantyMonths(e.target.value), disabled: disabled || submitting, className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring disabled:opacity-50" })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-2", children: ["Notas (opcional)", _jsx("textarea", { value: notes, onChange: (e) => setNotes(e.target.value), disabled: disabled || submitting, rows: 2, className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 placeholder:text-slate-500 focus:border-indigo-400 focus:ring disabled:opacity-50" })] }), offerPendingPickup ? (_jsxs("label", { className: "flex cursor-pointer items-start gap-2 text-sm text-slate-300 md:col-span-2", children: [_jsx("input", { type: "checkbox", checked: pendingPickup, onChange: (e) => setPendingPickup(e.target.checked), disabled: disabled || submitting, className: "mt-1 h-4 w-4 rounded border-slate-600 bg-slate-950 text-indigo-500 focus:ring-indigo-400" }), _jsxs("span", { children: [_jsx("span", { className: "font-medium text-slate-200", children: "Cobrado, pendiente de recogida" }), _jsx("span", { className: "mt-0.5 block text-xs text-slate-500", children: "El ingreso cuenta en ventas; el PC no aparecera en \"PCs entregados\" hasta confirmar la recogida." })] })] })) : null, _jsx("div", { className: "md:col-span-2", children: _jsx("button", { type: "submit", disabled: disabled || submitting, className: PRIMARY_ACTION_BUTTON, children: submitting ? "Registrando..." : submitLabel ?? "Registrar venta" }) })] }));
    if (variant === "plain") {
        return form;
    }
    return (_jsxs("section", { className: SECTION_SHELL, children: [_jsx("h2", { className: "text-lg font-semibold text-slate-100", children: "Registrar venta" }), _jsx("p", { className: "mt-1 text-sm text-slate-400", children: "El montaje esta ensamblado. Completa los datos del cliente y confirma el precio final de venta." }), _jsx("div", { className: "mt-3", children: form })] }));
}
