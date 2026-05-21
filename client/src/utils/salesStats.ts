import type { MonthlyServiceSummaryRow } from "../types/service";
import type { MonthlySalesSummaryRow, SaleListRow, SaleStatus } from "../types/sale";

/** Ventas que cuentan en ingresos/beneficios (excluye revertidas). */
export function isActiveSale(sale: { status?: SaleStatus }): boolean {
  return sale.status === undefined || sale.status === "COMPLETED";
}

/** Suma mes PC ventas + servicios completados (resumenes mensuales API). */
export function combinePcMonthWithServices(
  pc: MonthlySalesSummaryRow,
  svc?: MonthlyServiceSummaryRow
): MonthlySalesSummaryRow {
  if (!svc) {
    return pc;
  }
  return {
    month: pc.month,
    year: pc.year,
    salesCount: pc.salesCount + svc.servicesCount,
    totalRevenue: pc.totalRevenue + svc.totalRevenue,
    totalCost: pc.totalCost + svc.totalCost,
    totalProfit: pc.totalProfit + svc.totalProfit
  };
}

export function mergeSalesAndServicesMonthlySummaries(
  salesRows: MonthlySalesSummaryRow[],
  serviceRows: MonthlyServiceSummaryRow[]
): MonthlySalesSummaryRow[] {
  const map = new Map<string, MonthlySalesSummaryRow>();
  const keyOf = (y: number, m: number) => `${y}-${String(m).padStart(2, "0")}`;

  for (const r of salesRows) {
    map.set(keyOf(r.year, r.month), { ...r });
  }
  for (const r of serviceRows) {
    const k = keyOf(r.year, r.month);
    const existing = map.get(k);
    if (!existing) {
      map.set(k, {
        month: r.month,
        year: r.year,
        salesCount: r.servicesCount,
        totalRevenue: r.totalRevenue,
        totalCost: r.totalCost,
        totalProfit: r.totalProfit
      });
    } else {
      map.set(k, {
        ...existing,
        salesCount: existing.salesCount + r.servicesCount,
        totalRevenue: existing.totalRevenue + r.totalRevenue,
        totalCost: existing.totalCost + r.totalCost,
        totalProfit: existing.totalProfit + r.totalProfit
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });
}

export function mergeYearTotalsFromMonthlySummaries(
  salesSummary: MonthlySalesSummaryRow[],
  servicesSummary: MonthlyServiceSummaryRow[],
  year: number
): MonthlySalesSummaryRow {
  const salesYear = yearTotalsFromSummary(salesSummary, year);
  let svcCount = 0;
  let svcRev = 0;
  let svcCost = 0;
  let svcProfit = 0;
  for (const r of servicesSummary) {
    if (r.year !== year) continue;
    svcCount += r.servicesCount;
    svcRev += r.totalRevenue;
    svcCost += r.totalCost;
    svcProfit += r.totalProfit;
  }
  return {
    month: 0,
    year,
    salesCount: salesYear.salesCount + svcCount,
    totalRevenue: salesYear.totalRevenue + svcRev,
    totalCost: salesYear.totalCost + svcCost,
    totalProfit: salesYear.totalProfit + svcProfit
  };
}

export function monthlyRevenueSeriesCombined(
  salesSummary: MonthlySalesSummaryRow[],
  servicesSummary: MonthlyServiceSummaryRow[],
  year: number
): { month: number; revenue: number }[] {
  const out: { month: number; revenue: number }[] = [];
  for (let m = 1; m <= 12; m++) {
    const s = salesSummary.find((r) => r.year === year && r.month === m);
    const sv = servicesSummary.find((r) => r.year === year && r.month === m);
    out.push({
      month: m,
      revenue: (s?.totalRevenue ?? 0) + (sv?.totalRevenue ?? 0)
    });
  }
  return out;
}

export function monthlyProfitSeriesCombined(
  salesSummary: MonthlySalesSummaryRow[],
  servicesSummary: MonthlyServiceSummaryRow[],
  year: number
): { month: number; profit: number }[] {
  const out: { month: number; profit: number }[] = [];
  for (let m = 1; m <= 12; m++) {
    const s = salesSummary.find((r) => r.year === year && r.month === m);
    const sv = servicesSummary.find((r) => r.year === year && r.month === m);
    out.push({
      month: m,
      profit: (s?.totalProfit ?? 0) + (sv?.totalProfit ?? 0)
    });
  }
  return out;
}

export function extendYearRangeWithServices(
  base: { minYear: number; maxYear: number },
  servicesSummary: Pick<MonthlyServiceSummaryRow, "year">[]
): { minYear: number; maxYear: number } {
  let minY = base.minYear;
  let maxY = base.maxYear;
  for (const r of servicesSummary) {
    minY = Math.min(minY, r.year);
    maxY = Math.max(maxY, r.year);
  }
  return { minYear: minY, maxYear: maxY };
}

export function prevMonthYear(year: number, month: number): { year: number; month: number } {
  if (month === 1) return { year: year - 1, month: 12 };
  return { year, month: month - 1 };
}

export function filterSalesByMonth(
  sales: SaleListRow[],
  year: number,
  month: number,
  options?: { activeOnly?: boolean }
): SaleListRow[] {
  const activeOnly = options?.activeOnly ?? false;
  return sales.filter((s) => {
    const d = new Date(s.soldAt);
    if (d.getFullYear() !== year || d.getMonth() + 1 !== month) return false;
    if (activeOnly && !isActiveSale(s)) return false;
    return true;
  });
}

/** Totales del mes calculados desde el listado (coherente con rankings). */
export function monthTotalsFromSales(sales: SaleListRow[], year: number, month: number): MonthlySalesSummaryRow {
  const list = filterSalesByMonth(sales, year, month, { activeOnly: true });
  let totalRevenue = 0;
  let totalCost = 0;
  let totalProfit = 0;
  for (const s of list) {
    totalRevenue += s.finalSalePrice;
    totalCost += s.totalCost;
    totalProfit += s.profit;
  }
  return {
    month,
    year,
    salesCount: list.length,
    totalRevenue,
    totalCost,
    totalProfit
  };
}

export function marginPercentOnRevenue(revenue: number, profit: number): number {
  if (revenue <= 0) return 0;
  return (profit / revenue) * 100;
}

export function yearTotalsFromSummary(summary: MonthlySalesSummaryRow[], year: number): MonthlySalesSummaryRow {
  const rows = summary.filter((r) => r.year === year);
  let salesCount = 0;
  let totalRevenue = 0;
  let totalCost = 0;
  let totalProfit = 0;
  for (const r of rows) {
    salesCount += r.salesCount;
    totalRevenue += r.totalRevenue;
    totalCost += r.totalCost;
    totalProfit += r.totalProfit;
  }
  return {
    month: 0,
    year,
    salesCount,
    totalRevenue,
    totalCost,
    totalProfit
  };
}

export type BuildProfitRank = {
  buildId: string;
  name: string;
  profit: number;
  revenue: number;
  salesCount: number;
};

export function rankBuildsByProfit(sales: SaleListRow[], limit = 8): BuildProfitRank[] {
  const map = new Map<string, BuildProfitRank>();
  for (const s of sales.filter(isActiveSale)) {
    const id = s.build.id;
    const cur = map.get(id) ?? {
      buildId: id,
      name: s.build.name,
      profit: 0,
      revenue: 0,
      salesCount: 0
    };
    cur.profit += s.profit;
    cur.revenue += s.finalSalePrice;
    cur.salesCount += 1;
    map.set(id, cur);
  }
  return [...map.values()].sort((a, b) => b.profit - a.profit).slice(0, limit);
}

export type ClientSpendRank = {
  displayName: string;
  phone: string;
  spend: number;
  orders: number;
};

export function rankClientsBySpend(sales: SaleListRow[], limit = 8): ClientSpendRank[] {
  const map = new Map<string, ClientSpendRank>();
  for (const s of sales.filter(isActiveSale)) {
    const key = `${s.customerName.trim().toLowerCase()}|${s.customerPhone.trim()}`;
    const cur = map.get(key) ?? {
      displayName: s.customerName.trim() || "Cliente",
      phone: s.customerPhone.trim(),
      spend: 0,
      orders: 0
    };
    cur.spend += s.finalSalePrice;
    cur.orders += 1;
    map.set(key, cur);
  }
  return [...map.values()].sort((a, b) => b.spend - a.spend).slice(0, limit);
}

export function monthlyRevenueSeriesForYear(
  summary: MonthlySalesSummaryRow[],
  year: number
): { month: number; revenue: number }[] {
  const out: { month: number; revenue: number }[] = [];
  for (let m = 1; m <= 12; m++) {
    const row = summary.find((r) => r.year === year && r.month === m);
    out.push({ month: m, revenue: row?.totalRevenue ?? 0 });
  }
  return out;
}

export function pctDelta(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

function isMonthBefore(
  row: Pick<MonthlySalesSummaryRow, "year" | "month">,
  year: number,
  month: number
): boolean {
  return row.year < year || (row.year === year && row.month < month);
}

/**
 * Media del beneficio mensual (salario) en todos los meses anteriores al periodo indicado.
 * Solo cuenta meses presentes en el historico combinado ventas + servicios.
 */
export function averageMonthlySalaryBefore(
  rows: MonthlySalesSummaryRow[],
  beforeYear: number,
  beforeMonth: number
): { average: number; monthsCount: number } | null {
  const previous = rows.filter((r) => isMonthBefore(r, beforeYear, beforeMonth));
  if (previous.length === 0) return null;
  const sum = previous.reduce((acc, r) => acc + r.totalProfit, 0);
  return {
    average: Math.round((sum / previous.length) * 100) / 100,
    monthsCount: previous.length
  };
}

export function minMaxYearsFromData(summary: MonthlySalesSummaryRow[], sales: SaleListRow[]): {
  minYear: number;
  maxYear: number;
} {
  let minY = new Date().getFullYear();
  let maxY = minY;
  for (const r of summary) {
    minY = Math.min(minY, r.year);
    maxY = Math.max(maxY, r.year);
  }
  for (const s of sales) {
    const y = new Date(s.soldAt).getFullYear();
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  if (!summary.length && !sales.length) {
    const y = new Date().getFullYear();
    return { minYear: y, maxYear: y };
  }
  return { minYear: minY, maxYear: maxY };
}
