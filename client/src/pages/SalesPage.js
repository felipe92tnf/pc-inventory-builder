import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useSales } from "../hooks/useSales";
import * as servicesApi from "../api/services";
import { combinePcMonthWithServices, extendYearRangeWithServices, filterSalesByMonth, mergeSalesAndServicesMonthlySummaries, mergeYearTotalsFromMonthlySummaries, minMaxYearsFromData, monthlyRevenueSeriesCombined, monthTotalsFromSales, marginPercentOnRevenue, pctDelta, prevMonthYear, rankBuildsByProfit, rankClientsBySpend, yearTotalsFromSummary } from "../utils/salesStats";
import { SECONDARY_BUTTON_SM } from "../theme/actionButtons";
import { SUMMARY_CARD_GRID, SUMMARY_CARD_LABEL, SUMMARY_CARD_SHELL, SUMMARY_CARD_SHELL_MONTH, SUMMARY_VALUE_NEGATIVE, SUMMARY_VALUE_NEUTRAL, SUMMARY_VALUE_PROFIT_CYAN, SUMMARY_VALUE_PROFIT_POS, SUMMARY_VALUE_REVENUE } from "../theme/summaryCards";
function money(n) {
    return `${n.toFixed(2)} EUR`;
}
function monthLabel(month, year) {
    const d = new Date(year, month - 1, 1);
    return d.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
}
function shortMonth(month, year) {
    return new Date(year, month - 1, 1).toLocaleDateString("es-ES", { month: "short" });
}
function profitClass(value) {
    return value >= 0 ? "text-emerald-400" : "text-rose-400";
}
function isPartSaleType(type) {
    return type === "SPARE_PART_SALE" || type === "PART_SALE";
}
const CHART_BAR_MAX_PX = 168;
function DeltaBadge({ value, invert }) {
    if (value === null)
        return _jsx("span", { className: "text-slate-500", children: "\u2014" });
    const flat = value === 0;
    const pos = value > 0;
    const neg = value < 0;
    let tone = "bg-slate-800 text-slate-400";
    if (!flat) {
        if (invert) {
            tone = neg ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300";
        }
        else {
            tone = pos ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300";
        }
    }
    return (_jsx("span", { className: `inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${tone}`, children: flat ? "0 %" : `${pos ? "+" : ""}${value.toFixed(1)} %` }));
}
function ChevronSales({ open }) {
    return (_jsx("svg", { className: `h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`, fill: "none", viewBox: "0 0 24 24", strokeWidth: 2, stroke: "currentColor", "aria-hidden": true, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M19 9l-7 7-7-7" }) }));
}
function YearRevenueChart({ series, year }) {
    const max = Math.max(...series.map((s) => s.revenue), 1);
    return (_jsx("div", { className: "overflow-x-auto pb-2", children: _jsx("div", { className: "flex min-w-[640px] items-end gap-2 md:gap-3", style: { height: CHART_BAR_MAX_PX + 28 }, children: series.map(({ month, revenue }) => {
                const barH = max > 0 ? Math.max((revenue / max) * CHART_BAR_MAX_PX, revenue > 0 ? 3 : 0) : 0;
                return (_jsxs("div", { className: "flex min-w-0 flex-1 flex-col items-center justify-end", children: [_jsx("div", { className: "w-full max-w-full rounded-t-md bg-gradient-to-t from-indigo-700 to-cyan-500/75 shadow-sm shadow-indigo-900/40 transition hover:opacity-90", style: { height: barH }, title: `${shortMonth(month, year)}: ${money(revenue)}` }), _jsx("span", { className: "mt-2 text-center text-[10px] font-medium capitalize leading-tight text-slate-500", children: shortMonth(month, year) })] }, month));
            }) }) }));
}
export function SalesPage() {
    const { sales, summary, servicesSummary, loading, error, reload } = useSales();
    const [completedServices, setCompletedServices] = useState([]);
    const [servicesLoading, setServicesLoading] = useState(false);
    const [servicesError, setServicesError] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();
    const [flashMessage, setFlashMessage] = useState(null);
    const now = useMemo(() => new Date(), []);
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
    useEffect(() => {
        const msg = location.state?.flash;
        if (!msg)
            return;
        setFlashMessage(msg);
        navigate(location.pathname, { replace: true, state: {} });
    }, [location.pathname, location.state, navigate]);
    const { minYear, maxYear } = useMemo(() => extendYearRangeWithServices(minMaxYearsFromData(summary, sales), servicesSummary), [summary, sales, servicesSummary]);
    const yearOptions = useMemo(() => {
        const out = [];
        const from = Math.min(minYear, selectedYear);
        const to = Math.max(maxYear, selectedYear, now.getFullYear());
        for (let y = from; y <= to; y++)
            out.push(y);
        if (!out.includes(now.getFullYear()))
            out.push(now.getFullYear());
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
    const selectedMonthPcOnly = useMemo(() => monthTotalsFromSales(sales, selectedYear, selectedMonth), [sales, selectedYear, selectedMonth]);
    const selectedMonthSvcRow = useMemo(() => servicesSummary.find((r) => r.year === selectedYear && r.month === selectedMonth), [servicesSummary, selectedYear, selectedMonth]);
    const marginSelected = useMemo(() => marginPercentOnRevenue(selectedMonthStats.totalRevenue, selectedMonthStats.totalProfit), [selectedMonthStats.totalRevenue, selectedMonthStats.totalProfit]);
    const annualTotals = useMemo(() => mergeYearTotalsFromMonthlySummaries(summary, servicesSummary, selectedYear), [summary, servicesSummary, selectedYear]);
    const annualTotalsPcOnly = useMemo(() => yearTotalsFromSummary(summary, selectedYear), [summary, selectedYear]);
    const annualServicesCount = useMemo(() => {
        let n = 0;
        for (const r of servicesSummary) {
            if (r.year === selectedYear) {
                n += r.servicesCount;
            }
        }
        return n;
    }, [servicesSummary, selectedYear]);
    const marginAnnual = useMemo(() => marginPercentOnRevenue(annualTotals.totalRevenue, annualTotals.totalProfit), [annualTotals.totalRevenue, annualTotals.totalProfit]);
    const revenueSeries = useMemo(() => monthlyRevenueSeriesCombined(summary, servicesSummary, selectedYear), [summary, servicesSummary, selectedYear]);
    const mergedHistoricSummary = useMemo(() => mergeSalesAndServicesMonthlySummaries(summary, servicesSummary), [summary, servicesSummary]);
    const salesInSelectedMonth = useMemo(() => filterSalesByMonth(sales, selectedYear, selectedMonth), [sales, selectedYear, selectedMonth]);
    useEffect(() => {
        let active = true;
        setServicesLoading(true);
        setServicesError(null);
        void servicesApi
            .listServices({ month: selectedMonth, year: selectedYear, status: "COMPLETED" })
            .then((rows) => {
            if (!active)
                return;
            setCompletedServices(rows);
        })
            .catch((err) => {
            if (!active)
                return;
            setServicesError(err instanceof Error ? err.message : "No se pudieron cargar los servicios completados.");
            setCompletedServices([]);
        })
            .finally(() => {
            if (!active)
                return;
            setServicesLoading(false);
        });
        return () => {
            active = false;
        };
    }, [selectedMonth, selectedYear]);
    const partSales = useMemo(() => completedServices.filter((row) => isPartSaleType(row.type)), [completedServices]);
    const technicalServices = useMemo(() => completedServices.filter((row) => !isPartSaleType(row.type)), [completedServices]);
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
    const globalMonthSummary = useMemo(() => ({
        totalRevenue: pcMonthTotals.totalRevenue + technicalTotals.totalRevenue + partSalesTotals.totalRevenue,
        totalCost: pcMonthTotals.totalCost + technicalTotals.totalCost + partSalesTotals.totalCost,
        totalProfit: pcMonthTotals.totalProfit + technicalTotals.totalProfit + partSalesTotals.totalProfit,
        totalOperations: pcMonthTotals.totalOperations + technicalTotals.totalOperations + partSalesTotals.totalOperations,
        pcProfit: pcMonthTotals.totalProfit,
        serviceProfit: technicalTotals.totalProfit,
        partSaleProfit: partSalesTotals.totalProfit
    }), [pcMonthTotals, technicalTotals, partSalesTotals]);
    const topBuilds = useMemo(() => rankBuildsByProfit(salesInSelectedMonth, 10), [salesInSelectedMonth]);
    const topClients = useMemo(() => rankClientsBySpend(salesInSelectedMonth, 10), [salesInSelectedMonth]);
    const deltaRevenue = useMemo(() => pctDelta(selectedMonthStats.totalRevenue, previousMonthStats.totalRevenue), [selectedMonthStats.totalRevenue, previousMonthStats.totalRevenue]);
    const deltaCost = useMemo(() => pctDelta(selectedMonthStats.totalCost, previousMonthStats.totalCost), [selectedMonthStats.totalCost, previousMonthStats.totalCost]);
    const deltaProfit = useMemo(() => pctDelta(selectedMonthStats.totalProfit, previousMonthStats.totalProfit), [selectedMonthStats.totalProfit, previousMonthStats.totalProfit]);
    const [mobileSalesOpen, setMobileSalesOpen] = useState({
        stats: false,
        compare: false,
        annual: false,
        builds: false,
        clients: false,
        history: false,
        salesList: false
    });
    const toggleMobileSales = (key) => {
        setMobileSalesOpen((prev) => ({ ...prev, [key]: !prev[key] }));
    };
    const [salesSectionsOpen, setSalesSectionsOpen] = useState({
        pcs: false,
        services: false,
        parts: false
    });
    const [advancedOpen, setAdvancedOpen] = useState(false);
    const toggleSalesSection = (key) => {
        setSalesSectionsOpen((prev) => ({ ...prev, [key]: !prev[key] }));
    };
    return (_jsxs("div", { className: "mx-auto w-full max-w-7xl space-y-8 px-2 pb-8 text-slate-100 md:px-4", children: [flashMessage ? (_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/40 bg-emerald-950/50 px-4 py-3 text-sm text-emerald-100", children: [_jsx("span", { children: flashMessage }), _jsx("button", { type: "button", onClick: () => setFlashMessage(null), className: "rounded-lg border border-emerald-600/50 px-3 py-1 text-xs font-semibold text-emerald-200 hover:bg-emerald-900/40", children: "Cerrar" })] })) : null, _jsx("section", { className: "rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 shadow-[0_20px_50px_-24px_rgba(79,70,229,0.75)]", children: _jsxs("div", { className: "flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between", children: [_jsx("h1", { className: "text-3xl font-bold tracking-tight", children: "Ventas" }), _jsxs("div", { className: "flex flex-wrap items-end gap-4", children: [_jsxs("label", { className: "flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-slate-400", children: ["Mes", _jsx("select", { value: selectedMonth, disabled: loading, onChange: (e) => setSelectedMonth(Number(e.target.value)), className: "rounded-lg border border-slate-600 bg-slate-950/80 px-3 py-2 text-sm font-medium text-slate-100 outline-none ring-indigo-400/50 focus:border-indigo-400 focus:ring disabled:opacity-50", children: Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (_jsx("option", { value: m, children: new Date(2000, m - 1, 1).toLocaleDateString("es-ES", { month: "long" }) }, m))) })] }), _jsxs("label", { className: "flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-slate-400", children: ["Ano", _jsx("select", { value: selectedYear, disabled: loading, onChange: (e) => setSelectedYear(Number(e.target.value)), className: "rounded-lg border border-slate-600 bg-slate-950/80 px-3 py-2 text-sm font-medium text-slate-100 outline-none ring-indigo-400/50 focus:border-indigo-400 focus:ring disabled:opacity-50", children: yearOptions.map((y) => (_jsx("option", { value: y, children: y }, y))) })] }), _jsx("button", { type: "button", disabled: loading, onClick: () => {
                                        setSelectedYear(now.getFullYear());
                                        setSelectedMonth(now.getMonth() + 1);
                                    }, className: SECONDARY_BUTTON_SM, children: "Mes actual" })] })] }) }), error ? (_jsxs("div", { className: "flex flex-col gap-3 rounded-xl border border-rose-800/70 bg-rose-950/40 px-4 py-3 text-sm text-rose-200 md:flex-row md:items-center md:justify-between", children: [_jsx("span", { children: error }), _jsx("button", { type: "button", onClick: () => {
                            void reload();
                        }, className: "rounded-lg border border-rose-700 bg-rose-900/50 px-3 py-1.5 font-semibold text-rose-100 transition hover:bg-rose-800/70", children: "Reintentar" })] })) : null, servicesError ? (_jsx("div", { className: "rounded-xl border border-rose-800/70 bg-rose-950/40 px-4 py-3 text-sm text-rose-200", children: servicesError })) : null, _jsxs("section", { className: "rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg shadow-slate-950/40 md:p-7", children: [_jsxs("h2", { className: "text-xl font-semibold text-slate-100", children: ["Resumen global \u00B7 ", monthLabel(selectedMonth, selectedYear)] }), _jsxs("div", { className: `mt-5 ${SUMMARY_CARD_GRID}`, children: [_jsxs("article", { className: SUMMARY_CARD_SHELL, children: [_jsx("p", { className: SUMMARY_CARD_LABEL, children: "Ingresos" }), _jsx("p", { className: SUMMARY_VALUE_REVENUE, children: money(globalMonthSummary.totalRevenue) })] }), _jsxs("article", { className: SUMMARY_CARD_SHELL, children: [_jsx("p", { className: SUMMARY_CARD_LABEL, children: "Costes" }), _jsx("p", { className: SUMMARY_VALUE_NEUTRAL, children: money(globalMonthSummary.totalCost) })] }), _jsxs("article", { className: SUMMARY_CARD_SHELL, children: [_jsx("p", { className: SUMMARY_CARD_LABEL, children: "Beneficio" }), _jsx("p", { className: globalMonthSummary.totalProfit >= 0 ? SUMMARY_VALUE_PROFIT_POS : SUMMARY_VALUE_NEGATIVE, children: money(globalMonthSummary.totalProfit) })] }), _jsxs("article", { className: SUMMARY_CARD_SHELL, children: [_jsx("p", { className: SUMMARY_CARD_LABEL, children: "Operaciones" }), _jsx("p", { className: SUMMARY_VALUE_NEUTRAL, children: globalMonthSummary.totalOperations })] })] })] }), _jsxs("section", { className: "overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-lg shadow-slate-950/40", children: [_jsxs("button", { type: "button", className: "flex w-full items-center justify-between gap-3 border-b border-slate-800 px-4 py-3.5 text-left md:hidden", onClick: () => toggleMobileSales("salesList"), "aria-expanded": mobileSalesOpen.salesList, children: [_jsx("div", { children: _jsx("span", { className: "text-base font-semibold text-slate-100", children: "Detalle de operaciones" }) }), _jsx(ChevronSales, { open: mobileSalesOpen.salesList })] }), _jsx("div", { className: mobileSalesOpen.salesList ? "block" : "hidden md:block", children: _jsxs("div", { className: "p-5 pt-4 md:pt-5", children: [_jsx("h2", { className: "hidden text-xl font-semibold text-slate-100 md:block", children: "Detalle global de ventas" }), loading || servicesLoading ? (_jsx("p", { className: "mt-4 text-sm text-slate-400", children: "Cargando operaciones..." })) : globalMonthSummary.totalOperations === 0 ? (_jsx("p", { className: "mt-4 text-sm text-slate-400", children: "No hay operaciones registradas en el periodo seleccionado." })) : (_jsxs("div", { className: "mt-4 space-y-4", children: [_jsx(SalesOverviewSection, { title: "PCs vendidos", count: pcMonthTotals.totalOperations, totalRevenue: pcMonthTotals.totalRevenue, totalProfit: pcMonthTotals.totalProfit, open: salesSectionsOpen.pcs, onToggle: () => toggleSalesSection("pcs"), desktopTable: _jsxs("table", { className: "min-w-full text-left text-sm", children: [_jsx("thead", { className: "bg-slate-950/80 text-xs uppercase tracking-wide text-slate-400", children: _jsxs("tr", { children: [_jsx("th", { className: "px-3 py-3 font-semibold", children: "Fecha" }), _jsx("th", { className: "px-3 py-3 font-semibold", children: "Cliente" }), _jsx("th", { className: "px-3 py-3 font-semibold", children: "Montaje" }), _jsx("th", { className: "px-3 py-3 font-semibold text-right", children: "Coste" }), _jsx("th", { className: "px-3 py-3 font-semibold text-right", children: "Venta" }), _jsx("th", { className: "px-3 py-3 font-semibold text-right", children: "Beneficio" })] }) }), _jsx("tbody", { className: "divide-y divide-slate-800 bg-slate-900/40", children: salesInSelectedMonth.map((sale) => (_jsxs("tr", { className: "transition hover:bg-slate-800/40", children: [_jsx("td", { className: "px-3 py-3 text-slate-400", children: new Date(sale.soldAt).toLocaleDateString("es-ES") }), _jsx("td", { className: "px-3 py-3 text-slate-300", children: sale.customerName }), _jsx("td", { className: "px-3 py-3 font-medium text-slate-100", children: sale.build.name }), _jsx("td", { className: "px-3 py-3 text-right text-slate-400", children: money(sale.totalCost) }), _jsx("td", { className: "px-3 py-3 text-right text-emerald-400", children: money(sale.finalSalePrice) }), _jsx("td", { className: `px-3 py-3 text-right font-semibold ${profitClass(sale.profit)}`, children: money(sale.profit) })] }, sale.id))) })] }), mobileCards: salesInSelectedMonth.map((sale) => (_jsxs("article", { className: "rounded-xl border border-slate-800 bg-slate-950/50 p-3", children: [_jsx("p", { className: "text-xs text-slate-500", children: new Date(sale.soldAt).toLocaleDateString("es-ES") }), _jsx("p", { className: "mt-1 font-semibold text-slate-100", children: sale.build.name }), _jsx("p", { className: "text-sm text-slate-300", children: sale.customerName }), _jsxs("dl", { className: "mt-2 grid grid-cols-3 gap-2 text-xs", children: [_jsxs("div", { children: [_jsx("dt", { className: "text-slate-500", children: "Coste" }), _jsx("dd", { className: "text-slate-300", children: money(sale.totalCost) })] }), _jsxs("div", { children: [_jsx("dt", { className: "text-slate-500", children: "Venta" }), _jsx("dd", { className: "text-emerald-300", children: money(sale.finalSalePrice) })] }), _jsxs("div", { children: [_jsx("dt", { className: "text-slate-500", children: "Beneficio" }), _jsx("dd", { className: profitClass(sale.profit), children: money(sale.profit) })] })] })] }, sale.id))) }), _jsx(SalesOverviewSection, { title: "Servicios t\u00E9cnicos", count: technicalTotals.totalOperations, totalRevenue: technicalTotals.totalRevenue, totalProfit: technicalTotals.totalProfit, open: salesSectionsOpen.services, onToggle: () => toggleSalesSection("services"), desktopTable: _jsxs("table", { className: "min-w-full text-left text-sm", children: [_jsx("thead", { className: "bg-slate-950/80 text-xs uppercase tracking-wide text-slate-400", children: _jsxs("tr", { children: [_jsx("th", { className: "px-3 py-3 font-semibold", children: "Fecha" }), _jsx("th", { className: "px-3 py-3 font-semibold", children: "Cliente" }), _jsx("th", { className: "px-3 py-3 font-semibold", children: "Telefono" }), _jsx("th", { className: "px-3 py-3 font-semibold", children: "Tipo" }), _jsx("th", { className: "px-3 py-3 font-semibold", children: "Descripcion" }), _jsx("th", { className: "px-3 py-3 font-semibold text-right", children: "Coste" }), _jsx("th", { className: "px-3 py-3 font-semibold text-right", children: "Venta" }), _jsx("th", { className: "px-3 py-3 font-semibold text-right", children: "Beneficio" }), _jsx("th", { className: "px-3 py-3 font-semibold", children: "Pago" })] }) }), _jsx("tbody", { className: "divide-y divide-slate-800 bg-slate-900/40", children: technicalServices.map((row) => (_jsxs("tr", { className: "transition hover:bg-slate-800/40", children: [_jsx("td", { className: "px-3 py-3 text-slate-400", children: new Date(row.serviceDate).toLocaleDateString("es-ES") }), _jsx("td", { className: "px-3 py-3 text-slate-300", children: row.customerName }), _jsx("td", { className: "px-3 py-3 text-slate-400", children: row.customerPhone || "—" }), _jsx("td", { className: "px-3 py-3 text-slate-400", children: row.title }), _jsx("td", { className: "max-w-[280px] truncate px-3 py-3 text-slate-300", title: row.description || row.title, children: row.description || row.title }), _jsx("td", { className: "px-3 py-3 text-right text-slate-400", children: money(row.costPrice) }), _jsx("td", { className: "px-3 py-3 text-right text-emerald-400", children: money(row.salePrice) }), _jsx("td", { className: `px-3 py-3 text-right font-semibold ${profitClass(row.profit)}`, children: money(row.profit) }), _jsx("td", { className: "px-3 py-3 text-slate-400", children: row.paymentMethod || "—" })] }, row.id))) })] }), mobileCards: technicalServices.map((row) => (_jsxs("article", { className: "rounded-xl border border-slate-800 bg-slate-950/50 p-3", children: [_jsx("p", { className: "text-xs text-slate-500", children: new Date(row.serviceDate).toLocaleDateString("es-ES") }), _jsx("p", { className: "mt-1 font-semibold text-slate-100", children: row.title }), _jsxs("p", { className: "text-sm text-slate-300", children: [row.customerName, " \u00B7 ", row.customerPhone || "—"] }), _jsx("p", { className: "mt-1 text-xs text-slate-400", children: row.description || row.title }), _jsxs("p", { className: "mt-1 text-xs text-slate-500", children: ["Pago: ", row.paymentMethod || "—"] }), _jsxs("dl", { className: "mt-2 grid grid-cols-3 gap-2 text-xs", children: [_jsxs("div", { children: [_jsx("dt", { className: "text-slate-500", children: "Coste" }), _jsx("dd", { className: "text-slate-300", children: money(row.costPrice) })] }), _jsxs("div", { children: [_jsx("dt", { className: "text-slate-500", children: "Venta" }), _jsx("dd", { className: "text-emerald-300", children: money(row.salePrice) })] }), _jsxs("div", { children: [_jsx("dt", { className: "text-slate-500", children: "Beneficio" }), _jsx("dd", { className: profitClass(row.profit), children: money(row.profit) })] })] })] }, row.id))) }), _jsx(SalesOverviewSection, { title: "Piezas sueltas vendidas", count: partSalesTotals.totalOperations, totalRevenue: partSalesTotals.totalRevenue, totalProfit: partSalesTotals.totalProfit, open: salesSectionsOpen.parts, onToggle: () => toggleSalesSection("parts"), desktopTable: _jsxs("table", { className: "min-w-full text-left text-sm", children: [_jsx("thead", { className: "bg-slate-950/80 text-xs uppercase tracking-wide text-slate-400", children: _jsxs("tr", { children: [_jsx("th", { className: "px-3 py-3 font-semibold", children: "Fecha" }), _jsx("th", { className: "px-3 py-3 font-semibold", children: "Cliente" }), _jsx("th", { className: "px-3 py-3 font-semibold", children: "Telefono" }), _jsx("th", { className: "px-3 py-3 font-semibold", children: "Tipo" }), _jsx("th", { className: "px-3 py-3 font-semibold", children: "Pieza / descripcion" }), _jsx("th", { className: "px-3 py-3 font-semibold text-right", children: "Coste" }), _jsx("th", { className: "px-3 py-3 font-semibold text-right", children: "Venta" }), _jsx("th", { className: "px-3 py-3 font-semibold text-right", children: "Beneficio" }), _jsx("th", { className: "px-3 py-3 font-semibold", children: "Pago" })] }) }), _jsx("tbody", { className: "divide-y divide-slate-800 bg-slate-900/40", children: partSales.map((row) => (_jsxs("tr", { className: "transition hover:bg-slate-800/40", children: [_jsx("td", { className: "px-3 py-3 text-slate-400", children: new Date(row.serviceDate).toLocaleDateString("es-ES") }), _jsx("td", { className: "px-3 py-3 text-slate-300", children: row.customerName }), _jsx("td", { className: "px-3 py-3 text-slate-400", children: row.customerPhone || "—" }), _jsx("td", { className: "px-3 py-3 text-slate-400", children: row.title }), _jsx("td", { className: "max-w-[280px] truncate px-3 py-3 text-slate-300", title: row.selectedPart?.name ?? row.description, children: row.selectedPart?.name ?? row.description ?? row.title }), _jsx("td", { className: "px-3 py-3 text-right text-slate-400", children: money(row.costPrice) }), _jsx("td", { className: "px-3 py-3 text-right text-emerald-400", children: money(row.salePrice) }), _jsx("td", { className: `px-3 py-3 text-right font-semibold ${profitClass(row.profit)}`, children: money(row.profit) }), _jsx("td", { className: "px-3 py-3 text-slate-400", children: row.paymentMethod || "—" })] }, row.id))) })] }), mobileCards: partSales.map((row) => (_jsxs("article", { className: "rounded-xl border border-slate-800 bg-slate-950/50 p-3", children: [_jsx("p", { className: "text-xs text-slate-500", children: new Date(row.serviceDate).toLocaleDateString("es-ES") }), _jsx("p", { className: "mt-1 font-semibold text-slate-100", children: row.selectedPart?.name ?? row.title }), _jsxs("p", { className: "text-sm text-slate-300", children: [row.customerName, " \u00B7 ", row.customerPhone || "—"] }), _jsx("p", { className: "mt-1 text-xs text-slate-400", children: row.description || row.title }), _jsxs("p", { className: "mt-1 text-xs text-slate-500", children: ["Pago: ", row.paymentMethod || "—"] }), _jsxs("dl", { className: "mt-2 grid grid-cols-3 gap-2 text-xs", children: [_jsxs("div", { children: [_jsx("dt", { className: "text-slate-500", children: "Coste" }), _jsx("dd", { className: "text-slate-300", children: money(row.costPrice) })] }), _jsxs("div", { children: [_jsx("dt", { className: "text-slate-500", children: "Venta" }), _jsx("dd", { className: "text-emerald-300", children: money(row.salePrice) })] }), _jsxs("div", { children: [_jsx("dt", { className: "text-slate-500", children: "Beneficio" }), _jsx("dd", { className: profitClass(row.profit), children: money(row.profit) })] })] })] }, row.id))) })] }))] }) })] }), _jsxs("section", { className: "overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-lg shadow-slate-950/40", children: [_jsxs("button", { type: "button", className: "flex w-full items-center justify-between gap-3 border-b border-slate-800 px-4 py-3.5 text-left", onClick: () => setAdvancedOpen((prev) => !prev), "aria-expanded": advancedOpen, children: [_jsx("div", { children: _jsx("span", { className: "text-base font-semibold text-slate-100", children: "Estad\u00EDsticas avanzadas" }) }), _jsx(ChevronSales, { open: advancedOpen })] }), advancedOpen ? (_jsxs("div", { className: "space-y-6 p-4 md:p-5", children: [_jsxs("div", { className: "rounded-xl border border-slate-800 bg-slate-950/40 p-5", children: [_jsxs("h3", { className: "text-lg font-semibold text-slate-100", children: ["Comparativa vs ", monthLabel(prevYM.month, prevYM.year)] }), _jsxs("dl", { className: `mt-4 ${SUMMARY_CARD_GRID}`, children: [_jsxs("div", { className: SUMMARY_CARD_SHELL, children: [_jsx("dt", { className: SUMMARY_CARD_LABEL, children: "Ingresos" }), _jsxs("dd", { className: "mt-2 flex flex-wrap items-center gap-2", children: [_jsx("span", { className: SUMMARY_VALUE_REVENUE, children: money(selectedMonthStats.totalRevenue) }), _jsx(DeltaBadge, { value: deltaRevenue })] })] }), _jsxs("div", { className: SUMMARY_CARD_SHELL, children: [_jsx("dt", { className: SUMMARY_CARD_LABEL, children: "Costes" }), _jsxs("dd", { className: "mt-2 flex flex-wrap items-center gap-2", children: [_jsx("span", { className: SUMMARY_VALUE_NEUTRAL, children: money(selectedMonthStats.totalCost) }), _jsx(DeltaBadge, { value: deltaCost, invert: true })] })] }), _jsxs("div", { className: SUMMARY_CARD_SHELL, children: [_jsx("dt", { className: SUMMARY_CARD_LABEL, children: "Beneficio" }), _jsxs("dd", { className: "mt-2 flex flex-wrap items-center gap-2", children: [_jsx("span", { className: selectedMonthStats.totalProfit >= 0
                                                                    ? SUMMARY_VALUE_PROFIT_POS
                                                                    : SUMMARY_VALUE_NEGATIVE, children: money(selectedMonthStats.totalProfit) }), _jsx(DeltaBadge, { value: deltaProfit })] })] })] })] }), _jsxs("div", { className: "grid grid-cols-1 gap-4 xl:grid-cols-3", children: [_jsxs("article", { className: "rounded-xl border border-slate-800 bg-slate-950/40 p-4", children: [_jsxs("h3", { className: "text-base font-semibold text-slate-100", children: ["Acumulado anual ", selectedYear] }), _jsxs("dl", { className: "mt-3 space-y-2 text-sm", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("dt", { className: "text-slate-500", children: "Ingresos" }), _jsx("dd", { children: money(annualTotals.totalRevenue) })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("dt", { className: "text-slate-500", children: "Costes" }), _jsx("dd", { children: money(annualTotals.totalCost) })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("dt", { className: "text-slate-500", children: "Beneficio" }), _jsx("dd", { className: profitClass(annualTotals.totalProfit), children: money(annualTotals.totalProfit) })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("dt", { className: "text-slate-500", children: "Margen" }), _jsxs("dd", { children: [marginAnnual.toFixed(1), " %"] })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("dt", { className: "text-slate-500", children: "Operaciones" }), _jsx("dd", { children: annualTotals.salesCount })] })] })] }), _jsxs("article", { className: "rounded-xl border border-slate-800 bg-slate-950/40 p-4 xl:col-span-2", children: [_jsxs("h3", { className: "text-base font-semibold text-slate-100", children: ["Ingresos por mes (", selectedYear, ")"] }), _jsx("div", { className: "mt-3", children: _jsx(YearRevenueChart, { series: revenueSeries, year: selectedYear }) })] })] }), _jsxs("section", { className: "grid grid-cols-1 gap-4 lg:grid-cols-2", children: [_jsxs("article", { className: "rounded-xl border border-slate-800 bg-slate-950/40 p-4", children: [_jsx("h3", { className: "text-base font-semibold text-slate-100", children: "Montajes m\u00E1s rentables" }), topBuilds.length === 0 ? (_jsx("p", { className: "mt-3 text-sm text-slate-500", children: "Sin ventas este mes." })) : (_jsx("ol", { className: "mt-3 space-y-2", children: topBuilds.map((row, idx) => (_jsxs("li", { className: "flex justify-between rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm", children: [_jsxs("span", { className: "truncate text-slate-200", children: [idx + 1, ". ", row.name] }), _jsx("span", { className: profitClass(row.profit), children: money(row.profit) })] }, row.buildId))) }))] }), _jsxs("article", { className: "rounded-xl border border-slate-800 bg-slate-950/40 p-4", children: [_jsx("h3", { className: "text-base font-semibold text-slate-100", children: "Top clientes por gasto" }), topClients.length === 0 ? (_jsx("p", { className: "mt-3 text-sm text-slate-500", children: "Sin ventas este mes." })) : (_jsx("ol", { className: "mt-3 space-y-2", children: topClients.map((row, idx) => (_jsxs("li", { className: "flex justify-between rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm", children: [_jsxs("span", { className: "truncate text-slate-200", children: [idx + 1, ". ", row.displayName] }), _jsx("span", { className: "text-emerald-300", children: money(row.spend) })] }, `${row.displayName}-${row.phone}`))) }))] })] }), _jsxs("section", { className: "rounded-xl border border-slate-800 bg-slate-950/40 p-4", children: [_jsx("h3", { className: "text-base font-semibold text-slate-100", children: "Resumen mensual hist\u00F3rico" }), mergedHistoricSummary.length === 0 ? (_jsx("p", { className: "mt-3 text-sm text-slate-500", children: "Sin datos de ventas ni servicios todav\u00EDa." })) : (_jsx("div", { className: "mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3", children: mergedHistoricSummary.map((row) => (_jsx(MonthlySummaryCard, { row: row }, `${row.year}-${row.month}`))) }))] })] })) : null] })] }));
}
function MonthlySummaryCard({ row }) {
    const margin = marginPercentOnRevenue(row.totalRevenue, row.totalProfit);
    return (_jsxs("article", { className: SUMMARY_CARD_SHELL_MONTH, children: [_jsx("p", { className: "text-sm font-semibold capitalize leading-tight text-slate-100", children: monthLabel(row.month, row.year) }), _jsxs("dl", { className: "mt-4 grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2", children: [_jsxs("div", { children: [_jsx("dt", { className: SUMMARY_CARD_LABEL, children: "Operaciones" }), _jsx("dd", { className: SUMMARY_VALUE_NEUTRAL, children: row.salesCount })] }), _jsxs("div", { children: [_jsx("dt", { className: SUMMARY_CARD_LABEL, children: "Ingresos" }), _jsx("dd", { className: SUMMARY_VALUE_REVENUE, children: money(row.totalRevenue) })] }), _jsxs("div", { children: [_jsx("dt", { className: SUMMARY_CARD_LABEL, children: "Beneficio" }), _jsx("dd", { className: row.totalProfit >= 0 ? SUMMARY_VALUE_PROFIT_POS : SUMMARY_VALUE_NEGATIVE, children: money(row.totalProfit) })] }), _jsxs("div", { children: [_jsx("dt", { className: SUMMARY_CARD_LABEL, children: "Margen" }), _jsxs("dd", { className: margin >= 0 ? SUMMARY_VALUE_PROFIT_CYAN : SUMMARY_VALUE_NEGATIVE, children: [margin.toFixed(1), " %"] })] })] })] }));
}
function SalesOverviewSection({ title, count, totalRevenue, totalProfit, open, onToggle, desktopTable, mobileCards }) {
    return (_jsxs("article", { className: "overflow-hidden rounded-xl border border-slate-800 bg-slate-950/40", children: [_jsxs("button", { type: "button", onClick: onToggle, className: "flex w-full items-center justify-between gap-3 px-4 py-4 text-left md:px-5 md:py-4", "aria-expanded": open, children: [_jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "text-lg font-semibold text-slate-100", children: title }), _jsxs("div", { className: "mt-2 flex flex-wrap items-center gap-3", children: [_jsx("span", { className: "inline-flex rounded-full border border-indigo-500/40 bg-indigo-500/15 px-3 py-1 text-sm font-semibold text-indigo-200", children: count }), _jsx("span", { className: "text-lg font-semibold text-emerald-300", children: money(totalRevenue) }), _jsx("span", { className: `text-base font-semibold ${totalProfit >= 0 ? "text-cyan-300" : "text-rose-300"}`, children: money(totalProfit) })] })] }), _jsx(ChevronSales, { open: open })] }), open ? (_jsx("div", { className: "border-t border-slate-800 p-3", children: count === 0 ? (_jsx("p", { className: "text-sm text-slate-500", children: "Sin registros en este periodo." })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "hidden overflow-x-auto rounded-lg border border-slate-800 md:block", children: desktopTable }), _jsx("div", { className: "space-y-2 md:hidden", children: mobileCards })] })) })) : null] }));
}
