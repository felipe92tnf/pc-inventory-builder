import { jsx as _jsx } from "react/jsx-runtime";
export function slugForServicePdfFilename(title) {
    const slug = title
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{M}/gu, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    return slug.slice(0, 48) || "servicio";
}
export async function downloadServicePdf(service) {
    const [{ pdf }, { ServicePdfDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("../components/services/ServicePdfDocument")
    ]);
    const blob = await pdf(_jsx(ServicePdfDocument, { service: service })).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `servicio-${slugForServicePdfFilename(service.title)}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
}
