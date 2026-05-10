import type { BuildItem, BuildStatus } from "../../types/build";

type BuildItemsTableProps = {
  items: BuildItem[];
  status: BuildStatus;
  actionLoading: boolean;
  onRemove: (itemId: string) => Promise<void>;
};

function money(value: number | string): string {
  return `${Number(value).toFixed(2)} EUR`;
}

export function BuildItemsTable({ items, status, actionLoading, onRemove }: BuildItemsTableProps) {
  if (items.length === 0) {
    return (
      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg shadow-slate-950/40">
        <p className="text-sm text-slate-300">Este montaje aun no tiene piezas.</p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-lg shadow-slate-950/40">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm text-slate-200">
          <thead className="bg-slate-950/70 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-3">Pieza</th>
              <th className="px-4 py-3">Cantidad</th>
              <th className="px-4 py-3">Coste unitario</th>
              <th className="px-4 py-3">Venta unitaria</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {items.map((item) => (
              <tr key={item.id} className="transition hover:bg-slate-800/50">
                <td className="px-4 py-3 font-medium text-slate-100">{item.part.name}</td>
                <td className="px-4 py-3 text-slate-300">{item.quantity}</td>
                <td className="px-4 py-3 text-slate-300">{money(item.part.costPrice)}</td>
                <td className="px-4 py-3 text-slate-300">{money(item.part.salePrice)}</td>
                <td className="px-4 py-3 text-right">
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
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
