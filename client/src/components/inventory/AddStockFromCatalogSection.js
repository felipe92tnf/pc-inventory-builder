import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as catalogApi from "../../api/catalog";
import { NON_STOCK_PART_CATEGORIES, PART_CONDITIONS, partCategoryLabel } from "../../types/part";
import { calculateSalePrice } from "../../utils/pricing";
import { SECONDARY_BUTTON_SM, SECONDARY_GHOST_SM } from "../../theme/actionButtons";
function num(v, fallback = 0) {
    if (typeof v === "number")
        return Number.isFinite(v) ? v : fallback;
    const n = parseFloat(String(v ?? ""));
    return Number.isFinite(n) ? n : fallback;
}
/** Acepta coma o punto como separador decimal (evita limitaciones de `type="number"` según locale del navegador). */
function parseDecimalInput(raw) {
    const t = raw.trim().replace(",", ".");
    if (t === "" || t === "." || t === "-")
        return 0;
    const n = parseFloat(t);
    return Number.isFinite(n) ? n : 0;
}
function formatDecimalForInput(n) {
    if (!Number.isFinite(n))
        return "";
    return String(n);
}
const STOCK_CONDITION_LABEL = {
    NEW: "Nuevo",
    USED: "Usado",
    REFURBISHED: "Reacondicionado"
};
export function AddStockFromCatalogSection({ submitting, onRegisterStock, catalogRefreshSignal = 0, pendingCatalogPick = null, onPendingCatalogPickConsumed, onRequestCreateNewPart }) {
    const [catalogError, setCatalogError] = useState(null);
    const [searchInput, setSearchInput] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [catalogTotalRows, setCatalogTotalRows] = useState(null);
    const [listLoading, setListLoading] = useState(true);
    const [selectedCatalog, setSelectedCatalog] = useState(null);
    /** Condición usada al calcular PVP por defecto al cambiar de fila del catálogo (lista o flujo «Nueva pieza»). */
    const conditionForCatalogPricingInitRef = useRef("NEW");
    const [quantity, setQuantity] = useState(1);
    const [costInput, setCostInput] = useState("");
    const [saleInput, setSaleInput] = useState("");
    const [conditionUi, setConditionUi] = useState("NEW");
    const [notes, setNotes] = useState("");
    const fetchCatalog = useCallback(async (term) => {
        setListLoading(true);
        setCatalogError(null);
        try {
            const trimmed = term.trim();
            const rows = await catalogApi.listCatalogParts(trimmed === "" ? undefined : trimmed);
            setSearchResults(rows);
            if (trimmed === "") {
                setCatalogTotalRows(rows.length);
            }
        }
        catch (e) {
            setCatalogError(e instanceof Error ? e.message : "No se pudo cargar el catalogo.");
            setSearchResults([]);
        }
        finally {
            setListLoading(false);
        }
    }, []);
    useEffect(() => {
        const delayMs = searchInput.trim() === "" ? 0 : 280;
        const id = window.setTimeout(() => {
            void fetchCatalog(searchInput);
        }, delayMs);
        return () => window.clearTimeout(id);
    }, [searchInput, fetchCatalog, catalogRefreshSignal]);
    useEffect(() => {
        if (!pendingCatalogPick)
            return;
        const { catalog, condition } = pendingCatalogPick;
        conditionForCatalogPricingInitRef.current = condition;
        setConditionUi(condition);
        setSelectedCatalog(catalog);
        const hint = [catalog.name, catalog.sku].filter(Boolean).join(" ");
        setSearchInput(hint || catalog.name);
        onPendingCatalogPickConsumed?.();
    }, [pendingCatalogPick, onPendingCatalogPickConsumed]);
    useEffect(() => {
        if (!selectedCatalog) {
            setCostInput("");
            setSaleInput("");
            return;
        }
        const cost = num(selectedCatalog.defaultCostPrice);
        const saleDefault = num(selectedCatalog.defaultSalePrice);
        const cond = conditionForCatalogPricingInitRef.current;
        const sale = saleDefault > 0 ? saleDefault : calculateSalePrice(cost, cond);
        setCostInput(formatDecimalForInput(cost));
        setSaleInput(formatDecimalForInput(sale));
    }, [selectedCatalog?.id]);
    const selectedId = selectedCatalog?.id ?? "";
    const handleSubmitStock = async (event) => {
        event.preventDefault();
        if (!selectedCatalog)
            return;
        await onRegisterStock({
            catalogPartId: selectedCatalog.id,
            quantity: Math.max(1, Math.floor(quantity)),
            actualCostPrice: Math.max(0, parseDecimalInput(costInput)),
            salePrice: Math.max(0, parseDecimalInput(saleInput)),
            condition: conditionUi,
            notes: notes.trim() ? notes.trim() : null
        });
        setQuantity(1);
        setNotes("");
    };
    const nonStockSelected = selectedCatalog
        ? NON_STOCK_PART_CATEGORIES.has(selectedCatalog.category)
        : false;
    const catalogIsEmpty = catalogTotalRows !== null && catalogTotalRows === 0 && !listLoading && !catalogError;
    const noMatches = !listLoading &&
        !catalogError &&
        searchResults.length === 0 &&
        catalogTotalRows !== null &&
        catalogTotalRows > 0 &&
        searchInput.trim() !== "";
    const subtitleLine = useMemo(() => {
        if (!selectedCatalog)
            return null;
        const bits = [selectedCatalog.brand, selectedCatalog.model].filter(Boolean);
        return bits.length ? bits.join(" · ") : null;
    }, [selectedCatalog]);
    return (_jsxs("div", { className: "rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/40 md:p-5", children: [_jsxs("div", { className: "flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("h2", { className: "text-xl font-semibold text-slate-100", children: "A\u00F1adir unidades" }), _jsx("p", { className: "mt-2 text-sm text-slate-400", children: "Selecciona una pieza existente y a\u00F1ade stock f\u00EDsico." })] }), onRequestCreateNewPart ? (_jsx("button", { type: "button", onClick: onRequestCreateNewPart, className: `${SECONDARY_GHOST_SM} shrink-0 self-start`, children: "\u00BFNo existe la pieza? Crear nueva" })) : null] }), catalogError ? (_jsxs("div", { className: "mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-rose-800/60 bg-rose-950/40 px-3 py-2 text-sm text-rose-100", children: [_jsx("span", { children: catalogError }), _jsx("button", { type: "button", className: SECONDARY_BUTTON_SM, onClick: () => void fetchCatalog(searchInput), children: "Reintentar" })] })) : null, _jsxs("form", { onSubmit: handleSubmitStock, className: "mt-6 space-y-4", children: [_jsxs("div", { className: "flex flex-col gap-1.5", children: [_jsx("label", { htmlFor: "catalog-search-input", className: "text-sm font-medium text-slate-200", children: "Buscar en cat\u00E1logo" }), _jsx("input", { id: "catalog-search-input", value: searchInput, onChange: (e) => setSearchInput(e.target.value), placeholder: "Nombre, SKU, marca, modelo...", autoComplete: "off", className: "min-h-[42px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-base text-slate-100 outline-none ring-indigo-400/60 placeholder:text-slate-500 focus:border-indigo-400 focus:ring sm:text-sm" }), _jsx("p", { className: "text-xs text-slate-500", children: listLoading
                                    ? "Buscando..."
                                    : catalogTotalRows !== null && catalogTotalRows === 0
                                        ? "Catálogo sin plantillas (0 piezas)"
                                        : `${searchResults.length} resultado(s)` })] }), _jsxs("div", { className: "rounded-lg border border-slate-800 bg-slate-950/40", children: [_jsx("p", { className: "border-b border-slate-800 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400", children: "Resultados del cat\u00E1logo" }), _jsx("ul", { className: "max-h-52 overflow-y-auto text-sm", "aria-label": "Resultados de busqueda del catalogo", children: listLoading ? (_jsx("li", { className: "px-3 py-4 text-slate-500", children: "Cargando cat\u00E1logo..." })) : catalogIsEmpty ? (_jsx("li", { className: "px-3 py-4 text-slate-400", children: "El cat\u00E1logo de plantillas est\u00E1 vac\u00EDo. Crea la primera en Inventario \u2192 \u00ABNueva pieza\u00BB \u2192 tipo \u00ABPieza f\u00EDsica\u00BB. Las l\u00EDneas ya en inventario no se listan aqu\u00ED." })) : noMatches ? (_jsx("li", { className: "px-3 py-4 text-slate-500", children: "Sin coincidencias (b\u00FAsqueda sin distinguir may\u00FAsculas). Prueba otro texto o crea la plantilla en \u00ABNueva pieza\u00BB." })) : (searchResults.map((row) => {
                                    const active = selectedCatalog?.id === row.id;
                                    return (_jsx("li", { className: "border-b border-slate-800/80 last:border-b-0", children: _jsxs("button", { type: "button", onClick: () => {
                                                conditionForCatalogPricingInitRef.current = "NEW";
                                                setConditionUi("NEW");
                                                setSelectedCatalog(row);
                                            }, className: `flex w-full flex-col items-start gap-0.5 px-3 py-2.5 text-left transition ${active ? "bg-indigo-950/50 ring-1 ring-inset ring-indigo-500/40" : "hover:bg-slate-900/80"}`, children: [_jsxs("span", { className: "font-medium text-slate-100", children: [row.sku ? _jsxs("span", { className: "text-indigo-300", children: ["[", row.sku, "] "] }) : null, row.name] }), _jsxs("span", { className: "text-xs text-slate-400", children: [partCategoryLabel(row.category), row.brand || row.model
                                                            ? ` · ${[row.brand, row.model].filter(Boolean).join(" ")}`
                                                            : ""] })] }) }, row.id));
                                })) })] }), selectedCatalog ? (_jsxs("div", { className: "rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-3 text-sm text-slate-300", children: [_jsx("p", { className: "text-xs uppercase tracking-wide text-slate-500", children: "Seleccionado" }), _jsxs("p", { className: "mt-1", children: [_jsx("span", { className: "font-semibold text-slate-100", children: selectedCatalog.name }), _jsxs("span", { className: "text-slate-500", children: [" \u00B7 ", partCategoryLabel(selectedCatalog.category)] })] }), subtitleLine ? _jsx("p", { className: "mt-1 text-slate-400", children: subtitleLine }) : null, nonStockSelected ? (_jsx("p", { className: "mt-2 text-amber-200/90", children: "Esta categor\u00EDa no lleva stock f\u00EDsico; el alta registra precios y la l\u00EDnea en inventario con stock 0." })) : null] })) : (_jsx("p", { className: "text-sm text-slate-500", children: "Selecciona una pieza de la lista para continuar." })), _jsxs("div", { className: "grid grid-cols-1 gap-4 sm:grid-cols-2", children: [_jsxs("label", { className: "flex flex-col gap-1.5 text-sm font-medium text-slate-200", children: ["Cantidad", _jsx("input", { type: "number", min: 1, step: 1, value: quantity, onChange: (e) => setQuantity(Number(e.target.value)), disabled: !selectedId, className: "min-h-[42px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-base text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring sm:text-sm" })] }), _jsxs("label", { className: "flex flex-col gap-1.5 text-sm font-medium text-slate-200", children: ["Coste real (unidad)", _jsx("input", { type: "text", inputMode: "decimal", autoComplete: "off", value: costInput, onChange: (e) => setCostInput(e.target.value), disabled: !selectedId, placeholder: "19,99 \u00B7 19.99", className: "min-h-[42px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-base text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring sm:text-sm" })] }), _jsxs("label", { className: "flex flex-col gap-1.5 text-sm font-medium text-slate-200", children: ["Precio de venta (unidad)", _jsx("input", { type: "text", inputMode: "decimal", autoComplete: "off", value: saleInput, onChange: (e) => setSaleInput(e.target.value), disabled: !selectedId, placeholder: "19,99 \u00B7 19.99", className: "min-h-[42px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-base text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring sm:text-sm" })] }), _jsxs("label", { className: "flex flex-col gap-1.5 text-sm font-medium text-slate-200", children: ["Estado", _jsx("select", { value: conditionUi, onChange: (e) => setConditionUi(e.target.value), disabled: !selectedId || nonStockSelected, className: "min-h-[42px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-base text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring sm:text-sm", children: PART_CONDITIONS.map((c) => (_jsx("option", { value: c, children: STOCK_CONDITION_LABEL[c] }, c))) })] })] }), _jsxs("label", { className: "flex flex-col gap-1.5 text-sm font-medium text-slate-200", children: ["Notas (opcional)", _jsx("textarea", { value: notes, onChange: (e) => setNotes(e.target.value), rows: 2, disabled: !selectedId, className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 placeholder:text-slate-500 focus:border-indigo-400 focus:ring" })] }), _jsx("button", { type: "submit", disabled: !selectedId || submitting || listLoading, className: "rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50", children: submitting ? "Guardando..." : "Registrar stock" })] })] }));
}
