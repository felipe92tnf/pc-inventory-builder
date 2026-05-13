import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useRef, useState } from "react";
import * as salesApi from "../../api/sales";
import { SECONDARY_BUTTON_SM } from "../../theme/actionButtons";
function money(n) {
    if (n == null || !Number.isFinite(n))
        return "—";
    return `${n.toFixed(2)} EUR`;
}
function formatPreviewDate(iso) {
    if (!iso)
        return "—";
    try {
        return new Date(iso).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" });
    }
    catch {
        return iso;
    }
}
export function SalesExcelImportPanel({ onImported }) {
    const inputRef = useRef(null);
    const [preview, setPreview] = useState(null);
    const [sourceFileName, setSourceFileName] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const [resultMsg, setResultMsg] = useState(null);
    const openPicker = () => {
        setError(null);
        setResultMsg(null);
        inputRef.current?.click();
    };
    const onFileChange = useCallback(async (e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file)
            return;
        setBusy(true);
        setError(null);
        setResultMsg(null);
        setPreview(null);
        setSourceFileName(null);
        try {
            const { rows } = await salesApi.salesImportPreview(file);
            setPreview(rows);
            setSourceFileName(file.name);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo generar la vista previa.");
        }
        finally {
            setBusy(false);
        }
    }, []);
    const validRows = preview?.filter((r) => r.ok) ?? [];
    const invalidCount = preview ? preview.length - validRows.length : 0;
    const confirmImport = async () => {
        if (!preview || validRows.length === 0)
            return;
        setBusy(true);
        setError(null);
        setResultMsg(null);
        try {
            const rows = validRows.map((r) => ({
                sheetRow: r.sheetRow,
                soldAt: r.soldAt,
                customerName: r.customerName,
                description: r.description,
                totalCost: r.totalCost,
                finalSalePrice: r.finalSalePrice,
                customerPhone: r.customerPhone
            }));
            const res = await salesApi.salesImportConfirm({
                rows,
                ...(sourceFileName ? { sourceFileName } : {})
            });
            const failedNote = res.failed.length > 0
                ? ` Fallos: ${res.failed.map((f) => `fila ${f.sheetRow}`).join(", ")}.`
                : "";
            const batchNote = res.created > 0
                ? ` Lote: ${res.importBatchId} (importado ${new Date(res.importedAt).toLocaleString("es-ES")}). Puedes revertir este lote abajo si hace falta.`
                : "";
            setResultMsg(`Importadas ${res.created} venta(s).${batchNote}${failedNote}`);
            setPreview(null);
            setSourceFileName(null);
            onImported();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Error al confirmar la importación.");
        }
        finally {
            setBusy(false);
        }
    };
    return (_jsxs("section", { className: "rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/40 md:p-5", children: [_jsxs("div", { className: "flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-lg font-semibold text-slate-100", children: "Importar ventas hist\u00F3ricas" }), _jsxs("p", { className: "mt-1 max-w-xl text-sm text-slate-400", children: ["Hoja ", _jsx("span", { className: "font-medium text-slate-300", children: "Registro de Ventas" }), " (.xlsx / .xls) o CSV con las mismas columnas. Primero vista previa; no se guarda nada hasta confirmar."] })] }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsx("input", { ref: inputRef, type: "file", accept: ".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv", className: "hidden", onChange: (ev) => void onFileChange(ev) }), _jsx("button", { type: "button", disabled: busy, onClick: openPicker, className: `${SECONDARY_BUTTON_SM} min-h-[40px]`, children: busy && !preview ? "Leyendo…" : "Importar Excel" }), preview && validRows.length > 0 ? (_jsx("button", { type: "button", disabled: busy, onClick: () => void confirmImport(), className: "min-h-[40px] rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50", children: busy ? "Importando…" : "Confirmar importación" })) : null] })] }), error ? (_jsx("p", { className: "mt-3 rounded-lg border border-rose-800/60 bg-rose-950/40 px-3 py-2 text-sm text-rose-100", children: error })) : null, resultMsg ? (_jsx("p", { className: "mt-3 rounded-lg border border-emerald-800/50 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-100", children: resultMsg })) : null, preview && preview.length > 0 ? (_jsxs("div", { className: "mt-4 space-y-2", children: [_jsxs("p", { className: "text-sm text-slate-400", children: [preview.length, " fila(s) \u00B7 ", validRows.length, " v\u00E1lida(s) para importar", invalidCount > 0 ? ` · ${invalidCount} con errores` : ""] }), _jsx("div", { className: "max-h-[420px] overflow-auto rounded-lg border border-slate-800", children: _jsxs("table", { className: "min-w-full text-left text-sm text-slate-200", children: [_jsx("thead", { className: "sticky top-0 bg-slate-950/95 text-xs uppercase tracking-wide text-slate-400", children: _jsxs("tr", { children: [_jsx("th", { className: "px-3 py-2", children: "Fila" }), _jsx("th", { className: "px-3 py-2", children: "Fecha" }), _jsx("th", { className: "px-3 py-2", children: "Cliente" }), _jsx("th", { className: "px-3 py-2", children: "Descripci\u00F3n" }), _jsx("th", { className: "px-3 py-2 text-right", children: "Coste" }), _jsx("th", { className: "px-3 py-2 text-right", children: "Venta" }), _jsx("th", { className: "px-3 py-2 text-right", children: "Beneficio" }), _jsx("th", { className: "px-3 py-2", children: "Errores" })] }) }), _jsx("tbody", { children: preview.map((row) => (_jsxs("tr", { className: row.ok ? "border-t border-slate-800/80" : "border-t border-rose-900/40 bg-rose-950/20", children: [_jsx("td", { className: "px-3 py-2 font-mono text-xs text-slate-400", children: row.sheetRow }), _jsx("td", { className: "px-3 py-2 whitespace-nowrap", children: formatPreviewDate(row.soldAt) }), _jsx("td", { className: "px-3 py-2 max-w-[140px] truncate", title: row.customerName ?? "", children: row.customerName ?? "—" }), _jsx("td", { className: "px-3 py-2 max-w-[200px] truncate text-slate-400", title: row.description ?? "", children: row.description ?? "—" }), _jsx("td", { className: "px-3 py-2 text-right tabular-nums", children: money(row.totalCost) }), _jsx("td", { className: "px-3 py-2 text-right tabular-nums", children: money(row.finalSalePrice) }), _jsx("td", { className: "px-3 py-2 text-right tabular-nums text-emerald-300/90", children: money(row.profitCalculated) }), _jsx("td", { className: "px-3 py-2 text-xs text-rose-200", children: row.errors.length ? row.errors.join(" ") : "—" })] }, row.sheetRow))) })] }) })] })) : null] }));
}
