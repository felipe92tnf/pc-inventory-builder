import type { CustomerFieldValue } from "../types/customer";

/** Marcador mínimo para APIs que exigen nombre/teléfono al crear sin cliente aún. */
export const API_EMPTY_CUSTOMER_MARKER = "\u200B";

const UNSET_LITERALS = new Set(["por definir", "-", "—", "–", "\u200b"]);

export function isUnsetCustomerValue(value: string | null | undefined): boolean {
  const t = (value ?? "").trim().toLowerCase();
  if (!t) return true;
  return UNSET_LITERALS.has(t);
}

/** Valor de formulario: vacío si era placeholder o marcador API. */
export function customerFieldToForm(value: string | null | undefined): string {
  return isUnsetCustomerValue(value) ? "" : String(value ?? "").trim();
}

/** Subtítulo bajo título (nombre · teléfono); null si no hay datos reales. */
export function formatCustomerSubtitle(
  name: string | null | undefined,
  phone: string | null | undefined
): string | null {
  const n = customerFieldToForm(name);
  const p = customerFieldToForm(phone);
  if (!n && !p) return null;
  return [n, p].filter(Boolean).join(" · ");
}

export function displayCustomerLabel(value: string | null | undefined): string {
  const n = customerFieldToForm(value);
  return n || "—";
}

export function customerFieldsToApi(
  fields: Pick<CustomerFieldValue, "customerId" | "customerName" | "customerPhone">
): {
  customerId: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: null;
} {
  const name = fields.customerName.trim();
  const phone = fields.customerPhone.trim();
  return {
    customerId: fields.customerId,
    customerName: name || API_EMPTY_CUSTOMER_MARKER,
    customerPhone: phone || API_EMPTY_CUSTOMER_MARKER,
    customerEmail: null
  };
}
