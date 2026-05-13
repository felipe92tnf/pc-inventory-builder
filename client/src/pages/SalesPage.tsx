import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useSales } from "../hooks/useSales";
import type { MonthlySalesSummaryRow, SaleListRow } from "../types/sale";
import type { ServiceRow, ServiceStatus, ServiceType } from "../types/service";
import * as servicesApi from "../api/services";
import {
  combinePcMonthWithServices,
  extendYearRangeWithServices,
  filterSalesByMonth,
  mergeSalesAndServicesMonthlySummaries,
  mergeYearTotalsFromMonthlySummaries,
  minMaxYearsFromData,
  monthlyRevenueSeriesCombined,
  monthTotalsFromSales,
  marginPercentOnRevenue,
  pctDelta,
  prevMonthYear,
  rankBuildsByProfit,
  rankClientsBySpend,
  yearTotalsFromSummary
} from "../utils/salesStats";
import { SECONDARY_BUTTON_SM, SECONDARY_GHOST_SM } from "../theme/actionButtons";
import {
  SUMMARY_CARD_GRID,
  SUMMARY_CARD_LABEL,
  SUMMARY_CARD_SHELL,
  SUMMARY_CARD_SHELL_MONTH,
  SUMMARY_VALUE_NEGATIVE,
  SUMMARY_VALUE_NEUTRAL,
  SUMMARY_VALUE_PROFIT_CYAN,
  SUMMARY_VALUE_PROFIT_POS,
  SUMMARY_VALUE_REVENUE
} from "../theme/summaryCards";
import { PAGE_HERO, PAGE_OUTER_7XL_SALES, SECTION_SHELL } from "../theme/layoutDensity";
import { StatusBadge, serviceStatusVariant } from "../components/ui/StatusBadge";
import { CustomerProfileLink } from "../components/customers/CustomerProfileLink";

function money(n: number): string {
  return `${n.toFixed(2)} EUR`;
}

function monthLabel(month: number, year: number): string {
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
}

function shortMonth(month: number, year: number): string {
  return new Date(year, month - 1, 1).toLocaleDateString("es-ES", { month: "short" });
}

function profitClass(value: number): string {
  return value >= 0 ? "text-emerald-400" : "text-rose-400";
}

function isPartSaleType(type: ServiceType | string): boolean {
  return type === "SPARE_PART_SALE" || type === "PART_SALE";
}

const CHART_BAR_MAX_PX = 168;

const SALES_MOBILE_ROW_BTN =
  "min-h-[44px] w-full justify-center px-4 py-2.5 text-sm font-semibold";

const SERVICE_STATUS_LABELS: Record<ServiceStatus, string> = {
  PENDING: "Pendiente",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado"
};

