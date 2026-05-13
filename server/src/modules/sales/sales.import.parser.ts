import * as XLSX from "xlsx";

const TARGET_SHEET = "Registro de Ventas";

const DEBUG =
  process.env.SALES_IMPORT_DEBUG === "1" ||
  process.env.SALES_IMPORT_DEBUG === "true";

export type ParsedImportRow = {
  sheetRow: number;
  soldAt: string | null;
  customerName: string | null;
  description: string | null;
  totalCost: number | null;
  finalSalePrice: number | null;
  customerPhone: string | null;
  errors: string[];
};

/** Normaliza texto de cabecera: saltos de línea → espacio, colapsa espacios, minúsculas, sin acentos. */
export function normalizeHeaderText(v: unknown): string {
  return String(v ?? "")
    .replace(/\r\n/g, " ")
    .replace(/\r/g, " ")
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function cellToDate(value: unknown): Date | null {
  if (value == null || value === "") return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "number" && Number.isFinite(value)) {
    const fn = XLSX.SSF?.parse_date_code as ((n: number) => { y: number; m: number; d: number } | null) | undefined;
    if (typeof fn === "function") {
      const parsed = fn(value);
      if (parsed) return new Date(parsed.y, parsed.m - 1, parsed.d);
    }
    const epoch = Date.UTC(1899, 11, 30);
    const ms = epoch + Math.round(value * 86400000);
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const s = String(value).trim();
  if (!s) return null;
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d;
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (m) {
    const day = Number(m[1]);
    const month = Number(m[2]) - 1;
    let year = Number(m[3]);
    if (year < 100) year += 2000;
    const dt = new Date(year, month, day);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }
  return null;
}

/**
 * Importes: número Excel, o texto con formato ES (1.234,56), US (1,234.56), con EUR/€.
 */
export function parseMoneySpanish(value: unknown): number | null {
  if (value == null || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.round(value * 100) / 100;
  }

  let s = String(value)
    .replace(/\u00a0/g, " ")
    .replace(/\r|\n/g, " ")
    .trim();

  s = s.replace(/€/g, "").replace(/\beur\b/gi, "").replace(/\s+/g, "").trim();
  if (s === "" || s === "-" || s === "—") return null;

  const hasComma = s.includes(",");
  const hasDot = s.includes(".");

  if (hasComma && hasDot) {
    const liComma = s.lastIndexOf(",");
    const liDot = s.lastIndexOf(".");
    if (liComma > liDot) {
      s = s.replace(/\./g, "").replace(",", ".");
    } else {
      s = s.replace(/,/g, "");
    }
  } else if (hasComma) {
    const parts = s.split(",");
    const dec = parts[1] ?? "";
    if (parts.length === 2 && dec.length <= 2 && /^\d+$/.test(dec)) {
      s = `${parts[0].replace(/\./g, "")}.${dec}`;
    } else if (parts.length === 2 && dec.length === 3 && /^\d{3}$/.test(dec) && parts[0].length <= 3) {
      s = parts[0] + dec;
    } else {
      s = s.replace(/\./g, "").replace(",", ".");
    }
  }

  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}

type ColKey = "date" | "customer" | "description" | "cost" | "sale" | "profit" | "phone";

type ColMap = Partial<Record<ColKey, number>>;

/** Patrones en forma normalizada (sin acentos). Más específicos primero en cada lista. */
const COLUMN_DEFS: { key: ColKey; patterns: string[] }[] = [
  {
    key: "date",
    patterns: ["fecha venta", "fecha de venta", "fecha", "date", "dia", "fecha operacion"]
  },
  {
    key: "customer",
    patterns: [
      "nombre cliente",
      "nombre del cliente",
      "cliente",
      "customer",
      "comprador",
      "nombre"
    ]
  },
  {
    key: "description",
    patterns: [
      "descripcion",
      "detalle",
      "trabajo",
      "concepto",
      "producto",
      "notas",
      "observaciones",
      "descripcion venta"
    ]
  },
  {
    key: "cost",
    patterns: [
      "precio de coste",
      "precio coste",
      "coste total",
      "coste",
      "costo",
      "p coste",
      "cost"
    ]
  },
  {
    key: "sale",
    patterns: [
      "precio de venta",
      "precio venta",
      "precio total",
      "importe venta",
      "total venta",
      "venta",
      "importe",
      "total",
      "pvp",
      "precio total venta"
    ]
  },
  {
    key: "profit",
    patterns: ["beneficio neto", "margen bruto", "margen", "ganancia", "beneficio"]
  },
  {
    key: "phone",
    patterns: ["telefono movil", "telefono", "tel movil", "movil", "tel", "telefono cliente"]
  }
];

function patternMatchesHeader(header: string, pattern: string): boolean {
  if (header === pattern) return true;
  if (header.startsWith(`${pattern} `)) return true;
  if (header.endsWith(` ${pattern}`)) return true;
  if (pattern.length >= 4 && header.includes(pattern)) return true;
  return false;
}

function buildColumnMap(headerCells: unknown[]): ColMap | null {
  const headers = headerCells.map((c) => normalizeHeaderText(c));
  const used = new Set<number>();
  const map: ColMap = {};

  for (const { key, patterns } of COLUMN_DEFS) {
    const sorted = [...patterns].sort((a, b) => b.length - a.length);
    for (const pattern of sorted) {
      const idx = headers.findIndex((h, i) => !used.has(i) && patternMatchesHeader(h, pattern));
      if (idx >= 0) {
        map[key] = idx;
        used.add(idx);
        break;
      }
    }
  }

  const hasMoney = map.cost != null || map.sale != null || map.profit != null;
  if (!hasMoney) return null;
  if (map.date == null || map.customer == null) return null;

  return map;
}

function pickSheet(workbook: XLSX.WorkBook, isCsv: boolean): XLSX.WorkSheet | null {
  const names = workbook.SheetNames;
  const byExact = names.find((n) => n === TARGET_SHEET);
  if (byExact) return workbook.Sheets[byExact];
  const byCi = names.find((n) => normalizeHeaderText(n) === normalizeHeaderText(TARGET_SHEET));
  if (byCi) return workbook.Sheets[byCi];
  if (isCsv && names.length >= 1) {
    return workbook.Sheets[names[0]] ?? null;
  }
  return null;
}

export function parseSalesImportFile(buffer: Buffer, originalName: string): ParsedImportRow[] {
  const lower = originalName.toLowerCase();
  const isCsv = lower.endsWith(".csv");
  const workbook = XLSX.read(buffer, {
    type: "buffer",
    cellDates: true,
    raw: false
  });

  const sheet = pickSheet(workbook, isCsv);
  if (!sheet) {
    throw new Error(
      isCsv
        ? `No se encontró la hoja "${TARGET_SHEET}". En CSV se usa la primera hoja solo si existe; exporta la pestaña correcta a .xlsx o incluye cabeceras reconocibles.`
        : `No se encontró la hoja "${TARGET_SHEET}" en el libro.`
    );
  }

  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
    blankrows: false
  }) as unknown[][];

  let headerRowIdx = -1;
  let colMap: ColMap | null = null;
  const maxHeaderScan = Math.min(40, matrix.length);

  for (let i = 0; i < maxHeaderScan; i++) {
    const row = matrix[i] ?? [];
    const m = buildColumnMap(row);
    if (m) {
      headerRowIdx = i;
      colMap = m;
      break;
    }
  }

  if (!colMap || headerRowIdx < 0) {
    throw new Error(
      "No se detectó una fila de cabeceras con fecha, cliente y al menos una columna de importe (coste, venta o beneficio)."
    );
  }

  const headerRaw = matrix[headerRowIdx] ?? [];
  const headerNorm = headerRaw.map((c) => normalizeHeaderText(c));

  if (DEBUG) {
    console.log("[sales-import] Fila cabecera Excel:", headerRowIdx + 1);
    console.log("[sales-import] Cabeceras (texto original):", headerRaw.map((c) => String(c ?? "")));
    console.log("[sales-import] Cabeceras (normalizadas):", headerNorm);
    console.log("[sales-import] Mapeo columnas:", JSON.stringify(colMap));
  }

  const out: ParsedImportRow[] = [];

  for (let r = headerRowIdx + 1; r < matrix.length; r++) {
    const row = matrix[r] ?? [];
    const isEmpty = row.every((c) => String(c ?? "").trim() === "");
    if (isEmpty) continue;

    const errors: string[] = [];
    const dateRaw = colMap.date != null ? row[colMap.date] : null;
    const custRaw = colMap.customer != null ? row[colMap.customer] : null;
    const descRaw = colMap.description != null ? row[colMap.description] : null;
    const costRaw = colMap.cost != null ? row[colMap.cost] : null;
    const saleRaw = colMap.sale != null ? row[colMap.sale] : null;
    const profitRaw = colMap.profit != null ? row[colMap.profit] : null;
    const phoneRaw = colMap.phone != null ? row[colMap.phone] : null;

    const d = cellToDate(dateRaw);
    if (!d) errors.push("Fecha inválida o vacía.");

    const customerName = custRaw != null && String(custRaw).trim() ? String(custRaw).trim() : null;
    if (!customerName) errors.push("Cliente vacío.");

    const description =
      descRaw != null && String(descRaw).trim() ? String(descRaw).trim().slice(0, 4000) : null;

    let totalCost = parseMoneySpanish(costRaw);
    let finalSalePrice = parseMoneySpanish(saleRaw);
    const profitFromSheet = parseMoneySpanish(profitRaw);

    if (finalSalePrice == null && totalCost != null && profitFromSheet != null) {
      finalSalePrice = Math.round((totalCost + profitFromSheet) * 100) / 100;
    }
    if (totalCost == null && finalSalePrice != null && profitFromSheet != null) {
      totalCost = Math.round((finalSalePrice - profitFromSheet) * 100) / 100;
    }

    if (totalCost == null) {
      errors.push("Coste inválido o vacío (o faltan venta y beneficio para calcularlo).");
    }
    if (finalSalePrice == null) {
      errors.push("Venta inválida o vacía (o faltan coste y beneficio para calcularla).");
    }

    const customerPhone =
      phoneRaw != null && String(phoneRaw).trim() ? String(phoneRaw).trim().slice(0, 64) : null;

    const sheetRow = r + 1;

    if (DEBUG && out.length < 200) {
      console.log("[sales-import] Fila datos", sheetRow, {
        originales: { dateRaw, custRaw, costRaw, saleRaw, profitRaw },
        parseados: {
          fecha: d?.toISOString() ?? null,
          coste: totalCost,
          venta: finalSalePrice,
          beneficioHoja: profitFromSheet
        },
        erroresPreview: [...errors]
      });
    }

    out.push({
      sheetRow,
      soldAt: d ? d.toISOString() : null,
      customerName,
      description,
      totalCost,
      finalSalePrice,
      customerPhone,
      errors
    });
  }

  return out;
}
