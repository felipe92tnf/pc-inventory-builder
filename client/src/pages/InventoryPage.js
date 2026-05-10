import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { PartForm } from "../components/inventory/PartForm";
import { PartsTable } from "../components/inventory/PartsTable";
import { PrebuiltInventoryTable } from "../components/inventory/PrebuiltInventoryTable";
import { useParts } from "../hooks/useParts";
import { OS_PART_CONDITION, PART_CATEGORIES, PART_CONDITIONS, isNonStockCategory, partCategoryLabel } from "../types/part";
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
function listedInInventory(part) {
    if (part.inventoryKind === "PREBUILT_PC")
        return true;
    if (!part.category)
        return part.stock > 0;
    return part.stock > 0 || isNonStockCategory(part.category);
}
function ChevronDown({ open }) {
    return (_jsx("svg", { className: `h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`, fill: "none", viewBox: "0 0 24 24", strokeWidth: 2, stroke: "currentColor", "aria-hidden": true, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M19 9l-7 7-7-7" }) }));
}
function money(value) {
    return `${value.toFixed(2)} EUR`;
}
export function InventoryPage() {
    const { parts, loading, error, submitting, deletingId, createPart, updatePart, deletePart, reload } = useParts();
    const [selectedPart, setSelectedPart] = useState(null);
    const [query, setQuery] = useState("");
    const [kindFilter, setKindFilter] = useState("ALL");
    const [categoryFilter, setCategoryFilter] = useState("ALL");
    const [conditionFilter, setConditionFilter] = useState("ALL");
    const [stockFilter, setStockFilter] = useState("ALL");
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 8;
    const [mobileFormOpen, setMobileFormOpen] = useState(false);
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
    useEffect(() => {
        if (selectedPart) {
            setMobileFormOpen(true);
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
                    part.stock > 0 || (part.inventoryKind === "PART" && part.category !== null && isNonStockCategory(part.category));
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
    const showFormOnMobile = mobileFormOpen || selectedPart !== null;
    const showFiltersOnMobile = mobileFiltersOpen;
    const formTitleMobile = selectedPart
        ? selectedPart.inventoryKind === "PREBUILT_PC"
            ? "Editar PC completo"
            : "Editar pieza"
        : "Anadir al inventario";
    return (_jsxs("div", { className: "mx-auto w-full max-w-7xl space-y-6 px-2 pb-8 text-slate-100 md:px-4", children: [_jsxs("section", { className: "rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 shadow-[0_20px_50px_-24px_rgba(79,70,229,0.75)]", children: [_jsx("h1", { className: "text-2xl font-bold", children: "Inventario" }), _jsx("p", { className: "mt-2 text-sm text-slate-300", children: "Piezas sueltas para montajes y PCs completos / premontados listos para vender." })] }), _jsxs("section", { className: "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4", children: [_jsxs("article", { className: "rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/40", children: [_jsx("p", { className: "text-xs uppercase tracking-wide text-slate-400", children: "Valor coste total" }), _jsx("p", { className: "mt-1 text-xl font-bold text-slate-100", children: money(totals.totalCostValue) })] }), _jsxs("article", { className: "rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/40", children: [_jsx("p", { className: "text-xs uppercase tracking-wide text-slate-400", children: "Valor venta estimado" }), _jsx("p", { className: "mt-1 text-xl font-bold text-emerald-300/95", children: money(totals.totalSaleValue) })] }), _jsxs("article", { className: "rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/40", children: [_jsx("p", { className: "text-xs uppercase tracking-wide text-slate-400", children: "Beneficio potencial" }), _jsx("p", { className: `mt-1 text-xl font-bold ${totals.potentialProfit >= 0 ? "text-emerald-300" : "text-rose-300"}`, children: money(totals.potentialProfit) })] }), _jsxs("article", { className: "rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/40", children: [_jsx("p", { className: "text-xs uppercase tracking-wide text-slate-400", children: "Unidades en stock" }), _jsx("p", { className: "mt-1 text-xl font-bold text-slate-100", children: totals.units })] })] }), error ? (_jsxs("div", { className: "flex flex-col gap-3 rounded-xl border border-rose-800/70 bg-rose-950/40 px-4 py-3 text-sm text-rose-200 md:flex-row md:items-center md:justify-between", children: [_jsx("span", { children: error }), _jsx("button", { type: "button", onClick: () => {
                            void reload();
                        }, className: "rounded-lg border border-rose-700 bg-rose-900/50 px-3 py-1.5 font-semibold text-rose-100 transition hover:bg-rose-800/70", children: "Reintentar" })] })) : null, _jsxs("section", { className: "overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-lg shadow-slate-950/40 md:border-0 md:bg-transparent md:shadow-none", children: [_jsxs("button", { type: "button", className: "flex w-full items-center justify-between gap-3 border-b border-slate-800 px-4 py-3.5 text-left text-slate-100 md:hidden", onClick: () => setMobileFormOpen((v) => !v), "aria-expanded": showFormOnMobile, "aria-controls": "inventory-part-form-panel", children: [_jsx("span", { className: "text-sm font-semibold", children: formTitleMobile }), _jsx(ChevronDown, { open: showFormOnMobile })] }), _jsx("div", { id: "inventory-part-form-panel", className: showFormOnMobile ? "block" : "hidden md:block", children: _jsx(PartForm, { selectedPart: selectedPart, submitting: submitting, onSubmit: handleSubmit, onCancelEdit: () => setSelectedPart(null), className: "max-md:rounded-none max-md:border-0 max-md:bg-transparent max-md:shadow-none max-md:px-4 max-md:pb-5 max-md:pt-3" }) })] }), _jsxs("section", { className: "overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-lg shadow-slate-950/40 backdrop-blur", children: [_jsxs("button", { type: "button", className: "flex w-full items-center justify-between gap-3 border-b border-slate-800 px-4 py-3.5 text-left md:hidden", onClick: () => setMobileFiltersOpen((v) => !v), "aria-expanded": showFiltersOnMobile, "aria-controls": "inventory-filters-panel", children: [_jsx("span", { className: "text-sm font-semibold text-slate-100", children: "Filtros de busqueda" }), _jsx(ChevronDown, { open: showFiltersOnMobile })] }), _jsxs("div", { id: "inventory-filters-panel", className: `px-4 pb-4 pt-4 md:px-5 md:pb-5 md:pt-5 ${showFiltersOnMobile ? "block" : "hidden md:block"}`, children: [_jsx("h2", { className: "mb-4 hidden text-lg font-semibold text-slate-100 md:block", children: "Filtros de busqueda" }), _jsxs("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-6 lg:gap-3", children: [_jsxs("label", { className: "flex min-w-0 flex-col gap-1.5 text-sm font-medium text-slate-200 lg:col-span-2", children: ["Buscar por nombre", _jsx("input", { value: query, onChange: (event) => setQuery(event.target.value), placeholder: "Ej: RTX, Ryzen, SSD...", className: "min-h-[42px] w-full min-w-0 rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-base text-slate-100 outline-none ring-indigo-400/60 placeholder:text-slate-500 focus:border-indigo-400 focus:ring sm:text-sm" })] }), _jsxs("label", { className: "flex min-w-0 flex-col gap-1.5 text-sm font-medium text-slate-200", children: ["Tipo", _jsxs("select", { value: kindFilter, onChange: (event) => setKindFilter(event.target.value), className: "min-h-[42px] w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-base text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring sm:text-sm", children: [_jsx("option", { value: "ALL", children: "Todos" }), _jsx("option", { value: "PART", children: "Piezas" }), _jsx("option", { value: "PREBUILT_PC", children: "PCs completos" })] })] }), _jsxs("label", { className: "flex min-w-0 flex-col gap-1.5 text-sm font-medium text-slate-200", children: ["Categoria", _jsxs("select", { value: categoryFilter, onChange: (event) => setCategoryFilter(event.target.value), className: "min-h-[42px] w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-base text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring sm:text-sm", children: [_jsx("option", { value: "ALL", children: "Todas" }), PART_CATEGORIES.map((category) => (_jsx("option", { value: category, children: partCategoryLabel(category) }, category)))] })] }), _jsxs("label", { className: "flex min-w-0 flex-col gap-1.5 text-sm font-medium text-slate-200", children: ["Estado", _jsxs("select", { value: conditionFilter, onChange: (event) => setConditionFilter(event.target.value), className: "min-h-[42px] w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-base text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring sm:text-sm", children: [_jsx("option", { value: "ALL", children: "Todos" }), PART_CONDITIONS.map((condition) => (_jsx("option", { value: condition, children: condition }, condition)))] })] }), _jsxs("label", { className: "flex min-w-0 flex-col gap-1.5 text-sm font-medium text-slate-200", children: ["Stock", _jsxs("select", { value: stockFilter, onChange: (event) => setStockFilter(event.target.value), className: "min-h-[42px] w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-base text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring sm:text-sm", children: [_jsx("option", { value: "ALL", children: "Todos" }), _jsx("option", { value: "IN_STOCK", children: "Con stock" }), _jsx("option", { value: "OUT_OF_STOCK", children: "Sin stock" })] })] })] })] }), _jsxs("div", { className: "flex flex-col gap-3 border-t border-slate-800 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-5", children: [_jsxs("p", { className: "text-sm text-slate-300", children: [sortedPieceParts.length, " pieza(s) y ", partPrebuilt.length, " PC(s) mostrado(s) (", filteredParts.length, " de ", partsListed.length, " lineas)"] }), _jsx("button", { type: "button", onClick: () => {
                                    setQuery("");
                                    setKindFilter("ALL");
                                    setCategoryFilter("ALL");
                                    setConditionFilter("ALL");
                                    setStockFilter("ALL");
                                }, disabled: !hasActiveFilters, className: "min-h-[40px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50", children: "Limpiar filtros" })] })] }), _jsxs("section", { className: "space-y-3", children: [_jsx("h2", { className: "text-lg font-semibold text-slate-100", children: "Componentes" }), _jsx(PartsTable, { parts: sortedPieceParts, partsMobilePage: paginatedPieces, loading: loading, deletingId: deletingId, onEdit: setSelectedPart, emptyMessage: hasActiveFilters ? "No hay piezas que coincidan con los filtros." : undefined, onDelete: (part) => {
                            void handleDelete(part);
                        } })] }), !loading && sortedPieceParts.length > 0 ? (_jsxs("section", { className: "flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 shadow-lg shadow-slate-950/40 md:hidden", children: [_jsxs("p", { className: "text-sm text-slate-300", children: ["Pagina ", currentPage, " de ", totalPages, " (piezas)"] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { type: "button", onClick: () => setCurrentPage((prev) => Math.max(1, prev - 1)), disabled: currentPage === 1, className: "min-h-[40px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-1.5 text-sm font-medium text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50", children: "Anterior" }), _jsx("button", { type: "button", onClick: () => setCurrentPage((prev) => Math.min(totalPages, prev + 1)), disabled: currentPage === totalPages, className: "min-h-[40px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-1.5 text-sm font-medium text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50", children: "Siguiente" })] })] })) : null, _jsxs("section", { className: "space-y-3", children: [_jsx("h2", { className: "text-lg font-semibold text-slate-100", children: "PCs completos" }), _jsx(PrebuiltInventoryTable, { items: partPrebuilt, loading: loading, deletingId: deletingId, onEdit: setSelectedPart, emptyMessage: hasActiveFilters ? "No hay PCs completos que coincidan con los filtros." : undefined, onDelete: (part) => {
                            void handleDelete(part);
                        } })] })] }));
}
