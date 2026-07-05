import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { PAYMENT_METHOD_OPTIONS, isStandardPaymentMethod } from "../../constants/paymentMethods";
const DEFAULT_CLASS = "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring disabled:opacity-50";
export function PaymentMethodSelect({ value, onChange, disabled, className, id }) {
    const trimmed = value.trim();
    const selectValue = trimmed === "" ? "" : isStandardPaymentMethod(trimmed) ? trimmed : value;
    const showLegacy = trimmed !== "" && !isStandardPaymentMethod(trimmed);
    return (_jsxs("select", { id: id, value: selectValue, onChange: (e) => onChange(e.target.value), disabled: disabled, className: className ?? DEFAULT_CLASS, children: [_jsx("option", { value: "", children: "Sin especificar" }), PAYMENT_METHOD_OPTIONS.map((opt) => (_jsx("option", { value: opt, children: opt }, opt))), showLegacy ? (_jsxs("option", { value: value, children: [trimmed, " (registrado antes)"] })) : null] }));
}
