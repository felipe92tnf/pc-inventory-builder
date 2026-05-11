import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Quote, QuoteStatus } from "../../types/quote";

/** Nombre comercial mostrado en el PDF del presupuesto. */
export const QUOTE_PDF_BUSINESS_NAME = "SecondByte";

const QUOTE_PDF_SLOGAN = "Tecnología que te conecta";

/** Datos de contacto de la tienda (editar según negocio real). */
const STORE_CONTACT = {
  phone: "+34 900 000 000",
  email: "contacto@secondbyte.es",
  web: "www.secondbyte.es",
  address: "Tu dirección comercial"
} as const;

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

const STATUS_LABELS: Record<QuoteStatus, string> = {
  DRAFT: "Borrador",
  SENT: "Enviado",
  ACCEPTED: "Aceptado",
  REJECTED: "Rechazado",
  EXPIRED: "Caducado"
};

function formatDateEs(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("es-ES", { dateStyle: "medium" });
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

function truncateForPdf(s: string, maxChars: number): string {
  const t = s.trim();
  if (t.length <= maxChars) return t;
  return `${t.slice(0, maxChars - 1)}…`;
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

function TableHeaderRow() {
  return (
    <View style={styles.tableHeader} wrap={false}>
      <Text style={[styles.th, styles.colProduct]}>Producto</Text>
      <Text style={[styles.th, styles.colDesc]}>Descripción</Text>
      <Text style={[styles.th, styles.colQty]}>Cant.</Text>
      <Text style={[styles.th, styles.colUnit]}>P. unit.</Text>
      <Text style={[styles.th, styles.colTotal]}>Total</Text>
    </View>
  );
}

function TableDataRows({
  rows,
  startIndex,
  isLastSegment
}: {
  rows: NonNullable<Quote["items"]>;
  startIndex: number;
  isLastSegment: boolean;
}) {
  return (
    <>
      {rows.map((item, index) => {
        const globalIndex = startIndex + index;
        const isLast = isLastSegment && index === rows.length - 1;
        const zebra = globalIndex % 2 === 1;
        return (
          <View
            key={item.id}
            wrap={false}
            minPresenceAhead={44}
            style={[styles.tableRow, ...(zebra ? [styles.tableRowAlt] : []), ...(isLast ? [styles.tableRowLast] : [])]}
          >
            <Text style={[styles.td, styles.colProduct]} wrap>
              {item.name}
            </Text>
            <Text style={[styles.td, styles.colDesc]} wrap>
              {dashIfEmpty(item.description)}
            </Text>
            <Text style={[styles.td, styles.colQty]}>{item.quantity}</Text>
            <Text style={[styles.td, styles.colUnit]}>{formatMoney(item.unitSalePrice)}</Text>
            <Text style={[styles.td, styles.colTotal]}>{formatMoney(item.total)}</Text>
          </View>
        );
      })}
    </>
  );
}

function SummaryAndNotesBlock({
  quote,
  showTax,
  taxRate,
  taxAmt,
  notesPdf
}: {
  quote: Quote;
  showTax: boolean;
  taxRate: number | null;
  taxAmt: number;
  notesPdf: string;
}) {
  return (
    <View style={styles.bottomRow} wrap={false}>
      <View style={styles.notesColumn}>
        <View style={styles.notesCard}>
          <Text style={styles.notesTitle}>Notas</Text>
          <Text style={styles.notesBody}>{notesPdf}</Text>
        </View>
      </View>
      <View style={styles.summaryColumn}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryCardTitle}>Resumen económico</Text>
          <View style={styles.summaryInner}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{formatMoney(quote.subtotal)}</Text>
            </View>
            <View style={[styles.summaryRow, ...(!showTax ? [styles.summaryRowLast] : [])]}>
              <Text style={styles.summaryLabel}>Descuento</Text>
              <Text style={styles.summaryValue}>{formatMoney(quote.discountAmount)}</Text>
            </View>
            {showTax ? (
              <View style={[styles.summaryRow, styles.summaryRowLast]}>
                <Text style={styles.summaryLabel}>
                  IVA{taxRate != null && taxRate > 0 ? ` (${taxRate.toFixed(0)} %)` : ""}
                </Text>
                <Text style={styles.summaryValue}>{formatMoney(taxAmt)}</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.grandBox}>
            <View style={styles.grandAccent} />
            <View style={styles.grandInner}>
              <View>
                <Text style={styles.grandLabel}>TOTAL</Text>
                <Text style={styles.grandHint}>Importe final presupuestado</Text>
              </View>
              <Text style={styles.grandValue}>{formatMoney(quote.total)}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

function FooterBlock({ quote }: { quote: Quote }) {
  return (
    <View style={styles.footer} fixed>
      <View style={styles.footerTop}>
        <Text style={styles.footerBrand}>{QUOTE_PDF_BUSINESS_NAME}</Text>
        <Text
          style={styles.footerPage}
          render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
        />
      </View>
      <Text style={styles.footerLine2}>
        {STORE_CONTACT.phone} · {STORE_CONTACT.email} · {STORE_CONTACT.web} · {STORE_CONTACT.address}
      </Text>
      <Text style={styles.footerLine3}>
        Documento informativo, no factura. Precios y plazos sujetos a disponibilidad
        {quote.validUntil ? ` · Válido hasta ${formatDateEs(quote.validUntil)}` : ""}.
      </Text>
    </View>
  );
}

export type QuotePdfDocumentProps = {
  quote: Quote;
};

export function QuotePdfDocument({ quote }: QuotePdfDocumentProps) {
  const items = quote.items ?? [];
  const firstPageItems = items.slice(0, QUOTE_PDF_FIRST_PAGE_MAX_ITEMS);
  const restItems = items.slice(QUOTE_PDF_FIRST_PAGE_MAX_ITEMS);
  const remainingCount = restItems.length;
  const address = quote.customerAddress?.trim();
  const taxAmt = coerceNumber(quote.taxAmount);
  const showTax = taxAmt > 0;
  const taxRate = quote.taxRatePercent != null ? coerceNumber(quote.taxRatePercent) : null;
  const notesPdf = truncateForPdf(quote.notes?.trim() ? quote.notes.trim() : "—", NOTES_MAX_CHARS);

  const clientRows: { label: string; value: string }[] = [
    { label: "Nombre", value: dashIfEmpty(quote.customerName) },
    { label: "Teléfono", value: dashIfEmpty(quote.customerPhone) },
    { label: "Email", value: dashIfEmpty(quote.customerEmail) }
  ];
  if (address) {
    clientRows.push({ label: "Dirección", value: address });
  }

  const metaRows: { label: string; value: string }[] = [
    { label: "Presupuesto", value: `#${quote.quoteNumber}` },
    { label: "Emisión", value: formatDateEs(quote.createdAt) },
    { label: "Válido hasta", value: formatDateEs(quote.validUntil) },
    { label: "Estado", value: STATUS_LABELS[quote.status] }
  ];

  const sharedHeader = (
    <>
      <View style={styles.accentTop} fixed />
      <View style={styles.headerBand} wrap={false}>
        <View style={styles.headerLeft}>
          <SecondByteLogoMark />
          <View style={styles.brandBlock}>
            <Text style={styles.brandName}>{QUOTE_PDF_BUSINESS_NAME}</Text>
            <Text style={styles.brandSlogan}>{QUOTE_PDF_SLOGAN}</Text>
          </View>
        </View>
        <View style={styles.headerDocCol}>
          <Text style={styles.docKind}>PRESUPUESTO</Text>
          <Text style={styles.docKindSub}>Hardware · servicio</Text>
        </View>
      </View>
      <View style={styles.headerBottomLine} wrap={false} />
    </>
  );

  return (
    <Document title={`Presupuesto ${quote.quoteNumber}`} author={QUOTE_PDF_BUSINESS_NAME}>
      <Page size="A4" style={styles.page}>
        {sharedHeader}

        <Text style={styles.subjectLine} wrap={false}>
          <Text style={styles.subjectStrong}>Asunto: </Text>
          {dashIfEmpty(quote.title)}
        </Text>

        <View style={styles.infoRow} wrap={false}>
          <View style={styles.clientCard}>
            <Text style={styles.cardTitle}>Cliente</Text>
            {clientRows.map((row, i) => (
              <InfoLine key={row.label} label={row.label} value={row.value} isLast={i === clientRows.length - 1} />
            ))}
          </View>
          <View style={styles.metaCard}>
            <Text style={styles.cardTitle}>Datos del presupuesto</Text>
            {metaRows.map((row, i) => (
              <InfoLine key={row.label} label={row.label} value={row.value} isLast={i === metaRows.length - 1} />
            ))}
          </View>
        </View>

        <View style={styles.sectionRule} />

        <View style={styles.tableSectionHeader} wrap={false}>
          <View style={styles.tableSectionAccent} />
          <Text style={styles.tableSectionTitle}>Productos</Text>
        </View>

        <View style={styles.tableOuter}>
          <TableHeaderRow />
          {items.length === 0 ? (
            <View style={{ paddingHorizontal: 9 }}>
              <Text style={styles.emptyHint}>No hay líneas en este presupuesto.</Text>
            </View>
          ) : (
            <>
              <TableDataRows rows={firstPageItems} startIndex={0} isLastSegment={remainingCount === 0} />
              {remainingCount > 0 ? (
                <View style={styles.continuationNote} wrap={false}>
                  <Text style={styles.continuationText}>
                    Siguiente página: {remainingCount} línea{remainingCount === 1 ? "" : "s"} más. El resumen incluye
                    todo el presupuesto.
                  </Text>
                </View>
              ) : null}
            </>
          )}
        </View>

        {remainingCount === 0 ? (
          <>
            <SummaryAndNotesBlock
              quote={quote}
              showTax={showTax}
              taxRate={taxRate}
              taxAmt={taxAmt}
              notesPdf={notesPdf}
            />
            <FooterBlock quote={quote} />
          </>
        ) : null}
      </Page>

      {remainingCount > 0 ? (
        <Page size="A4" style={styles.pageContinuation}>
          <View style={styles.contMiniHeader} wrap={false}>
            <Text style={styles.contMiniTitle}>{QUOTE_PDF_BUSINESS_NAME}</Text>
            <Text style={styles.contMiniSub}>Presupuesto #{quote.quoteNumber} · continuación de líneas</Text>
          </View>
          <View style={styles.tableOuter}>
            <TableHeaderRow />
            <TableDataRows rows={restItems} startIndex={firstPageItems.length} isLastSegment />
          </View>
          <SummaryAndNotesBlock
            quote={quote}
            showTax={showTax}
            taxRate={taxRate}
            taxAmt={taxAmt}
            notesPdf={notesPdf}
          />
          <FooterBlock quote={quote} />
        </Page>
      ) : null}
    </Document>
  );
}
