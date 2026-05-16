import type { BuildExtraLine, BuildStatus } from "../../types/build";
import { TABLE_CELL } from "../../theme/layoutDensity";
import { DESTRUCTIVE_BUTTON_SM } from "../../theme/actionButtons";

type BuildManualLinesTableProps = {
  lines: BuildExtraLine[];
  status: BuildStatus;
  actionLoading: boolean;
  onRemove: (lineId: string) => Promise<void>;
  onUpdateLine?: (lineId: string, unitSalePrice: number, unitCost?: number) => Promise<void>;
};

function money(value: number | string): string {
  return `${Number(value).toFixed(2)} EUR`;
}

export function isManualBuildLine(line: BuildExtraLine): boolean {
  return line.extraTemplateId == null;
}

export function BuildManualLinesTable({
  lines,
  status,
  actionLoading,
  onRemove,
  onUpdateLine
}: BuildManualLinesTableProps) {
  const manualLines = lines.filter(isManualBuildLine);
  if (manualLines.length === 0) {
    return null;
  }

  const editable = status === "DRAFT" && onUpdateLine !== undefined;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-lg shadow-slate-950/40">
      <div className="border-b border-slate-800 px-3 py-2 md:px-4">
        <h3 className="text-sm font-semibold text-slate-100">Conceptos manuales</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm text-slate-200">
          <thead className="bg-slate-950/70 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className={TABLE_CELL}>Concepto</th>
              <th className={TABLE_CELL}>Cant.</th>
              <th className={TABLE_CELL}>Coste unit.</th>
              <th className={TABLE_CELL}>Venta unit.</th>
              <th className={`${TABLE_CELL} text-right`}>Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {manualLines.map((line) => {
              const sale = Number(line.unitSalePrice);
              const cost = Number(line.unitCost);

              return (
                <tr key={line.id} className="transition hover:bg-slate-800/50">
                  <td className={TABLE_CELL}>
                    <div className="font-medium text-slate-100">{line.name}</div>
                    {line.description?.trim() ? (
                      <p className="mt-0.5 text-xs text-slate-500">{line.description}</p>
                    ) : null}
                  </td>
                  <td className={`${TABLE_CELL} tabular-nums`}>{line.quantity}</td>
                  <td className={TABLE_CELL}>
                    {editable ? (
                      <input
                        type="text"
                        inputMode="decimal"
                        defaultValue={cost.toFixed(2)}
                        disabled={actionLoading}
                        className="w-24 rounded border border-slate-700 bg-slate-950/70 px-2 py-1 text-sm tabular-nums outline-none focus:border-indigo-400 focus:ring"
                        onBlur={(e) => {
                          const v = Number(e.target.value.replace(",", "."));
                          const nextSale = Number(line.unitSalePrice);
                          if (!Number.isFinite(v) || v < 0) return;
                          if (Math.abs(v - cost) < 0.005) return;
                          void onUpdateLine(line.id, nextSale, v);
                        }}
                      />
                    ) : (
                      money(cost)
                    )}
                  </td>
                  <td className={TABLE_CELL}>
                    {editable ? (
                      <input
                        type="text"
                        inputMode="decimal"
                        defaultValue={sale.toFixed(2)}
                        disabled={actionLoading}
                        className="w-24 rounded border border-slate-700 bg-slate-950/70 px-2 py-1 text-sm tabular-nums outline-none focus:border-indigo-400 focus:ring"
                        onBlur={(e) => {
                          const v = Number(e.target.value.replace(",", "."));
                          if (!Number.isFinite(v) || v < 0) return;
                          if (Math.abs(v - sale) < 0.005) return;
                          void onUpdateLine(line.id, v, cost);
                        }}
                      />
                    ) : (
                      money(sale)
                    )}
                  </td>
                  <td className={`${TABLE_CELL} text-right`}>
                    {status === "DRAFT" ? (
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => void onRemove(line.id)}
                        className={DESTRUCTIVE_BUTTON_SM}
                      >
                        Quitar
                      </button>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
