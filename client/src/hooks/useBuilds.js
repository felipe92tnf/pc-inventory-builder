import { useCallback, useEffect, useState } from "react";
import * as buildsApi from "../api/builds";
export function useBuilds() {
    const [builds, setBuilds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [updatingId, setUpdatingId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [error, setError] = useState(null);
    const reload = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await buildsApi.listBuilds();
            setBuilds(data);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "No se pudieron cargar los montajes.");
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => {
        void reload();
    }, [reload]);
    const createBuild = useCallback(async (payload) => {
        setCreating(true);
        setError(null);
        try {
            const created = await buildsApi.createBuild(payload);
            setBuilds((prev) => [created, ...prev]);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo crear el montaje.");
            throw err;
        }
        finally {
            setCreating(false);
        }
    }, []);
    const deleteBuild = useCallback(async (buildId) => {
        setDeletingId(buildId);
        setError(null);
        try {
            await buildsApi.deleteBuild(buildId);
            setBuilds((prev) => prev.filter((build) => build.id !== buildId));
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo eliminar el montaje.");
            throw err;
        }
        finally {
            setDeletingId(null);
        }
    }, []);
    const updateBuild = useCallback(async (buildId, payload) => {
        setUpdatingId(buildId);
        setError(null);
        try {
            const updated = await buildsApi.updateBuild(buildId, payload);
            setBuilds((prev) => prev.map((build) => (build.id === buildId ? updated : build)));
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo editar el montaje.");
            throw err;
        }
        finally {
            setUpdatingId(null);
        }
    }, []);
    return { builds, loading, creating, updatingId, deletingId, error, createBuild, updateBuild, deleteBuild, reload };
}
