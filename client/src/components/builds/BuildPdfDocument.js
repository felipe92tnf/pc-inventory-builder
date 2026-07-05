import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * PDF de ficha de montaje para cliente. Estilo alineado con la marca SecondByte
 * (misma paleta que presupuestos), sin importar `QuotePdfDocument`.
 */
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { PDF_BRAND_NAME, PDF_BRAND_SLOGAN, pdfBusinessContactFooterLine } from "../../constants/pdfBusinessInfo";
const PDF_BUSINESS_NAME = PDF_BRAND_NAME;
/** Pie y tono comercial para el cliente. */
const PDF_CLIENT_TAGLINE = "Tecnología y montaje de equipos";
const STATUS_BADGE = {
    DRAFT: { bg: "#f1f5f9", border: "#94a3b8", title: "#475569", value: "#0f172a" },
    CONFIRMED: { bg: "#ecfdf5", border: "#34d399", title: "#047857", value: "#064e3b" },
    RESERVED: { bg: "#f5f3ff", border: "#a78bfa", title: "#5b21b6", value: "#4c1d95" },
    PENDING_PAYMENT: { bg: "#fffbeb", border: "#fbbf24", title: "#b45309", value: "#78350f" },
    PENDING_PICKUP: { bg: "#e0f2fe", border: "#38bdf8", title: "#0369a1", value: "#0c4a6e" },
    SOLD: { bg: "#ecfeff", border: "#22d3ee", title: "#0e7490", value: "#134e4a" }
};
/** Textos de estado orientados al cliente (solo este PDF). */
const PDF_STATUS_CLIENT = {
    DRAFT: "En preparación",
    CONFIRMED: "Listo para la venta",
    RESERVED: "Reservado",
    PENDING_PAYMENT: "Pendiente de pago",
    PENDING_PICKUP: "Pendiente de recogida",
    SOLD: "Venta completada"
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
    reservaStrip: {
        marginTop: 2,
        marginBottom: 8,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#c4b5fd",
        backgroundColor: "#f5f3ff"
    },
    reservaLabel: {
        fontSize: 9,
        fontFamily: "Helvetica-Bold",
        color: "#5b21b6",
        letterSpacing: 0.2
    },
    reservaAmount: {
        fontSize: 11,
        fontFamily: "Helvetica-Bold",
        color: "#4c1d95"
    },
    /** Resumen de pago (solo estado Pendiente de pago). */
    paymentSummaryCard: {
        marginTop: 4,
        marginBottom: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#fbbf24",
        backgroundColor: "#fffbeb",
        overflow: "hidden"
    },
    paymentSummaryTopAccent: {
        height: 3,
        backgroundColor: "#f59e0b"
    },
    paymentSummaryBody: {
        paddingVertical: 10,
        paddingHorizontal: 14
    },
    paymentSummaryRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 7
    },
    paymentSummaryLabel: {
        fontSize: 8.5,
        color: "#78350f",
        fontFamily: "Helvetica-Bold"
    },
    paymentSummaryValue: {
        fontSize: 9.5,
        fontFamily: "Helvetica-Bold",
        color: palette.ink
    },
    paymentPendingHighlight: {
        marginTop: 4,
        paddingVertical: 11,
        paddingHorizontal: 12,
        backgroundColor: "#fef3c7",
        borderTopWidth: 1,
        borderTopColor: "#f59e0b",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between"
    },
    paymentPendingLeft: {
        flexShrink: 1,
        marginRight: 8
    },
    paymentPendingTitle: {
        fontSize: 10,
        fontFamily: "Helvetica-Bold",
        color: "#b45309",
        letterSpacing: 0.2
    },
    paymentPendingHint: {
        fontSize: 6.5,
        color: "#92400e",
        marginTop: 2
    },
    paymentPendingAmount: {
        fontSize: 16,
        fontFamily: "Helvetica-Bold",
        color: "#c2410c"
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
function normalizeNoteLine(s) {
    return s.replace(/\s+/g, " ").trim();
}
/** Texto generado al convertir presupuesto o metadatos que no son notas manuales del montaje. */
function isSystemGeneratedNoteLine(line) {
    const t = normalizeNoteLine(line);
    if (!t)
        return true;
    const low = t.toLowerCase();
    if (/^tel\s*:/.test(low) || /^telefono\s*:/.test(low) || /^teléfono\s*:/.test(low))
        return true;
    if (/^cliente\s*:/.test(low) || /^nombre\s*:/.test(low))
        return true;
    if (/^email\s*:/.test(low) || /^correo\s*:/.test(low))
        return true;
    if (low.includes("total presupuesto aceptado"))
        return true;
    if (low.includes("referencia venta"))
        return true;
    if (low.includes("descuento en presupuesto"))
        return true;
    if (low.startsWith("descripción (presupuesto)"))
        return true;
    if (low.startsWith("notas internas (presupuesto)"))
        return true;
    if (low.includes("líneas no copiadas al montaje") || low.startsWith("---"))
        return true;
    if (/^•\s*\[/.test(t) || /^•\s*\(/.test(t))
        return true;
    return false;
}
/** Evita mostrar notas que solo duplican datos ya visibles en el PDF. */
function isBoilerplateNoteLine(line, build) {
    if (isSystemGeneratedNoteLine(line))
        return true;
    const t = normalizeNoteLine(line);
    if (!t)
        return true;
    const lowCompact = t.toLowerCase().replace(/\s/g, "");
    const name = (build.customerName ?? "").trim().toLowerCase().replace(/\s/g, "");
    const phone = (build.customerPhone ?? "").trim().replace(/\s/g, "");
    const email = (build.customerEmail ?? "").trim().toLowerCase();
    const mountName = build.name.trim().toLowerCase().replace(/\s/g, "");
    if (name && lowCompact === name)
        return true;
    if (phone && lowCompact === phone)
        return true;
    if (email && t.trim().toLowerCase() === email)
        return true;
    if (mountName && lowCompact === mountName)
        return true;
    const total = coerceNumber(build.totalSale);
    const colonIdx = t.indexOf(":");
    if (colonIdx > 0 && colonIdx < t.length - 1) {
        const key = t.slice(0, colonIdx).trim().toLowerCase();
        const val = t.slice(colonIdx + 1).trim();
        const valCompact = val.toLowerCase().replace(/\s/g, "");
        if ((key === "cliente" || key === "nombre") && name && valCompact === name)
            return true;
        if ((key === "tel" || key === "teléfono" || key === "telefono") && phone && valCompact === phone) {
            return true;
        }
        if (key === "email" && email && val.toLowerCase().trim() === email)
            return true;
        if ((key === "total" || key === "importe") && val) {
            const tryFromVal = Number(val.replace(/\s/g, "").replace(/eur/gi, "").replace(/€/g, "").replace(",", "."));
            if (Number.isFinite(tryFromVal) && Math.abs(tryFromVal - total) < 0.02) {
                const alphaLen = val.replace(/[0-9.,\s€EUR-]/gi, "").length;
                if (alphaLen <= 2)
                    return true;
            }
        }
    }
    const tryNum = Number(t.replace(/\s/g, "").replace(/eur/gi, "").replace(/€/g, "").replace(",", "."));
    if (Number.isFinite(tryNum) && Math.abs(tryNum - total) < 0.02) {
        const alphaLen = t.replace(/[0-9.,\s€EUR-]/gi, "").length;
        if (alphaLen <= 2)
            return true;
    }
    return false;
}
/** Notas con contenido útil para el cliente; `null` si no aporta nada. */
function meaningfulNotesForClient(build) {
    const raw = build.notes?.trim();
    if (!raw)
        return null;
    const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const kept = lines.filter((l) => !isBoilerplateNoteLine(l, build));
    const joined = kept.join("\n").trim();
    if (joined.length < 4)
        return null;
    return truncateNotes(joined, NOTES_MAX);
}
function SecondByteLogoMark() {
    return (_jsxs(View, { style: styles.logoMark, children: [_jsx(View, { style: styles.logoStripe }), _jsx(View, { style: styles.logoCore, children: _jsx(Text, { style: styles.logoText, children: "SB" }) })] }));
}
function InfoLine({ label, value, isLast = false }) {
    return (_jsxs(View, { style: [styles.infoLine, ...(isLast ? [styles.infoLineLast] : [])], children: [_jsx(Text, { style: styles.infoLabel, children: label }), _jsx(Text, { style: styles.infoValue, children: value })] }));
}
function StatusBadgeBlock({ status }) {
    const c = STATUS_BADGE[status] ?? STATUS_BADGE.DRAFT;
    const label = PDF_STATUS_CLIENT[status] ?? PDF_STATUS_CLIENT.DRAFT;
    return (_jsx(View, { style: [
            styles.statusBadgeOuter,
            { backgroundColor: c.bg, borderColor: c.border }
        ], wrap: false, children: _jsxs(View, { style: styles.statusBadgeRow, children: [_jsx(Text, { style: [styles.statusBadgeLabel, { color: c.title }], children: "Estado" }), _jsx(Text, { style: [styles.statusBadgeValue, { color: c.value }], children: label })] }) }));
}
function LineTableHeaderThreeCol() {
    return (_jsxs(View, { style: styles.tableHeader, wrap: false, children: [_jsx(Text, { style: [styles.th, styles.colConcept], children: "Concepto" }), _jsx(Text, { style: [styles.th, styles.colQty], children: "Unidades" }), _jsx(Text, { style: [styles.th, styles.colSale], children: "Precio venta" })] }));
}
function partLineSale(item) {
    return coerceNumber(item.unitSalePrice) * item.quantity;
}
function extraLineSale(line) {
    return coerceNumber(line.unitSalePrice) * line.quantity;
}
/** Totales para PDF en reserva: antelación cobrada + pendiente (restante). */
function reservedClientTotals(build) {
    if (build.status !== "RESERVED")
        return null;
    const total = coerceNumber(build.totalSale);
    const hasDeposit = build.reservationDeposit != null;
    const hasRemaining = build.reservationRemaining != null;
    if (!hasDeposit && !hasRemaining) {
        return null;
    }
    let deposit = hasDeposit ? coerceNumber(build.reservationDeposit) : 0;
    let remaining = hasRemaining ? coerceNumber(build.reservationRemaining) : 0;
    if (hasDeposit && !hasRemaining) {
        remaining = Math.max(0, Math.round((total - deposit) * 100) / 100);
    }
    else if (!hasDeposit && hasRemaining) {
        deposit = Math.max(0, Math.round((total - remaining) * 100) / 100);
    }
    return { deposit, remaining };
}
/** Resumen cliente: total = paid + pending (pending = total − paid). */
function pendingPaymentPdfTotals(build) {
    if (build.status !== "PENDING_PAYMENT")
        return null;
    const total = coerceNumber(build.totalSale);
    const paid = coerceNumber(build.pendingPaymentPaid);
    const pending = Math.max(0, Math.round((total - paid) * 100) / 100);
    return { total, paid, pending };
}
function PendingPaymentSummaryBlock({ total, paid, pending }) {
    return (_jsxs(View, { style: styles.paymentSummaryCard, wrap: false, children: [_jsx(View, { style: styles.paymentSummaryTopAccent }), _jsxs(View, { style: styles.paymentSummaryBody, children: [_jsxs(View, { style: styles.paymentSummaryRow, children: [_jsx(Text, { style: styles.paymentSummaryLabel, children: "Total montaje" }), _jsx(Text, { style: styles.paymentSummaryValue, children: formatMoney(total) })] }), _jsxs(View, { style: [styles.paymentSummaryRow, { marginBottom: 0 }], children: [_jsx(Text, { style: styles.paymentSummaryLabel, children: "Cantidad cobrada" }), _jsx(Text, { style: styles.paymentSummaryValue, children: formatMoney(paid) })] })] }), _jsxs(View, { style: styles.paymentPendingHighlight, wrap: false, children: [_jsxs(View, { style: styles.paymentPendingLeft, children: [_jsx(Text, { style: styles.paymentPendingTitle, children: "Pendiente de pago" }), _jsx(Text, { style: styles.paymentPendingHint, children: "Importe restante (total menos cobrado)" })] }), _jsx(Text, { style: styles.paymentPendingAmount, children: formatMoney(pending) })] })] }));
}
function FooterBlock() {
    return (_jsxs(View, { style: styles.footer, fixed: true, children: [_jsxs(View, { style: styles.footerMainRow, children: [_jsxs(View, { style: styles.footerBrandCol, children: [_jsx(Text, { style: styles.footerBrand, children: PDF_BUSINESS_NAME }), _jsx(Text, { style: styles.footerTagline, children: PDF_CLIENT_TAGLINE })] }), _jsx(Text, { style: styles.footerPage, render: ({ pageNumber, totalPages }) => `${pageNumber}/${totalPages}` })] }), _jsx(Text, { style: styles.footerSocials, children: pdfBusinessContactFooterLine() }), _jsx(Text, { style: styles.footerLegal, children: "Documento informativo. No constituye factura." })] }));
}
export function BuildPdfDocument({ build }) {
    const items = build.items ?? [];
    const manualLines = (build.extraLines ?? []).filter((l) => l.extraTemplateId == null);
    const extras = (build.extraLines ?? []).filter((l) => l.extraTemplateId != null);
    const notesPdf = meaningfulNotesForClient(build);
    const hasClientNotes = notesPdf != null;
    const clientRowsAll = [
        { label: "Nombre", value: dashIfEmpty(build.customerName) },
        { label: "Teléfono", value: dashIfEmpty(build.customerPhone) },
    ];
    const clientRows = clientRowsAll.filter((row) => row.value !== "—");
    const metaRows = [
        { label: "Fecha", value: formatDateEs(build.updatedAt) }
    ];
    const reservedTotals = reservedClientTotals(build);
    const pendingPaymentTotals = pendingPaymentPdfTotals(build);
    const sharedHeader = (_jsxs(_Fragment, { children: [_jsx(View, { style: styles.accentTop, fixed: true }), _jsxs(View, { style: styles.headerBand, wrap: false, children: [_jsxs(View, { style: styles.headerLeft, children: [_jsx(SecondByteLogoMark, {}), _jsxs(View, { style: styles.brandBlock, children: [_jsx(Text, { style: styles.brandName, children: PDF_BUSINESS_NAME }), _jsx(Text, { style: styles.brandSlogan, children: PDF_BRAND_SLOGAN })] })] }), _jsxs(View, { style: styles.headerDocCol, children: [_jsx(Text, { style: styles.docKind, children: "MONTAJE" }), _jsx(Text, { style: styles.docKindSub, children: "Propuesta \u00B7 configuraci\u00F3n PC" })] })] }), _jsx(View, { style: styles.headerBottomLine, wrap: false })] }));
    return (_jsx(Document, { title: `Montaje ${build.name}`, author: PDF_BUSINESS_NAME, children: _jsxs(Page, { size: "A4", style: styles.page, children: [sharedHeader, _jsxs(Text, { style: styles.subjectLine, wrap: false, children: [_jsx(Text, { style: styles.subjectStrong, children: "Montaje: " }), dashIfEmpty(build.name)] }), _jsx(StatusBadgeBlock, { status: build.status }), _jsxs(View, { style: styles.infoRow, wrap: false, children: [_jsxs(View, { style: styles.clientCard, children: [_jsx(Text, { style: styles.cardTitle, children: "Cliente" }), clientRows.length === 0 ? (_jsx(InfoLine, { label: "Nombre", value: "\u2014", isLast: true })) : (clientRows.map((row, i) => (_jsx(InfoLine, { label: row.label, value: row.value, isLast: i === clientRows.length - 1 }, row.label))))] }), _jsxs(View, { style: styles.metaCard, children: [_jsx(Text, { style: styles.cardTitle, children: "Documento" }), metaRows.map((row, i) => (_jsx(InfoLine, { label: row.label, value: row.value, isLast: i === metaRows.length - 1 }, row.label)))] })] }), _jsx(View, { style: styles.sectionRule }), _jsxs(View, { style: styles.tableSectionHeader, wrap: false, children: [_jsx(View, { style: styles.tableSectionAccent }), _jsx(Text, { style: styles.tableSectionTitle, children: "Componentes incluidos" })] }), _jsxs(View, { style: styles.tableOuter, children: [_jsx(LineTableHeaderThreeCol, {}), items.length === 0 && manualLines.length === 0 ? (_jsx(Text, { style: styles.emptyHint, children: "Sin componentes listados en este documento." })) : (_jsxs(_Fragment, { children: [items.map((item, index) => {
                                    const zebra = index % 2 === 1;
                                    return (_jsxs(View, { style: [styles.tableRow, ...(zebra ? [styles.tableRowAlt] : [])], wrap: false, children: [_jsx(Text, { style: [styles.td, styles.colConcept], wrap: true, children: item.part?.name ?? "Componente" }), _jsx(Text, { style: [styles.td, styles.colQty], children: item.quantity }), _jsx(Text, { style: [styles.td, styles.colSale], children: formatMoney(partLineSale(item)) })] }, item.id));
                                }), manualLines.map((line, index) => {
                                    const rowIndex = items.length + index;
                                    const zebra = rowIndex % 2 === 1;
                                    const isLast = rowIndex === items.length + manualLines.length - 1 && extras.length === 0;
                                    return (_jsxs(View, { style: [
                                            styles.tableRow,
                                            ...(zebra ? [styles.tableRowAlt] : []),
                                            ...(isLast ? [styles.tableRowLast] : [])
                                        ], wrap: false, children: [_jsx(Text, { style: [styles.td, styles.colConcept], wrap: true, children: line.name }), _jsx(Text, { style: [styles.td, styles.colQty], children: line.quantity }), _jsx(Text, { style: [styles.td, styles.colSale], children: formatMoney(extraLineSale(line)) })] }, line.id));
                                })] }))] }), extras.length > 0 ? (_jsxs(_Fragment, { children: [_jsxs(View, { style: styles.tableSectionHeader, wrap: false, children: [_jsx(View, { style: styles.tableSectionAccent }), _jsx(Text, { style: styles.tableSectionTitle, children: "Extras incluidos" })] }), _jsxs(View, { style: styles.tableOuter, children: [_jsx(LineTableHeaderThreeCol, {}), extras.map((line, index) => {
                                    const isLast = index === extras.length - 1;
                                    const zebra = index % 2 === 1;
                                    return (_jsxs(View, { style: [styles.tableRow, ...(zebra ? [styles.tableRowAlt] : []), ...(isLast ? [styles.tableRowLast] : [])], wrap: false, children: [_jsx(Text, { style: [styles.td, styles.colConcept], wrap: true, children: line.name }), _jsx(Text, { style: [styles.td, styles.colQty], children: line.quantity }), _jsx(Text, { style: [styles.td, styles.colSale], children: formatMoney(extraLineSale(line)) })] }, line.id));
                                })] })] })) : null, hasClientNotes ? (_jsxs(View, { style: styles.notesCard, wrap: false, children: [_jsx(Text, { style: styles.notesTitle, children: "Notas" }), _jsx(Text, { style: styles.notesBody, children: notesPdf })] })) : null, reservedTotals ? (_jsxs(View, { style: styles.reservaStrip, wrap: false, children: [_jsx(Text, { style: styles.reservaLabel, children: "Reserva cobrada" }), _jsx(Text, { style: styles.reservaAmount, children: formatMoney(reservedTotals.deposit) })] })) : null, pendingPaymentTotals ? (_jsx(PendingPaymentSummaryBlock, { total: pendingPaymentTotals.total, paid: pendingPaymentTotals.paid, pending: pendingPaymentTotals.pending })) : (_jsxs(View, { style: styles.totalStrip, wrap: false, children: [_jsx(View, { style: styles.totalStripAccent }), _jsxs(View, { style: styles.totalStripInner, children: [_jsxs(View, { children: [_jsx(Text, { style: styles.totalLabel, children: reservedTotals ? "Restante a abonar" : "Total montaje" }), _jsx(Text, { style: styles.totalHint, children: reservedTotals
                                                ? "Importe pendiente (precio total menos reserva cobrada)"
                                                : "Precio de venta final" })] }), _jsx(Text, { style: styles.totalValue, children: formatMoney(reservedTotals ? reservedTotals.remaining : build.totalSale) })] })] })), _jsx(FooterBlock, {})] }) }));
}
