import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useState } from "react";
import * as salesApi from "../../api/sales";
import { SALES_IMPORT_REVERT_CONFIRM_PHRASE } from "../../types/sale";
import { SECONDARY_BUTTON_SM, SECONDARY_GHOST_SM } from "../../theme/actionButtons";
function money(n) {
    return `${n.toFixed(2)} EUR`;
}
function formatImportedAt(iso) {
    if (!iso)
        return "—";
    try {
        return new Date(iso).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" });
    }
    catch {
        return iso;
    }
}
export function SalesImportBatchesPanel({ onReverted }) {
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [revertTarget, setRevertTarget] = useState(null);
    const [preview, setPreview] = useState(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [confirmText, setConfirmText] = useState("");
    const [revertBusy, setRevertBusy] = useState(false);
    const [revertError, setRevertError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);
    const [reviewTarget, setReviewTarget] = useState(null);
    const [reviewPreview, setReviewPreview] = useState(null);
    const [reviewLoading, setReviewLoading] = useState(false);
    const [reviewError, setReviewError] = useState(null);
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
        }
        catch (e) {
            setError(e instanceof Error ? e.message : "No se pudieron cargar las importaciones.");
            setBatches([]);
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => {
        void loadBatches();
    }, [loadBatches]);
    const openRevert = (row) => {
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
    const openReview = (row) => {
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
        if (!revertTarget)
            return;
        setRevertBusy(true);
        setRevertError(null);
        try {
            const res = await salesApi.revertSalesImportBatch(revertTarget.batchId, confirmText);
            exitRevertModal();
            await loadBatches();
            onReverted();
            setSuccessMsg(`Se eliminaron ${res.deleted} venta(s) importadas del lote. Las ventas manuales no se han modificado.`);
            window.setTimeout(() => setSuccessMsg(null), 10000);
        }
        catch (e) {
            setRevertError(e instanceof Error ? e.message : "Error al revertir.");
        }
        finally {
            setRevertBusy(false);
        }
    };
    const fileLabel = (row) => {
        if (row.isLegacyUnbatched)
            return "—";
        return row.sourceFileName?.trim() || "—";
    };
    return (_jsxs(_Fragment, { children: [_jsxs("section", { className: "rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/40 md:p-5", children: [_jsxs("div", { className: "flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-lg font-semibold text-slate-100", children: "Historial de importaciones" }), _jsxs("p", { className: "mt-1 max-w-2xl text-sm text-slate-400", children: ["Cada importaci\u00F3n confirmada queda agrupada por ", _jsx("span", { className: "font-medium text-slate-300", children: "lote" }), " ", "(", _jsx("code", { className: "text-slate-500", children: "importBatchId" }), "). Puedes revisar el detalle o revertir un lote: solo se eliminan ventas importadas de ese lote; no se tocan ventas manuales, servicios ni inventario."] })] }), _jsx("button", { type: "button", disabled: loading, onClick: () => void loadBatches(), className: SECONDARY_BUTTON_SM, children: "Actualizar lista" })] }), successMsg ? (_jsx("p", { className: "mt-3 rounded-lg border border-emerald-800/50 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-100", children: successMsg })) : null, error ? (_jsx("p", { className: "mt-3 rounded-lg border border-rose-800/60 bg-rose-950/40 px-3 py-2 text-sm text-rose-100", children: error })) : null, loading ? (_jsx("p", { className: "mt-4 text-sm text-slate-400", children: "Cargando historial\u2026" })) : batches.length === 0 ? (_jsx("p", { className: "mt-4 text-sm text-slate-400", children: "No hay importaciones registradas." })) : (_jsx("div", { className: "mt-4 max-h-[420px] overflow-auto rounded-lg border border-slate-800", children: _jsxs("table", { className: "min-w-full text-left text-sm text-slate-200", children: [_jsx("thead", { className: "sticky top-0 bg-slate-950/95 text-xs uppercase tracking-wide text-slate-400", children: _jsxs("tr", { children: [_jsx("th", { className: "px-3 py-2 font-semibold", children: "Fecha importaci\u00F3n" }), _jsx("th", { className: "px-3 py-2 font-semibold", children: "Archivo" }), _jsx("th", { className: "px-3 py-2 font-semibold", children: "Ventas" }), _jsx("th", { className: "px-3 py-2 text-right font-semibold", children: "Total ventas" }), _jsx("th", { className: "px-3 py-2 text-right font-semibold", children: "Beneficio" }), _jsx("th", { className: "px-3 py-2 text-right font-semibold", children: "Acciones" })] }) }), _jsx("tbody", { className: "divide-y divide-slate-800 bg-slate-900/40", children: batches.map((row) => (_jsxs("tr", { className: "hover:bg-slate-800/40", children: [_jsx("td", { className: "px-3 py-2 whitespace-nowrap text-slate-300", children: row.isLegacyUnbatched ? (_jsx("span", { className: "text-amber-200/90", children: "Sin lote (hist\u00F3rico)" })) : (formatImportedAt(row.importedAt)) }), _jsx("td", { className: "max-w-[200px] truncate px-3 py-2 text-slate-300", title: row.isLegacyUnbatched ? row.batchId : `${fileLabel(row)} · ${row.batchId}`, children: fileLabel(row) }), _jsx("td", { className: "px-3 py-2 tabular-nums", children: row.salesCount }), _jsx("td", { className: "px-3 py-2 text-right tabular-nums text-emerald-300/90", children: money(row.totalRevenue) }), _jsx("td", { className: "px-3 py-2 text-right tabular-nums font-medium text-slate-100", children: money(row.totalProfit) }), _jsx("td", { className: "px-3 py-2 text-right", children: _jsxs("div", { className: "flex flex-wrap justify-end gap-1.5", children: [_jsx("button", { type: "button", onClick: () => openReview(row), className: `${SECONDARY_GHOST_SM} shrink-0`, children: "Revisar" }), _jsx("button", { type: "button", onClick: () => openRevert(row), className: "shrink-0 rounded-lg border border-rose-800/70 bg-rose-950/40 px-2.5 py-1.5 text-xs font-semibold text-rose-100 transition hover:bg-rose-900/50", children: "Revertir importaci\u00F3n" })] }) })] }, row.batchId))) })] }) })), batches.some((b) => b.isLegacyUnbatched) ? (_jsxs("p", { className: "mt-3 text-xs text-amber-200/80", children: ["Las filas ", _jsx("span", { className: "font-semibold", children: "Sin lote (hist\u00F3rico)" }), " agrupan importaciones antiguas sin identificador de lote ni nombre de archivo. Revertirlas borra todas esas ventas importadas a la vez."] })) : null] }), reviewTarget ? (_jsxs("div", { className: "fixed inset-0 z-[110] flex items-center justify-center p-4", children: [_jsx("button", { type: "button", "aria-label": "Cerrar", className: "absolute inset-0 bg-black/75 backdrop-blur-[2px]", onClick: () => !reviewLoading && exitReviewModal() }), _jsxs("div", { role: "dialog", "aria-modal": "true", "aria-labelledby": "review-import-title", className: "relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl shadow-black/60", children: [_jsx("h2", { id: "review-import-title", className: "text-lg font-semibold text-slate-100", children: "Detalle de importaci\u00F3n" }), _jsxs("dl", { className: "mt-3 space-y-1 text-sm text-slate-400", children: [_jsxs("div", { className: "flex flex-wrap gap-x-2", children: [_jsx("dt", { className: "text-slate-500", children: "Archivo" }), _jsx("dd", { className: "min-w-0 break-all font-medium text-slate-200", children: reviewTarget.sourceFileName?.trim() || reviewPreview?.sourceFileName?.trim() || "—" })] }), _jsxs("div", { className: "flex flex-wrap gap-x-2", children: [_jsx("dt", { className: "text-slate-500", children: "Fecha importaci\u00F3n" }), _jsx("dd", { className: "text-slate-200", children: reviewTarget.isLegacyUnbatched ? "—" : formatImportedAt(reviewTarget.importedAt) })] }), _jsxs("div", { className: "flex flex-wrap gap-x-2", children: [_jsx("dt", { className: "text-slate-500", children: "Lote" }), _jsx("dd", { className: "font-mono text-xs text-slate-500", children: reviewTarget.batchId })] })] }), reviewLoading ? (_jsx("p", { className: "mt-4 text-sm text-slate-400", children: "Cargando\u2026" })) : reviewError ? (_jsx("p", { className: "mt-4 rounded-lg border border-rose-800/60 bg-rose-950/40 px-3 py-2 text-sm text-rose-100", children: reviewError })) : reviewPreview ? (_jsxs("div", { className: "mt-4 space-y-2 rounded-lg border border-slate-800 bg-slate-950/50 p-3 text-sm", children: [_jsx("p", { className: "font-medium text-slate-200", children: "Resumen" }), _jsxs("ul", { className: "list-inside list-disc text-slate-400", children: [_jsxs("li", { children: ["Ventas en el lote: ", reviewPreview.salesCount] }), _jsxs("li", { children: ["Total ventas (ingresos): ", money(reviewPreview.totalRevenue)] }), _jsxs("li", { children: ["Costes (suma): ", money(reviewPreview.totalCost)] }), _jsxs("li", { children: ["Beneficio (suma): ", money(reviewPreview.totalProfit)] })] }), _jsxs("p", { className: "text-xs text-slate-500", children: ["Muestra hasta ", reviewPreview.samples.length, " filas de ejemplo (por fecha de venta):"] }), _jsx("ul", { className: "max-h-48 overflow-auto text-xs text-slate-400", children: reviewPreview.samples.map((s) => (_jsxs("li", { className: "border-b border-slate-800/80 py-1", children: [new Date(s.soldAt).toLocaleDateString("es-ES"), " \u2014 ", s.customerName, " \u2014 venta ", money(s.finalSalePrice), " ", "/ ben. ", money(s.profit)] }, s.id))) })] })) : null, _jsxs("div", { className: "mt-5 flex flex-wrap justify-end gap-2", children: [_jsx("button", { type: "button", onClick: exitReviewModal, className: `${SECONDARY_BUTTON_SM} min-h-[40px]`, children: "Cerrar" }), reviewTarget ? (_jsx("button", { type: "button", onClick: () => {
                                            const row = reviewTarget;
                                            exitReviewModal();
                                            openRevert(row);
                                        }, className: "min-h-[40px] rounded-lg border border-rose-800/70 bg-rose-950/40 px-4 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-900/50", children: "Revertir esta importaci\u00F3n\u2026" })) : null] })] })] })) : null, revertTarget ? (_jsxs("div", { className: "fixed inset-0 z-[110] flex items-center justify-center p-4", children: [_jsx("button", { type: "button", "aria-label": "Cerrar", className: "absolute inset-0 bg-black/75 backdrop-blur-[2px]", onClick: () => !revertBusy && exitRevertModal() }), _jsxs("div", { role: "dialog", "aria-modal": "true", "aria-labelledby": "revert-import-title", className: "relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl shadow-black/60", children: [_jsx("h2", { id: "revert-import-title", className: "text-lg font-semibold text-rose-100", children: "Revertir importaci\u00F3n" }), _jsxs("p", { className: "mt-2 text-sm text-slate-300", children: ["Esta acci\u00F3n ", _jsx("span", { className: "font-semibold text-rose-200", children: "elimina permanentemente" }), " las ventas del lote seleccionado. No afecta a ventas registradas manualmente desde montajes, ni a servicios, ni al inventario de piezas."] }), _jsx("dl", { className: "mt-3 space-y-1 border-b border-slate-800/80 pb-3 text-sm text-slate-400", children: _jsxs("div", { className: "flex flex-wrap gap-x-2", children: [_jsx("dt", { className: "text-slate-500", children: "Archivo" }), _jsx("dd", { className: "min-w-0 break-all font-medium text-slate-200", children: revertTarget.sourceFileName?.trim() || preview?.sourceFileName?.trim() || "—" })] }) }), revertTarget.isLegacyUnbatched ? (_jsx("div", { className: "mt-3 rounded-lg border border-amber-800/50 bg-amber-950/30 px-3 py-2 text-sm text-amber-100", children: "Lote hist\u00F3rico sin identificador: se borrar\u00E1n todas las ventas importadas sin `importBatchId`." })) : null, previewLoading ? (_jsx("p", { className: "mt-4 text-sm text-slate-400", children: "Cargando vista previa\u2026" })) : preview ? (_jsxs("div", { className: "mt-4 space-y-2 rounded-lg border border-slate-800 bg-slate-950/50 p-3 text-sm", children: [_jsx("p", { className: "font-medium text-slate-200", children: "Resumen del borrado" }), _jsxs("ul", { className: "list-inside list-disc text-slate-400", children: [_jsxs("li", { children: ["Ventas a eliminar: ", preview.salesCount] }), _jsxs("li", { children: ["Ingresos (suma): ", money(preview.totalRevenue)] }), _jsxs("li", { children: ["Costes (suma): ", money(preview.totalCost)] }), _jsxs("li", { children: ["Beneficio (suma): ", money(preview.totalProfit)] })] }), _jsxs("p", { className: "text-xs text-slate-500", children: ["Muestra hasta ", preview.samples.length, " filas de ejemplo (orden por fecha de venta):"] }), _jsx("ul", { className: "max-h-40 overflow-auto text-xs text-slate-400", children: preview.samples.map((s) => (_jsxs("li", { className: "border-b border-slate-800/80 py-1", children: [new Date(s.soldAt).toLocaleDateString("es-ES"), " \u2014 ", s.customerName, " \u2014 venta ", money(s.finalSalePrice), " ", "/ ben. ", money(s.profit)] }, s.id))) })] })) : null, revertError ? (_jsx("p", { className: "mt-3 rounded-lg border border-rose-800/60 bg-rose-950/40 px-3 py-2 text-sm text-rose-100", children: revertError })) : null, _jsxs("label", { className: "mt-4 block text-sm text-slate-300", children: [_jsx("span", { className: "font-medium text-slate-200", children: "Confirmaci\u00F3n obligatoria" }), _jsxs("p", { className: "mt-1 text-xs text-slate-500", children: ["Escribe exactamente (may\u00FAsculas y tilde):", " ", _jsx("code", { className: "rounded bg-slate-800 px-1.5 py-0.5 text-amber-200/90", children: SALES_IMPORT_REVERT_CONFIRM_PHRASE })] }), _jsx("input", { type: "text", autoComplete: "off", value: confirmText, onChange: (e) => setConfirmText(e.target.value), disabled: revertBusy || previewLoading, className: "mt-2 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none ring-rose-400/30 focus:border-rose-500/60 focus:ring", placeholder: SALES_IMPORT_REVERT_CONFIRM_PHRASE })] }), _jsxs("div", { className: "mt-5 flex flex-wrap justify-end gap-2", children: [_jsx("button", { type: "button", disabled: revertBusy, onClick: exitRevertModal, className: `${SECONDARY_BUTTON_SM} min-h-[40px]`, children: "Cancelar" }), _jsx("button", { type: "button", disabled: revertBusy ||
                                            previewLoading ||
                                            !preview ||
                                            confirmText.trim() !== SALES_IMPORT_REVERT_CONFIRM_PHRASE, onClick: () => void executeRevert(), className: "min-h-[40px] rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-40", children: revertBusy ? "Eliminando…" : "Eliminar lote definitivamente" })] })] })] })) : null] }));
}
