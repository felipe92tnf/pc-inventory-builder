import { useState } from "react";
import { BuildForm } from "../components/builds/BuildForm";
import { BuildsList } from "../components/builds/BuildsList";
import { useBuilds } from "../hooks/useBuilds";
import type { Build } from "../types/build";

export function BuildsPage() {
  const { builds, loading, creating, updatingId, deletingId, error, createBuild, updateBuild, deleteBuild, reload } =
    useBuilds();
  const [editingBuild, setEditingBuild] = useState<Build | null>(null);

  const handleDelete = async (buildId: string, buildName: string) => {
    const confirmed = window.confirm(`Eliminar el montaje "${buildName}"?`);
    if (!confirmed) return;
    await deleteBuild(buildId);
    if (editingBuild?.id === buildId) {
      setEditingBuild(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-2 pb-8 text-slate-100 md:px-4">
      <section className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 shadow-[0_20px_50px_-24px_rgba(79,70,229,0.75)]">
        <h1 className="text-2xl font-bold">Montajes de PC</h1>
        <p className="mt-2 text-sm text-slate-300">
          Crea configuraciones, gestiona piezas por montaje y confirma cuando este listo para ensamblar. Los PCs ya ensamblados
          puedes pasarlos al apartado Ventas con el boton <span className="font-semibold text-cyan-300">Registrar venta</span>.
        </p>
      </section>

      {error ? (
        <div className="flex flex-col gap-3 rounded-xl border border-rose-800/70 bg-rose-950/40 px-4 py-3 text-sm text-rose-200 md:flex-row md:items-center md:justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => {
              void reload();
            }}
            className="rounded-lg border border-rose-700 bg-rose-900/50 px-3 py-1.5 font-semibold text-rose-100 transition hover:bg-rose-800/70"
          >
            Reintentar
          </button>
        </div>
      ) : null}

      <BuildForm
        loading={creating}
        title="Nuevo montaje"
        submitLabel="Crear montaje"
        loadingLabel="Creando..."
        onSubmit={async (values) => {
          await createBuild({
            name: values.name.trim(),
            notes: values.notes.trim() ? values.notes.trim() : null
          });
        }}
      />

      {editingBuild ? (
        <BuildForm
          key={editingBuild.id}
          loading={updatingId === editingBuild.id}
          title={`Editar montaje: ${editingBuild.name}`}
          submitLabel="Guardar cambios"
          loadingLabel="Guardando..."
          initialValues={{
            name: editingBuild.name,
            notes: editingBuild.notes ?? ""
          }}
          onCancel={() => setEditingBuild(null)}
          onSubmit={async (values) => {
            await updateBuild(editingBuild.id, {
              name: values.name.trim(),
              notes: values.notes.trim() ? values.notes.trim() : null
            });
            setEditingBuild(null);
          }}
        />
      ) : null}

      <BuildsList
        builds={builds}
        loading={loading}
        updatingId={updatingId}
        deletingId={deletingId}
        onEdit={(build) => {
          setEditingBuild(build);
        }}
        onDelete={(build) => {
          void handleDelete(build.id, build.name);
        }}
      />
    </div>
  );
}
