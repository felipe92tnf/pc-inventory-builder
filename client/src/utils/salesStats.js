export function prevMonthYear(year, month) {
    if (month === 1)
        return { year: year - 1, month: 12 };
    return { year, month: month - 1 };
}
export function filterSalesByMonth(sales, year, month) {
    return sales.filter((s) => {
        const d = new Date(s.soldAt);
        return d.getFullYear() === year && d.getMonth() + 1 === month;
    });
}
/** Totales del mes calculados desde el listado (coherente con rankings). */
export function monthTotalsFromSales(sales, year, month) {
    const list = filterSalesByMonth(sales, year, month);
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
export function marginPercentOnRevenue(revenue, profit) {
    if (revenue <= 0)
        return 0;
    return (profit / revenue) * 100;
}
export function yearTotalsFromSummary(summary, year) {
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
export function rankBuildsByProfit(sales, limit = 8) {
    const map = new Map();
    for (const s of sales) {
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
export function rankClientsBySpend(sales, limit = 8) {
    const map = new Map();
    for (const s of sales) {
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
export function monthlyRevenueSeriesForYear(summary, year) {
    const out = [];
    for (let m = 1; m <= 12; m++) {
        const row = summary.find((r) => r.year === year && r.month === m);
        out.push({ month: m, revenue: row?.totalRevenue ?? 0 });
    }
    return out;
}
export function pctDelta(current, previous) {
    if (previous === 0)
        return null;
    return ((current - previous) / previous) * 100;
}
export function minMaxYearsFromData(summary, sales) {
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
