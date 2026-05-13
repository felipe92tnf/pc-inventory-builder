import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as buildsApi from "../api/builds";
import { useBuilds } from "../hooks/useBuilds";
import { useParts } from "../hooks/useParts";
import type { Build } from "../types/build";
import * as salesApi from "../api/sales";
import type { SaleListRow } from "../types/sale";
import {
  PRIMARY_ACTION_BUTTON,
  PRIMARY_ACTION_BUTTON_HEADER,
  STICKY_PRIMARY_MOBILE_DOCK,
  PRIMARY_ACTION_BUTTON_COMPACT,
  SECONDARY_GHOST_SM,
  DESTRUCTIVE_BUTTON_SM
} from "../theme/actionButtons";
import {
  LIST_PAGE_ACCORDION_BODY,
  LIST_PAGE_ACCORDION_SHELL,
  LIST_PAGE_ACCORDION_TRIGGER,
  LIST_PAGE_COUNT_BADGE,
  LIST_PAGE_FILTER_SECTION,
  LIST_PAGE_LISTING_REGION,
  LIST_PAGE_LISTING_TITLE
} from "../theme/listPageMobile";
import { PAGE_HERO, PAGE_OUTER_7XL, SECTION_SHELL, TABLE_CELL } from "../theme/layoutDensity";

type BuildBucketKey =
  | "WIP"
  | "CONFIRMED"
  | "RESERVED"
  | "PENDING_PAYMENT"
  | "PENDING_PICKUP"
  | "SOLD";
type StatusFilter = "ALL" | BuildBucketKey;
type SortOrder = "RECENT" | "PROFIT_DESC" | "PRICE_DESC";

function money(value: number): string {
  return `${value.toFixed(2)} EUR`;
}

function toDateLabel(value: string | null | undefined): string {
  if (!value) return "—";
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
] as const;

function buildBucket(build: Build): BuildBucketKey {
  if (build.status === "SOLD") return "SOLD";
  if (build.status === "PENDING_PICKUP") return "PENDING_PICKUP";
  if (build.status === "PENDING_PAYMENT") return "PENDING_PAYMENT";
  if (build.status === "RESERVED") return "RESERVED";
  if (build.status === "CONFIRMED") return "CONFIRMED";
  return "WIP";
}

function bucketTitle(bucket: BuildBucketKey): string {
  if (bucket === "WIP") return "Montajes en curso";
  if (bucket === "CONFIRMED") return "Listo para la venta";
  if (bucket === "RESERVED") return "Reservado";
  if (bucket === "PENDING_PAYMENT") return "Pendiente de pago";
  if (bucket === "PENDING_PICKUP") return "Pendiente de recogida";
  return "Vendidos";
}

function canLinkRegisterSale(build: Build, sale: SaleListRow | undefined): boolean {
  if (!["CONFIRMED", "PENDING_PAYMENT", "RESERVED"].includes(build.status)) return false;
  return !sale;
}

function bucketTone(bucket: BuildBucketKey): string {
  if (bucket === "SOLD") return "border-cyan-500/30 bg-cyan-500/10 text-cyan-200";
  if (bucket === "CONFIRMED") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
  if (bucket === "RESERVED") return "border-violet-500/30 bg-violet-500/10 text-violet-200";
  if (bucket === "PENDING_PAYMENT") return "border-amber-500/30 bg-amber-500/10 text-amber-200";
  if (bucket === "PENDING_PICKUP") return "border-sky-500/30 bg-sky-500/10 text-sky-200";
  return "border-indigo-500/30 bg-indigo-500/10 text-indigo-200";
}

const OPERATIVE_BUCKET_KEYS = ["WIP", "CONFIRMED", "RESERVED", "PENDING_PAYMENT", "PENDING_PICKUP"] as const;

