import { useCallback, useEffect, useState } from "react";
import * as salesApi from "../api/sales";
import * as servicesApi from "../api/services";
export function useSales() {
    const [sales, setSales] = useState([]);
    const [summary, setSummary] = useState([]);
    const [servicesSummary, setServicesSummary] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const reload = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [salesData, summaryData, servicesMonthly] = await Promise.all([
                salesApi.listSales(),
                salesApi.getMonthlySalesSummary(),
                servicesApi.getMonthlyServicesSummary()
            ]);
            setSales(salesData);
            setSummary(summaryData);
            setServicesSummary(servicesMonthly);
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
    return { sales, summary, servicesSummary, loading, error, reload };
}
