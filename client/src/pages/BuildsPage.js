import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { BuildForm } from "../components/builds/BuildForm";
import { BuildsList } from "../components/builds/BuildsList";
import { useBuilds } from "../hooks/useBuilds";
export function BuildsPage() {
    const { builds, loading, creating, updatingId, deletingId, error, createBuild, updateBuild, deleteBuild, reload } = useBuilds();
    const [editingBuild, setEditingBuild] = useState(null);
    const handleDelete = async (buildId, buildName) => {
        const confirmed = window.confirm(`Eliminar el montaje "${buildName}"?`);
        if (!confirmed)
            return;
        await deleteBuild(buildId);
        if (editingBuild?.id === buildId) {
            setEditingBuild(null);
        }
    };
    return (_jsxs("div", { className: "mx-auto w-full max-w-7xl space-y-6 px-2 pb-8 text-slate-100 md:px-4", children: [_jsxs("section", { className: "rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 shadow-[0_20px_50px_-24px_rgba(79,70,229,0.75)]", children: [_jsx("h1", { className: "text-2xl font-bold", children: "Montajes de PC" }), _jsxs("p", { className: "mt-2 text-sm text-slate-300", children: ["Crea configuraciones, gestiona piezas por montaje y confirma cuando este listo para ensamblar. Los PCs ya ensamblados puedes pasarlos al apartado Ventas con el boton ", _jsx("span", { className: "font-semibold text-cyan-300", children: "Registrar venta" }), "."] })] }), error ? (_jsxs("div", { className: "flex flex-col gap-3 rounded-xl border border-rose-800/70 bg-rose-950/40 px-4 py-3 text-sm text-rose-200 md:flex-row md:items-center md:justify-between", children: [_jsx("span", { children: error }), _jsx("button", { type: "button", onClick: () => {
                            void reload();
                        }, className: "rounded-lg border border-rose-700 bg-rose-900/50 px-3 py-1.5 font-semibold text-rose-100 transition hover:bg-rose-800/70", children: "Reintentar" })] })) : null, _jsx(BuildForm, { loading: creating, title: "Nuevo montaje", submitLabel: "Crear montaje", loadingLabel: "Creando...", onSubmit: async (values) => {
                    await createBuild({
                        name: values.name.trim(),
                        notes: values.notes.trim() ? values.notes.trim() : null
                    });
                } }), editingBuild ? (_jsx(BuildForm, { loading: updatingId === editingBuild.id, title: `Editar montaje: ${editingBuild.name}`, submitLabel: "Guardar cambios", loadingLabel: "Guardando...", initialValues: {
                    name: editingBuild.name,
                    notes: editingBuild.notes ?? ""
                }, onCancel: () => setEditingBuild(null), onSubmit: async (values) => {
                    await updateBuild(editingBuild.id, {
                        name: values.name.trim(),
                        notes: values.notes.trim() ? values.notes.trim() : null
                    });
                    setEditingBuild(null);
                } }, editingBuild.id)) : null, _jsx(BuildsList, { builds: builds, loading: loading, updatingId: updatingId, deletingId: deletingId, onEdit: (build) => {
                    setEditingBuild(build);
                }, onDelete: (build) => {
                    void handleDelete(build.id, build.name);
                } })] }));
}
