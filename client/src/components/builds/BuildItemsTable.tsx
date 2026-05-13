import type { BuildItem, BuildStatus } from "../../types/build";
import { SECTION_SHELL, TABLE_CELL } from "../../theme/layoutDensity";

type BuildItemsTableProps = {
  items: BuildItem[];
  status: BuildStatus;
  actionLoading: boolean;
  onRemove: (itemId: string) => Promise<void>;
  /** Solo montaje en borrador: permite editar precio de venta unitario por linea (PATCH unitSalePrice). */
  onUpdateLineSale?: (itemId: string, unitSalePrice: number) => Promise<void>;
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
  onUpdateLineSale
}: BuildItemsTableProps) {
  if (items.length === 0) {
    return (
      <section className={SECTION_SHELL}>
        <p className="text-sm text-slate-300">Este montaje aun no tiene piezas.</p>
      </section>
    );
  }

  const editableSale = status === "DRAFT" && onUpdateLineSale !== undefined;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-lg shadow-slate-950/40">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm text-slate-200">
          <thead className="bg-slate-950/70 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className={TABLE_CELL}>Pieza</th>
              <th className={TABLE_CELL}>Cantidad</th>
              <th className={TABLE_CELL}>Coste unitario</th>
              <th className={TABLE_CELL}>Venta unitaria</th>
              <th className={`${TABLE_CELL} text-right`}>Acciones</th>
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
  onRemove,
  onUpdateLineSale
}: {
  item: BuildItem;
  editableSale: boolean;
  actionLoading: boolean;
  status: BuildStatus;
  onRemove: (itemId: string) => Promise<void>;
  onUpdateLineSale?: (itemId: string, unitSalePrice: number) => Promise<void>;
}) {
  const catalogSale = Number(item.part.salePrice);
  const lineSale = unitSaleForLine(item);
  const customized = differsFromCatalog(item);

  return (
    <tr className="transition hover:bg-slate-800/50">
      <td className={`${TABLE_CELL} font-medium text-slate-100`}>{item.part.name}</td>
      <td className={`${TABLE_CELL} text-slate-300`}>{item.quantity}</td>
      <td className={`${TABLE_CELL} text-slate-300`}>{money(item.unitCost)}</td>
      <td className={TABLE_CELL}>
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
                className="w-full max-w-[9rem] rounded-lg border border-slate-600 bg-slate-950/70 px-2 py-1.5 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring disabled:opacity-50"
              />
              <button
                type="button"
                disabled={actionLoading || !customized}
                onClick={() => {
                  void onUpdateLineSale(item.id, catalogSale);
                }}
                className="shrink-0 rounded-md border border-slate-600 px-2 py-1 text-[11px] font-medium text-slate-400 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Inventario
              </button>
            </div>
            <span className="text-[11px] text-slate-500">Inventario: {catalogSale.toFixed(2)} EUR</span>
          </div>
        ) : (
          <span className="text-slate-300">
            {money(lineSale)}
            {customized ? (
              <span className="ml-2 rounded border border-amber-500/35 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-200/95">
                Personalizado
              </span>
            ) : null}
          </span>
        )}
      </td>
      <td className={`${TABLE_CELL} text-right`}>
        <button
          type="button"
          onClick={() => {
            void onRemove(item.id);
          }}
          disabled={status !== "DRAFT" || actionLoading}
          className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Quitar
        </button>
      </td>
    </tr>
  );
}
