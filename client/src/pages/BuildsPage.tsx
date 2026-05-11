import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as buildsApi from "../api/builds";
import { useBuilds } from "../hooks/useBuilds";
import { useParts } from "../hooks/useParts";
import type { Build } from "../types/build";
import * as salesApi from "../api/sales";
import type { SaleListRow } from "../types/sale";

type BuildBucketKey = "DRAFTS" | "PENDING" | "READY" | "SOLD";
type StatusFilter = "ALL" | BuildBucketKey;
type SortOrder = "RECENT" | "PROFIT_DESC" | "PRICE_DESC";

function money(value: number): string {
  return `${value.toFixed(2)} EUR`;
}

function toDateLabel(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("es-ES");
}

function buildBucket(build: Build): BuildBucketKey {
  if (build.status === "SOLD") return "SOLD";
  if (build.status === "CONFIRMED") return "READY";
  if ((build.items?.length ?? 0) > 0) return "PENDING";
  return "DRAFTS";
}

function bucketTitle(bucket: BuildBucketKey): string {
  if (bucket === "DRAFTS") return "Borradores";
  if (bucket === "PENDING") return "En montaje / pendientes";
  if (bucket === "READY") return "Listos para vender";
  return "Vendidos";
}

function bucketTone(bucket: BuildBucketKey): string {
  if (bucket === "SOLD") return "border-cyan-500/30 bg-cyan-500/10 text-cyan-200";
  if (bucket === "READY") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
  if (bucket === "PENDING") return "border-amber-500/30 bg-amber-500/10 text-amber-200";
  return "border-indigo-500/30 bg-indigo-500/10 text-indigo-200";
}

