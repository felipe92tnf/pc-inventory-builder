export const HOME_DELIVERY_LINE_KEY = "__home_delivery__";
export const DEFAULT_HOME_DELIVERY_SALE = 20;
export const HOME_DELIVERY_LABEL = "Desplazamiento a domicilio";
export function newConceptLine(partial) {
    return {
        clientKey: partial?.clientKey ?? crypto.randomUUID(),
        name: partial?.name ?? "",
        quantity: partial?.quantity ?? 1,
        unitCost: partial?.unitCost ?? 0,
        unitSalePrice: partial?.unitSalePrice ?? 0
    };
}
export function lineTotal(line) {
    const q = Number.isFinite(line.quantity) ? line.quantity : 0;
    return Math.round(line.unitSalePrice * q * 100) / 100;
}
export function linesSaleTotal(lines) {
    return Math.round(lines.reduce((sum, l) => sum + lineTotal(l), 0) * 100) / 100;
}
export function linesCostTotal(lines) {
    return Math.round(lines.reduce((sum, l) => sum + l.unitCost * (Number.isFinite(l.quantity) ? l.quantity : 0), 0) * 100) / 100;
}
export function isHomeDeliveryLine(line) {
    return line.clientKey === HOME_DELIVERY_LINE_KEY;
}
export function ensureHomeDeliveryLine(lines, enabled, unitSale = DEFAULT_HOME_DELIVERY_SALE) {
    const without = lines.filter((l) => !isHomeDeliveryLine(l));
    if (!enabled)
        return without;
    return [
        ...without,
        newConceptLine({
            clientKey: HOME_DELIVERY_LINE_KEY,
            name: HOME_DELIVERY_LABEL,
            quantity: 1,
            unitCost: 0,
            unitSalePrice: unitSale
        })
    ];
}
export function conceptLinesToPayload(lines) {
    return lines
        .filter((l) => l.name.trim().length > 0)
        .map((l) => ({
        name: l.name.trim(),
        description: "",
        quantity: Math.max(1, Math.floor(l.quantity)),
        unitCost: Math.max(0, l.unitCost),
        unitSalePrice: Math.max(0, l.unitSalePrice)
    }));
}
export function extraRowsToTemplatePayload(rows) {
    return rows;
}
export function linesFromService(service) {
    const manual = (service.extraLines ?? []).filter((l) => l.extraTemplateId == null);
    if (manual.length > 0) {
        return manual.map((l) => rowToDraft(l));
    }
    const sup = Number(service.homeServiceSupplement ?? 0);
    const sale = Number(service.salePrice);
    const cost = Number(service.costPrice);
    const title = (service.title ?? "").trim();
    if (sale > 0 || cost > 0 || title.length > 0) {
        const draft = newConceptLine({
            name: title || "Servicio",
            quantity: 1,
            unitCost: Math.max(0, cost - sup),
            unitSalePrice: Math.max(0, sale - sup)
        });
        if (sup > 0 && service.isHomeService) {
            return ensureHomeDeliveryLine([draft], true, sup);
        }
        return [draft];
    }
    return [newConceptLine()];
}
function rowToDraft(l) {
    const name = (l.name ?? "").trim();
    const description = l.description ?? "";
    const isHome = name.toLowerCase() === HOME_DELIVERY_LABEL.toLowerCase() ||
        description.includes(HOME_DELIVERY_LINE_KEY);
    return newConceptLine({
        clientKey: isHome ? HOME_DELIVERY_LINE_KEY : l.id,
        name,
        quantity: l.quantity,
        unitCost: Number(l.unitCost),
        unitSalePrice: Number(l.unitSalePrice)
    });
}
export function templateLinesFromService(service) {
    return (service.extraLines ?? []).filter((l) => l.extraTemplateId != null);
}
