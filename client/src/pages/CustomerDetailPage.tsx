import { useCallback, useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { getCustomerById, getCustomerOverview, patchCustomer, patchCustomerNotes } from "../api/customers";
import type {
  CustomerDetail,
  CustomerOverview,
  CustomerOverviewBuild,
  CustomerOverviewQuote,
  CustomerOverviewSale,
  CustomerOverviewService
} from "../types/customer";
import {
  PRIMARY_ACTION_BUTTON_COMPACT,
  SECONDARY_GHOST_SM,
  SECONDARY_BUTTON_SM
} from "../theme/actionButtons";
import { PAGE_HERO, PAGE_OUTER_7XL, SECTION_SHELL, TABLE_CELL } from "../theme/layoutDensity";
import { buildStatusLabelEs } from "../utils/buildStatusLabel";
import type { QuoteStatus } from "../types/quote";
import type { ServiceStatus, ServiceType } from "../types/service";
import type { BuildStatus } from "../types/build";

const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  DRAFT: "Borrador",
  SENT: "Enviado",
  ACCEPTED: "Aceptado",
  REJECTED: "Rechazado",
  EXPIRED: "Caducado",
  PENDING_PAYMENT: "Pendiente de pago"
};

const SERVICE_LABELS: Record<ServiceType, string> = {
  SPARE_PART_SALE: "Venta pieza suelta",
  PC_CLEANING: "Limpieza PC",
  FORMATTING: "Formateo",
  OS_INSTALLATION: "Instalacion SO",
  DIAGNOSTIC: "Diagnostico",
  THERMAL_PASTE_CHANGE: "Pasta termica",
  PARTIAL_ASSEMBLY: "Montaje parcial",
  HOME_SERVICE: "Domicilio",
  OTHER: "Otro"
};

const SERVICE_STATUS_LABELS: Record<ServiceStatus, string> = {
  PENDING: "Pendiente",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado"
};

function money(n: number): string {
  return `${n.toFixed(2)} EUR`;
}

function formatShortDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("es-ES");
  } catch {
    return iso;
  }
}

type ViewData = {
  customerId: string | null;
  displayName: string;
  displayPhone: string;
  displayEmail: string | null;
  notes: string | null;
  workCount?: number;
  totalSpent?: number;
  quotes: CustomerOverview["quotes"];
  services: CustomerOverview["services"];
  builds: CustomerOverview["builds"];
  sales: CustomerOverview["sales"];
};

function fromDetail(d: CustomerDetail): ViewData {
  return {
    customerId: d.id,
    displayName: d.name,
    displayPhone: d.phone,
    displayEmail: d.email,
    notes: d.notes,
    workCount: d.workCount,
    totalSpent: d.totalSpent,
    quotes: d.quotes,
    services: d.services,
    builds: d.builds,
    sales: d.sales
  };
}

function fromOverview(d: CustomerOverview): ViewData {
  return {
    customerId: d.customerId,
    displayName: d.displayName,
    displayPhone: d.displayPhone,
    displayEmail: d.displayEmail,
    notes: d.notes,
    quotes: d.quotes,
    services: d.services,
    builds: d.builds,
    sales: d.sales
  };
}

