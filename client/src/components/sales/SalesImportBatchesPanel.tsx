import { useCallback, useEffect, useState } from "react";
import * as salesApi from "../../api/sales";
import {
  SALES_IMPORT_REVERT_CONFIRM_PHRASE,
  type SalesImportBatchPreview,
  type SalesImportBatchRow
} from "../../types/sale";
import { SECONDARY_BUTTON_SM, SECONDARY_GHOST_SM } from "../../theme/actionButtons";

function money(n: number): string {
  return `${n.toFixed(2)} EUR`;
}

function formatImportedAt(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}

type SalesImportBatchesPanelProps = {
  onReverted: () => void;
};

export function SalesImportBatchesPanel({ onReverted }: SalesImportBatchesPanelProps) {
  const [batches, setBatches] = useState<SalesImportBatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revertTarget, setRevertTarget] = useState<SalesImportBatchRow | null>(null);
  const [preview, setPreview] = useState<SalesImportBatchPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [revertBusy, setRevertBusy] = useState(false);
  const [revertError, setRevertError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [reviewTarget, setReviewTarget] = useState<SalesImportBatchRow | null>(null);
  const [reviewPreview, setReviewPreview] = useState<SalesImportBatchPreview | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const exitRevertModal = useCallback(() => {
    setRevertTarget(null);
    setPreview(null);
    setConfirmText("");
    setRevertError(null);
  }, []);

  const exitReviewModal = useCallback(() => {
    setReviewTarget(null);
    setReviewPreview(null);
    setReviewError(null);
  }, []);

  const loadBatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { batches: rows } = await salesApi.listSalesImportBatches();
      setBatches(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron cargar las importaciones.");
      setBatches([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBatches();
  }, [loadBatches]);

  const openRevert = (row: SalesImportBatchRow) => {
    exitReviewModal();
    setRevertTarget(row);
    setPreview(null);
    setConfirmText("");
    setRevertError(null);
    setPreviewLoading(true);
    void salesApi
      .previewSalesImportBatchRevert(row.batchId)
      .then((p) => setPreview(p))
      .catch((e) => {
        setRevertError(e instanceof Error ? e.message : "No se pudo cargar la vista previa.");
      })
      .finally(() => setPreviewLoading(false));
  };

  const openReview = (row: SalesImportBatchRow) => {
    exitRevertModal();
    setReviewTarget(row);
    setReviewPreview(null);
    setReviewError(null);
    setReviewLoading(true);
    void salesApi
      .previewSalesImportBatchRevert(row.batchId)
      .then((p) => setReviewPreview(p))
      .catch((e) => {
        setReviewError(e instanceof Error ? e.message : "No se pudo cargar el detalle.");
      })
      .finally(() => setReviewLoading(false));
  };

  const executeRevert = async () => {
    if (!revertTarget) return;
    setRevertBusy(true);
    setRevertError(null);
    try {
      const res = await salesApi.revertSalesImportBatch(revertTarget.batchId, confirmText);
      exitRevertModal();
      await loadBatches();
      onReverted();
      setSuccessMsg(`Se eliminaron ${res.deleted} venta(s) importadas del lote. Las ventas manuales no se han modificado.`);
      window.setTimeout(() => setSuccessMsg(null), 10000);
    } catch (e) {
      setRevertError(e instanceof Error ? e.message : "Error al revertir.");
    } finally {
      setRevertBusy(false);
    }
  };

  const fileLabel = (row: SalesImportBatchRow) => {
    if (row.isLegacyUnbatched) return "—";
    return row.sourceFileName?.trim() || "—";
  };

  return (
    <>
      <section className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/40 md:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Historial de importaciones</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-400">
              Cada importación confirmada queda agrupada por <span className="font-medium text-slate-300">lote</span>{" "}
              (<code className="text-slate-500">importBatchId</code>). Puedes revisar el detalle o revertir un lote:
              solo se eliminan ventas importadas de ese lote; no se tocan ventas manuales, servicios ni inventario.
            </p>
          </div>
          <button type="button" disabled={loading} onClick={() => void loadBatches()} className={SECONDARY_BUTTON_SM}>
            Actualizar lista
          </button>
        </div>

        {successMsg ? (
          <p className="mt-3 rounded-lg border border-emerald-800/50 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-100">
            {successMsg}
          </p>
        ) : null}

        {error ? (
          <p className="mt-3 rounded-lg border border-rose-800/60 bg-rose-950/40 px-3 py-2 text-sm text-rose-100">
            {error}
          </p>
        ) : null}

        {loading ? (
          <p className="mt-4 text-sm text-slate-400">Cargando historial…</p>
        ) : batches.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">No hay importaciones registradas.</p>
        ) : (
          <div className="mt-4 max-h-[420px] overflow-auto rounded-lg border border-slate-800">
            <table className="min-w-full text-left text-sm text-slate-200">
              <thead className="sticky top-0 bg-slate-950/95 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-3 py-2 font-semibold">Fecha importación</th>
                  <th className="px-3 py-2 font-semibold">Archivo</th>
                  <th className="px-3 py-2 font-semibold">Ventas</th>
                  <th className="px-3 py-2 text-right font-semibold">Total ventas</th>
                  <th className="px-3 py-2 text-right font-semibold">Beneficio</th>
                  <th className="px-3 py-2 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900/40">
                {batches.map((row) => (
                  <tr key={row.batchId} className="hover:bg-slate-800/40">
                    <td className="px-3 py-2 whitespace-nowrap text-slate-300">
                      {row.isLegacyUnbatched ? (
                        <span className="text-amber-200/90">Sin lote (histórico)</span>
                      ) : (
                        formatImportedAt(row.importedAt)
                      )}
                    </td>
                    <td
                      className="max-w-[200px] truncate px-3 py-2 text-slate-300"
                      title={row.isLegacyUnbatched ? row.batchId : `${fileLabel(row)} · ${row.batchId}`}
                    >
                      {fileLabel(row)}
                    </td>
                    <td className="px-3 py-2 tabular-nums">{row.salesCount}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-emerald-300/90">{money(row.totalRevenue)}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-medium text-slate-100">{money(row.totalProfit)}</td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openReview(row)}
                          className={`${SECONDARY_GHOST_SM} shrink-0`}
                        >
                          Revisar
                        </button>
                        <button
                          type="button"
                          onClick={() => openRevert(row)}
                          className="shrink-0 rounded-lg border border-rose-800/70 bg-rose-950/40 px-2.5 py-1.5 text-xs font-semibold text-rose-100 transition hover:bg-rose-900/50"
                        >
                          Revertir importación
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {batches.some((b) => b.isLegacyUnbatched) ? (
          <p className="mt-3 text-xs text-amber-200/80">
            Las filas <span className="font-semibold">Sin lote (histórico)</span> agrupan importaciones antiguas sin
            identificador de lote ni nombre de archivo. Revertirlas borra todas esas ventas importadas a la vez.
          </p>
        ) : null}
      </section>

      {reviewTarget ? (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Cerrar"
            className="absolute inset-0 bg-black/75 backdrop-blur-[2px]"
            onClick={() => !reviewLoading && exitReviewModal()}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-import-title"
            className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl shadow-black/60"
          >
            <h2 id="review-import-title" className="text-lg font-semibold text-slate-100">
              Detalle de importación
            </h2>
            <dl className="mt-3 space-y-1 text-sm text-slate-400">
              <div className="flex flex-wrap gap-x-2">
                <dt className="text-slate-500">Archivo</dt>
                <dd className="min-w-0 break-all font-medium text-slate-200">
                  {reviewTarget.sourceFileName?.trim() || reviewPreview?.sourceFileName?.trim() || "—"}
                </dd>
              </div>
              <div className="flex flex-wrap gap-x-2">
                <dt className="text-slate-500">Fecha importación</dt>
                <dd className="text-slate-200">
                  {reviewTarget.isLegacyUnbatched ? "—" : formatImportedAt(reviewTarget.importedAt)}
                </dd>
              </div>
              <div className="flex flex-wrap gap-x-2">
                <dt className="text-slate-500">Lote</dt>
                <dd className="font-mono text-xs text-slate-500">{reviewTarget.batchId}</dd>
              </div>
            </dl>

            {reviewLoading ? (
              <p className="mt-4 text-sm text-slate-400">Cargando…</p>
            ) : reviewError ? (
              <p className="mt-4 rounded-lg border border-rose-800/60 bg-rose-950/40 px-3 py-2 text-sm text-rose-100">
                {reviewError}
              </p>
            ) : reviewPreview ? (
              <div className="mt-4 space-y-2 rounded-lg border border-slate-800 bg-slate-950/50 p-3 text-sm">
                <p className="font-medium text-slate-200">Resumen</p>
                <ul className="list-inside list-disc text-slate-400">
                  <li>Ventas en el lote: {reviewPreview.salesCount}</li>
                  <li>Total ventas (ingresos): {money(reviewPreview.totalRevenue)}</li>
                  <li>Costes (suma): {money(reviewPreview.totalCost)}</li>
                  <li>Beneficio (suma): {money(reviewPreview.totalProfit)}</li>
                </ul>
                <p className="text-xs text-slate-500">
                  Muestra hasta {reviewPreview.samples.length} filas de ejemplo (por fecha de venta):
                </p>
                <ul className="max-h-48 overflow-auto text-xs text-slate-400">
                  {reviewPreview.samples.map((s) => (
                    <li key={s.id} className="border-b border-slate-800/80 py-1">
                      {new Date(s.soldAt).toLocaleDateString("es-ES")} — {s.customerName} — venta {money(s.finalSalePrice)}{" "}
                      / ben. {money(s.profit)}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button type="button" onClick={exitReviewModal} className={`${SECONDARY_BUTTON_SM} min-h-[40px]`}>
                Cerrar
              </button>
              {reviewTarget ? (
                <button
                  type="button"
                  onClick={() => {
                    const row = reviewTarget;
                    exitReviewModal();
                    openRevert(row);
                  }}
                  className="min-h-[40px] rounded-lg border border-rose-800/70 bg-rose-950/40 px-4 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-900/50"
                >
                  Revertir esta importación…
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {revertTarget ? (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Cerrar"
            className="absolute inset-0 bg-black/75 backdrop-blur-[2px]"
            onClick={() => !revertBusy && exitRevertModal()}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="revert-import-title"
            className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl shadow-black/60"
          >
            <h2 id="revert-import-title" className="text-lg font-semibold text-rose-100">
              Revertir importación
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Esta acción <span className="font-semibold text-rose-200">elimina permanentemente</span> las ventas del
              lote seleccionado. No afecta a ventas registradas manualmente desde montajes, ni a servicios, ni al
              inventario de piezas.
            </p>

            <dl className="mt-3 space-y-1 border-b border-slate-800/80 pb-3 text-sm text-slate-400">
              <div className="flex flex-wrap gap-x-2">
                <dt className="text-slate-500">Archivo</dt>
                <dd className="min-w-0 break-all font-medium text-slate-200">
                  {revertTarget.sourceFileName?.trim() || preview?.sourceFileName?.trim() || "—"}
                </dd>
              </div>
            </dl>

            {revertTarget.isLegacyUnbatched ? (
              <div className="mt-3 rounded-lg border border-amber-800/50 bg-amber-950/30 px-3 py-2 text-sm text-amber-100">
                Lote histórico sin identificador: se borrarán todas las ventas importadas sin `importBatchId`.
              </div>
            ) : null}

            {previewLoading ? (
              <p className="mt-4 text-sm text-slate-400">Cargando vista previa…</p>
            ) : preview ? (
              <div className="mt-4 space-y-2 rounded-lg border border-slate-800 bg-slate-950/50 p-3 text-sm">
                <p className="font-medium text-slate-200">Resumen del borrado</p>
                <ul className="list-inside list-disc text-slate-400">
                  <li>Ventas a eliminar: {preview.salesCount}</li>
                  <li>Ingresos (suma): {money(preview.totalRevenue)}</li>
                  <li>Costes (suma): {money(preview.totalCost)}</li>
                  <li>Beneficio (suma): {money(preview.totalProfit)}</li>
                </ul>
                <p className="text-xs text-slate-500">
                  Muestra hasta {preview.samples.length} filas de ejemplo (orden por fecha de venta):
                </p>
                <ul className="max-h-40 overflow-auto text-xs text-slate-400">
                  {preview.samples.map((s) => (
                    <li key={s.id} className="border-b border-slate-800/80 py-1">
                      {new Date(s.soldAt).toLocaleDateString("es-ES")} — {s.customerName} — venta {money(s.finalSalePrice)}{" "}
                      / ben. {money(s.profit)}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {revertError ? (
              <p className="mt-3 rounded-lg border border-rose-800/60 bg-rose-950/40 px-3 py-2 text-sm text-rose-100">
                {revertError}
              </p>
            ) : null}

            <label className="mt-4 block text-sm text-slate-300">
              <span className="font-medium text-slate-200">Confirmación obligatoria</span>
              <p className="mt-1 text-xs text-slate-500">
                Escribe exactamente (mayúsculas y tilde):{" "}
                <code className="rounded bg-slate-800 px-1.5 py-0.5 text-amber-200/90">
                  {SALES_IMPORT_REVERT_CONFIRM_PHRASE}
                </code>
              </p>
              <input
                type="text"
                autoComplete="off"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                disabled={revertBusy || previewLoading}
                className="mt-2 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none ring-rose-400/30 focus:border-rose-500/60 focus:ring"
                placeholder={SALES_IMPORT_REVERT_CONFIRM_PHRASE}
              />
            </label>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                disabled={revertBusy}
                onClick={exitRevertModal}
                className={`${SECONDARY_BUTTON_SM} min-h-[40px]`}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={
                  revertBusy ||
                  previewLoading ||
                  !preview ||
                  confirmText.trim() !== SALES_IMPORT_REVERT_CONFIRM_PHRASE
                }
                onClick={() => void executeRevert()}
                className="min-h-[40px] rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {revertBusy ? "Eliminando…" : "Eliminar lote definitivamente"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
