import type { BuildExtraLine, BuildStatus } from "../../types/build";
import { SECTION_SHELL, TABLE_CELL } from "../../theme/layoutDensity";

type BuildExtraLinesTableProps = {
  lines: BuildExtraLine[];
  status: BuildStatus;
  actionLoading: boolean;
  onRemove: (lineId: string) => Promise<void>;
  onUpdateLine?: (lineId: string, unitSalePrice: number, unitCost?: number) => Promise<void>;
  /** Cabecera de sección más compacta (detalle montaje). */
  compactHeader?: boolean;
};

function money(value: number | string): string {
  return `${Number(value).toFixed(2)} EUR`;
}

function defaultSale(line: BuildExtraLine): number {
  return line.extraTemplate ? Number(line.extraTemplate.defaultSalePrice) : Number(line.unitSalePrice);
}

function defaultCost(line: BuildExtraLine): number {
  return line.extraTemplate ? Number(line.extraTemplate.defaultCostPrice) : Number(line.unitCost);
}

export function BuildExtraLinesTable({
  lines,
  status,
  actionLoading,
  onRemove,
  onUpdateLine,
  compactHeader = false
}: BuildExtraLinesTableProps) {
  const templateLines = lines.filter((l) => l.extraTemplateId != null);
  if (templateLines.length === 0) {
    return null;
  }

  const editable = status === "DRAFT" && onUpdateLine !== undefined;

  return (
    <section
      className={`overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-lg shadow-slate-950/40 ${compactHeader ? "mt-3" : "mt-6"}`}
    >
      <div className={`border-b border-slate-800 ${compactHeader ? "px-3 py-2" : "px-4 py-3"}`}>
        <h2
          className={
            compactHeader
              ? "text-sm font-semibold tracking-tight text-slate-200"
              : "text-sm font-semibold uppercase tracking-wide text-slate-400"
          }
        >
          Extras
        </h2>
        {!compactHeader ? (
          <p className="mt-1 text-xs text-slate-500">SO, instalaciones, packs — no descuentan inventario.</p>
        ) : null}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm text-slate-200">
          <thead className="bg-slate-950/70 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className={TABLE_CELL}>Concepto</th>
              <th className={TABLE_CELL}>Cantidad</th>
              <th className={TABLE_CELL}>Coste unit.</th>
              <th className={TABLE_CELL}>Venta unit.</th>
              <th className={`${TABLE_CELL} text-right`}>Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {templateLines.map((line) => {
              const cat = line.extraTemplate?.category?.trim();
              const sale = Number(line.unitSalePrice);
              const cost = Number(line.unitCost);
              const tplSale = defaultSale(line);
              const tplCost = defaultCost(line);
              const saleCustom = Math.abs(sale - tplSale) >= 0.005;
              const costCustom = Math.abs(cost - tplCost) >= 0.005;

              return (
                <tr key={line.id} className="transition hover:bg-slate-800/50">
                  <td className={`${TABLE_CELL} font-medium text-slate-100`}>
                    {line.name}
                    {cat ? (
                      <span className="ml-2 text-[11px] font-normal text-slate-500">({cat})</span>
                    ) : null}
                  </td>
                  <td className={`${TABLE_CELL} text-slate-300`}>{line.quantity}</td>
                  <td className={TABLE_CELL}>
                    {editable && onUpdateLine ? (
                      <div className="flex min-w-[10rem] flex-col gap-1">
                        <input
                          type="text"
                          inputMode="decimal"
                          defaultValue={cost.toFixed(2)}
                          key={`${line.id}-c-${cost.toFixed(2)}`}
                          disabled={actionLoading}
                          onBlur={(e) => {
                            const raw = e.target.value.trim().replace(",", ".");
                            if (raw === "") {
                              void onUpdateLine(line.id, sale, tplCost);
                              return;
                            }
                            const n = Number(raw);
                            if (!Number.isFinite(n) || n < 0) return;
                            void onUpdateLine(line.id, sale, Math.round(n * 100) / 100);
                          }}
                          className="w-full max-w-[8rem] rounded-lg border border-slate-600 bg-slate-950/70 px-2 py-1.5 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring disabled:opacity-50"
                        />
                        <button
                          type="button"
                          disabled={actionLoading || !costCustom}
                          onClick={() => void onUpdateLine(line.id, sale, tplCost)}
                          className="self-start rounded-md border border-slate-600 px-2 py-0.5 text-[10px] font-medium text-slate-400 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Plantilla
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-300">{money(line.unitCost)}</span>
                    )}
                  </td>
                  <td className={TABLE_CELL}>
                    {editable && onUpdateLine ? (
                      <div className="flex min-w-[10rem] flex-col gap-1">
                        <input
                          type="text"
                          inputMode="decimal"
                          defaultValue={sale.toFixed(2)}
                          key={`${line.id}-s-${sale.toFixed(2)}`}
                          disabled={actionLoading}
                          onBlur={(e) => {
                            const raw = e.target.value.trim().replace(",", ".");
                            if (raw === "") {
                              void onUpdateLine(line.id, tplSale, cost);
                              return;
                            }
                            const n = Number(raw);
                            if (!Number.isFinite(n) || n < 0) return;
                            void onUpdateLine(line.id, Math.round(n * 100) / 100, cost);
                          }}
                          className="w-full max-w-[8rem] rounded-lg border border-slate-600 bg-slate-950/70 px-2 py-1.5 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring disabled:opacity-50"
                        />
                        <button
                          type="button"
                          disabled={actionLoading || !saleCustom}
                          onClick={() => void onUpdateLine(line.id, tplSale, cost)}
                          className="self-start rounded-md border border-slate-600 px-2 py-0.5 text-[10px] font-medium text-slate-400 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Plantilla
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-300">
                        {money(line.unitSalePrice)}
                        {saleCustom ? (
                          <span
                            className="ml-1.5 text-amber-300/90"
                            title={`Distinto de plantilla (${tplSale.toFixed(2)} EUR)`}
                          >
                            *
                          </span>
                        ) : null}
                      </span>
                    )}
                  </td>
                  <td className={`${TABLE_CELL} text-right`}>
                    <button
                      type="button"
                      onClick={() => void onRemove(line.id)}
                      disabled={status !== "DRAFT" || actionLoading}
                      className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Quitar
                    </button>
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

export function BuildExtraLinesEmptyHint() {
  return (
    <section className={`${SECTION_SHELL} mt-4`}>
      <p className="text-sm text-slate-400">
        Anade plantillas de extras (sin stock) desde el selector en borrador, o gestionalas en Inventario: pestaña
        «Nueva pieza» → «Servicio/extra sin stock».
      </p>
    </section>
  );
}