export function BuildsPage() {
  const navigate = useNavigate();
  const { builds, loading, deletingId, error, deleteBuild, reload } =
    useBuilds();
  const { parts: inventoryParts, loading: inventoryLoading, reload: reloadInventory } = useParts();
  const [preparingPartId, setPreparingPartId] = useState<string | null>(null);
  const [creatingQuick, setCreatingQuick] = useState(false);
  const [salesRows, setSalesRows] = useState<SaleListRow[]>([]);
  const [soldExpanded, setSoldExpanded] = useState(false);
  /** Móvil: panel de PCs / montajes listos para vender, plegado por defecto. */
  const [availablePcsPanelOpen, setAvailablePcsPanelOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [monthFilter, setMonthFilter] = useState<number | "ALL">("ALL");
  const [yearFilter, setYearFilter] = useState<number | "ALL">("ALL");
  const [sortOrder, setSortOrder] = useState<SortOrder>("RECENT");
  const [soldMonthFilter, setSoldMonthFilter] = useState<number | "ALL">(
    () => new Date().getMonth() + 1
  );
  const [soldYearFilter, setSoldYearFilter] = useState<number | "ALL">(
    () => new Date().getFullYear()
  );
  const [showEmptySections, setShowEmptySections] = useState(false);

  const handleDelete = async (buildId: string, buildName: string) => {
    const confirmed = window.confirm(`Eliminar el montaje "${buildName}"?`);
    if (!confirmed) return;
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
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "No se pudo crear el montaje.");
    } finally {
      setCreatingQuick(false);
    }
  };

  useEffect(() => {
    let active = true;
    void salesApi
      .listSales()
      .then((rows) => {
        if (!active) return;
        setSalesRows(rows);
      })
      .catch(() => {
        if (!active) return;
        setSalesRows([]);
      });
    return () => {
      active = false;
    };
  }, [builds.length]);

  const salesByBuildId = useMemo(() => {
    const map = new Map<string, SaleListRow>();
    for (const sale of salesRows) {
      map.set(sale.buildId, sale);
    }
    return map;
  }, [salesRows]);

  const years = useMemo(() => {
    const set = new Set<number>();
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
    const map: Record<BuildBucketKey, Build[]> = {
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

  const prebuiltWithStock = useMemo(
    () => inventoryParts.filter((p) => p.inventoryKind === "PREBUILT_PC" && p.stock > 0),
    [inventoryParts]
  );
  const availableToSellCount = prebuiltWithStock.length + bucketBuilds.CONFIRMED.length;

  const disponiblesSectionVisible =
    showEmptySections || inventoryLoading || prebuiltWithStock.length > 0;
  const vendidosSectionVisible = showEmptySections || soldBuildsFiltered.length > 0;
  const anyOperativeBucketHasRows = OPERATIVE_BUCKET_KEYS.some((k) => bucketBuilds[k].length > 0);
  const showNoListingsHint =
    !loading &&
    !showEmptySections &&
    !disponiblesSectionVisible &&
    !vendidosSectionVisible &&
    !anyOperativeBucketHasRows;

  return (
    <div className={`${PAGE_OUTER_7XL} max-md:pb-32`}>
      <section className={`${PAGE_HERO} flex flex-col gap-3 md:flex-row md:items-start md:justify-between`}>
        <h1 className="text-3xl font-bold tracking-tight">Montajes de PC</h1>
        <button
          type="button"
          onClick={() => {
            void handleQuickCreate();
          }}
          disabled={creatingQuick}
          className={PRIMARY_ACTION_BUTTON_HEADER}
        >
          {creatingQuick ? "Creando..." : "Crear montaje"}
        </button>
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

      <section className={LIST_PAGE_FILTER_SECTION}>
        <details className="group">
          <summary className={LIST_PAGE_ACCORDION_TRIGGER}>
            <span className="text-base font-semibold text-slate-100">Filtros</span>
            <svg
              className="h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <div className="border-t border-slate-800 px-3.5 pb-4 pt-3 md:px-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            <label className="flex flex-col gap-1 text-sm text-slate-300 xl:col-span-2">
              Buscar por nombre
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 outline-none focus:border-indigo-400"
                placeholder="Ej: Gaming, Oficina..."
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate-300">
              Estado
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2">
                <option value="ALL">Todos</option>
                <option value="WIP">Montajes en curso</option>
                <option value="CONFIRMED">Listo para la venta</option>
                <option value="RESERVED">Reservado</option>
                <option value="PENDING_PAYMENT">Pendiente de pago</option>
                <option value="PENDING_PICKUP">Pendiente de recogida</option>
                <option value="SOLD">Vendidos</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate-300">
              Mes
              <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value === "ALL" ? "ALL" : Number(e.target.value))} className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2">
                <option value="ALL">Todos</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate-300">
              Año
              <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value === "ALL" ? "ALL" : Number(e.target.value))} className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2">
                <option value="ALL">Todos</option>
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate-300">
              Orden
              <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as SortOrder)} className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2">
                <option value="RECENT">Recientes</option>
                <option value="PROFIT_DESC">Mayor beneficio</option>
                <option value="PRICE_DESC">Mayor precio</option>
              </select>
            </label>
            </div>
          </div>
        </details>
      </section>

      <div className={LIST_PAGE_LISTING_REGION}>
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className={LIST_PAGE_LISTING_TITLE}>Listado de montajes</h2>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-400 select-none">
            <input
              type="checkbox"
              checked={showEmptySections}
              onChange={(e) => setShowEmptySections(e.target.checked)}
              className="h-4 w-4 rounded border-slate-600 bg-slate-950 text-indigo-500 focus:ring-indigo-400/40"
            />
            Mostrar secciones vacías
          </label>
        </div>

      {disponiblesSectionVisible ? (
      <section className={`${LIST_PAGE_ACCORDION_SHELL} backdrop-blur`}>
        <button
          type="button"
          className={`${LIST_PAGE_ACCORDION_TRIGGER} md:hidden`}
          onClick={() => setAvailablePcsPanelOpen((open) => !open)}
          aria-expanded={availablePcsPanelOpen}
          aria-controls="builds-available-pcs-panel"
        >
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:gap-3">
            <div className="min-w-0">
              <span className="block text-base font-semibold text-slate-100">Disponibles para vender</span>
              <span className="mt-0.5 block text-xs font-normal text-slate-500">
                {inventoryLoading ? "Cargando inventario…" : "Inventario y montajes listos para registrar venta"}
              </span>
            </div>
            <span className={`${LIST_PAGE_COUNT_BADGE} ${bucketTone("CONFIRMED")}`}>{availableToSellCount}</span>
          </div>
          <svg
            className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 ${availablePcsPanelOpen ? "rotate-180" : ""}`}
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
          id="builds-available-pcs-panel"
          className={availablePcsPanelOpen ? "" : "max-md:hidden"}
        >
          <div className="p-4 md:p-5">
            <div className="mb-2 hidden items-center gap-2 md:flex">
              <h3 className="text-lg font-semibold text-slate-100">Disponibles para vender</h3>
              <span className={`${LIST_PAGE_COUNT_BADGE} ${bucketTone("CONFIRMED")}`}>{availableToSellCount}</span>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2.5 lg:grid-cols-2">
              {(inventoryLoading ? [] : prebuiltWithStock).map((part) => {
                const sale = Number(part.salePrice);
                return (
                  <article key={`inv-${part.id}`} className="rounded-xl border border-slate-800 bg-slate-950/40 p-3.5 md:p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-100">{part.name}</p>
                        <p className="mt-1 text-sm font-medium text-violet-300">Stock {part.stock}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setPreparingPartId(part.id);
                          void buildsApi
                            .createBuildFromPrebuiltPart(part.id)
                            .then(async (detail) => {
                              await Promise.all([reload(), reloadInventory()]);
                              navigate(`/builds/${detail.id}#registrar-venta`);
                            })
                            .catch((err) =>
                              window.alert(err instanceof Error ? err.message : "No se pudo preparar la venta del PC.")
                            )
                            .finally(() => setPreparingPartId(null));
                        }}
                        disabled={preparingPartId === part.id}
                        className={PRIMARY_ACTION_BUTTON_COMPACT}
                      >
                        {preparingPartId === part.id ? "Preparando..." : "Registrar venta"}
                      </button>
                    </div>
                    <p className="mt-3 text-lg font-semibold text-emerald-300">{money(sale)}</p>
                  </article>
                );
              })}
              {!inventoryLoading && prebuiltWithStock.length === 0 ? (
                <p className="text-sm text-slate-500">
                  {bucketBuilds.CONFIRMED.length > 0
                    ? "Sin stock de PCs de inventario. Los montajes listos aparecen en la seccion «Listo para la venta» debajo."
                    : "No hay PCs de inventario en stock para vender ahora mismo."}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>
      ) : null}

      {loading ? (
        <section className={SECTION_SHELL}>
          <p className="text-sm text-slate-300">Cargando montajes...</p>
        </section>
      ) : (
        <>
          {OPERATIVE_BUCKET_KEYS.map((bucketKey) => {
            const rows = bucketBuilds[bucketKey];
            if (rows.length === 0 && !showEmptySections) return null;
            const defaultOpen = rows.length > 0;
            return (
              <BuildSection
                key={bucketKey}
                title={bucketTitle(bucketKey)}
                tone={bucketTone(bucketKey)}
                builds={rows}
                deletingId={deletingId}
                defaultOpen={defaultOpen}
                salesByBuildId={salesByBuildId}
                onDelete={(build) => void handleDelete(build.id, build.name)}
              />
            );
          })}

          {vendidosSectionVisible ? (
          <section className={LIST_PAGE_ACCORDION_SHELL}>
            <details className="group" open={false}>
              <summary className={LIST_PAGE_ACCORDION_TRIGGER}>
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:gap-3">
                  <p className="text-lg font-semibold text-slate-100">Vendidos</p>
                  <span className={`${LIST_PAGE_COUNT_BADGE} ${bucketTone("SOLD")}`}>
                    {soldBuildsFiltered.length}
                  </span>
                </div>
                <svg
                  className="h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  aria-hidden
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="border-t border-slate-800 px-4 pb-3 pt-2.5">
                <div className="mb-2.5 grid grid-cols-1 gap-2.5 md:grid-cols-4">
                  <label className="flex flex-col gap-1 text-sm text-slate-300">
                    Ventas por mes
                    <select value={soldMonthFilter} onChange={(e) => setSoldMonthFilter(e.target.value === "ALL" ? "ALL" : Number(e.target.value))} className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2">
                      <option value="ALL">Todos</option>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <option key={m} value={m}>
                          {SPANISH_MONTH_NAMES[m - 1]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-sm text-slate-300">
                    Año vendidos
                    <select value={soldYearFilter} onChange={(e) => setSoldYearFilter(e.target.value === "ALL" ? "ALL" : Number(e.target.value))} className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2">
                      <option value="ALL">Todos</option>
                      {years.map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </label>
                </div>
                <div className="space-y-2">
                  {soldVisible.map((build) => {
                    const sale = salesByBuildId.get(build.id);
                    return (
                      <article key={build.id} className="rounded-xl border border-slate-800 bg-slate-950/40 px-3.5 py-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-100">{build.name}</p>
                            <p className="mt-1 text-sm text-slate-400">{sale?.customerName ?? "—"}</p>
                          </div>
                          <p className="text-lg font-semibold text-emerald-300">
                            {money(Number(sale?.finalSalePrice ?? build.totalSale ?? 0))}
                          </p>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Link to={`/builds/${build.id}`} className={SECONDARY_GHOST_SM}>Ver detalle</Link>
                        </div>
                      </article>
                    );
                  })}
                </div>
                {soldBuildsFiltered.length > 5 ? (
                  <button type="button" onClick={() => setSoldExpanded((v) => !v)} className="mt-3 rounded-lg border border-slate-600 bg-slate-900/70 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-800">
                    {soldExpanded ? "Ver menos" : "Ver todos"}
                  </button>
                ) : null}
              </div>
            </details>
          </section>
          ) : null}

          {showNoListingsHint ? (
            <p className="text-sm text-slate-500">
              Ninguna sección tiene contenido con los filtros actuales. Activa «Mostrar secciones vacías» para ver todas
              las categorías.
            </p>
          ) : null}
        </>
      )}
      </div>
      <div className={STICKY_PRIMARY_MOBILE_DOCK}>
        <button
          type="button"
          onClick={() => {
            void handleQuickCreate();
          }}
          disabled={creatingQuick}
          className={PRIMARY_ACTION_BUTTON}
        >
          {creatingQuick ? "Creando..." : "Crear montaje"}
        </button>
      </div>
    </div>
  );
}

