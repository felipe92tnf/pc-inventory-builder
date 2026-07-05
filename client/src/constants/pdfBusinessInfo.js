/**
 * Datos profesionales SecondByte en PDFs (presupuestos, montajes, servicios).
 */
export const PDF_BRAND_NAME = "SecondByte";
export const PDF_BRAND_SLOGAN = "Tecnología que te conecta";
export const PDF_BUSINESS_INFO = {
    ownerName: "Juan Felipe Luis Reyes",
    phone: "669726144",
    address: "Cmno la Cebada n14 1a"
};
/** Teléfono legible en documentos (669 726 144). */
export function formatPdfBusinessPhone(phone = PDF_BUSINESS_INFO.phone) {
    const digits = phone.replace(/\D/g, "");
    if (digits.length === 9) {
        return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    }
    return phone.trim();
}
/** Línea compacta para pie de PDF: nombre · teléfono · dirección. */
export function pdfBusinessContactFooterLine() {
    const { ownerName, address } = PDF_BUSINESS_INFO;
    return `${ownerName} · Tel. ${formatPdfBusinessPhone()} · ${address}`;
}
