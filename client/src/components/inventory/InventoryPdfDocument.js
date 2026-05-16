import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Informe PDF de inventario (uso interno). SecondByte: misma línea visual que otros PDFs.
 */
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { isNonStockCategory } from "../../types/part";
import { groupInventoryPartsForPdf, shelfInventoryTotals } from "../../utils/inventoryPdfExport";
const PDF_BUSINESS_NAME = "SecondByte";
const PDF_HEADER_SLOGAN = "Tecnología que te conecta";
const CLIENT_PDF_SOCIAL = {
    whatsapp: "+34 600 000 000",
    instagram: "@secondbyte",
    email: "contacto@secondbyte.es"
};
const CONDITION_LABEL = {
    NEW: "Nuevo",
    USED: "Usado",
    REFURBISHED: "Reacond."
};
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
    white: "#ffffff"
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
    logoStripe: { width: 4, backgroundColor: palette.cyan },
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
    brandBlock: { flexShrink: 1, justifyContent: "center" },
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
    headerDocCol: { alignItems: "flex-end", justifyContent: "center", paddingLeft: 12 },
    docKind: {
        fontSize: 11,
        fontFamily: "Helvetica-Bold",
        color: palette.white,
        letterSpacing: 0.85
    },
    docKindSub: {
        fontSize: 6.5,
        color: palette.purpleSoft,
        letterSpacing: 0.4,
        marginTop: 3,
        textAlign: "right",
        maxWidth: 140
    },
    headerBottomLine: {
        height: 2,
        backgroundColor: palette.purple,
        marginHorizontal: -28,
        marginBottom: 10,
        opacity: 0.9
    },
    metaBar: {
        marginBottom: 10,
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: palette.panelBg,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: palette.border
    },
    metaLine: { fontSize: 8, color: palette.muted, marginBottom: 3, lineHeight: 1.35 },
    metaStrong: { fontFamily: "Helvetica-Bold", color: palette.navy },
    summaryGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 12
    },
    summaryCard: {
        flexGrow: 1,
        minWidth: "22%",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: palette.borderStrong,
        paddingVertical: 9,
        paddingHorizontal: 10,
        backgroundColor: palette.panelBg,
        borderLeftWidth: 4,
        borderLeftColor: palette.cyan
    },
    summaryLabel: {
        fontSize: 6.5,
        fontFamily: "Helvetica-Bold",
        color: palette.muted,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginBottom: 5
    },
    summaryValue: {
        fontSize: 11,
        fontFamily: "Helvetica-Bold",
        color: palette.navy
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 6,
        marginTop: 4,
        paddingBottom: 4,
        borderBottomWidth: 1,
        borderBottomColor: palette.borderStrong
    },
    sectionAccent: {
        width: 3,
        height: 14,
        backgroundColor: palette.purple,
        borderRadius: 2,
        marginRight: 8
    },
    sectionTitle: {
        fontSize: 10,
        fontFamily: "Helvetica-Bold",
        color: palette.navy,
        letterSpacing: 0.25,
        flex: 1
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
        paddingVertical: 6,
        paddingHorizontal: 7,
        borderBottomWidth: 2,
        borderBottomColor: palette.cyan
    },
    th: {
        fontSize: 6.5,
        fontFamily: "Helvetica-Bold",
        color: palette.white,
        textTransform: "uppercase",
        letterSpacing: 0.35
    },
    tableRow: {
        flexDirection: "row",
        paddingVertical: 5,
        paddingHorizontal: 7,
        borderBottomWidth: 1,
        borderBottomColor: palette.border,
        alignItems: "flex-start"
    },
    tableRowAlt: { backgroundColor: palette.rowAlt },
    tableRowLast: { borderBottomWidth: 0 },
    td: { fontSize: 7.2, color: palette.ink, lineHeight: 1.3 },
    colArt: { width: "28%" },
    colBm: { width: "22%" },
    colStock: { width: "8%", textAlign: "right" },
    colCond: { width: "12%", textAlign: "center" },
    colCost: { width: "14%", textAlign: "right" },
    colSale: { width: "16%", textAlign: "right" },
    subtotalRow: {
        flexDirection: "row",
        justifyContent: "flex-end",
        paddingVertical: 5,
        paddingHorizontal: 7,
        backgroundColor: "#eef2ff",
        borderTopWidth: 1,
        borderTopColor: palette.border
    },
    subtotalText: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: palette.navy },
    emptyHint: {
        fontSize: 8.5,
        color: palette.muted,
        paddingVertical: 20,
        textAlign: "center",
        lineHeight: 1.4
    },
    footer: {
        position: "absolute",
        left: 28,
        right: 28,
        bottom: 12,
        paddingTop: 6,
        borderTopWidth: 1,
        borderTopColor: palette.border
    },
    footerMainRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
        marginBottom: 3
    },
    footerBrand: {
        fontSize: 8.5,
        fontFamily: "Helvetica-Bold",
        color: palette.navy,
        letterSpacing: 0.15
    },
    footerTagline: {
        fontSize: 6.5,
        color: palette.muted,
        marginTop: 2,
        letterSpacing: 0.2
    },
    footerPage: { fontSize: 6.5, color: palette.mutedLight },
    footerSocials: {
        fontSize: 6,
        color: palette.muted,
        letterSpacing: 0.15,
        marginTop: 4,
        lineHeight: 1.35
    },
    footerLegal: {
        fontSize: 5.5,
        color: palette.mutedLight,
        marginTop: 3,
        lineHeight: 1.3
    }
});
function formatMoney(n) {
    if (!Number.isFinite(n))
        return "—";
    return `${n.toFixed(2)} EUR`;
}
function formatExportInstant(iso) {
    try {
        return new Date(iso).toLocaleString("es-ES", {
            dateStyle: "long",
            timeStyle: "short"
        });
    }
    catch {
        return "—";
    }
}
function clientPdfSocialLine() {
    const bits = [];
    const wa = String(CLIENT_PDF_SOCIAL.whatsapp).trim();
    const ig = String(CLIENT_PDF_SOCIAL.instagram).trim();
    const em = String(CLIENT_PDF_SOCIAL.email).trim();
    if (wa)
        bits.push(`WhatsApp ${wa}`);
    if (ig)
        bits.push(`Instagram ${ig}`);
    if (em)
        bits.push(em);
    if (bits.length === 0)
        return null;
    return bits.join(" · ");
}
function SecondByteLogoMark() {
    return (_jsxs(View, { style: styles.logoMark, children: [_jsx(View, { style: styles.logoStripe }), _jsx(View, { style: styles.logoCore, children: _jsx(Text, { style: styles.logoText, children: "SB" }) })] }));
}
function FooterBlock() {
    const socialLine = clientPdfSocialLine();
    return (_jsxs(View, { style: styles.footer, fixed: true, children: [_jsxs(View, { style: styles.footerMainRow, children: [_jsxs(View, { children: [_jsx(Text, { style: styles.footerBrand, children: PDF_BUSINESS_NAME }), _jsx(Text, { style: styles.footerTagline, children: PDF_HEADER_SLOGAN })] }), _jsx(Text, { style: styles.footerPage, render: ({ pageNumber, totalPages }) => `${pageNumber}/${totalPages}` })] }), socialLine ? _jsx(Text, { style: styles.footerSocials, children: socialLine }) : null, _jsx(Text, { style: styles.footerLegal, children: "Informe interno de existencias. No constituye factura ni documento fiscal." })] }));
}
function brandModelLine(part) {
    const b = part.catalogPart?.brand?.trim();
    const m = part.catalogPart?.model?.trim();
    if (b && m)
        return `${b} ${m}`;
    if (b)
        return b;
    if (m)
        return m;
    return "—";
}
function conditionForRow(part) {
    if (part.inventoryKind === "PART" && part.category && isNonStockCategory(part.category)) {
        return "—";
    }
    return CONDITION_LABEL[part.condition] ?? part.condition;
}
function CategoryTable({ group }) {
    let costSum = 0;
    let saleSum = 0;
    for (const p of group.parts) {
        const c = Number(p.costPrice);
        const s = Number(p.salePrice);
        const q = p.stock;
        if (Number.isFinite(c) && Number.isFinite(q))
            costSum += c * q;
        if (Number.isFinite(s) && Number.isFinite(q))
            saleSum += s * q;
    }
    return (_jsxs(View, { children: [_jsxs(View, { style: styles.sectionHeader, children: [_jsx(View, { style: styles.sectionAccent }), _jsxs(Text, { style: styles.sectionTitle, children: [group.label, " (", group.parts.length, " l\u00EDnea", group.parts.length === 1 ? "" : "s", ")"] })] }), _jsxs(View, { style: styles.tableOuter, children: [_jsxs(View, { style: styles.tableHeader, children: [_jsx(Text, { style: [styles.th, styles.colArt], children: "Art\u00EDculo" }), _jsx(Text, { style: [styles.th, styles.colBm], children: "Marca / modelo" }), _jsx(Text, { style: [styles.th, styles.colStock], children: "Uds." }), _jsx(Text, { style: [styles.th, styles.colCond], children: "Estado" }), _jsx(Text, { style: [styles.th, styles.colCost], children: "Coste u." }), _jsx(Text, { style: [styles.th, styles.colSale], children: "PVP u." })] }), group.parts.map((p, index) => {
                        const zebra = index % 2 === 1;
                        const isLast = index === group.parts.length - 1;
                        return (_jsxs(View, { style: [
                                styles.tableRow,
                                ...(zebra ? [styles.tableRowAlt] : []),
                                ...(isLast ? [styles.tableRowLast] : [])
                            ], children: [_jsx(Text, { style: [styles.td, styles.colArt], wrap: true, children: p.name }), _jsx(Text, { style: [styles.td, styles.colBm], wrap: true, children: brandModelLine(p) }), _jsx(Text, { style: [styles.td, styles.colStock], children: p.stock }), _jsx(Text, { style: [styles.td, styles.colCond], children: conditionForRow(p) }), _jsx(Text, { style: [styles.td, styles.colCost], children: formatMoney(Number(p.costPrice)) }), _jsx(Text, { style: [styles.td, styles.colSale], children: formatMoney(Number(p.salePrice)) })] }, p.id));
                    }), _jsx(View, { style: styles.subtotalRow, wrap: false, children: _jsxs(Text, { style: styles.subtotalText, children: ["Subtotal categor\u00EDa \u2014 coste ", formatMoney(costSum), " \u00B7 venta estimada ", formatMoney(saleSum)] }) })] })] }));
}
export function InventoryPdfDocument({ parts, exportedAtIso, scopeDescription }) {
    const totals = shelfInventoryTotals(parts);
    const groups = groupInventoryPartsForPdf(parts);
    const sharedHeader = (_jsxs(_Fragment, { children: [_jsx(View, { style: styles.accentTop, fixed: true }), _jsxs(View, { style: styles.headerBand, wrap: false, children: [_jsxs(View, { style: styles.headerLeft, children: [_jsx(SecondByteLogoMark, {}), _jsxs(View, { style: styles.brandBlock, children: [_jsx(Text, { style: styles.brandName, children: PDF_BUSINESS_NAME }), _jsx(Text, { style: styles.brandSlogan, children: PDF_HEADER_SLOGAN })] })] }), _jsxs(View, { style: styles.headerDocCol, children: [_jsx(Text, { style: styles.docKind, children: "INFORME DE INVENTARIO" }), _jsx(Text, { style: styles.docKindSub, children: "Agrupado por categor\u00EDas" })] })] }), _jsx(View, { style: styles.headerBottomLine })] }));
    return (_jsx(Document, { children: _jsxs(Page, { size: "A4", style: styles.page, children: [sharedHeader, _jsxs(View, { style: styles.metaBar, wrap: false, children: [_jsxs(Text, { style: styles.metaLine, children: [_jsx(Text, { style: styles.metaStrong, children: "Exportado: " }), formatExportInstant(exportedAtIso)] }), _jsxs(Text, { style: styles.metaLine, children: [_jsx(Text, { style: styles.metaStrong, children: "Alcance: " }), scopeDescription] })] }), _jsxs(View, { style: styles.summaryGrid, wrap: false, children: [_jsxs(View, { style: styles.summaryCard, children: [_jsx(Text, { style: styles.summaryLabel, children: "Total piezas (uds.)" }), _jsx(Text, { style: styles.summaryValue, children: totals.units })] }), _jsxs(View, { style: styles.summaryCard, children: [_jsx(Text, { style: styles.summaryLabel, children: "Coste total" }), _jsx(Text, { style: styles.summaryValue, children: formatMoney(totals.totalCostValue) })] }), _jsxs(View, { style: styles.summaryCard, children: [_jsx(Text, { style: styles.summaryLabel, children: "Venta estimada" }), _jsx(Text, { style: styles.summaryValue, children: formatMoney(totals.totalSaleValue) })] }), _jsxs(View, { style: styles.summaryCard, children: [_jsx(Text, { style: styles.summaryLabel, children: "Beneficio potencial" }), _jsx(Text, { style: styles.summaryValue, children: formatMoney(totals.potentialProfit) })] })] }), groups.length === 0 ? (_jsx(Text, { style: styles.emptyHint, children: "No hay l\u00EDneas que coincidan con el alcance seleccionado para este informe." })) : (groups.map((g) => _jsx(CategoryTable, { group: g }, g.key))), _jsx(FooterBlock, {})] }) }));
}
