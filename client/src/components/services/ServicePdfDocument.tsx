/**
 * PDF de ficha de servicio para cliente. Misma paleta y estructura que montajes/presupuestos.
 */
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import {
  PDF_BRAND_NAME,
  PDF_BRAND_SLOGAN,
  pdfBusinessContactFooterLine
} from "../../constants/pdfBusinessInfo";
import type { ServiceRow, ServiceStatus, ServiceType } from "../../types/service";
import { serviceConceptLinesForPdf } from "../../utils/servicePdfLines";

const PDF_BUSINESS_NAME = PDF_BRAND_NAME;
const PDF_CLIENT_TAGLINE = "Tecnología y asistencia informática";

const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
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

const STATUS_BADGE: Record<
  ServiceStatus,
  { bg: string; border: string; title: string; value: string }
> = {
  PENDING: { bg: "#fffbeb", border: "#fbbf24", title: "#b45309", value: "#78350f" },
  COMPLETED: { bg: "#ecfdf5", border: "#34d399", title: "#047857", value: "#064e3b" },
  CANCELLED: { bg: "#f1f5f9", border: "#94a3b8", title: "#475569", value: "#0f172a" }
};

const PDF_STATUS_CLIENT: Record<ServiceStatus, string> = {
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

function formatDateEs(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("es-ES", { dateStyle: "long" });
  } catch {
    return "—";
  }
}

function coerceNumber(value: number | string | null | undefined): number {
  if (value == null) return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const n = parseFloat(String(value));
  return Number.isFinite(n) ? n : 0;
}

function formatMoney(n: number | string | null | undefined): string {
  return `${coerceNumber(n).toFixed(2)} EUR`;
}

function dashIfEmpty(s: string | null | undefined): string {
  if (s == null || String(s).trim() === "") return "—";
  return String(s).trim();
}

