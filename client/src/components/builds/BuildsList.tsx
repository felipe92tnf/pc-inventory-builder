import { Link } from "react-router-dom";
import type { Build } from "../../types/build";

type BuildsListProps = {
  builds: Build[];
  loading: boolean;
  updatingId: string | null;
  deletingId: string | null;
  onEdit: (build: Build) => void;
  onDelete: (build: Build) => void;
};

export function BuildsList({ builds, loading, updatingId, deletingId, onEdit, onDelete }: BuildsListProps) {
  if (loading) {
    return (
      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg shadow-slate-950/40">
        <p className="text-sm text-slate-300">Cargando montajes...</p>
      </section>
    );
  }

  if (builds.length === 0) {
    return (
      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg shadow-slate-950/40">
        <p className="text-sm text-slate-300">
          Todavía no has creado montajes.
        </p>
      </section>
    );
  }

  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {builds.map((build) => (
        <article
          key={build.id}
          className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg shadow-slate-950/40"
        >
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-semibold text-slate-100">
              {build.name}
            </h3>

            <span
              className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                build.status === "SOLD"
                  ? "border-cyan-500/40 bg-cyan-500/15 text-cyan-300"
                  : build.status === "CONFIRMED"
                    ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                    : "border-amber-500/40 bg-amber-500/15 text-amber-300"
              }`}
            >
              {build.status === "SOLD" ? "Vendido" : build.status === "CONFIRMED" ? "Assembled" : "Draft"}
            </span>
          </div>

          <p className="mt-2 text-sm text-slate-300">
            {build.notes || "Sin descripción."}
          </p>

          {(build.status === "CONFIRMED" || build.status === "SOLD") && build.totalSale !== undefined ? (
            <p className="mt-3 text-sm font-semibold text-emerald-300">
              Precio venta: {Number(build.totalSale).toFixed(2)} EUR
            </p>
          ) : null}

          <p className="mt-4 text-xs text-slate-400">
            Piezas: {build.items?.length ?? 0}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to={`/builds/${build.id}`}
              className="inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:bg-indigo-500"
            >
              Ver detalle
            </Link>
            {build.status === "CONFIRMED" ? (
              <Link
                to={`/builds/${build.id}#registrar-venta`}
                className="inline-flex rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan-900/30 transition hover:bg-cyan-500"
              >
                Registrar venta
              </Link>
            ) : null}
            <button
              type="button"
              onClick={() => onEdit(build)}
              disabled={updatingId === build.id || build.status === "SOLD"}
              className="inline-flex rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-200 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {updatingId === build.id ? "Guardando..." : "Editar"}
            </button>
            <button
              type="button"
              onClick={() => onDelete(build)}
              disabled={deletingId === build.id || build.status === "SOLD"}
              className="inline-flex rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {deletingId === build.id ? "Eliminando..." : "Eliminar"}
            </button>
          </div>
        </article>
      ))}
    </section>
  );
}