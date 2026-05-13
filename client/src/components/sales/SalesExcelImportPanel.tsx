import { useCallback, useRef, useState, type ChangeEvent } from "react";
import * as salesApi from "../../api/sales";
import type { SalesImportPreviewRow } from "../../types/sale";
import { SECONDARY_BUTTON_SM } from "../../theme/actionButtons";

function money(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${n.toFixed(2)} EUR`;
}

function formatPreviewDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}

type SalesExcelImportPanelProps = {
  onImported: () => void;
};

export function SalesExcelImportPanel({ onImported }: SalesExcelImportPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<SalesImportPreviewRow[] | null>(null);
  const [sourceFileName, setSourceFileName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultMsg, setResultMsg] = useState<string | null>(null);

  const openPicker = () => {
    setError(null);
    setResultMsg(null);
    inputRef.current?.click();
  };

  const onFileChange = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setError(null);
    setResultMsg(null);
    setPreview(null);
    setSourceFileName(null);
    try {
      const { rows } = await salesApi.salesImportPreview(file);
      setPreview(rows);
      setSourceFileName(file.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo generar la vista previa.");
    } finally {
      setBusy(false);
    }
  }, []);

  const validRows = preview?.filter((r) => r.ok) ?? [];
  const invalidCount = preview ? preview.length - validRows.length : 0;

  const confirmImport = async () => {
    if (!preview || validRows.length === 0) return;
    setBusy(true);
    setError(null);
    setResultMsg(null);
    try {
      const rows = validRows.map((r) => ({
        sheetRow: r.sheetRow,
        soldAt: r.soldAt as string,
        customerName: r.customerName as string,
        description: r.description,
        totalCost: r.totalCost as number,
        finalSalePrice: r.finalSalePrice as number,
        customerPhone: r.customerPhone
      }));
      const res = await salesApi.salesImportConfirm({
        rows,
        ...(sourceFileName ? { sourceFileName } : {})
      });
      const failedNote =
        res.failed.length > 0
          ? ` Fallos: ${res.failed.map((f) => `fila ${f.sheetRow}`).join(", ")}.`
          : "";
      const batchNote =
        res.created > 0
          ? ` Lote: ${res.importBatchId} (importado ${new Date(res.importedAt).toLocaleString("es-ES")}). Puedes revertir este lote abajo si hace falta.`
          : "";
      setResultMsg(`Importadas ${res.created} venta(s).${batchNote}${failedNote}`);
      setPreview(null);
      setSourceFileName(null);
      onImported();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al confirmar la importación.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/40 md:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Importar ventas históricas</h2>
          <p className="mt-1 max-w-xl text-sm text-slate-400">
            Hoja <span className="font-medium text-slate-300">Registro de Ventas</span> (.xlsx / .xls) o CSV con
            las mismas columnas. Primero vista previa; no se guarda nada hasta confirmar.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
            className="hidden"
            onChange={(ev) => void onFileChange(ev)}
          />
          <button
            type="button"
            disabled={busy}
            onClick={openPicker}
            className={`${SECONDARY_BUTTON_SM} min-h-[40px]`}
          >
            {busy && !preview ? "Leyendo…" : "Importar Excel"}
          </button>
          {preview && validRows.length > 0 ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void confirmImport()}
              className="min-h-[40px] rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Importando…" : "Confirmar importación"}
            </button>
          ) : null}
        </div>
      </div>

      {error ? (
        <p className="mt-3 rounded-lg border border-rose-800/60 bg-rose-950/40 px-3 py-2 text-sm text-rose-100">
          {error}
        </p>
      ) : null}
      {resultMsg ? (
        <p className="mt-3 rounded-lg border border-emerald-800/50 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-100">
          {resultMsg}
        </p>
      ) : null}

      {preview && preview.length > 0 ? (
        <div className="mt-4 space-y-2">
          <p className="text-sm text-slate-400">
            {preview.length} fila(s) · {validRows.length} válida(s) para importar
            {invalidCount > 0 ? ` · ${invalidCount} con errores` : ""}
          </p>
          <div className="max-h-[420px] overflow-auto rounded-lg border border-slate-800">
            <table className="min-w-full text-left text-sm text-slate-200">
              <thead className="sticky top-0 bg-slate-950/95 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-3 py-2">Fila</th>
                  <th className="px-3 py-2">Fecha</th>
                  <th className="px-3 py-2">Cliente</th>
                  <th className="px-3 py-2">Descripción</th>
                  <th className="px-3 py-2 text-right">Coste</th>
                  <th className="px-3 py-2 text-right">Venta</th>
                  <th className="px-3 py-2 text-right">Beneficio</th>
                  <th className="px-3 py-2">Errores</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((row) => (
                  <tr
                    key={row.sheetRow}
                    className={row.ok ? "border-t border-slate-800/80" : "border-t border-rose-900/40 bg-rose-950/20"}
                  >
                    <td className="px-3 py-2 font-mono text-xs text-slate-400">{row.sheetRow}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{formatPreviewDate(row.soldAt)}</td>
                    <td className="px-3 py-2 max-w-[140px] truncate" title={row.customerName ?? ""}>
                      {row.customerName ?? "—"}
                    </td>
                    <td className="px-3 py-2 max-w-[200px] truncate text-slate-400" title={row.description ?? ""}>
                      {row.description ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{money(row.totalCost)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{money(row.finalSalePrice)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-emerald-300/90">
                      {money(row.profitCalculated)}
                    </td>
                    <td className="px-3 py-2 text-xs text-rose-200">
                      {row.errors.length ? row.errors.join(" ") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </section>
  );
}
