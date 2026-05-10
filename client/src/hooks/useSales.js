import { useCallback, useEffect, useState } from "react";
import * as salesApi from "../api/sales";
export function useSales() {
    const [sales, setSales] = useState([]);
    const [summary, setSummary] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const reload = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [salesData, summaryData] = await Promise.all([
                salesApi.listSales(),
                salesApi.getMonthlySalesSummary()
            ]);
            setSales(salesData);
            setSummary(summaryData);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "No se pudieron cargar las ventas.");
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => {
        void reload();
    }, [reload]);
    return { sales, summary, loading, error, reload };
}
