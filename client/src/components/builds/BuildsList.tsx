import { Link } from "react-router-dom";
import type { Build } from "../../types/build";
import {
  PRIMARY_ACTION_BUTTON_COMPACT,
  SECONDARY_GHOST_SM,
  SECONDARY_BUTTON_SM,
  DESTRUCTIVE_BUTTON_SM
} from "../../theme/actionButtons";

function isInventoryPrebuiltBuild(build: Build): boolean {
  return build.items?.length === 1 && build.items[0]?.part?.inventoryKind === "PREBUILT_PC";
}

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
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold text-slate-100">{build.name}</h3>
              {isInventoryPrebuiltBuild(build) ? (
                <span className="shrink-0 rounded-full border border-violet-500/35 bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-200">
                  PC inventario
                </span>
              ) : null}
            </div>

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
              className={`${SECONDARY_GHOST_SM} px-4 py-2 text-sm`}
            >
              Ver detalle
            </Link>
            {build.status === "CONFIRMED" ? (
              <Link
                to={`/builds/${build.id}#registrar-venta`}
                className={PRIMARY_ACTION_BUTTON_COMPACT}
              >
                Registrar venta
              </Link>
            ) : null}
            <button
              type="button"
              onClick={() => onEdit(build)}
              disabled={updatingId === build.id || build.status === "SOLD"}
              className={`${SECONDARY_BUTTON_SM} px-4 py-2 text-sm disabled:cursor-not-allowed`}
            >
              {updatingId === build.id ? "Guardando..." : "Editar"}
            </button>
            <button
              type="button"
              onClick={() => onDelete(build)}
              disabled={deletingId === build.id || build.status === "SOLD"}
              className={`${DESTRUCTIVE_BUTTON_SM} px-4 py-2 text-sm disabled:cursor-not-allowed`}
            >
              {deletingId === build.id ? "Eliminando..." : "Eliminar"}
            </button>
          </div>
        </article>
      ))}
    </section>
  );
}