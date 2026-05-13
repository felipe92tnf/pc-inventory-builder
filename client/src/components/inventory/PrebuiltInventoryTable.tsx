import type { Part } from "../../types/part";
import { StatusBadge, partConditionVariant } from "../ui/StatusBadge";
import { SECONDARY_GHOST_SM, DESTRUCTIVE_BUTTON_SM } from "../../theme/actionButtons";
import { SECTION_SHELL } from "../../theme/layoutDensity";

type PrebuiltInventoryTableProps = {
  items: Part[];
  compact?: boolean;
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

const MOBILE_CARD_BTN =
  "min-h-[44px] w-full justify-center px-4 py-2.5 text-sm font-semibold";

export function PrebuiltInventoryTable({
  items,
  compact = false,
  loading,
  deletingId,
  onEdit,
  onDelete,
  emptyMessage
}: PrebuiltInventoryTableProps) {
  if (loading) {
    return (
      <section className={SECTION_SHELL}>
        <p className="text-sm text-slate-300">Cargando...</p>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className={SECTION_SHELL}>
        <p className="text-sm text-slate-300">
          {emptyMessage ?? "No hay PCs completos en inventario todavia."}
        </p>
      </section>
    );
  }

  const cell = compact ? "px-3 py-2" : "px-3.5 py-2.5";

  return (
    <>
      <section className={`hidden md:block ${compact ? "space-y-2" : "space-y-3"}`}>
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/80 shadow-lg shadow-slate-950/40">
          <table className={`min-w-full text-left text-slate-200 ${compact ? "text-xs" : "text-sm"}`}>
            <thead className="bg-slate-950/70 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className={cell}>Nombre</th>
                <th className={cell}>Descripcion</th>
                <th className={cell}>Estado</th>
                <th className={cell}>Coste</th>
                <th className={cell}>Venta</th>
                <th className={cell}>Stock</th>
                <th className={`${cell} text-right`}>Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {items.map((part) => (
                <tr key={part.id} className="transition hover:bg-slate-800/50">
                  <td className={`${cell} font-medium text-slate-100`}>{part.name}</td>
                  <td className={`max-w-xs ${cell} text-slate-400`}>
                    <span className="line-clamp-2 text-xs">{part.description || "—"}</span>
                  </td>
                  <td className={cell}>
                    <StatusBadge variant={partConditionVariant(part.condition)} size="card">
                      {part.condition}
                    </StatusBadge>
                  </td>
                  <td className={`${cell} text-slate-300`}>{formatCostPrice(part.costPrice)}</td>
                  <td className={`${cell} text-emerald-300/95`}>{formatMoney(part.salePrice)}</td>
                  <td className={`${cell} text-slate-300`}>{part.stock}</td>
                  <td className={`${cell} text-right`}>
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => onEdit(part)} className={SECONDARY_GHOST_SM}>
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(part)}
                        disabled={deletingId === part.id}
                        className={DESTRUCTIVE_BUTTON_SM}
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
      </section>

      <section className={`md:hidden ${compact ? "space-y-2" : "space-y-3"}`}>
        {items.map((part) => (
          <article
            key={part.id}
            className={`rounded-2xl border border-cyan-500/20 bg-slate-950/50 shadow-md shadow-black/20 ${compact ? "p-3" : "p-4"}`}
          >
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="min-w-0 flex-1 break-words text-base font-semibold text-slate-100">{part.name}</h3>
                <span className="shrink-0 rounded border border-cyan-500/35 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-cyan-200">
                  PC completo
                </span>
              </div>
              {part.description ? (
                <p className="text-xs leading-relaxed text-slate-400">{part.description}</p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <StatusBadge variant={partConditionVariant(part.condition)} size="card">
                  {part.condition}
                </StatusBadge>
              </div>
              <dl className="space-y-1.5 border-t border-slate-800/80 pt-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-xs text-slate-500">Coste</dt>
                  <dd className="min-w-0 text-right font-medium text-slate-200">{formatCostPrice(part.costPrice)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-xs text-slate-500">Venta</dt>
                  <dd className="min-w-0 text-right font-medium text-emerald-300/95">{formatMoney(part.salePrice)}</dd>
                </div>
                <div className="flex justify-between gap-3 border-t border-slate-800/60 pt-1.5">
                  <dt className="text-xs text-slate-500">Stock</dt>
                  <dd className="text-right font-medium text-slate-200">{part.stock}</dd>
                </div>
              </dl>
              <div className="flex flex-col gap-2 border-t border-slate-800/80 pt-2.5">
                <button
                  type="button"
                  onClick={() => onEdit(part)}
                  className={`${SECONDARY_GHOST_SM} ${MOBILE_CARD_BTN}`}
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(part)}
                  disabled={deletingId === part.id}
                  className={`${DESTRUCTIVE_BUTTON_SM} ${MOBILE_CARD_BTN}`}
                >
                  {deletingId === part.id ? "Eliminando..." : "Eliminar"}
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
