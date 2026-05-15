import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import * as buildsApi from "../api/builds";
import { AddStockFromCatalogSection } from "../components/inventory/AddStockFromCatalogSection";
import { NewCatalogPartForm } from "../components/inventory/NewCatalogPartForm";
import { PartForm } from "../components/inventory/PartForm";
import { PartsTable } from "../components/inventory/PartsTable";
import { PrebuiltInventoryTable } from "../components/inventory/PrebuiltInventoryTable";
import { ExtraTemplatesPage } from "./ExtraTemplatesPage";
import { useParts } from "../hooks/useParts";
import { OS_PART_CONDITION, PART_CATEGORIES, PART_CONDITIONS, isNonStockCategory, isPrebuiltPc, partCategoryLabel } from "../types/part";
import { calculateSalePrice } from "../utils/pricing";
import { SECONDARY_BUTTON_SM } from "../theme/actionButtons";
import { SUMMARY_CARD_GRID, SUMMARY_CARD_LABEL, SUMMARY_CARD_SHELL, SUMMARY_VALUE_NEGATIVE, SUMMARY_VALUE_NEUTRAL, SUMMARY_VALUE_PROFIT_POS, SUMMARY_VALUE_REVENUE } from "../theme/summaryCards";
import { PAGE_HERO, PAGE_OUTER_6XL } from "../theme/layoutDensity";
import { StatusBadge } from "../components/ui/StatusBadge";
function finiteNonNegative(n, fallback) {
    if (!Number.isFinite(n) || n < 0)
        return fallback;
    return n;
}
function toPayload(values) {
    if (values.inventoryKind === "PREBUILT_PC") {
        const refSale = calculateSalePrice(values.costPrice || 0, values.condition);
        const salePrice = finiteNonNegative(Number(values.salePrice), refSale);
        return {
            inventoryKind: "PREBUILT_PC",
            name: values.name.trim(),
            condition: values.condition,
            costPrice: finiteNonNegative(Number(values.costPrice), 0),
            salePrice,
            stock: Math.max(0, Math.floor(finiteNonNegative(Number(values.stock), 0))),
            notes: values.notes.trim() ? values.notes.trim() : null,
            description: values.description.trim()
        };
    }
    const conditionForPricing = isNonStockCategory(values.category)
        ? OS_PART_CONDITION
        : values.condition;
    const computedSale = calculateSalePrice(values.costPrice || 0, conditionForPricing);
    const rawSale = values.manualSalePrice ? values.salePrice : computedSale;
    const salePrice = finiteNonNegative(Number(rawSale), computedSale);
    const costPrice = finiteNonNegative(Number(values.costPrice), 0);
    const stockRaw = isNonStockCategory(values.category) ? 0 : values.stock;
    const stock = Math.max(0, Math.floor(finiteNonNegative(Number(stockRaw), 0)));
    return {
        inventoryKind: "PART",
        name: values.name.trim(),
        category: values.category,
        condition: isNonStockCategory(values.category) ? OS_PART_CONDITION : values.condition,
        costPrice,
        salePrice,
        stock,
        notes: values.notes.trim() ? values.notes.trim() : null,
        description: values.description.trim() ? values.description.trim() : undefined
    };
}
function inventoryTotals(parts) {
    let totalCostValue = 0;
    let totalSaleValue = 0;
    let units = 0;
    for (const p of parts) {
        const c = Number(p.costPrice);
        const s = Number(p.salePrice);
        const q = p.stock;
        if (Number.isFinite(c) && Number.isFinite(s) && Number.isFinite(q)) {
            totalCostValue += c * q;
            totalSaleValue += s * q;
            units += q;
        }
    }
    return {
        totalCostValue,
        totalSaleValue,
        potentialProfit: totalSaleValue - totalCostValue,
        units
    };
}
function coerceMoney(v) {
    if (v == null)
        return 0;
    if (typeof v === "number")
        return Number.isFinite(v) ? v : 0;
    const n = parseFloat(String(v));
    return Number.isFinite(n) ? n : 0;
}
/** Montajes confirmados = PC terminado en almacén (coste/venta del montaje, sin duplicar piezas ya descontadas del stock). */
function inventorySummaryWithBuilds(parts, builds) {
    const shelf = inventoryTotals(parts);
    const confirmedBuilds = builds.filter((b) => b.status === "CONFIRMED");
    let buildCostValue = 0;
    let buildSaleValue = 0;
    for (const b of confirmedBuilds) {
        buildCostValue += coerceMoney(b.totalCost);
        buildSaleValue += coerceMoney(b.totalSale ?? b.computedSaleTotal);
    }
    const totalCostValue = shelf.totalCostValue + buildCostValue;
    const totalSaleValue = shelf.totalSaleValue + buildSaleValue;
    return {
        shelf,
        confirmedBuildCount: confirmedBuilds.length,
        buildCostValue,
        buildSaleValue,
        totalCostValue,
        totalSaleValue,
        potentialProfit: totalSaleValue - totalCostValue,
        units: shelf.units + confirmedBuilds.length
    };
}
/** Alerta cuando la suma de unidades en una categoría es menor que este valor (p. ej. menos de 3 CPUs en total). */
const LOW_STOCK_CATEGORY_THRESHOLD = 3;
function listedInInventory(part) {
    if (part.inventoryKind === "PREBUILT_PC")
        return part.stock > 0;
    if (!part.category)
        return part.stock > 0;
    return part.stock > 0 || isNonStockCategory(part.category);
}
function money(value) {
    return `${value.toFixed(2)} EUR`;
}
function formatShortDate(iso) {
    try {
        return new Date(iso).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" });
    }
    catch {
        return "";
    }
}
const TAB_QUERY = "tab";
const NUEVA_QUERY = "nueva";
function parseInventoryTab(value) {
    if (!value)
        return null;
    const allowed = ["summary", "stock", "catalog", "components", "prebuilt"];
    return allowed.includes(value) ? value : null;
}
const INVENTORY_TABS = [
    { id: "summary", label: "Resumen" },
    { id: "catalog", label: "Nueva pieza" },
    { id: "stock", label: "Añadir unidades" },
    { id: "components", label: "Componentes" },
    { id: "prebuilt", label: "PCs completos" }
];
/** Paginación cards móvil (< md): más piezas por página. ≥ md: valor anterior para la porción paginada (tabla desktop no la usa). */
const INVENTORY_MOBILE_PAGE_SIZE = 12;
const INVENTORY_WIDE_PAGE_SIZE = 8;
export function InventoryPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { parts, loading, error, submitting, deletingId, createPart, createStockFromCatalog, updatePart, deletePart, reload } = useParts();
    const [builds, setBuilds] = useState([]);
    const [partIdsInBuiltPcs, setPartIdsInBuiltPcs] = useState(new Set());
    const [selectedPart, setSelectedPart] = useState(null);
    const [activeTab, setActiveTab] = useState("summary");
    const [query, setQuery] = useState("");
    const [kindFilter, setKindFilter] = useState("ALL");
    const [categoryFilter, setCategoryFilter] = useState("ALL");
    const [conditionFilter, setConditionFilter] = useState("ALL");
    const [stockFilter, setStockFilter] = useState("ALL");
    const [currentPage, setCurrentPage] = useState(1);
    const [isNarrowViewport, setIsNarrowViewport] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches);
    useEffect(() => {
        const mq = window.matchMedia("(max-width: 767px)");
        const apply = () => setIsNarrowViewport(mq.matches);
        apply();
        mq.addEventListener("change", apply);
        return () => mq.removeEventListener("change", apply);
    }, []);
    const pageSize = isNarrowViewport ? INVENTORY_MOBILE_PAGE_SIZE : INVENTORY_WIDE_PAGE_SIZE;
    /** Pestaña Componentes: panel de filtros plegado por defecto en móvil/escritorio. */
    const [componentsFiltersOpen, setComponentsFiltersOpen] = useState(false);
    /** Pestaña PCs completos: filtros plegables en móvil, plegados por defecto. */
    const [prebuiltFiltersOpen, setPrebuiltFiltersOpen] = useState(false);
    /** Refresca listas de catálogo en «Añadir unidades» al crear plantillas. */
    const [catalogRefreshSignal, setCatalogRefreshSignal] = useState(0);
    /** Tras crear una plantilla de catálogo: abrir «Añadir unidades» con esa pieza seleccionada. */
    const [pendingCatalogPick, setPendingCatalogPick] = useState(null);
    /** Acordeón «Nuevo PC completo» en pestaña Nueva pieza (plegado por defecto). */
    const [catalogPrebuiltAccordionOpen, setCatalogPrebuiltAccordionOpen] = useState(false);
    const goToTab = useCallback((id, options) => {
        setActiveTab(id);
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            const prevTab = prev.get(TAB_QUERY);
            if (id === "summary") {
                next.delete(TAB_QUERY);
                next.delete(NUEVA_QUERY);
            }
            else {
                next.set(TAB_QUERY, id);
                if (id !== "catalog") {
                    next.delete(NUEVA_QUERY);
                }
                else {
                    if (options?.nueva === "extra")
                        next.set(NUEVA_QUERY, "extra");
                    else if (options?.nueva === "parte")
                        next.set(NUEVA_QUERY, "parte");
                    else if (options?.nueva === null)
                        next.delete(NUEVA_QUERY);
                    else if (prevTab !== "catalog")
                        next.set(NUEVA_QUERY, "parte");
                }
            }
            return next;
        }, { replace: true });
    }, [setSearchParams]);
    const tabFromUrl = useMemo(() => {
        const raw = searchParams.get(TAB_QUERY);
        if (raw === "extraTemplates")
            return "catalog";
        return parseInventoryTab(raw);
    }, [searchParams]);
    const catalogNuevaMode = useMemo(() => {
        return searchParams.get(NUEVA_QUERY) === "extra" ? "extra" : "parte";
    }, [searchParams]);
    useEffect(() => {
        if (searchParams.get(TAB_QUERY) !== "extraTemplates")
            return;
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            next.set(TAB_QUERY, "catalog");
            next.set(NUEVA_QUERY, "extra");
            return next;
        }, { replace: true });
    }, [searchParams, setSearchParams]);
    useEffect(() => {
        if (tabFromUrl)
            setActiveTab(tabFromUrl);
    }, [tabFromUrl]);
    useEffect(() => {
        if (selectedPart) {
            goToTab("catalog", { nueva: "parte" });
        }
    }, [selectedPart, goToTab]);
    const consumePendingCatalogPick = useCallback(() => {
        setPendingCatalogPick(null);
    }, []);
    const handleCatalogPartCreated = useCallback((created, meta) => {
        setCatalogRefreshSignal((n) => n + 1);
        setPendingCatalogPick({ catalog: created, condition: meta.condition });
        goToTab("stock");
    }, [goToTab]);
    const highlightPartId = searchParams.get("highlightPart");
    useEffect(() => {
        if (!highlightPartId)
            return;
        if (parts.length === 0)
            return;
        const part = parts.find((p) => p.id === highlightPartId);
        const clearParam = () => setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            next.delete("highlightPart");
            return next;
        }, { replace: true });
        if (!part) {
            clearParam();
            return;
        }
        goToTab(isPrebuiltPc(part) ? "prebuilt" : "components");
        setSelectedPart(part);
        clearParam();
    }, [highlightPartId, parts, setSearchParams, goToTab]);
    const refreshBuilds = useCallback(async () => {
        try {
            const rows = await buildsApi.listBuilds();
            setBuilds(rows);
            const ids = new Set();
            for (const build of rows) {
                if (build.status === "DRAFT")
                    continue;
                for (const item of build.items ?? []) {
                    if (item.part?.inventoryKind === "PART") {
                        ids.add(item.partId);
                    }
                }
            }
            setPartIdsInBuiltPcs(ids);
        }
        catch {
            setBuilds([]);
            setPartIdsInBuiltPcs(new Set());
        }
    }, []);
    useEffect(() => {
        void refreshBuilds();
    }, [refreshBuilds]);
    const handleSubmit = async (values) => {
        const payload = toPayload(values);
        if (selectedPart) {
            await updatePart(selectedPart.id, payload);
            setSelectedPart(null);
            return;
        }
        await createPart(payload);
    };
    const handleDelete = async (part) => {
        const confirmed = window.confirm(`Eliminar "${part.name}" del inventario?`);
        if (!confirmed) {
            return;
        }
        await deletePart(part.id);
        if (selectedPart?.id === part.id) {
            setSelectedPart(null);
        }
    };
    const totals = useMemo(() => inventorySummaryWithBuilds(parts, builds), [parts, builds]);
    const partsListed = useMemo(() => {
        return parts.filter((part) => {
            if (!listedInInventory(part))
                return false;
            if (part.inventoryKind === "PART" && partIdsInBuiltPcs.has(part.id))
                return false;
            return true;
        });
    }, [parts, partIdsInBuiltPcs]);
    const filteredParts = useMemo(() => {
        return partsListed.filter((part) => {
            const matchesQuery = part.name.toLowerCase().includes(query.trim().toLowerCase());
            const matchesKind = kindFilter === "ALL" || part.inventoryKind === kindFilter;
            const matchesCategory = categoryFilter === "ALL" ||
                (part.category !== null && part.category === categoryFilter);
            const matchesCondition = conditionFilter === "ALL" || part.condition === conditionFilter;
            let matchesStock = true;
            if (stockFilter === "IN_STOCK") {
                matchesStock =
                    part.stock > 0 ||
                        (part.inventoryKind === "PART" && part.category !== null && isNonStockCategory(part.category));
            }
            else if (stockFilter === "OUT_OF_STOCK") {
                matchesStock =
                    part.stock === 0 &&
                        !(part.inventoryKind === "PART" && part.category !== null && isNonStockCategory(part.category));
            }
            return matchesQuery && matchesKind && matchesCategory && matchesCondition && matchesStock;
        });
    }, [partsListed, query, kindFilter, categoryFilter, conditionFilter, stockFilter]);
    const partPieces = useMemo(() => filteredParts.filter((p) => p.inventoryKind === "PART"), [filteredParts]);
    const partPrebuilt = useMemo(() => filteredParts.filter((p) => p.inventoryKind === "PREBUILT_PC"), [filteredParts]);
    const categoryOrder = useMemo(() => new Map(PART_CATEGORIES.map((category, index) => [category, index])), []);
    const sortedPieceParts = useMemo(() => {
        return [...partPieces].sort((a, b) => {
            const ca = a.category ?? "OTHER";
            const cb = b.category ?? "OTHER";
            const orderA = categoryOrder.get(ca) ?? 999;
            const orderB = categoryOrder.get(cb) ?? 999;
            if (orderA !== orderB)
                return orderA - orderB;
            return a.name.localeCompare(b.name, "es", { sensitivity: "base" });
        });
    }, [partPieces, categoryOrder]);
    const totalPages = Math.max(1, Math.ceil(sortedPieceParts.length / pageSize));
    useEffect(() => {
        setCurrentPage(1);
    }, [query, kindFilter, categoryFilter, conditionFilter, stockFilter]);
    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);
    const paginatedPieces = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return sortedPieceParts.slice(start, start + pageSize);
    }, [sortedPieceParts, currentPage, pageSize]);
    const hasActiveFilters = query.trim().length > 0 ||
        kindFilter !== "ALL" ||
        categoryFilter !== "ALL" ||
        conditionFilter !== "ALL" ||
        stockFilter !== "ALL";
    /** Suma de stock físico por categoría (solo piezas PART; OS/LABOR excluidas). */
    const categoryStockTotals = useMemo(() => {
        const map = new Map();
        for (const p of partsListed) {
            if (p.inventoryKind !== "PART")
                continue;
            const cat = (p.category ?? "OTHER");
            if (isNonStockCategory(cat))
                continue;
            map.set(cat, (map.get(cat) ?? 0) + p.stock);
        }
        return map;
    }, [partsListed]);
    const lowStockCategories = useMemo(() => {
        const rows = [];
        for (const [category, total] of categoryStockTotals) {
            if (total < LOW_STOCK_CATEGORY_THRESHOLD) {
                rows.push({ category, total });
            }
        }
        rows.sort((a, b) => {
            if (a.total !== b.total)
                return a.total - b.total;
            return partCategoryLabel(a.category).localeCompare(partCategoryLabel(b.category), "es", {
                sensitivity: "base"
            });
        });
        return rows;
    }, [categoryStockTotals]);
    const prebuiltStockTotal = useMemo(() => {
        return partsListed
            .filter((p) => p.inventoryKind === "PREBUILT_PC")
            .reduce((sum, p) => sum + p.stock, 0);
    }, [partsListed]);
    const hasPrebuiltLines = useMemo(() => partsListed.some((p) => p.inventoryKind === "PREBUILT_PC"), [partsListed]);
    const prebuiltStockLow = hasPrebuiltLines && prebuiltStockTotal < LOW_STOCK_CATEGORY_THRESHOLD;
    const recentParts = useMemo(() => {
        return [...partsListed]
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            .slice(0, 8);
    }, [partsListed]);
    const clearFilters = () => {
        setQuery("");
        setKindFilter("ALL");
        setCategoryFilter("ALL");
        setConditionFilter("ALL");
        setStockFilter("ALL");
    };
    const tabButtonClass = (id) => [
        "shrink-0 snap-start whitespace-nowrap rounded-t-lg border border-b-0 px-3 py-2 text-sm font-semibold transition md:px-4",
        activeTab === id
            ? "border-slate-700 bg-slate-900 text-slate-100 shadow-sm"
            : "border-transparent bg-slate-950/50 text-slate-400 hover:bg-slate-900/60 hover:text-slate-200"
    ].join(" ");
    return (_jsxs("div", { className: PAGE_OUTER_6XL, children: [_jsx("section", { className: PAGE_HERO, children: _jsx("h1", { className: "text-3xl font-bold tracking-tight", children: "Inventario" }) }), error ? (_jsxs("div", { className: "flex flex-col gap-3 rounded-xl border border-rose-800/70 bg-rose-950/40 px-4 py-3 text-sm text-rose-200 md:flex-row md:items-center md:justify-between", children: [_jsx("span", { children: error }), _jsx("button", { type: "button", onClick: () => {
                            void reload();
                            void refreshBuilds();
                        }, className: "rounded-lg border border-rose-700 bg-rose-900/50 px-3 py-1.5 font-semibold text-rose-100 transition hover:bg-rose-800/70", children: "Reintentar" })] })) : null, _jsx("div", { className: "rounded-2xl border border-slate-800 bg-slate-950/40 p-1.5 shadow-inner shadow-black/30 md:p-2", children: _jsx("div", { className: "-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0 md:pb-0", role: "tablist", "aria-label": "Secciones de inventario", children: INVENTORY_TABS.map((tab) => (_jsx("button", { type: "button", role: "tab", id: `inventory-tab-${tab.id}`, "aria-selected": activeTab === tab.id, "aria-controls": `inventory-panel-${tab.id}`, tabIndex: activeTab === tab.id ? 0 : -1, className: tabButtonClass(tab.id), onClick: () => goToTab(tab.id), children: tab.label }, tab.id))) }) }), _jsxs("section", { id: "inventory-panel-summary", role: "tabpanel", "aria-labelledby": "inventory-tab-summary", hidden: activeTab !== "summary", className: activeTab === "summary" ? "space-y-4" : "hidden", children: [_jsxs("div", { className: SUMMARY_CARD_GRID, children: [_jsxs("article", { className: SUMMARY_CARD_SHELL, children: [_jsx("p", { className: SUMMARY_CARD_LABEL, children: "Coste total" }), _jsx("p", { className: SUMMARY_VALUE_NEUTRAL, children: money(totals.totalCostValue) })] }), _jsxs("article", { className: SUMMARY_CARD_SHELL, children: [_jsx("p", { className: SUMMARY_CARD_LABEL, children: "Venta estimada" }), _jsx("p", { className: SUMMARY_VALUE_REVENUE, children: money(totals.totalSaleValue) })] }), _jsxs("article", { className: SUMMARY_CARD_SHELL, children: [_jsx("p", { className: SUMMARY_CARD_LABEL, children: "Beneficio" }), _jsx("p", { className: totals.potentialProfit >= 0 ? SUMMARY_VALUE_PROFIT_POS : SUMMARY_VALUE_NEGATIVE, children: money(totals.potentialProfit) })] }), _jsxs("article", { className: SUMMARY_CARD_SHELL, children: [_jsx("p", { className: SUMMARY_CARD_LABEL, children: "Unidades" }), _jsx("p", { className: SUMMARY_VALUE_NEUTRAL, children: totals.units })] })] }), _jsxs("div", { className: "grid grid-cols-1 gap-3 lg:grid-cols-2", children: [_jsxs("article", { className: "rounded-xl border border-amber-500/25 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/40 md:p-5", children: [_jsx("div", { className: "flex flex-wrap items-baseline justify-between gap-2", children: _jsx("h2", { className: "text-base font-semibold text-slate-100", children: "Stock bajo" }) }), lowStockCategories.length === 0 && !prebuiltStockLow ? (_jsx("p", { className: "mt-3 text-sm text-slate-400", children: "Sin avisos." })) : (_jsx(_Fragment, { children: _jsxs("ul", { className: "mt-3 max-h-52 space-y-2 overflow-y-auto text-sm", children: [lowStockCategories.map(({ category, total }) => (_jsxs("li", { className: "flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800/80 bg-slate-950/40 px-3 py-2", children: [_jsx("span", { className: "min-w-0 font-medium text-slate-200", children: partCategoryLabel(category) }), _jsxs("span", { className: "shrink-0 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-200", children: [total, " u. en categor\u00EDa"] })] }, category))), prebuiltStockLow ? (_jsxs("li", { className: "flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800/80 bg-slate-950/40 px-3 py-2", children: [_jsx("span", { className: "min-w-0 font-medium text-slate-200", children: "PCs completos (premontados)" }), _jsxs("span", { className: "shrink-0 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-200", children: [prebuiltStockTotal, " u. en total"] })] })) : null] }) }))] }), _jsxs("article", { className: "rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/40 md:p-5", children: [_jsx("h2", { className: "text-base font-semibold text-slate-100", children: "\u00DAltimas actualizaciones" }), recentParts.length === 0 ? (_jsx("p", { className: "mt-3 text-sm text-slate-400", children: "Sin datos todavia." })) : (_jsx("ul", { className: "mt-3 max-h-52 space-y-2 overflow-y-auto text-sm", children: recentParts.map((p) => (_jsx("li", { children: _jsxs("button", { type: "button", onClick: () => setSelectedPart(p), className: "flex w-full flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800/80 bg-slate-950/40 px-3 py-2 text-left transition hover:border-indigo-500/35 hover:bg-slate-900/80", children: [_jsx("span", { className: "min-w-0 flex-1 font-medium text-slate-200", children: p.name }), _jsxs("span", { className: "flex shrink-0 flex-wrap items-center gap-2", children: [_jsx(StatusBadge, { variant: isPrebuiltPc(p) ? "prebuilt" : "neutral", size: "table", className: "uppercase tracking-wide", children: isPrebuiltPc(p) ? "PC" : "Pieza" }), _jsx("span", { className: "text-xs text-slate-500", children: formatShortDate(p.updatedAt) })] })] }) }, p.id))) }))] })] })] }), _jsxs("section", { id: "inventory-panel-catalog", role: "tabpanel", "aria-labelledby": "inventory-tab-catalog", hidden: activeTab !== "catalog", className: activeTab === "catalog" ? "space-y-4" : "hidden", children: [!selectedPart ? (_jsxs("div", { className: "flex w-full max-w-lg rounded-lg border border-slate-800 bg-slate-950/50 p-1", role: "group", "aria-label": "Tipo de alta en cat\u00E1logo", children: [_jsx("button", { type: "button", "aria-pressed": catalogNuevaMode === "parte", onClick: () => goToTab("catalog", { nueva: "parte" }), className: [
                                    "flex-1 rounded-md px-3 py-2 text-sm font-semibold transition",
                                    catalogNuevaMode === "parte"
                                        ? "bg-slate-800 text-slate-100 shadow-sm"
                                        : "text-slate-400 hover:bg-slate-900/60 hover:text-slate-200"
                                ].join(" "), children: "Pieza f\u00EDsica" }), _jsx("button", { type: "button", "aria-pressed": catalogNuevaMode === "extra", onClick: () => goToTab("catalog", { nueva: "extra" }), className: [
                                    "flex-1 rounded-md px-3 py-2 text-sm font-semibold transition",
                                    catalogNuevaMode === "extra"
                                        ? "bg-slate-800 text-slate-100 shadow-sm"
                                        : "text-slate-400 hover:bg-slate-900/60 hover:text-slate-200"
                                ].join(" "), children: "Servicio/extra sin stock" })] })) : null, catalogNuevaMode === "extra" && !selectedPart ? (_jsx(ExtraTemplatesPage, { embedded: true, onTemplatesChanged: () => setCatalogRefreshSignal((n) => n + 1) })) : (_jsxs(_Fragment, { children: [!selectedPart && catalogNuevaMode === "parte" ? (_jsxs("p", { className: "text-sm leading-relaxed text-slate-400", children: ["Crea una pieza reutilizable una sola vez. Luego podr\u00E1s a\u00F1adir unidades r\u00E1pidamente desde", " ", _jsx("span", { className: "font-medium text-slate-300", children: "A\u00F1adir unidades" }), "."] })) : null, _jsx(NewCatalogPartForm, { onSuccess: handleCatalogPartCreated }), selectedPart ? (_jsxs("div", { className: "rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/40 md:p-5", children: [_jsxs("p", { className: "text-sm text-slate-400", children: ["Edici\u00F3n de una l\u00EDnea de inventario existente (stock f\u00EDsico). Las piezas sueltas nuevas deben crearse como plantilla arriba y luego darse de alta en", " ", _jsx("span", { className: "font-medium text-slate-300", children: "A\u00F1adir unidades" }), "."] }), _jsx("div", { className: "mt-3", children: _jsx(PartForm, { selectedPart: selectedPart, submitting: submitting, onSubmit: handleSubmit, onCancelEdit: () => setSelectedPart(null), className: "border-0 bg-transparent p-0 shadow-none" }) })] })) : (_jsxs("section", { className: "overflow-hidden rounded-xl border border-slate-800 bg-slate-900/80 shadow-lg shadow-slate-950/40 backdrop-blur", children: [_jsxs("button", { type: "button", className: "flex w-full items-center justify-between gap-3 border-b border-slate-800 bg-slate-950/20 px-3.5 py-3 text-left transition hover:bg-slate-900/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400/50 md:px-4", onClick: () => setCatalogPrebuiltAccordionOpen((open) => !open), "aria-expanded": catalogPrebuiltAccordionOpen, "aria-controls": "catalog-prebuilt-pc-panel", children: [_jsxs("span", { className: "min-w-0 flex-1", children: [_jsx("span", { className: "block text-base font-semibold text-slate-100", children: "Nuevo PC completo en inventario" }), _jsx("span", { className: "mt-0.5 block text-xs font-normal text-slate-500", children: "Alta directa en stock \u00B7 sin plantilla de cat\u00E1logo" })] }), _jsx("svg", { className: `h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 ${catalogPrebuiltAccordionOpen ? "rotate-180" : ""}`, fill: "none", viewBox: "0 0 24 24", strokeWidth: 2, stroke: "currentColor", "aria-hidden": true, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M19 9l-7 7-7-7" }) })] }), _jsxs("div", { id: "catalog-prebuilt-pc-panel", hidden: !catalogPrebuiltAccordionOpen, className: "border-t border-slate-800 px-3.5 pb-4 pt-3 md:px-4 md:pb-5 md:pt-4", children: [_jsx("p", { className: "text-sm text-slate-400", children: "Los PCs completos no usan plantillas del cat\u00E1logo de piezas; se dan de alta directamente en inventario." }), _jsx("div", { className: "mt-3", children: _jsx(PartForm, { selectedPart: null, submitting: submitting, onSubmit: handleSubmit, onCancelEdit: () => setSelectedPart(null), createInventoryKindDefault: "PREBUILT_PC", className: "border-0 bg-transparent p-0 shadow-none" }) })] })] }))] }))] }), _jsx("section", { id: "inventory-panel-stock", role: "tabpanel", "aria-labelledby": "inventory-tab-stock", hidden: activeTab !== "stock", className: activeTab === "stock" ? "space-y-3" : "hidden", children: _jsx(AddStockFromCatalogSection, { submitting: submitting, onRegisterStock: createStockFromCatalog, catalogRefreshSignal: catalogRefreshSignal, pendingCatalogPick: pendingCatalogPick, onPendingCatalogPickConsumed: consumePendingCatalogPick, onRequestCreateNewPart: () => goToTab("catalog", { nueva: "parte" }) }) }), _jsxs("section", { id: "inventory-panel-components", role: "tabpanel", "aria-labelledby": "inventory-tab-components", hidden: activeTab !== "components", className: activeTab === "components" ? "space-y-3" : "hidden", children: [_jsxs("section", { className: "overflow-hidden rounded-xl border border-slate-800 bg-slate-900/80 shadow-lg shadow-slate-950/40 backdrop-blur", children: [_jsxs("button", { type: "button", className: "flex w-full items-center justify-between gap-3 border-b border-slate-800 bg-slate-950/20 px-3.5 py-3 text-left transition hover:bg-slate-900/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400/50 md:px-4", onClick: () => setComponentsFiltersOpen((open) => !open), "aria-expanded": componentsFiltersOpen, "aria-controls": "inventory-components-filters-panel", children: [_jsxs("span", { className: "min-w-0 flex-1", children: [_jsx("span", { className: "block text-base font-semibold text-slate-100", children: "Filtros de b\u00FAsqueda" }), _jsxs("span", { className: "mt-0.5 block text-xs font-normal text-slate-500", children: [sortedPieceParts.length, " piezas", hasActiveFilters ? " · hay filtros activos" : ""] })] }), _jsx("svg", { className: `h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 ${componentsFiltersOpen ? "rotate-180" : ""}`, fill: "none", viewBox: "0 0 24 24", strokeWidth: 2, stroke: "currentColor", "aria-hidden": true, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M19 9l-7 7-7-7" }) })] }), componentsFiltersOpen ? (_jsxs("div", { id: "inventory-components-filters-panel", children: [_jsx("div", { className: "px-3.5 pb-3 pt-1 md:px-4 md:pb-4 md:pt-2", children: _jsxs("div", { className: "grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-6 lg:gap-2.5", children: [_jsxs("label", { className: "flex min-w-0 flex-col gap-1.5 text-sm font-medium text-slate-200 lg:col-span-2", children: ["Buscar por nombre", _jsx("input", { value: query, onChange: (event) => setQuery(event.target.value), placeholder: "Ej: RTX, Ryzen, SSD...", className: "min-h-[42px] w-full min-w-0 rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-base text-slate-100 outline-none ring-indigo-400/60 placeholder:text-slate-500 focus:border-indigo-400 focus:ring sm:text-sm" })] }), _jsxs("label", { className: "flex min-w-0 flex-col gap-1.5 text-sm font-medium text-slate-200", children: ["Tipo", _jsxs("select", { value: kindFilter, onChange: (event) => setKindFilter(event.target.value), className: "min-h-[42px] w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-base text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring sm:text-sm", children: [_jsx("option", { value: "ALL", children: "Todos" }), _jsx("option", { value: "PART", children: "Piezas" }), _jsx("option", { value: "PREBUILT_PC", children: "PCs completos" })] })] }), _jsxs("label", { className: "flex min-w-0 flex-col gap-1.5 text-sm font-medium text-slate-200", children: ["Categoria", _jsxs("select", { value: categoryFilter, onChange: (event) => setCategoryFilter(event.target.value), className: "min-h-[42px] w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-base text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring sm:text-sm", children: [_jsx("option", { value: "ALL", children: "Todas" }), PART_CATEGORIES.map((category) => (_jsx("option", { value: category, children: partCategoryLabel(category) }, category)))] })] }), _jsxs("label", { className: "flex min-w-0 flex-col gap-1.5 text-sm font-medium text-slate-200", children: ["Estado", _jsxs("select", { value: conditionFilter, onChange: (event) => setConditionFilter(event.target.value), className: "min-h-[42px] w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-base text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring sm:text-sm", children: [_jsx("option", { value: "ALL", children: "Todos" }), PART_CONDITIONS.map((condition) => (_jsx("option", { value: condition, children: condition }, condition)))] })] }), _jsxs("label", { className: "flex min-w-0 flex-col gap-1.5 text-sm font-medium text-slate-200", children: ["Stock", _jsxs("select", { value: stockFilter, onChange: (event) => setStockFilter(event.target.value), className: "min-h-[42px] w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-base text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring sm:text-sm", children: [_jsx("option", { value: "ALL", children: "Todos" }), _jsx("option", { value: "IN_STOCK", children: "Con stock" }), _jsx("option", { value: "OUT_OF_STOCK", children: "Sin stock" })] })] })] }) }), _jsxs("div", { className: "flex flex-col gap-2.5 border-t border-slate-800 px-3.5 py-2.5 md:flex-row md:items-center md:justify-between md:px-4", children: [_jsxs("p", { className: "text-sm font-medium text-slate-200", children: [sortedPieceParts.length, " piezas"] }), _jsx("button", { type: "button", onClick: clearFilters, disabled: !hasActiveFilters, className: `${SECONDARY_BUTTON_SM} min-h-[40px] disabled:cursor-not-allowed`, children: "Limpiar filtros" })] })] })) : null] }), _jsx("div", { className: "space-y-3", children: _jsx(PartsTable, { parts: sortedPieceParts, partsMobilePage: paginatedPieces, compact: true, loading: loading, deletingId: deletingId, categoryStockTotals: categoryStockTotals, categoryStockThreshold: LOW_STOCK_CATEGORY_THRESHOLD, onEdit: setSelectedPart, emptyMessage: hasActiveFilters ? "No hay piezas que coincidan con los filtros." : undefined, onDelete: (part) => {
                                void handleDelete(part);
                            } }) }), !loading && sortedPieceParts.length > 0 ? (_jsxs("section", { className: "flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-3 shadow-lg shadow-slate-950/40 md:hidden", children: [_jsxs("p", { className: "text-sm text-slate-300", children: ["P\u00E1gina ", currentPage, " de ", totalPages, " (piezas)"] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { type: "button", onClick: () => setCurrentPage((prev) => Math.max(1, prev - 1)), disabled: currentPage === 1, className: `${SECONDARY_BUTTON_SM} min-h-[40px] px-3 py-2 disabled:cursor-not-allowed`, children: "Anterior" }), _jsx("button", { type: "button", onClick: () => setCurrentPage((prev) => Math.min(totalPages, prev + 1)), disabled: currentPage === totalPages, className: `${SECONDARY_BUTTON_SM} min-h-[40px] px-3 py-2 disabled:cursor-not-allowed`, children: "Siguiente" })] })] })) : null] }), _jsxs("section", { id: "inventory-panel-prebuilt", role: "tabpanel", "aria-labelledby": "inventory-tab-prebuilt", hidden: activeTab !== "prebuilt", className: activeTab === "prebuilt" ? "space-y-3" : "hidden", children: [kindFilter === "PART" ? (_jsxs("div", { className: "rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100", children: ["Cambia el filtro ", _jsx("strong", { children: "Tipo" }), " (no \"Piezas\") o pulsa Limpiar filtros para ver PCs completos."] })) : null, _jsxs("section", { className: "overflow-hidden rounded-xl border border-slate-800 bg-slate-900/80 shadow-lg shadow-slate-950/40 backdrop-blur", children: [_jsxs("button", { type: "button", className: "flex w-full items-center justify-between gap-3 border-b border-slate-800 bg-slate-950/20 px-3.5 py-3 text-left transition hover:bg-slate-900/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400/50 md:hidden", onClick: () => setPrebuiltFiltersOpen((open) => !open), "aria-expanded": prebuiltFiltersOpen, "aria-controls": "inventory-prebuilt-filters-panel", children: [_jsxs("span", { className: "min-w-0 flex-1", children: [_jsx("span", { className: "block text-base font-semibold text-slate-100", children: "Filtros" }), _jsxs("span", { className: "mt-0.5 block text-xs font-normal text-slate-500", children: [partPrebuilt.length, " PCs completos", hasActiveFilters ? " · hay filtros activos" : ""] })] }), _jsx("svg", { className: `h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 ${prebuiltFiltersOpen ? "rotate-180" : ""}`, fill: "none", viewBox: "0 0 24 24", strokeWidth: 2, stroke: "currentColor", "aria-hidden": true, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M19 9l-7 7-7-7" }) })] }), _jsx("div", { id: "inventory-prebuilt-filters-panel", className: prebuiltFiltersOpen ? "" : "max-md:hidden", children: _jsxs("div", { className: "px-3.5 py-3 md:px-4 md:py-4", children: [_jsx("h2", { className: "mb-2.5 hidden text-lg font-semibold text-slate-100 md:block", children: "Filtros" }), _jsxs("div", { className: "grid grid-cols-1 gap-3 sm:grid-cols-3", children: [_jsxs("label", { className: "flex min-w-0 flex-col gap-1.5 text-sm font-medium text-slate-200", children: ["Buscar por nombre", _jsx("input", { value: query, onChange: (event) => setQuery(event.target.value), placeholder: "Nombre del equipo...", className: "min-h-[42px] w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-base text-slate-100 outline-none ring-indigo-400/60 placeholder:text-slate-500 focus:border-indigo-400 focus:ring sm:text-sm" })] }), _jsxs("label", { className: "flex min-w-0 flex-col gap-1.5 text-sm font-medium text-slate-200", children: ["Estado", _jsxs("select", { value: conditionFilter, onChange: (event) => setConditionFilter(event.target.value), className: "min-h-[42px] w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-base text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring sm:text-sm", children: [_jsx("option", { value: "ALL", children: "Todos" }), PART_CONDITIONS.map((condition) => (_jsx("option", { value: condition, children: condition }, condition)))] })] }), _jsxs("label", { className: "flex min-w-0 flex-col gap-1.5 text-sm font-medium text-slate-200", children: ["Stock", _jsxs("select", { value: stockFilter, onChange: (event) => setStockFilter(event.target.value), className: "min-h-[42px] w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-base text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring sm:text-sm", children: [_jsx("option", { value: "ALL", children: "Todos" }), _jsx("option", { value: "IN_STOCK", children: "Con stock" }), _jsx("option", { value: "OUT_OF_STOCK", children: "Sin stock" })] })] })] }), _jsxs("div", { className: "mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-4", children: [_jsxs("p", { className: "text-sm text-slate-300", children: [partPrebuilt.length, " PC(s) mostrado(s)"] }), _jsx("button", { type: "button", onClick: clearFilters, disabled: !hasActiveFilters, className: `${SECONDARY_BUTTON_SM} min-h-[40px] disabled:cursor-not-allowed`, children: "Limpiar filtros" })] })] }) })] }), _jsx(PrebuiltInventoryTable, { items: partPrebuilt, compact: true, loading: loading, deletingId: deletingId, onEdit: setSelectedPart, emptyMessage: hasActiveFilters ? "No hay PCs completos que coincidan con los filtros." : undefined, onDelete: (part) => {
                            void handleDelete(part);
                        } })] })] }));
}
