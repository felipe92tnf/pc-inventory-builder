import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import * as buildsApi from "../api/builds";
import type { Build } from "../types/build";
import { AddStockFromCatalogSection } from "../components/inventory/AddStockFromCatalogSection";
import { NewCatalogPartForm } from "../components/inventory/NewCatalogPartForm";
import { PartForm } from "../components/inventory/PartForm";
import { PartsTable } from "../components/inventory/PartsTable";
import { PrebuiltInventoryTable } from "../components/inventory/PrebuiltInventoryTable";
import { ExtraTemplatesPage } from "./ExtraTemplatesPage";
import { useParts } from "../hooks/useParts";
import {
  OS_PART_CONDITION,
  PART_CATEGORIES,
  PART_CONDITIONS,
  isNonStockCategory,
  isPrebuiltPc,
  partCategoryLabel,
  type Part,
  type PartCatalogEntry,
  type PartCategory,
  type PartCondition,
  type PartFormValues,
  type PartPayload,
  type PendingCatalogStockPick
} from "../types/part";
import { calculateSalePrice } from "../utils/pricing";
import {
  filterPartsForInventoryPdf,
  getListedInventoryParts,
  inventoryPdfScopeLabel,
  type InventoryPdfScope
} from "../utils/inventoryPdfExport";
import {
  computePhysicalInventoryDebugStats,
  physicalShelfTotals
} from "../utils/physicalInventoryShelf";
import { PRIMARY_ACTION_BUTTON_COMPACT, SECONDARY_BUTTON_SM } from "../theme/actionButtons";
import {
  SUMMARY_CARD_GRID,
  SUMMARY_CARD_LABEL,
  SUMMARY_CARD_SHELL,
  SUMMARY_VALUE_NEGATIVE,
  SUMMARY_VALUE_NEUTRAL,
  SUMMARY_VALUE_PROFIT_POS,
  SUMMARY_VALUE_REVENUE
} from "../theme/summaryCards";
import { PAGE_HERO, PAGE_OUTER_6XL } from "../theme/layoutDensity";
import { StatusBadge } from "../components/ui/StatusBadge";

function finiteNonNegative(n: number, fallback: number): number {
  if (!Number.isFinite(n) || n < 0) return fallback;
  return n;
}

function toPayload(values: PartFormValues): PartPayload {
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

function coerceMoney(v: number | string | null | undefined): number {
  if (v == null) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const n = parseFloat(String(v));
  return Number.isFinite(n) ? n : 0;
}

/** Montajes confirmados = PC terminado en almacén (coste/venta del montaje, sin duplicar piezas ya descontadas del stock). */
function inventorySummaryWithBuilds(parts: Part[], builds: Build[]) {
  const shelf = physicalShelfTotals(parts);
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

function listedInInventory(part: Part): boolean {
  if (part.inventoryKind === "PREBUILT_PC") return part.stock > 0;
  if (!part.category) return part.stock > 0;
  return part.stock > 0 || isNonStockCategory(part.category);
}

function money(value: number): string {
  return `${value.toFixed(2)} EUR`;
}

function formatShortDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return "";
  }
}

type KindFilter = "ALL" | "PART" | "PREBUILT_PC";
type StockFilter = "ALL" | "IN_STOCK" | "OUT_OF_STOCK";

type InventoryTabId = "summary" | "stock" | "catalog" | "services" | "components" | "prebuilt";

const TAB_QUERY = "tab";
const NUEVA_QUERY = "nueva";

function parseInventoryTab(value: string | null): InventoryTabId | null {
  if (!value) return null;
  const allowed: InventoryTabId[] = ["summary", "stock", "catalog", "services", "components", "prebuilt"];
  return (allowed as string[]).includes(value) ? (value as InventoryTabId) : null;
}

const INVENTORY_TABS: { id: InventoryTabId; label: string }[] = [
  { id: "summary", label: "Resumen" },
  { id: "catalog", label: "Nueva pieza" },
  { id: "stock", label: "Añadir unidades" },
  { id: "components", label: "Componentes" },
  { id: "prebuilt", label: "PCs completos" },
  { id: "services", label: "Servicios" }
];

type CatalogNuevaMode = "parte" | "extra";

type GoToTabOptions = {
  nueva?: CatalogNuevaMode | null;
};

