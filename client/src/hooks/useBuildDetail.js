import { useCallback, useEffect, useState } from "react";
import * as buildsApi from "../api/builds";
import * as partsApi from "../api/parts";
export function useBuildDetail(buildId) {
    const [build, setBuild] = useState(null);
    const [parts, setParts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState(null);
    const reload = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [buildData, partsData] = await Promise.all([buildsApi.getBuild(buildId), partsApi.listParts()]);
            setBuild(buildData);
            setParts(partsData);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo cargar el detalle del montaje.");
        }
        finally {
            setLoading(false);
        }
    }, [buildId]);
    useEffect(() => {
        void reload();
    }, [reload]);
    const addItem = useCallback(async (payload) => {
        setActionLoading(true);
        setError(null);
        try {
            const updated = await buildsApi.addBuildItem(buildId, payload);
            setBuild(updated);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo anadir la pieza.");
            throw err;
        }
        finally {
            setActionLoading(false);
        }
    }, [buildId]);
    const updateBuildItemLine = useCallback(async (itemId, payload) => {
        setActionLoading(true);
        setError(null);
        try {
            const updated = await buildsApi.updateBuildItem(buildId, itemId, payload);
            setBuild(updated);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo actualizar la linea.");
            throw err;
        }
        finally {
            setActionLoading(false);
        }
    }, [buildId]);
    const removeItem = useCallback(async (itemId) => {
        setActionLoading(true);
        setError(null);
        try {
            await buildsApi.deleteBuildItem(buildId, itemId);
            const updated = await buildsApi.getBuild(buildId);
            setBuild(updated);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo eliminar la pieza del montaje.");
            throw err;
        }
        finally {
            setActionLoading(false);
        }
    }, [buildId]);
    const confirm = useCallback(async () => {
        setActionLoading(true);
        setError(null);
        try {
            const updated = await buildsApi.confirmBuild(buildId);
            setBuild(updated);
            const latestParts = await partsApi.listParts();
            setParts(latestParts);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo confirmar el montaje.");
            throw err;
        }
        finally {
            setActionLoading(false);
        }
    }, [buildId]);
    const revertToDraft = useCallback(async () => {
        setActionLoading(true);
        setError(null);
        try {
            const updated = await buildsApi.revertBuildToDraft(buildId);
            setBuild(updated);
            const latestParts = await partsApi.listParts();
            setParts(latestParts);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo volver el montaje a borrador.");
            throw err;
        }
        finally {
            setActionLoading(false);
        }
    }, [buildId]);
    const updateBuildFields = useCallback(async (payload) => {
        setActionLoading(true);
        setError(null);
        try {
            const updated = await buildsApi.updateBuild(buildId, payload);
            setBuild(updated);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo actualizar el montaje.");
            throw err;
        }
        finally {
            setActionLoading(false);
        }
    }, [buildId]);
    return {
        build,
        parts,
        loading,
        actionLoading,
        error,
        addItem,
        updateBuildItemLine,
        removeItem,
        confirm,
        revertToDraft,
        updateBuildFields,
        reload
    };
}
