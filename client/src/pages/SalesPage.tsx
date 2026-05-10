import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useSales } from "../hooks/useSales";
import type { MonthlySalesSummaryRow, SaleListRow } from "../types/sale";
import {
  filterSalesByMonth,
  minMaxYearsFromData,
  monthlyRevenueSeriesForYear,
  monthTotalsFromSales,
  marginPercentOnRevenue,
  pctDelta,
  prevMonthYear,
  rankBuildsByProfit,
  rankClientsBySpend,
  yearTotalsFromSummary
} from "../utils/salesStats";

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

function groupSalesByMonth(sales: SaleListRow[]): { key: string; label: string; items: SaleListRow[] }[] {
  const map = new Map<string, SaleListRow[]>();
  for (const sale of sales) {
    const d = new Date(sale.soldAt);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const key = `${y}-${String(m).padStart(2, "0")}`;
    const list = map.get(key) ?? [];
    list.push(sale);
    map.set(key, list);
  }
  for (const arr of map.values()) {
    arr.sort((a, b) => new Date(b.soldAt).getTime() - new Date(a.soldAt).getTime());
  }
  return [...map.entries()]
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([key, items]) => {
      const [ys, ms] = key.split("-");
      return {
        key,
        label: monthLabel(Number(ms), Number(ys)),
        items
      };
    });
}

