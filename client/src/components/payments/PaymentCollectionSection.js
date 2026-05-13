import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { COLLECTION_PAYMENT_LABELS } from "../../types/collectionPayment";
import { StatusBadge, collectionPaymentVariant } from "../ui/StatusBadge";
import { PRIMARY_ACTION_BUTTON, SECONDARY_BUTTON_SM } from "../../theme/actionButtons";
import { SUMMARY_CARD_GRID_THREE, SUMMARY_CARD_LABEL, SUMMARY_CARD_SHELL, SUMMARY_VALUE_NEUTRAL, SUMMARY_VALUE_REVENUE } from "../../theme/summaryCards";
import { SECTION_SHELL } from "../../theme/layoutDensity";
function money(n) {
    return `${n.toFixed(2)} EUR`;
}
export function PaymentCollectionSection({ totalAmount, paidAmount, remainingAmount, paymentStatus, saving, onRegisterPayment, onMarkOverdue }) {
    const [amountStr, setAmountStr] = useState("");
    const canRegister = remainingAmount > 0.005;
    const handleSubmit = async (event) => {
        event.preventDefault();
        const n = Number(amountStr.replace(",", ".").trim());
        if (!Number.isFinite(n) || n <= 0) {
            window.alert("Introduce un importe valido.");
            return;
        }
        await onRegisterPayment(Math.round(n * 100) / 100);
        setAmountStr("");
    };
    return (_jsxs("section", { className: SECTION_SHELL, children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [_jsx("h2", { className: "text-lg font-semibold text-slate-100", children: "Cobro al cliente" }), _jsx(StatusBadge, { variant: collectionPaymentVariant(paymentStatus), size: "detail", children: COLLECTION_PAYMENT_LABELS[paymentStatus] })] }), _jsx("p", { className: "mt-1 text-sm text-slate-400", children: "Total de la operacion, lo ya cobrado y lo que queda pendiente." }), _jsxs("div", { className: `${SUMMARY_CARD_GRID_THREE} mt-3`, children: [_jsxs("article", { className: SUMMARY_CARD_SHELL, children: [_jsx("p", { className: SUMMARY_CARD_LABEL, children: "Total" }), _jsx("p", { className: SUMMARY_VALUE_REVENUE, children: money(totalAmount) })] }), _jsxs("article", { className: SUMMARY_CARD_SHELL, children: [_jsx("p", { className: SUMMARY_CARD_LABEL, children: "Pagado" }), _jsx("p", { className: SUMMARY_VALUE_NEUTRAL, children: money(paidAmount) })] }), _jsxs("article", { className: SUMMARY_CARD_SHELL, children: [_jsx("p", { className: SUMMARY_CARD_LABEL, children: "Pendiente" }), _jsx("p", { className: remainingAmount > 0.005 ? "text-lg font-semibold text-amber-200" : SUMMARY_VALUE_NEUTRAL, children: money(remainingAmount) })] })] }), _jsxs("form", { onSubmit: (e) => void handleSubmit(e), className: "mt-4 flex flex-wrap items-end gap-2", children: [_jsxs("label", { className: "flex min-w-[180px] flex-1 flex-col gap-1 text-sm font-medium text-slate-200", children: ["Importe a registrar (EUR)", _jsx("input", { value: amountStr, onChange: (e) => setAmountStr(e.target.value), disabled: saving || !canRegister, inputMode: "decimal", placeholder: canRegister ? "Ej: 50" : "—", className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring disabled:opacity-50" })] }), _jsx("button", { type: "submit", disabled: saving || !canRegister, className: PRIMARY_ACTION_BUTTON, children: saving ? "Guardando..." : "Registrar pago" })] }), onMarkOverdue && paymentStatus !== "PAID" ? (_jsx("div", { className: "mt-3 flex flex-wrap gap-2 border-t border-slate-800 pt-3", children: paymentStatus !== "OVERDUE" ? (_jsx("button", { type: "button", disabled: saving, onClick: () => {
                        void onMarkOverdue(true);
                    }, className: SECONDARY_BUTTON_SM, children: "Marcar atrasado" })) : (_jsx("button", { type: "button", disabled: saving, onClick: () => {
                        void onMarkOverdue(false);
                    }, className: SECONDARY_BUTTON_SM, children: "Quitar atrasado" })) })) : null] }));
}
