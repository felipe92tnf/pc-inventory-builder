import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { PartForm } from "../components/inventory/PartForm";
import { PartsTable } from "../components/inventory/PartsTable";
import { PrebuiltInventoryTable } from "../components/inventory/PrebuiltInventoryTable";
import { useParts } from "../hooks/useParts";
import { OS_PART_CONDITION, PART_CATEGORIES, PART_CONDITIONS, isNonStockCategory, isPrebuiltPc, partCategoryLabel } from "../types/part";
import { calculateSalePrice } from "../utils/pricing";
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
const LOW_STOCK_MAX = 3;
function isLowStock(part) {
    if (part.inventoryKind === "PREBUILT_PC") {
        return part.stock > 0 && part.stock <= LOW_STOCK_MAX;
    }
    if (!part.category || isNonStockCategory(part.category))
        return false;
    return part.stock > 0 && part.stock <= LOW_STOCK_MAX;
}
function listedInInventory(part) {
    if (part.inventoryKind === "PREBUILT_PC")
        return true;
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
const INVENTORY_TABS = [
    { id: "summary", label: "Resumen" },
    { id: "add", label: "Añadir item" },
    { id: "components", label: "Componentes" },
    { id: "prebuilt", label: "PCs completos" }
];
export function InventoryPage() {
    const { parts, loading, error, submitting, deletingId, createPart, updatePart, deletePart, reload } = useParts();
    const [selectedPart, setSelectedPart] = useState(null);
    const [activeTab, setActiveTab] = useState("summary");
    const [query, setQuery] = useState("");
    const [kindFilter, setKindFilter] = useState("ALL");
    const [categoryFilter, setCategoryFilter] = useState("ALL");
    const [conditionFilter, setConditionFilter] = useState("ALL");
    const [stockFilter, setStockFilter] = useState("ALL");
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 8;
    useEffect(() => {
        if (selectedPart) {
            setActiveTab("add");
        }
    }, [selectedPart]);
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
    const totals = useMemo(() => inventoryTotals(parts), [parts]);
    const partsListed = useMemo(() => parts.filter(listedInInventory), [parts]);
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
    }, [sortedPieceParts, currentPage]);
    const hasActiveFilters = query.trim().length > 0 ||
        kindFilter !== "ALL" ||
        categoryFilter !== "ALL" ||
        conditionFilter !== "ALL" ||
        stockFilter !== "ALL";
    const lowStockItems = useMemo(() => {
        return partsListed.filter(isLowStock).sort((a, b) => {
            if (a.stock !== b.stock)
                return a.stock - b.stock;
            return a.name.localeCompare(b.name, "es", { sensitivity: "base" });
        });
    }, [partsListed]);
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
    const formTitle = selectedPart
        ? selectedPart.inventoryKind === "PREBUILT_PC"
            ? "Editar PC completo"
            : "Editar pieza"
        : "Añadir al inventario";
    const tabButtonClass = (id) => [
        "shrink-0 snap-start whitespace-nowrap rounded-t-lg border border-b-0 px-3 py-2.5 text-sm font-semibold transition md:px-4",
        activeTab === id
            ? "border-slate-700 bg-slate-900 text-slate-100 shadow-sm"
            : "border-transparent bg-slate-950/50 text-slate-400 hover:bg-slate-900/60 hover:text-slate-200"
    ].join(" ");
    return (_jsxs("div", { className: "mx-auto w-full max-w-6xl space-y-5 px-2 pb-8 text-slate-100 md:space-y-6 md:px-4", children: [_jsxs("section", { className: "rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-5 shadow-[0_20px_50px_-24px_rgba(79,70,229,0.75)] md:p-6", children: [_jsx("h1", { className: "text-2xl font-bold", children: "Inventario" }), _jsx("p", { className: "mt-2 text-sm text-slate-300", children: "Piezas sueltas para montajes y PCs completos / premontados. Usa las pesta\u00F1as para moverte entre secciones." })] }), error ? (_jsxs("div", { className: "flex flex-col gap-3 rounded-xl border border-rose-800/70 bg-rose-950/40 px-4 py-3 text-sm text-rose-200 md:flex-row md:items-center md:justify-between", children: [_jsx("span", { children: error }), _jsx("button", { type: "button", onClick: () => {
                            void reload();
                        }, className: "rounded-lg border border-rose-700 bg-rose-900/50 px-3 py-1.5 font-semibold text-rose-100 transition hover:bg-rose-800/70", children: "Reintentar" })] })) : null, _jsx("div", { className: "rounded-2xl border border-slate-800 bg-slate-950/40 p-1.5 shadow-inner shadow-black/30 md:p-2", children: _jsx("div", { className: "-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0 md:pb-0", role: "tablist", "aria-label": "Secciones de inventario", children: INVENTORY_TABS.map((tab) => (_jsx("button", { type: "button", role: "tab", id: `inventory-tab-${tab.id}`, "aria-selected": activeTab === tab.id, "aria-controls": `inventory-panel-${tab.id}`, tabIndex: activeTab === tab.id ? 0 : -1, className: tabButtonClass(tab.id), onClick: () => setActiveTab(tab.id), children: tab.label }, tab.id))) }) }), _jsxs("section", { id: "inventory-panel-summary", role: "tabpanel", "aria-labelledby": "inventory-tab-summary", hidden: activeTab !== "summary", className: activeTab === "summary" ? "space-y-5" : "hidden", children: [_jsxs("div", { className: "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4", children: [_jsxs("article", { className: "rounded-xl border border-slate-800 bg-slate-900/80 p-3 shadow-lg shadow-slate-950/40 md:p-4", children: [_jsx("p", { className: "text-xs uppercase tracking-wide text-slate-400", children: "Valor coste total" }), _jsx("p", { className: "mt-1 text-lg font-bold text-slate-100 md:text-xl", children: money(totals.totalCostValue) })] }), _jsxs("article", { className: "rounded-xl border border-slate-800 bg-slate-900/80 p-3 shadow-lg shadow-slate-950/40 md:p-4", children: [_jsx("p", { className: "text-xs uppercase tracking-wide text-slate-400", children: "Valor venta estimado" }), _jsx("p", { className: "mt-1 text-lg font-bold text-emerald-300/95 md:text-xl", children: money(totals.totalSaleValue) })] }), _jsxs("article", { className: "rounded-xl border border-slate-800 bg-slate-900/80 p-3 shadow-lg shadow-slate-950/40 md:p-4", children: [_jsx("p", { className: "text-xs uppercase tracking-wide text-slate-400", children: "Beneficio potencial" }), _jsx("p", { className: `mt-1 text-lg font-bold md:text-xl ${totals.potentialProfit >= 0 ? "text-emerald-300" : "text-rose-300"}`, children: money(totals.potentialProfit) })] }), _jsxs("article", { className: "rounded-xl border border-slate-800 bg-slate-900/80 p-3 shadow-lg shadow-slate-950/40 md:p-4", children: [_jsx("p", { className: "text-xs uppercase tracking-wide text-slate-400", children: "Unidades en stock" }), _jsx("p", { className: "mt-1 text-lg font-bold text-slate-100 md:text-xl", children: totals.units })] })] }), _jsxs("div", { className: "grid grid-cols-1 gap-4 lg:grid-cols-2", children: [_jsxs("article", { className: "rounded-xl border border-amber-500/25 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/40", children: [_jsxs("div", { className: "flex flex-wrap items-baseline justify-between gap-2", children: [_jsx("h2", { className: "text-sm font-semibold text-slate-100", children: "Stock bajo" }), _jsxs("span", { className: "text-xs text-amber-200/90", children: ["Stock 1\u2013", LOW_STOCK_MAX, " unidades (piezas con inventario fisico)"] })] }), lowStockItems.length === 0 ? (_jsx("p", { className: "mt-3 text-sm text-slate-400", children: "No hay l\u00EDneas por debajo del umbral." })) : (_jsxs(_Fragment, { children: [_jsxs("p", { className: "mt-1 text-xs text-slate-500", children: [lowStockItems.length, " l\u00EDnea(s)"] }), _jsx("ul", { className: "mt-3 max-h-52 space-y-2 overflow-y-auto text-sm", children: lowStockItems.map((p) => (_jsxs("li", { className: "flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800/80 bg-slate-950/40 px-3 py-2", children: [_jsx("span", { className: "min-w-0 font-medium text-slate-200", children: p.name }), _jsxs("span", { className: "shrink-0 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-200", children: [p.stock, " u."] })] }, p.id))) })] }))] }), _jsxs("article", { className: "rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/40", children: [_jsx("h2", { className: "text-sm font-semibold text-slate-100", children: "\u00DAltimas actualizaciones" }), _jsx("p", { className: "mt-1 text-xs text-slate-500", children: "Ordenadas por fecha de modificaci\u00F3n en el inventario." }), recentParts.length === 0 ? (_jsx("p", { className: "mt-3 text-sm text-slate-400", children: "Sin datos todavia." })) : (_jsx("ul", { className: "mt-3 max-h-52 space-y-2 overflow-y-auto text-sm", children: recentParts.map((p) => (_jsx("li", { children: _jsxs("button", { type: "button", onClick: () => setSelectedPart(p), className: "flex w-full flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800/80 bg-slate-950/40 px-3 py-2 text-left transition hover:border-indigo-500/35 hover:bg-slate-900/80", children: [_jsx("span", { className: "min-w-0 flex-1 font-medium text-slate-200", children: p.name }), _jsxs("span", { className: "flex shrink-0 flex-wrap items-center gap-2", children: [_jsx("span", { className: `rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${isPrebuiltPc(p)
                                                                    ? "border border-violet-500/35 bg-violet-500/10 text-violet-200"
                                                                    : "border border-slate-600 bg-slate-800/80 text-slate-300"}`, children: isPrebuiltPc(p) ? "PC" : "Pieza" }), _jsx("span", { className: "text-xs text-slate-500", children: formatShortDate(p.updatedAt) })] })] }) }, p.id))) }))] })] })] }), _jsx("section", { id: "inventory-panel-add", role: "tabpanel", "aria-labelledby": "inventory-tab-add", hidden: activeTab !== "add", className: activeTab === "add" ? "space-y-3" : "hidden", children: _jsxs("div", { className: "rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/40 md:p-5", children: [_jsx("h2", { className: "text-lg font-semibold text-slate-100", children: formTitle }), _jsx("p", { className: "mt-1 text-xs text-slate-400", children: "Elige pieza suelta o PC completo. Desde otras pesta\u00F1as, Editar abre este formulario autom\u00E1ticamente." }), _jsx("div", { className: "mt-4", children: _jsx(PartForm, { selectedPart: selectedPart, submitting: submitting, onSubmit: handleSubmit, onCancelEdit: () => setSelectedPart(null), className: "border-0 bg-transparent p-0 shadow-none" }) })] }) }), _jsxs("section", { id: "inventory-panel-components", role: "tabpanel", "aria-labelledby": "inventory-tab-components", hidden: activeTab !== "components", className: activeTab === "components" ? "space-y-4" : "hidden", children: [_jsxs("section", { className: "overflow-hidden rounded-xl border border-slate-800 bg-slate-900/80 shadow-lg shadow-slate-950/40 backdrop-blur", children: [_jsxs("div", { className: "px-4 pb-4 pt-4 md:px-5 md:pb-5 md:pt-5", children: [_jsx("h2", { className: "mb-4 text-lg font-semibold text-slate-100", children: "Filtros de b\u00FAsqueda" }), _jsxs("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-6 lg:gap-3", children: [_jsxs("label", { className: "flex min-w-0 flex-col gap-1.5 text-sm font-medium text-slate-200 lg:col-span-2", children: ["Buscar por nombre", _jsx("input", { value: query, onChange: (event) => setQuery(event.target.value), placeholder: "Ej: RTX, Ryzen, SSD...", className: "min-h-[42px] w-full min-w-0 rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-base text-slate-100 outline-none ring-indigo-400/60 placeholder:text-slate-500 focus:border-indigo-400 focus:ring sm:text-sm" })] }), _jsxs("label", { className: "flex min-w-0 flex-col gap-1.5 text-sm font-medium text-slate-200", children: ["Tipo", _jsxs("select", { value: kindFilter, onChange: (event) => setKindFilter(event.target.value), className: "min-h-[42px] w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-base text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring sm:text-sm", children: [_jsx("option", { value: "ALL", children: "Todos" }), _jsx("option", { value: "PART", children: "Piezas" }), _jsx("option", { value: "PREBUILT_PC", children: "PCs completos" })] })] }), _jsxs("label", { className: "flex min-w-0 flex-col gap-1.5 text-sm font-medium text-slate-200", children: ["Categoria", _jsxs("select", { value: categoryFilter, onChange: (event) => setCategoryFilter(event.target.value), className: "min-h-[42px] w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-base text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring sm:text-sm", children: [_jsx("option", { value: "ALL", children: "Todas" }), PART_CATEGORIES.map((category) => (_jsx("option", { value: category, children: partCategoryLabel(category) }, category)))] })] }), _jsxs("label", { className: "flex min-w-0 flex-col gap-1.5 text-sm font-medium text-slate-200", children: ["Estado", _jsxs("select", { value: conditionFilter, onChange: (event) => setConditionFilter(event.target.value), className: "min-h-[42px] w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-base text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring sm:text-sm", children: [_jsx("option", { value: "ALL", children: "Todos" }), PART_CONDITIONS.map((condition) => (_jsx("option", { value: condition, children: condition }, condition)))] })] }), _jsxs("label", { className: "flex min-w-0 flex-col gap-1.5 text-sm font-medium text-slate-200", children: ["Stock", _jsxs("select", { value: stockFilter, onChange: (event) => setStockFilter(event.target.value), className: "min-h-[42px] w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-base text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring sm:text-sm", children: [_jsx("option", { value: "ALL", children: "Todos" }), _jsx("option", { value: "IN_STOCK", children: "Con stock" }), _jsx("option", { value: "OUT_OF_STOCK", children: "Sin stock" })] })] })] })] }), _jsxs("div", { className: "flex flex-col gap-3 border-t border-slate-800 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-5", children: [_jsxs("p", { className: "text-sm text-slate-300", children: [sortedPieceParts.length, " pieza(s) en esta vista (mismos filtros que el inventario completo)."] }), _jsx("button", { type: "button", onClick: clearFilters, disabled: !hasActiveFilters, className: "min-h-[40px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50", children: "Limpiar filtros" })] })] }), _jsx("div", { className: "space-y-3", children: _jsx(PartsTable, { parts: sortedPieceParts, partsMobilePage: paginatedPieces, compact: true, loading: loading, deletingId: deletingId, onEdit: setSelectedPart, emptyMessage: hasActiveFilters ? "No hay piezas que coincidan con los filtros." : undefined, onDelete: (part) => {
                                void handleDelete(part);
                            } }) }), !loading && sortedPieceParts.length > 0 ? (_jsxs("section", { className: "flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-3 shadow-lg shadow-slate-950/40 md:hidden", children: [_jsxs("p", { className: "text-sm text-slate-300", children: ["Pagina ", currentPage, " de ", totalPages, " (piezas)"] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { type: "button", onClick: () => setCurrentPage((prev) => Math.max(1, prev - 1)), disabled: currentPage === 1, className: "min-h-[40px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-1.5 text-sm font-medium text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50", children: "Anterior" }), _jsx("button", { type: "button", onClick: () => setCurrentPage((prev) => Math.min(totalPages, prev + 1)), disabled: currentPage === totalPages, className: "min-h-[40px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-1.5 text-sm font-medium text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50", children: "Siguiente" })] })] })) : null] }), _jsxs("section", { id: "inventory-panel-prebuilt", role: "tabpanel", "aria-labelledby": "inventory-tab-prebuilt", hidden: activeTab !== "prebuilt", className: activeTab === "prebuilt" ? "space-y-4" : "hidden", children: [kindFilter === "PART" ? (_jsxs("div", { className: "rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100", children: ["El filtro ", _jsx("strong", { children: "Tipo" }), " est\u00E1 en \"Piezas\". C\u00E1mbialo a ", _jsx("strong", { children: "Todos" }), " o", " ", _jsx("strong", { children: "PCs completos" }), " para ver los premontados, o pulsa Limpiar filtros."] })) : null, _jsxs("section", { className: "rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-4 shadow-lg shadow-slate-950/40 md:px-5 md:py-5", children: [_jsx("h2", { className: "mb-3 text-lg font-semibold text-slate-100", children: "Filtros" }), _jsxs("div", { className: "grid grid-cols-1 gap-4 sm:grid-cols-3", children: [_jsxs("label", { className: "flex min-w-0 flex-col gap-1.5 text-sm font-medium text-slate-200", children: ["Buscar por nombre", _jsx("input", { value: query, onChange: (event) => setQuery(event.target.value), placeholder: "Nombre del equipo...", className: "min-h-[42px] w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-base text-slate-100 outline-none ring-indigo-400/60 placeholder:text-slate-500 focus:border-indigo-400 focus:ring sm:text-sm" })] }), _jsxs("label", { className: "flex min-w-0 flex-col gap-1.5 text-sm font-medium text-slate-200", children: ["Estado", _jsxs("select", { value: conditionFilter, onChange: (event) => setConditionFilter(event.target.value), className: "min-h-[42px] w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-base text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring sm:text-sm", children: [_jsx("option", { value: "ALL", children: "Todos" }), PART_CONDITIONS.map((condition) => (_jsx("option", { value: condition, children: condition }, condition)))] })] }), _jsxs("label", { className: "flex min-w-0 flex-col gap-1.5 text-sm font-medium text-slate-200", children: ["Stock", _jsxs("select", { value: stockFilter, onChange: (event) => setStockFilter(event.target.value), className: "min-h-[42px] w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-base text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring sm:text-sm", children: [_jsx("option", { value: "ALL", children: "Todos" }), _jsx("option", { value: "IN_STOCK", children: "Con stock" }), _jsx("option", { value: "OUT_OF_STOCK", children: "Sin stock" })] })] })] }), _jsxs("div", { className: "mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-4", children: [_jsxs("p", { className: "text-sm text-slate-300", children: [partPrebuilt.length, " PC(s) mostrado(s)"] }), _jsx("button", { type: "button", onClick: clearFilters, disabled: !hasActiveFilters, className: "min-h-[40px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50", children: "Limpiar filtros" })] })] }), _jsx(PrebuiltInventoryTable, { items: partPrebuilt, compact: true, loading: loading, deletingId: deletingId, onEdit: setSelectedPart, emptyMessage: hasActiveFilters ? "No hay PCs completos que coincidan con los filtros." : undefined, onDelete: (part) => {
                            void handleDelete(part);
                        } })] })] }));
}
