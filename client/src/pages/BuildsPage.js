import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as buildsApi from "../api/builds";
import { BuildForm } from "../components/builds/BuildForm";
import { BuildsList } from "../components/builds/BuildsList";
import { PrebuiltInventorySaleSection } from "../components/builds/PrebuiltInventorySaleSection";
import { useBuilds } from "../hooks/useBuilds";
import { useParts } from "../hooks/useParts";
export function BuildsPage() {
    const navigate = useNavigate();
    const { builds, loading, creating, updatingId, deletingId, error, createBuild, updateBuild, deleteBuild, reload } = useBuilds();
    const { parts: inventoryParts, loading: inventoryLoading, reload: reloadInventory } = useParts();
    const [editingBuild, setEditingBuild] = useState(null);
    const [preparingPartId, setPreparingPartId] = useState(null);
    const handleDelete = async (buildId, buildName) => {
        const confirmed = window.confirm(`Eliminar el montaje "${buildName}"?`);
        if (!confirmed)
            return;
        await deleteBuild(buildId);
        if (editingBuild?.id === buildId) {
            setEditingBuild(null);
        }
    };
    return (_jsxs("div", { className: "mx-auto w-full max-w-7xl space-y-6 px-2 pb-8 text-slate-100 md:px-4", children: [_jsxs("section", { className: "rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 shadow-[0_20px_50px_-24px_rgba(79,70,229,0.75)]", children: [_jsx("h1", { className: "text-2xl font-bold", children: "Montajes de PC" }), _jsxs("p", { className: "mt-2 text-sm text-slate-300", children: ["Crea montajes por piezas o vende PCs completos del inventario. En ambos casos, cuando el equipo este listo, usalo con ", _jsx("span", { className: "font-semibold text-cyan-300", children: "Registrar venta" }), " para pasarlo al apartado Ventas."] })] }), error ? (_jsxs("div", { className: "flex flex-col gap-3 rounded-xl border border-rose-800/70 bg-rose-950/40 px-4 py-3 text-sm text-rose-200 md:flex-row md:items-center md:justify-between", children: [_jsx("span", { children: error }), _jsx("button", { type: "button", onClick: () => {
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
                } }, editingBuild.id)) : null, _jsx(PrebuiltInventorySaleSection, { parts: inventoryParts, loading: inventoryLoading, preparingPartId: preparingPartId, onPrepareSale: async (part) => {
                    setPreparingPartId(part.id);
                    try {
                        const detail = await buildsApi.createBuildFromPrebuiltPart(part.id);
                        await Promise.all([reload(), reloadInventory()]);
                        navigate(`/builds/${detail.id}#registrar-venta`);
                    }
                    catch (err) {
                        window.alert(err instanceof Error ? err.message : "No se pudo preparar la venta del PC.");
                    }
                    finally {
                        setPreparingPartId(null);
                    }
                } }), _jsxs("section", { className: "space-y-2", children: [_jsx("h2", { className: "text-xl font-semibold text-slate-100", children: "Montajes por piezas" }), _jsx("p", { className: "text-sm text-slate-400", children: "Borradores y montajes confirmados creados desde el configurador de componentes." })] }), _jsx(BuildsList, { builds: builds, loading: loading, updatingId: updatingId, deletingId: deletingId, onEdit: (build) => {
                    setEditingBuild(build);
                }, onDelete: (build) => {
                    void handleDelete(build.id, build.name);
                } })] }));
}
