/**
 * PDF de ficha de montaje para cliente. Estilo alineado con la marca SecondByte
 * (misma paleta que presupuestos), sin importar `QuotePdfDocument`.
 */
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { BuildDetail, BuildExtraLine, BuildItem, BuildStatus } from "../../types/build";

const PDF_BUSINESS_NAME = "SecondByte";
/** Cabecera del PDF (marca). */
const PDF_HEADER_SLOGAN = "Tecnología que te conecta";
/** Pie y tono comercial para el cliente. */
const PDF_CLIENT_TAGLINE = "Tecnología y montaje de equipos";

const CLIENT_PDF_SOCIAL = {
  whatsapp: "+34 600 000 000",
  instagram: "@secondbyte",
  email: "contacto@secondbyte.es"
} as const;

const STATUS_BADGE: Record<
  BuildStatus,
  { bg: string; border: string; title: string; value: string }
> = {
  DRAFT: { bg: "#f1f5f9", border: "#94a3b8", title: "#475569", value: "#0f172a" },
  CONFIRMED: { bg: "#ecfdf5", border: "#34d399", title: "#047857", value: "#064e3b" },
  RESERVED: { bg: "#f5f3ff", border: "#a78bfa", title: "#5b21b6", value: "#4c1d95" },
  PENDING_PAYMENT: { bg: "#fffbeb", border: "#fbbf24", title: "#b45309", value: "#78350f" },
  PENDING_PICKUP: { bg: "#e0f2fe", border: "#38bdf8", title: "#0369a1", value: "#0c4a6e" },
  SOLD: { bg: "#ecfeff", border: "#22d3ee", title: "#0e7490", value: "#134e4a" }
};