export function BuildsPage() {
  const navigate = useNavigate();
  const { builds, loading, deletingId, error, deleteBuild, reload } =
    useBuilds();
  const { parts: inventoryParts, loading: inventoryLoading, reload: reloadInventory } = useParts();
  const [preparingPartId, setPreparingPartId] = useState<string | null>(null);
  const [creatingQuick, setCreatingQuick] = useState(false);
  const [salesRows, setSalesRows] = useState<SaleListRow[]>([]);
  const [soldExpanded, setSoldExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [monthFilter, setMonthFilter] = useState<number | "ALL">("ALL");
  const [yearFilter, setYearFilter] = useState<number | "ALL">("ALL");
  const [sortOrder, setSortOrder] = useState<SortOrder>("RECENT");
  const [soldMonthFilter, setSoldMonthFilter] = useState<number | "ALL">("ALL");
  const [soldYearFilter, setSoldYearFilter] = useState<number | "ALL">("ALL");

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
    const map: Record<BuildBucketKey, Build[]> = { DRAFTS: [], PENDING: [], READY: [], SOLD: [] };
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

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-2 pb-8 text-slate-100 md:px-4">
      <section className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 shadow-[0_20px_50px_-24px_rgba(79,70,229,0.75)]">
        <h1 className="text-2xl font-bold">Montajes de PC</h1>
        <p className="mt-2 text-sm text-slate-300">
          Crea montajes por piezas o vende PCs completos del inventario. En ambos casos, cuando el equipo este listo,
          usalo con <span className="font-semibold text-cyan-300">Registrar venta</span> para pasarlo al apartado Ventas.
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

      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/40">
        <button
          type="button"
          onClick={() => {
            void handleQuickCreate();
          }}
          disabled={creatingQuick}
          className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:bg-indigo-500 disabled:opacity-60 md:w-auto"
        >
          {creatingQuick ? "Creando..." : "Crear montaje"}
        </button>
        <p className="mt-2 text-xs text-slate-500">
          Crea un borrador al instante y completa nombre, notas y piezas en el detalle del montaje.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/40">
        <details>
          <summary className="cursor-pointer list-none text-sm font-semibold text-slate-100">
            Filtros
          </summary>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
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
                <option value="DRAFTS">Borradores</option>
                <option value="PENDING">Pendientes</option>
                <option value="READY">Listos para vender</option>
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
        </details>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/40">
        <h2 className="text-lg font-semibold text-slate-100">PCs disponibles para vender</h2>
        <p className="mt-1 text-xs text-slate-500">Incluye PCs completos de inventario y montajes listos para venta.</p>
        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
          {(inventoryLoading ? [] : inventoryParts.filter((p) => p.inventoryKind === "PREBUILT_PC" && p.stock > 0)).map((part) => {
            const cost = Number(part.costPrice);
            const sale = Number(part.salePrice);
            const profit = sale - cost;
            return (
              <article key={`inv-${part.id}`} className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-100">{part.name}</p>
                    <p className="text-xs text-violet-300">Origen: Inventario · Stock {part.stock}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPreparingPartId(part.id);
                      void buildsApi.createBuildFromPrebuiltPart(part.id)
                        .then(async (detail) => {
                          await Promise.all([reload(), reloadInventory()]);
                          navigate(`/builds/${detail.id}#registrar-venta`);
                        })
                        .catch((err) => window.alert(err instanceof Error ? err.message : "No se pudo preparar la venta del PC."))
                        .finally(() => setPreparingPartId(null));
                    }}
                    disabled={preparingPartId === part.id}
                    className="rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-500 disabled:opacity-50"
                  >
                    {preparingPartId === part.id ? "Preparando..." : "Registrar venta"}
                  </button>
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  Coste {money(cost)} · Venta estimada {money(sale)} · Beneficio {money(profit)}
                </p>
              </article>
            );
          })}
          {bucketBuilds.READY.map((build) => (
            <article key={`ready-${build.id}`} className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-100">{build.name}</p>
                  <p className="text-xs text-emerald-300">Origen: Montaje</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link to={`/builds/${build.id}#registrar-venta`} className="rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-500">Registrar venta</Link>
                  <Link to={`/builds/${build.id}`} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500">Ver detalle</Link>
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                Coste {money(Number(build.totalCost ?? 0))} · Venta estimada {money(Number(build.totalSale ?? 0))} · Beneficio {money(Number(build.profit ?? 0))}
              </p>
            </article>
          ))}
          {!inventoryLoading && inventoryParts.filter((p) => p.inventoryKind === "PREBUILT_PC" && p.stock > 0).length === 0 && bucketBuilds.READY.length === 0 ? (
            <p className="text-sm text-slate-500">No hay equipos disponibles para vender ahora mismo.</p>
          ) : null}
        </div>
      </section>

      {loading ? (
        <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
          <p className="text-sm text-slate-300">Cargando montajes...</p>
        </section>
      ) : (
        <>
          {(["PENDING", "DRAFTS"] as const).map((bucketKey) => {
            const rows = bucketBuilds[bucketKey];
            const totals = rows.reduce(
              (acc, b) => {
                acc.cost += Number(b.totalCost ?? 0);
                acc.sale += Number(b.totalSale ?? 0);
                acc.profit += Number(b.profit ?? 0);
                return acc;
              },
              { cost: 0, sale: 0, profit: 0 }
            );
            const defaultOpen = rows.length > 0;
            return (
              <BuildSection
                key={bucketKey}
                title={bucketTitle(bucketKey)}
                tone={bucketTone(bucketKey)}
                builds={rows}
                totals={totals}
                deletingId={deletingId}
                defaultOpen={defaultOpen}
                salesByBuildId={salesByBuildId}
                onDelete={(build) => void handleDelete(build.id, build.name)}
              />
            );
          })}

          <section className="rounded-2xl border border-slate-800 bg-slate-900/80 shadow-lg shadow-slate-950/40">
            <details className="group" open={false}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5">
                <div className="min-w-0">
                  <p className="text-base font-semibold text-slate-100">Vendidos</p>
                  <p className="text-xs text-slate-500">Historial plegado para no saturar la vista de trabajo.</p>
                </div>
                <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${bucketTone("SOLD")}`}>
                  {soldBuildsFiltered.length} montajes
                </span>
              </summary>
              <div className="border-t border-slate-800 px-4 pb-4 pt-3">
                <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-4">
                  <label className="flex flex-col gap-1 text-sm text-slate-300">
                    Mes vendidos
                    <select value={soldMonthFilter} onChange={(e) => setSoldMonthFilter(e.target.value === "ALL" ? "ALL" : Number(e.target.value))} className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2">
                      <option value="ALL">Todos</option>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{m}</option>)}
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
                      <article key={build.id} className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-100">{build.name}</p>
                            <p className="text-xs text-slate-500">
                              {toDateLabel(sale?.soldAt ?? build.updatedAt)} · Cliente: {sale?.customerName ?? "—"}
                            </p>
                          </div>
                          <p className="text-sm font-semibold text-emerald-300">{money(Number(sale?.profit ?? build.profit ?? 0))}</p>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Link to={`/builds/${build.id}`} className="rounded-lg border border-indigo-500/40 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-200 hover:bg-indigo-500/20">Ver detalle</Link>
                        </div>
                      </article>
                    );
                  })}
                </div>
                {soldBuildsFiltered.length > 5 ? (
                  <button type="button" onClick={() => setSoldExpanded((v) => !v)} className="mt-3 rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800">
                    {soldExpanded ? "Ver menos" : "Ver todos"}
                  </button>
                ) : null}
              </div>
            </details>
          </section>
        </>
      )}
    </div>
  );
}

function BuildSection({
  title,
  tone,
  builds,
  totals,
  deletingId,
  defaultOpen,
  salesByBuildId,
  onDelete
}: {
  title: string;
  tone: string;
  builds: Build[];
  totals: { cost: number; sale: number; profit: number };
  deletingId: string | null;
  defaultOpen: boolean;
  salesByBuildId: Map<string, SaleListRow>;
  onDelete: (build: Build) => void;
}) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/80 shadow-lg shadow-slate-950/40">
      <details open={defaultOpen}>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5">
          <div className="min-w-0">
            <p className="text-base font-semibold text-slate-100">{title}</p>
            <p className="text-xs text-slate-500">
              {builds.length} montajes · coste {money(totals.cost)} · venta {money(totals.sale)} · beneficio {money(totals.profit)}
            </p>
          </div>
          <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${tone}`}>{builds.length}</span>
        </summary>
        <div className="border-t border-slate-800 p-3">
          {builds.length === 0 ? (
            <p className="text-sm text-slate-500">Sin montajes en esta sección.</p>
          ) : (
            <>
              <div className="hidden overflow-x-auto rounded-xl border border-slate-800 md:block">
                <table className="min-w-full text-left text-sm text-slate-200">
                  <thead className="bg-slate-950/70 text-xs uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className="px-3 py-2.5">Nombre</th>
                      <th className="px-3 py-2.5">Fecha</th>
                      <th className="px-3 py-2.5">Cliente</th>
                      <th className="px-3 py-2.5 text-right">Venta</th>
                      <th className="px-3 py-2.5 text-right">Beneficio</th>
                      <th className="px-3 py-2.5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {builds.map((build) => {
                      const sale = salesByBuildId.get(build.id);
                      return (
                        <tr key={build.id} className="hover:bg-slate-800/30">
                          <td className="px-3 py-2.5 font-medium text-slate-100">{build.name}</td>
                          <td className="px-3 py-2.5 text-slate-400">{toDateLabel(sale?.soldAt ?? build.updatedAt)}</td>
                          <td className="px-3 py-2.5 text-slate-300">{sale?.customerName ?? "—"}</td>
                          <td className="px-3 py-2.5 text-right text-emerald-300">{money(Number(sale?.finalSalePrice ?? build.totalSale ?? 0))}</td>
                          <td className="px-3 py-2.5 text-right text-cyan-300">{money(Number(sale?.profit ?? build.profit ?? 0))}</td>
                          <td className="px-3 py-2.5">
                            <div className="flex justify-end gap-2">
                              <Link to={`/builds/${build.id}`} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500">Ver detalle</Link>
                              {build.status === "CONFIRMED" ? (
                                <Link to={`/builds/${build.id}#registrar-venta`} className="rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-500">Vender PC</Link>
                              ) : null}
                              <button type="button" onClick={() => onDelete(build)} disabled={deletingId === build.id || build.status === "SOLD"} className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-200 disabled:opacity-50">Eliminar</button>
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
                    <article key={build.id} className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                      <p className="font-semibold text-slate-100">{build.name}</p>
                      <p className="text-xs text-slate-500">
                        {toDateLabel(sale?.soldAt ?? build.updatedAt)} · Cliente: {sale?.customerName ?? "—"}
                      </p>
                      <div className="mt-2 flex items-center justify-between text-xs">
                        <span className="text-emerald-300">Venta {money(Number(sale?.finalSalePrice ?? build.totalSale ?? 0))}</span>
                        <span className="text-cyan-300">Beneficio {money(Number(sale?.profit ?? build.profit ?? 0))}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Link to={`/builds/${build.id}`} className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">Ver detalle</Link>
                        {build.status === "CONFIRMED" ? (
                          <Link to={`/builds/${build.id}#registrar-venta`} className="rounded-lg bg-cyan-600 px-3 py-1 text-xs font-semibold text-white">Vender PC</Link>
                        ) : null}
                        <button type="button" onClick={() => onDelete(build)} disabled={deletingId === build.id || build.status === "SOLD"} className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-200 disabled:opacity-50">Eliminar</button>
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
