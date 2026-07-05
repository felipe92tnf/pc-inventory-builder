import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, createSearchParams, useLocation, useNavigate } from "react-router-dom";
import * as buildsApi from "../api/builds";
import { useBuilds } from "../hooks/useBuilds";
import { useParts } from "../hooks/useParts";
import * as salesApi from "../api/sales";
import { PRIMARY_ACTION_BUTTON, PRIMARY_ACTION_BUTTON_HEADER, STICKY_PRIMARY_MOBILE_DOCK, PRIMARY_ACTION_BUTTON_COMPACT, SECONDARY_BUTTON_SM, SECONDARY_GHOST_SM, DESTRUCTIVE_BUTTON_SM } from "../theme/actionButtons";
import { LIST_PAGE_ACCORDION_BODY, LIST_PAGE_ACCORDION_SHELL, LIST_PAGE_ACCORDION_TRIGGER, LIST_PAGE_COUNT_BADGE, LIST_PAGE_FILTER_SECTION, LIST_PAGE_LISTING_REGION, LIST_PAGE_LISTING_TITLE } from "../theme/listPageMobile";
import { PAGE_HERO, PAGE_OUTER_7XL, SECTION_SHELL, TABLE_CELL } from "../theme/layoutDensity";
import { isActiveSale, isRevertedSale } from "../utils/salesStats";
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
    if (build.status === "PENDING_PICKUP")
        return "PENDING_PICKUP";
    if (build.status === "PENDING_PAYMENT")
        return "PENDING_PAYMENT";
    if (build.status === "RESERVED")
        return "RESERVED";
    if (build.status === "CONFIRMED")
        return "CONFIRMED";
    return "WIP";
}
function bucketTitle(bucket) {
    if (bucket === "WIP")
        return "Montajes en curso";
    if (bucket === "CONFIRMED")
        return "Listo para la venta";
    if (bucket === "RESERVED")
        return "Reservado";
    if (bucket === "PENDING_PAYMENT")
        return "Pendiente de pago";
    if (bucket === "PENDING_PICKUP")
        return "Pendiente de recogida";
    return "Vendidos";
}
function buildFilterDateRef(build, bucket, sale) {
    if (bucket === "SOLD" || build.status === "SOLD" || build.status === "PENDING_PICKUP") {
        return sale?.soldAt ?? build.updatedAt;
    }
    if (bucket === "WIP") {
        return build.createdAt;
    }
    return build.confirmedAt ?? build.createdAt;
}
function matchesMonthYear(iso, monthFilter, yearFilter) {
    const d = new Date(iso);
    const matchesMonth = monthFilter === "ALL" || d.getMonth() + 1 === monthFilter;
    const matchesYear = yearFilter === "ALL" || d.getFullYear() === yearFilter;
    return matchesMonth && matchesYear;
}
function canLinkRegisterSale(build, sale) {
    if (!["CONFIRMED", "PENDING_PAYMENT", "RESERVED"].includes(build.status))
        return false;
    return !sale || !isActiveSale(sale);
}
function canRevertSale(build, sale) {
    if (!sale || isRevertedSale(sale) || sale.isImported)
        return false;
    return build.status === "SOLD" || build.status === "PENDING_PICKUP";
}
function bucketTone(bucket) {
    if (bucket === "SOLD")
        return "border-cyan-500/30 bg-cyan-500/10 text-cyan-200";
    if (bucket === "CONFIRMED")
        return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
    if (bucket === "RESERVED")
        return "border-violet-500/30 bg-violet-500/10 text-violet-200";
    if (bucket === "PENDING_PAYMENT")
        return "border-amber-500/30 bg-amber-500/10 text-amber-200";
    if (bucket === "PENDING_PICKUP")
        return "border-sky-500/30 bg-sky-500/10 text-sky-200";
    return "border-indigo-500/30 bg-indigo-500/10 text-indigo-200";
}
const OPERATIVE_BUCKET_KEYS = ["WIP", "CONFIRMED", "RESERVED", "PENDING_PAYMENT", "PENDING_PICKUP"];
export function BuildsPage() {
    const navigate = useNavigate();
    const location = useLocation();
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
    const [revertingSaleId, setRevertingSaleId] = useState(null);
    const [actionError, setActionError] = useState(null);
    const [showEmptySections, setShowEmptySections] = useState(false);
    const [listFlash, setListFlash] = useState(null);
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
        const msg = location.state?.flash;
        if (!msg)
            return;
        setListFlash(msg);
        navigate(location.pathname, { replace: true, state: {} });
        void reload();
    }, [location.pathname, location.state, navigate, reload]);
    const reloadSales = useCallback(async () => {
        try {
            const rows = await salesApi.listSales();
            setSalesRows(rows);
        }
        catch {
            setSalesRows([]);
        }
    }, []);
    useEffect(() => {
        void reloadSales();
    }, [builds.length, reloadSales]);
    const salesByBuildId = useMemo(() => {
        const map = new Map();
        for (const sale of salesRows) {
            if (isRevertedSale(sale))
                continue;
            const prev = map.get(sale.buildId);
            if (!prev || new Date(sale.soldAt).getTime() > new Date(prev.soldAt).getTime()) {
                map.set(sale.buildId, sale);
            }
        }
        return map;
    }, [salesRows]);
    const years = useMemo(() => {
        const set = new Set();
        set.add(new Date().getFullYear());
        for (const build of builds) {
            set.add(new Date(build.confirmedAt ?? build.createdAt).getFullYear());
            set.add(new Date(build.updatedAt).getFullYear());
        }
        for (const part of inventoryParts) {
            set.add(new Date(part.updatedAt).getFullYear());
        }
        for (const sale of salesRows) {
            set.add(new Date(sale.soldAt).getFullYear());
        }
        return [...set].sort((a, b) => b - a);
    }, [builds, salesRows, inventoryParts]);
    const globallyFilteredBuilds = useMemo(() => {
        const q = query.trim().toLowerCase();
        return builds
            .filter((build) => {
            const bucket = buildBucket(build);
            const sale = salesByBuildId.get(build.id);
            const dateRef = buildFilterDateRef(build, bucket, sale);
            const hay = [
                build.name,
                build.customerName ?? "",
                build.customerPhone ?? "",
                build.customerEmail ?? ""
            ]
                .join(" ")
                .toLowerCase();
            const matchesQuery = !q || hay.includes(q);
            const matchesStatus = statusFilter === "ALL" || bucket === statusFilter;
            const matchesDate = matchesMonthYear(dateRef, monthFilter, yearFilter);
            return matchesQuery && matchesStatus && matchesDate;
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
            const dateA = new Date(buildFilterDateRef(a, buildBucket(a), saleA)).getTime();
            const dateB = new Date(buildFilterDateRef(b, buildBucket(b), saleB)).getTime();
            return dateB - dateA;
        });
    }, [builds, salesByBuildId, query, statusFilter, monthFilter, yearFilter, sortOrder]);
    const bucketBuilds = useMemo(() => {
        const map = {
            WIP: [],
            CONFIRMED: [],
            RESERVED: [],
            PENDING_PAYMENT: [],
            PENDING_PICKUP: [],
            SOLD: []
        };
        for (const build of globallyFilteredBuilds) {
            map[buildBucket(build)].push(build);
        }
        return map;
    }, [globallyFilteredBuilds]);
    const soldBuildsFiltered = bucketBuilds.SOLD;
    const soldVisible = soldExpanded ? soldBuildsFiltered : soldBuildsFiltered.slice(0, 5);
    const prebuiltWithStock = useMemo(() => inventoryParts.filter((p) => p.inventoryKind === "PREBUILT_PC" && p.stock > 0), [inventoryParts]);
    const prebuiltReadyFiltered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return prebuiltWithStock.filter((p) => {
            const hay = p.name.toLowerCase();
            const matchesQuery = !q || hay.includes(q);
            const matchesDate = matchesMonthYear(p.updatedAt, monthFilter, yearFilter);
            const matchesStatus = statusFilter === "ALL" || statusFilter === "CONFIRMED";
            return matchesQuery && matchesDate && matchesStatus;
        });
    }, [prebuiltWithStock, query, monthFilter, yearFilter, statusFilter]);
    const vendidosSectionVisible = showEmptySections || soldBuildsFiltered.length > 0;
    const confirmedSectionHasRows = bucketBuilds.CONFIRMED.length > 0 || prebuiltReadyFiltered.length > 0 || inventoryLoading;
    const anyOperativeBucketHasRows = OPERATIVE_BUCKET_KEYS.some((k) => k === "CONFIRMED" ? confirmedSectionHasRows : bucketBuilds[k].length > 0);
    const showNoListingsHint = !loading &&
        !showEmptySections &&
        !vendidosSectionVisible &&
        !anyOperativeBucketHasRows;
    const handleClearFilters = () => {
        setQuery("");
        setStatusFilter("ALL");
        setMonthFilter("ALL");
        setYearFilter("ALL");
        setSortOrder("RECENT");
        setListFlash("Filtros restablecidos.");
    };
    const handleRevertSale = async (build, sale) => {
        const ok = window.confirm(`Revertir la venta del montaje "${build.name}"?\n\n- El montaje volverá a listo para la venta\n- La venta quedará en historial como revertida\n- El stock sigue comprometido en el montaje`);
        if (!ok)
            return;
        setRevertingSaleId(sale.id);
        setActionError(null);
        try {
            await salesApi.revertSale(sale.id);
            await Promise.all([reload(), reloadSales()]);
            setListFlash(`Venta revertida. "${build.name}" disponible de nuevo.`);
        }
        catch (err) {
            setActionError(err instanceof Error ? err.message : "No se pudo revertir la venta.");
        }
        finally {
            setRevertingSaleId(null);
        }
    };
    return (_jsxs("div", { className: `${PAGE_OUTER_7XL} max-md:pb-32`, children: [listFlash ? (_jsxs("div", { className: "mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/40 bg-emerald-950/50 px-4 py-3 text-sm text-emerald-100", children: [_jsx("span", { children: listFlash }), _jsx("button", { type: "button", onClick: () => setListFlash(null), className: "rounded-lg border border-emerald-600/50 px-3 py-1 text-xs font-semibold text-emerald-200 hover:bg-emerald-900/40", children: "Cerrar" })] })) : null, _jsxs("section", { className: `${PAGE_HERO} flex flex-col gap-3 md:flex-row md:items-start md:justify-between`, children: [_jsx("h1", { className: "text-3xl font-bold tracking-tight", children: "Montajes de PC" }), _jsx("button", { type: "button", onClick: () => {
                            void handleQuickCreate();
                        }, disabled: creatingQuick, className: PRIMARY_ACTION_BUTTON_HEADER, children: creatingQuick ? "Creando..." : "Crear montaje" })] }), error || actionError ? (_jsxs("div", { className: "flex flex-col gap-3 rounded-xl border border-rose-800/70 bg-rose-950/40 px-4 py-3 text-sm text-rose-200 md:flex-row md:items-center md:justify-between", children: [_jsx("span", { children: error ?? actionError }), _jsx("button", { type: "button", onClick: () => {
                            setActionError(null);
                            void reload();
                        }, className: "rounded-lg border border-rose-700 bg-rose-900/50 px-3 py-1.5 font-semibold text-rose-100 transition hover:bg-rose-800/70", children: "Reintentar" })] })) : null, _jsx("section", { className: LIST_PAGE_FILTER_SECTION, children: _jsxs("details", { className: "group", children: [_jsxs("summary", { className: LIST_PAGE_ACCORDION_TRIGGER, children: [_jsx("span", { className: "text-base font-semibold text-slate-100", children: "Filtros" }), _jsx("svg", { className: "h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180", fill: "none", viewBox: "0 0 24 24", strokeWidth: 2, stroke: "currentColor", "aria-hidden": true, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M19 9l-7 7-7-7" }) })] }), _jsx("div", { className: "border-t border-slate-800 px-3.5 pb-4 pt-3 md:px-4", children: _jsxs("div", { className: "grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5", children: [_jsxs("label", { className: "flex flex-col gap-1 text-sm text-slate-300 xl:col-span-2", children: ["Buscar por nombre", _jsx("input", { value: query, onChange: (e) => setQuery(e.target.value), className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 outline-none focus:border-indigo-400", placeholder: "Ej: Gaming, Oficina..." })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm text-slate-300", children: ["Estado", _jsxs("select", { value: statusFilter, onChange: (e) => setStatusFilter(e.target.value), className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2", children: [_jsx("option", { value: "ALL", children: "Todos" }), _jsx("option", { value: "WIP", children: "Montajes en curso" }), _jsx("option", { value: "CONFIRMED", children: "Listo para la venta" }), _jsx("option", { value: "RESERVED", children: "Reservado" }), _jsx("option", { value: "PENDING_PAYMENT", children: "Pendiente de pago" }), _jsx("option", { value: "PENDING_PICKUP", children: "Pendiente de recogida" }), _jsx("option", { value: "SOLD", children: "Vendidos" })] })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm text-slate-300", children: ["Mes", _jsxs("select", { value: monthFilter, onChange: (e) => setMonthFilter(e.target.value === "ALL" ? "ALL" : Number(e.target.value)), className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2", children: [_jsx("option", { value: "ALL", children: "Todos" }), Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (_jsx("option", { value: m, children: SPANISH_MONTH_NAMES[m - 1] }, m)))] })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm text-slate-300", children: ["A\u00F1o", _jsxs("select", { value: yearFilter, onChange: (e) => setYearFilter(e.target.value === "ALL" ? "ALL" : Number(e.target.value)), className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2", children: [_jsx("option", { value: "ALL", children: "Todos" }), years.map((y) => _jsx("option", { value: y, children: y }, y))] })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm text-slate-300", children: ["Orden", _jsxs("select", { value: sortOrder, onChange: (e) => setSortOrder(e.target.value), className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2", children: [_jsx("option", { value: "RECENT", children: "Recientes" }), _jsx("option", { value: "PROFIT_DESC", children: "Mayor beneficio" }), _jsx("option", { value: "PRICE_DESC", children: "Mayor precio" })] })] }), _jsx("div", { className: "flex items-end xl:col-span-5", children: _jsx("button", { type: "button", onClick: handleClearFilters, className: SECONDARY_BUTTON_SM, children: "Limpiar filtros" }) })] }) })] }) }), _jsxs("div", { className: LIST_PAGE_LISTING_REGION, children: [_jsxs("div", { className: "mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between", children: [_jsx("h2", { className: LIST_PAGE_LISTING_TITLE, children: "Listado de montajes" }), _jsxs("label", { className: "flex cursor-pointer items-center gap-2 text-sm text-slate-400 select-none", children: [_jsx("input", { type: "checkbox", checked: showEmptySections, onChange: (e) => setShowEmptySections(e.target.checked), className: "h-4 w-4 rounded border-slate-600 bg-slate-950 text-indigo-500 focus:ring-indigo-400/40" }), "Mostrar secciones vac\u00EDas"] })] }), loading ? (_jsx("section", { className: SECTION_SHELL, children: _jsx("p", { className: "text-sm text-slate-300", children: "Cargando montajes..." }) })) : (_jsxs(_Fragment, { children: [OPERATIVE_BUCKET_KEYS.map((bucketKey) => {
                                const rows = bucketBuilds[bucketKey];
                                const isConfirmed = bucketKey === "CONFIRMED";
                                const inv = isConfirmed ? prebuiltReadyFiltered : [];
                                const hasRows = isConfirmed
                                    ? rows.length > 0 || inv.length > 0 || inventoryLoading
                                    : rows.length > 0;
                                if (!hasRows && !showEmptySections)
                                    return null;
                                const defaultOpen = isConfirmed ? rows.length > 0 || inv.length > 0 : rows.length > 0;
                                return (_jsx(BuildSection, { title: bucketTitle(bucketKey), tone: bucketTone(bucketKey), builds: rows, listCount: isConfirmed ? rows.length + inv.length : rows.length, inventoryPrebuilts: isConfirmed ? inv : undefined, inventoryLoading: isConfirmed && inventoryLoading, sortOrder: sortOrder, salesByBuildId: salesByBuildId, deletingId: deletingId, preparingPartId: preparingPartId, revertingSaleId: revertingSaleId, defaultOpen: defaultOpen, onDelete: (build) => void handleDelete(build.id, build.name), onRevertSale: (build, sale) => void handleRevertSale(build, sale), onRegisterInventoryPrebuilt: isConfirmed
                                        ? (part) => {
                                            setPreparingPartId(part.id);
                                            void buildsApi
                                                .createBuildFromPrebuiltPart(part.id)
                                                .then(async (detail) => {
                                                await Promise.all([reload(), reloadInventory()]);
                                                navigate(`/builds/${detail.id}#registrar-venta`);
                                            })
                                                .catch((err) => window.alert(err instanceof Error ? err.message : "No se pudo preparar la venta del PC."))
                                                .finally(() => setPreparingPartId(null));
                                        }
                                        : undefined }, bucketKey));
                            }), vendidosSectionVisible ? (_jsx("section", { className: LIST_PAGE_ACCORDION_SHELL, children: _jsxs("details", { className: "group", open: false, children: [_jsxs("summary", { className: LIST_PAGE_ACCORDION_TRIGGER, children: [_jsxs("div", { className: "flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:gap-3", children: [_jsx("p", { className: "text-lg font-semibold text-slate-100", children: "Vendidos" }), _jsx("span", { className: `${LIST_PAGE_COUNT_BADGE} ${bucketTone("SOLD")}`, children: soldBuildsFiltered.length })] }), _jsx("svg", { className: "h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180", fill: "none", viewBox: "0 0 24 24", strokeWidth: 2, stroke: "currentColor", "aria-hidden": true, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M19 9l-7 7-7-7" }) })] }), _jsxs("div", { className: "border-t border-slate-800 px-4 pb-3 pt-2.5", children: [_jsx("div", { className: "space-y-2", children: soldVisible.map((build) => {
                                                        const sale = salesByBuildId.get(build.id);
                                                        return (_jsxs("article", { className: "rounded-xl border border-slate-800 bg-slate-950/40 px-3.5 py-2.5", children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "truncate font-medium text-slate-100", children: build.name }), _jsx("p", { className: "mt-1 text-sm text-slate-400", children: sale?.customerName ?? build.customerName ?? "—" }), _jsx("p", { className: "mt-1 text-xs text-slate-500", children: toDateLabel(sale?.soldAt ?? build.updatedAt) })] }), _jsx("p", { className: "text-lg font-semibold text-emerald-300", children: money(Number(sale?.finalSalePrice ?? build.totalSale ?? 0)) })] }), _jsxs("div", { className: "mt-2 flex flex-wrap gap-2", children: [_jsx(Link, { to: `/builds/${build.id}`, className: SECONDARY_GHOST_SM, children: "Ver detalle" }), sale && canRevertSale(build, sale) ? (_jsx("button", { type: "button", onClick: () => void handleRevertSale(build, sale), disabled: revertingSaleId === sale.id, className: SECONDARY_BUTTON_SM, children: revertingSaleId === sale.id ? "Revirtiendo..." : "Revertir venta" })) : null] })] }, build.id));
                                                    }) }), soldBuildsFiltered.length > 5 ? (_jsx("button", { type: "button", onClick: () => setSoldExpanded((v) => !v), className: "mt-3 rounded-lg border border-slate-600 bg-slate-900/70 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-800", children: soldExpanded ? "Ver menos" : "Ver todos" })) : null] })] }) })) : null, showNoListingsHint ? (_jsx("p", { className: "text-sm text-slate-500", children: "Ninguna secci\u00F3n tiene contenido con los filtros actuales. Activa \u00ABMostrar secciones vac\u00EDas\u00BB para ver todas las categor\u00EDas." })) : null] }))] }), _jsx("div", { className: STICKY_PRIMARY_MOBILE_DOCK, children: _jsx("button", { type: "button", onClick: () => {
                        void handleQuickCreate();
                    }, disabled: creatingQuick, className: PRIMARY_ACTION_BUTTON, children: creatingQuick ? "Creando..." : "Crear montaje" }) })] }));
}
function isInventoryPrebuiltBuild(build) {
    return build.items?.length === 1 && build.items[0]?.part?.inventoryKind === "PREBUILT_PC";
}
function partLineProfit(part) {
    return Math.round((Number(part.salePrice) - Number(part.costPrice)) * 100) / 100;
}
function inventoryPrebuiltDetailLink(partId) {
    const qs = createSearchParams({
        tab: "prebuilt",
        highlightPart: partId
    }).toString();
    return `/inventory?${qs}`;
}
function BuildSection({ title, tone, builds, listCount, inventoryPrebuilts, inventoryLoading, sortOrder, deletingId, defaultOpen, salesByBuildId, preparingPartId, revertingSaleId, onDelete, onRevertSale, onRegisterInventoryPrebuilt }) {
    const merged = useMemo(() => {
        const out = builds.map((b) => ({
            kind: "build",
            build: b,
            t: new Date(buildFilterDateRef(b, buildBucket(b), salesByBuildId.get(b.id))).getTime()
        }));
        if (inventoryPrebuilts?.length) {
            for (const part of inventoryPrebuilts) {
                out.push({ kind: "prebuilt", part, t: new Date(part.updatedAt).getTime() });
            }
        }
        out.sort((a, b) => {
            if (sortOrder === "PROFIT_DESC") {
                const pa = a.kind === "build"
                    ? Number(salesByBuildId.get(a.build.id)?.profit ?? a.build.profit ?? 0)
                    : partLineProfit(a.part);
                const pb = b.kind === "build"
                    ? Number(salesByBuildId.get(b.build.id)?.profit ?? b.build.profit ?? 0)
                    : partLineProfit(b.part);
                if (pb !== pa)
                    return pb - pa;
            }
            if (sortOrder === "PRICE_DESC") {
                const pa = a.kind === "build" ? Number(a.build.totalSale ?? 0) : Number(a.part.salePrice);
                const pb = b.kind === "build" ? Number(b.build.totalSale ?? 0) : Number(b.part.salePrice);
                if (pb !== pa)
                    return pb - pa;
            }
            return b.t - a.t;
        });
        return out;
    }, [builds, inventoryPrebuilts, sortOrder, salesByBuildId]);
    const showStockCol = inventoryPrebuilts !== undefined;
    const count = listCount ?? builds.length;
    const badgePc = "shrink-0 rounded-md border border-violet-500/35 bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-200/95";
    const badgeMontaje = "shrink-0 rounded-md border border-cyan-500/35 bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-200/95";
    return (_jsx("section", { className: LIST_PAGE_ACCORDION_SHELL, children: _jsxs("details", { className: "group", open: defaultOpen, children: [_jsxs("summary", { className: LIST_PAGE_ACCORDION_TRIGGER, children: [_jsxs("div", { className: "flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:gap-3", children: [_jsx("p", { className: "text-lg font-semibold text-slate-100", children: title }), _jsx("span", { className: `${LIST_PAGE_COUNT_BADGE} ${tone}`, children: count })] }), _jsx("svg", { className: "h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180", fill: "none", viewBox: "0 0 24 24", strokeWidth: 2, stroke: "currentColor", "aria-hidden": true, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M19 9l-7 7-7-7" }) })] }), _jsx("div", { className: LIST_PAGE_ACCORDION_BODY, children: inventoryLoading && merged.length === 0 ? (_jsx("p", { className: "text-sm text-slate-500", children: "Cargando inventario\u2026" })) : merged.length === 0 ? (_jsx("p", { className: "text-sm text-slate-500", children: "Sin montajes en esta secci\u00F3n." })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "hidden overflow-x-auto rounded-xl border border-slate-800 md:block", children: _jsxs("table", { className: "min-w-full text-left text-sm text-slate-200", children: [_jsx("thead", { className: "bg-slate-950/70 text-xs uppercase tracking-wide text-slate-400", children: _jsxs("tr", { children: [_jsx("th", { className: TABLE_CELL, children: "Nombre" }), _jsx("th", { className: TABLE_CELL, children: "Fecha" }), _jsx("th", { className: TABLE_CELL, children: "Cliente" }), showStockCol ? _jsx("th", { className: `${TABLE_CELL} text-right`, children: "Stock" }) : null, _jsx("th", { className: `${TABLE_CELL} text-right`, children: "Venta" }), _jsx("th", { className: `${TABLE_CELL} text-right`, children: "Beneficio" }), _jsx("th", { className: `${TABLE_CELL} text-right`, children: "Acciones" })] }) }), _jsx("tbody", { className: "divide-y divide-slate-800", children: merged.map((row) => {
                                                if (row.kind === "prebuilt") {
                                                    const part = row.part;
                                                    return (_jsxs("tr", { className: "hover:bg-slate-800/30", children: [_jsx("td", { className: TABLE_CELL, children: _jsxs("div", { className: "flex min-w-0 flex-wrap items-center gap-2", children: [_jsx("span", { className: "min-w-0 truncate font-medium text-slate-100", children: part.name }), _jsx("span", { className: badgePc, children: "PC completo" })] }) }), _jsx("td", { className: `${TABLE_CELL} text-slate-400`, children: toDateLabel(part.updatedAt) }), _jsx("td", { className: `${TABLE_CELL} text-slate-300`, children: "\u2014" }), showStockCol ? (_jsx("td", { className: `${TABLE_CELL} text-right text-violet-300`, children: part.stock })) : null, _jsx("td", { className: `${TABLE_CELL} text-right text-emerald-300`, children: money(Number(part.salePrice)) }), _jsx("td", { className: `${TABLE_CELL} text-right text-cyan-300`, children: money(partLineProfit(part)) }), _jsx("td", { className: TABLE_CELL, children: _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx(Link, { to: inventoryPrebuiltDetailLink(part.id), className: SECONDARY_GHOST_SM, children: "Ver detalle" }), onRegisterInventoryPrebuilt ? (_jsx("button", { type: "button", onClick: () => onRegisterInventoryPrebuilt(part), disabled: preparingPartId === part.id, className: PRIMARY_ACTION_BUTTON_COMPACT, children: preparingPartId === part.id ? "Preparando…" : "Vender PC" })) : null] }) })] }, `pre-${part.id}`));
                                                }
                                                const build = row.build;
                                                const sale = salesByBuildId.get(build.id);
                                                const fromInv = isInventoryPrebuiltBuild(build);
                                                return (_jsxs("tr", { className: "hover:bg-slate-800/30", children: [_jsx("td", { className: TABLE_CELL, children: _jsxs("div", { className: "flex min-w-0 flex-wrap items-center gap-2", children: [_jsx("span", { className: "min-w-0 truncate font-medium text-slate-100", children: build.name }), _jsx("span", { className: fromInv ? badgePc : badgeMontaje, children: fromInv ? "PC completo" : "Montaje propio" })] }) }), _jsx("td", { className: `${TABLE_CELL} text-slate-400`, children: toDateLabel(buildFilterDateRef(build, buildBucket(build), sale)) }), _jsx("td", { className: `${TABLE_CELL} text-slate-300`, children: sale?.customerName ?? build.customerName ?? "—" }), showStockCol ? (_jsx("td", { className: `${TABLE_CELL} text-right text-slate-500`, children: "\u2014" })) : null, _jsx("td", { className: `${TABLE_CELL} text-right text-emerald-300`, children: money(Number(sale?.finalSalePrice ?? build.totalSale ?? 0)) }), _jsx("td", { className: `${TABLE_CELL} text-right text-cyan-300`, children: money(Number(sale?.profit ?? build.profit ?? 0)) }), _jsx("td", { className: TABLE_CELL, children: _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx(Link, { to: `/builds/${build.id}`, className: SECONDARY_GHOST_SM, children: "Ver detalle" }), canLinkRegisterSale(build, sale) ? (_jsx(Link, { to: `/builds/${build.id}#registrar-venta`, className: PRIMARY_ACTION_BUTTON_COMPACT, children: "Vender PC" })) : null, sale && canRevertSale(build, sale) && onRevertSale ? (_jsx("button", { type: "button", onClick: () => onRevertSale(build, sale), disabled: revertingSaleId === sale.id, className: SECONDARY_BUTTON_SM, children: revertingSaleId === sale.id ? "Revirtiendo..." : "Revertir venta" })) : null, _jsx("button", { type: "button", onClick: () => onDelete(build), disabled: deletingId === build.id ||
                                                                            build.status === "SOLD" ||
                                                                            build.status === "PENDING_PICKUP", className: DESTRUCTIVE_BUTTON_SM, children: "Eliminar" })] }) })] }, build.id));
                                            }) })] }) }), _jsx("div", { className: "space-y-2 md:hidden", children: merged.map((row) => {
                                    if (row.kind === "prebuilt") {
                                        const part = row.part;
                                        return (_jsxs("article", { className: "rounded-xl border border-slate-800 bg-slate-950/40 p-3.5", children: [_jsx("div", { className: "flex flex-wrap items-start justify-between gap-2", children: _jsxs("div", { className: "min-w-0", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsx("p", { className: "font-semibold text-slate-100", children: part.name }), _jsx("span", { className: badgePc, children: "PC completo" })] }), _jsxs("p", { className: "mt-1 text-sm text-violet-300", children: ["Stock ", part.stock] })] }) }), _jsx("p", { className: "mt-2 text-xs text-slate-500", children: toDateLabel(part.updatedAt) }), _jsx("p", { className: "mt-2 text-base font-semibold text-emerald-300", children: money(Number(part.salePrice)) }), _jsxs("p", { className: "mt-1 text-sm text-cyan-300", children: ["Beneficio ", money(partLineProfit(part))] }), _jsxs("div", { className: "mt-2 flex flex-wrap gap-2", children: [_jsx(Link, { to: inventoryPrebuiltDetailLink(part.id), className: SECONDARY_GHOST_SM, children: "Ver detalle" }), onRegisterInventoryPrebuilt ? (_jsx("button", { type: "button", onClick: () => onRegisterInventoryPrebuilt(part), disabled: preparingPartId === part.id, className: PRIMARY_ACTION_BUTTON_COMPACT, children: preparingPartId === part.id ? "Preparando…" : "Vender PC" })) : null] })] }, `pre-m-${part.id}`));
                                    }
                                    const build = row.build;
                                    const sale = salesByBuildId.get(build.id);
                                    const fromInv = isInventoryPrebuiltBuild(build);
                                    return (_jsxs("article", { className: "rounded-xl border border-slate-800 bg-slate-950/40 p-3.5", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsx("p", { className: "font-semibold text-slate-100", children: build.name }), _jsx("span", { className: fromInv ? badgePc : badgeMontaje, children: fromInv ? "PC completo" : "Montaje propio" })] }), _jsx("p", { className: "mt-1 text-sm text-slate-400", children: sale?.customerName ?? build.customerName ?? "—" }), _jsx("p", { className: "mt-3 text-base font-semibold text-emerald-300", children: money(Number(sale?.finalSalePrice ?? build.totalSale ?? 0)) }), _jsxs("p", { className: "mt-1 text-sm text-cyan-300", children: ["Beneficio ", money(Number(sale?.profit ?? build.profit ?? 0))] }), _jsxs("div", { className: "mt-2 flex flex-wrap gap-2", children: [_jsx(Link, { to: `/builds/${build.id}`, className: SECONDARY_GHOST_SM, children: "Ver detalle" }), canLinkRegisterSale(build, sale) ? (_jsx(Link, { to: `/builds/${build.id}#registrar-venta`, className: PRIMARY_ACTION_BUTTON_COMPACT, children: "Vender PC" })) : null, sale && canRevertSale(build, sale) && onRevertSale ? (_jsx("button", { type: "button", onClick: () => onRevertSale(build, sale), disabled: revertingSaleId === sale.id, className: SECONDARY_BUTTON_SM, children: revertingSaleId === sale.id ? "Revirtiendo..." : "Revertir venta" })) : null, _jsx("button", { type: "button", onClick: () => onDelete(build), disabled: deletingId === build.id ||
                                                            build.status === "SOLD" ||
                                                            build.status === "PENDING_PICKUP", className: DESTRUCTIVE_BUTTON_SM, children: "Eliminar" })] })] }, build.id));
                                }) })] })) })] }) }));
}
