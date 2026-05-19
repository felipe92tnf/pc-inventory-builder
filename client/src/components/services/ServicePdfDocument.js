import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * PDF de ficha de servicio para cliente. Misma paleta y estructura que montajes/presupuestos.
 */
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { serviceConceptLinesForPdf } from "../../utils/servicePdfLines";
const PDF_BUSINESS_NAME = "SecondByte";
const PDF_HEADER_SLOGAN = "Tecnología que te conecta";
const PDF_CLIENT_TAGLINE = "Tecnología y asistencia informática";
const CLIENT_PDF_SOCIAL = {
    whatsapp: "+34 600 000 000",
    instagram: "@secondbyte",
    email: "contacto@secondbyte.es"
};
const SERVICE_TYPE_LABELS = {
    SPARE_PART_SALE: "Venta de pieza suelta",
    PC_CLEANING: "Limpieza de PC",
    FORMATTING: "Formateo",
    OS_INSTALLATION: "Instalación de sistema operativo",
    DIAGNOSTIC: "Diagnóstico",
    THERMAL_PASTE_CHANGE: "Cambio de pasta térmica",
    PARTIAL_ASSEMBLY: "Montaje parcial",
    HOME_SERVICE: "Servicio a domicilio",
    OTHER: "Otro"
};
const STATUS_BADGE = {
    PENDING: { bg: "#fffbeb", border: "#fbbf24", title: "#b45309", value: "#78350f" },
    COMPLETED: { bg: "#ecfdf5", border: "#34d399", title: "#047857", value: "#064e3b" },
    CANCELLED: { bg: "#f1f5f9", border: "#94a3b8", title: "#475569", value: "#0f172a" }
};
const PDF_STATUS_CLIENT = {
    PENDING: "En curso",
    COMPLETED: "Completado",
    CANCELLED: "Cancelado"
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
    subjectLine: {
        fontSize: 9,
        color: palette.muted,
        marginBottom: 10,
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: palette.panelBg,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: palette.border,
        lineHeight: 1.35
    },
    subjectStrong: { fontFamily: "Helvetica-Bold", color: palette.navy },
    statusBadgeOuter: {
        marginBottom: 6,
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 6,
        borderWidth: 2
    },
    statusBadgeRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10
    },
    statusBadgeLabel: {
        fontSize: 7,
        fontFamily: "Helvetica-Bold",
        textTransform: "uppercase",
        letterSpacing: 0.85,
        flexShrink: 0
    },
    statusBadgeValue: {
        fontSize: 10,
        fontFamily: "Helvetica-Bold",
        letterSpacing: 0.15,
        textAlign: "right",
        flex: 1
    },
    infoRow: { flexDirection: "row", gap: 10, alignItems: "stretch", marginBottom: 10 },
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
    infoLine: { flexDirection: "row", marginBottom: 6, alignItems: "flex-start" },
    infoLineLast: { marginBottom: 0 },
    infoLabel: {
        width: "32%",
        fontSize: 7,
        fontFamily: "Helvetica-Bold",
        color: palette.muted,
        textTransform: "uppercase",
        letterSpacing: 0.35
    },
    infoValue: { flex: 1, fontSize: 8.5, color: palette.ink, lineHeight: 1.3 },
    sectionRule: {
        height: 1,
        backgroundColor: palette.rule,
        marginVertical: 8,
        opacity: 0.85
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
    tableRowAlt: { backgroundColor: palette.rowAlt },
    tableRowLast: { borderBottomWidth: 0 },
    td: { fontSize: 8, color: palette.ink, lineHeight: 1.28 },
    colConcept: { width: "52%" },
    colQty: { width: "14%", textAlign: "right" },
    colSale: { width: "34%", textAlign: "right" },
    emptyHint: { fontSize: 8, color: palette.muted, paddingVertical: 12, textAlign: "center" },
    notesCard: {
        marginTop: 4,
        marginBottom: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: palette.borderStrong,
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: palette.white,
        borderLeftWidth: 4,
        borderLeftColor: palette.navyMid
    },
    notesTitle: {
        fontSize: 8,
        fontFamily: "Helvetica-Bold",
        marginBottom: 6,
        color: palette.navy,
        letterSpacing: 0.2
    },
    notesBody: { fontSize: 7.5, color: palette.ink, lineHeight: 1.45 },
    totalStrip: {
        marginTop: 4,
        marginBottom: 4,
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 8,
        backgroundColor: palette.navy
    },
    totalStripAccent: {
        width: 4,
        height: 32,
        backgroundColor: palette.cyan,
        borderRadius: 2,
        marginRight: 12
    },
    totalStripInner: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between"
    },
    totalLabel: {
        fontSize: 10,
        fontFamily: "Helvetica-Bold",
        color: palette.white,
        letterSpacing: 0.35
    },
    totalHint: {
        fontSize: 6.5,
        color: palette.purpleSoft,
        marginTop: 2
    },
    totalValue: {
        fontSize: 14,
        fontFamily: "Helvetica-Bold",
        color: palette.cyan
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
    footerBrandCol: {},
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
const NOTES_MAX = 1200;
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
function truncateNotes(s, max) {
    const t = s.trim();
    if (t.length <= max)
        return t;
    return `${t.slice(0, max - 1)}…`;
}
function SecondByteLogoMark() {
    return (_jsxs(View, { style: styles.logoMark, children: [_jsx(View, { style: styles.logoStripe }), _jsx(View, { style: styles.logoCore, children: _jsx(Text, { style: styles.logoText, children: "SB" }) })] }));
}
function InfoLine({ label, value, isLast = false }) {
    return (_jsxs(View, { style: [styles.infoLine, ...(isLast ? [styles.infoLineLast] : [])], children: [_jsx(Text, { style: styles.infoLabel, children: label }), _jsx(Text, { style: styles.infoValue, children: value })] }));
}
function StatusBadgeBlock({ status }) {
    const c = STATUS_BADGE[status] ?? STATUS_BADGE.PENDING;
    const label = PDF_STATUS_CLIENT[status] ?? PDF_STATUS_CLIENT.PENDING;
    return (_jsx(View, { style: [styles.statusBadgeOuter, { backgroundColor: c.bg, borderColor: c.border }], wrap: false, children: _jsxs(View, { style: styles.statusBadgeRow, children: [_jsx(Text, { style: [styles.statusBadgeLabel, { color: c.title }], children: "Estado" }), _jsx(Text, { style: [styles.statusBadgeValue, { color: c.value }], children: label })] }) }));
}
function LineTableHeaderThreeCol() {
    return (_jsxs(View, { style: styles.tableHeader, wrap: false, children: [_jsx(Text, { style: [styles.th, styles.colConcept], children: "Concepto" }), _jsx(Text, { style: [styles.th, styles.colQty], children: "Unidades" }), _jsx(Text, { style: [styles.th, styles.colSale], children: "Precio venta" })] }));
}
function clientPdfSocialLine() {
    const parts = [];
    const wa = String(CLIENT_PDF_SOCIAL.whatsapp).trim();
    const ig = String(CLIENT_PDF_SOCIAL.instagram).trim();
    const em = String(CLIENT_PDF_SOCIAL.email).trim();
    if (wa)
        parts.push(`WhatsApp ${wa}`);
    if (ig)
        parts.push(`Instagram ${ig}`);
    if (em)
        parts.push(em);
    if (parts.length === 0)
        return null;
    return parts.join(" · ");
}
function FooterBlock() {
    const socialLine = clientPdfSocialLine();
    return (_jsxs(View, { style: styles.footer, fixed: true, children: [_jsxs(View, { style: styles.footerMainRow, children: [_jsxs(View, { style: styles.footerBrandCol, children: [_jsx(Text, { style: styles.footerBrand, children: PDF_BUSINESS_NAME }), _jsx(Text, { style: styles.footerTagline, children: PDF_CLIENT_TAGLINE })] }), _jsx(Text, { style: styles.footerPage, render: ({ pageNumber, totalPages }) => `${pageNumber}/${totalPages}` })] }), socialLine ? _jsx(Text, { style: styles.footerSocials, children: socialLine }) : null, _jsx(Text, { style: styles.footerLegal, children: "Documento informativo. No constituye factura." })] }));
}
export function ServicePdfDocument({ service }) {
    const conceptLines = serviceConceptLinesForPdf(service);
    const description = service.description?.trim();
    const notesRaw = service.notes?.trim();
    const notesPdf = notesRaw ? truncateNotes(notesRaw, NOTES_MAX) : null;
    const clientRowsAll = [
        { label: "Nombre", value: dashIfEmpty(service.customerName) },
        { label: "Teléfono", value: dashIfEmpty(service.customerPhone) },
        { label: "Email", value: dashIfEmpty(service.customerEmail) }
    ];
    const clientRows = clientRowsAll.filter((row) => row.value !== "—");
    const metaRows = [
        { label: "Fecha", value: formatDateEs(service.serviceDate) },
        { label: "Tipo", value: SERVICE_TYPE_LABELS[service.type] }
    ];
    if (service.paymentMethod?.trim()) {
        metaRows.push({ label: "Pago", value: service.paymentMethod.trim() });
    }
    if (service.isHomeService) {
        metaRows.push({
            label: "Domicilio",
            value: dashIfEmpty(service.homeServiceAddress) === "—" ? "Sí" : dashIfEmpty(service.homeServiceAddress)
        });
    }
    const sharedHeader = (_jsxs(_Fragment, { children: [_jsx(View, { style: styles.accentTop, fixed: true }), _jsxs(View, { style: styles.headerBand, wrap: false, children: [_jsxs(View, { style: styles.headerLeft, children: [_jsx(SecondByteLogoMark, {}), _jsxs(View, { style: styles.brandBlock, children: [_jsx(Text, { style: styles.brandName, children: PDF_BUSINESS_NAME }), _jsx(Text, { style: styles.brandSlogan, children: PDF_HEADER_SLOGAN })] })] }), _jsxs(View, { style: styles.headerDocCol, children: [_jsx(Text, { style: styles.docKind, children: "SERVICIO" }), _jsx(Text, { style: styles.docKindSub, children: "Asistencia \u00B7 reparaci\u00F3n" })] })] }), _jsx(View, { style: styles.headerBottomLine, wrap: false })] }));
    return (_jsx(Document, { title: `Servicio ${service.title}`, author: PDF_BUSINESS_NAME, children: _jsxs(Page, { size: "A4", style: styles.page, children: [sharedHeader, _jsxs(Text, { style: styles.subjectLine, wrap: false, children: [_jsx(Text, { style: styles.subjectStrong, children: "Servicio: " }), dashIfEmpty(service.title)] }), _jsx(StatusBadgeBlock, { status: service.status }), _jsxs(View, { style: styles.infoRow, wrap: false, children: [_jsxs(View, { style: styles.clientCard, children: [_jsx(Text, { style: styles.cardTitle, children: "Cliente" }), clientRows.length === 0 ? (_jsx(InfoLine, { label: "Nombre", value: "\u2014", isLast: true })) : (clientRows.map((row, i) => (_jsx(InfoLine, { label: row.label, value: row.value, isLast: i === clientRows.length - 1 }, row.label))))] }), _jsxs(View, { style: styles.metaCard, children: [_jsx(Text, { style: styles.cardTitle, children: "Documento" }), metaRows.map((row, i) => (_jsx(InfoLine, { label: row.label, value: row.value, isLast: i === metaRows.length - 1 }, row.label)))] })] }), description ? (_jsxs(View, { style: styles.notesCard, wrap: false, children: [_jsx(Text, { style: styles.notesTitle, children: "Descripci\u00F3n" }), _jsx(Text, { style: styles.notesBody, children: truncateNotes(description, NOTES_MAX) })] })) : null, _jsx(View, { style: styles.sectionRule }), _jsxs(View, { style: styles.tableSectionHeader, wrap: false, children: [_jsx(View, { style: styles.tableSectionAccent }), _jsx(Text, { style: styles.tableSectionTitle, children: "Conceptos del servicio" })] }), _jsxs(View, { style: styles.tableOuter, children: [_jsx(LineTableHeaderThreeCol, {}), conceptLines.length === 0 ? (_jsx(Text, { style: styles.emptyHint, children: "Sin conceptos detallados en este documento." })) : (conceptLines.map((line, index) => {
                            const zebra = index % 2 === 1;
                            const isLast = index === conceptLines.length - 1;
                            return (_jsxs(View, { style: [
                                    styles.tableRow,
                                    ...(zebra ? [styles.tableRowAlt] : []),
                                    ...(isLast ? [styles.tableRowLast] : [])
                                ], wrap: false, children: [_jsx(Text, { style: [styles.td, styles.colConcept], wrap: true, children: line.name }), _jsx(Text, { style: [styles.td, styles.colQty], children: line.quantity }), _jsx(Text, { style: [styles.td, styles.colSale], children: formatMoney(line.lineSale) })] }, line.key));
                        }))] }), notesPdf ? (_jsxs(View, { style: styles.notesCard, wrap: false, children: [_jsx(Text, { style: styles.notesTitle, children: "Notas" }), _jsx(Text, { style: styles.notesBody, children: notesPdf })] })) : null, _jsxs(View, { style: styles.totalStrip, wrap: false, children: [_jsx(View, { style: styles.totalStripAccent }), _jsxs(View, { style: styles.totalStripInner, children: [_jsxs(View, { children: [_jsx(Text, { style: styles.totalLabel, children: "Total servicio" }), _jsx(Text, { style: styles.totalHint, children: "Importe de venta (IVA no incluido salvo indicaci\u00F3n)" })] }), _jsx(Text, { style: styles.totalValue, children: formatMoney(service.salePrice) })] })] }), _jsx(FooterBlock, {})] }) }));
}
