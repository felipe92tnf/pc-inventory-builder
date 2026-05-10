import { isPrebuiltPc, type Part } from "../../types/part";

type PrebuiltInventorySaleSectionProps = {
  parts: Part[];
  loading: boolean;
  preparingPartId: string | null;
  onPrepareSale: (part: Part) => void | Promise<void>;
};

function conditionLabel(condition: string): string {
  if (condition === "NEW") return "Nuevo";
  if (condition === "USED") return "Usado";
  if (condition === "REFURBISHED") return "Refurbished";
  return condition;
}

export function PrebuiltInventorySaleSection({
  parts,
  loading,
  preparingPartId,
  onPrepareSale
}: PrebuiltInventorySaleSectionProps) {
  const prebuiltWithStock = parts.filter((p) => isPrebuiltPc(p) && p.stock > 0);

  if (loading) {
    return (
      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg shadow-slate-950/40">
        <p className="text-sm text-slate-300">Cargando inventario de PCs completos...</p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-slate-100">PCs completos en inventario</h2>
        <p className="mt-1 text-sm text-slate-400">
          Cada venta reserva una unidad del stock y abre un montaje ya ensamblado para usar{" "}
          <span className="font-semibold text-cyan-300">Registrar venta</span> y pasarlo al apartado Ventas.
        </p>
      </div>

      {prebuiltWithStock.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg shadow-slate-950/40">
          <p className="text-sm text-slate-300">
            No hay PCs premontados con stock. Añadelos en Inventario (tipo PC completo).
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {prebuiltWithStock.map((part) => (
            <article
              key={part.id}
              className="rounded-2xl border border-violet-500/25 bg-slate-900/80 p-5 shadow-lg shadow-slate-950/40"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h3 className="text-lg font-semibold text-slate-100">{part.name}</h3>
                <span className="rounded-full border border-violet-500/40 bg-violet-500/15 px-2.5 py-1 text-xs font-semibold text-violet-200">
                  Inventario
                </span>
              </div>

              <p className="mt-2 line-clamp-3 text-sm text-slate-400">
                {part.description?.trim() || part.notes?.trim() || "Sin descripcion del equipo."}
              </p>

              <dl className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-400">
                <div>
                  <dt className="uppercase tracking-wide text-slate-500">Stock</dt>
                  <dd className="mt-0.5 font-semibold text-slate-200">{part.stock}</dd>
                </div>
                <div>
                  <dt className="uppercase tracking-wide text-slate-500">Estado</dt>
                  <dd className="mt-0.5 font-semibold text-slate-200">{conditionLabel(part.condition)}</dd>
                </div>
                <div>
                  <dt className="uppercase tracking-wide text-slate-500">Venta estimada</dt>
                  <dd className="mt-0.5 font-semibold text-emerald-300">{Number(part.salePrice).toFixed(2)} EUR</dd>
                </div>
                <div>
                  <dt className="uppercase tracking-wide text-slate-500">Coste</dt>
                  <dd className="mt-0.5 font-semibold text-slate-300">{Number(part.costPrice).toFixed(2)} EUR</dd>
                </div>
              </dl>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={preparingPartId === part.id}
                  onClick={() => {
                    void onPrepareSale(part);
                  }}
                  className="inline-flex rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan-900/30 transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {preparingPartId === part.id ? "Preparando..." : "Registrar venta"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
