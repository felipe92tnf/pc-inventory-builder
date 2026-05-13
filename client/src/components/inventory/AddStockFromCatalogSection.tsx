import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as catalogApi from "../../api/catalog";
import {
  NON_STOCK_PART_CATEGORIES,
  PART_CONDITIONS,
  partCategoryLabel,
  type PartCatalogEntry,
  type PartCondition,
  type PendingCatalogStockPick,
  type StockFromCatalogPayload
} from "../../types/part";
import { calculateSalePrice } from "../../utils/pricing";
import { SECONDARY_BUTTON_SM, SECONDARY_GHOST_SM } from "../../theme/actionButtons";

function num(v: unknown, fallback = 0): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : fallback;
  const n = parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : fallback;
}

/** Acepta coma o punto como separador decimal (evita limitaciones de `type="number"` según locale del navegador). */
function parseDecimalInput(raw: string): number {
  const t = raw.trim().replace(",", ".");
  if (t === "" || t === "." || t === "-") return 0;
  const n = parseFloat(t);
  return Number.isFinite(n) ? n : 0;
}

function formatDecimalForInput(n: number): string {
  if (!Number.isFinite(n)) return "";
  return String(n);
}

const STOCK_CONDITION_LABEL: Record<PartCondition, string> = {
  NEW: "Nuevo",
  USED: "Usado",
  REFURBISHED: "Reacondicionado"
};

type AddStockFromCatalogSectionProps = {
  submitting: boolean;
  onRegisterStock: (payload: StockFromCatalogPayload) => Promise<void>;
  /** Incrementar tras crear plantillas en «Catálogo» para refrescar la lista. */
  catalogRefreshSignal?: number;
  /** Tras crear plantilla: seleccionarla y el estado indicados en esta vista. */
  pendingCatalogPick?: PendingCatalogStockPick | null;
  onPendingCatalogPickConsumed?: () => void;
  /** Ir a «Nueva pieza» (plantilla física). */
  onRequestCreateNewPart?: () => void;
};