/** Paginación cards móvil (< md): más piezas por página. ≥ md: valor anterior para la porción paginada (tabla desktop no la usa). */
const INVENTORY_MOBILE_PAGE_SIZE = 12;
const INVENTORY_WIDE_PAGE_SIZE = 8;

export function InventoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    parts,
    loading,
    error,
    submitting,
    deletingId,
    createPart,
    createStockFromCatalog,
    updatePart,
    deletePart,
    reload
  } = useParts();
  const [builds, setBuilds] = useState<Build[]>([]);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [activeTab, setActiveTab] = useState<InventoryTabId>("summary");
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<KindFilter>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<PartCategory | "ALL">("ALL");
  const [conditionFilter, setConditionFilter] = useState<PartCondition | "ALL">("ALL");
  const [stockFilter, setStockFilter] = useState<StockFilter>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [isNarrowViewport, setIsNarrowViewport] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches
  );

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
  const [pendingCatalogPick, setPendingCatalogPick] = useState<PendingCatalogStockPick | null>(null);

  /** Acordeón «Nuevo PC completo» en pestaña Nueva pieza (plegado por defecto). */
  const [catalogPrebuiltAccordionOpen, setCatalogPrebuiltAccordionOpen] = useState(false);

  const [pdfScope, setPdfScope] = useState<InventoryPdfScope>("ALL");
  const [pdfExportCategory, setPdfExportCategory] = useState<PartCategory>("CPU");
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const goToTab = useCallback(
    (id: InventoryTabId, options?: GoToTabOptions) => {
      setActiveTab(id);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          const prevTab = prev.get(TAB_QUERY);
          if (id === "summary") {
            next.delete(TAB_QUERY);
            next.delete(NUEVA_QUERY);
          } else {
            next.set(TAB_QUERY, id);
            if (id !== "catalog") {
              next.delete(NUEVA_QUERY);
            } else {
              if (options?.nueva === "extra") next.set(NUEVA_QUERY, "extra");
              else if (options?.nueva === "parte") next.set(NUEVA_QUERY, "parte");
              else if (options?.nueva === null) next.delete(NUEVA_QUERY);
              else if (prevTab !== "catalog") next.set(NUEVA_QUERY, "parte");
            }
          }
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const tabFromUrl = useMemo(() => {
    const raw = searchParams.get(TAB_QUERY);
    if (raw === "extraTemplates") return "catalog";
    return parseInventoryTab(raw);
  }, [searchParams]);

  const catalogNuevaMode = useMemo((): CatalogNuevaMode => {
    return searchParams.get(NUEVA_QUERY) === "extra" ? "extra" : "parte";
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get(TAB_QUERY) !== "extraTemplates") return;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set(TAB_QUERY, "catalog");
        next.set(NUEVA_QUERY, "extra");
        return next;
      },
      { replace: true }
    );
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (tabFromUrl) setActiveTab(tabFromUrl);
  }, [tabFromUrl]);

  useEffect(() => {
    if (selectedPart) {
      goToTab("catalog", { nueva: "parte" });
    }
  }, [selectedPart, goToTab]);

  const consumePendingCatalogPick = useCallback(() => {
    setPendingCatalogPick(null);
  }, []);

  const handleCatalogPartCreated = useCallback(
    (created: PartCatalogEntry, meta: { condition: PartCondition }) => {
      setCatalogRefreshSignal((n) => n + 1);
      setPendingCatalogPick({ catalog: created, condition: meta.condition });
      goToTab("stock");
    },
    [goToTab]
  );

  const highlightPartId = searchParams.get("highlightPart");
  useEffect(() => {
    if (!highlightPartId) return;
    if (parts.length === 0) return;
    const part = parts.find((p) => p.id === highlightPartId);
    const clearParam = () =>
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete("highlightPart");
          return next;
        },
        { replace: true }
      );
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
    } catch {
      setBuilds([]);
    }
  }, []);

  useEffect(() => {
    void refreshBuilds();
  }, [refreshBuilds]);

  const handleSubmit = async (values: PartFormValues) => {
    const payload = toPayload(values);
    if (selectedPart) {
      await updatePart(selectedPart.id, payload);
      setSelectedPart(null);
      return;
    }
    await createPart(payload);
  };

  const handleDelete = async (part: Part) => {
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

  const inventorySummaryDebug = useMemo(() => computePhysicalInventoryDebugStats(parts), [parts]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    console.debug("[SecondByte] Resumen inventario (solo stock físico)", inventorySummaryDebug);
  }, [inventorySummaryDebug]);

  const partsListed = useMemo(() => {
    return parts.filter((part) => listedInInventory(part));
  }, [parts]);

  const filteredParts = useMemo(() => {
    return partsListed.filter((part) => {
      const matchesQuery = part.name.toLowerCase().includes(query.trim().toLowerCase());
      const matchesKind = kindFilter === "ALL" || part.inventoryKind === kindFilter;
      const matchesCategory =
        categoryFilter === "ALL" ||
        (part.category !== null && part.category === categoryFilter);
      const matchesCondition = conditionFilter === "ALL" || part.condition === conditionFilter;

      let matchesStock = true;
      if (stockFilter === "IN_STOCK") {
        matchesStock =
          part.stock > 0 ||
          (part.inventoryKind === "PART" && part.category !== null && isNonStockCategory(part.category));
      } else if (stockFilter === "OUT_OF_STOCK") {
        matchesStock =
          part.stock === 0 &&
          !(part.inventoryKind === "PART" && part.category !== null && isNonStockCategory(part.category));
      }

      return matchesQuery && matchesKind && matchesCategory && matchesCondition && matchesStock;
    });
  }, [partsListed, query, kindFilter, categoryFilter, conditionFilter, stockFilter]);

  const partPieces = useMemo(
    () => filteredParts.filter((p) => p.inventoryKind === "PART"),
    [filteredParts]
  );
  const partPrebuilt = useMemo(
    () => filteredParts.filter((p) => p.inventoryKind === "PREBUILT_PC"),
    [filteredParts]
  );

  const categoryOrder = useMemo(
    () => new Map(PART_CATEGORIES.map((category, index) => [category, index])),
    []
  );

  const sortedPieceParts = useMemo(() => {
    return [...partPieces].sort((a, b) => {
      const ca = a.category ?? "OTHER";
      const cb = b.category ?? "OTHER";
      const orderA = categoryOrder.get(ca as PartCategory) ?? 999;
      const orderB = categoryOrder.get(cb as PartCategory) ?? 999;
      if (orderA !== orderB) return orderA - orderB;
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

  const hasActiveFilters =
    query.trim().length > 0 ||
    kindFilter !== "ALL" ||
    categoryFilter !== "ALL" ||
    conditionFilter !== "ALL" ||
    stockFilter !== "ALL";

  /** Suma de stock físico por categoría (solo piezas PART; OS/LABOR excluidas). */
  const categoryStockTotals = useMemo(() => {
    const map = new Map<PartCategory, number>();
    for (const p of partsListed) {
      if (p.inventoryKind !== "PART") continue;
      const cat = (p.category ?? "OTHER") as PartCategory;
      if (isNonStockCategory(cat)) continue;
      map.set(cat, (map.get(cat) ?? 0) + p.stock);
    }
    return map;
  }, [partsListed]);

  const lowStockCategories = useMemo(() => {
    const rows: { category: PartCategory; total: number }[] = [];
    for (const [category, total] of categoryStockTotals) {
      if (total < LOW_STOCK_CATEGORY_THRESHOLD) {
        rows.push({ category, total });
      }
    }
    rows.sort((a, b) => {
      if (a.total !== b.total) return a.total - b.total;
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

  const hasPrebuiltLines = useMemo(
    () => partsListed.some((p) => p.inventoryKind === "PREBUILT_PC"),
    [partsListed]
  );

  const prebuiltStockLow =
    hasPrebuiltLines && prebuiltStockTotal < LOW_STOCK_CATEGORY_THRESHOLD;

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

  const handleDownloadInventoryPdf = useCallback(async () => {
    setPdfGenerating(true);
    setPdfError(null);
    try {
      const listed = getListedInventoryParts(parts);
      const filtered = filterPartsForInventoryPdf(
        listed,
        pdfScope,
        pdfScope === "CATEGORY" ? pdfExportCategory : null
      );
      const exportedAtIso = new Date().toISOString();
      const scopeDescription = inventoryPdfScopeLabel(
        pdfScope,
        pdfScope === "CATEGORY" ? pdfExportCategory : null
      );
      const [{ pdf }, { InventoryPdfDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("../components/inventory/InventoryPdfDocument")
      ]);
      const blob = await pdf(
        <InventoryPdfDocument
          parts={filtered}
          exportedAtIso={exportedAtIso}
          scopeDescription={scopeDescription}
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const stamp = exportedAtIso.slice(0, 16).replace(/[-:T]/g, "");
      a.href = url;
      a.download = `inventario-secondbyte-${stamp}.pdf`;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : "No se pudo generar el PDF.");
    } finally {
      setPdfGenerating(false);
    }
  }, [parts, pdfExportCategory, pdfScope]);

  const tabButtonClass = (id: InventoryTabId) =>
    [
      "shrink-0 snap-start whitespace-nowrap rounded-t-lg border border-b-0 px-3 py-2 text-sm font-semibold transition md:px-4",
      activeTab === id
        ? "border-slate-700 bg-slate-900 text-slate-100 shadow-sm"
        : "border-transparent bg-slate-950/50 text-slate-400 hover:bg-slate-900/60 hover:text-slate-200"
    ].join(" ");

  return (
    <div className={PAGE_OUTER_6XL}>
      <section
        className={`${PAGE_HERO} flex flex-col gap-4 md:flex-row md:items-start md:justify-between`}
      >
        <h1 className="text-3xl font-bold tracking-tight">Inventario</h1>
        <div className="flex w-full max-w-xl flex-col gap-2 rounded-xl border border-slate-800 bg-slate-950/50 p-3 md:max-w-lg md:shrink-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Exportar PDF</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
            <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs font-medium text-slate-400">
              Alcance
              <select
                value={pdfScope}
                onChange={(e) => setPdfScope(e.target.value as InventoryPdfScope)}
                className="min-h-[40px] rounded-lg border border-slate-700 bg-slate-950/80 px-2 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400"
              >
                <option value="ALL">Todo el inventario</option>
                <option value="CATEGORY">Solo una categoría</option>
                <option value="LOW_STOCK">Solo stock bajo</option>
                <option value="PREBUILT_ONLY">Solo PCs completos</option>
              </select>
            </label>
            <label
              className={`flex min-w-0 flex-1 flex-col gap-1 text-xs font-medium text-slate-400 ${pdfScope === "CATEGORY" ? "" : "opacity-45"}`}
            >
              Categoría
              <select
                value={pdfExportCategory}
                onChange={(e) => setPdfExportCategory(e.target.value as PartCategory)}
                disabled={pdfScope !== "CATEGORY"}
                className="min-h-[40px] rounded-lg border border-slate-700 bg-slate-950/80 px-2 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400 disabled:cursor-not-allowed"
              >
                {PART_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {partCategoryLabel(c)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void handleDownloadInventoryPdf()}
              disabled={loading || pdfGenerating || parts.length === 0}
              className={PRIMARY_ACTION_BUTTON_COMPACT}
            >
              {pdfGenerating ? "Generando…" : "Exportar PDF"}
            </button>
          </div>
          {pdfError ? <p className="text-xs text-rose-300">{pdfError}</p> : null}
        </div>
      </section>

      {error ? (
        <div className="flex flex-col gap-3 rounded-xl border border-rose-800/70 bg-rose-950/40 px-4 py-3 text-sm text-rose-200 md:flex-row md:items-center md:justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => {
              void reload();
              void refreshBuilds();
            }}
            className="rounded-lg border border-rose-700 bg-rose-900/50 px-3 py-1.5 font-semibold text-rose-100 transition hover:bg-rose-800/70"
          >
            Reintentar
          </button>
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-1.5 shadow-inner shadow-black/30 md:p-2">
        <div
          className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0 md:pb-0"
          role="tablist"
          aria-label="Secciones de inventario"
        >
          {INVENTORY_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`inventory-tab-${tab.id}`}
              aria-selected={activeTab === tab.id}
              aria-controls={`inventory-panel-${tab.id}`}
              tabIndex={activeTab === tab.id ? 0 : -1}
              className={tabButtonClass(tab.id)}
              onClick={() => goToTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <section
        id="inventory-panel-summary"
        role="tabpanel"
        aria-labelledby="inventory-tab-summary"
        hidden={activeTab !== "summary"}
        className={activeTab === "summary" ? "space-y-4" : "hidden"}
      >
        <div className={SUMMARY_CARD_GRID}>
          <article className={SUMMARY_CARD_SHELL}>
            <p className={SUMMARY_CARD_LABEL}>Coste total</p>
            <p className={SUMMARY_VALUE_NEUTRAL}>{money(totals.totalCostValue)}</p>
          </article>
          <article className={SUMMARY_CARD_SHELL}>
            <p className={SUMMARY_CARD_LABEL}>Venta estimada</p>
            <p className={SUMMARY_VALUE_REVENUE}>{money(totals.totalSaleValue)}</p>
          </article>
          <article className={SUMMARY_CARD_SHELL}>
            <p className={SUMMARY_CARD_LABEL}>Beneficio</p>
            <p className={totals.potentialProfit >= 0 ? SUMMARY_VALUE_PROFIT_POS : SUMMARY_VALUE_NEGATIVE}>
              {money(totals.potentialProfit)}
            </p>
          </article>
          <article className={SUMMARY_CARD_SHELL}>
            <p className={SUMMARY_CARD_LABEL}>Unidades</p>
            <p className={SUMMARY_VALUE_NEUTRAL}>{totals.units}</p>
          </article>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <article className="rounded-xl border border-amber-500/25 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/40 md:p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-base font-semibold text-slate-100">Stock bajo</h2>
            </div>
            {lowStockCategories.length === 0 && !prebuiltStockLow ? (
              <p className="mt-3 text-sm text-slate-400">Sin avisos.</p>
            ) : (
              <>
                <ul className="mt-3 max-h-52 space-y-2 overflow-y-auto text-sm">
                  {lowStockCategories.map(({ category, total }) => (
                    <li
                      key={category}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800/80 bg-slate-950/40 px-3 py-2"
                    >
                      <span className="min-w-0 font-medium text-slate-200">
                        {partCategoryLabel(category)}
                      </span>
                      <span className="shrink-0 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-200">
                        {total} u. en categoría
                      </span>
                    </li>
                  ))}
                  {prebuiltStockLow ? (
                    <li className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800/80 bg-slate-950/40 px-3 py-2">
                      <span className="min-w-0 font-medium text-slate-200">PCs completos (premontados)</span>
                      <span className="shrink-0 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-200">
                        {prebuiltStockTotal} u. en total
                      </span>
                    </li>
                  ) : null}
                </ul>
              </>
            )}
          </article>

          <article className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/40 md:p-5">
            <h2 className="text-base font-semibold text-slate-100">Últimas actualizaciones</h2>
            {recentParts.length === 0 ? (
              <p className="mt-3 text-sm text-slate-400">Sin datos todavia.</p>
            ) : (
              <ul className="mt-3 max-h-52 space-y-2 overflow-y-auto text-sm">
                {recentParts.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedPart(p)}
                      className="flex w-full flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800/80 bg-slate-950/40 px-3 py-2 text-left transition hover:border-indigo-500/35 hover:bg-slate-900/80"
                    >
                      <span className="min-w-0 flex-1 font-medium text-slate-200">{p.name}</span>
                      <span className="flex shrink-0 flex-wrap items-center gap-2">
                        <StatusBadge
                          variant={isPrebuiltPc(p) ? "prebuilt" : "neutral"}
                          size="table"
                          className="uppercase tracking-wide"
                        >
                          {isPrebuiltPc(p) ? "PC" : "Pieza"}
                        </StatusBadge>
                        <span className="text-xs text-slate-500">{formatShortDate(p.updatedAt)}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </div>
      </section>

      <section
        id="inventory-panel-catalog"
        role="tabpanel"
        aria-labelledby="inventory-tab-catalog"
        hidden={activeTab !== "catalog"}
        className={activeTab === "catalog" ? "space-y-4" : "hidden"}
      >
        {!selectedPart ? (
          <div
            className="flex w-full max-w-lg rounded-lg border border-slate-800 bg-slate-950/50 p-1"
            role="group"
            aria-label="Tipo de alta en catálogo"
          >
            <button
              type="button"
              aria-pressed={catalogNuevaMode === "parte"}
              onClick={() => goToTab("catalog", { nueva: "parte" })}
              className={[
                "flex-1 rounded-md px-3 py-2 text-sm font-semibold transition",
                catalogNuevaMode === "parte"
                  ? "bg-slate-800 text-slate-100 shadow-sm"
                  : "text-slate-400 hover:bg-slate-900/60 hover:text-slate-200"
              ].join(" ")}
            >
              Pieza física
            </button>
            <button
              type="button"
              aria-pressed={catalogNuevaMode === "extra"}
              onClick={() => goToTab("catalog", { nueva: "extra" })}
              className={[
                "flex-1 rounded-md px-3 py-2 text-sm font-semibold transition",
                catalogNuevaMode === "extra"
                  ? "bg-slate-800 text-slate-100 shadow-sm"
                  : "text-slate-400 hover:bg-slate-900/60 hover:text-slate-200"
              ].join(" ")}
            >
              Extra sin stock (montajes)
            </button>
          </div>
        ) : null}

        {catalogNuevaMode === "extra" && !selectedPart ? (
          <ExtraTemplatesPage
            embedded
            mode="extra"
            onTemplatesChanged={() => setCatalogRefreshSignal((n) => n + 1)}
          />
        ) : (
          <>
            {!selectedPart && catalogNuevaMode === "parte" ? (
              <p className="text-sm leading-relaxed text-slate-400">
                Crea una pieza reutilizable una sola vez. Luego podrás añadir unidades rápidamente desde{" "}
                <span className="font-medium text-slate-300">Añadir unidades</span>.
              </p>
            ) : null}

            <NewCatalogPartForm onSuccess={handleCatalogPartCreated} />

            {selectedPart ? (
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/40 md:p-5">
                <p className="text-sm text-slate-400">
                  Edición de una línea de inventario existente (stock físico). Las piezas sueltas nuevas deben crearse
                  como plantilla arriba y luego darse de alta en{" "}
                  <span className="font-medium text-slate-300">Añadir unidades</span>.
                </p>
                <div className="mt-3">
                  <PartForm
                    selectedPart={selectedPart}
                    submitting={submitting}
                    onSubmit={handleSubmit}
                    onCancelEdit={() => setSelectedPart(null)}
                    className="border-0 bg-transparent p-0 shadow-none"
                  />
                </div>
              </div>
            ) : (
              <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/80 shadow-lg shadow-slate-950/40 backdrop-blur">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 border-b border-slate-800 bg-slate-950/20 px-3.5 py-3 text-left transition hover:bg-slate-900/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400/50 md:px-4"
                  onClick={() => setCatalogPrebuiltAccordionOpen((open) => !open)}
                  aria-expanded={catalogPrebuiltAccordionOpen}
                  aria-controls="catalog-prebuilt-pc-panel"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-semibold text-slate-100">Nuevo PC completo en inventario</span>
                    <span className="mt-0.5 block text-xs font-normal text-slate-500">
                      Alta directa en stock · sin plantilla de catálogo
                    </span>
                  </span>
                  <svg
                    className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 ${catalogPrebuiltAccordionOpen ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    aria-hidden
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div
                  id="catalog-prebuilt-pc-panel"
                  hidden={!catalogPrebuiltAccordionOpen}
                  className="border-t border-slate-800 px-3.5 pb-4 pt-3 md:px-4 md:pb-5 md:pt-4"
                >
                  <p className="text-sm text-slate-400">
                    Los PCs completos no usan plantillas del catálogo de piezas; se dan de alta directamente en
                    inventario.
                  </p>
                  <div className="mt-3">
                    <PartForm
                      selectedPart={null}
                      submitting={submitting}
                      onSubmit={handleSubmit}
                      onCancelEdit={() => setSelectedPart(null)}
                      createInventoryKindDefault="PREBUILT_PC"
                      className="border-0 bg-transparent p-0 shadow-none"
                    />
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </section>

      <section
        id="inventory-panel-services"
        role="tabpanel"
        aria-labelledby="inventory-tab-services"
        hidden={activeTab !== "services"}
        className={activeTab === "services" ? "space-y-4" : "hidden"}
      >
        <ExtraTemplatesPage
          embedded
          mode="service"
          onTemplatesChanged={() => setCatalogRefreshSignal((n) => n + 1)}
        />
      </section>

      <section
        id="inventory-panel-stock"
        role="tabpanel"
        aria-labelledby="inventory-tab-stock"
        hidden={activeTab !== "stock"}
        className={activeTab === "stock" ? "space-y-3" : "hidden"}
      >
        <AddStockFromCatalogSection
          submitting={submitting}
          onRegisterStock={createStockFromCatalog}
          catalogRefreshSignal={catalogRefreshSignal}
          pendingCatalogPick={pendingCatalogPick}
          onPendingCatalogPickConsumed={consumePendingCatalogPick}
          onRequestCreateNewPart={() => goToTab("catalog", { nueva: "parte" })}
        />
      </section>

      <section
        id="inventory-panel-components"
        role="tabpanel"
        aria-labelledby="inventory-tab-components"
        hidden={activeTab !== "components"}
        className={activeTab === "components" ? "space-y-3" : "hidden"}
      >
        <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/80 shadow-lg shadow-slate-950/40 backdrop-blur">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 border-b border-slate-800 bg-slate-950/20 px-3.5 py-3 text-left transition hover:bg-slate-900/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400/50 md:px-4"
            onClick={() => setComponentsFiltersOpen((open) => !open)}
            aria-expanded={componentsFiltersOpen}
            aria-controls="inventory-components-filters-panel"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-base font-semibold text-slate-100">Filtros de búsqueda</span>
              <span className="mt-0.5 block text-xs font-normal text-slate-500">
                {sortedPieceParts.length} piezas
                {hasActiveFilters ? " · hay filtros activos" : ""}
              </span>
            </span>
            <svg
              className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 ${componentsFiltersOpen ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {componentsFiltersOpen ? (
            <div id="inventory-components-filters-panel">
              <div className="px-3.5 pb-3 pt-1 md:px-4 md:pb-4 md:pt-2">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-6 lg:gap-2.5">
                  <label className="flex min-w-0 flex-col gap-1.5 text-sm font-medium text-slate-200 lg:col-span-2">
                    Buscar por nombre
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Ej: RTX, Ryzen, SSD..."
                      className="min-h-[42px] w-full min-w-0 rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-base text-slate-100 outline-none ring-indigo-400/60 placeholder:text-slate-500 focus:border-indigo-400 focus:ring sm:text-sm"
                    />
                  </label>

                  <label className="flex min-w-0 flex-col gap-1.5 text-sm font-medium text-slate-200">
                    Tipo
                    <select
                      value={kindFilter}
                      onChange={(event) => setKindFilter(event.target.value as KindFilter)}
                      className="min-h-[42px] w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-base text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring sm:text-sm"
                    >
                      <option value="ALL">Todos</option>
                      <option value="PART">Piezas</option>
                      <option value="PREBUILT_PC">PCs completos</option>
                    </select>
                  </label>

                  <label className="flex min-w-0 flex-col gap-1.5 text-sm font-medium text-slate-200">
                    Categoria
                    <select
                      value={categoryFilter}
                      onChange={(event) => setCategoryFilter(event.target.value as PartCategory | "ALL")}
                      className="min-h-[42px] w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-base text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring sm:text-sm"
                    >
                      <option value="ALL">Todas</option>
                      {PART_CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {partCategoryLabel(category)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex min-w-0 flex-col gap-1.5 text-sm font-medium text-slate-200">
                    Estado
                    <select
                      value={conditionFilter}
                      onChange={(event) => setConditionFilter(event.target.value as PartCondition | "ALL")}
                      className="min-h-[42px] w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-base text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring sm:text-sm"
                    >
                      <option value="ALL">Todos</option>
                      {PART_CONDITIONS.map((condition) => (
                        <option key={condition} value={condition}>
                          {condition}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex min-w-0 flex-col gap-1.5 text-sm font-medium text-slate-200">
                    Stock
                    <select
                      value={stockFilter}
                      onChange={(event) => setStockFilter(event.target.value as StockFilter)}
                      className="min-h-[42px] w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-base text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring sm:text-sm"
                    >
                      <option value="ALL">Todos</option>
                      <option value="IN_STOCK">Con stock</option>
                      <option value="OUT_OF_STOCK">Sin stock</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="flex flex-col gap-2.5 border-t border-slate-800 px-3.5 py-2.5 md:flex-row md:items-center md:justify-between md:px-4">
                <p className="text-sm font-medium text-slate-200">{sortedPieceParts.length} piezas</p>
                <button
                  type="button"
                  onClick={clearFilters}
                  disabled={!hasActiveFilters}
                  className={`${SECONDARY_BUTTON_SM} min-h-[40px] disabled:cursor-not-allowed`}
                >
                  Limpiar filtros
                </button>
              </div>
            </div>
          ) : null}
        </section>

        <div className="space-y-3">
          <PartsTable
            parts={sortedPieceParts}
            partsMobilePage={paginatedPieces}
            compact
            loading={loading}
            deletingId={deletingId}
            categoryStockTotals={categoryStockTotals}
            categoryStockThreshold={LOW_STOCK_CATEGORY_THRESHOLD}
            onEdit={setSelectedPart}
            emptyMessage={
              hasActiveFilters ? "No hay piezas que coincidan con los filtros." : undefined
            }
            onDelete={(part) => {
              void handleDelete(part);
            }}
          />
        </div>

        {!loading && sortedPieceParts.length > 0 ? (
          <section className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-3 shadow-lg shadow-slate-950/40 md:hidden">
            <p className="text-sm text-slate-300">
              Página {currentPage} de {totalPages} (piezas)
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className={`${SECONDARY_BUTTON_SM} min-h-[40px] px-3 py-2 disabled:cursor-not-allowed`}
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className={`${SECONDARY_BUTTON_SM} min-h-[40px] px-3 py-2 disabled:cursor-not-allowed`}
              >
                Siguiente
              </button>
            </div>
          </section>
        ) : null}
      </section>

      <section
        id="inventory-panel-prebuilt"
        role="tabpanel"
        aria-labelledby="inventory-tab-prebuilt"
        hidden={activeTab !== "prebuilt"}
        className={activeTab === "prebuilt" ? "space-y-3" : "hidden"}
      >
        {kindFilter === "PART" ? (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            Cambia el filtro <strong>Tipo</strong> (no &quot;Piezas&quot;) o pulsa Limpiar filtros para ver PCs completos.
          </div>
        ) : null}

        <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/80 shadow-lg shadow-slate-950/40 backdrop-blur">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 border-b border-slate-800 bg-slate-950/20 px-3.5 py-3 text-left transition hover:bg-slate-900/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400/50 md:hidden"
            onClick={() => setPrebuiltFiltersOpen((open) => !open)}
            aria-expanded={prebuiltFiltersOpen}
            aria-controls="inventory-prebuilt-filters-panel"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-base font-semibold text-slate-100">Filtros</span>
              <span className="mt-0.5 block text-xs font-normal text-slate-500">
                {partPrebuilt.length} PCs completos
                {hasActiveFilters ? " · hay filtros activos" : ""}
              </span>
            </span>
            <svg
              className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 ${prebuiltFiltersOpen ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <div
            id="inventory-prebuilt-filters-panel"
            className={prebuiltFiltersOpen ? "" : "max-md:hidden"}
          >
            <div className="px-3.5 py-3 md:px-4 md:py-4">
              <h2 className="mb-2.5 hidden text-lg font-semibold text-slate-100 md:block">Filtros</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <label className="flex min-w-0 flex-col gap-1.5 text-sm font-medium text-slate-200">
                  Buscar por nombre
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Nombre del equipo..."
                    className="min-h-[42px] w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-base text-slate-100 outline-none ring-indigo-400/60 placeholder:text-slate-500 focus:border-indigo-400 focus:ring sm:text-sm"
                  />
                </label>
                <label className="flex min-w-0 flex-col gap-1.5 text-sm font-medium text-slate-200">
                  Estado
                  <select
                    value={conditionFilter}
                    onChange={(event) => setConditionFilter(event.target.value as PartCondition | "ALL")}
                    className="min-h-[42px] w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-base text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring sm:text-sm"
                  >
                    <option value="ALL">Todos</option>
                    {PART_CONDITIONS.map((condition) => (
                      <option key={condition} value={condition}>
                        {condition}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex min-w-0 flex-col gap-1.5 text-sm font-medium text-slate-200">
                  Stock
                  <select
                    value={stockFilter}
                    onChange={(event) => setStockFilter(event.target.value as StockFilter)}
                    className="min-h-[42px] w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-base text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring sm:text-sm"
                  >
                    <option value="ALL">Todos</option>
                    <option value="IN_STOCK">Con stock</option>
                    <option value="OUT_OF_STOCK">Sin stock</option>
                  </select>
                </label>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-4">
                <p className="text-sm text-slate-300">{partPrebuilt.length} PC(s) mostrado(s)</p>
                <button
                  type="button"
                  onClick={clearFilters}
                  disabled={!hasActiveFilters}
                  className={`${SECONDARY_BUTTON_SM} min-h-[40px] disabled:cursor-not-allowed`}
                >
                  Limpiar filtros
                </button>
              </div>
            </div>
          </div>
        </section>

        <PrebuiltInventoryTable
          items={partPrebuilt}
          compact
          loading={loading}
          deletingId={deletingId}
          onEdit={setSelectedPart}
          emptyMessage={
            hasActiveFilters ? "No hay PCs completos que coincidan con los filtros." : undefined
          }
          onDelete={(part) => {
            void handleDelete(part);
          }}
        />
      </section>
    </div>
  );
}
