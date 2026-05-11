import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as buildsApi from "../api/builds";
import { useBuilds } from "../hooks/useBuilds";
import { useParts } from "../hooks/useParts";
import * as salesApi from "../api/sales";
function money(value) {
    return `${value.toFixed(2)} EUR`;
}
function toDateLabel(value) {
    if (!value)
        return "—";
    return new Date(value).toLocaleDateString("es-ES");
}
function buildBucket(build) {
    if (build.status === "SOLD")
        return "SOLD";
    if (build.status === "CONFIRMED")
        return "READY";
    if ((build.items?.length ?? 0) > 0)
        return "PENDING";
    return "DRAFTS";
}
function bucketTitle(bucket) {
    if (bucket === "DRAFTS")
        return "Borradores";
    if (bucket === "PENDING")
        return "En montaje / pendientes";
    if (bucket === "READY")
        return "Listos para vender";
    return "Vendidos";
}
function bucketTone(bucket) {
    if (bucket === "SOLD")
        return "border-cyan-500/30 bg-cyan-500/10 text-cyan-200";
    if (bucket === "READY")
        return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
    if (bucket === "PENDING")
        return "border-amber-500/30 bg-amber-500/10 text-amber-200";
    return "border-indigo-500/30 bg-indigo-500/10 text-indigo-200";
}
export function BuildsPage() {
    const navigate = useNavigate();
    const { builds, loading, deletingId, error, deleteBuild, reload } = useBuilds();
    const { parts: inventoryParts, loading: inventoryLoading, reload: reloadInventory } = useParts();
    const [preparingPartId, setPreparingPartId] = useState(null);
    const [creatingQuick, setCreatingQuick] = useState(false);
    const [salesRows, setSalesRows] = useState([]);
    const [soldExpanded, setSoldExpanded] = useState(false);
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [monthFilter, setMonthFilter] = useState("ALL");
    const [yearFilter, setYearFilter] = useState("ALL");
    const [sortOrder, setSortOrder] = useState("RECENT");
    const [soldMonthFilter, setSoldMonthFilter] = useState("ALL");
    const [soldYearFilter, setSoldYearFilter] = useState("ALL");
    const handleDelete = async (buildId, buildName) => {
        const confirmed = window.confirm(`Eliminar el montaje "${buildName}"?`);
        if (!confirmed)
            return;
        await deleteBuild(buildId);
    };
    const handleQuickCreate = async () => {
        setCreatingQuick(true);
        try {
            const created = await buildsApi.createBuild({
                name: "Montaje sin título",
                notes: null
            });
            await reload();
            navigate(`/builds/${created.id}`);
        }
        catch (err) {
            window.alert(err instanceof Error ? err.message : "No se pudo crear el montaje.");
        }
        finally {
            setCreatingQuick(false);
        }
    };
    useEffect(() => {
        let active = true;
        void salesApi
            .listSales()
            .then((rows) => {
            if (!active)
                return;
            setSalesRows(rows);
        })
            .catch(() => {
            if (!active)
                return;
            setSalesRows([]);
        });
        return () => {
            active = false;
        };
    }, [builds.length]);
    const salesByBuildId = useMemo(() => {
        const map = new Map();
        for (const sale of salesRows) {
            map.set(sale.buildId, sale);
        }
        return map;
    }, [salesRows]);
    const years = useMemo(() => {
        const set = new Set();
        for (const build of builds) {
            set.add(new Date(build.updatedAt).getFullYear());
        }
        for (const sale of salesRows) {
            set.add(new Date(sale.soldAt).getFullYear());
        }
        return [...set].sort((a, b) => b - a);
    }, [builds, salesRows]);
    const globallyFilteredBuilds = useMemo(() => {
        const q = query.trim().toLowerCase();
        return builds
            .filter((build) => {
            const bucket = buildBucket(build);
            const sale = salesByBuildId.get(build.id);
            const dateRef = bucket === "SOLD" ? sale?.soldAt ?? build.updatedAt : build.updatedAt;
            const d = new Date(dateRef);
            const matchesQuery = !q || build.name.toLowerCase().includes(q);
            const matchesStatus = statusFilter === "ALL" || bucket === statusFilter;
            const matchesMonth = monthFilter === "ALL" || d.getMonth() + 1 === monthFilter;
            const matchesYear = yearFilter === "ALL" || d.getFullYear() === yearFilter;
            return matchesQuery && matchesStatus && matchesMonth && matchesYear;
        })
            .sort((a, b) => {
            const saleA = salesByBuildId.get(a.id);
            const saleB = salesByBuildId.get(b.id);
            if (sortOrder === "PROFIT_DESC") {
                return (Number(saleB?.profit ?? b.profit ?? 0) - Number(saleA?.profit ?? a.profit ?? 0));
            }
            if (sortOrder === "PRICE_DESC") {
                return (Number(saleB?.finalSalePrice ?? b.totalSale ?? 0) - Number(saleA?.finalSalePrice ?? a.totalSale ?? 0));
            }
            const dateA = new Date((buildBucket(a) === "SOLD" ? saleA?.soldAt : a.updatedAt) ?? a.updatedAt).getTime();
            const dateB = new Date((buildBucket(b) === "SOLD" ? saleB?.soldAt : b.updatedAt) ?? b.updatedAt).getTime();
            return dateB - dateA;
        });
    }, [builds, salesByBuildId, query, statusFilter, monthFilter, yearFilter, sortOrder]);
    const bucketBuilds = useMemo(() => {
        const map = { DRAFTS: [], PENDING: [], READY: [], SOLD: [] };
        for (const build of globallyFilteredBuilds) {
            map[buildBucket(build)].push(build);
        }
        return map;
    }, [globallyFilteredBuilds]);
    const soldBuildsFiltered = useMemo(() => {
        return bucketBuilds.SOLD.filter((build) => {
            const sale = salesByBuildId.get(build.id);
            const ref = sale?.soldAt ?? build.updatedAt;
            const d = new Date(ref);
            const matchesMonth = soldMonthFilter === "ALL" || d.getMonth() + 1 === soldMonthFilter;
            const matchesYear = soldYearFilter === "ALL" || d.getFullYear() === soldYearFilter;
            return matchesMonth && matchesYear;
        });
    }, [bucketBuilds.SOLD, salesByBuildId, soldMonthFilter, soldYearFilter]);
    const soldVisible = soldExpanded ? soldBuildsFiltered : soldBuildsFiltered.slice(0, 5);
    return (_jsxs("div", { className: "mx-auto w-full max-w-7xl space-y-6 px-2 pb-8 text-slate-100 md:px-4", children: [_jsxs("section", { className: "rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 shadow-[0_20px_50px_-24px_rgba(79,70,229,0.75)]", children: [_jsx("h1", { className: "text-2xl font-bold", children: "Montajes de PC" }), _jsxs("p", { className: "mt-2 text-sm text-slate-300", children: ["Crea montajes por piezas o vende PCs completos del inventario. En ambos casos, cuando el equipo este listo, usalo con ", _jsx("span", { className: "font-semibold text-cyan-300", children: "Registrar venta" }), " para pasarlo al apartado Ventas."] })] }), error ? (_jsxs("div", { className: "flex flex-col gap-3 rounded-xl border border-rose-800/70 bg-rose-950/40 px-4 py-3 text-sm text-rose-200 md:flex-row md:items-center md:justify-between", children: [_jsx("span", { children: error }), _jsx("button", { type: "button", onClick: () => {
                            void reload();
                        }, className: "rounded-lg border border-rose-700 bg-rose-900/50 px-3 py-1.5 font-semibold text-rose-100 transition hover:bg-rose-800/70", children: "Reintentar" })] })) : null, _jsxs("section", { className: "rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/40", children: [_jsx("button", { type: "button", onClick: () => {
                            void handleQuickCreate();
                        }, disabled: creatingQuick, className: "w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:bg-indigo-500 disabled:opacity-60 md:w-auto", children: creatingQuick ? "Creando..." : "Crear montaje" }), _jsx("p", { className: "mt-2 text-xs text-slate-500", children: "Crea un borrador al instante y completa nombre, notas y piezas en el detalle del montaje." })] }), _jsx("section", { className: "rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/40", children: _jsxs("details", { children: [_jsx("summary", { className: "cursor-pointer list-none text-sm font-semibold text-slate-100", children: "Filtros" }), _jsxs("div", { className: "mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5", children: [_jsxs("label", { className: "flex flex-col gap-1 text-sm text-slate-300 xl:col-span-2", children: ["Buscar por nombre", _jsx("input", { value: query, onChange: (e) => setQuery(e.target.value), className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 outline-none focus:border-indigo-400", placeholder: "Ej: Gaming, Oficina..." })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm text-slate-300", children: ["Estado", _jsxs("select", { value: statusFilter, onChange: (e) => setStatusFilter(e.target.value), className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2", children: [_jsx("option", { value: "ALL", children: "Todos" }), _jsx("option", { value: "DRAFTS", children: "Borradores" }), _jsx("option", { value: "PENDING", children: "Pendientes" }), _jsx("option", { value: "READY", children: "Listos para vender" }), _jsx("option", { value: "SOLD", children: "Vendidos" })] })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm text-slate-300", children: ["Mes", _jsxs("select", { value: monthFilter, onChange: (e) => setMonthFilter(e.target.value === "ALL" ? "ALL" : Number(e.target.value)), className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2", children: [_jsx("option", { value: "ALL", children: "Todos" }), Array.from({ length: 12 }, (_, i) => i + 1).map((m) => _jsx("option", { value: m, children: m }, m))] })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm text-slate-300", children: ["A\u00F1o", _jsxs("select", { value: yearFilter, onChange: (e) => setYearFilter(e.target.value === "ALL" ? "ALL" : Number(e.target.value)), className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2", children: [_jsx("option", { value: "ALL", children: "Todos" }), years.map((y) => _jsx("option", { value: y, children: y }, y))] })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm text-slate-300", children: ["Orden", _jsxs("select", { value: sortOrder, onChange: (e) => setSortOrder(e.target.value), className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2", children: [_jsx("option", { value: "RECENT", children: "Recientes" }), _jsx("option", { value: "PROFIT_DESC", children: "Mayor beneficio" }), _jsx("option", { value: "PRICE_DESC", children: "Mayor precio" })] })] })] })] }) }), _jsxs("section", { className: "rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/40", children: [_jsx("h2", { className: "text-lg font-semibold text-slate-100", children: "PCs disponibles para vender" }), _jsx("p", { className: "mt-1 text-xs text-slate-500", children: "Incluye PCs completos de inventario y montajes listos para venta." }), _jsxs("div", { className: "mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2", children: [(inventoryLoading ? [] : inventoryParts.filter((p) => p.inventoryKind === "PREBUILT_PC" && p.stock > 0)).map((part) => {
                                const cost = Number(part.costPrice);
                                const sale = Number(part.salePrice);
                                const profit = sale - cost;
                                return (_jsxs("article", { className: "rounded-xl border border-slate-800 bg-slate-950/40 p-3", children: [_jsxs("div", { className: "flex items-start justify-between gap-2", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "truncate font-semibold text-slate-100", children: part.name }), _jsxs("p", { className: "text-xs text-violet-300", children: ["Origen: Inventario \u00B7 Stock ", part.stock] })] }), _jsx("button", { type: "button", onClick: () => {
                                                        setPreparingPartId(part.id);
                                                        void buildsApi.createBuildFromPrebuiltPart(part.id)
                                                            .then(async (detail) => {
                                                            await Promise.all([reload(), reloadInventory()]);
                                                            navigate(`/builds/${detail.id}#registrar-venta`);
                                                        })
                                                            .catch((err) => window.alert(err instanceof Error ? err.message : "No se pudo preparar la venta del PC."))
                                                            .finally(() => setPreparingPartId(null));
                                                    }, disabled: preparingPartId === part.id, className: "rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-500 disabled:opacity-50", children: preparingPartId === part.id ? "Preparando..." : "Registrar venta" })] }), _jsxs("p", { className: "mt-2 text-xs text-slate-400", children: ["Coste ", money(cost), " \u00B7 Venta estimada ", money(sale), " \u00B7 Beneficio ", money(profit)] })] }, `inv-${part.id}`));
                            }), bucketBuilds.READY.map((build) => (_jsxs("article", { className: "rounded-xl border border-slate-800 bg-slate-950/40 p-3", children: [_jsxs("div", { className: "flex items-start justify-between gap-2", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "truncate font-semibold text-slate-100", children: build.name }), _jsx("p", { className: "text-xs text-emerald-300", children: "Origen: Montaje" })] }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsx(Link, { to: `/builds/${build.id}#registrar-venta`, className: "rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-500", children: "Registrar venta" }), _jsx(Link, { to: `/builds/${build.id}`, className: "rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500", children: "Ver detalle" })] })] }), _jsxs("p", { className: "mt-2 text-xs text-slate-400", children: ["Coste ", money(Number(build.totalCost ?? 0)), " \u00B7 Venta estimada ", money(Number(build.totalSale ?? 0)), " \u00B7 Beneficio ", money(Number(build.profit ?? 0))] })] }, `ready-${build.id}`))), !inventoryLoading && inventoryParts.filter((p) => p.inventoryKind === "PREBUILT_PC" && p.stock > 0).length === 0 && bucketBuilds.READY.length === 0 ? (_jsx("p", { className: "text-sm text-slate-500", children: "No hay equipos disponibles para vender ahora mismo." })) : null] })] }), loading ? (_jsx("section", { className: "rounded-2xl border border-slate-800 bg-slate-900/80 p-6", children: _jsx("p", { className: "text-sm text-slate-300", children: "Cargando montajes..." }) })) : (_jsxs(_Fragment, { children: [["PENDING", "DRAFTS"].map((bucketKey) => {
                        const rows = bucketBuilds[bucketKey];
                        const totals = rows.reduce((acc, b) => {
                            acc.cost += Number(b.totalCost ?? 0);
                            acc.sale += Number(b.totalSale ?? 0);
                            acc.profit += Number(b.profit ?? 0);
                            return acc;
                        }, { cost: 0, sale: 0, profit: 0 });
                        const defaultOpen = rows.length > 0;
                        return (_jsx(BuildSection, { title: bucketTitle(bucketKey), tone: bucketTone(bucketKey), builds: rows, totals: totals, deletingId: deletingId, defaultOpen: defaultOpen, salesByBuildId: salesByBuildId, onDelete: (build) => void handleDelete(build.id, build.name) }, bucketKey));
                    }), _jsx("section", { className: "rounded-2xl border border-slate-800 bg-slate-900/80 shadow-lg shadow-slate-950/40", children: _jsxs("details", { className: "group", open: false, children: [_jsxs("summary", { className: "flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "text-base font-semibold text-slate-100", children: "Vendidos" }), _jsx("p", { className: "text-xs text-slate-500", children: "Historial plegado para no saturar la vista de trabajo." })] }), _jsxs("span", { className: `rounded-full border px-2 py-0.5 text-xs font-semibold ${bucketTone("SOLD")}`, children: [soldBuildsFiltered.length, " montajes"] })] }), _jsxs("div", { className: "border-t border-slate-800 px-4 pb-4 pt-3", children: [_jsxs("div", { className: "mb-3 grid grid-cols-1 gap-3 md:grid-cols-4", children: [_jsxs("label", { className: "flex flex-col gap-1 text-sm text-slate-300", children: ["Mes vendidos", _jsxs("select", { value: soldMonthFilter, onChange: (e) => setSoldMonthFilter(e.target.value === "ALL" ? "ALL" : Number(e.target.value)), className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2", children: [_jsx("option", { value: "ALL", children: "Todos" }), Array.from({ length: 12 }, (_, i) => i + 1).map((m) => _jsx("option", { value: m, children: m }, m))] })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm text-slate-300", children: ["A\u00F1o vendidos", _jsxs("select", { value: soldYearFilter, onChange: (e) => setSoldYearFilter(e.target.value === "ALL" ? "ALL" : Number(e.target.value)), className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2", children: [_jsx("option", { value: "ALL", children: "Todos" }), years.map((y) => _jsx("option", { value: y, children: y }, y))] })] })] }), _jsx("div", { className: "space-y-2", children: soldVisible.map((build) => {
                                                const sale = salesByBuildId.get(build.id);
                                                return (_jsxs("article", { className: "rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2.5", children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "truncate font-medium text-slate-100", children: build.name }), _jsxs("p", { className: "text-xs text-slate-500", children: [toDateLabel(sale?.soldAt ?? build.updatedAt), " \u00B7 Cliente: ", sale?.customerName ?? "—"] })] }), _jsx("p", { className: "text-sm font-semibold text-emerald-300", children: money(Number(sale?.profit ?? build.profit ?? 0)) })] }), _jsx("div", { className: "mt-2 flex flex-wrap gap-2", children: _jsx(Link, { to: `/builds/${build.id}`, className: "rounded-lg border border-indigo-500/40 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-200 hover:bg-indigo-500/20", children: "Ver detalle" }) })] }, build.id));
                                            }) }), soldBuildsFiltered.length > 5 ? (_jsx("button", { type: "button", onClick: () => setSoldExpanded((v) => !v), className: "mt-3 rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800", children: soldExpanded ? "Ver menos" : "Ver todos" })) : null] })] }) })] }))] }));
}
function BuildSection({ title, tone, builds, totals, deletingId, defaultOpen, salesByBuildId, onDelete }) {
    return (_jsx("section", { className: "rounded-2xl border border-slate-800 bg-slate-900/80 shadow-lg shadow-slate-950/40", children: _jsxs("details", { open: defaultOpen, children: [_jsxs("summary", { className: "flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "text-base font-semibold text-slate-100", children: title }), _jsxs("p", { className: "text-xs text-slate-500", children: [builds.length, " montajes \u00B7 coste ", money(totals.cost), " \u00B7 venta ", money(totals.sale), " \u00B7 beneficio ", money(totals.profit)] })] }), _jsx("span", { className: `rounded-full border px-2 py-0.5 text-xs font-semibold ${tone}`, children: builds.length })] }), _jsx("div", { className: "border-t border-slate-800 p-3", children: builds.length === 0 ? (_jsx("p", { className: "text-sm text-slate-500", children: "Sin montajes en esta secci\u00F3n." })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "hidden overflow-x-auto rounded-xl border border-slate-800 md:block", children: _jsxs("table", { className: "min-w-full text-left text-sm text-slate-200", children: [_jsx("thead", { className: "bg-slate-950/70 text-xs uppercase tracking-wide text-slate-400", children: _jsxs("tr", { children: [_jsx("th", { className: "px-3 py-2.5", children: "Nombre" }), _jsx("th", { className: "px-3 py-2.5", children: "Fecha" }), _jsx("th", { className: "px-3 py-2.5", children: "Cliente" }), _jsx("th", { className: "px-3 py-2.5 text-right", children: "Venta" }), _jsx("th", { className: "px-3 py-2.5 text-right", children: "Beneficio" }), _jsx("th", { className: "px-3 py-2.5 text-right", children: "Acciones" })] }) }), _jsx("tbody", { className: "divide-y divide-slate-800", children: builds.map((build) => {
                                                const sale = salesByBuildId.get(build.id);
                                                return (_jsxs("tr", { className: "hover:bg-slate-800/30", children: [_jsx("td", { className: "px-3 py-2.5 font-medium text-slate-100", children: build.name }), _jsx("td", { className: "px-3 py-2.5 text-slate-400", children: toDateLabel(sale?.soldAt ?? build.updatedAt) }), _jsx("td", { className: "px-3 py-2.5 text-slate-300", children: sale?.customerName ?? "—" }), _jsx("td", { className: "px-3 py-2.5 text-right text-emerald-300", children: money(Number(sale?.finalSalePrice ?? build.totalSale ?? 0)) }), _jsx("td", { className: "px-3 py-2.5 text-right text-cyan-300", children: money(Number(sale?.profit ?? build.profit ?? 0)) }), _jsx("td", { className: "px-3 py-2.5", children: _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx(Link, { to: `/builds/${build.id}`, className: "rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500", children: "Ver detalle" }), build.status === "CONFIRMED" ? (_jsx(Link, { to: `/builds/${build.id}#registrar-venta`, className: "rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-500", children: "Vender PC" })) : null, _jsx("button", { type: "button", onClick: () => onDelete(build), disabled: deletingId === build.id || build.status === "SOLD", className: "rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-200 disabled:opacity-50", children: "Eliminar" })] }) })] }, build.id));
                                            }) })] }) }), _jsx("div", { className: "space-y-2 md:hidden", children: builds.map((build) => {
                                    const sale = salesByBuildId.get(build.id);
                                    return (_jsxs("article", { className: "rounded-xl border border-slate-800 bg-slate-950/40 p-3", children: [_jsx("p", { className: "font-semibold text-slate-100", children: build.name }), _jsxs("p", { className: "text-xs text-slate-500", children: [toDateLabel(sale?.soldAt ?? build.updatedAt), " \u00B7 Cliente: ", sale?.customerName ?? "—"] }), _jsxs("div", { className: "mt-2 flex items-center justify-between text-xs", children: [_jsxs("span", { className: "text-emerald-300", children: ["Venta ", money(Number(sale?.finalSalePrice ?? build.totalSale ?? 0))] }), _jsxs("span", { className: "text-cyan-300", children: ["Beneficio ", money(Number(sale?.profit ?? build.profit ?? 0))] })] }), _jsxs("div", { className: "mt-2 flex flex-wrap gap-2", children: [_jsx(Link, { to: `/builds/${build.id}`, className: "rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white", children: "Ver detalle" }), build.status === "CONFIRMED" ? (_jsx(Link, { to: `/builds/${build.id}#registrar-venta`, className: "rounded-lg bg-cyan-600 px-3 py-1 text-xs font-semibold text-white", children: "Vender PC" })) : null, _jsx("button", { type: "button", onClick: () => onDelete(build), disabled: deletingId === build.id || build.status === "SOLD", className: "rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-200 disabled:opacity-50", children: "Eliminar" })] })] }, build.id));
                                }) })] })) })] }) }));
}