const CHART_BAR_MAX_PX = 168;

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
  const { sales, summary, loading, error, reload } = useSales();
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

  const { minYear, maxYear } = useMemo(() => minMaxYearsFromData(summary, sales), [summary, sales]);

  const yearOptions = useMemo(() => {
    const out: number[] = [];
    const from = Math.min(minYear, selectedYear);
    const to = Math.max(maxYear, selectedYear, now.getFullYear());
    for (let y = from; y <= to; y++) out.push(y);
    if (!out.includes(now.getFullYear())) out.push(now.getFullYear());
    return [...new Set(out)].sort((a, b) => a - b);
  }, [minYear, maxYear, selectedYear, now]);

  const selectedMonthStats = useMemo(
    () => monthTotalsFromSales(sales, selectedYear, selectedMonth),
    [sales, selectedYear, selectedMonth]
  );

  const prevYM = useMemo(() => prevMonthYear(selectedYear, selectedMonth), [selectedYear, selectedMonth]);
  const previousMonthStats = useMemo(
    () => monthTotalsFromSales(sales, prevYM.year, prevYM.month),
    [sales, prevYM.year, prevYM.month]
  );

  const marginSelected = useMemo(
    () => marginPercentOnRevenue(selectedMonthStats.totalRevenue, selectedMonthStats.totalProfit),
    [selectedMonthStats.totalRevenue, selectedMonthStats.totalProfit]
  );

  const annualTotals = useMemo(
    () => yearTotalsFromSummary(summary, selectedYear),
    [summary, selectedYear]
  );

  const marginAnnual = useMemo(
    () => marginPercentOnRevenue(annualTotals.totalRevenue, annualTotals.totalProfit),
    [annualTotals.totalRevenue, annualTotals.totalProfit]
  );

  const revenueSeries = useMemo(
    () => monthlyRevenueSeriesForYear(summary, selectedYear),
    [summary, selectedYear]
  );

  const salesInSelectedMonth = useMemo(
    () => filterSalesByMonth(sales, selectedYear, selectedMonth),
    [sales, selectedYear, selectedMonth]
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

  const grouped = useMemo(() => groupSalesByMonth(sales), [sales]);

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

  const [openSaleMonths, setOpenSaleMonths] = useState<Record<string, boolean>>({});
  const toggleSaleMonth = (monthKey: string) => {
    setOpenSaleMonths((prev) => ({
      ...prev,
      [monthKey]: !(prev[monthKey] === true)
    }));
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-2 pb-8 text-slate-100 md:px-4">
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

      <section className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 shadow-[0_20px_50px_-24px_rgba(79,70,229,0.75)]">
        <h1 className="text-2xl font-bold tracking-tight">Ventas</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">
          Estadisticas por periodo, comparativa con el mes anterior, evolucion anual y rankings de montajes y clientes.
        </p>

        <div className="mt-6 flex flex-wrap items-end gap-4">
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
            className="rounded-lg border border-slate-600 bg-slate-950/70 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 disabled:opacity-50"
          >
            Mes actual
          </button>
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

      {/* KPIs mes seleccionado */}
      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 shadow-lg shadow-slate-950/30 md:border-0 md:bg-transparent md:shadow-none">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 border-b border-slate-800 px-4 py-3.5 text-left md:hidden"
          onClick={() => toggleMobileSales("stats")}
          aria-expanded={mobileSalesOpen.stats}
        >
          <div>
            <span className="text-sm font-semibold text-slate-100">Estadisticas del mes</span>
            <p className="mt-0.5 text-xs capitalize text-slate-500">{monthLabel(selectedMonth, selectedYear)}</p>
          </div>
          <ChevronSales open={mobileSalesOpen.stats} />
        </button>
        <div
          className={
            mobileSalesOpen.stats
              ? "block"
              : "hidden md:block"
          }
        >
          <div className="px-4 pb-4 pt-1 md:px-0 md:pb-0 md:pt-0">
            <h2 className="mb-3 hidden text-sm font-semibold uppercase tracking-wider text-slate-400 md:block">
              Estadisticas del mes seleccionado
            </h2>
            <p className="mb-4 hidden text-sm text-slate-500 capitalize md:block">
              {monthLabel(selectedMonth, selectedYear)}
            </p>
            {loading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-32 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <article className="rounded-2xl border border-cyan-500/25 bg-slate-900/90 p-5 shadow-lg shadow-black/30">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Ingresos</p>
                  <p className="mt-2 text-2xl font-bold text-emerald-400">{money(selectedMonthStats.totalRevenue)}</p>
                  <p className="mt-1 text-xs text-slate-500">{selectedMonthStats.salesCount} ventas</p>
                </article>
                <article className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg shadow-black/30">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Costes</p>
                  <p className="mt-2 text-2xl font-bold text-slate-200">{money(selectedMonthStats.totalCost)}</p>
                  <p className="mt-1 text-xs text-slate-500">Coste acumulado del mes</p>
                </article>
                <article className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg shadow-black/30">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Beneficio</p>
                  <p className={`mt-2 text-2xl font-bold ${profitClass(selectedMonthStats.totalProfit)}`}>
                    {money(selectedMonthStats.totalProfit)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Ingresos menos costes</p>
                </article>
                <article className="rounded-2xl border border-indigo-500/25 bg-slate-900/90 p-5 shadow-lg shadow-black/30">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Margen medio</p>
                  <p className="mt-2 text-2xl font-bold text-indigo-300">{marginSelected.toFixed(1)} %</p>
                  <p className="mt-1 text-xs text-slate-500">Sobre ingresos del mes</p>
                </article>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Comparativa mes anterior */}
      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-lg shadow-slate-950/40">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 border-b border-slate-800 px-4 py-3.5 text-left md:hidden"
          onClick={() => toggleMobileSales("compare")}
          aria-expanded={mobileSalesOpen.compare}
        >
          <span className="text-sm font-semibold text-slate-100">Comparativa vs mes anterior</span>
          <ChevronSales open={mobileSalesOpen.compare} />
        </button>
        <div className={mobileSalesOpen.compare ? "block" : "hidden md:block"}>
          <div className="p-5 pt-4 md:pt-5">
            <h2 className="hidden text-lg font-semibold text-slate-100 md:block">Comparativa vs mes anterior</h2>
            <p className="mt-1 hidden text-sm text-slate-400 md:block">
              Variacion respecto a <span className="capitalize text-slate-300">{monthLabel(prevYM.month, prevYM.year)}</span>.
            </p>
            <p className="mt-1 text-xs text-slate-500 md:hidden">
              Vs. <span className="capitalize text-slate-400">{monthLabel(prevYM.month, prevYM.year)}</span>
            </p>
            {loading ? (
              <p className="mt-4 text-sm text-slate-500">Cargando...</p>
            ) : (
              <dl className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
              <dt className="text-xs uppercase tracking-wide text-slate-500">Ingresos</dt>
              <dd className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-lg font-semibold text-emerald-400">{money(selectedMonthStats.totalRevenue)}</span>
                <DeltaBadge value={deltaRevenue} />
              </dd>
              <p className="mt-1 text-xs text-slate-500">Anterior: {money(previousMonthStats.totalRevenue)}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
              <dt className="text-xs uppercase tracking-wide text-slate-500">Costes</dt>
              <dd className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-lg font-semibold text-slate-200">{money(selectedMonthStats.totalCost)}</span>
                <DeltaBadge value={deltaCost} invert />
              </dd>
              <p className="mt-1 text-xs text-slate-500">Anterior: {money(previousMonthStats.totalCost)}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
              <dt className="text-xs uppercase tracking-wide text-slate-500">Beneficio</dt>
              <dd className="mt-2 flex flex-wrap items-center gap-2">
                <span className={`text-lg font-semibold ${profitClass(selectedMonthStats.totalProfit)}`}>
                  {money(selectedMonthStats.totalProfit)}
                </span>
                <DeltaBadge value={deltaProfit} />
              </dd>
              <p className="mt-1 text-xs text-slate-500">Anterior: {money(previousMonthStats.totalProfit)}</p>
            </div>
              </dl>
            )}
          </div>
        </div>
      </section>

      {/* Total anual + grafico */}
      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-lg shadow-slate-950/40 md:border-0 md:bg-transparent md:shadow-none">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 border-b border-slate-800 px-4 py-3.5 text-left md:hidden"
          onClick={() => toggleMobileSales("annual")}
          aria-expanded={mobileSalesOpen.annual}
        >
          <div>
            <span className="text-sm font-semibold text-slate-100">Totales del ano e ingresos por mes</span>
            <p className="mt-0.5 text-xs text-slate-500">Acumulado {selectedYear} y grafico</p>
          </div>
          <ChevronSales open={mobileSalesOpen.annual} />
        </button>
        <div className={mobileSalesOpen.annual ? "block" : "hidden md:block"}>
          <div className="grid grid-cols-1 gap-6 p-4 pt-2 md:grid md:p-0 xl:grid-cols-3 xl:gap-6">
        <article className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-slate-900/95 to-amber-950/20 p-5 shadow-lg shadow-slate-950/40 xl:col-span-1">
          <h2 className="text-lg font-semibold text-slate-100">Total acumulado del ano {selectedYear}</h2>
          <p className="mt-1 text-sm text-slate-400">Suma de todos los meses con ventas registradas en el resumen.</p>
          {loading ? (
            <div className="mt-4 h-24 animate-pulse rounded-lg bg-slate-800/60" />
          ) : (
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-2 border-b border-slate-800/80 pb-2">
                <dt className="text-slate-500">Ingresos anuales</dt>
                <dd className="font-semibold text-emerald-400">{money(annualTotals.totalRevenue)}</dd>
              </div>
              <div className="flex justify-between gap-2 border-b border-slate-800/80 pb-2">
                <dt className="text-slate-500">Costes anuales</dt>
                <dd className="text-slate-300">{money(annualTotals.totalCost)}</dd>
              </div>
              <div className="flex justify-between gap-2 border-b border-slate-800/80 pb-2">
                <dt className="text-slate-500">Beneficio anual</dt>
                <dd className={`font-semibold ${profitClass(annualTotals.totalProfit)}`}>
                  {money(annualTotals.totalProfit)}
                </dd>
              </div>
              <div className="flex justify-between gap-2 pt-1">
                <dt className="text-slate-500">Margen medio anual</dt>
                <dd className="font-semibold text-amber-200/90">{marginAnnual.toFixed(1)} %</dd>
              </div>
              <div className="flex justify-between gap-2 text-xs text-slate-500">
                <dt>PCs vendidos (ano)</dt>
                <dd>{annualTotals.salesCount}</dd>
              </div>
            </dl>
          )}
        </article>

        <article className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg shadow-slate-950/40 xl:col-span-2">
          <h2 className="text-lg font-semibold text-slate-100">Ingresos por mes ({selectedYear})</h2>
          <p className="mt-1 text-sm text-slate-400">Barras proporcionales al mes de mayor facturacion.</p>
          {loading ? (
            <div className="mt-8 h-48 animate-pulse rounded-lg bg-slate-800/50" />
          ) : (
            <div className="mt-6">
              <YearRevenueChart series={revenueSeries} year={selectedYear} />
            </div>
          )}
        </article>
          </div>
        </div>
      </section>

      {/* Rankings */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <article className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-lg shadow-slate-950/40">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 border-b border-slate-800 px-4 py-3.5 text-left lg:hidden"
            onClick={() => toggleMobileSales("builds")}
            aria-expanded={mobileSalesOpen.builds}
          >
            <span className="text-sm font-semibold text-slate-100">Montajes mas rentables</span>
            <ChevronSales open={mobileSalesOpen.builds} />
          </button>
          <div className={mobileSalesOpen.builds ? "block" : "hidden lg:block"}>
            <div className="p-5">
              <h2 className="hidden text-lg font-semibold text-slate-100 lg:block">Montajes mas rentables</h2>
              <p className="mt-1 hidden text-sm text-slate-400 capitalize lg:block">
                Por beneficio acumulado en {monthLabel(selectedMonth, selectedYear)}.
              </p>
              <p className="text-xs text-slate-500 lg:hidden">
                {monthLabel(selectedMonth, selectedYear)}
              </p>
              {loading ? (
                <p className="mt-4 text-sm text-slate-500">Cargando...</p>
              ) : topBuilds.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">Sin ventas este mes.</p>
              ) : (
                <ol className="mt-4 space-y-3">
                  {topBuilds.map((row, idx) => (
                    <li
                      key={row.buildId}
                      className="flex items-start justify-between gap-3 rounded-xl border border-slate-800/80 bg-slate-950/40 px-3 py-2.5"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-bold text-indigo-300">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-100">{row.name}</p>
                          <p className="text-xs text-slate-500">
                            {row.salesCount} venta{row.salesCount === 1 ? "" : "s"} · Ingresos {money(row.revenue)}
                          </p>
                        </div>
                      </div>
                      <span className={`shrink-0 text-sm font-semibold ${profitClass(row.profit)}`}>{money(row.profit)}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </article>

        <article className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-lg shadow-slate-950/40">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 border-b border-slate-800 px-4 py-3.5 text-left lg:hidden"
            onClick={() => toggleMobileSales("clients")}
            aria-expanded={mobileSalesOpen.clients}
          >
            <span className="text-sm font-semibold text-slate-100">Top clientes por gasto</span>
            <ChevronSales open={mobileSalesOpen.clients} />
          </button>
          <div className={mobileSalesOpen.clients ? "block" : "hidden lg:block"}>
            <div className="p-5">
              <h2 className="hidden text-lg font-semibold text-slate-100 lg:block">Top clientes por gasto</h2>
              <p className="mt-1 hidden text-sm text-slate-400 capitalize lg:block">
                Total facturado en {monthLabel(selectedMonth, selectedYear)} (nombre + telefono).
              </p>
              <p className="text-xs text-slate-500 lg:hidden">{monthLabel(selectedMonth, selectedYear)}</p>
              {loading ? (
                <p className="mt-4 text-sm text-slate-500">Cargando...</p>
              ) : topClients.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">Sin ventas este mes.</p>
              ) : (
                <ol className="mt-4 space-y-3">
                  {topClients.map((row, idx) => (
                    <li
                      key={`${row.displayName}-${row.phone}`}
                      className="flex items-start justify-between gap-3 rounded-xl border border-slate-800/80 bg-slate-950/40 px-3 py-2.5"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-bold text-cyan-300">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-100">{row.displayName}</p>
                          <p className="truncate text-xs text-slate-500">{row.phone}</p>
                          <p className="text-xs text-slate-500">
                            {row.orders} pedido{row.orders === 1 ? "" : "s"}
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 text-sm font-semibold text-emerald-400">{money(row.spend)}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </article>
      </section>

      {/* Resumen mensual historico */}
      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-lg shadow-slate-950/40">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 border-b border-slate-800 px-4 py-3.5 text-left md:hidden"
          onClick={() => toggleMobileSales("history")}
          aria-expanded={mobileSalesOpen.history}
        >
          <span className="text-sm font-semibold text-slate-100">Resumen mensual (historico)</span>
          <ChevronSales open={mobileSalesOpen.history} />
        </button>
        <div className={mobileSalesOpen.history ? "block" : "hidden md:block"}>
          <div className="p-5">
            <h2 className="hidden text-lg font-semibold text-slate-100 md:block">Resumen mensual (historico)</h2>
            <p className="mt-1 hidden text-sm text-slate-400 md:block">
              Totales agregados por mes segun fecha de venta.
            </p>
            {loading ? (
              <p className="mt-4 text-sm text-slate-400">Cargando resumenes...</p>
            ) : summary.length === 0 ? (
              <p className="mt-4 text-sm text-slate-400">Sin datos de ventas todavia.</p>
            ) : (
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {summary.map((row) => (
                  <MonthlySummaryCard key={`${row.year}-${row.month}`} row={row} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Listado agrupado por mes */}
      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-lg shadow-slate-950/40">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 border-b border-slate-800 px-4 py-3.5 text-left md:hidden"
          onClick={() => toggleMobileSales("salesList")}
          aria-expanded={mobileSalesOpen.salesList}
        >
          <div>
            <span className="text-sm font-semibold text-slate-100">Ventas por mes</span>
            <p className="mt-0.5 text-xs text-slate-500">
              {grouped.length} mes{grouped.length === 1 ? "" : "es"} con ventas
            </p>
          </div>
          <ChevronSales open={mobileSalesOpen.salesList} />
        </button>
        <div className={mobileSalesOpen.salesList ? "block" : "hidden md:block"}>
          <div className="p-5 pt-4 md:pt-5">
            <h2 className="hidden text-lg font-semibold text-slate-100 md:block">Ventas por mes</h2>
            <p className="mt-1 hidden text-sm text-slate-400 md:block">
              Detalle de cada venta con montaje, cliente y economicos.
            </p>
            {loading ? (
              <p className="mt-4 text-sm text-slate-400">Cargando ventas...</p>
            ) : grouped.length === 0 ? (
              <p className="mt-4 text-sm text-slate-400">
                No hay ventas registradas. Desde Montajes, en un PC ensamblado, usa &quot;Vender PC&quot;.
              </p>
            ) : (
              <div className="mt-6 space-y-4 md:space-y-10">
                {grouped.map((group) => {
                  const monthOpen = openSaleMonths[group.key] === true;
                  return (
                    <div key={group.key}>
                      <button
                        type="button"
                        className="mb-2 flex w-full items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-3 text-left md:hidden"
                        onClick={() => toggleSaleMonth(group.key)}
                        aria-expanded={monthOpen}
                      >
                        <div className="min-w-0">
                          <span className="block font-semibold capitalize text-slate-100">{group.label}</span>
                          <span className="text-xs text-slate-500">
                            {group.items.length} venta{group.items.length === 1 ? "" : "s"}
                          </span>
                        </div>
                        <ChevronSales open={monthOpen} />
                      </button>
                      <div className="mb-3 hidden flex-wrap items-center gap-2 md:flex">
                        <h3 className="text-base font-semibold capitalize text-slate-100">{group.label}</h3>
                        <span className="rounded-full border border-slate-600 bg-slate-950/80 px-2.5 py-0.5 text-xs font-medium text-slate-400">
                          {group.items.length} venta{group.items.length === 1 ? "" : "s"}
                        </span>
                      </div>
                      <div className={monthOpen ? "block" : "hidden md:block"}>
                        <div className="overflow-x-auto rounded-xl border border-slate-800">
                          <table className="min-w-[920px] w-full text-left text-sm">
                    <thead className="bg-slate-950/80 text-xs uppercase tracking-wide text-slate-400">
                      <tr>
                        <th className="px-3 py-3 font-semibold">Montaje</th>
                        <th className="px-3 py-3 font-semibold">Cliente</th>
                        <th className="px-3 py-3 font-semibold">Telefono</th>
                        <th className="px-3 py-3 font-semibold text-right">Precio final</th>
                        <th className="px-3 py-3 font-semibold text-right">Coste</th>
                        <th className="px-3 py-3 font-semibold text-right">Beneficio</th>
                        <th className="px-3 py-3 font-semibold">Fecha venta</th>
                        <th className="px-3 py-3 font-semibold">Pago</th>
                        <th className="px-3 py-3 font-semibold">Garantia</th>
                        <th className="min-w-[140px] px-3 py-3 font-semibold">Notas</th>
                        <th className="px-3 py-3 text-right font-semibold" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 bg-slate-900/40">
                      {group.items.map((sale) => (
                        <tr key={sale.id} className="transition hover:bg-slate-800/40">
                          <td className="px-3 py-3 font-medium text-slate-100">{sale.build.name}</td>
                          <td className="px-3 py-3 text-slate-300">{sale.customerName}</td>
                          <td className="px-3 py-3 text-slate-400">{sale.customerPhone}</td>
                          <td className="px-3 py-3 text-right font-medium text-emerald-400">{money(sale.finalSalePrice)}</td>
                          <td className="px-3 py-3 text-right text-slate-400">{money(sale.totalCost)}</td>
                          <td className={`px-3 py-3 text-right font-semibold ${profitClass(sale.profit)}`}>
                            {money(sale.profit)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-slate-400">
                            {new Date(sale.soldAt).toLocaleString("es-ES", {
                              dateStyle: "short",
                              timeStyle: "short"
                            })}
                          </td>
                          <td className="px-3 py-3 text-slate-400">{sale.paymentMethod ?? "—"}</td>
                          <td className="px-3 py-3 text-slate-400">
                            {sale.warrantyMonths != null ? `${sale.warrantyMonths} meses` : "—"}
                          </td>
                          <td className="max-w-[200px] truncate px-3 py-3 text-slate-500" title={sale.notes ?? undefined}>
                            {sale.notes ?? "—"}
                          </td>
                          <td className="px-3 py-3 text-right">
                            <Link
                              to={`/sales/${sale.id}`}
                              className="inline-flex rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/20"
                            >
                              Ver / editar
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function MonthlySummaryCard({ row }: { row: MonthlySalesSummaryRow }) {
  const margin = marginPercentOnRevenue(row.totalRevenue, row.totalProfit);
  return (
    <article className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-5 shadow-inner shadow-black/20">
      <p className="text-sm font-semibold capitalize text-slate-100">{monthLabel(row.month, row.year)}</p>
      <dl className="mt-4 space-y-3 text-sm">
        <div className="flex justify-between gap-2">
          <dt className="text-slate-500">PCs vendidos</dt>
          <dd className="font-medium text-slate-200">{row.salesCount}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-slate-500">Total vendido</dt>
          <dd className="font-medium text-emerald-400">{money(row.totalRevenue)}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-slate-500">Coste total</dt>
          <dd className="text-slate-400">{money(row.totalCost)}</dd>
        </div>
        <div className="flex justify-between gap-2 border-t border-slate-800 pt-3">
          <dt className="text-slate-500">Beneficio</dt>
          <dd className={`font-semibold ${profitClass(row.totalProfit)}`}>{money(row.totalProfit)}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-slate-500">Margen</dt>
          <dd className="font-medium text-indigo-300/90">{margin.toFixed(1)} %</dd>
        </div>
      </dl>
    </article>
  );
}
