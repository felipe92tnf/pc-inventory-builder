import { useCallback, useEffect, useState } from "react";
import * as salesApi from "../api/sales";
import * as servicesApi from "../api/services";
import type { MonthlyServiceSummaryRow } from "../types/service";
import type { MonthlySalesSummaryRow, SaleListRow } from "../types/sale";

type UseSalesReturn = {
  sales: SaleListRow[];
  summary: MonthlySalesSummaryRow[];
  servicesSummary: MonthlyServiceSummaryRow[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

export function useSales(): UseSalesReturn {
  const [sales, setSales] = useState<SaleListRow[]>([]);
  const [summary, setSummary] = useState<MonthlySalesSummaryRow[]>([]);
  const [servicesSummary, setServicesSummary] = useState<MonthlyServiceSummaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar las ventas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { sales, summary, servicesSummary, loading, error, reload };
}
