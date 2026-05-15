import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { SalesExcelImportPanel } from "../components/sales/SalesExcelImportPanel";
import { SalesImportBatchesPanel } from "../components/sales/SalesImportBatchesPanel";
import { useSales } from "../hooks/useSales";
import { SECONDARY_GHOST_SM } from "../theme/actionButtons";
import { PAGE_HERO, PAGE_OUTER_7XL_SALES, SECTION_SHELL } from "../theme/layoutDensity";
export function SalesHistoricalImportPage() {
    const { reload, error } = useSales();
    return (_jsxs("div", { className: PAGE_OUTER_7XL_SALES, children: [_jsxs("section", { className: PAGE_HERO, children: [_jsx("h1", { className: "text-3xl font-bold tracking-tight", children: "Importaci\u00F3n hist\u00F3rica de ventas" }), _jsx("p", { className: "mt-2 max-w-2xl text-sm text-slate-400", children: "Herramienta puntual para cargar ventas desde Excel y revisar o revertir lotes importados. El flujo diario de ventas sigue en la pantalla principal de Ventas." }), _jsx(Link, { to: "/sales", className: `${SECONDARY_GHOST_SM} mt-4 inline-flex`, children: "\u2190 Volver a Ventas" })] }), error ? (_jsx("section", { className: `${SECTION_SHELL} border-rose-800/70 bg-rose-950/40 text-sm text-rose-200`, children: error })) : null, _jsx(SalesExcelImportPanel, { onImported: () => void reload() }), _jsx("div", { className: "mt-6", children: _jsx(SalesImportBatchesPanel, { onReverted: () => void reload() }) })] }));
}
