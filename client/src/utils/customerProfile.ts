/** Misma logica que el servidor (`customers.lookup.ts`) para enlaces estables. */
export function normalizePhoneDigits(phone: string | null | undefined): string {
  return (phone ?? "").replace(/\D/g, "");
}

export function normalizeNameKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export function buildCustomerLookupKey(displayName: string, displayPhone: string | null | undefined): string {
  return `${normalizePhoneDigits(displayPhone)}::${normalizeNameKey(displayName)}`;
}

/** Ruta de ficha por id (preferido) o query legacy. */
export function customerProfilePath(
  customerName: string,
  customerPhone: string | null | undefined,
  customerId?: string | null
): string {
  if (customerId) return `/customers/${customerId}`;
  const params = new URLSearchParams();
  params.set("name", customerName.trim());
  params.set("phone", (customerPhone ?? "").trim());
  return `/customers?${params.toString()}`;
}