/** Textos de estado orientados al cliente (solo este PDF). */
const PDF_STATUS_CLIENT: Record<BuildStatus, string> = {
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

function normalizeNoteLine(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/** Evita mostrar notas que solo duplican datos ya visibles en el PDF. */
function isBoilerplateNoteLine(line: string, build: BuildDetail): boolean {
  const t = normalizeNoteLine(line);
  if (!t) return true;
  const lowCompact = t.toLowerCase().replace(/\s/g, "");
  const name = (build.customerName ?? "").trim().toLowerCase().replace(/\s/g, "");
  const phone = (build.customerPhone ?? "").trim().replace(/\s/g, "");
  const email = (build.customerEmail ?? "").trim().toLowerCase();
  const mountName = build.name.trim().toLowerCase().replace(/\s/g, "");
  if (name && lowCompact === name) return true;
  if (phone && lowCompact === phone) return true;
  if (email && t.trim().toLowerCase() === email) return true;
  if (mountName && lowCompact === mountName) return true;
  const total = coerceNumber(build.totalSale);
  const colonIdx = t.indexOf(":");
  if (colonIdx > 0 && colonIdx < t.length - 1) {
    const key = t.slice(0, colonIdx).trim().toLowerCase();
    const val = t.slice(colonIdx + 1).trim();
    const valCompact = val.toLowerCase().replace(/\s/g, "");
    if ((key === "cliente" || key === "nombre") && name && valCompact === name) return true;
    if ((key === "teléfono" || key === "telefono") && phone && valCompact === phone) return true;
    if (key === "email" && email && val.toLowerCase().trim() === email) return true;
    if ((key === "total" || key === "importe") && val) {
      const tryFromVal = Number(
        val.replace(/\s/g, "").replace(/eur/gi, "").replace(/€/g, "").replace(",", ".")
      );
      if (Number.isFinite(tryFromVal) && Math.abs(tryFromVal - total) < 0.02) {
        const alphaLen = val.replace(/[0-9.,\s€EUR-]/gi, "").length;
        if (alphaLen <= 2) return true;
      }
    }
  }
  const tryNum = Number(
    t.replace(/\s/g, "").replace(/eur/gi, "").replace(/€/g, "").replace(",", ".")
  );
  if (Number.isFinite(tryNum) && Math.abs(tryNum - total) < 0.02) {
    const alphaLen = t.replace(/[0-9.,\s€EUR-]/gi, "").length;
    if (alphaLen <= 2) return true;
  }
  return false;
}

/** Notas con contenido útil para el cliente; `null` si no aporta nada. */
function meaningfulNotesForClient(build: BuildDetail): string | null {
  const raw = build.notes?.trim();
  if (!raw) return null;
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const kept = lines.filter((l) => !isBoilerplateNoteLine(l, build));
  const joined = kept.join("\n").trim();
  if (joined.length < 4) return null;
  return truncateNotes(joined, NOTES_MAX);
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

function StatusBadgeBlock({ status }: { status: BuildStatus }) {
  const c = STATUS_BADGE[status] ?? STATUS_BADGE.DRAFT;
  const label = PDF_STATUS_CLIENT[status] ?? PDF_STATUS_CLIENT.DRAFT;
  return (
    <View
      style={[
        styles.statusBadgeOuter,
        { backgroundColor: c.bg, borderColor: c.border }
      ]}
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

function partLineSale(item: BuildItem): number {
  return coerceNumber(item.unitSalePrice) * item.quantity;
}

function extraLineSale(line: BuildExtraLine): number {
  return coerceNumber(line.unitSalePrice) * line.quantity;
}

/** Totales para PDF en reserva: antelación cobrada + pendiente (restante). */
function reservedClientTotals(build: BuildDetail): { deposit: number; remaining: number } | null {
  if (build.status !== "RESERVED") return null;
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
  } else if (!hasDeposit && hasRemaining) {
    deposit = Math.max(0, Math.round((total - remaining) * 100) / 100);
  }
  return { deposit, remaining };
}

function clientPdfSocialLine(): string | null {
  const parts: string[] = [];
  const wa = String(CLIENT_PDF_SOCIAL.whatsapp).trim();
  const ig = String(CLIENT_PDF_SOCIAL.instagram).trim();
  const em = String(CLIENT_PDF_SOCIAL.email).trim();
  if (wa) parts.push(`WhatsApp ${wa}`);
  if (ig) parts.push(`Instagram ${ig}`);
  if (em) parts.push(em);
  if (parts.length === 0) return null;
  return parts.join(" · ");
}

function FooterBlock() {
  const socialLine = clientPdfSocialLine();
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
      {socialLine ? <Text style={styles.footerSocials}>{socialLine}</Text> : null}
      <Text style={styles.footerLegal}>Documento informativo. No constituye factura.</Text>
    </View>
  );
}

export type BuildPdfDocumentProps = {
  build: BuildDetail;
};

export function BuildPdfDocument({ build }: BuildPdfDocumentProps) {
  const items = build.items ?? [];
  const extras = build.extraLines ?? [];
  const notesPdf = meaningfulNotesForClient(build);
  const hasClientNotes = notesPdf != null;

  const clientRowsAll: { label: string; value: string }[] = [
    { label: "Nombre", value: dashIfEmpty(build.customerName) },
    { label: "Teléfono", value: dashIfEmpty(build.customerPhone) },
    { label: "Email", value: dashIfEmpty(build.customerEmail) }
  ];
  const clientRows = clientRowsAll.filter((row) => row.value !== "—");

  const metaRows: { label: string; value: string }[] = [
    { label: "Fecha", value: formatDateEs(build.updatedAt) }
  ];

  const reservedTotals = reservedClientTotals(build);

  const sharedHeader = (
    <>
      <View style={styles.accentTop} fixed />
      <View style={styles.headerBand} wrap={false}>
        <View style={styles.headerLeft}>
          <SecondByteLogoMark />
          <View style={styles.brandBlock}>
            <Text style={styles.brandName}>{PDF_BUSINESS_NAME}</Text>
            <Text style={styles.brandSlogan}>{PDF_HEADER_SLOGAN}</Text>
          </View>
        </View>
        <View style={styles.headerDocCol}>
          <Text style={styles.docKind}>MONTAJE</Text>
          <Text style={styles.docKindSub}>Propuesta · configuración PC</Text>
        </View>
      </View>
      <View style={styles.headerBottomLine} wrap={false} />
    </>
  );

  return (
    <Document title={`Montaje ${build.name}`} author={PDF_BUSINESS_NAME}>
      <Page size="A4" style={styles.page}>
        {sharedHeader}

        <Text style={styles.subjectLine} wrap={false}>
          <Text style={styles.subjectStrong}>Montaje: </Text>
          {dashIfEmpty(build.name)}
        </Text>

        <StatusBadgeBlock status={build.status} />

        <View style={styles.infoRow} wrap={false}>
          <View style={styles.clientCard}>
            <Text style={styles.cardTitle}>Cliente</Text>
            {clientRows.length === 0 ? (
              <InfoLine label="Nombre" value="—" isLast />
            ) : (
              clientRows.map((row, i) => (
                <InfoLine key={row.label} label={row.label} value={row.value} isLast={i === clientRows.length - 1} />
              ))
            )}
          </View>
          <View style={styles.metaCard}>
            <Text style={styles.cardTitle}>Documento</Text>
            {metaRows.map((row, i) => (
              <InfoLine key={row.label} label={row.label} value={row.value} isLast={i === metaRows.length - 1} />
            ))}
          </View>
        </View>

        <View style={styles.sectionRule} />

        <View style={styles.tableSectionHeader} wrap={false}>
          <View style={styles.tableSectionAccent} />
          <Text style={styles.tableSectionTitle}>Componentes incluidos</Text>
        </View>
        <View style={styles.tableOuter}>
          <LineTableHeaderThreeCol />
          {items.length === 0 ? (
            <Text style={styles.emptyHint}>Sin componentes listados en este documento.</Text>
          ) : (
            items.map((item, index) => {
              const isLast = index === items.length - 1;
              const zebra = index % 2 === 1;
              return (
                <View
                  key={item.id}
                  style={[styles.tableRow, ...(zebra ? [styles.tableRowAlt] : []), ...(isLast ? [styles.tableRowLast] : [])]}
                  wrap={false}
                >
                  <Text style={[styles.td, styles.colConcept]} wrap>
                    {item.part?.name ?? "Componente"}
                  </Text>
                  <Text style={[styles.td, styles.colQty]}>{item.quantity}</Text>
                  <Text style={[styles.td, styles.colSale]}>{formatMoney(partLineSale(item))}</Text>
                </View>
              );
            })
          )}
        </View>

        {extras.length > 0 ? (
          <>
            <View style={styles.tableSectionHeader} wrap={false}>
              <View style={styles.tableSectionAccent} />
              <Text style={styles.tableSectionTitle}>Extras incluidos</Text>
            </View>
            <View style={styles.tableOuter}>
              <LineTableHeaderThreeCol />
              {extras.map((line, index) => {
                const isLast = index === extras.length - 1;
                const zebra = index % 2 === 1;
                return (
                  <View
                    key={line.id}
                    style={[styles.tableRow, ...(zebra ? [styles.tableRowAlt] : []), ...(isLast ? [styles.tableRowLast] : [])]}
                    wrap={false}
                  >
                    <Text style={[styles.td, styles.colConcept]} wrap>
                      {line.name}
                    </Text>
                    <Text style={[styles.td, styles.colQty]}>{line.quantity}</Text>
                    <Text style={[styles.td, styles.colSale]}>{formatMoney(extraLineSale(line))}</Text>
                  </View>
                );
              })}
            </View>
          </>
        ) : null}

        {hasClientNotes ? (
          <View style={styles.notesCard} wrap={false}>
            <Text style={styles.notesTitle}>Notas</Text>
            <Text style={styles.notesBody}>{notesPdf}</Text>
          </View>
        ) : null}

        {reservedTotals ? (
          <View style={styles.reservaStrip} wrap={false}>
            <Text style={styles.reservaLabel}>Reserva cobrada</Text>
            <Text style={styles.reservaAmount}>{formatMoney(reservedTotals.deposit)}</Text>
          </View>
        ) : null}

        <View style={styles.totalStrip} wrap={false}>
          <View style={styles.totalStripAccent} />
          <View style={styles.totalStripInner}>
            <View>
              <Text style={styles.totalLabel}>
                {reservedTotals ? "Restante a abonar" : "Total montaje"}
              </Text>
              <Text style={styles.totalHint}>
                {reservedTotals
                  ? "Importe pendiente (precio total menos reserva cobrada)"
                  : "Precio de venta final"}
              </Text>
            </View>
            <Text style={styles.totalValue}>
              {formatMoney(reservedTotals ? reservedTotals.remaining : build.totalSale)}
            </Text>
          </View>
        </View>

        <FooterBlock />
      </Page>
    </Document>
  );
}