function BuildSection({
  title,
  tone,
  builds,
  deletingId,
  defaultOpen,
  salesByBuildId,
  onDelete
}: {
  title: string;
  tone: string;
  builds: Build[];
  deletingId: string | null;
  defaultOpen: boolean;
  salesByBuildId: Map<string, SaleListRow>;
  onDelete: (build: Build) => void;
}) {
  return (
    <section className={LIST_PAGE_ACCORDION_SHELL}>
      <details className="group" open={defaultOpen}>
        <summary className={LIST_PAGE_ACCORDION_TRIGGER}>
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:gap-3">
            <p className="text-lg font-semibold text-slate-100">{title}</p>
            <span className={`${LIST_PAGE_COUNT_BADGE} ${tone}`}>{builds.length}</span>
          </div>
          <svg
            className="h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </summary>
        <div className={LIST_PAGE_ACCORDION_BODY}>
          {builds.length === 0 ? (
            <p className="text-sm text-slate-500">Sin montajes en esta sección.</p>
          ) : (
            <>
              <div className="hidden overflow-x-auto rounded-xl border border-slate-800 md:block">
                <table className="min-w-full text-left text-sm text-slate-200">
                  <thead className="bg-slate-950/70 text-xs uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className={TABLE_CELL}>Nombre</th>
                      <th className={TABLE_CELL}>Fecha</th>
                      <th className={TABLE_CELL}>Cliente</th>
                      <th className={`${TABLE_CELL} text-right`}>Venta</th>
                      <th className={`${TABLE_CELL} text-right`}>Beneficio</th>
                      <th className={`${TABLE_CELL} text-right`}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {builds.map((build) => {
                      const sale = salesByBuildId.get(build.id);
                      return (
                        <tr key={build.id} className="hover:bg-slate-800/30">
                          <td className={`${TABLE_CELL} font-medium text-slate-100`}>{build.name}</td>
                          <td className={`${TABLE_CELL} text-slate-400`}>{toDateLabel(sale?.soldAt ?? build.updatedAt)}</td>
                          <td className={`${TABLE_CELL} text-slate-300`}>{sale?.customerName ?? "—"}</td>
                          <td className={`${TABLE_CELL} text-right text-emerald-300`}>{money(Number(sale?.finalSalePrice ?? build.totalSale ?? 0))}</td>
                          <td className={`${TABLE_CELL} text-right text-cyan-300`}>{money(Number(sale?.profit ?? build.profit ?? 0))}</td>
                          <td className={TABLE_CELL}>
                            <div className="flex justify-end gap-2">
                              <Link to={`/builds/${build.id}`} className={SECONDARY_GHOST_SM}>Ver detalle</Link>
                              {canLinkRegisterSale(build, sale) ? (
                                <Link to={`/builds/${build.id}#registrar-venta`} className={PRIMARY_ACTION_BUTTON_COMPACT}>Vender PC</Link>
                              ) : null}
                              <button
                                type="button"
                                onClick={() => onDelete(build)}
                                disabled={
                                  deletingId === build.id ||
                                  build.status === "SOLD" ||
                                  build.status === "PENDING_PICKUP"
                                }
                                className={DESTRUCTIVE_BUTTON_SM}
                              >
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="space-y-2 md:hidden">
                {builds.map((build) => {
                  const sale = salesByBuildId.get(build.id);
                  return (
                      <article key={build.id} className="rounded-xl border border-slate-800 bg-slate-950/40 p-3.5">
                      <p className="font-semibold text-slate-100">{build.name}</p>
                      <p className="mt-1 text-sm text-slate-400">{sale?.customerName ?? "—"}</p>
                      <p className="mt-3 text-base font-semibold text-emerald-300">
                        {money(Number(sale?.finalSalePrice ?? build.totalSale ?? 0))}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Link to={`/builds/${build.id}`} className={SECONDARY_GHOST_SM}>Ver detalle</Link>
                        {canLinkRegisterSale(build, sale) ? (
                          <Link to={`/builds/${build.id}#registrar-venta`} className={PRIMARY_ACTION_BUTTON_COMPACT}>Vender PC</Link>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => onDelete(build)}
                          disabled={
                            deletingId === build.id ||
                            build.status === "SOLD" ||
                            build.status === "PENDING_PICKUP"
                          }
                          className={DESTRUCTIVE_BUTTON_SM}
                        >
                          Eliminar
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </details>
    </section>
  );
}
