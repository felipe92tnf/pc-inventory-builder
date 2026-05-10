import { useEffect, useMemo, useState } from "react";
import { PartForm } from "../components/inventory/PartForm";
import { PartsTable } from "../components/inventory/PartsTable";
import { PrebuiltInventoryTable } from "../components/inventory/PrebuiltInventoryTable";
import { useParts } from "../hooks/useParts";
import {
  OS_PART_CONDITION,
  PART_CATEGORIES,
  PART_CONDITIONS,
  isNonStockCategory,
  partCategoryLabel,
  type Part,
  type PartCategory,
  type PartCondition,
  type PartFormValues,
  type PartPayload
} from "../types/part";
import { calculateSalePrice } from "../utils/pricing";

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

function inventoryTotals(parts: Part[]) {
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

function listedInInventory(part: Part): boolean {
  if (part.inventoryKind === "PREBUILT_PC") return true;
  if (!part.category) return part.stock > 0;
  return part.stock > 0 || isNonStockCategory(part.category);
}

function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function money(value: number): string {
  return `${value.toFixed(2)} EUR`;
}

type KindFilter = "ALL" | "PART" | "PREBUILT_PC";
type StockFilter = "ALL" | "IN_STOCK" | "OUT_OF_STOCK";

export function InventoryPage() {
  const { parts, loading, error, submitting, deletingId, createPart, updatePart, deletePart, reload } = useParts();
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<KindFilter>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<PartCategory | "ALL">("ALL");
  const [conditionFilter, setConditionFilter] = useState<PartCondition | "ALL">("ALL");
  const [stockFilter, setStockFilter] = useState<StockFilter>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const [mobileFormOpen, setMobileFormOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    if (selectedPart) {
      setMobileFormOpen(true);
    }
  }, [selectedPart]);

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

  const totals = useMemo(() => inventoryTotals(parts), [parts]);

  const partsListed = useMemo(() => parts.filter(listedInInventory), [parts]);

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
          part.stock > 0 || (part.inventoryKind === "PART" && part.category !== null && isNonStockCategory(part.category));
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
  }, [sortedPieceParts, currentPage]);

  const hasActiveFilters =
    query.trim().length > 0 ||
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

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-2 pb-8 text-slate-100 md:px-4">
      <section className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 shadow-[0_20px_50px_-24px_rgba(79,70,229,0.75)]">
        <h1 className="text-2xl font-bold">Inventario</h1>
        <p className="mt-2 text-sm text-slate-300">
          Piezas sueltas para montajes y PCs completos / premontados listos para vender.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/40">
          <p className="text-xs uppercase tracking-wide text-slate-400">Valor coste total</p>
          <p className="mt-1 text-xl font-bold text-slate-100">{money(totals.totalCostValue)}</p>
        </article>
        <article className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/40">
          <p className="text-xs uppercase tracking-wide text-slate-400">Valor venta estimado</p>
          <p className="mt-1 text-xl font-bold text-emerald-300/95">{money(totals.totalSaleValue)}</p>
        </article>
        <article className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/40">
          <p className="text-xs uppercase tracking-wide text-slate-400">Beneficio potencial</p>
          <p
            className={`mt-1 text-xl font-bold ${totals.potentialProfit >= 0 ? "text-emerald-300" : "text-rose-300"}`}
          >
            {money(totals.potentialProfit)}
          </p>
        </article>
        <article className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/40">
          <p className="text-xs uppercase tracking-wide text-slate-400">Unidades en stock</p>
          <p className="mt-1 text-xl font-bold text-slate-100">{totals.units}</p>
        </article>
      </section>

      {error ? (
        <div className="flex flex-col gap-3 rounded-xl border border-rose-800/70 bg-rose-950/40 px-4 py-3 text-sm text-rose-200 md:flex-row md:items-center md:justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => {
              void reload();
            }}
            className="rounded-lg border border-rose-700 bg-rose-900/50 px-3 py-1.5 font-semibold text-rose-100 transition hover:bg-rose-800/70"
          >
            Reintentar
          </button>
        </div>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-lg shadow-slate-950/40 md:border-0 md:bg-transparent md:shadow-none">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 border-b border-slate-800 px-4 py-3.5 text-left text-slate-100 md:hidden"
          onClick={() => setMobileFormOpen((v) => !v)}
          aria-expanded={showFormOnMobile}
          aria-controls="inventory-part-form-panel"
        >
          <span className="text-sm font-semibold">{formTitleMobile}</span>
          <ChevronDown open={showFormOnMobile} />
        </button>
        <div
          id="inventory-part-form-panel"
          className={showFormOnMobile ? "block" : "hidden md:block"}
        >
          <PartForm
            selectedPart={selectedPart}
            submitting={submitting}
            onSubmit={handleSubmit}
            onCancelEdit={() => setSelectedPart(null)}
            className="max-md:rounded-none max-md:border-0 max-md:bg-transparent max-md:shadow-none max-md:px-4 max-md:pb-5 max-md:pt-3"
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-lg shadow-slate-950/40 backdrop-blur">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 border-b border-slate-800 px-4 py-3.5 text-left md:hidden"
          onClick={() => setMobileFiltersOpen((v) => !v)}
          aria-expanded={showFiltersOnMobile}
          aria-controls="inventory-filters-panel"
        >
          <span className="text-sm font-semibold text-slate-100">Filtros de busqueda</span>
          <ChevronDown open={showFiltersOnMobile} />
        </button>

        <div
          id="inventory-filters-panel"
          className={`px-4 pb-4 pt-4 md:px-5 md:pb-5 md:pt-5 ${showFiltersOnMobile ? "block" : "hidden md:block"}`}
        >
          <h2 className="mb-4 hidden text-lg font-semibold text-slate-100 md:block">Filtros de busqueda</h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-6 lg:gap-3">
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

        <div className="flex flex-col gap-3 border-t border-slate-800 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-5">
          <p className="text-sm text-slate-300">
            {sortedPieceParts.length} pieza(s) y {partPrebuilt.length} PC(s) mostrado(s) (
            {filteredParts.length} de {partsListed.length} lineas)
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setKindFilter("ALL");
              setCategoryFilter("ALL");
              setConditionFilter("ALL");
              setStockFilter("ALL");
            }}
            disabled={!hasActiveFilters}
            className="min-h-[40px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Limpiar filtros
          </button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-100">Componentes</h2>
        <PartsTable
          parts={sortedPieceParts}
          partsMobilePage={paginatedPieces}
          loading={loading}
          deletingId={deletingId}
          onEdit={setSelectedPart}
          emptyMessage={
            hasActiveFilters ? "No hay piezas que coincidan con los filtros." : undefined
          }
          onDelete={(part) => {
            void handleDelete(part);
          }}
        />
      </section>

      {!loading && sortedPieceParts.length > 0 ? (
        <section className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 shadow-lg shadow-slate-950/40 md:hidden">
          <p className="text-sm text-slate-300">
            Pagina {currentPage} de {totalPages} (piezas)
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="min-h-[40px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-1.5 text-sm font-medium text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="min-h-[40px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-1.5 text-sm font-medium text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-100">PCs completos</h2>
        <PrebuiltInventoryTable
          items={partPrebuilt}
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
