import { useMemo, useState } from "react";
import {
  PART_CATEGORIES,
  isNonStockCategory,
  type Part,
  type PartCategory
} from "../../types/part";
import { getInventoryCategoryStyle } from "./inventoryCategoryStyles";

type PartsTableProps = {
  /** Lista completa (tras filtros); en escritorio se muestra por categorias desplegables. */
  parts: Part[];
  /** Si se define, la vista movil usa este trozo paginado; si no, usa `parts`. */
  partsMobilePage?: Part[];
  /** Reduce padding en tablas y acordeones (p. ej. vista con pestañas). */
  compact?: boolean;
  loading: boolean;
  deletingId: string | null;
  /** Suma de stock por categoría (inventario global); para aviso "Stock bajo" en cabecera de categoría. */
  categoryStockTotals?: Map<PartCategory, number>;
  /** Umbral estricto: alerta si unidades en categoría &lt; este valor (p. ej. 3). */
  categoryStockThreshold?: number;
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

function conditionBadgeClass(condition: string): string {
  if (condition === "NEW") return "bg-emerald-500/15 text-emerald-300 border-emerald-500/40";
  if (condition === "USED") return "bg-amber-500/15 text-amber-300 border-amber-500/40";
  return "bg-indigo-500/15 text-indigo-300 border-indigo-500/40";
}

function PartConditionBadge({ part }: { part: Part }) {
  if (part.category && isNonStockCategory(part.category)) {
    return <span className="text-slate-500">—</span>;
  }
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${conditionBadgeClass(part.condition)}`}
    >
      {part.condition}
    </span>
  );
}

function StockBadges({ part }: { part: Part }) {
  if (part.category && isNonStockCategory(part.category)) {
    return <span className="text-slate-500">No aplica</span>;
  }
  if (part.stock === 0) return null;
  return <span className="font-medium text-slate-100">{part.stock}</span>;
}

function ChevronCategory({ open, className = "text-slate-400" }: { open: boolean; className?: string }) {
  return (
    <svg
      className={`h-5 w-5 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""} ${className}`}
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

function CategoryAccordionTrigger({
  categoryKey,
  pieceSummary,
  expanded,
  panelId,
  onToggle,
  compact = false,
  categoryLowStock = false
}: {
  categoryKey: PartCategory;
  pieceSummary: string;
  expanded: boolean;
  panelId: string;
  onToggle: () => void;
  compact?: boolean;
  categoryLowStock?: boolean;
}) {
  const style = getInventoryCategoryStyle(categoryKey);
  const Icon = style.Icon;

  return (
    <button
      type="button"
      className={`flex w-full items-center gap-3 text-left transition-colors duration-200 ${compact ? "px-3 py-2.5" : "px-4 py-3.5"} ${style.headerBg} ${style.headerHover}`}
      onClick={onToggle}
      aria-expanded={expanded}
      aria-controls={panelId}
    >
      <span
        className={`flex shrink-0 items-center justify-center rounded-xl border ${compact ? "h-9 w-9" : "h-10 w-10"} ${style.chipBorder} ${style.chipBg}`}
        aria-hidden
      >
        <Icon className={`${compact ? "h-4 w-4" : "h-[1.125rem] w-[1.125rem]"} ${style.accentIcon}`} strokeWidth={2} />
      </span>
      <span
        className={`inline-flex max-w-[min(100%,14rem)] shrink-0 truncate rounded-full border px-2.5 py-1 text-xs font-semibold ${style.chipBg} ${style.chipBorder} ${style.chipText}`}
      >
        {style.label}
      </span>
      <span className={`min-w-0 flex-1 text-sm tabular-nums ${style.accentText}`}>{pieceSummary}</span>
      {categoryLowStock ? (
        <span className="shrink-0 rounded-full border border-amber-500/50 bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
          Stock bajo
        </span>
      ) : null}
      <ChevronCategory open={expanded} className={style.accentIcon} />
    </button>
  );
}

function PartCard({
  part,
  deletingId,
  onEdit,
  onDelete,
  showCategoryBadge = true,
  compact = false
}: {
  part: Part;
  deletingId: string | null;
  onEdit: (part: Part) => void;
  onDelete: (part: Part) => void;
  /** Dentro de un acordeon por categoria, ocultar chip duplicado */
  showCategoryBadge?: boolean;
  compact?: boolean;
}) {
  const catStyle = getInventoryCategoryStyle((part.category ?? "OTHER") as PartCategory);

  return (
    <article
      className={`rounded-2xl border border-slate-800 bg-slate-950/50 shadow-md shadow-black/20 ${compact ? "p-3" : "p-4"}`}
    >
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
              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${catStyle.chipBg} ${catStyle.chipBorder} ${catStyle.chipText}`}
            >
              {catStyle.label}
            </span>
          ) : null}
          <PartConditionBadge part={part} />
        </div>

        <dl
          className={`grid grid-cols-1 border-t border-slate-800/80 text-sm sm:grid-cols-2 ${compact ? "gap-2 pt-2" : "gap-3 pt-3"}`}
        >
          <div className="flex justify-between gap-3 sm:flex-col sm:justify-start">
            <dt className="text-xs uppercase tracking-wide text-slate-500">Precio coste</dt>
            <dd className="font-medium text-slate-200">{formatCostPrice(part.costPrice)}</dd>
          </div>
          <div className="flex justify-between gap-3 sm:flex-col sm:justify-start">
            <dt className="text-xs uppercase tracking-wide text-slate-500">Precio venta</dt>
            <dd className="font-medium text-emerald-300/95">{formatMoney(part.salePrice)}</dd>
          </div>
          {part.stock !== 0 || (part.category != null && isNonStockCategory(part.category)) ? (
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
    const key = p.category ?? "OTHER";
    const list = map.get(key) ?? [];
    list.push(p);
    map.set(key, list);
  }
  return Array.from(map.entries()).map(([category, items]) => ({ category, items }));
}

