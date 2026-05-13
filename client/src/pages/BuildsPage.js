import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as buildsApi from "../api/builds";
import { useBuilds } from "../hooks/useBuilds";
import { useParts } from "../hooks/useParts";
import * as salesApi from "../api/sales";
import { PRIMARY_ACTION_BUTTON, PRIMARY_ACTION_BUTTON_HEADER, STICKY_PRIMARY_MOBILE_DOCK, PRIMARY_ACTION_BUTTON_COMPACT, SECONDARY_GHOST_SM, DESTRUCTIVE_BUTTON_SM } from "../theme/actionButtons";
import { LIST_PAGE_ACCORDION_BODY, LIST_PAGE_ACCORDION_SHELL, LIST_PAGE_ACCORDION_TRIGGER, LIST_PAGE_COUNT_BADGE, LIST_PAGE_FILTER_SECTION, LIST_PAGE_LISTING_REGION, LIST_PAGE_LISTING_TITLE } from "../theme/listPageMobile";
import { PAGE_HERO, PAGE_OUTER_7XL, SECTION_SHELL, TABLE_CELL } from "../theme/layoutDensity";
function money(value) {
    return `${value.toFixed(2)} EUR`;
}
function toDateLabel(value) {
    if (!value)
        return "—";
    return new Date(value).toLocaleDateString("es-ES");
}
const SPANISH_MONTH_NAMES = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre"
];
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
    /** Móvil: panel de PCs / montajes listos para vender, plegado por defecto. */
    const [availablePcsPanelOpen, setAvailablePcsPanelOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [monthFilter, setMonthFilter] = useState("ALL");
    const [yearFilter, setYearFilter] = useState("ALL");
    const [sortOrder, setSortOrder] = useState("RECENT");
    const [soldMonthFilter, setSoldMonthFilter] = useState(() => new Date().getMonth() + 1);
    const [soldYearFilter, setSoldYearFilter] = useState(() => new Date().getFullYear());
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
        set.add(new Date().getFullYear());
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
    const prebuiltWithStock = useMemo(() => inventoryParts.filter((p) => p.inventoryKind === "PREBUILT_PC" && p.stock > 0), [inventoryParts]);
    const availableToSellCount = prebuiltWithStock.length + bucketBuilds.READY.length;
    return (_jsxs("div", { className: `${PAGE_OUTER_7XL} max-md:pb-32`, children: [_jsxs("section", { className: `${PAGE_HERO} flex flex-col gap-3 md:flex-row md:items-start md:justify-between`, children: [_jsx("h1", { className: "text-3xl font-bold tracking-tight", children: "Montajes de PC" }), _jsx("button", { type: "button", onClick: () => {
                            void handleQuickCreate();
                        }, disabled: creatingQuick, className: PRIMARY_ACTION_BUTTON_HEADER, children: creatingQuick ? "Creando..." : "Crear montaje" })] }), error ? (_jsxs("div", { className: "flex flex-col gap-3 rounded-xl border border-rose-800/70 bg-rose-950/40 px-4 py-3 text-sm text-rose-200 md:flex-row md:items-center md:justify-between", children: [_jsx("span", { children: error }), _jsx("button", { type: "button", onClick: () => {
                            void reload();
                        }, className: "rounded-lg border border-rose-700 bg-rose-900/50 px-3 py-1.5 font-semibold text-rose-100 transition hover:bg-rose-800/70", children: "Reintentar" })] })) : null, _jsx("section", { className: LIST_PAGE_FILTER_SECTION, children: _jsxs("details", { className: "group", children: [_jsxs("summary", { className: LIST_PAGE_ACCORDION_TRIGGER, children: [_jsx("span", { className: "text-base font-semibold text-slate-100", children: "Filtros" }), _jsx("svg", { className: "h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180", fill: "none", viewBox: "0 0 24 24", strokeWidth: 2, stroke: "currentColor", "aria-hidden": true, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M19 9l-7 7-7-7" }) })] }), _jsx("div", { className: "border-t border-slate-800 px-3.5 pb-4 pt-3 md:px-4", children: _jsxs("div", { className: "grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5", children: [_jsxs("label", { className: "flex flex-col gap-1 text-sm text-slate-300 xl:col-span-2", children: ["Buscar por nombre", _jsx("input", { value: query, onChange: (e) => setQuery(e.target.value), className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 outline-none focus:border-indigo-400", placeholder: "Ej: Gaming, Oficina..." })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm text-slate-300", children: ["Estado", _jsxs("select", { value: statusFilter, onChange: (e) => setStatusFilter(e.target.value), className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2", children: [_jsx("option", { value: "ALL", children: "Todos" }), _jsx("option", { value: "DRAFTS", children: "Borradores" }), _jsx("option", { value: "PENDING", children: "Pendientes" }), _jsx("option", { value: "READY", children: "Listos para vender" }), _jsx("option", { value: "SOLD", children: "Vendidos" })] })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm text-slate-300", children: ["Mes", _jsxs("select", { value: monthFilter, onChange: (e) => setMonthFilter(e.target.value === "ALL" ? "ALL" : Number(e.target.value)), className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2", children: [_jsx("option", { value: "ALL", children: "Todos" }), Array.from({ length: 12 }, (_, i) => i + 1).map((m) => _jsx("option", { value: m, children: m }, m))] })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm text-slate-300", children: ["A\u00F1o", _jsxs("select", { value: yearFilter, onChange: (e) => setYearFilter(e.target.value === "ALL" ? "ALL" : Number(e.target.value)), className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2", children: [_jsx("option", { value: "ALL", children: "Todos" }), years.map((y) => _jsx("option", { value: y, children: y }, y))] })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm text-slate-300", children: ["Orden", _jsxs("select", { value: sortOrder, onChange: (e) => setSortOrder(e.target.value), className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2", children: [_jsx("option", { value: "RECENT", children: "Recientes" }), _jsx("option", { value: "PROFIT_DESC", children: "Mayor beneficio" }), _jsx("option", { value: "PRICE_DESC", children: "Mayor precio" })] })] })] }) })] }) }), _jsxs("div", { className: LIST_PAGE_LISTING_REGION, children: [_jsx("h2", { className: LIST_PAGE_LISTING_TITLE, children: "Listado de montajes" }), _jsxs("section", { className: `${LIST_PAGE_ACCORDION_SHELL} backdrop-blur`, children: [_jsxs("button", { type: "button", className: `${LIST_PAGE_ACCORDION_TRIGGER} md:hidden`, onClick: () => setAvailablePcsPanelOpen((open) => !open), "aria-expanded": availablePcsPanelOpen, "aria-controls": "builds-available-pcs-panel", children: [_jsxs("div", { className: "flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:gap-3", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("span", { className: "block text-base font-semibold text-slate-100", children: "Disponibles para vender" }), _jsx("span", { className: "mt-0.5 block text-xs font-normal text-slate-500", children: inventoryLoading ? "Cargando inventario…" : "Inventario y listos para venta" })] }), _jsx("span", { className: `${LIST_PAGE_COUNT_BADGE} ${bucketTone("READY")}`, children: availableToSellCount })] }), _jsx("svg", { className: `h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 ${availablePcsPanelOpen ? "rotate-180" : ""}`, fill: "none", viewBox: "0 0 24 24", strokeWidth: 2, stroke: "currentColor", "aria-hidden": true, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M19 9l-7 7-7-7" }) })] }), _jsx("div", { id: "builds-available-pcs-panel", className: availablePcsPanelOpen ? "" : "max-md:hidden", children: _jsxs("div", { className: "p-4 md:p-5", children: [_jsxs("div", { className: "mb-2 hidden items-center gap-2 md:flex", children: [_jsx("h3", { className: "text-lg font-semibold text-slate-100", children: "Disponibles para vender" }), _jsx("span", { className: `${LIST_PAGE_COUNT_BADGE} ${bucketTone("READY")}`, children: availableToSellCount })] }), _jsxs("div", { className: "mt-3 grid grid-cols-1 gap-2.5 lg:grid-cols-2", children: [(inventoryLoading ? [] : prebuiltWithStock).map((part) => {
                                                    const sale = Number(part.salePrice);
                                                    return (_jsxs("article", { className: "rounded-xl border border-slate-800 bg-slate-950/40 p-3.5 md:p-4", children: [_jsxs("div", { className: "flex items-start justify-between gap-2", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "truncate font-semibold text-slate-100", children: part.name }), _jsxs("p", { className: "mt-1 text-sm font-medium text-violet-300", children: ["Stock ", part.stock] })] }), _jsx("button", { type: "button", onClick: () => {
                                                                            setPreparingPartId(part.id);
                                                                            void buildsApi
                                                                                .createBuildFromPrebuiltPart(part.id)
                                                                                .then(async (detail) => {
                                                                                await Promise.all([reload(), reloadInventory()]);
                                                                                navigate(`/builds/${detail.id}#registrar-venta`);
                                                                            })
                                                                                .catch((err) => window.alert(err instanceof Error ? err.message : "No se pudo preparar la venta del PC."))
                                                                                .finally(() => setPreparingPartId(null));
                                                                        }, disabled: preparingPartId === part.id, className: PRIMARY_ACTION_BUTTON_COMPACT, children: preparingPartId === part.id ? "Preparando..." : "Registrar venta" })] }), _jsx("p", { className: "mt-3 text-lg font-semibold text-emerald-300", children: money(sale) })] }, `inv-${part.id}`));
                                                }), bucketBuilds.READY.map((build) => (_jsxs("article", { className: "rounded-xl border border-slate-800 bg-slate-950/40 p-3.5 md:p-4", children: [_jsxs("div", { className: "flex items-start justify-between gap-2", children: [_jsx("div", { className: "min-w-0", children: _jsx("p", { className: "truncate font-semibold text-slate-100", children: build.name }) }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsx(Link, { to: `/builds/${build.id}#registrar-venta`, className: PRIMARY_ACTION_BUTTON_COMPACT, children: "Registrar venta" }), _jsx(Link, { to: `/builds/${build.id}`, className: SECONDARY_GHOST_SM, children: "Ver detalle" })] })] }), _jsx("p", { className: "mt-3 text-lg font-semibold text-emerald-300", children: money(Number(build.totalSale ?? 0)) })] }, `ready-${build.id}`))), !inventoryLoading && prebuiltWithStock.length === 0 && bucketBuilds.READY.length === 0 ? (_jsx("p", { className: "text-sm text-slate-500", children: "No hay equipos disponibles para vender ahora mismo." })) : null] })] }) })] }), loading ? (_jsx("section", { className: SECTION_SHELL, children: _jsx("p", { className: "text-sm text-slate-300", children: "Cargando montajes..." }) })) : (_jsxs(_Fragment, { children: [["PENDING", "DRAFTS"].map((bucketKey) => {
                                const rows = bucketBuilds[bucketKey];
                                const defaultOpen = rows.length > 0;
                                return (_jsx(BuildSection, { title: bucketTitle(bucketKey), tone: bucketTone(bucketKey), builds: rows, deletingId: deletingId, defaultOpen: defaultOpen, salesByBuildId: salesByBuildId, onDelete: (build) => void handleDelete(build.id, build.name) }, bucketKey));
                            }), _jsx("section", { className: LIST_PAGE_ACCORDION_SHELL, children: _jsxs("details", { className: "group", open: false, children: [_jsxs("summary", { className: LIST_PAGE_ACCORDION_TRIGGER, children: [_jsxs("div", { className: "flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:gap-3", children: [_jsx("p", { className: "text-lg font-semibold text-slate-100", children: "Vendidos" }), _jsx("span", { className: `${LIST_PAGE_COUNT_BADGE} ${bucketTone("SOLD")}`, children: soldBuildsFiltered.length })] }), _jsx("svg", { className: "h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180", fill: "none", viewBox: "0 0 24 24", strokeWidth: 2, stroke: "currentColor", "aria-hidden": true, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M19 9l-7 7-7-7" }) })] }), _jsxs("div", { className: "border-t border-slate-800 px-4 pb-3 pt-2.5", children: [_jsxs("div", { className: "mb-2.5 grid grid-cols-1 gap-2.5 md:grid-cols-4", children: [_jsxs("label", { className: "flex flex-col gap-1 text-sm text-slate-300", children: ["Ventas por mes", _jsxs("select", { value: soldMonthFilter, onChange: (e) => setSoldMonthFilter(e.target.value === "ALL" ? "ALL" : Number(e.target.value)), className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2", children: [_jsx("option", { value: "ALL", children: "Todos" }), Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (_jsx("option", { value: m, children: SPANISH_MONTH_NAMES[m - 1] }, m)))] })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm text-slate-300", children: ["A\u00F1o vendidos", _jsxs("select", { value: soldYearFilter, onChange: (e) => setSoldYearFilter(e.target.value === "ALL" ? "ALL" : Number(e.target.value)), className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2", children: [_jsx("option", { value: "ALL", children: "Todos" }), years.map((y) => _jsx("option", { value: y, children: y }, y))] })] })] }), _jsx("div", { className: "space-y-2", children: soldVisible.map((build) => {
                                                        const sale = salesByBuildId.get(build.id);
                                                        return (_jsxs("article", { className: "rounded-xl border border-slate-800 bg-slate-950/40 px-3.5 py-2.5", children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "truncate font-medium text-slate-100", children: build.name }), _jsx("p", { className: "mt-1 text-sm text-slate-400", children: sale?.customerName ?? "—" })] }), _jsx("p", { className: "text-lg font-semibold text-emerald-300", children: money(Number(sale?.finalSalePrice ?? build.totalSale ?? 0)) })] }), _jsx("div", { className: "mt-2 flex flex-wrap gap-2", children: _jsx(Link, { to: `/builds/${build.id}`, className: SECONDARY_GHOST_SM, children: "Ver detalle" }) })] }, build.id));
                                                    }) }), soldBuildsFiltered.length > 5 ? (_jsx("button", { type: "button", onClick: () => setSoldExpanded((v) => !v), className: "mt-3 rounded-lg border border-slate-600 bg-slate-900/70 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-800", children: soldExpanded ? "Ver menos" : "Ver todos" })) : null] })] }) })] }))] }), _jsx("div", { className: STICKY_PRIMARY_MOBILE_DOCK, children: _jsx("button", { type: "button", onClick: () => {
                        void handleQuickCreate();
                    }, disabled: creatingQuick, className: PRIMARY_ACTION_BUTTON, children: creatingQuick ? "Creando..." : "Crear montaje" }) })] }));
}
function BuildSection({ title, tone, builds, deletingId, defaultOpen, salesByBuildId, onDelete }) {
    return (_jsx("section", { className: LIST_PAGE_ACCORDION_SHELL, children: _jsxs("details", { className: "group", open: defaultOpen, children: [_jsxs("summary", { className: LIST_PAGE_ACCORDION_TRIGGER, children: [_jsxs("div", { className: "flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:gap-3", children: [_jsx("p", { className: "text-lg font-semibold text-slate-100", children: title }), _jsx("span", { className: `${LIST_PAGE_COUNT_BADGE} ${tone}`, children: builds.length })] }), _jsx("svg", { className: "h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180", fill: "none", viewBox: "0 0 24 24", strokeWidth: 2, stroke: "currentColor", "aria-hidden": true, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M19 9l-7 7-7-7" }) })] }), _jsx("div", { className: LIST_PAGE_ACCORDION_BODY, children: builds.length === 0 ? (_jsx("p", { className: "text-sm text-slate-500", children: "Sin montajes en esta secci\u00F3n." })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "hidden overflow-x-auto rounded-xl border border-slate-800 md:block", children: _jsxs("table", { className: "min-w-full text-left text-sm text-slate-200", children: [_jsx("thead", { className: "bg-slate-950/70 text-xs uppercase tracking-wide text-slate-400", children: _jsxs("tr", { children: [_jsx("th", { className: TABLE_CELL, children: "Nombre" }), _jsx("th", { className: TABLE_CELL, children: "Fecha" }), _jsx("th", { className: TABLE_CELL, children: "Cliente" }), _jsx("th", { className: `${TABLE_CELL} text-right`, children: "Venta" }), _jsx("th", { className: `${TABLE_CELL} text-right`, children: "Beneficio" }), _jsx("th", { className: `${TABLE_CELL} text-right`, children: "Acciones" })] }) }), _jsx("tbody", { className: "divide-y divide-slate-800", children: builds.map((build) => {
                                                const sale = salesByBuildId.get(build.id);
                                                return (_jsxs("tr", { className: "hover:bg-slate-800/30", children: [_jsx("td", { className: `${TABLE_CELL} font-medium text-slate-100`, children: build.name }), _jsx("td", { className: `${TABLE_CELL} text-slate-400`, children: toDateLabel(sale?.soldAt ?? build.updatedAt) }), _jsx("td", { className: `${TABLE_CELL} text-slate-300`, children: sale?.customerName ?? "—" }), _jsx("td", { className: `${TABLE_CELL} text-right text-emerald-300`, children: money(Number(sale?.finalSalePrice ?? build.totalSale ?? 0)) }), _jsx("td", { className: `${TABLE_CELL} text-right text-cyan-300`, children: money(Number(sale?.profit ?? build.profit ?? 0)) }), _jsx("td", { className: TABLE_CELL, children: _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx(Link, { to: `/builds/${build.id}`, className: SECONDARY_GHOST_SM, children: "Ver detalle" }), build.status === "CONFIRMED" ? (_jsx(Link, { to: `/builds/${build.id}#registrar-venta`, className: PRIMARY_ACTION_BUTTON_COMPACT, children: "Vender PC" })) : null, _jsx("button", { type: "button", onClick: () => onDelete(build), disabled: deletingId === build.id || build.status === "SOLD", className: DESTRUCTIVE_BUTTON_SM, children: "Eliminar" })] }) })] }, build.id));
                                            }) })] }) }), _jsx("div", { className: "space-y-2 md:hidden", children: builds.map((build) => {
                                    const sale = salesByBuildId.get(build.id);
                                    return (_jsxs("article", { className: "rounded-xl border border-slate-800 bg-slate-950/40 p-3.5", children: [_jsx("p", { className: "font-semibold text-slate-100", children: build.name }), _jsx("p", { className: "mt-1 text-sm text-slate-400", children: sale?.customerName ?? "—" }), _jsx("p", { className: "mt-3 text-base font-semibold text-emerald-300", children: money(Number(sale?.finalSalePrice ?? build.totalSale ?? 0)) }), _jsxs("div", { className: "mt-2 flex flex-wrap gap-2", children: [_jsx(Link, { to: `/builds/${build.id}`, className: SECONDARY_GHOST_SM, children: "Ver detalle" }), build.status === "CONFIRMED" ? (_jsx(Link, { to: `/builds/${build.id}#registrar-venta`, className: PRIMARY_ACTION_BUTTON_COMPACT, children: "Vender PC" })) : null, _jsx("button", { type: "button", onClick: () => onDelete(build), disabled: deletingId === build.id || build.status === "SOLD", className: DESTRUCTIVE_BUTTON_SM, children: "Eliminar" })] })] }, build.id));
                                }) })] })) })] }) }));
}
