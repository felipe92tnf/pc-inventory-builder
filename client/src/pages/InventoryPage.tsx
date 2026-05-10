import { useEffect, useMemo, useState } from "react";
import { PartForm } from "../components/inventory/PartForm";
import { PartsTable } from "../components/inventory/PartsTable";
import { useParts } from "../hooks/useParts";
import {
  PART_CATEGORIES,
  PART_CONDITIONS,
  type Part,
  type PartCategory,
  type PartCondition,
  type PartFormValues,
  type PartPayload
} from "../types/part";

function toPayload(values: PartFormValues): PartPayload {
  return {
    name: values.name.trim(),
    category: values.category,
    condition: values.condition,
    costPrice: values.costPrice,
    stock: values.stock,
    notes: values.notes.trim() ? values.notes.trim() : null
  };
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

export function InventoryPage() {
  const { parts, loading, error, submitting, deletingId, createPart, updatePart, deletePart, reload } = useParts();
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<PartCategory | "ALL">("ALL");
  const [conditionFilter, setConditionFilter] = useState<PartCondition | "ALL">("ALL");
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

  const partsWithStock = useMemo(() => parts.filter((part) => part.stock > 0), [parts]);

  const filteredParts = useMemo(() => {
    return partsWithStock.filter((part) => {
      const matchesQuery = part.name.toLowerCase().includes(query.trim().toLowerCase());
      const matchesCategory = categoryFilter === "ALL" || part.category === categoryFilter;
      const matchesCondition = conditionFilter === "ALL" || part.condition === conditionFilter;

      return matchesQuery && matchesCategory && matchesCondition;
    });
  }, [partsWithStock, query, categoryFilter, conditionFilter]);

  const categoryOrder = useMemo(
    () => new Map(PART_CATEGORIES.map((category, index) => [category, index])),
    []
  );

  const sortedFilteredParts = useMemo(() => {
    return [...filteredParts].sort((a, b) => {
      const orderA = categoryOrder.get(a.category) ?? 999;
      const orderB = categoryOrder.get(b.category) ?? 999;
      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name, "es", { sensitivity: "base" });
    });
  }, [filteredParts, categoryOrder]);

  const totalPages = Math.max(1, Math.ceil(sortedFilteredParts.length / pageSize));

  useEffect(() => {
    setCurrentPage(1);
  }, [query, categoryFilter, conditionFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedParts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedFilteredParts.slice(start, start + pageSize);
  }, [sortedFilteredParts, currentPage]);

  const hasActiveFilters =
    query.trim().length > 0 || categoryFilter !== "ALL" || conditionFilter !== "ALL";

  const showFormOnMobile = mobileFormOpen || selectedPart !== null;
  const showFiltersOnMobile = mobileFiltersOpen;

  const formTitleMobile = selectedPart ? "Editar pieza" : "Añadir nueva pieza";

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-2 pb-8 text-slate-100 md:px-4">
      <section className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 shadow-[0_20px_50px_-24px_rgba(79,70,229,0.75)]">
        <h1 className="text-2xl font-bold">Inventario de componentes</h1>
        <p className="mt-2 text-sm text-slate-300">
          Gestiona tus piezas nuevas y de segunda mano, con control de coste, venta y stock.
        </p>
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

      {/* Nueva pieza: acordeon movil, card en desktop */}
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

      {/* Filtros: acordeon movil */}
      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-lg shadow-slate-950/40 backdrop-blur">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 border-b border-slate-800 px-4 py-3.5 text-left md:hidden"
          onClick={() => setMobileFiltersOpen((v) => !v)}
          aria-expanded={showFiltersOnMobile}
          aria-controls="inventory-filters-panel"
        >
          <span className="text-sm font-semibold text-slate-100">Filtros de búsqueda</span>
          <ChevronDown open={showFiltersOnMobile} />
        </button>

        <div
          id="inventory-filters-panel"
          className={`px-4 pb-4 pt-4 md:px-5 md:pb-5 md:pt-5 ${showFiltersOnMobile ? "block" : "hidden md:block"}`}
        >
          <h2 className="mb-4 hidden text-lg font-semibold text-slate-100 md:block">Filtros de búsqueda</h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4 md:gap-3">
            <label className="flex min-w-0 flex-col gap-1.5 text-sm font-medium text-slate-200 md:col-span-2">
              Buscar por nombre
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Ej: RTX, Ryzen, SSD..."
                className="min-h-[42px] w-full min-w-0 rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-base text-slate-100 outline-none ring-indigo-400/60 placeholder:text-slate-500 focus:border-indigo-400 focus:ring sm:text-sm"
              />
            </label>

            <label className="flex min-w-0 flex-col gap-1.5 text-sm font-medium text-slate-200">
              Categoria
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value as PartCategory | "ALL")}
                className="min-h-[42px] w-full min-w-0 rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-base text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring sm:text-sm"
              >
                <option value="ALL">Todas</option>
                {PART_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex min-w-0 flex-col gap-1.5 text-sm font-medium text-slate-200">
              Estado
              <select
                value={conditionFilter}
                onChange={(event) => setConditionFilter(event.target.value as PartCondition | "ALL")}
                className="min-h-[42px] w-full min-w-0 rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-base text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring sm:text-sm"
              >
                <option value="ALL">Todos</option>
                {PART_CONDITIONS.map((condition) => (
                  <option key={condition} value={condition}>
                    {condition}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-800 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-5">
          <p className="text-sm text-slate-300">
            Mostrando {sortedFilteredParts.length} resultado(s) de {partsWithStock.length} pieza(s) con stock
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setCategoryFilter("ALL");
              setConditionFilter("ALL");
            }}
            disabled={!hasActiveFilters}
            className="min-h-[40px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Limpiar filtros
          </button>
        </div>
      </section>

      <PartsTable
        parts={sortedFilteredParts}
        partsMobilePage={paginatedParts}
        loading={loading}
        deletingId={deletingId}
        onEdit={setSelectedPart}
        emptyMessage={hasActiveFilters ? "No hay piezas que coincidan con los filtros." : undefined}
        onDelete={(part) => {
          void handleDelete(part);
        }}
      />

      {!loading && sortedFilteredParts.length > 0 ? (
        <section className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 shadow-lg shadow-slate-950/40 md:hidden">
          <p className="text-sm text-slate-300">
            Pagina {currentPage} de {totalPages}
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
    </div>
  );
}
