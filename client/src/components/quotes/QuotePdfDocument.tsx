import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Quote } from "../../types/quote";

/** Nombre comercial mostrado en el PDF del presupuesto. */
export const QUOTE_PDF_BUSINESS_NAME = "PC  Builder";

const LEGAL_NOTICE =
  "Este presupuesto es válido hasta la fecha indicada. Los precios pueden variar según disponibilidad de stock.";

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

function formatDateEs(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("es-ES", { dateStyle: "long" });
  } catch {
    return "—";
  }
}

function formatMoney(n: number): string {
  return `${n.toFixed(2)} EUR`;
}

function dashIfEmpty(s: string | null | undefined): string {
  if (s == null || String(s).trim() === "") return "—";
  return String(s).trim();
}

export type QuotePdfDocumentProps = {
  quote: Quote;
};

export function QuotePdfDocument({ quote }: QuotePdfDocumentProps) {
  const items = quote.items ?? [];

  return (
    <Document title={`Presupuesto ${quote.quoteNumber}`} author={QUOTE_PDF_BUSINESS_NAME}>
      <Page size="A4" style={styles.page}>
        <View style={styles.topRule} fixed />
        <View style={styles.brandRow}>
          <Text style={styles.brandName}>{QUOTE_PDF_BUSINESS_NAME}</Text>
          <Text style={styles.docTitle}>Presupuesto</Text>
        </View>

        <View style={styles.asuntoBlock}>
          <Text style={styles.metaLabel}>Asunto</Text>
          <Text style={styles.metaValue}>{dashIfEmpty(quote.title)}</Text>
        </View>

        <View style={styles.metaGrid}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Número</Text>
            <Text style={styles.metaValue}>#{quote.quoteNumber}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Fecha</Text>
            <Text style={styles.metaValue}>{formatDateEs(quote.createdAt)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Válido hasta</Text>
            <Text style={styles.metaValue}>{formatDateEs(quote.validUntil)}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Cliente</Text>
        <View style={styles.clientBox}>
          <Text style={styles.clientLine}>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>Nombre: </Text>
            {dashIfEmpty(quote.customerName)}
          </Text>
          <Text style={styles.clientLine}>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>Teléfono: </Text>
            {dashIfEmpty(quote.customerPhone)}
          </Text>
          <Text style={styles.clientLine}>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>Email: </Text>
            {quote.customerEmail?.trim() ? quote.customerEmail.trim() : "—"}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Conceptos</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, styles.colName]}>Nombre</Text>
            <Text style={[styles.th, styles.colDesc]}>Descripción</Text>
            <Text style={[styles.th, styles.colQty]}>Cant.</Text>
            <Text style={[styles.th, styles.colUnit]}>P. unit.</Text>
            <Text style={[styles.th, styles.colTotal]}>Total</Text>
          </View>
          {items.length === 0 ? (
            <View style={{ paddingHorizontal: 6 }}>
              <Text style={styles.emptyHint}>No hay líneas en este presupuesto.</Text>
            </View>
          ) : (
            items.map((item, index) => (
              <View
                key={item.id}
                style={[styles.tableRow, ...(index === items.length - 1 ? [styles.tableRowLast] : [])]}
              >
                <Text style={[styles.td, styles.colName]} wrap>
                  {item.name}
                </Text>
                <Text style={[styles.td, styles.colDesc]} wrap>
                  {dashIfEmpty(item.description)}
                </Text>
                <Text style={[styles.td, styles.colQty]}>{item.quantity}</Text>
                <Text style={[styles.td, styles.colUnit]}>{formatMoney(item.unitSalePrice)}</Text>
                <Text style={[styles.td, styles.colTotal]}>{formatMoney(item.total)}</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.totalsBlock}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{formatMoney(quote.subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Descuento</Text>
            <Text style={styles.totalValue}>{formatMoney(quote.discountAmount)}</Text>
          </View>
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>{formatMoney(quote.total)}</Text>
          </View>
        </View>

        <View style={styles.notesBox}>
          <Text style={styles.notesTitle}>Notas</Text>
          <Text style={styles.notesBody}>{quote.notes?.trim() ? quote.notes.trim() : "—"}</Text>
        </View>

        <Text style={styles.legal}>{LEGAL_NOTICE}</Text>
      </Page>
    </Document>
  );
}
