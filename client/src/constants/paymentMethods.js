export const PAYMENT_METHOD_OPTIONS = ["Efectivo", "Bizum", "Transferencia"];
export function isStandardPaymentMethod(value) {
    return PAYMENT_METHOD_OPTIONS.includes(value);
}