export function AddStockFromCatalogSection({
  submitting,
  onRegisterStock,
  catalogRefreshSignal = 0,
  pendingCatalogPick = null,
  onPendingCatalogPickConsumed,
  onRequestCreateNewPart
}: AddStockFromCatalogSectionProps) {
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState<PartCatalogEntry[]>([]);
  const [catalogTotalRows, setCatalogTotalRows] = useState<number | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [selectedCatalog, setSelectedCatalog] = useState<PartCatalogEntry | null>(null);
  /** Condición usada al calcular PVP por defecto al cambiar de fila del catálogo (lista o flujo «Nueva pieza»). */
  const conditionForCatalogPricingInitRef = useRef<PartCondition>("NEW");

  const [quantity, setQuantity] = useState(1);
  const [costInput, setCostInput] = useState("");
  const [saleInput, setSaleInput] = useState("");
  const [conditionUi, setConditionUi] = useState<PartCondition>("NEW");
  const [notes, setNotes] = useState("");

  const fetchCatalog = useCallback(async (term: string) => {
    setListLoading(true);
    setCatalogError(null);
    try {
      const trimmed = term.trim();
      const rows = await catalogApi.listCatalogParts(trimmed === "" ? undefined : trimmed);
      setSearchResults(rows);
      if (trimmed === "") {
        setCatalogTotalRows(rows.length);
      }
    } catch (e) {
      setCatalogError(e instanceof Error ? e.message : "No se pudo cargar el catalogo.");
      setSearchResults([]);
    } finally {
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
    if (!pendingCatalogPick) return;
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

  const handleSubmitStock = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedCatalog) return;
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

  const catalogIsEmpty =
    catalogTotalRows !== null && catalogTotalRows === 0 && !listLoading && !catalogError;
  const noMatches =
    !listLoading &&
    !catalogError &&
    searchResults.length === 0 &&
    catalogTotalRows !== null &&
    catalogTotalRows > 0 &&
    searchInput.trim() !== "";

  const subtitleLine = useMemo(() => {
    if (!selectedCatalog) return null;
    const bits = [selectedCatalog.brand, selectedCatalog.model].filter(Boolean);
    return bits.length ? bits.join(" · ") : null;
  }, [selectedCatalog]);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/40 md:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-slate-100">Añadir unidades</h2>
          <p className="mt-2 text-sm text-slate-400">
            Selecciona una pieza existente y añade stock físico.
          </p>
        </div>
        {onRequestCreateNewPart ? (
          <button type="button" onClick={onRequestCreateNewPart} className={`${SECONDARY_GHOST_SM} shrink-0 self-start`}>
            ¿No existe la pieza? Crear nueva
          </button>
        ) : null}
      </div>

      {catalogError ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-rose-800/60 bg-rose-950/40 px-3 py-2 text-sm text-rose-100">
          <span>{catalogError}</span>
          <button type="button" className={SECONDARY_BUTTON_SM} onClick={() => void fetchCatalog(searchInput)}>
            Reintentar
          </button>
        </div>
      ) : null}

      <form onSubmit={handleSubmitStock} className="mt-6 space-y-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="catalog-search-input" className="text-sm font-medium text-slate-200">
            Buscar en catálogo
          </label>
          <input
            id="catalog-search-input"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Nombre, SKU, marca, modelo..."
            autoComplete="off"
            className="min-h-[42px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-base text-slate-100 outline-none ring-indigo-400/60 placeholder:text-slate-500 focus:border-indigo-400 focus:ring sm:text-sm"
          />
          <p className="text-xs text-slate-500">
            {listLoading
              ? "Buscando..."
              : catalogTotalRows !== null && catalogTotalRows === 0
                ? "Catálogo sin plantillas (0 piezas)"
                : `${searchResults.length} resultado(s)`}
          </p>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-950/40">
          <p className="border-b border-slate-800 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Resultados del catálogo
          </p>
          <ul className="max-h-52 overflow-y-auto text-sm" aria-label="Resultados de busqueda del catalogo">
            {listLoading ? (
              <li className="px-3 py-4 text-slate-500">Cargando catálogo...</li>
            ) : catalogIsEmpty ? (
              <li className="px-3 py-4 text-slate-400">
                El catálogo de plantillas está vacío. Crea la primera en Inventario → «Nueva pieza» → tipo «Pieza
                física». Las líneas ya en inventario no se listan aquí.
              </li>
            ) : noMatches ? (
              <li className="px-3 py-4 text-slate-500">
                Sin coincidencias (búsqueda sin distinguir mayúsculas). Prueba otro texto o crea la plantilla en «Nueva
                pieza».
              </li>
            ) : (
              searchResults.map((row) => {
                const active = selectedCatalog?.id === row.id;
                return (
                  <li key={row.id} className="border-b border-slate-800/80 last:border-b-0">
                    <button
                      type="button"
                      onClick={() => {
                        conditionForCatalogPricingInitRef.current = "NEW";
                        setConditionUi("NEW");
                        setSelectedCatalog(row);
                      }}
                      className={`flex w-full flex-col items-start gap-0.5 px-3 py-2.5 text-left transition ${active ? "bg-indigo-950/50 ring-1 ring-inset ring-indigo-500/40" : "hover:bg-slate-900/80"}`}
                    >
                      <span className="font-medium text-slate-100">
                        {row.sku ? <span className="text-indigo-300">[{row.sku}] </span> : null}
                        {row.name}
                      </span>
                      <span className="text-xs text-slate-400">
                        {partCategoryLabel(row.category)}
                        {row.brand || row.model
                          ? ` · ${[row.brand, row.model].filter(Boolean).join(" ")}`
                          : ""}
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>

        {selectedCatalog ? (
          <div className="rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-3 text-sm text-slate-300">
            <p className="text-xs uppercase tracking-wide text-slate-500">Seleccionado</p>
            <p className="mt-1">
              <span className="font-semibold text-slate-100">{selectedCatalog.name}</span>
              <span className="text-slate-500"> · {partCategoryLabel(selectedCatalog.category)}</span>
            </p>
            {subtitleLine ? <p className="mt-1 text-slate-400">{subtitleLine}</p> : null}
            {nonStockSelected ? (
              <p className="mt-2 text-amber-200/90">
                Esta categoría no lleva stock físico; el alta registra precios y la línea en inventario con stock 0.
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Selecciona una pieza de la lista para continuar.</p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-200">
            Cantidad
            <input
              type="number"
              min={1}
              step={1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              disabled={!selectedId}
              className="min-h-[42px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-base text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring sm:text-sm"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-200">
            Coste real (unidad)
            <input
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={costInput}
              onChange={(e) => setCostInput(e.target.value)}
              disabled={!selectedId}
              placeholder="19,99 · 19.99"
              className="min-h-[42px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-base text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring sm:text-sm"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-200">
            Precio de venta (unidad)
            <input
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={saleInput}
              onChange={(e) => setSaleInput(e.target.value)}
              disabled={!selectedId}
              placeholder="19,99 · 19.99"
              className="min-h-[42px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-base text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring sm:text-sm"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-200">
            Estado
            <select
              value={conditionUi}
              onChange={(e) => setConditionUi(e.target.value as PartCondition)}
              disabled={!selectedId || nonStockSelected}
              className="min-h-[42px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-base text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring sm:text-sm"
            >
              {PART_CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {STOCK_CONDITION_LABEL[c]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-200">
          Notas (opcional)
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            disabled={!selectedId}
            className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 placeholder:text-slate-500 focus:border-indigo-400 focus:ring"
          />
        </label>

        <button
          type="submit"
          disabled={!selectedId || submitting || listLoading}
          className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Guardando..." : "Registrar stock"}
        </button>
      </form>
    </div>
  );
}
