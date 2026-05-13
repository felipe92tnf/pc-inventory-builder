import { useCallback, useEffect, useState } from "react";
import * as salesApi from "../api/sales";
export function useSaleDetail(saleId) {
    const [sale, setSale] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const reload = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await salesApi.getSale(saleId);
            setSale(data);
        }
        catch (err) {
            setSale(null);
            setError(err instanceof Error ? err.message : "No se pudo cargar la venta.");
        }
        finally {
            setLoading(false);
        }
    }, [saleId]);
    useEffect(() => {
        void reload();
    }, [reload]);
    const updateSale = useCallback(async (payload) => {
        setSaving(true);
        setError(null);
        try {
            const updated = await salesApi.patchSale(saleId, payload);
            setSale(updated);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo actualizar la venta.");
            throw err;
        }
        finally {
            setSaving(false);
        }
    }, [saleId]);
    const registerPayment = useCallback(async (amount) => {
        setSaving(true);
        setError(null);
        try {
            const updated = await salesApi.registerSalePayment(saleId, amount);
            setSale(updated);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo registrar el pago.");
            throw err;
        }
        finally {
            setSaving(false);
        }
    }, [saleId]);
    const removeSale = useCallback(async () => {
        setSaving(true);
        setError(null);
        try {
            await salesApi.deleteSale(saleId);
            setSale(null);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo eliminar la venta.");
            throw err;
        }
        finally {
            setSaving(false);
        }
    }, [saleId]);
    return { sale, loading, saving, error, reload, updateSale, registerPayment, removeSale };
}
