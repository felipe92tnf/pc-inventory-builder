import { useMemo, useState } from "react";
import { PART_CATEGORIES, type Part } from "../../types/part";

type PartsTableProps = {
  /** Lista completa (tras filtros); en escritorio se muestra por categorias desplegables. */
  parts: Part[];
  /** Si se define, la vista movil usa este trozo paginado; si no, usa `parts`. */
  partsMobilePage?: Part[];
  loading: boolean;
  deletingId: string | null;
  onEdit: (part: Part) => void;
  onDelete: (part: Part) => void;
  emptyMessage?: string;
};

function formatMoney(value: number | string): string {
  return `${Number(value).toFixed(2)} EUR`;
}

function formatCostPrice(value: number | string): string {
  const n = Number(value);
  if (n === 0) return "";
  return formatMoney(value);
}

function categoryBadgeClass(category: string): string {
  const map: Record<string, string> = {
    CPU: "bg-sky-500/15 text-sky-300 border-sky-500/40",
    GPU: "bg-violet-500/15 text-violet-300 border-violet-500/40",
    RAM: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
    STORAGE: "bg-cyan-500/15 text-cyan-300 border-cyan-500/40"
  };
  return map[category] ?? "bg-slate-500/15 text-slate-300 border-slate-500/40";
}

function conditionBadgeClass(condition: string): string {
  if (condition === "NEW") return "bg-emerald-500/15 text-emerald-300 border-emerald-500/40";
  if (condition === "USED") return "bg-amber-500/15 text-amber-300 border-amber-500/40";
  return "bg-indigo-500/15 text-indigo-300 border-indigo-500/40";
}

function StockBadges({ part }: { part: Part }) {
  if (part.stock === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-medium text-slate-100">{part.stock}</span>
      {part.stock <= 2 ? (
        <span className="rounded-full border border-amber-500/50 bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
          Stock bajo
        </span>
      ) : null}
    </div>
  );
}

function ChevronCategory({ open }: { open: boolean }) {
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

function PartCard({
  part,
  deletingId,
  onEdit,
  onDelete,
  showCategoryBadge = true
}: {
  part: Part;
  deletingId: string | null;
  onEdit: (part: Part) => void;
  onDelete: (part: Part) => void;
  /** Dentro de un acordeon por categoria, ocultar chip duplicado */
  showCategoryBadge?: boolean;
}) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 shadow-md shadow-black/20">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="min-w-0 flex-1 text-base font-semibold leading-snug text-slate-100">{part.name}</h3>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => onEdit(part)}
              className="rounded-lg border border-indigo-500/40 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-200 transition hover:bg-indigo-500/20"
            >
              Editar
            </button>
            <button
              type="button"
              onClick={() => onDelete(part)}
              disabled={deletingId === part.id}
              className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {deletingId === part.id ? "Eliminando..." : "Eliminar"}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {showCategoryBadge ? (
            <span
              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${categoryBadgeClass(part.category)}`}
            >
              {part.category}
            </span>
          ) : null}
          <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${conditionBadgeClass(part.condition)}`}
          >
            {part.condition}
          </span>
        </div>

        <dl className="grid grid-cols-1 gap-3 border-t border-slate-800/80 pt-3 text-sm sm:grid-cols-2">
          <div className="flex justify-between gap-3 sm:flex-col sm:justify-start">
            <dt className="text-xs uppercase tracking-wide text-slate-500">Precio coste</dt>
            <dd className="font-medium text-slate-200">{formatCostPrice(part.costPrice)}</dd>
          </div>
          <div className="flex justify-between gap-3 sm:flex-col sm:justify-start">
            <dt className="text-xs uppercase tracking-wide text-slate-500">Precio venta</dt>
            <dd className="font-medium text-emerald-300/95">{formatMoney(part.salePrice)}</dd>
          </div>
          {part.stock !== 0 ? (
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <dt className="text-xs uppercase tracking-wide text-slate-500">Stock</dt>
              <dd>
                <StockBadges part={part} />
              </dd>
            </div>
          ) : null}
        </dl>
      </div>
    </article>
  );
}

function groupPartsByCategory(parts: Part[]): { category: string; items: Part[] }[] {
  const map = new Map<string, Part[]>();
  for (const p of parts) {
    const list = map.get(p.category) ?? [];
    list.push(p);
    map.set(p.category, list);
  }
  return Array.from(map.entries()).map(([category, items]) => ({ category, items }));
}

function groupPartsByCategoryOrdered(parts: Part[]): { category: string; items: Part[] }[] {
  const result: { category: string; items: Part[] }[] = [];
  for (const cat of PART_CATEGORIES) {
    const items = parts.filter((p) => p.category === cat);
    if (items.length) {
      result.push({ category: cat, items });
    }
  }
  return result;
}

