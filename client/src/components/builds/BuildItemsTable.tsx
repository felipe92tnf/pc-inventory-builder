import type { BuildItem, BuildStatus } from "../../types/build";
import { TABLE_CELL } from "../../theme/layoutDensity";

type BuildItemsTableProps = {
  items: BuildItem[];
  status: BuildStatus;
  actionLoading: boolean;
  onRemove: (itemId: string) => Promise<void>;
  /** Solo montaje en borrador: permite editar precio de venta unitario por linea (PATCH unitSalePrice). */
  onUpdateLineSale?: (itemId: string, unitSalePrice: number) => Promise<void>;
  /** Tabla más destacada (detalle montaje). */
  prominent?: boolean;
  /** Filas más bajas (detalle montaje compacto). */
  compactDensity?: boolean;
};

function money(value: number | string): string {
  return `${Number(value).toFixed(2)} EUR`;
}

export function unitSaleForLine(item: BuildItem): number {
  return Number(item.unitSalePrice);
}

function differsFromCatalog(item: BuildItem): boolean {
  const catalogSale = Number(item.part.salePrice);
  return Math.abs(Number(item.unitSalePrice) - catalogSale) >= 0.005;
}

export function BuildItemsTable({
  items,
  status,
  actionLoading,
  onRemove,
  onUpdateLineSale,
  prominent = false,
  compactDensity = false
}: BuildItemsTableProps) {
  if (items.length === 0) {
    return (
      <section className="rounded-xl border border-slate-800/90 bg-slate-900/60 px-3 py-2.5">
        <p className="text-xs text-slate-400">Sin piezas en el montaje.</p>
      </section>
    );
  }

  const editableSale = status === "DRAFT" && onUpdateLineSale !== undefined;
  const dense = prominent && compactDensity;
  const th = dense
    ? "px-2.5 py-2 text-[11px] font-semibold"
    : prominent
      ? "px-3 py-3 text-sm font-semibold"
      : TABLE_CELL;
  const tdBase = dense ? "px-2.5 py-2 text-sm" : prominent ? "px-3 py-3 text-sm" : TABLE_CELL;
  const partCell = dense
    ? `${tdBase} font-semibold text-slate-50`
    : prominent
      ? `${tdBase} text-base font-semibold text-slate-50`
      : `${tdBase} font-medium text-slate-100`;
  const qtyCell = dense
    ? `${tdBase} tabular-nums text-slate-200`
    : prominent
      ? `${tdBase} text-base tabular-nums text-slate-200`
      : `${tdBase} text-slate-300`;
  const moneyCell = dense
    ? `${tdBase} tabular-nums text-slate-200`
    : prominent
      ? `${tdBase} text-base tabular-nums text-slate-200`
      : `${tdBase} text-slate-300`;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-lg shadow-slate-950/40">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-slate-200">
          <thead className="bg-slate-950/70 text-slate-400">
            <tr className={dense ? "text-[11px] uppercase tracking-wide" : prominent ? "text-sm uppercase tracking-wide" : "text-xs uppercase tracking-wide"}>
              <th className={th}>Pieza</th>
              <th className={th}>Cantidad</th>
              <th className={th}>Coste u.</th>
              <th className={th}>Venta u.</th>
              <th className={`${th} text-right`}>Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {items.map((item) => (
              <BuildItemRow
                key={item.id}
                item={item}
                editableSale={editableSale}
                actionLoading={actionLoading}
                status={status}
                prominent={prominent}
                compactDensity={compactDensity}
                onRemove={onRemove}
                onUpdateLineSale={onUpdateLineSale}
              />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function BuildItemRow({
  item,
  editableSale,
  actionLoading,
  status,
  prominent,
  compactDensity = false,
  onRemove,
  onUpdateLineSale
}: {
  item: BuildItem;
  editableSale: boolean;
  actionLoading: boolean;
  status: BuildStatus;
  prominent?: boolean;
  compactDensity?: boolean;
  onRemove: (itemId: string) => Promise<void>;
  onUpdateLineSale?: (itemId: string, unitSalePrice: number) => Promise<void>;
}) {
  const catalogSale = Number(item.part.salePrice);
  const lineSale = unitSaleForLine(item);
  const customized = differsFromCatalog(item);
  const dense = prominent && compactDensity;
  const tdBase = dense ? "px-2.5 py-2 text-sm" : prominent ? "px-3 py-3 text-sm" : TABLE_CELL;
  const partCell = dense
    ? `${tdBase} font-semibold text-slate-50`
    : prominent
      ? `${tdBase} text-base font-semibold text-slate-50`
      : `${tdBase} font-medium text-slate-100`;
  const qtyCell = dense
    ? `${tdBase} tabular-nums text-slate-200`
    : prominent
      ? `${tdBase} text-base tabular-nums text-slate-200`
      : `${tdBase} text-slate-300`;
  const moneyCell = dense
    ? `${tdBase} tabular-nums text-slate-200`
    : prominent
      ? `${tdBase} text-base tabular-nums text-slate-200`
      : `${tdBase} text-slate-300`;

  return (
    <tr className="transition hover:bg-slate-800/50">
      <td className={partCell}>{item.part.name}</td>
      <td className={qtyCell}>{item.quantity}</td>
      <td className={moneyCell}>{money(item.unitCost)}</td>
      <td className={tdBase}>
        {editableSale && onUpdateLineSale ? (
          <div className="flex min-w-[12rem] flex-col gap-1 sm:min-w-[14rem]">
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                inputMode="decimal"
                defaultValue={lineSale.toFixed(2)}
                key={`${item.id}-${lineSale.toFixed(2)}`}
                disabled={actionLoading}
                onBlur={(event) => {
                  const raw = event.target.value.trim().replace(",", ".");
                  if (raw === "") {
                    void onUpdateLineSale(item.id, catalogSale);
                    return;
                  }
                  const n = Number(raw);
                  if (!Number.isFinite(n) || n < 0) {
                    return;
                  }
                  const rounded = Math.round(n * 100) / 100;
                  void onUpdateLineSale(item.id, rounded);
                }}
                className="w-full max-w-[9rem] rounded-md border border-slate-600 bg-slate-950/70 px-2 py-1 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring disabled:opacity-50"
                title={`Catálogo: ${catalogSale.toFixed(2)} EUR`}
              />
              <button
                type="button"
                disabled={actionLoading || !customized}
                onClick={() => {
                  void onUpdateLineSale(item.id, catalogSale);
                }}
                className="shrink-0 rounded-md border border-slate-600 px-2 py-1 text-[11px] font-medium text-slate-400 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Catálogo
              </button>
            </div>
          </div>
        ) : (
          <span className="text-slate-300">
            {money(lineSale)}
            {customized ? (
              <span
                className="ml-1.5 text-amber-300/90"
                title={`Precio distinto del catálogo (${catalogSale.toFixed(2)} EUR)`}
              >
                *
              </span>
            ) : null}
          </span>
        )}
      </td>
      <td className={`${tdBase} text-right`}>
        <button
          type="button"
          onClick={() => {
            void onRemove(item.id);
          }}
          disabled={status !== "DRAFT" || actionLoading}
          className="rounded-md border border-rose-500/40 bg-rose-500/10 px-2.5 py-1 text-[11px] font-semibold text-rose-200 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Quitar
        </button>
      </td>
    </tr>
  );
}
