/** Normaliza telefono a solo digitos para emparejar filas. */
export function normalizePhoneDigits(phone: string | null | undefined): string {
  return (phone ?? "").replace(/\D/g, "");
}

/** Normaliza nombre para comparar (trim, minusculas, espacios colapsados). */
export function normalizeNameKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Clave unica para perfil de notas (debe coincidir con el cliente en `client/src/utils/customerProfile.ts`). */
export function buildCustomerLookupKey(displayName: string, displayPhone: string | null | undefined): string {
  return `${normalizePhoneDigits(displayPhone)}::${normalizeNameKey(displayName)}`;
}

export function matchesCustomerRow(
  rowName: string,
  rowPhone: string | null | undefined,
  queryName: string,
  queryPhone: string | null | undefined
): boolean {
  return (
    normalizeNameKey(rowName) === normalizeNameKey(queryName) &&
    normalizePhoneDigits(rowPhone) === normalizePhoneDigits(queryPhone)
  );
}