function DeltaBadge({ value, invert }: { value: number | null; invert?: boolean }) {
  if (value === null) return <span className="text-slate-500">—</span>;
  const flat = value === 0;
  const pos = value > 0;
  const neg = value < 0;
  let tone = "bg-slate-800 text-slate-400";
  if (!flat) {
    if (invert) {
      tone = neg ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300";
    } else {
      tone = pos ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300";
    }
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${tone}`}>
      {flat ? "0 %" : `${pos ? "+" : ""}${value.toFixed(1)} %`}
    </span>
  );
}

function ChevronSales({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function YearRevenueChart({ series, year }: { series: { month: number; revenue: number }[]; year: number }) {
  const max = Math.max(...series.map((s) => s.revenue), 1);
  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-[640px] items-end gap-2 md:gap-3" style={{ height: CHART_BAR_MAX_PX + 28 }}>
        {series.map(({ month, revenue }) => {
          const barH = max > 0 ? Math.max((revenue / max) * CHART_BAR_MAX_PX, revenue > 0 ? 3 : 0) : 0;
          return (
            <div key={month} className="flex min-w-0 flex-1 flex-col items-center justify-end">
              <div
                className="w-full max-w-full rounded-t-md bg-gradient-to-t from-indigo-700 to-cyan-500/75 shadow-sm shadow-indigo-900/40 transition hover:opacity-90"
                style={{ height: barH }}
                title={`${shortMonth(month, year)}: ${money(revenue)}`}
              />
              <span className="mt-2 text-center text-[10px] font-medium capitalize leading-tight text-slate-500">
                {shortMonth(month, year)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SalesPage() {
  const { sales, summary, servicesSummary, loading, error, reload } = useSales();
  const [completedServices, setCompletedServices] = useState<ServiceRow[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [servicesError, setServicesError] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [flashMessage, setFlashMessage] = useState<string | null>(null);

  const now = useMemo(() => new Date(), []);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);

  useEffect(() => {
    const msg = (location.state as { flash?: string } | null)?.flash;
    if (!msg) return;
    setFlashMessage(msg);
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.pathname, location.state, navigate]);

  const { minYear, maxYear } = useMemo(
    () => extendYearRangeWithServices(minMaxYearsFromData(summary, sales), servicesSummary),
    [summary, sales, servicesSummary]
  );

  const yearOptions = useMemo(() => {
    const out: number[] = [];
    const from = Math.min(minYear, selectedYear);
    const to = Math.max(maxYear, selectedYear, now.getFullYear());
    for (let y = from; y <= to; y++) out.push(y);
    if (!out.includes(now.getFullYear())) out.push(now.getFullYear());
    return [...new Set(out)].sort((a, b) => a - b);
  }, [minYear, maxYear, selectedYear, now]);

  const selectedMonthStats = useMemo(() => {
    const pc = monthTotalsFromSales(sales, selectedYear, selectedMonth);
    const svc = servicesSummary.find((r) => r.year === selectedYear && r.month === selectedMonth);
    return combinePcMonthWithServices(pc, svc);
  }, [sales, servicesSummary, selectedYear, selectedMonth]);

  const prevYM = useMemo(() => prevMonthYear(selectedYear, selectedMonth), [selectedYear, selectedMonth]);
  const previousMonthStats = useMemo(() => {
    const pc = monthTotalsFromSales(sales, prevYM.year, prevYM.month);
    const svc = servicesSummary.find((r) => r.year === prevYM.year && r.month === prevYM.month);
    return combinePcMonthWithServices(pc, svc);
  }, [sales, servicesSummary, prevYM.year, prevYM.month]);

  const selectedMonthPcOnly = useMemo(
    () => monthTotalsFromSales(sales, selectedYear, selectedMonth),
    [sales, selectedYear, selectedMonth]
  );
  const selectedMonthSvcRow = useMemo(
    () => servicesSummary.find((r) => r.year === selectedYear && r.month === selectedMonth),
    [servicesSummary, selectedYear, selectedMonth]
  );

  const marginSelected = useMemo(
    () => marginPercentOnRevenue(selectedMonthStats.totalRevenue, selectedMonthStats.totalProfit),
    [selectedMonthStats.totalRevenue, selectedMonthStats.totalProfit]
  );

  const annualTotals = useMemo(
    () => mergeYearTotalsFromMonthlySummaries(summary, servicesSummary, selectedYear),
    [summary, servicesSummary, selectedYear]
  );

  const annualTotalsPcOnly = useMemo(
    () => yearTotalsFromSummary(summary, selectedYear),
    [summary, selectedYear]
  );

  const annualServicesCount = useMemo(() => {
    let n = 0;
    for (const r of servicesSummary) {
      if (r.year === selectedYear) {
        n += r.servicesCount;
      }
    }
    return n;
  }, [servicesSummary, selectedYear]);

  const marginAnnual = useMemo(
    () => marginPercentOnRevenue(annualTotals.totalRevenue, annualTotals.totalProfit),
    [annualTotals.totalRevenue, annualTotals.totalProfit]
  );

  const revenueSeries = useMemo(
    () => monthlyRevenueSeriesCombined(summary, servicesSummary, selectedYear),
    [summary, servicesSummary, selectedYear]
  );

  const mergedHistoricSummary = useMemo(
    () => mergeSalesAndServicesMonthlySummaries(summary, servicesSummary),
    [summary, servicesSummary]
  );

  const salesInSelectedMonth = useMemo(
    () => filterSalesByMonth(sales, selectedYear, selectedMonth),
    [sales, selectedYear, selectedMonth]
  );

  useEffect(() => {
    let active = true;
    setServicesLoading(true);
    setServicesError(null);
    void servicesApi
      .listServices({ month: selectedMonth, year: selectedYear, status: "COMPLETED" })
      .then((rows) => {
        if (!active) return;
        setCompletedServices(rows);
      })
      .catch((err) => {
        if (!active) return;
        setServicesError(err instanceof Error ? err.message : "No se pudieron cargar los servicios completados.");
        setCompletedServices([]);
      })
      .finally(() => {
        if (!active) return;
        setServicesLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selectedMonth, selectedYear]);

  const partSales = useMemo(
    () => completedServices.filter((row) => isPartSaleType(row.type)),
    [completedServices]
  );
  const technicalServices = useMemo(
    () => completedServices.filter((row) => !isPartSaleType(row.type)),
    [completedServices]
  );

  const pcMonthTotals = useMemo(() => {
    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;
    for (const sale of salesInSelectedMonth) {
      totalRevenue += sale.finalSalePrice;
      totalCost += sale.totalCost;
      totalProfit += sale.profit;
    }
    return {
      totalRevenue,
      totalCost,
      totalProfit,
      totalOperations: salesInSelectedMonth.length
    };
  }, [salesInSelectedMonth]);

  const technicalTotals = useMemo(() => {
    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;
    for (const row of technicalServices) {
      totalRevenue += row.salePrice;
      totalCost += row.costPrice;
      totalProfit += row.profit;
    }
    return {
      totalRevenue,
      totalCost,
      totalProfit,
      totalOperations: technicalServices.length
    };
  }, [technicalServices]);

  const partSalesTotals = useMemo(() => {
    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;
    for (const row of partSales) {
      totalRevenue += row.salePrice;
      totalCost += row.costPrice;
      totalProfit += row.profit;
    }
    return {
      totalRevenue,
      totalCost,
      totalProfit,
      totalOperations: partSales.length
    };
  }, [partSales]);

  const globalMonthSummary = useMemo(
    () => ({
      totalRevenue:
        pcMonthTotals.totalRevenue + technicalTotals.totalRevenue + partSalesTotals.totalRevenue,
      totalCost: pcMonthTotals.totalCost + technicalTotals.totalCost + partSalesTotals.totalCost,
      totalProfit:
        pcMonthTotals.totalProfit + technicalTotals.totalProfit + partSalesTotals.totalProfit,
      totalOperations:
        pcMonthTotals.totalOperations + technicalTotals.totalOperations + partSalesTotals.totalOperations,
      pcProfit: pcMonthTotals.totalProfit,
      serviceProfit: technicalTotals.totalProfit,
      partSaleProfit: partSalesTotals.totalProfit
    }),
    [pcMonthTotals, technicalTotals, partSalesTotals]
  );

  const topBuilds = useMemo(() => rankBuildsByProfit(salesInSelectedMonth, 10), [salesInSelectedMonth]);
  const topClients = useMemo(() => rankClientsBySpend(salesInSelectedMonth, 10), [salesInSelectedMonth]);

  const deltaRevenue = useMemo(
    () => pctDelta(selectedMonthStats.totalRevenue, previousMonthStats.totalRevenue),
    [selectedMonthStats.totalRevenue, previousMonthStats.totalRevenue]
  );
  const deltaCost = useMemo(
    () => pctDelta(selectedMonthStats.totalCost, previousMonthStats.totalCost),
    [selectedMonthStats.totalCost, previousMonthStats.totalCost]
  );
  const deltaProfit = useMemo(
    () => pctDelta(selectedMonthStats.totalProfit, previousMonthStats.totalProfit),
    [selectedMonthStats.totalProfit, previousMonthStats.totalProfit]
  );

  const [mobileSalesOpen, setMobileSalesOpen] = useState({
    stats: false,
    compare: false,
    annual: false,
    builds: false,
    clients: false,
    history: false,
    salesList: false
  });

  const toggleMobileSales = (key: keyof typeof mobileSalesOpen) => {
    setMobileSalesOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const [salesSectionsOpen, setSalesSectionsOpen] = useState({
    pcs: false,
    services: false,
    parts: false
  });
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const toggleSalesSection = (key: "pcs" | "services" | "parts") => {
    setSalesSectionsOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className={PAGE_OUTER_7XL_SALES}>
      {flashMessage ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/40 bg-emerald-950/50 px-4 py-3 text-sm text-emerald-100">
          <span>{flashMessage}</span>
          <button
            type="button"
            onClick={() => setFlashMessage(null)}
            className="rounded-lg border border-emerald-600/50 px-3 py-1 text-xs font-semibold text-emerald-200 hover:bg-emerald-900/40"
          >
            Cerrar
          </button>
        </div>
      ) : null}

      <section className={PAGE_HERO}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Ventas</h1>

          <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-slate-400">
            Mes
            <select
              value={selectedMonth}
              disabled={loading}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="rounded-lg border border-slate-600 bg-slate-950/80 px-3 py-2 text-sm font-medium text-slate-100 outline-none ring-indigo-400/50 focus:border-indigo-400 focus:ring disabled:opacity-50"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {new Date(2000, m - 1, 1).toLocaleDateString("es-ES", { month: "long" })}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-slate-400">
            Ano
            <select
              value={selectedYear}
              disabled={loading}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="rounded-lg border border-slate-600 bg-slate-950/80 px-3 py-2 text-sm font-medium text-slate-100 outline-none ring-indigo-400/50 focus:border-indigo-400 focus:ring disabled:opacity-50"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              setSelectedYear(now.getFullYear());
              setSelectedMonth(now.getMonth() + 1);
            }}
            className={SECONDARY_BUTTON_SM}
          >
            Mes actual
          </button>
        </div>
        </div>
      </section>

      {error ? (
        <div className="flex flex-col gap-3 rounded-xl border border-rose-800/70 bg-rose-950/40 px-4 py-3 text-sm text-rose-200 md:flex-row md:items-center md:justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => {
              void reload();
            }}
            className="rounded-lg border border-rose-700 bg-rose-900/50 px-3 py-1.5 font-semibold text-rose-100 transition hover:bg-rose-800/70"
          >
            Reintentar
          </button>
        </div>
      ) : null}
      {servicesError ? (
        <div className="rounded-xl border border-rose-800/70 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">
          {servicesError}
        </div>
      ) : null}

      <section className={SECTION_SHELL}>
        <h2 className="text-xl font-semibold text-slate-100">
          Resumen global · {monthLabel(selectedMonth, selectedYear)}
        </h2>
        <div className={`mt-4 ${SUMMARY_CARD_GRID}`}>
          <article className={SUMMARY_CARD_SHELL}>
            <p className={SUMMARY_CARD_LABEL}>Ingresos</p>
            <p className={SUMMARY_VALUE_REVENUE}>{money(globalMonthSummary.totalRevenue)}</p>
          </article>
          <article className={SUMMARY_CARD_SHELL}>
            <p className={SUMMARY_CARD_LABEL}>Costes</p>
            <p className={SUMMARY_VALUE_NEUTRAL}>{money(globalMonthSummary.totalCost)}</p>
          </article>
          <article className={SUMMARY_CARD_SHELL}>
            <p className={SUMMARY_CARD_LABEL}>Beneficio</p>
            <p
              className={
                globalMonthSummary.totalProfit >= 0 ? SUMMARY_VALUE_PROFIT_POS : SUMMARY_VALUE_NEGATIVE
              }
            >
              {money(globalMonthSummary.totalProfit)}
            </p>
          </article>
          <article className={SUMMARY_CARD_SHELL}>
            <p className={SUMMARY_CARD_LABEL}>Operaciones</p>
            <p className={SUMMARY_VALUE_NEUTRAL}>{globalMonthSummary.totalOperations}</p>
          </article>
        </div>
      </section>

      {/* Listado global por secciones */}
      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-lg shadow-slate-950/40">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 border-b border-slate-800 px-4 py-3 text-left md:hidden"
          onClick={() => toggleMobileSales("salesList")}
          aria-expanded={mobileSalesOpen.salesList}
        >
          <div>
            <span className="text-base font-semibold text-slate-100">Detalle de operaciones</span>
          </div>
          <ChevronSales open={mobileSalesOpen.salesList} />
        </button>
        <div className={mobileSalesOpen.salesList ? "block" : "hidden md:block"}>
          <div className="p-5 pt-4 md:pt-5">
            <h2 className="hidden text-xl font-semibold text-slate-100 md:block">Detalle global de ventas</h2>
            {loading || servicesLoading ? (
              <p className="mt-4 text-sm text-slate-400">Cargando operaciones...</p>
            ) : globalMonthSummary.totalOperations === 0 ? (
              <p className="mt-4 text-sm text-slate-400">No hay operaciones registradas en el periodo seleccionado.</p>
            ) : (
              <div className="mt-4 space-y-4">
                <SalesOverviewSection
                  title="PCs vendidos"
                  count={pcMonthTotals.totalOperations}
                  totalRevenue={pcMonthTotals.totalRevenue}
                  totalProfit={pcMonthTotals.totalProfit}
                  open={salesSectionsOpen.pcs}
                  onToggle={() => toggleSalesSection("pcs")}
                  desktopTable={
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-slate-950/80 text-xs uppercase tracking-wide text-slate-400">
                        <tr>
                          <th className="px-3 py-2 font-semibold">Fecha</th>
                          <th className="px-3 py-2 font-semibold">Cliente</th>
                          <th className="px-3 py-2 font-semibold">Montaje</th>
                          <th className="px-3 py-2 font-semibold text-right">Coste</th>
                          <th className="px-3 py-2 font-semibold text-right">Venta</th>
                          <th className="px-3 py-2 font-semibold text-right">Beneficio</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 bg-slate-900/40">
                        {salesInSelectedMonth.map((sale) => (
                          <tr key={sale.id} className="transition hover:bg-slate-800/40">
                            <td className="px-3 py-2 text-slate-400">
                              {new Date(sale.soldAt).toLocaleDateString("es-ES")}
                            </td>
                            <td className="px-3 py-2 text-slate-300">
                              <div>{sale.customerName}</div>
                              <CustomerProfileLink
                                customerName={sale.customerName}
                                customerPhone={sale.customerPhone}
                                className="mt-0.5 inline-flex text-[11px]"
                              />
                            </td>
                            <td className="px-3 py-2 font-medium text-slate-100">{sale.build.name}</td>
                            <td className="px-3 py-2 text-right text-slate-400">{money(sale.totalCost)}</td>
                            <td className="px-3 py-2 text-right text-emerald-400">{money(sale.finalSalePrice)}</td>
                            <td className={`px-3 py-2 text-right font-semibold ${profitClass(sale.profit)}`}>
                              {money(sale.profit)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  }
                  mobileCards={salesInSelectedMonth.map((sale) => (
                    <article key={sale.id} className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="text-xs text-slate-500">{new Date(sale.soldAt).toLocaleDateString("es-ES")}</p>
                        <StatusBadge variant="sold" size="table">
                          Vendido
                        </StatusBadge>
                      </div>
                      <p className="mt-1 break-words font-semibold text-slate-100">{sale.build.name}</p>
                      <p className="text-sm text-slate-300">{sale.customerName}</p>
                      <CustomerProfileLink
                        customerName={sale.customerName}
                        customerPhone={sale.customerPhone}
                        className="mt-1 inline-flex text-xs"
                      />
                      <dl className="mt-2 space-y-1 border-t border-slate-800/80 pt-2 text-xs">
                        <div className="flex justify-between gap-3">
                          <dt className="shrink-0 text-slate-500">Coste</dt>
                          <dd className="min-w-0 text-right text-slate-300">{money(sale.totalCost)}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="shrink-0 text-slate-500">Venta</dt>
                          <dd className="min-w-0 text-right text-emerald-300">{money(sale.finalSalePrice)}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="shrink-0 text-slate-500">Beneficio</dt>
                          <dd className={`min-w-0 text-right font-semibold ${profitClass(sale.profit)}`}>
                            {money(sale.profit)}
                          </dd>
                        </div>
                      </dl>
                      <Link
                        to={`/sales/${sale.id}`}
                        className={`${SECONDARY_GHOST_SM} ${SALES_MOBILE_ROW_BTN} mt-3 inline-flex`}
                      >
                        Ver venta
                      </Link>
                    </article>
                  ))}
                />

                <SalesOverviewSection
                  title="Servicios técnicos"
                  count={technicalTotals.totalOperations}
                  totalRevenue={technicalTotals.totalRevenue}
                  totalProfit={technicalTotals.totalProfit}
                  open={salesSectionsOpen.services}
                  onToggle={() => toggleSalesSection("services")}
                  desktopTable={
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-slate-950/80 text-xs uppercase tracking-wide text-slate-400">
                        <tr>
                          <th className="px-3 py-2 font-semibold">Fecha</th>
                          <th className="px-3 py-2 font-semibold">Cliente</th>
                          <th className="px-3 py-2 font-semibold">Telefono</th>
                          <th className="px-3 py-2 font-semibold">Tipo</th>
                          <th className="px-3 py-2 font-semibold">Descripcion</th>
                          <th className="px-3 py-2 font-semibold text-right">Coste</th>
                          <th className="px-3 py-2 font-semibold text-right">Venta</th>
                          <th className="px-3 py-2 font-semibold text-right">Beneficio</th>
                          <th className="px-3 py-2 font-semibold">Pago</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 bg-slate-900/40">
                        {technicalServices.map((row) => (
                          <tr key={row.id} className="transition hover:bg-slate-800/40">
                            <td className="px-3 py-2 text-slate-400">{new Date(row.serviceDate).toLocaleDateString("es-ES")}</td>
                            <td className="px-3 py-2 text-slate-300">
                              <div>{row.customerName}</div>
                              <CustomerProfileLink
                                customerName={row.customerName}
                                customerPhone={row.customerPhone}
                                className="mt-0.5 inline-flex text-[11px]"
                              />
                            </td>
                            <td className="px-3 py-2 text-slate-400">{row.customerPhone || "—"}</td>
                            <td className="px-3 py-2 text-slate-400">{row.title}</td>
                            <td className="max-w-[280px] truncate px-3 py-2 text-slate-300" title={row.description || row.title}>
                              {row.description || row.title}
                            </td>
                            <td className="px-3 py-2 text-right text-slate-400">{money(row.costPrice)}</td>
                            <td className="px-3 py-2 text-right text-emerald-400">{money(row.salePrice)}</td>
                            <td className={`px-3 py-2 text-right font-semibold ${profitClass(row.profit)}`}>{money(row.profit)}</td>
                            <td className="px-3 py-2 text-slate-400">{row.paymentMethod || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  }
                  mobileCards={technicalServices.map((row) => (
                    <article key={row.id} className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="text-xs text-slate-500">{new Date(row.serviceDate).toLocaleDateString("es-ES")}</p>
                        <StatusBadge variant={serviceStatusVariant(row.status)} size="table">
                          {SERVICE_STATUS_LABELS[row.status]}
                        </StatusBadge>
                      </div>
                      <p className="mt-1 break-words font-semibold text-slate-100">{row.title}</p>
                      <p className="text-sm text-slate-300">
                        {row.customerName}
                        {row.customerPhone ? ` · ${row.customerPhone}` : ""}
                      </p>
                      <CustomerProfileLink
                        customerName={row.customerName}
                        customerPhone={row.customerPhone}
                        className="mt-1 inline-flex text-xs"
                      />
                      <p className="mt-1 line-clamp-2 text-xs text-slate-400">{row.description || row.title}</p>
                      <p className="mt-1 text-xs text-slate-500">Pago: {row.paymentMethod || "—"}</p>
                      <dl className="mt-2 space-y-1 border-t border-slate-800/80 pt-2 text-xs">
                        <div className="flex justify-between gap-3">
                          <dt className="shrink-0 text-slate-500">Coste</dt>
                          <dd className="min-w-0 text-right text-slate-300">{money(row.costPrice)}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="shrink-0 text-slate-500">Venta</dt>
                          <dd className="min-w-0 text-right text-emerald-300">{money(row.salePrice)}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="shrink-0 text-slate-500">Beneficio</dt>
                          <dd className={`min-w-0 text-right font-semibold ${profitClass(row.profit)}`}>
                            {money(row.profit)}
                          </dd>
                        </div>
                      </dl>
                    </article>
                  ))}
                />

                <SalesOverviewSection
                  title="Piezas sueltas vendidas"
                  count={partSalesTotals.totalOperations}
                  totalRevenue={partSalesTotals.totalRevenue}
                  totalProfit={partSalesTotals.totalProfit}
                  open={salesSectionsOpen.parts}
                  onToggle={() => toggleSalesSection("parts")}
                  desktopTable={
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-slate-950/80 text-xs uppercase tracking-wide text-slate-400">
                        <tr>
                          <th className="px-3 py-2 font-semibold">Fecha</th>
                          <th className="px-3 py-2 font-semibold">Cliente</th>
                          <th className="px-3 py-2 font-semibold">Telefono</th>
                          <th className="px-3 py-2 font-semibold">Tipo</th>
                          <th className="px-3 py-2 font-semibold">Pieza / descripcion</th>
                          <th className="px-3 py-2 font-semibold text-right">Coste</th>
                          <th className="px-3 py-2 font-semibold text-right">Venta</th>
                          <th className="px-3 py-2 font-semibold text-right">Beneficio</th>
                          <th className="px-3 py-2 font-semibold">Pago</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 bg-slate-900/40">
                        {partSales.map((row) => (
                          <tr key={row.id} className="transition hover:bg-slate-800/40">
                            <td className="px-3 py-2 text-slate-400">{new Date(row.serviceDate).toLocaleDateString("es-ES")}</td>
                            <td className="px-3 py-2 text-slate-300">
                              <div>{row.customerName}</div>
                              <CustomerProfileLink
                                customerName={row.customerName}
                                customerPhone={row.customerPhone}
                                className="mt-0.5 inline-flex text-[11px]"
                              />
                            </td>
                            <td className="px-3 py-2 text-slate-400">{row.customerPhone || "—"}</td>
                            <td className="px-3 py-2 text-slate-400">{row.title}</td>
                            <td className="max-w-[280px] truncate px-3 py-2 text-slate-300" title={row.selectedPart?.name ?? row.description}>
                              {row.selectedPart?.name ?? row.description ?? row.title}
                            </td>
                            <td className="px-3 py-2 text-right text-slate-400">{money(row.costPrice)}</td>
                            <td className="px-3 py-2 text-right text-emerald-400">{money(row.salePrice)}</td>
                            <td className={`px-3 py-2 text-right font-semibold ${profitClass(row.profit)}`}>{money(row.profit)}</td>
                            <td className="px-3 py-2 text-slate-400">{row.paymentMethod || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  }
                  mobileCards={partSales.map((row) => (
                    <article key={row.id} className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="text-xs text-slate-500">{new Date(row.serviceDate).toLocaleDateString("es-ES")}</p>
                        <StatusBadge variant={serviceStatusVariant(row.status)} size="table">
                          {SERVICE_STATUS_LABELS[row.status]}
                        </StatusBadge>
                      </div>
                      <p className="mt-1 break-words font-semibold text-slate-100">
                        {row.selectedPart?.name ?? row.title}
                      </p>
                      <p className="text-sm text-slate-300">
                        {row.customerName}
                        {row.customerPhone ? ` · ${row.customerPhone}` : ""}
                      </p>
                      <CustomerProfileLink
                        customerName={row.customerName}
                        customerPhone={row.customerPhone}
                        className="mt-1 inline-flex text-xs"
                      />
                      <p className="mt-1 line-clamp-2 text-xs text-slate-400">{row.description || row.title}</p>
                      <p className="mt-1 text-xs text-slate-500">Pago: {row.paymentMethod || "—"}</p>
                      <dl className="mt-2 space-y-1 border-t border-slate-800/80 pt-2 text-xs">
                        <div className="flex justify-between gap-3">
                          <dt className="shrink-0 text-slate-500">Coste</dt>
                          <dd className="min-w-0 text-right text-slate-300">{money(row.costPrice)}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="shrink-0 text-slate-500">Venta</dt>
                          <dd className="min-w-0 text-right text-emerald-300">{money(row.salePrice)}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="shrink-0 text-slate-500">Beneficio</dt>
                          <dd className={`min-w-0 text-right font-semibold ${profitClass(row.profit)}`}>
                            {money(row.profit)}
                          </dd>
                        </div>
                      </dl>
                    </article>
                  ))}
                />
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-lg shadow-slate-950/40">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 border-b border-slate-800 px-4 py-3 text-left"
          onClick={() => setAdvancedOpen((prev) => !prev)}
          aria-expanded={advancedOpen}
        >
          <div>
            <span className="text-base font-semibold text-slate-100">Estadísticas avanzadas</span>
          </div>
          <ChevronSales open={advancedOpen} />
        </button>
        {advancedOpen ? (
          <div className="space-y-4 p-3 md:p-4">
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
              <h3 className="text-lg font-semibold text-slate-100">
                Comparativa vs {monthLabel(prevYM.month, prevYM.year)}
              </h3>
              <dl className={`mt-3 ${SUMMARY_CARD_GRID}`}>
                <div className={SUMMARY_CARD_SHELL}>
                  <dt className={SUMMARY_CARD_LABEL}>Ingresos</dt>
                  <dd className="mt-2 flex flex-wrap items-center gap-2">
                    <span className={SUMMARY_VALUE_REVENUE}>{money(selectedMonthStats.totalRevenue)}</span>
                    <DeltaBadge value={deltaRevenue} />
                  </dd>
                </div>
                <div className={SUMMARY_CARD_SHELL}>
                  <dt className={SUMMARY_CARD_LABEL}>Costes</dt>
                  <dd className="mt-2 flex flex-wrap items-center gap-2">
                    <span className={SUMMARY_VALUE_NEUTRAL}>{money(selectedMonthStats.totalCost)}</span>
                    <DeltaBadge value={deltaCost} invert />
                  </dd>
                </div>
                <div className={SUMMARY_CARD_SHELL}>
                  <dt className={SUMMARY_CARD_LABEL}>Beneficio</dt>
                  <dd className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={
                        selectedMonthStats.totalProfit >= 0
                          ? SUMMARY_VALUE_PROFIT_POS
                          : SUMMARY_VALUE_NEGATIVE
                      }
                    >
                      {money(selectedMonthStats.totalProfit)}
                    </span>
                    <DeltaBadge value={deltaProfit} />
                  </dd>
                </div>
              </dl>
            </div>

            <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
              <article className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                <h3 className="text-base font-semibold text-slate-100">Acumulado anual {selectedYear}</h3>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between"><dt className="text-slate-500">Ingresos</dt><dd>{money(annualTotals.totalRevenue)}</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-500">Costes</dt><dd>{money(annualTotals.totalCost)}</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-500">Beneficio</dt><dd className={profitClass(annualTotals.totalProfit)}>{money(annualTotals.totalProfit)}</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-500">Margen</dt><dd>{marginAnnual.toFixed(1)} %</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-500">Operaciones</dt><dd>{annualTotals.salesCount}</dd></div>
                </dl>
              </article>
              <article className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 xl:col-span-2">
                <h3 className="text-base font-semibold text-slate-100">Ingresos por mes ({selectedYear})</h3>
                <div className="mt-3">
                  <YearRevenueChart series={revenueSeries} year={selectedYear} />
                </div>
              </article>
            </div>

            <section className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <article className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                <h3 className="text-base font-semibold text-slate-100">Montajes más rentables</h3>
                {topBuilds.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-500">Sin ventas este mes.</p>
                ) : (
                  <ol className="mt-3 space-y-2">
                    {topBuilds.map((row, idx) => (
                      <li key={row.buildId} className="flex justify-between rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm">
                        <span className="truncate text-slate-200">{idx + 1}. {row.name}</span>
                        <span className={profitClass(row.profit)}>{money(row.profit)}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </article>
              <article className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                <h3 className="text-base font-semibold text-slate-100">Top clientes por gasto</h3>
                {topClients.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-500">Sin ventas este mes.</p>
                ) : (
                  <ol className="mt-3 space-y-2">
                    {topClients.map((row, idx) => (
                      <li key={`${row.displayName}-${row.phone}`} className="flex justify-between rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm">
                        <span className="truncate text-slate-200">{idx + 1}. {row.displayName}</span>
                        <span className="text-emerald-300">{money(row.spend)}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </article>
            </section>

            <section className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
              <h3 className="text-base font-semibold text-slate-100">Resumen mensual histórico</h3>
              {mergedHistoricSummary.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">Sin datos de ventas ni servicios todavía.</p>
              ) : (
                <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                  {mergedHistoricSummary.map((row) => (
                    <MonthlySummaryCard key={`${row.year}-${row.month}`} row={row} />
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function MonthlySummaryCard({ row }: { row: MonthlySalesSummaryRow }) {
  const margin = marginPercentOnRevenue(row.totalRevenue, row.totalProfit);
  return (
    <article className={SUMMARY_CARD_SHELL_MONTH}>
      <p className="text-xs font-semibold capitalize leading-tight text-slate-100 sm:text-sm">
        {monthLabel(row.month, row.year)}
      </p>
      <dl className="mt-2 grid flex-1 grid-cols-2 gap-2 sm:mt-3 sm:gap-2.5">
        <div>
          <dt className={SUMMARY_CARD_LABEL}>Operaciones</dt>
          <dd className={SUMMARY_VALUE_NEUTRAL}>{row.salesCount}</dd>
        </div>
        <div>
          <dt className={SUMMARY_CARD_LABEL}>Ingresos</dt>
          <dd className={SUMMARY_VALUE_REVENUE}>{money(row.totalRevenue)}</dd>
        </div>
        <div>
          <dt className={SUMMARY_CARD_LABEL}>Beneficio</dt>
          <dd className={row.totalProfit >= 0 ? SUMMARY_VALUE_PROFIT_POS : SUMMARY_VALUE_NEGATIVE}>
            {money(row.totalProfit)}
          </dd>
        </div>
        <div>
          <dt className={SUMMARY_CARD_LABEL}>Margen</dt>
          <dd className={margin >= 0 ? SUMMARY_VALUE_PROFIT_CYAN : SUMMARY_VALUE_NEGATIVE}>{margin.toFixed(1)} %</dd>
        </div>
      </dl>
    </article>
  );
}

function SalesOverviewSection({
  title,
  count,
  totalRevenue,
  totalProfit,
  open,
  onToggle,
  desktopTable,
  mobileCards
}: {
  title: string;
  count: number;
  totalRevenue: number;
  totalProfit: number;
  open: boolean;
  onToggle: () => void;
  desktopTable: ReactNode;
  mobileCards: ReactNode[];
}) {
  return (
    <article className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/40">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-3.5 py-3 text-left md:px-4 md:py-3.5"
        aria-expanded={open}
      >
        <div className="min-w-0">
          <p className="text-lg font-semibold text-slate-100">{title}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <StatusBadge variant="meta" size="detail" className="text-sm tabular-nums">
              {count}
            </StatusBadge>
            <span className="text-lg font-semibold text-emerald-300">{money(totalRevenue)}</span>
            <span className={`text-base font-semibold ${totalProfit >= 0 ? "text-cyan-300" : "text-rose-300"}`}>
              {money(totalProfit)}
            </span>
          </div>
        </div>
        <ChevronSales open={open} />
      </button>
      {open ? (
        <div className="border-t border-slate-800 p-3">
          {count === 0 ? (
            <p className="text-sm text-slate-500">Sin registros en este periodo.</p>
          ) : (
            <>
              <div className="hidden overflow-x-auto rounded-lg border border-slate-800 md:block">
                {desktopTable}
              </div>
              <div className="space-y-2 md:hidden">{mobileCards}</div>
            </>
          )}
        </div>
      ) : null}
    </article>
  );
}
