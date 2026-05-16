import { useSearchParams } from "react-router-dom";
import { CustomerDetailPage } from "./CustomerDetailPage";
import { CustomersPage } from "./CustomersPage";

/** Lista de clientes; si hay ?name= en URL (enlaces legacy), muestra la ficha. */
export function CustomersIndexPage() {
  const [searchParams] = useSearchParams();
  const legacyName = searchParams.get("name")?.trim();
  if (legacyName) return <CustomerDetailPage />;
  return <CustomersPage />;
}
