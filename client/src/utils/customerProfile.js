/** Misma logica que el servidor (`customers.lookup.ts`) para enlaces estables. */
export function normalizePhoneDigits(phone) {
    return (phone ?? "").replace(/\D/g, "");
}
export function normalizeNameKey(name) {
    return name.trim().toLowerCase().replace(/\s+/g, " ");
}
export function buildCustomerLookupKey(displayName, displayPhone) {
    return `${normalizePhoneDigits(displayPhone)}::${normalizeNameKey(displayName)}`;
}
/** Ruta de ficha por id (preferido) o query legacy. */
export function customerProfilePath(customerName, customerPhone, customerId) {
    if (customerId)
        return `/customers/${customerId}`;
    const params = new URLSearchParams();
    params.set("name", customerName.trim());
    params.set("phone", (customerPhone ?? "").trim());
    return `/customers?${params.toString()}`;
}
