import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import * as quotesApi from "../api/quotes";
import type { CreateQuotePayload, Quote, QuoteStatus } from "../types/quote";
import { QUOTE_STATUSES } from "../types/quote";
import { aggregateQuoteFinancials } from "../utils/quoteFinancials";
import {
  PRIMARY_ACTION_BUTTON,
  PRIMARY_ACTION_BUTTON_HEADER,
  STICKY_PRIMARY_MOBILE_DOCK,
  SECONDARY_GHOST_SM,
  DESTRUCTIVE_BUTTON_SM,
  FILTER_TOGGLE_ROW
} from "../theme/actionButtons";
import {
  LIST_PAGE_ACCORDION_SHELL,
  LIST_PAGE_ACCORDION_TRIGGER,
  LIST_PAGE_FILTER_SECTION,
  LIST_PAGE_LISTING_REGION,
  LIST_PAGE_LISTING_TITLE
} from "../theme/listPageMobile";
import { PAGE_HERO, PAGE_OUTER_7XL, SECTION_SHELL, TABLE_CELL } from "../theme/layoutDensity";
import { StatusBadge, quoteStatusVariant } from "../components/ui/StatusBadge";
import { CustomerProfileLink } from "../components/customers/CustomerProfileLink";
import { CustomerPicker, emptyCustomerFields } from "../components/customers/CustomerPicker";
import type { CustomerFieldValue } from "../types/customer";

function money(n: number): string {
  return `${n.toFixed(2)} EUR`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("es-ES", {
      dateStyle: "short",
      timeStyle: "short"
    });
  } catch {
    return iso;
  }
}

const STATUS_LABELS: Record<QuoteStatus, string> = {
  DRAFT: "Borrador",
  SENT: "Enviado",
  ACCEPTED: "Aceptado",
  REJECTED: "Rechazado",
  EXPIRED: "Caducado",
  PENDING_PAYMENT: "Pendiente de pago"
};

