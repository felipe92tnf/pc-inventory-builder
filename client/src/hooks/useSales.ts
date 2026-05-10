import { useCallback, useEffect, useState } from "react";
import * as salesApi from "../api/sales";
import type { MonthlySalesSummaryRow, SaleListRow } from "../types/sale";

type UseSalesReturn = {
  sales: SaleListRow[];
  summary: MonthlySalesSummaryRow[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

export function useSales(): UseSalesReturn {
  const [sales, setSales] = useState<SaleListRow[]>([]);
  const [summary, setSummary] = useState<MonthlySalesSummaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar las ventas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { sales, summary, loading, error, reload };
}
