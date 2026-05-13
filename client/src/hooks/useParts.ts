import { useCallback, useEffect, useState } from "react";
import * as partsApi from "../api/parts";
import type { Part, PartPayload, StockFromCatalogPayload } from "../types/part";

type UsePartsReturn = {
  parts: Part[];
  loading: boolean;
  error: string | null;
  submitting: boolean;
  deletingId: string | null;
  createPart: (payload: PartPayload) => Promise<void>;
  createStockFromCatalog: (payload: StockFromCatalogPayload) => Promise<void>;
  updatePart: (partId: string, payload: Partial<PartPayload>) => Promise<void>;
  deletePart: (partId: string) => Promise<void>;
  reload: () => Promise<void>;
};

export function useParts(): UsePartsReturn {
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await partsApi.listParts();
      setParts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar el inventario.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const createPart = useCallback(async (payload: PartPayload) => {
    setSubmitting(true);
    setError(null);
    try {
      const created = await partsApi.createPart(payload);
      setParts((prev) => [created, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la pieza.");
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const createStockFromCatalog = useCallback(async (payload: StockFromCatalogPayload) => {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar el stock.");
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const updatePart = useCallback(async (partId: string, payload: Partial<PartPayload>) => {
    setSubmitting(true);
    setError(null);
    try {
      const updated = await partsApi.updatePart(partId, payload);
      setParts((prev) => prev.map((item) => (item.id === partId ? updated : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar la pieza.");
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const deletePart = useCallback(async (partId: string) => {
    setDeletingId(partId);
    setError(null);
    try {
      await partsApi.deletePart(partId);
      setParts((prev) => prev.filter((item) => item.id !== partId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar la pieza.");
      throw err;
    } finally {
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
