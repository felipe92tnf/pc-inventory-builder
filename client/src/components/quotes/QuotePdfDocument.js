import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
/** Nombre comercial mostrado en el PDF del presupuesto. */
export const QUOTE_PDF_BUSINESS_NAME = "PC  Builder";
const LEGAL_NOTICE = "Este presupuesto es válido hasta la fecha indicada. Los precios pueden variar según disponibilidad de stock.";
const palette = {
    ink: "#0f172a",
    muted: "#475569",
    border: "#cbd5e1",
    headerBg: "#f1f5f9",
    pageBg: "#ffffff"
};
const styles = StyleSheet.create({
    page: {
        paddingTop: 44,
        paddingBottom: 48,
        paddingHorizontal: 44,
        fontFamily: "Helvetica",
        fontSize: 9,
        color: palette.ink,
        backgroundColor: palette.pageBg
    },
    topRule: {
        height: 3,
        backgroundColor: "#334155",
        marginBottom: 20
    },
    brandRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 18
    },
    brandName: {
        fontSize: 16,
        fontFamily: "Helvetica-Bold",
        color: palette.ink,
        letterSpacing: 0.3
    },
    docTitle: {
        fontSize: 18,
        fontFamily: "Helvetica-Bold",
        color: "#1e3a8a",
        textAlign: "right"
    },
    metaGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: palette.border
    },
    metaItem: {
        width: "48%",
        marginBottom: 4
    },
    metaLabel: {
        fontSize: 8,
        color: palette.muted,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginBottom: 2
    },
    metaValue: {
        fontSize: 10,
        fontFamily: "Helvetica-Bold"
    },
    sectionTitle: {
        fontSize: 10,
        fontFamily: "Helvetica-Bold",
        color: palette.ink,
        marginBottom: 8,
        marginTop: 4
    },
    clientBox: {
        borderWidth: 1,
        borderColor: palette.border,
        borderRadius: 4,
        padding: 12,
        marginBottom: 18,
        backgroundColor: "#f8fafc"
    },
    clientLine: {
        fontSize: 9,
        marginBottom: 4,
        color: palette.ink
    },
    table: {
        borderWidth: 1,
        borderColor: palette.border,
        borderRadius: 4,
        overflow: "hidden",
        marginBottom: 16
    },
    tableHeader: {
        flexDirection: "row",
        backgroundColor: palette.headerBg,
        borderBottomWidth: 1,
        borderBottomColor: palette.border,
        paddingVertical: 8,
        paddingHorizontal: 6
    },
    tableRow: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: palette.border,
        paddingVertical: 7,
        paddingHorizontal: 6,
        minHeight: 28
    },
    tableRowLast: {
        borderBottomWidth: 0
    },
    th: {
        fontSize: 8,
        fontFamily: "Helvetica-Bold",
        color: palette.muted,
        textTransform: "uppercase",
        letterSpacing: 0.3
    },
    td: {
        fontSize: 9,
        color: palette.ink
    },
    colName: { width: "22%" },
    colDesc: { width: "28%" },
    colQty: { width: "10%", textAlign: "right" },
    colUnit: { width: "18%", textAlign: "right" },
    colTotal: { width: "22%", textAlign: "right" },
    totalsBlock: {
        alignSelf: "flex-end",
        width: "42%",
        marginBottom: 18,
        borderTopWidth: 1,
        borderTopColor: palette.border,
        paddingTop: 10
    },
    totalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 6
    },
    totalLabel: {
        fontSize: 9,
        color: palette.muted
    },
    totalValue: {
        fontSize: 9,
        fontFamily: "Helvetica-Bold",
        textAlign: "right"
    },
    grandTotalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 6,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: palette.border
    },
    grandTotalLabel: {
        fontSize: 11,
        fontFamily: "Helvetica-Bold",
        color: palette.ink
    },
    grandTotalValue: {
        fontSize: 11,
        fontFamily: "Helvetica-Bold",
        color: "#1e3a8a"
    },
    notesBox: {
        marginBottom: 14
    },
    notesTitle: {
        fontSize: 9,
        fontFamily: "Helvetica-Bold",
        marginBottom: 4,
        color: palette.muted
    },
    notesBody: {
        fontSize: 9,
        color: palette.ink,
        lineHeight: 1.45
    },
    legal: {
        fontSize: 7,
        color: palette.muted,
        lineHeight: 1.35,
        marginTop: 8,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: palette.border
    },
    emptyHint: {
        fontSize: 9,
        color: palette.muted,
        paddingVertical: 12,
        textAlign: "center"
    },
    asuntoBlock: {
        width: "100%",
        marginBottom: 10
    }
});
function formatDateEs(iso) {
    if (!iso)
        return "—";
    try {
        return new Date(iso).toLocaleDateString("es-ES", { dateStyle: "long" });
    }
    catch {
        return "—";
    }
}
function formatMoney(n) {
    return `${n.toFixed(2)} EUR`;
}
function dashIfEmpty(s) {
    if (s == null || String(s).trim() === "")
        return "—";
    return String(s).trim();
}
export function QuotePdfDocument({ quote }) {
    const items = quote.items ?? [];
    return (_jsx(Document, { title: `Presupuesto ${quote.quoteNumber}`, author: QUOTE_PDF_BUSINESS_NAME, children: _jsxs(Page, { size: "A4", style: styles.page, children: [_jsx(View, { style: styles.topRule, fixed: true }), _jsxs(View, { style: styles.brandRow, children: [_jsx(Text, { style: styles.brandName, children: QUOTE_PDF_BUSINESS_NAME }), _jsx(Text, { style: styles.docTitle, children: "Presupuesto" })] }), _jsxs(View, { style: styles.asuntoBlock, children: [_jsx(Text, { style: styles.metaLabel, children: "Asunto" }), _jsx(Text, { style: styles.metaValue, children: dashIfEmpty(quote.title) })] }), _jsxs(View, { style: styles.metaGrid, children: [_jsxs(View, { style: styles.metaItem, children: [_jsx(Text, { style: styles.metaLabel, children: "N\u00FAmero" }), _jsxs(Text, { style: styles.metaValue, children: ["#", quote.quoteNumber] })] }), _jsxs(View, { style: styles.metaItem, children: [_jsx(Text, { style: styles.metaLabel, children: "Fecha" }), _jsx(Text, { style: styles.metaValue, children: formatDateEs(quote.createdAt) })] }), _jsxs(View, { style: styles.metaItem, children: [_jsx(Text, { style: styles.metaLabel, children: "V\u00E1lido hasta" }), _jsx(Text, { style: styles.metaValue, children: formatDateEs(quote.validUntil) })] })] }), _jsx(Text, { style: styles.sectionTitle, children: "Cliente" }), _jsxs(View, { style: styles.clientBox, children: [_jsxs(Text, { style: styles.clientLine, children: [_jsx(Text, { style: { fontFamily: "Helvetica-Bold" }, children: "Nombre: " }), dashIfEmpty(quote.customerName)] }), _jsxs(Text, { style: styles.clientLine, children: [_jsx(Text, { style: { fontFamily: "Helvetica-Bold" }, children: "Tel\u00E9fono: " }), dashIfEmpty(quote.customerPhone)] }), _jsxs(Text, { style: styles.clientLine, children: [_jsx(Text, { style: { fontFamily: "Helvetica-Bold" }, children: "Email: " }), quote.customerEmail?.trim() ? quote.customerEmail.trim() : "—"] })] }), _jsx(Text, { style: styles.sectionTitle, children: "Conceptos" }), _jsxs(View, { style: styles.table, children: [_jsxs(View, { style: styles.tableHeader, children: [_jsx(Text, { style: [styles.th, styles.colName], children: "Nombre" }), _jsx(Text, { style: [styles.th, styles.colDesc], children: "Descripci\u00F3n" }), _jsx(Text, { style: [styles.th, styles.colQty], children: "Cant." }), _jsx(Text, { style: [styles.th, styles.colUnit], children: "P. unit." }), _jsx(Text, { style: [styles.th, styles.colTotal], children: "Total" })] }), items.length === 0 ? (_jsx(View, { style: { paddingHorizontal: 6 }, children: _jsx(Text, { style: styles.emptyHint, children: "No hay l\u00EDneas en este presupuesto." }) })) : (items.map((item, index) => (_jsxs(View, { style: [styles.tableRow, ...(index === items.length - 1 ? [styles.tableRowLast] : [])], children: [_jsx(Text, { style: [styles.td, styles.colName], wrap: true, children: item.name }), _jsx(Text, { style: [styles.td, styles.colDesc], wrap: true, children: dashIfEmpty(item.description) }), _jsx(Text, { style: [styles.td, styles.colQty], children: item.quantity }), _jsx(Text, { style: [styles.td, styles.colUnit], children: formatMoney(item.unitSalePrice) }), _jsx(Text, { style: [styles.td, styles.colTotal], children: formatMoney(item.total) })] }, item.id))))] }), _jsxs(View, { style: styles.totalsBlock, children: [_jsxs(View, { style: styles.totalRow, children: [_jsx(Text, { style: styles.totalLabel, children: "Subtotal" }), _jsx(Text, { style: styles.totalValue, children: formatMoney(quote.subtotal) })] }), _jsxs(View, { style: styles.totalRow, children: [_jsx(Text, { style: styles.totalLabel, children: "Descuento" }), _jsx(Text, { style: styles.totalValue, children: formatMoney(quote.discountAmount) })] }), _jsxs(View, { style: styles.grandTotalRow, children: [_jsx(Text, { style: styles.grandTotalLabel, children: "Total" }), _jsx(Text, { style: styles.grandTotalValue, children: formatMoney(quote.total) })] })] }), _jsxs(View, { style: styles.notesBox, children: [_jsx(Text, { style: styles.notesTitle, children: "Notas" }), _jsx(Text, { style: styles.notesBody, children: quote.notes?.trim() ? quote.notes.trim() : "—" })] }), _jsx(Text, { style: styles.legal, children: LEGAL_NOTICE })] }) }));
}
