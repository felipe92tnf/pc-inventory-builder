import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { PDF_BRAND_NAME, PDF_BRAND_SLOGAN, pdfBusinessContactFooterLine } from "../../constants/pdfBusinessInfo";
import { quotePaymentDueTotal, quotePaymentRemaining } from "../../utils/quotePayment";
/** Nombre comercial mostrado en el PDF del presupuesto. */
export const QUOTE_PDF_BUSINESS_NAME = PDF_BRAND_NAME;
/**
 * Líneas de producto en la primera página junto a resumen y notas.
 * Si hay más, se listan en una segunda página (solo tabla).
 */
export const QUOTE_PDF_FIRST_PAGE_MAX_ITEMS = 12;
const NOTES_MAX_CHARS = 300;
const palette = {
    navy: "#0c1a3a",
    navyMid: "#132a5c",
    cyan: "#22d3ee",
    purple: "#7c3aed",
    purpleSoft: "#a78bfa",
    ink: "#0f172a",
    muted: "#64748b",
    mutedLight: "#94a3b8",
    border: "#e2e8f0",
    borderStrong: "#cbd5e1",
    pageBg: "#ffffff",
    rowAlt: "#f4f6f9",
    panelBg: "#f8fafc",
    white: "#ffffff",
    rule: "#cbd5e1"
};
const styles = StyleSheet.create({
    page: {
        paddingTop: 18,
        paddingBottom: 56,
        paddingHorizontal: 28,
        fontFamily: "Helvetica",
        fontSize: 8,
        color: palette.ink,
        backgroundColor: palette.pageBg
    },
    pageContinuation: {
        paddingTop: 18,
        paddingBottom: 52,
        paddingHorizontal: 28,
        fontFamily: "Helvetica",
        fontSize: 8,
        color: palette.ink,
        backgroundColor: palette.pageBg
    },
    accentTop: {
        height: 3,
        backgroundColor: palette.cyan,
        marginHorizontal: -28,
        marginTop: -18
    },
    headerBand: {
        flexDirection: "row",
        alignItems: "center",
        marginHorizontal: -28,
        paddingLeft: 28,
        paddingRight: 28,
        paddingVertical: 11,
        backgroundColor: palette.navy
    },
    headerLeft: {
        flexDirection: "row",
        alignItems: "center",
        flexGrow: 1,
        flexShrink: 1,
        gap: 10
    },
    logoMark: {
        width: 34,
        height: 34,
        flexDirection: "row",
        borderRadius: 8,
        overflow: "hidden"
    },
    logoStripe: {
        width: 4,
        backgroundColor: palette.cyan
    },
    logoCore: {
        flex: 1,
        backgroundColor: palette.navyMid,
        justifyContent: "center",
        alignItems: "center",
        borderRightWidth: 3,
        borderRightColor: palette.purple
    },
    logoText: {
        fontSize: 12,
        fontFamily: "Helvetica-Bold",
        color: palette.white,
        letterSpacing: 0.6
    },
    brandBlock: {
        flexShrink: 1,
        justifyContent: "center"
    },
    brandName: {
        fontSize: 15,
        fontFamily: "Helvetica-Bold",
        color: palette.white,
        letterSpacing: 0.35
    },
    brandSlogan: {
        fontSize: 7.5,
        color: palette.cyan,
        letterSpacing: 0.45,
        marginTop: 3,
        lineHeight: 1.25
    },
    headerDocCol: {
        alignItems: "flex-end",
        justifyContent: "center",
        paddingLeft: 12
    },
    docKind: {
        fontSize: 12,
        fontFamily: "Helvetica-Bold",
        color: palette.white,
        letterSpacing: 1.1
    },
    docKindSub: {
        fontSize: 6.5,
        color: palette.purpleSoft,
        letterSpacing: 0.5,
        marginTop: 3
    },
    headerBottomLine: {
        height: 2,
        backgroundColor: palette.purple,
        marginHorizontal: -28,
        marginBottom: 8,
        opacity: 0.9
    },
    sectionRule: {
        height: 1,
        backgroundColor: palette.rule,
        marginVertical: 8,
        opacity: 0.85
    },
    subjectLine: {
        fontSize: 8,
        color: palette.muted,
        marginBottom: 10,
        paddingVertical: 5,
        paddingHorizontal: 10,
        backgroundColor: palette.panelBg,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: palette.border,
        lineHeight: 1.35
    },
    subjectStrong: {
        fontFamily: "Helvetica-Bold",
        color: palette.navy
    },
    infoRow: {
        flexDirection: "row",
        gap: 10,
        alignItems: "stretch",
        marginBottom: 10
    },
    clientCard: {
        flex: 1,
        minWidth: "46%",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: palette.borderStrong,
        paddingVertical: 11,
        paddingHorizontal: 12,
        backgroundColor: palette.panelBg,
        borderLeftWidth: 4,
        borderLeftColor: palette.cyan
    },
    metaCard: {
        flex: 1,
        minWidth: "46%",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: palette.borderStrong,
        paddingVertical: 11,
        paddingHorizontal: 12,
        backgroundColor: palette.panelBg,
        borderLeftWidth: 4,
        borderLeftColor: palette.purple
    },
    cardTitle: {
        fontSize: 7,
        fontFamily: "Helvetica-Bold",
        color: palette.navy,
        textTransform: "uppercase",
        letterSpacing: 0.8,
        marginBottom: 8,
        paddingBottom: 5,
        borderBottomWidth: 1,
        borderBottomColor: palette.border
    },
    infoLine: {
        flexDirection: "row",
        marginBottom: 6,
        alignItems: "flex-start"
    },
    infoLineLast: {
        marginBottom: 0
    },
    infoLabel: {
        width: "32%",
        fontSize: 7,
        fontFamily: "Helvetica-Bold",
        color: palette.muted,
        textTransform: "uppercase",
        letterSpacing: 0.35
    },
    infoValue: {
        flex: 1,
        fontSize: 8.5,
        color: palette.ink,
        lineHeight: 1.3
    },
    tableSectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 6,
        marginTop: 2,
        paddingBottom: 4,
        borderBottomWidth: 1,
        borderBottomColor: palette.borderStrong
    },
    tableSectionTitle: {
        fontSize: 10,
        fontFamily: "Helvetica-Bold",
        color: palette.navy,
        letterSpacing: 0.3
    },
    tableSectionAccent: {
        width: 3,
        height: 14,
        backgroundColor: palette.cyan,
        borderRadius: 2,
        marginRight: 8
    },
    tableOuter: {
        borderWidth: 1,
        borderColor: palette.borderStrong,
        borderRadius: 8,
        overflow: "hidden",
        marginBottom: 10
    },
    tableHeader: {
        flexDirection: "row",
        backgroundColor: palette.navy,
        paddingVertical: 7,
        paddingHorizontal: 9,
        borderBottomWidth: 2,
        borderBottomColor: palette.cyan
    },
    th: {
        fontSize: 7,
        fontFamily: "Helvetica-Bold",
        color: palette.white,
        textTransform: "uppercase",
        letterSpacing: 0.4
    },
    tableRow: {
        flexDirection: "row",
        paddingVertical: 6,
        paddingHorizontal: 9,
        borderBottomWidth: 1,
        borderBottomColor: palette.border
    },
    tableRowAlt: {
        backgroundColor: palette.rowAlt
    },
    tableRowLast: {
        borderBottomWidth: 0
    },
    td: {
        fontSize: 8,
        color: palette.ink,
        lineHeight: 1.28
    },
    colProduct: { width: "20%" },
    colDesc: { width: "30%" },
    colQty: { width: "10%", textAlign: "right" },
    colUnit: { width: "18%", textAlign: "right" },
    colTotal: { width: "22%", textAlign: "right" },
    emptyHint: {
        fontSize: 8,
        color: palette.muted,
        paddingVertical: 16,
        textAlign: "center"
    },
    continuationNote: {
        paddingVertical: 7,
        paddingHorizontal: 9,
        backgroundColor: "#fffbeb",
        borderTopWidth: 1,
        borderTopColor: palette.borderStrong
    },
    continuationText: {
        fontSize: 7.5,
        color: palette.ink,
        lineHeight: 1.35
    },
    bottomRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
        marginBottom: 6
    },
    notesColumn: {
        width: "50%",
        flexShrink: 1
    },
    summaryColumn: {
        width: "46%",
        alignSelf: "stretch"
    },
    notesCard: {
        borderRadius: 8,
        borderWidth: 1,
        borderColor: palette.borderStrong,
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: palette.white,
        borderTopWidth: 3,
        borderTopColor: palette.navyMid
    },
    notesTitle: {
        fontSize: 8,
        fontFamily: "Helvetica-Bold",
        marginBottom: 6,
        color: palette.navy,
        letterSpacing: 0.2
    },
    notesBody: {
        fontSize: 7.5,
        color: palette.ink,
        lineHeight: 1.4
    },
    summaryCard: {
        borderRadius: 8,
        borderWidth: 1,
        borderColor: palette.borderStrong,
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: palette.white,
        borderLeftWidth: 4,
        borderLeftColor: palette.cyan,
        alignSelf: "flex-end",
        width: "100%",
        maxWidth: 280
    },
    summaryCardTitle: {
        fontSize: 8,
        fontFamily: "Helvetica-Bold",
        color: palette.navy,
        marginBottom: 8,
        paddingBottom: 5,
        borderBottomWidth: 1,
        borderBottomColor: palette.border,
        letterSpacing: 0.25
    },
    summaryInner: {
        marginBottom: 4
    },
    summaryRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 6,
        paddingBottom: 5,
        borderBottomWidth: 1,
        borderBottomColor: palette.border
    },
    summaryRowLast: {
        borderBottomWidth: 0,
        marginBottom: 0,
        paddingBottom: 0
    },
    summaryLabel: {
        fontSize: 8,
        color: palette.muted
    },
    summaryValue: {
        fontSize: 8,
        fontFamily: "Helvetica-Bold",
        color: palette.ink
    },
    grandBox: {
        marginTop: 6,
        flexDirection: "row",
        borderRadius: 6,
        overflow: "hidden",
        backgroundColor: palette.navy
    },
    grandAccent: {
        width: 4,
        backgroundColor: palette.cyan
    },
    grandInner: {
        flex: 1,
        paddingVertical: 9,
        paddingHorizontal: 11,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center"
    },
    grandLabel: {
        fontSize: 9,
        fontFamily: "Helvetica-Bold",
        color: palette.white,
        letterSpacing: 0.6
    },
    grandHint: {
        fontSize: 6,
        color: palette.purpleSoft,
        marginTop: 2
    },
    grandValue: {
        fontSize: 12,
        fontFamily: "Helvetica-Bold",
        color: palette.cyan
    },
    footer: {
        position: "absolute",
        left: 28,
        right: 28,
        bottom: 14,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: palette.borderStrong
    },
    footerTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 5
    },
    footerBrand: {
        fontSize: 8,
        fontFamily: "Helvetica-Bold",
        color: palette.navy,
        letterSpacing: 0.2
    },
    footerPage: {
        fontSize: 7.5,
        color: palette.muted
    },
    footerLine2: {
        fontSize: 6.5,
        color: palette.muted,
        lineHeight: 1.35
    },
    footerLine3: {
        fontSize: 6,
        color: palette.mutedLight,
        marginTop: 3,
        lineHeight: 1.3
    },
    contMiniHeader: {
        marginBottom: 10,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: palette.borderStrong
    },
    contMiniTitle: {
        fontSize: 11,
        fontFamily: "Helvetica-Bold",
        color: palette.navy
    },
    contMiniSub: {
        fontSize: 7,
        color: palette.muted,
        marginTop: 2
    }
});
const STATUS_LABELS = {
    DRAFT: "Borrador",
    SENT: "Enviado",
    ACCEPTED: "Aceptado",
    REJECTED: "Rechazado",
    EXPIRED: "Caducado",
    PENDING_PAYMENT: "Pendiente de pago"
};
function formatDateEs(iso) {
    if (!iso)
        return "—";
    try {
        return new Date(iso).toLocaleDateString("es-ES", { dateStyle: "medium" });
    }
    catch {
        return "—";
    }
}
function coerceNumber(value) {
    if (value == null)
        return 0;
    if (typeof value === "number")
        return Number.isFinite(value) ? value : 0;
    const n = parseFloat(String(value));
    return Number.isFinite(n) ? n : 0;
}
function formatMoney(n) {
    return `${coerceNumber(n).toFixed(2)} EUR`;
}
function dashIfEmpty(s) {
    if (s == null || String(s).trim() === "")
        return "—";
    return String(s).trim();
}
function truncateForPdf(s, maxChars) {
    const t = s.trim();
    if (t.length <= maxChars)
        return t;
    return `${t.slice(0, maxChars - 1)}…`;
}
function SecondByteLogoMark() {
    return (_jsxs(View, { style: styles.logoMark, children: [_jsx(View, { style: styles.logoStripe }), _jsx(View, { style: styles.logoCore, children: _jsx(Text, { style: styles.logoText, children: "SB" }) })] }));
}
function InfoLine({ label, value, isLast = false }) {
    return (_jsxs(View, { style: [styles.infoLine, ...(isLast ? [styles.infoLineLast] : [])], children: [_jsx(Text, { style: styles.infoLabel, children: label }), _jsx(Text, { style: styles.infoValue, children: value })] }));
}
function TableHeaderRow() {
    return (_jsxs(View, { style: styles.tableHeader, wrap: false, children: [_jsx(Text, { style: [styles.th, styles.colProduct], children: "Producto" }), _jsx(Text, { style: [styles.th, styles.colDesc], children: "Descripci\u00F3n" }), _jsx(Text, { style: [styles.th, styles.colQty], children: "Cant." }), _jsx(Text, { style: [styles.th, styles.colUnit], children: "P. unit." }), _jsx(Text, { style: [styles.th, styles.colTotal], children: "Total" })] }));
}
function TableDataRows({ rows, startIndex, isLastSegment }) {
    return (_jsx(_Fragment, { children: rows.map((item, index) => {
            const globalIndex = startIndex + index;
            const isLast = isLastSegment && index === rows.length - 1;
            const zebra = globalIndex % 2 === 1;
            return (_jsxs(View, { wrap: false, minPresenceAhead: 44, style: [styles.tableRow, ...(zebra ? [styles.tableRowAlt] : []), ...(isLast ? [styles.tableRowLast] : [])], children: [_jsx(Text, { style: [styles.td, styles.colProduct], wrap: true, children: item.name }), _jsx(Text, { style: [styles.td, styles.colDesc], wrap: true, children: dashIfEmpty(item.description) }), _jsx(Text, { style: [styles.td, styles.colQty], children: item.quantity }), _jsx(Text, { style: [styles.td, styles.colUnit], children: formatMoney(item.unitSalePrice) }), _jsx(Text, { style: [styles.td, styles.colTotal], children: formatMoney(item.total) })] }, item.id));
        }) }));
}
function SummaryAndNotesBlock({ quote, showTax, taxRate, taxAmt, notesPdf }) {
    return (_jsxs(View, { style: styles.bottomRow, wrap: false, children: [_jsx(View, { style: styles.notesColumn, children: _jsxs(View, { style: styles.notesCard, children: [_jsx(Text, { style: styles.notesTitle, children: "Notas" }), _jsx(Text, { style: styles.notesBody, children: notesPdf })] }) }), _jsx(View, { style: styles.summaryColumn, children: _jsxs(View, { style: styles.summaryCard, children: [_jsx(Text, { style: styles.summaryCardTitle, children: "Resumen econ\u00F3mico" }), _jsxs(View, { style: styles.summaryInner, children: [_jsxs(View, { style: styles.summaryRow, children: [_jsx(Text, { style: styles.summaryLabel, children: "Subtotal" }), _jsx(Text, { style: styles.summaryValue, children: formatMoney(quote.subtotal) })] }), _jsxs(View, { style: [styles.summaryRow, ...(!showTax ? [styles.summaryRowLast] : [])], children: [_jsx(Text, { style: styles.summaryLabel, children: "Descuento" }), _jsx(Text, { style: styles.summaryValue, children: formatMoney(quote.discountAmount) })] }), showTax ? (_jsxs(View, { style: [styles.summaryRow, styles.summaryRowLast], children: [_jsxs(Text, { style: styles.summaryLabel, children: ["IVA", taxRate != null && taxRate > 0 ? ` (${taxRate.toFixed(0)} %)` : ""] }), _jsx(Text, { style: styles.summaryValue, children: formatMoney(taxAmt) })] })) : null] }), _jsxs(View, { style: styles.grandBox, children: [_jsx(View, { style: styles.grandAccent }), _jsxs(View, { style: styles.grandInner, children: [_jsxs(View, { children: [_jsx(Text, { style: styles.grandLabel, children: "TOTAL" }), _jsx(Text, { style: styles.grandHint, children: "Importe final presupuestado" })] }), _jsx(Text, { style: styles.grandValue, children: formatMoney(quote.total) })] })] }), quote.status === "PENDING_PAYMENT" ? (_jsxs(View, { style: { marginTop: 8, paddingTop: 6, borderTopWidth: 1, borderTopColor: palette.borderStrong }, children: [_jsx(Text, { style: { fontSize: 8, color: palette.navy, fontFamily: "Helvetica-Bold" }, children: "Estado de cobro" }), _jsxs(View, { style: { marginTop: 4, gap: 3 }, children: [_jsxs(Text, { style: { fontSize: 7, color: palette.muted }, children: ["Total a cobrar: ", formatMoney(quotePaymentDueTotal(quote)), " \u00B7 Pagado:", " ", formatMoney(quote.amountPaid ?? 0), " \u00B7 Pendiente: ", formatMoney(quotePaymentRemaining(quote))] }), quote.paymentDate ? (_jsxs(Text, { style: { fontSize: 7, color: palette.muted }, children: ["D\u00EDa de pago: ", formatDateEs(quote.paymentDate)] })) : null] })] })) : null] }) })] }));
}
function FooterBlock({ quote }) {
    return (_jsxs(View, { style: styles.footer, fixed: true, children: [_jsxs(View, { style: styles.footerTop, children: [_jsx(Text, { style: styles.footerBrand, children: QUOTE_PDF_BUSINESS_NAME }), _jsx(Text, { style: styles.footerPage, render: ({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}` })] }), _jsx(Text, { style: styles.footerLine2, children: pdfBusinessContactFooterLine() }), _jsxs(Text, { style: styles.footerLine3, children: ["Documento informativo, no factura. Precios y plazos sujetos a disponibilidad", quote.validUntil ? ` · Válido hasta ${formatDateEs(quote.validUntil)}` : "", "."] })] }));
}
export function QuotePdfDocument({ quote }) {
    const items = quote.items ?? [];
    const firstPageItems = items.slice(0, QUOTE_PDF_FIRST_PAGE_MAX_ITEMS);
    const restItems = items.slice(QUOTE_PDF_FIRST_PAGE_MAX_ITEMS);
    const remainingCount = restItems.length;
    const address = quote.customerAddress?.trim();
    const taxAmt = coerceNumber(quote.taxAmount);
    const showTax = taxAmt > 0;
    const taxRate = quote.taxRatePercent != null ? coerceNumber(quote.taxRatePercent) : null;
    const notesPdf = truncateForPdf(quote.notes?.trim() ? quote.notes.trim() : "—", NOTES_MAX_CHARS);
    const clientRows = [
        { label: "Nombre", value: dashIfEmpty(quote.customerName) },
        { label: "Teléfono", value: dashIfEmpty(quote.customerPhone) },
    ];
    if (address) {
        clientRows.push({ label: "Dirección", value: address });
    }
    const metaRows = [
        { label: "Presupuesto", value: `#${quote.quoteNumber}` },
        { label: "Emisión", value: formatDateEs(quote.createdAt) },
        { label: "Válido hasta", value: formatDateEs(quote.validUntil) },
        { label: "Estado", value: STATUS_LABELS[quote.status] }
    ];
    const sharedHeader = (_jsxs(_Fragment, { children: [_jsx(View, { style: styles.accentTop, fixed: true }), _jsxs(View, { style: styles.headerBand, wrap: false, children: [_jsxs(View, { style: styles.headerLeft, children: [_jsx(SecondByteLogoMark, {}), _jsxs(View, { style: styles.brandBlock, children: [_jsx(Text, { style: styles.brandName, children: QUOTE_PDF_BUSINESS_NAME }), _jsx(Text, { style: styles.brandSlogan, children: PDF_BRAND_SLOGAN })] })] }), _jsxs(View, { style: styles.headerDocCol, children: [_jsx(Text, { style: styles.docKind, children: "PRESUPUESTO" }), _jsx(Text, { style: styles.docKindSub, children: "Hardware \u00B7 servicio" })] })] }), _jsx(View, { style: styles.headerBottomLine, wrap: false })] }));
    return (_jsxs(Document, { title: `Presupuesto ${quote.quoteNumber}`, author: QUOTE_PDF_BUSINESS_NAME, children: [_jsxs(Page, { size: "A4", style: styles.page, children: [sharedHeader, _jsxs(Text, { style: styles.subjectLine, wrap: false, children: [_jsx(Text, { style: styles.subjectStrong, children: "Asunto: " }), dashIfEmpty(quote.title)] }), _jsxs(View, { style: styles.infoRow, wrap: false, children: [_jsxs(View, { style: styles.clientCard, children: [_jsx(Text, { style: styles.cardTitle, children: "Cliente" }), clientRows.map((row, i) => (_jsx(InfoLine, { label: row.label, value: row.value, isLast: i === clientRows.length - 1 }, row.label)))] }), _jsxs(View, { style: styles.metaCard, children: [_jsx(Text, { style: styles.cardTitle, children: "Datos del presupuesto" }), metaRows.map((row, i) => (_jsx(InfoLine, { label: row.label, value: row.value, isLast: i === metaRows.length - 1 }, row.label)))] })] }), _jsx(View, { style: styles.sectionRule }), _jsxs(View, { style: styles.tableSectionHeader, wrap: false, children: [_jsx(View, { style: styles.tableSectionAccent }), _jsx(Text, { style: styles.tableSectionTitle, children: "Productos" })] }), _jsxs(View, { style: styles.tableOuter, children: [_jsx(TableHeaderRow, {}), items.length === 0 ? (_jsx(View, { style: { paddingHorizontal: 9 }, children: _jsx(Text, { style: styles.emptyHint, children: "No hay l\u00EDneas en este presupuesto." }) })) : (_jsxs(_Fragment, { children: [_jsx(TableDataRows, { rows: firstPageItems, startIndex: 0, isLastSegment: remainingCount === 0 }), remainingCount > 0 ? (_jsx(View, { style: styles.continuationNote, wrap: false, children: _jsxs(Text, { style: styles.continuationText, children: ["Siguiente p\u00E1gina: ", remainingCount, " l\u00EDnea", remainingCount === 1 ? "" : "s", " m\u00E1s. El resumen incluye todo el presupuesto."] }) })) : null] }))] }), remainingCount === 0 ? (_jsxs(_Fragment, { children: [_jsx(SummaryAndNotesBlock, { quote: quote, showTax: showTax, taxRate: taxRate, taxAmt: taxAmt, notesPdf: notesPdf }), _jsx(FooterBlock, { quote: quote })] })) : null] }), remainingCount > 0 ? (_jsxs(Page, { size: "A4", style: styles.pageContinuation, children: [_jsxs(View, { style: styles.contMiniHeader, wrap: false, children: [_jsx(Text, { style: styles.contMiniTitle, children: QUOTE_PDF_BUSINESS_NAME }), _jsxs(Text, { style: styles.contMiniSub, children: ["Presupuesto #", quote.quoteNumber, " \u00B7 continuaci\u00F3n de l\u00EDneas"] })] }), _jsxs(View, { style: styles.tableOuter, children: [_jsx(TableHeaderRow, {}), _jsx(TableDataRows, { rows: restItems, startIndex: firstPageItems.length, isLastSegment: true })] }), _jsx(SummaryAndNotesBlock, { quote: quote, showTax: showTax, taxRate: taxRate, taxAmt: taxAmt, notesPdf: notesPdf }), _jsx(FooterBlock, { quote: quote })] })) : null] }));
}