function MobilePartsByCategory({
  parts,
  deletingId,
  onEdit,
  onDelete
}: {
  parts: Part[];
  deletingId: string | null;
  onEdit: (part: Part) => void;
  onDelete: (part: Part) => void;
}) {
  const groups = useMemo(() => groupPartsByCategory(parts), [parts]);

  /** Solo true = abierto (por defecto cerrado en movil) */
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});

  const isOpen = (category: string) => openMap[category] === true;

  const toggle = (category: string) => {
    setOpenMap((prev) => ({
      ...prev,
      [category]: !(prev[category] === true)
    }));
  };

  return (
    <section className="space-y-3 md:hidden">
      {groups.map(({ category, items }) => {
        const expanded = isOpen(category);
        const panelId = `inv-cat-${category}`;
        return (
          <div
            key={category}
            className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/85 shadow-lg shadow-black/20"
          >
            <button
              type="button"
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-slate-100"
              onClick={() => toggle(category)}
              aria-expanded={expanded}
              aria-controls={panelId}
            >
              <span
                className={`inline-flex shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${categoryBadgeClass(category)}`}
              >
                {category}
              </span>
              <span className="min-w-0 flex-1 text-sm text-slate-400">
                {items.length} pieza{items.length === 1 ? "" : "s"} en esta pagina
              </span>
              <ChevronCategory open={expanded} />
            </button>
            <div
              id={panelId}
              className={expanded ? "border-t border-slate-800 px-3 pb-3 pt-1" : "hidden"}
            >
              <div className="space-y-3 pt-2">
                {items.map((part) => (
                  <PartCard
                    key={part.id}
                    part={part}
                    deletingId={deletingId}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    showCategoryBadge={false}
                  />
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}

function DesktopPartsByCategory({
  parts,
  deletingId,
  onEdit,
  onDelete
}: {
  parts: Part[];
  deletingId: string | null;
  onEdit: (part: Part) => void;
  onDelete: (part: Part) => void;
}) {
  const groups = useMemo(() => groupPartsByCategoryOrdered(parts), [parts]);

  /** Sin entrada = abierto por defecto en escritorio */
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});

  const isOpen = (category: string) => openMap[category] !== false;

  const toggle = (category: string) => {
    setOpenMap((prev) => {
      const currentlyOpen = prev[category] !== false;
      return { ...prev, [category]: !currentlyOpen };
    });
  };

  return (
    <section className="hidden space-y-3 md:block">
      {groups.map(({ category, items }) => {
        const expanded = isOpen(category);
        const panelId = `inv-desktop-cat-${category}`;
        return (
          <div
            key={category}
            className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/85 shadow-lg shadow-black/20"
          >
            <button
              type="button"
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-slate-100"
              onClick={() => toggle(category)}
              aria-expanded={expanded}
              aria-controls={panelId}
            >
              <span
                className={`inline-flex shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${categoryBadgeClass(category)}`}
              >
                {category}
              </span>
              <span className="min-w-0 flex-1 text-sm text-slate-400">
                {items.length} pieza{items.length === 1 ? "" : "s"}
              </span>
              <ChevronCategory open={expanded} />
            </button>
            <div id={panelId} className={expanded ? "border-t border-slate-800" : "hidden"}>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm text-slate-200">
                  <thead className="bg-slate-950/70 text-xs uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Nombre</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3">Precio coste</th>
                      <th className="px-4 py-3">Precio venta</th>
                      <th className="px-4 py-3">Stock</th>
                      <th className="px-4 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {items.map((part) => (
                      <tr key={part.id} className="transition hover:bg-slate-800/50">
                        <td className="px-4 py-3 font-medium text-slate-100">{part.name}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${conditionBadgeClass(part.condition)}`}
                          >
                            {part.condition}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-300">{formatCostPrice(part.costPrice)}</td>
                        <td className="px-4 py-3 text-slate-300">{formatMoney(part.salePrice)}</td>
                        <td className="px-4 py-3">
                          <StockBadges part={part} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => onEdit(part)}
                              className="rounded-lg border border-indigo-500/40 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-200 transition hover:bg-indigo-500/20"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => onDelete(part)}
                              disabled={deletingId === part.id}
                              className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {deletingId === part.id ? "Eliminando..." : "Eliminar"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}

export function PartsTable({
  parts,
  partsMobilePage,
  loading,
  deletingId,
  onEdit,
  onDelete,
  emptyMessage
}: PartsTableProps) {
  if (loading) {
    return (
      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg shadow-slate-950/40">
        <p className="text-sm text-slate-300">Cargando piezas...</p>
      </section>
    );
  }

  const mobileParts = partsMobilePage ?? parts;

  if (parts.length === 0) {
    return (
      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg shadow-slate-950/40">
        <p className="text-sm text-slate-300">{emptyMessage ?? "No hay piezas en inventario todavia."}</p>
      </section>
    );
  }

  return (
    <>
      <DesktopPartsByCategory parts={parts} deletingId={deletingId} onEdit={onEdit} onDelete={onDelete} />

      {/* Movil: tarjetas agrupadas por categoria (acordeon); opcionalmente paginado */}
      <MobilePartsByCategory parts={mobileParts} deletingId={deletingId} onEdit={onEdit} onDelete={onDelete} />
    </>
  );
}
