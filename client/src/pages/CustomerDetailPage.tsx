import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getCustomerOverview, patchCustomerNotes, type CustomerOverview } from "../api/customers";
import {
  PRIMARY_ACTION_BUTTON_COMPACT,
  SECONDARY_GHOST_SM,
  SECONDARY_BUTTON_SM
} from "../theme/actionButtons";
import { PAGE_HERO, PAGE_OUTER_7XL, SECTION_SHELL, TABLE_CELL } from "../theme/layoutDensity";
import type { QuoteStatus } from "../types/quote";
import type { ServiceStatus, ServiceType } from "../types/service";

const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  DRAFT: "Borrador",
  SENT: "Enviado",
  ACCEPTED: "Aceptado",
  REJECTED: "Rechazado",
  EXPIRED: "Caducado"
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

export function CustomerDetailPage() {
  const [searchParams] = useSearchParams();
  const name = searchParams.get("name")?.trim() ?? "";
  const phone = searchParams.get("phone")?.trim() ?? "";

  const [data, setData] = useState<CustomerOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  const load = useCallback(async () => {
    if (!name) {
      setData(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const overview = await getCustomerOverview(name, phone);
      setData(overview);
      setNotesDraft(overview.notes ?? "");
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : "No se pudo cargar la ficha.");
    } finally {
      setLoading(false);
    }
  }, [name, phone]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSaveNotes = async () => {
    if (!name) return;
    setSavingNotes(true);
    setError(null);
    try {
      const res = await patchCustomerNotes({
        name,
        phone,
        notes: notesDraft.trim() === "" ? null : notesDraft.trim()
      });
      setData((prev) => (prev ? { ...prev, notes: res.notes } : prev));
      setNotesDraft(res.notes ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron guardar las notas.");
    } finally {
      setSavingNotes(false);
    }
  };

  if (!name) {
    return (
      <div className={PAGE_OUTER_7XL}>
        <section className={SECTION_SHELL}>
          <p className="text-sm text-slate-300">
            Indica un cliente en la URL (nombre y telefono), o abre la ficha desde un presupuesto, servicio o venta.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/quotes" className={SECONDARY_GHOST_SM}>
              Presupuestos
            </Link>
            <Link to="/services" className={SECONDARY_GHOST_SM}>
              Servicios
            </Link>
            <Link to="/sales" className={SECONDARY_GHOST_SM}>
              Ventas
            </Link>
          </div>
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
            <p className="mt-1 text-lg font-semibold text-slate-100">{name}</p>
            <p className="mt-0.5 text-sm text-slate-400">
              Telefono: <span className="text-slate-200">{phone || "—"}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/quotes" className={SECONDARY_GHOST_SM}>
              Presupuestos
            </Link>
            <Link to="/services" className={SECONDARY_GHOST_SM}>
              Servicios
            </Link>
            <Link to="/sales" className={SECONDARY_GHOST_SM}>
              Ventas
            </Link>
          </div>
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
            <p className="mt-1 text-xs text-slate-500">
              Notas internas de la ficha (no sustituyen las notas de cada presupuesto o venta).
            </p>
            <textarea
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              rows={4}
              className="mt-3 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring"
              placeholder="Ej: prefiere contacto por WhatsApp, horario tarde..."
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

          <section className={`${SECTION_SHELL} mb-4`}>
            <h2 className="text-lg font-semibold text-slate-100">
              Presupuestos <span className="text-slate-500">({data.quotes.length})</span>
            </h2>
            {data.quotes.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">Ninguno con este nombre y telefono.</p>
            ) : (
              <div className="mt-3 overflow-x-auto rounded-xl border border-slate-800">
                <table className="min-w-full text-left text-sm text-slate-200">
                  <thead className="bg-slate-950/80 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className={TABLE_CELL}>Nº</th>
                      <th className={TABLE_CELL}>Titulo</th>
                      <th className={TABLE_CELL}>Estado</th>
                      <th className={TABLE_CELL}>Total</th>
                      <th className={TABLE_CELL}>Fecha</th>
                      <th className={`${TABLE_CELL} text-right`}>Accion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {data.quotes.map((q) => (
                      <tr key={q.id} className="transition hover:bg-slate-800/40">
                        <td className={`${TABLE_CELL} font-mono text-slate-400`}>#{q.quoteNumber}</td>
                        <td className={`${TABLE_CELL} max-w-[200px] truncate`}>{q.title}</td>
                        <td className={TABLE_CELL}>{QUOTE_STATUS_LABELS[q.status]}</td>
                        <td className={`${TABLE_CELL} font-medium text-emerald-300/95`}>{money(q.total)}</td>
                        <td className={`${TABLE_CELL} text-slate-400`}>{formatShortDate(q.createdAt)}</td>
                        <td className={`${TABLE_CELL} text-right`}>
                          <Link to={`/quotes/${q.id}`} className={SECONDARY_GHOST_SM}>
                            Ver
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className={`${SECTION_SHELL} mb-4`}>
            <h2 className="text-lg font-semibold text-slate-100">
              Servicios <span className="text-slate-500">({data.services.length})</span>
            </h2>
            {data.services.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">Ninguno con este nombre y telefono.</p>
            ) : (
              <div className="mt-3 overflow-x-auto rounded-xl border border-slate-800">
                <table className="min-w-full text-left text-sm text-slate-200">
                  <thead className="bg-slate-950/80 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className={TABLE_CELL}>Fecha</th>
                      <th className={TABLE_CELL}>Titulo</th>
                      <th className={TABLE_CELL}>Tipo</th>
                      <th className={TABLE_CELL}>Estado</th>
                      <th className={TABLE_CELL}>Venta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {data.services.map((s) => (
                      <tr key={s.id} className="transition hover:bg-slate-800/40">
                        <td className={`${TABLE_CELL} text-slate-400`}>{formatShortDate(s.serviceDate)}</td>
                        <td className={`${TABLE_CELL} max-w-[220px] truncate`}>{s.title}</td>
                        <td className={`${TABLE_CELL} text-slate-400`}>{SERVICE_LABELS[s.type]}</td>
                        <td className={TABLE_CELL}>{SERVICE_STATUS_LABELS[s.status]}</td>
                        <td className={`${TABLE_CELL} text-emerald-300/95`}>{money(s.salePrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className={SECTION_SHELL}>
            <h2 className="text-lg font-semibold text-slate-100">
              Ventas <span className="text-slate-500">({data.sales.length})</span>
            </h2>
            {data.sales.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">Ninguna con este nombre y telefono.</p>
            ) : (
              <div className="mt-3 overflow-x-auto rounded-xl border border-slate-800">
                <table className="min-w-full text-left text-sm text-slate-200">
                  <thead className="bg-slate-950/80 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className={TABLE_CELL}>Fecha</th>
                      <th className={TABLE_CELL}>Montaje</th>
                      <th className={TABLE_CELL}>Venta</th>
                      <th className={TABLE_CELL}>Beneficio</th>
                      <th className={`${TABLE_CELL} text-right`}>Accion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {data.sales.map((s) => (
                      <tr key={s.id} className="transition hover:bg-slate-800/40">
                        <td className={`${TABLE_CELL} text-slate-400`}>{formatShortDate(s.soldAt)}</td>
                        <td className={`${TABLE_CELL} font-medium text-slate-100`}>{s.buildName}</td>
                        <td className={`${TABLE_CELL} text-emerald-300/95`}>{money(s.finalSalePrice)}</td>
                        <td className={`${TABLE_CELL} text-emerald-200/90`}>{money(s.profit)}</td>
                        <td className={`${TABLE_CELL} text-right`}>
                          <Link to={`/sales/${s.id}`} className={SECONDARY_GHOST_SM}>
                            Ver
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