function truncateNotes(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function SecondByteLogoMark() {
  return (
    <View style={styles.logoMark}>
      <View style={styles.logoStripe} />
      <View style={styles.logoCore}>
        <Text style={styles.logoText}>SB</Text>
      </View>
    </View>
  );
}

function InfoLine({
  label,
  value,
  isLast = false
}: {
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.infoLine, ...(isLast ? [styles.infoLineLast] : [])]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function StatusBadgeBlock({ status }: { status: ServiceStatus }) {
  const c = STATUS_BADGE[status] ?? STATUS_BADGE.PENDING;
  const label = PDF_STATUS_CLIENT[status] ?? PDF_STATUS_CLIENT.PENDING;
  return (
    <View
      style={[styles.statusBadgeOuter, { backgroundColor: c.bg, borderColor: c.border }]}
      wrap={false}
    >
      <View style={styles.statusBadgeRow}>
        <Text style={[styles.statusBadgeLabel, { color: c.title }]}>Estado</Text>
        <Text style={[styles.statusBadgeValue, { color: c.value }]}>{label}</Text>
      </View>
    </View>
  );
}

function LineTableHeaderThreeCol() {
  return (
    <View style={styles.tableHeader} wrap={false}>
      <Text style={[styles.th, styles.colConcept]}>Concepto</Text>
      <Text style={[styles.th, styles.colQty]}>Unidades</Text>
      <Text style={[styles.th, styles.colSale]}>Precio venta</Text>
    </View>
  );
}

function FooterBlock() {
  return (
    <View style={styles.footer} fixed>
      <View style={styles.footerMainRow}>
        <View style={styles.footerBrandCol}>
          <Text style={styles.footerBrand}>{PDF_BUSINESS_NAME}</Text>
          <Text style={styles.footerTagline}>{PDF_CLIENT_TAGLINE}</Text>
        </View>
        <Text
          style={styles.footerPage}
          render={({ pageNumber, totalPages }) => `${pageNumber}/${totalPages}`}
        />
      </View>
      <Text style={styles.footerSocials}>{pdfBusinessContactFooterLine()}</Text>
      <Text style={styles.footerLegal}>Documento informativo. No constituye factura.</Text>
    </View>
  );
}

export type ServicePdfDocumentProps = {
  service: ServiceRow;
};

export function ServicePdfDocument({ service }: ServicePdfDocumentProps) {
  const conceptLines = serviceConceptLinesForPdf(service);
  const description = service.description?.trim();
  const notesRaw = service.notes?.trim();
  const notesPdf = notesRaw ? truncateNotes(notesRaw, NOTES_MAX) : null;

  const clientRowsAll: { label: string; value: string }[] = [
    { label: "Nombre", value: dashIfEmpty(service.customerName) },
    { label: "Teléfono", value: dashIfEmpty(service.customerPhone) },
    { label: "Email", value: dashIfEmpty(service.customerEmail) }
  ];
  const clientRows = clientRowsAll.filter((row) => row.value !== "—");

  const metaRows: { label: string; value: string }[] = [
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

  const sharedHeader = (
    <>
      <View style={styles.accentTop} fixed />
      <View style={styles.headerBand} wrap={false}>
        <View style={styles.headerLeft}>
          <SecondByteLogoMark />
          <View style={styles.brandBlock}>
            <Text style={styles.brandName}>{PDF_BUSINESS_NAME}</Text>
            <Text style={styles.brandSlogan}>{PDF_BRAND_SLOGAN}</Text>
          </View>
        </View>
        <View style={styles.headerDocCol}>
          <Text style={styles.docKind}>SERVICIO</Text>
          <Text style={styles.docKindSub}>Asistencia · reparación</Text>
        </View>
      </View>
      <View style={styles.headerBottomLine} wrap={false} />
    </>
  );

  return (
    <Document title={`Servicio ${service.title}`} author={PDF_BUSINESS_NAME}>
      <Page size="A4" style={styles.page}>
        {sharedHeader}

        <Text style={styles.subjectLine} wrap={false}>
          <Text style={styles.subjectStrong}>Servicio: </Text>
          {dashIfEmpty(service.title)}
        </Text>

        <StatusBadgeBlock status={service.status} />

        <View style={styles.infoRow} wrap={false}>
          <View style={styles.clientCard}>
            <Text style={styles.cardTitle}>Cliente</Text>
            {clientRows.length === 0 ? (
              <InfoLine label="Nombre" value="—" isLast />
            ) : (
              clientRows.map((row, i) => (
                <InfoLine
                  key={row.label}
                  label={row.label}
                  value={row.value}
                  isLast={i === clientRows.length - 1}
                />
              ))
            )}
          </View>
          <View style={styles.metaCard}>
            <Text style={styles.cardTitle}>Documento</Text>
            {metaRows.map((row, i) => (
              <InfoLine
                key={row.label}
                label={row.label}
                value={row.value}
                isLast={i === metaRows.length - 1}
              />
            ))}
          </View>
        </View>

        {description ? (
          <View style={styles.notesCard} wrap={false}>
            <Text style={styles.notesTitle}>Descripción</Text>
            <Text style={styles.notesBody}>{truncateNotes(description, NOTES_MAX)}</Text>
          </View>
        ) : null}

        <View style={styles.sectionRule} />

        <View style={styles.tableSectionHeader} wrap={false}>
          <View style={styles.tableSectionAccent} />
          <Text style={styles.tableSectionTitle}>Conceptos del servicio</Text>
        </View>
        <View style={styles.tableOuter}>
          <LineTableHeaderThreeCol />
          {conceptLines.length === 0 ? (
            <Text style={styles.emptyHint}>Sin conceptos detallados en este documento.</Text>
          ) : (
            conceptLines.map((line, index) => {
              const zebra = index % 2 === 1;
              const isLast = index === conceptLines.length - 1;
              return (
                <View
                  key={line.key}
                  style={[
                    styles.tableRow,
                    ...(zebra ? [styles.tableRowAlt] : []),
                    ...(isLast ? [styles.tableRowLast] : [])
                  ]}
                  wrap={false}
                >
                  <Text style={[styles.td, styles.colConcept]} wrap>
                    {line.name}
                  </Text>
                  <Text style={[styles.td, styles.colQty]}>{line.quantity}</Text>
                  <Text style={[styles.td, styles.colSale]}>{formatMoney(line.lineSale)}</Text>
                </View>
              );
            })
          )}
        </View>

        {notesPdf ? (
          <View style={styles.notesCard} wrap={false}>
            <Text style={styles.notesTitle}>Notas</Text>
            <Text style={styles.notesBody}>{notesPdf}</Text>
          </View>
        ) : null}

        <View style={styles.totalStrip} wrap={false}>
          <View style={styles.totalStripAccent} />
          <View style={styles.totalStripInner}>
            <View>
              <Text style={styles.totalLabel}>Total servicio</Text>
              <Text style={styles.totalHint}>Importe de venta (IVA no incluido salvo indicación)</Text>
            </View>
            <Text style={styles.totalValue}>{formatMoney(service.salePrice)}</Text>
          </View>
        </View>

        <FooterBlock />
      </Page>
    </Document>
  );
}
