/**
 * Informe PDF de inventario (uso interno). SecondByte: misma línea visual que otros PDFs.
 */
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Part, PartCondition } from "../../types/part";
import { isNonStockCategory } from "../../types/part";
import {
  groupInventoryPartsForPdf,
  shelfInventoryTotals,
  type InventoryPdfCategoryGroup
} from "../../utils/inventoryPdfExport";

const PDF_BUSINESS_NAME = "SecondByte";
const PDF_HEADER_SLOGAN = "Tecnología que te conecta";

const CLIENT_PDF_SOCIAL = {
  whatsapp: "+34 600 000 000",
  instagram: "@secondbyte",
  email: "contacto@secondbyte.es"
} as const;

const CONDITION_LABEL: Record<PartCondition, string> = {
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

function formatMoney(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return `${n.toFixed(2)} EUR`;
}

function formatExportInstant(iso: string): string {
  try {
    return new Date(iso).toLocaleString("es-ES", {
      dateStyle: "long",
      timeStyle: "short"
    });
  } catch {
    return "—";
  }
}

function clientPdfSocialLine(): string | null {
  const bits: string[] = [];
  const wa = String(CLIENT_PDF_SOCIAL.whatsapp).trim();
  const ig = String(CLIENT_PDF_SOCIAL.instagram).trim();
  const em = String(CLIENT_PDF_SOCIAL.email).trim();
  if (wa) bits.push(`WhatsApp ${wa}`);
  if (ig) bits.push(`Instagram ${ig}`);
  if (em) bits.push(em);
  if (bits.length === 0) return null;
  return bits.join(" · ");
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

function FooterBlock() {
  const socialLine = clientPdfSocialLine();
  return (
    <View style={styles.footer} fixed>
      <View style={styles.footerMainRow}>
        <View>
          <Text style={styles.footerBrand}>{PDF_BUSINESS_NAME}</Text>
          <Text style={styles.footerTagline}>{PDF_HEADER_SLOGAN}</Text>
        </View>
        <Text
          style={styles.footerPage}
          render={({ pageNumber, totalPages }) => `${pageNumber}/${totalPages}`}
        />
      </View>
      {socialLine ? <Text style={styles.footerSocials}>{socialLine}</Text> : null}
      <Text style={styles.footerLegal}>
        Informe interno de existencias. No constituye factura ni documento fiscal.
      </Text>
    </View>
  );
}

function brandModelLine(part: Part): string {
  const b = part.catalogPart?.brand?.trim();
  const m = part.catalogPart?.model?.trim();
  if (b && m) return `${b} ${m}`;
  if (b) return b;
  if (m) return m;
  return "—";
}

function conditionForRow(part: Part): string {
  if (part.inventoryKind === "PART" && part.category && isNonStockCategory(part.category)) {
    return "—";
  }
  return CONDITION_LABEL[part.condition] ?? part.condition;
}

function CategoryTable({ group }: { group: InventoryPdfCategoryGroup }) {
  let costSum = 0;
  let saleSum = 0;
  for (const p of group.parts) {
    const c = Number(p.costPrice);
    const s = Number(p.salePrice);
    const q = p.stock;
    if (Number.isFinite(c) && Number.isFinite(q)) costSum += c * q;
    if (Number.isFinite(s) && Number.isFinite(q)) saleSum += s * q;
  }

  return (
    <View>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionAccent} />
        <Text style={styles.sectionTitle}>
          {group.label} ({group.parts.length} línea{group.parts.length === 1 ? "" : "s"})
        </Text>
      </View>
      <View style={styles.tableOuter}>
        <View style={styles.tableHeader}>
          <Text style={[styles.th, styles.colArt]}>Artículo</Text>
          <Text style={[styles.th, styles.colBm]}>Marca / modelo</Text>
          <Text style={[styles.th, styles.colStock]}>Uds.</Text>
          <Text style={[styles.th, styles.colCond]}>Estado</Text>
          <Text style={[styles.th, styles.colCost]}>Coste u.</Text>
          <Text style={[styles.th, styles.colSale]}>PVP u.</Text>
        </View>
        {group.parts.map((p, index) => {
          const zebra = index % 2 === 1;
          const isLast = index === group.parts.length - 1;
          return (
            <View
              key={p.id}
              style={[
                styles.tableRow,
                ...(zebra ? [styles.tableRowAlt] : []),
                ...(isLast ? [styles.tableRowLast] : [])
              ]}
            >
              <Text style={[styles.td, styles.colArt]} wrap>
                {p.name}
              </Text>
              <Text style={[styles.td, styles.colBm]} wrap>
                {brandModelLine(p)}
              </Text>
              <Text style={[styles.td, styles.colStock]}>{p.stock}</Text>
              <Text style={[styles.td, styles.colCond]}>{conditionForRow(p)}</Text>
              <Text style={[styles.td, styles.colCost]}>{formatMoney(Number(p.costPrice))}</Text>
              <Text style={[styles.td, styles.colSale]}>{formatMoney(Number(p.salePrice))}</Text>
            </View>
          );
        })}
        <View style={styles.subtotalRow} wrap={false}>
          <Text style={styles.subtotalText}>
            Subtotal categoría — coste {formatMoney(costSum)} · venta estimada {formatMoney(saleSum)}
          </Text>
        </View>
      </View>
    </View>
  );
}

export type InventoryPdfDocumentProps = {
  parts: Part[];
  exportedAtIso: string;
  scopeDescription: string;
};

export function InventoryPdfDocument({ parts, exportedAtIso, scopeDescription }: InventoryPdfDocumentProps) {
  const totals = shelfInventoryTotals(parts);
  const groups = groupInventoryPartsForPdf(parts);

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
          <Text style={styles.docKind}>INFORME DE INVENTARIO</Text>
          <Text style={styles.docKindSub}>Agrupado por categorías</Text>
        </View>
      </View>
      <View style={styles.headerBottomLine} />
    </>
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {sharedHeader}

        <View style={styles.metaBar} wrap={false}>
          <Text style={styles.metaLine}>
            <Text style={styles.metaStrong}>Exportado: </Text>
            {formatExportInstant(exportedAtIso)}
          </Text>
          <Text style={styles.metaLine}>
            <Text style={styles.metaStrong}>Alcance: </Text>
            {scopeDescription}
          </Text>
        </View>

        <View style={styles.summaryGrid} wrap={false}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total piezas (uds.)</Text>
            <Text style={styles.summaryValue}>{totals.units}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Coste total</Text>
            <Text style={styles.summaryValue}>{formatMoney(totals.totalCostValue)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Venta estimada</Text>
            <Text style={styles.summaryValue}>{formatMoney(totals.totalSaleValue)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Beneficio potencial</Text>
            <Text style={styles.summaryValue}>{formatMoney(totals.potentialProfit)}</Text>
          </View>
        </View>

        {groups.length === 0 ? (
          <Text style={styles.emptyHint}>
            No hay líneas que coincidan con el alcance seleccionado para este informe.
          </Text>
        ) : (
          groups.map((g) => <CategoryTable key={g.key} group={g} />)
        )}

        <FooterBlock />
      </Page>
    </Document>
  );
}