function groupPartsByCategoryOrdered(parts: Part[]): { category: string; items: Part[] }[] {
  const result: { category: string; items: Part[] }[] = [];
  for (const cat of PART_CATEGORIES) {
    const items = parts.filter((p) => p.category != null && p.category === cat);
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
  onDelete,
  compact = false,
  categoryStockTotals,
  categoryStockThreshold = 3
}: {
  parts: Part[];
  deletingId: string | null;
  onEdit: (part: Part) => void;
  onDelete: (part: Part) => void;
  compact?: boolean;
  categoryStockTotals?: Map<PartCategory, number>;
  categoryStockThreshold?: number;
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
    <section className={`md:hidden ${compact ? "space-y-2" : "space-y-3"}`}>
      {groups.map(({ category, items }) => {
        const expanded = isOpen(category);
        const panelId = `inv-cat-${category}`;
        const catStyle = getInventoryCategoryStyle(category);
        const unitTotal = categoryStockTotals?.get(category as PartCategory);
        let pieceSummary = `${items.length} pieza${items.length === 1 ? "" : "s"} en esta pagina`;
        if (unitTotal !== undefined) {
          pieceSummary += ` · ${unitTotal} u. en categoría`;
        }
        const categoryLowStock =
          unitTotal !== undefined && unitTotal < categoryStockThreshold;
        return (
          <div
            key={category}
            className={`overflow-hidden rounded-2xl border shadow-lg shadow-black/25 transition-colors duration-200 ${catStyle.panelBg} ${catStyle.panelBorder} ${catStyle.panelHover}`}
          >
            <CategoryAccordionTrigger
              categoryKey={category as PartCategory}
              pieceSummary={pieceSummary}
              expanded={expanded}
              panelId={panelId}
              onToggle={() => toggle(category)}
              compact={compact}
              categoryLowStock={categoryLowStock}
            />
            <div
              id={panelId}
              className={
                expanded
                  ? `border-t border-slate-800 px-3 pt-1 ${compact ? "pb-2" : "pb-3"}`
                  : "hidden"
              }
            >
              <div className={`pt-2 ${compact ? "space-y-2" : "space-y-3"}`}>
                {items.map((part) => (
                  <PartCard
                    key={part.id}
                    part={part}
                    deletingId={deletingId}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    showCategoryBadge={false}
                    compact={compact}
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
  onDelete,
  compact = false,
  categoryStockTotals,
  categoryStockThreshold = 3
}: {
  parts: Part[];
  deletingId: string | null;
  onEdit: (part: Part) => void;
  onDelete: (part: Part) => void;
  compact?: boolean;
  categoryStockTotals?: Map<PartCategory, number>;
  categoryStockThreshold?: number;
}) {
  const groups = useMemo(() => groupPartsByCategoryOrdered(parts), [parts]);

  /** Solo true = abierto (por defecto plegado, igual que en movil) */
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});

  const isOpen = (category: string) => openMap[category] === true;

  const toggle = (category: string) => {
    setOpenMap((prev) => ({
      ...prev,
      [category]: !(prev[category] === true)
    }));
  };

  const cell = compact ? "px-3 py-2" : "px-4 py-3";

  return (
    <section className={`hidden md:block ${compact ? "space-y-2" : "space-y-3"}`}>
      {groups.map(({ category, items }) => {
        const expanded = isOpen(category);
        const panelId = `inv-desktop-cat-${category}`;
        const catStyle = getInventoryCategoryStyle(category);
        const unitTotal = categoryStockTotals?.get(category as PartCategory);
        let pieceSummary = `${items.length} pieza${items.length === 1 ? "" : "s"}`;
        if (unitTotal !== undefined) {
          pieceSummary += ` · ${unitTotal} u. en categoría`;
        }
        const categoryLowStock =
          unitTotal !== undefined && unitTotal < categoryStockThreshold;
        return (
          <div
            key={category}
            className={`overflow-hidden rounded-2xl border shadow-lg shadow-black/25 transition-colors duration-200 ${catStyle.panelBg} ${catStyle.panelBorder} ${catStyle.panelHover}`}
          >
            <CategoryAccordionTrigger
              categoryKey={category as PartCategory}
              pieceSummary={pieceSummary}
              expanded={expanded}
              panelId={panelId}
              onToggle={() => toggle(category)}
              compact={compact}
              categoryLowStock={categoryLowStock}
            />
            <div id={panelId} className={expanded ? "border-t border-slate-800" : "hidden"}>
              <div className="overflow-x-auto">
                <table className={`min-w-full text-left text-slate-200 ${compact ? "text-xs" : "text-sm"}`}>
                  <thead className="bg-slate-950/70 text-xs uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className={cell}>Nombre</th>
                      <th className={cell}>Estado</th>
                      <th className={cell}>Precio coste</th>
                      <th className={cell}>Precio venta</th>
                      <th className={cell}>Stock</th>
                      <th className={`${cell} text-right`}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {items.map((part) => (
                      <tr key={part.id} className="transition hover:bg-slate-800/50">
                        <td className={`${cell} font-medium text-slate-100`}>{part.name}</td>
                        <td className={cell}>
                          <PartConditionBadge part={part} />
                        </td>
                        <td className={`${cell} text-slate-300`}>{formatCostPrice(part.costPrice)}</td>
                        <td className={`${cell} text-slate-300`}>{formatMoney(part.salePrice)}</td>
                        <td className={cell}>
                          <StockBadges part={part} />
                        </td>
                        <td className={cell}>
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
  compact = false,
  loading,
  deletingId,
  categoryStockTotals,
  categoryStockThreshold = 3,
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
      <DesktopPartsByCategory
        parts={parts}
        deletingId={deletingId}
        onEdit={onEdit}
        onDelete={onDelete}
        compact={compact}
        categoryStockTotals={categoryStockTotals}
        categoryStockThreshold={categoryStockThreshold}
      />

      {/* Movil: tarjetas agrupadas por categoria (acordeon); opcionalmente paginado */}
      <MobilePartsByCategory
        parts={mobileParts}
        deletingId={deletingId}
        onEdit={onEdit}
        onDelete={onDelete}
        compact={compact}
        categoryStockTotals={categoryStockTotals}
        categoryStockThreshold={categoryStockThreshold}
      />
    </>
  );
}
