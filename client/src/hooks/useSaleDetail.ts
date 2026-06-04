import { useCallback, useEffect, useState } from "react";
import * as salesApi from "../api/sales";
import type { PatchSalePayload, SaleDetail } from "../types/sale";

type UseSaleDetailReturn = {
  sale: SaleDetail | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  reload: () => Promise<void>;
  updateSale: (payload: PatchSalePayload) => Promise<void>;
  revertSale: () => Promise<void>;
  recalculateFromBuild: () => Promise<void>;
  removeSale: () => Promise<void>;
};

export function useSaleDetail(saleId: string): UseSaleDetailReturn {
  const [sale, setSale] = useState<SaleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await salesApi.getSale(saleId);
      setSale(data);
    } catch (err) {
      setSale(null);
      setError(err instanceof Error ? err.message : "No se pudo cargar la venta.");
    } finally {
      setLoading(false);
    }
  }, [saleId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const updateSale = useCallback(
    async (payload: PatchSalePayload) => {
      setSaving(true);
      setError(null);
      try {
        const updated = await salesApi.patchSale(saleId, payload);
        setSale(updated);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo actualizar la venta.");
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [saleId]
  );

  const recalculateFromBuild = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const updated = await salesApi.recalculateSaleFromBuild(saleId);
      setSale(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo recalcular la venta.");
      throw err;
    } finally {
      setSaving(false);
    }
  }, [saleId]);

  const revertSale = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const updated = await salesApi.revertSale(saleId);
      setSale(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo revertir la venta.");
      throw err;
    } finally {
      setSaving(false);
    }
  }, [saleId]);

  const removeSale = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      await salesApi.deleteSale(saleId);
      setSale(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar la venta.");
      throw err;
    } finally {
      setSaving(false);
    }
  }, [saleId]);

  return {
    sale,
    loading,
    saving,
    error,
    reload,
    updateSale,
    revertSale,
    recalculateFromBuild,
    removeSale
  };
}
