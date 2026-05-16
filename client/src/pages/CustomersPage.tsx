import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listCustomers } from "../api/customers";
import type { CustomerListItem } from "../types/customer";
import { PAGE_HERO, PAGE_OUTER_7XL, SECTION_SHELL, TABLE_CELL } from "../theme/layoutDensity";
import { SECONDARY_GHOST_SM } from "../theme/actionButtons";

function money(n: number): string {
  return `${n.toFixed(2)} EUR`;
}

export function CustomersPage() {
  const [rows, setRows] = useState<CustomerListItem[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listCustomers(query);
      setRows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron cargar los clientes.");
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    const t = setTimeout(() => void load(), query.trim() ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, query]);

  return (
    <div className={PAGE_OUTER_7XL}>
      <section className={PAGE_HERO}>
        <h1 className="text-3xl font-bold tracking-tight text-slate-100">Clientes</h1>
        <p className="mt-1 text-sm text-slate-400">
          Fichas reutilizables. Se crean al guardar un presupuesto, montaje o servicio, o desde el buscador de
          cliente.
        </p>
      </section>

      <section className={`${SECTION_SHELL} mb-4`}>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-200">
          Buscar
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nombre, telefono o email..."
            className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring"
          />
        </label>
      </section>

      {error ? (
        <div className="mb-4 rounded-xl border border-rose-800/70 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <section className={SECTION_SHELL}>
        {loading ? (
          <div className="h-32 animate-pulse rounded-xl bg-slate-900/60" />
        ) : rows.length === 0 ? (
          <p className="text-sm text-slate-500">Ningun cliente encontrado.</p>
        ) : (
          <>
            <div className="hidden overflow-x-auto rounded-xl border border-slate-800 md:block">
              <table className="min-w-full text-left text-sm text-slate-200">
                <thead className="bg-slate-950/80 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className={TABLE_CELL}>Nombre</th>
                    <th className={TABLE_CELL}>Telefono</th>
                    <th className={TABLE_CELL}>Email</th>
                    <th className={TABLE_CELL}>Trabajos</th>
                    <th className={TABLE_CELL}>Total ventas</th>
                    <th className={`${TABLE_CELL} text-right`}>Ficha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {rows.map((c) => (
                    <tr key={c.id} className="transition hover:bg-slate-800/40">
                      <td className={`${TABLE_CELL} font-medium text-slate-100`}>{c.name}</td>
                      <td className={TABLE_CELL}>{c.phone || "—"}</td>
                      <td className={`${TABLE_CELL} text-slate-400`}>{c.email ?? "—"}</td>
                      <td className={TABLE_CELL}>{c.workCount}</td>
                      <td className={`${TABLE_CELL} text-emerald-300/95`}>{money(c.totalSpent)}</td>
                      <td className={`${TABLE_CELL} text-right`}>
                        <Link to={`/customers/${c.id}`} className={SECONDARY_GHOST_SM}>
                          Ver
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="space-y-3 md:hidden">
              {rows.map((c) => (
                <li
                  key={c.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/50 p-3"
                >
                  <p className="font-semibold text-slate-100">{c.name}</p>
                  <p className="mt-0.5 text-sm text-slate-400">{c.phone || "Sin telefono"}</p>
                  {c.email ? <p className="text-sm text-slate-500">{c.email}</p> : null}
                  <p className="mt-2 text-xs text-slate-500">
                    {c.workCount} trabajos · {money(c.totalSpent)} en ventas
                  </p>
                  <Link to={`/customers/${c.id}`} className={`${SECONDARY_GHOST_SM} mt-2 inline-flex`}>
                    Ver ficha
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
