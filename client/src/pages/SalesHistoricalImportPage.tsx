import { Link } from "react-router-dom";
import { SalesExcelImportPanel } from "../components/sales/SalesExcelImportPanel";
import { SalesImportBatchesPanel } from "../components/sales/SalesImportBatchesPanel";
import { useSales } from "../hooks/useSales";
import { SECONDARY_GHOST_SM } from "../theme/actionButtons";
import { PAGE_HERO, PAGE_OUTER_7XL_SALES, SECTION_SHELL } from "../theme/layoutDensity";

export function SalesHistoricalImportPage() {
  const { reload, error } = useSales();

  return (
    <div className={PAGE_OUTER_7XL_SALES}>
      <section className={PAGE_HERO}>
        <h1 className="text-3xl font-bold tracking-tight">Importación histórica de ventas</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Herramienta puntual para cargar ventas desde Excel y revisar o revertir lotes importados. El flujo diario de
          ventas sigue en la pantalla principal de Ventas.
        </p>
        <Link to="/sales" className={`${SECONDARY_GHOST_SM} mt-4 inline-flex`}>
          ← Volver a Ventas
        </Link>
      </section>

      {error ? (
        <section className={`${SECTION_SHELL} border-rose-800/70 bg-rose-950/40 text-sm text-rose-200`}>
          {error}
        </section>
      ) : null}

      <SalesExcelImportPanel onImported={() => void reload()} />

      <div className="mt-6">
        <SalesImportBatchesPanel onReverted={() => void reload()} />
      </div>
    </div>
  );
}
