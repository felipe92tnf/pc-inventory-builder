import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import * as quotesApi from "../api/quotes";
import type { CreateQuotePayload, Quote, QuoteStatus } from "../types/quote";
import { QUOTE_STATUSES } from "../types/quote";
import { aggregateQuoteFinancials } from "../utils/quoteFinancials";
import { PRIMARY_ACTION_BUTTON, SECONDARY_GHOST_SM } from "../theme/actionButtons";

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
  EXPIRED: "Caducado"
};

function statusBadgeClass(status: QuoteStatus): string {
  switch (status) {
    case "DRAFT":
      return "border-slate-500/40 bg-slate-500/15 text-slate-200";
    case "SENT":
      return "border-sky-500/40 bg-sky-500/15 text-sky-200";
    case "ACCEPTED":
      return "border-emerald-500/40 bg-emerald-500/15 text-emerald-200";
    case "REJECTED":
      return "border-rose-500/40 bg-rose-500/15 text-rose-200";
    case "EXPIRED":
      return "border-amber-500/40 bg-amber-500/15 text-amber-200";
    default:
      return "border-slate-600 bg-slate-800 text-slate-300";
  }
}

export function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | "ALL">("ALL");

  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerEmail, setNewCustomerEmail] = useState("");
  const [newTitle, setNewTitle] = useState("");

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

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!newCustomerName.trim() || !newTitle.trim()) {
      window.alert("Cliente y titulo son obligatorios.");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const payload: CreateQuotePayload = {
        customerName: newCustomerName.trim(),
        customerPhone: newCustomerPhone.trim() || null,
        customerEmail: newCustomerEmail.trim() || null,
        title: newTitle.trim()
      };
      const created = await quotesApi.createQuote(payload);
      setQuotes((prev) => [created, ...prev]);
      setNewCustomerName("");
      setNewCustomerPhone("");
      setNewCustomerEmail("");
      setNewTitle("");
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el presupuesto.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-2 pb-8 text-slate-100 md:px-4">
      <section className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 shadow-[0_20px_50px_-24px_rgba(79,70,229,0.75)] sm:flex-row sm:items-start sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Presupuestos</h1>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className={PRIMARY_ACTION_BUTTON}
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
          className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg shadow-slate-950/40 md:p-6"
        >
          <h2 className="text-lg font-semibold text-slate-100">Crear presupuesto</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-200">
              Cliente
              <input
                required
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-200">
              Telefono (opcional)
              <input
                value={newCustomerPhone}
                onChange={(e) => setNewCustomerPhone(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-200 md:col-span-2">
              Email (opcional)
              <input
                type="email"
                value={newCustomerEmail}
                onChange={(e) => setNewCustomerEmail(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring"
              />
            </label>
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
          <div className="mt-4 flex flex-wrap gap-2">
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

      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg shadow-slate-950/40 md:p-6">
        <h2 className="text-xl font-semibold text-slate-100">Buscar y filtrar</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
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
      </section>

      {loading ? (
        <p className="text-sm text-slate-400">Cargando presupuestos...</p>
      ) : filtered.length === 0 ? (
        <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-8 text-center text-slate-400">
          No hay presupuestos que coincidan.
        </section>
      ) : (
        <>
          <section className="hidden overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-lg shadow-slate-950/40 md:block">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm text-slate-200">
                <thead className="bg-slate-950/70 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Nº</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Titulo</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Coste total</th>
                    <th className="px-4 py-3">Total venta</th>
                    <th className="px-4 py-3">Beneficio</th>
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filtered.map((row) => {
                    const fin = aggregateQuoteFinancials(row);
                    return (
                    <tr key={row.id} className="transition hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-mono text-slate-300">#{row.quoteNumber}</td>
                      <td className="px-4 py-3 font-medium text-slate-100">{row.customerName}</td>
                      <td className="max-w-xs truncate px-4 py-3 text-slate-300">{row.title}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(row.status)}`}
                        >
                          {STATUS_LABELS[row.status]}
                        </span>
                      </td>
                      <td
                        className="whitespace-nowrap px-4 py-3 text-slate-300"
                        title={fin.linesWithoutCost > 0 ? "Coste parcial (hay lineas sin coste)" : undefined}
                      >
                        {money(fin.totalCost)}
                        {fin.linesWithoutCost > 0 ? (
                          <span className="ml-1 text-[10px] text-amber-400/90">*</span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 font-semibold text-emerald-300/95">{money(row.total)}</td>
                      <td
                        className={`whitespace-nowrap px-4 py-3 font-semibold ${
                          fin.profitNet >= 0 ? "text-violet-300/95" : "text-rose-300"
                        }`}
                      >
                        {money(fin.profitNet)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-400">{formatDate(row.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <Link to={`/quotes/${row.id}`} className={SECONDARY_GHOST_SM}>
                          Ver detalle
                        </Link>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-3 md:hidden">
            {filtered.map((row) => {
              const fin = aggregateQuoteFinancials(row);
              return (
              <article
                key={row.id}
                className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 shadow-md shadow-black/20"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-xs text-slate-500">#{row.quoteNumber}</p>
                    <h3 className="mt-1 text-base font-semibold text-slate-100">{row.title}</h3>
                    <p className="mt-1 text-sm text-slate-400">{row.customerName}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(row.status)}`}
                  >
                    {STATUS_LABELS[row.status]}
                  </span>
                </div>
                <div className="mt-3 border-t border-slate-800 pt-3">
                  <p className="text-sm text-slate-500">Total</p>
                  <p className="mt-1 text-xl font-bold text-emerald-300">{money(row.total)}</p>
                </div>
                <Link
                  to={`/quotes/${row.id}`}
                  className={`${SECONDARY_GHOST_SM} mt-4 flex w-full min-h-[44px] justify-center py-2.5 text-sm`}
                >
                  Ver detalle
                </Link>
              </article>
              );
            })}
          </section>
        </>
      )}
    </div>
  );
}