function ChevronQuoteFold({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | "ALL">("ALL");

  const [newCustomer, setNewCustomer] = useState<CustomerFieldValue>(emptyCustomerFields);
  const [newTitle, setNewTitle] = useState("");
  /** Móvil: un acordeón por estado; por defecto plegados. */
  const [mobileStatusOpen, setMobileStatusOpen] = useState<Partial<Record<QuoteStatus, boolean>>>({});
  const [filtersOpen, setFiltersOpen] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await quotesApi.listQuotes();
      setQuotes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los presupuestos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return quotes.filter((row) => {
      const matchStatus = statusFilter === "ALL" || row.status === statusFilter;
      if (!matchStatus) return false;
      if (!q) return true;
      const inTitle = row.title.toLowerCase().includes(q);
      const inCustomer = row.customerName.toLowerCase().includes(q);
      return inTitle || inCustomer;
    });
  }, [quotes, query, statusFilter]);

  /** Solo estados con al menos un presupuesto (tras filtros), orden fijo. */
  const quotesByStatus = useMemo(() => {
    const buckets: Record<QuoteStatus, Quote[]> = {
      DRAFT: [],
      SENT: [],
      ACCEPTED: [],
      REJECTED: [],
      EXPIRED: [],
      PENDING_PAYMENT: []
    };
    for (const q of filtered) {
      buckets[q.status].push(q);
    }
    return QUOTE_STATUSES.map((status) => ({ status, rows: buckets[status] })).filter((g) => g.rows.length > 0);
  }, [filtered]);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!newCustomer.customerName.trim() || !newTitle.trim()) {
      window.alert("Cliente y titulo son obligatorios.");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const payload: CreateQuotePayload = {
        customerId: newCustomer.customerId,
        customerName: newCustomer.customerName.trim(),
        customerPhone: newCustomer.customerPhone.trim() || null,
        customerEmail: null,
        title: newTitle.trim()
      };
      const created = await quotesApi.createQuote(payload);
      setQuotes((prev) => [created, ...prev]);
      setNewCustomer(emptyCustomerFields());
      setNewTitle("");
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el presupuesto.");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (quote: Quote) => {
    const ok = window.confirm(
      `Eliminar el presupuesto #${quote.quoteNumber} "${quote.title}"?\n\nEsta accion no se puede deshacer.`
    );
    if (!ok) return;

    setDeletingId(quote.id);
    setError(null);
    try {
      await quotesApi.deleteQuote(quote.id);
      setQuotes((prev) => prev.filter((row) => row.id !== quote.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar el presupuesto.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className={`${PAGE_OUTER_7XL} max-md:pb-32`}>
      <section className={`${PAGE_HERO} flex flex-col gap-3 md:flex-row md:items-start md:justify-between`}>
        <h1 className="text-3xl font-bold tracking-tight">Presupuestos</h1>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className={PRIMARY_ACTION_BUTTON_HEADER}
        >
          {showForm ? "Ocultar formulario" : "Nuevo presupuesto"}
        </button>
      </section>

      {error ? (
        <div className="flex flex-col gap-3 rounded-xl border border-rose-800/70 bg-rose-950/40 px-4 py-3 text-sm text-rose-200 md:flex-row md:items-center md:justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => void reload()}
            className="rounded-lg border border-rose-700 bg-rose-900/50 px-3 py-1.5 font-semibold text-rose-100 transition hover:bg-rose-800/70"
          >
            Reintentar
          </button>
        </div>
      ) : null}

      {showForm ? (
        <form
          onSubmit={handleCreate}
          className={SECTION_SHELL}
        >
          <h2 className="text-lg font-semibold text-slate-100">Crear presupuesto</h2>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <CustomerPicker value={newCustomer} onChange={setNewCustomer} requirePhone={false} />
            </div>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-200 md:col-span-2">
              Titulo del presupuesto
              <input
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ej: PC gaming Ryzen + RTX"
                className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none ring-indigo-400/60 placeholder:text-slate-500 focus:border-indigo-400 focus:ring"
              />
            </label>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={creating}
              className={PRIMARY_ACTION_BUTTON}
            >
              {creating ? "Creando..." : "Crear y editar despues"}
            </button>
          </div>
        </form>
      ) : null}

      <section className={LIST_PAGE_FILTER_SECTION}>
        <button
          type="button"
          className={`${FILTER_TOGGLE_ROW} md:hidden`}
          onClick={() => setFiltersOpen((v) => !v)}
          aria-expanded={filtersOpen}
        >
          <span className="min-w-0 text-left">
            <span className="block text-sm font-semibold text-slate-200">Filtros</span>
            <span className="mt-0.5 block text-xs font-normal text-slate-500">Buscar y acotar por estado</span>
          </span>
          <ChevronQuoteFold open={filtersOpen} />
        </button>
        <div className={filtersOpen ? "" : "max-md:hidden"}>
          <div className="border-t border-slate-800 px-4 pb-4 pt-1 md:border-t-0 md:pt-4">
            <h2 className="mb-3 hidden text-xl font-semibold text-slate-100 md:block">Buscar y filtrar</h2>
            <div className="mt-0 grid grid-cols-1 gap-3 md:mt-0 md:grid-cols-3">
              <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-200 md:col-span-2">
                Buscar por cliente o titulo
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Nombre del cliente o titulo..."
                  className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none ring-indigo-400/60 placeholder:text-slate-500 focus:border-indigo-400 focus:ring"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-200">
                Estado
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as QuoteStatus | "ALL")}
                  className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring"
                >
                  <option value="ALL">Todos</option>
                  {QUOTE_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </div>
      </section>

      <div className={LIST_PAGE_LISTING_REGION}>
        <h2 className={LIST_PAGE_LISTING_TITLE}>Listado de presupuestos</h2>

      {loading ? (
        <p className="text-sm text-slate-400">Cargando presupuestos...</p>
      ) : filtered.length === 0 ? (
        <section className={`${SECTION_SHELL} py-6 text-center text-slate-400`}>
          No hay presupuestos que coincidan.
        </section>
      ) : (
        <>
          <div className="hidden space-y-4 md:block">
            {quotesByStatus.map(({ status, rows }) => (
              <section key={status} className={LIST_PAGE_ACCORDION_SHELL}>
                <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 bg-slate-950/70 px-4 py-2.5">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-200">
                    {STATUS_LABELS[status]}
                  </h3>
                  <StatusBadge variant={quoteStatusVariant(status)} size="card" className="leading-none tabular-nums">
                    {rows.length}
                  </StatusBadge>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm text-slate-200">
                    <thead className="bg-slate-950/50 text-xs uppercase tracking-wide text-slate-400">
                      <tr>
                        <th className={TABLE_CELL}>Nº</th>
                        <th className={TABLE_CELL}>Cliente</th>
                        <th className={TABLE_CELL}>Titulo</th>
                        <th className={TABLE_CELL}>Coste total</th>
                        <th className={TABLE_CELL}>Total venta</th>
                        <th className={TABLE_CELL}>Beneficio</th>
                        <th className={TABLE_CELL}>Fecha</th>
                        <th className={`${TABLE_CELL} text-right`}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {rows.map((row) => {
                        const fin = aggregateQuoteFinancials(row);
                        return (
                          <tr key={row.id} className="transition hover:bg-slate-800/40">
                            <td className={`${TABLE_CELL} font-mono text-slate-300`}>#{row.quoteNumber}</td>
                            <td className={TABLE_CELL}>
                              <div className="font-medium text-slate-100">{row.customerName}</div>
                              <CustomerProfileLink
                                customerName={row.customerName}
                                customerPhone={row.customerPhone}
                                className="mt-1 inline-flex text-[11px]"
                              />
                            </td>
                            <td className={`max-w-xs truncate ${TABLE_CELL} text-slate-300`}>{row.title}</td>
                            <td
                              className={`whitespace-nowrap ${TABLE_CELL} text-slate-300`}
                              title={fin.linesWithoutCost > 0 ? "Coste parcial (hay lineas sin coste)" : undefined}
                            >
                              {money(fin.totalCost)}
                              {fin.linesWithoutCost > 0 ? (
                                <span className="ml-1 text-[10px] text-amber-400/90">*</span>
                              ) : null}
                            </td>
                            <td className={`${TABLE_CELL} font-semibold text-emerald-300/95`}>
                              <div>{money(row.total)}</div>
                              {row.status === "PENDING_PAYMENT" ? (
                                <p className="mt-0.5 text-[11px] font-normal text-amber-200/90">
                                  Por cobrar: {money(row.paymentRemaining)}
                                </p>
                              ) : null}
                            </td>
                            <td
                              className={`whitespace-nowrap ${TABLE_CELL} font-semibold ${
                                fin.profitNet >= 0 ? "text-violet-300/95" : "text-rose-300"
                              }`}
                            >
                              {money(fin.profitNet)}
                            </td>
                            <td className={`whitespace-nowrap ${TABLE_CELL} text-slate-400`}>
                              {formatDate(row.createdAt)}
                            </td>
                            <td className={`${TABLE_CELL} text-right`}>
                              <div className="flex justify-end gap-2">
                                <Link to={`/quotes/${row.id}`} className={SECONDARY_GHOST_SM}>
                                  Ver detalle
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => void handleDelete(row)}
                                  disabled={deletingId === row.id}
                                  className={DESTRUCTIVE_BUTTON_SM}
                                >
                                  {deletingId === row.id ? "Eliminando..." : "Eliminar"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
          </div>

          <div className="space-y-3 md:hidden">
            {quotesByStatus.map(({ status, rows }) => {
              const expanded = mobileStatusOpen[status] === true;
              const panelId = `quote-mobile-status-${status}`;
              return (
                <article key={status} className={LIST_PAGE_ACCORDION_SHELL}>
                  <button
                    type="button"
                    className={LIST_PAGE_ACCORDION_TRIGGER}
                    onClick={() =>
                      setMobileStatusOpen((prev) => ({
                        ...prev,
                        [status]: !prev[status]
                      }))
                    }
                    aria-expanded={expanded}
                    aria-controls={panelId}
                  >
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold uppercase tracking-wide text-slate-200">
                          {STATUS_LABELS[status]}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {rows.length === 1 ? "1 presupuesto" : `${rows.length} presupuestos`}
                        </p>
                      </div>
                      <StatusBadge variant={quoteStatusVariant(status)} size="card" className="leading-none tabular-nums">
                        {rows.length}
                      </StatusBadge>
                    </div>
                    <ChevronQuoteFold open={expanded} />
                  </button>
                  {expanded ? (
                    <div id={panelId} className="space-y-2 border-t border-slate-800 p-3">
                      {rows.map((row) => (
                        <article
                          key={row.id}
                          className="rounded-xl border border-slate-800/90 bg-slate-900/40 p-3 shadow-sm"
                        >
                          <p className="font-mono text-xs text-slate-500">#{row.quoteNumber}</p>
                          <h4 className="mt-1 text-base font-semibold leading-snug text-slate-100">{row.title}</h4>
                          <p className="mt-1 text-sm text-slate-400">{row.customerName}</p>
                          <CustomerProfileLink
                            customerName={row.customerName}
                            customerPhone={row.customerPhone}
                            className="mt-2 inline-flex text-xs"
                          />
                          <div className="mt-2 border-t border-slate-800 pt-2">
                            <p className="text-xs text-slate-500">Total</p>
                            <p className="mt-0.5 text-lg font-bold text-emerald-300">{money(row.total)}</p>
                            {row.status === "PENDING_PAYMENT" ? (
                              <p className="mt-1 text-xs text-amber-200/90">Por cobrar: {money(row.paymentRemaining)}</p>
                            ) : null}
                          </div>
                          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <Link
                              to={`/quotes/${row.id}`}
                              className={`${SECONDARY_GHOST_SM} flex min-h-[44px] w-full justify-center py-2.5 text-sm`}
                            >
                              Ver detalle
                            </Link>
                            <button
                              type="button"
                              onClick={() => void handleDelete(row)}
                              disabled={deletingId === row.id}
                              className={`${DESTRUCTIVE_BUTTON_SM} min-h-[44px] w-full text-sm`}
                            >
                              {deletingId === row.id ? "Eliminando..." : "Eliminar"}
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </>
      )}
      </div>
      <div className={STICKY_PRIMARY_MOBILE_DOCK}>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className={PRIMARY_ACTION_BUTTON}
        >
          {showForm ? "Ocultar formulario" : "Nuevo presupuesto"}
        </button>
      </div>
    </div>
  );
}
