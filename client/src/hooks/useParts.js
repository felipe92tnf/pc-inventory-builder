import { useCallback, useEffect, useState } from "react";
import * as partsApi from "../api/parts";
export function useParts() {
    const [parts, setParts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const reload = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await partsApi.listParts();
            setParts(data);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo cargar el inventario.");
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => {
        void reload();
    }, [reload]);
    const createPart = useCallback(async (payload) => {
        setSubmitting(true);
        setError(null);
        try {
            const created = await partsApi.createPart(payload);
            setParts((prev) => [created, ...prev]);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo crear la pieza.");
            throw err;
        }
        finally {
            setSubmitting(false);
        }
    }, []);
    const createStockFromCatalog = useCallback(async (payload) => {
        setSubmitting(true);
        setError(null);
        try {
            const part = await partsApi.createStockFromCatalog(payload);
            setParts((prev) => {
                const idx = prev.findIndex((p) => p.id === part.id);
                if (idx >= 0) {
                    const next = [...prev];
                    next[idx] = part;
                    return next;
                }
                return [part, ...prev];
            });
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo registrar el stock.");
            throw err;
        }
        finally {
            setSubmitting(false);
        }
    }, []);
    const updatePart = useCallback(async (partId, payload) => {
        setSubmitting(true);
        setError(null);
        try {
            const updated = await partsApi.updatePart(partId, payload);
            setParts((prev) => prev.map((item) => (item.id === partId ? updated : item)));
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo actualizar la pieza.");
            throw err;
        }
        finally {
            setSubmitting(false);
        }
    }, []);
    const deletePart = useCallback(async (partId) => {
        setDeletingId(partId);
        setError(null);
        try {
            await partsApi.deletePart(partId);
            setParts((prev) => prev.filter((item) => item.id !== partId));
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo eliminar la pieza.");
            throw err;
        }
        finally {
            setDeletingId(null);
        }
    }, []);
    return {
        parts,
        loading,
        error,
        submitting,
        deletingId,
        createPart,
        createStockFromCatalog,
        updatePart,
        deletePart,
        reload
    };
}
