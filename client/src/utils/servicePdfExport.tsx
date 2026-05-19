import type { ServiceRow } from "../types/service";

export function slugForServicePdfFilename(title: string): string {
  const slug = title
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug.slice(0, 48) || "servicio";
}

export async function downloadServicePdf(service: ServiceRow): Promise<void> {
  const [{ pdf }, { ServicePdfDocument }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("../components/services/ServicePdfDocument")
  ]);
  const blob = await pdf(<ServicePdfDocument service={service} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `servicio-${slugForServicePdfFilename(service.title)}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