export function CustomerDetailPage() {
  const { id: routeId } = useParams();
  const [searchParams] = useSearchParams();
  const legacyName = searchParams.get("name")?.trim() ?? "";
  const legacyPhone = searchParams.get("phone")?.trim() ?? "";

  const [data, setData] = useState<ViewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  const load = useCallback(async () => {
    if (!routeId && !legacyName) {
      setData(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (routeId) {
        const detail = await getCustomerById(routeId);
        const view = fromDetail(detail);
        setData(view);
        setNotesDraft(view.notes ?? "");
      } else {
        const overview = await getCustomerOverview(legacyName, legacyPhone);
        const view = fromOverview(overview);
        setData(view);
        setNotesDraft(view.notes ?? "");
      }
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : "No se pudo cargar la ficha.");
    } finally {
      setLoading(false);
    }
  }, [routeId, legacyName, legacyPhone]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSaveNotes = async () => {
    if (!data) return;
    setSavingNotes(true);
    setError(null);
    try {
      if (data.customerId) {
        const res = await patchCustomer(data.customerId, {
          notes: notesDraft.trim() === "" ? null : notesDraft.trim()
        });
        setData(fromDetail(res));
        setNotesDraft(res.notes ?? "");
      } else {
        const res = await patchCustomerNotes({
          name: data.displayName,
          phone: data.displayPhone,
          notes: notesDraft.trim() === "" ? null : notesDraft.trim()
        });
        setData((prev) => (prev ? { ...prev, notes: res.notes } : prev));
        setNotesDraft(res.notes ?? "");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron guardar las notas.");
    } finally {
      setSavingNotes(false);
    }
  };

  if (!routeId && !legacyName) {
    return (
      <div className={PAGE_OUTER_7XL}>
        <section className={SECTION_SHELL}>
          <p className="text-sm text-slate-300">
            Selecciona un cliente en la lista o abre la ficha desde un presupuesto, montaje o servicio.
          </p>
          <Link to="/customers" className={`${SECONDARY_GHOST_SM} mt-4 inline-flex`}>
            Ver todos los clientes
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className={PAGE_OUTER_7XL}>
      <section className={PAGE_HERO}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">Cliente</h1>
            {data ? (
              <>
                <p className="mt-1 text-lg font-semibold text-slate-100">{data.displayName}</p>
                <p className="mt-0.5 text-sm text-slate-400">
                  Telefono: <span className="text-slate-200">{data.displayPhone || "—"}</span>
                </p>
                {data.workCount != null ? (
                  <p className="mt-1 text-xs text-slate-500">
                    {data.workCount} trabajos
                    {data.totalSpent != null ? ` · ${money(data.totalSpent)} en ventas y servicios` : ""}
                  </p>
                ) : null}
              </>
            ) : null}
          </div>
          <Link to="/customers" className={SECONDARY_GHOST_SM}>
            Todos los clientes
          </Link>
        </div>
      </section>

      {error ? (
        <div className="mb-4 rounded-xl border border-rose-800/70 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">
          {error}
          <button type="button" onClick={() => void load()} className={`${SECONDARY_BUTTON_SM} ml-3`}>
            Reintentar
          </button>
        </div>
      ) : null}

      {loading && !data ? (
        <div className="h-40 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60" />
      ) : null}

      {data ? (
        <>
          <section className={`${SECTION_SHELL} mb-4`}>
            <h2 className="text-lg font-semibold text-slate-100">Notas</h2>
            <textarea
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              rows={4}
              className="mt-3 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring"
              placeholder="Ej: prefiere WhatsApp, horario tarde..."
            />
            <button
              type="button"
              disabled={savingNotes}
              onClick={() => void handleSaveNotes()}
              className={`${PRIMARY_ACTION_BUTTON_COMPACT} mt-3`}
            >
              {savingNotes ? "Guardando..." : "Guardar notas"}
            </button>
          </section>

          <HistorySection title="Presupuestos" count={data.quotes.length}>
            {data.quotes.length === 0 ? (
              <EmptyHint />
            ) : (
              <HistoryTable
                headers={["Nº", "Titulo", "Estado", "Total", "Fecha", ""]}
                rows={data.quotes.map((q: CustomerOverviewQuote) => [
                  `#${q.quoteNumber}`,
                  q.title,
                  QUOTE_STATUS_LABELS[q.status],
                  money(q.total),
                  formatShortDate(q.createdAt),
                  <Link key={q.id} to={`/quotes/${q.id}`} className={SECONDARY_GHOST_SM}>
                    Ver
                  </Link>
                ])}
              />
            )}
          </HistorySection>

          <HistorySection title="Montajes" count={data.builds.length}>
            {data.builds.length === 0 ? (
              <EmptyHint />
            ) : (
              <HistoryTable
                headers={["Nombre", "Estado", "Fecha", ""]}
                rows={data.builds.map((b: CustomerOverviewBuild) => [
                  b.name,
                  buildStatusLabelEs(b.status as BuildStatus),
                  formatShortDate(b.createdAt),
                  <Link key={b.id} to={`/builds/${b.id}`} className={SECONDARY_GHOST_SM}>
                    Ver
                  </Link>
                ])}
              />
            )}
          </HistorySection>

          <HistorySection title="Servicios" count={data.services.length}>
            {data.services.length === 0 ? (
              <EmptyHint />
            ) : (
              <HistoryTable
                headers={["Fecha", "Titulo", "Tipo", "Estado", "Venta"]}
                rows={data.services.map((s: CustomerOverviewService) => [
                  formatShortDate(s.serviceDate),
                  s.title,
                  SERVICE_LABELS[s.type],
                  SERVICE_STATUS_LABELS[s.status],
                  money(s.salePrice)
                ])}
              />
            )}
          </HistorySection>

          <HistorySection title="Ventas" count={data.sales.length}>
            {data.sales.length === 0 ? (
              <EmptyHint />
            ) : (
              <HistoryTable
                headers={["Fecha", "Montaje", "Venta", "Beneficio", ""]}
                rows={data.sales.map((s: CustomerOverviewSale) => [
                  formatShortDate(s.soldAt),
                  s.buildName,
                  money(s.finalSalePrice),
                  money(s.profit),
                  <Link key={s.id} to={`/sales/${s.id}`} className={SECONDARY_GHOST_SM}>
                    Ver
                  </Link>
                ])}
              />
            )}
          </HistorySection>
        </>
      ) : null}
    </div>
  );
}

function HistorySection({
  title,
  count,
  children
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className={`${SECTION_SHELL} mb-4`}>
      <h2 className="text-lg font-semibold text-slate-100">
        {title} <span className="text-slate-500">({count})</span>
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function EmptyHint() {
  return <p className="text-sm text-slate-500">Ninguno registrado.</p>;
}

function HistoryTable({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800">
      <table className="min-w-full text-left text-sm text-slate-200">
        <thead className="bg-slate-950/80 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            {headers.map((h, i) => (
              <th
                key={i}
                className={`${TABLE_CELL}${i === headers.length - 1 && h === "" ? " text-right" : ""}`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {rows.map((cells, ri) => (
            <tr key={ri} className="transition hover:bg-slate-800/40">
              {cells.map((cell, ci) => (
                <td
                  key={ci}
                  className={`${TABLE_CELL}${ci === cells.length - 1 ? " text-right" : ""} max-w-[200px] truncate`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
