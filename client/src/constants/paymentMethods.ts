export const PAYMENT_METHOD_OPTIONS = ["Efectivo", "Bizum", "Transferencia"] as const;

export type PaymentMethodOption = (typeof PAYMENT_METHOD_OPTIONS)[number];

export function isStandardPaymentMethod(value: string): value is PaymentMethodOption {
  return (PAYMENT_METHOD_OPTIONS as readonly string[]).includes(value);
}
