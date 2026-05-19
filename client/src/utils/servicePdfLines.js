import { HOME_DELIVERY_LABEL } from "./serviceConceptLines";
function round2(n) {
    return Math.round(n * 100) / 100;
}
function spareRowsFromService(service) {
    if (service.sparePartLines?.length)
        return service.sparePartLines;
    if (service.selectedPart && service.selectedPartId && service.quantity) {
        return [
            {
                id: "legacy",
                serviceId: service.id,
                partId: service.selectedPartId,
                quantity: service.quantity,
                part: service.selectedPart
            }
        ];
    }
    return [];
}
function appendSpareLines(rows, service, piecesSale) {
    const spareRows = spareRowsFromService(service);
    if (spareRows.length === 0 || piecesSale <= 0)
        return;
    const totalQty = spareRows.reduce((sum, l) => sum + l.quantity, 0);
    if (totalQty < 1)
        return;
    let allocated = 0;
    spareRows.forEach((line, index) => {
        const isLast = index === spareRows.length - 1;
        const lineSale = isLast
            ? round2(piecesSale - allocated)
            : round2((piecesSale * line.quantity) / totalQty);
        allocated += lineSale;
        rows.push({
            key: `spare-${line.partId}-${index}`,
            name: line.part.name,
            quantity: line.quantity,
            lineSale
        });
    });
}
/** Líneas de concepto para el PDF cliente (solo precios de venta). */
export function serviceConceptLinesForPdf(service) {
    const rows = [];
    const extra = service.extraLines ?? [];
    for (const line of extra) {
        const qty = line.quantity;
        rows.push({
            key: line.id,
            name: line.name.trim() || "Concepto",
            quantity: qty,
            lineSale: round2(Number(line.unitSalePrice) * qty)
        });
    }
    const legacySup = Number(service.homeServiceSupplement ?? 0);
    if (legacySup > 0 &&
        service.isHomeService &&
        !rows.some((r) => r.name.toLowerCase() === HOME_DELIVERY_LABEL.toLowerCase())) {
        rows.push({
            key: "__legacy_home__",
            name: HOME_DELIVERY_LABEL,
            quantity: 1,
            lineSale: legacySup
        });
    }
    const linesFromExtras = rows.reduce((sum, r) => sum + r.lineSale, 0);
    const piecesSale = Math.max(0, round2(Number(service.salePrice) - linesFromExtras));
    if (rows.length === 0) {
        const spareRows = spareRowsFromService(service);
        if (spareRows.length > 0) {
            appendSpareLines(rows, service, Number(service.salePrice));
        }
        else {
            const mainSale = Math.max(0, round2(Number(service.salePrice) - legacySup));
            if (mainSale > 0 || legacySup === 0) {
                rows.push({
                    key: "legacy-main",
                    name: service.title.trim() || "Servicio",
                    quantity: 1,
                    lineSale: mainSale
                });
            }
            if (legacySup > 0) {
                rows.push({
                    key: "__legacy_home__",
                    name: HOME_DELIVERY_LABEL,
                    quantity: 1,
                    lineSale: legacySup
                });
            }
        }
        return rows;
    }
    appendSpareLines(rows, service, piecesSale);
    return rows;
}
