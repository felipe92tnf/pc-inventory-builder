import { useMemo, useState, useEffect, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import * as servicesApi from "../api/services";
import { useServices } from "../hooks/useServices";
import type { ServiceRow, ServiceStatus, ServiceType } from "../types/service";
import { SERVICE_TYPES, SERVICE_STATUSES } from "../types/service";
import { downloadServicePdf } from "../utils/servicePdfExport";
import {
  PRIMARY_ACTION_BUTTON,
  PRIMARY_ACTION_BUTTON_HEADER,
  STICKY_PRIMARY_MOBILE_DOCK,
  PRIMARY_ACTION_BUTTON_COMPACT,
  SECONDARY_BUTTON,
  SECONDARY_BUTTON_SM,
  FILTER_TOGGLE_ROW,
  DESTRUCTIVE_BUTTON_SM,
  ORANGE_EDIT_BUTTON_SM,
  ORANGE_EDIT_BUTTON_CARD
} from "../theme/actionButtons";
import { PAGE_HERO, PAGE_OUTER_7XL } from "../theme/layoutDensity";
import {
  LIST_PAGE_ACCORDION_BODY,
  LIST_PAGE_ACCORDION_SHELL,
  LIST_PAGE_ACCORDION_TRIGGER,
  LIST_PAGE_COUNT_BADGE,
  LIST_PAGE_FILTER_SECTION,
  LIST_PAGE_LISTING_REGION,
  LIST_PAGE_LISTING_TITLE
} from "../theme/listPageMobile";
import { StatusBadge, serviceStatusVariant } from "../components/ui/StatusBadge";
import { CustomerProfileLink } from "../components/customers/CustomerProfileLink";

const SERVICE_LABELS: Record<ServiceType, string> = {
  SPARE_PART_SALE: "Venta de pieza suelta",
  PC_CLEANING: "Limpieza de PC",
  FORMATTING: "Formateo",
  OS_INSTALLATION: "Instalacion de sistema operativo",
  DIAGNOSTIC: "Diagnostico",
  THERMAL_PASTE_CHANGE: "Cambio de pasta termica",
  PARTIAL_ASSEMBLY: "Montaje parcial",
  HOME_SERVICE: "Servicio a domicilio",
  OTHER: "Otro"
};

const STATUS_LABELS: Record<ServiceStatus, string> = {
  PENDING: "Pendiente",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado"
};

function money(n: number): string {
  return `${n.toFixed(2)} EUR`;
}

function ChevronDown({ open, className = "" }: { open: boolean; className?: string }) {
  return (
    <svg
      className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""} ${className}`}
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

function aggregateStats(rows: ServiceRow[]) {
  const revenue = rows.reduce((a, s) => a + s.salePrice, 0);
  const profit = rows.reduce((a, s) => a + s.profit, 0);
  return { count: rows.length, revenue, profit };
}

/** Piezas sueltas vendidas como servicio */
function isSparePartSale(s: ServiceRow): boolean {
  return s.type === "SPARE_PART_SALE";
}

/** Domicilio: tipo HOME_SERVICE o flag (excluye venta pieza para no duplicar) */
function isHomeBucket(s: ServiceRow): boolean {
  if (s.type === "SPARE_PART_SALE") return false;
  return s.type === "HOME_SERVICE" || s.isHomeService;
}

function partitionCompleted(completed: ServiceRow[]) {
  const spare = completed.filter(isSparePartSale);
  const home = completed.filter(isHomeBucket);
  const technical = completed.filter((s) => !isSparePartSale(s) && !isHomeBucket(s));
  return { spare, home, technical };
}

function spareSaleSummary(s: ServiceRow): string | null {
  if (!isSparePartSale(s)) return null;
  if (s.sparePartLines?.length) {
    return s.sparePartLines.map((l) => `${l.part.name} × ${l.quantity}`).join(", ");
  }
  if (s.selectedPart && s.quantity) {
    return `${s.selectedPart.name} × ${s.quantity}`;
  }
  return null;
}

export function ServicesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const now = new Date();
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1);
  const [filterYear, setFilterYear] = useState(now.getFullYear());
  const [filterType, setFilterType] = useState<ServiceType | "ALL">("ALL");
  const [filterStatus, setFilterStatus] = useState<ServiceStatus | "ALL">("ALL");

  const typeParam = filterType === "ALL" ? undefined : filterType;
  const statusParam = filterStatus === "ALL" ? undefined : filterStatus;

  const {
    services,
    loading,
    error,
    actionId,
    reload,
    patchService,
    deleteService,
    completeService
  } = useServices(filterMonth, filterYear, typeParam, statusParam);

  const [creatingQuick, setCreatingQuick] = useState(false);
  const [listFlash, setListFlash] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [openPending, setOpenPending] = useState(true);
  const [openCompleted, setOpenCompleted] = useState(false);
  const [openCancelled, setOpenCancelled] = useState(false);
  const [pdfGeneratingId, setPdfGeneratingId] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);

  useEffect(() => {
    const msg = (location.state as { flash?: string } | null)?.flash;
    if (!msg) return;
    setListFlash(msg);
    navigate(location.pathname, { replace: true, state: {} });
    void reload();
  }, [location.pathname, location.state, navigate, reload]);

  const handleQuickCreate = async () => {
    setCreatingQuick(true);
    try {
      const created = await servicesApi.createService({
        type: "DIAGNOSTIC",
        title: "Nuevo servicio",
        customerName: "Por definir",
        customerPhone: "-",
        serviceDate: new Date().toISOString(),
        costPrice: 0,
        salePrice: 0,
        manualLines: []
      });
      navigate(`/services/${created.id}`);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "No se pudo crear el servicio.");
    } finally {
      setCreatingQuick(false);
    }
  };

  const handleDownloadPdf = async (service: ServiceRow) => {
    setPdfError(null);
    setPdfGeneratingId(service.id);
    try {
      await downloadServicePdf(service);
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : "No se pudo generar el PDF.");
    } finally {
      setPdfGeneratingId(null);
    }
  };

  const years = useMemo(() => {
    const y = now.getFullYear();
    return [y - 1, y, y + 1];
  }, [now]);

  const months = [
    [1, "Enero"],
    [2, "Febrero"],
    [3, "Marzo"],
    [4, "Abril"],
    [5, "Mayo"],
    [6, "Junio"],
    [7, "Julio"],
    [8, "Agosto"],
    [9, "Septiembre"],
    [10, "Octubre"],
    [11, "Noviembre"],
    [12, "Diciembre"]
  ] as const;

  const { pending, completed, cancelled } = useMemo(() => {
    return {
      pending: services.filter((s) => s.status === "PENDING"),
      completed: services.filter((s) => s.status === "COMPLETED"),
      cancelled: services.filter((s) => s.status === "CANCELLED")
    };
  }, [services]);

  const completedParts = useMemo(() => partitionCompleted(completed), [completed]);

  const pendingStats = aggregateStats(pending);
  const completedStats = aggregateStats(completed);
  const cancelledStats = aggregateStats(cancelled);

  const serviceActions = {
    onComplete: (id: string) => {
      void completeService(id);
    },
    onCancel: (id: string) => {
      void patchService(id, { status: "CANCELLED" });
    },
    onDelete: (id: string) => {
      if (window.confirm("Eliminar este servicio?")) {
        void deleteService(id);
      }
    },
    onDownloadPdf: (service: ServiceRow) => {
      void handleDownloadPdf(service);
    },
    pdfGeneratingId
  };

  return (
    <div className={`${PAGE_OUTER_7XL} max-md:pb-32`}>
      <section className={`${PAGE_HERO} flex flex-col gap-3 md:flex-row md:items-start md:justify-between`}>
        <h1 className="text-3xl font-bold tracking-tight">Servicios</h1>
        <button
          type="button"
          disabled={creatingQuick}
          onClick={() => void handleQuickCreate()}
          className={PRIMARY_ACTION_BUTTON_HEADER}
        >
          {creatingQuick ? "Creando…" : "Nuevo servicio"}
        </button>
      </section>

      {listFlash ? (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/50 px-4 py-3 text-sm text-emerald-100">
          {listFlash}
        </div>
      ) : null}

      {error ? (
        <div className="flex flex-col gap-3 rounded-xl border border-rose-800/70 bg-rose-950/40 px-4 py-3 text-sm text-rose-200 md:flex-row md:items-center md:justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => {
              void reload();
            }}
            className="rounded-lg border border-rose-700 bg-rose-900/50 px-3 py-1.5 font-semibold text-rose-100 transition hover:bg-rose-800/70"
          >
            Reintentar
          </button>
        </div>
      ) : null}

      {pdfError ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-800/70 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">
          <span>{pdfError}</span>
          <button
            type="button"
            onClick={() => setPdfError(null)}
            className="rounded-lg border border-rose-700 bg-rose-900/50 px-3 py-1 text-xs font-semibold text-rose-100 hover:bg-rose-800/70"
          >
            Cerrar
          </button>
        </div>
      ) : null}

      {/* Filtros colapsables */}
      <section className={LIST_PAGE_FILTER_SECTION}>
        <button
          type="button"
          className={FILTER_TOGGLE_ROW}
          onClick={() => setFiltersOpen((v) => !v)}
          aria-expanded={filtersOpen}
        >
          <span className="min-w-0 text-left">
            <span className="block text-sm font-semibold text-slate-200">Filtros</span>
            <span className="mt-0.5 block text-xs font-normal text-slate-500">Mes, tipo y estado</span>
          </span>
          <ChevronDown open={filtersOpen} />
        </button>
        {filtersOpen ? (
          <div className="border-t border-slate-800 px-4 pb-4 pt-1">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="flex flex-col gap-1 text-xs font-medium text-slate-300">
                Mes
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(Number(e.target.value))}
                  className="min-h-[40px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring"
                >
                  {months.map(([num, label]) => (
                    <option key={num} value={num}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-slate-300">
                Año
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(Number(e.target.value))}
                  className="min-h-[40px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-slate-300">
                Tipo
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as ServiceType | "ALL")}
                  className="min-h-[40px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring"
                >
                  <option value="ALL">Todos</option>
                  {SERVICE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {SERVICE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-slate-300">
                Estado
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as ServiceStatus | "ALL")}
                  className="min-h-[40px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring"
                >
                  <option value="ALL">Todos</option>
                  {SERVICE_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        ) : null}
      </section>

      {/* Servicios agrupados */}
      <section className={LIST_PAGE_LISTING_REGION}>
        <h2 className={LIST_PAGE_LISTING_TITLE}>Listado de servicios</h2>

        {loading ? (
          <p className="text-sm text-slate-400">Cargando...</p>
        ) : services.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-700 bg-slate-950/40 px-4 py-8 text-center text-sm text-slate-500">
            No hay servicios en este periodo con los filtros actuales.
          </p>
        ) : (
          <div className="space-y-3">
            <StatusAccordion
              title="Pendientes"
              tone="amber"
              open={openPending}
              onToggle={() => setOpenPending((v) => !v)}
              stats={pendingStats}
              emptyHint="No hay servicios pendientes."
            >
              <ServiceListSection rows={pending} actionId={actionId} {...serviceActions} />
            </StatusAccordion>

            <StatusAccordion
              title="Completados"
              tone="emerald"
              open={openCompleted}
              onToggle={() => setOpenCompleted((v) => !v)}
              stats={completedStats}
              emptyHint="No hay servicios completados."
            >
              <div className="space-y-4">
                {completedParts.spare.length > 0 ? (
                  <CompletedSubsection
                    label="Venta de pieza suelta"
                    accent="border-cyan-500/40 bg-cyan-500/5"
                    rows={completedParts.spare}
                    actionId={actionId}
                    {...serviceActions}
                  />
                ) : null}
                {completedParts.technical.length > 0 ? (
                  <CompletedSubsection
                    label="Servicios técnicos"
                    accent="border-indigo-500/40 bg-indigo-500/5"
                    rows={completedParts.technical}
                    actionId={actionId}
                    {...serviceActions}
                  />
                ) : null}
                {completedParts.home.length > 0 ? (
                  <CompletedSubsection
                    label="Servicios a domicilio"
                    accent="border-violet-500/40 bg-violet-500/5"
                    rows={completedParts.home}
                    actionId={actionId}
                    {...serviceActions}
                  />
                ) : null}
              </div>
            </StatusAccordion>

            <StatusAccordion
              title="Cancelados"
              tone="slate"
              open={openCancelled}
              onToggle={() => setOpenCancelled((v) => !v)}
              stats={cancelledStats}
              emptyHint="No hay servicios cancelados."
            >
              <ServiceListSection rows={cancelled} actionId={actionId} {...serviceActions} />
            </StatusAccordion>
          </div>
        )}
      </section>

      <div className={STICKY_PRIMARY_MOBILE_DOCK}>
        <button
          type="button"
          disabled={creatingQuick}
          onClick={() => void handleQuickCreate()}
          className={PRIMARY_ACTION_BUTTON}
        >
          {creatingQuick ? "Creando…" : "Nuevo servicio"}
        </button>
      </div>
    </div>
  );
}

function StatusAccordion({
  title,
  tone,
  open,
  onToggle,
  stats,
  emptyHint,
  children
}: {
  title: string;
  tone: "amber" | "emerald" | "slate";
  open: boolean;
  onToggle: () => void;
  stats: { count: number; revenue: number; profit: number };
  emptyHint: string;
  children: ReactNode;
}) {
  const toneBadge =
    tone === "amber"
      ? "border-amber-500/30 bg-amber-500/15 text-amber-200"
      : tone === "emerald"
        ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-200"
        : "border-slate-600 bg-slate-800 text-slate-300";

  return (
    <section className={LIST_PAGE_ACCORDION_SHELL}>
      <button
        type="button"
        className={LIST_PAGE_ACCORDION_TRIGGER}
        onClick={onToggle}
        aria-expanded={open}
      >
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:gap-3">
          <span className="text-lg font-semibold text-slate-100">{title}</span>
          <span className={`${LIST_PAGE_COUNT_BADGE} ${toneBadge}`}>{stats.count}</span>
        </div>
        <ChevronDown open={open} />
      </button>
      {open ? (
        <div className={LIST_PAGE_ACCORDION_BODY}>
          {stats.count === 0 ? (
            <p className="py-3 text-sm text-slate-500">{emptyHint}</p>
          ) : (
            children
          )}
        </div>
      ) : null}
    </section>
  );
}

function CompletedSubsection({
  label,
  accent,
  rows,
  actionId,
  onComplete,
  onCancel,
  onDelete,
  onDownloadPdf,
  pdfGeneratingId
}: {
  label: string;
  accent: string;
  rows: ServiceRow[];
  actionId: string | null;
  onComplete: (id: string) => void;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
  onDownloadPdf: (s: ServiceRow) => void;
  pdfGeneratingId: string | null;
}) {
  const st = aggregateStats(rows);
  return (
    <div className={`rounded-lg border ${accent} p-4`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">{label}</h3>
        <StatusBadge variant="neutral" size="table" className="tabular-nums">
          {st.count}
        </StatusBadge>
      </div>
      <ServiceListSection
        rows={rows}
        actionId={actionId}
        completedActions
        onDownloadPdf={onDownloadPdf}
        pdfGeneratingId={pdfGeneratingId}
        onComplete={onComplete}
        onCancel={onCancel}
        onDelete={onDelete}
      />
    </div>
  );
}

/** Botones táctiles en cards móvil de servicios */
const SERVICE_CARD_ACTION_TOUCH =
  "min-h-[44px] w-full justify-center px-4 py-2.5 text-sm font-semibold";

function ServiceListSection({
  rows,
  actionId,
  completedActions = false,
  onDownloadPdf,
  pdfGeneratingId,
  onComplete,
  onCancel,
  onDelete
}: {
  rows: ServiceRow[];
  actionId: string | null;
  completedActions?: boolean;
  onDownloadPdf: (s: ServiceRow) => void;
  pdfGeneratingId: string | null;
  onComplete: (id: string) => void;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  if (rows.length === 0) return null;
  return (
    <>
      <div className="hidden overflow-hidden rounded-lg border border-slate-800 bg-slate-900/50 md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-xs text-slate-200">
            <thead className="bg-slate-950/80 text-[10px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-2 py-2">Fecha</th>
                <th className="px-2 py-2">Titulo</th>
                <th className="px-2 py-2">Tipo</th>
                <th className="px-2 py-2">Cliente</th>
                <th className="px-2 py-2">Estado</th>
                <th className="px-2 py-2">Venta</th>
                <th className="px-2 py-2">Beneficio</th>
                <th className="px-2 py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {rows.map((s) => (
                <ServiceTableRow
                  key={s.id}
                  s={s}
                  actionId={actionId}
                  completedActions={completedActions}
                  onDownloadPdf={onDownloadPdf}
                  pdfGeneratingId={pdfGeneratingId}
                  onComplete={onComplete}
                  onCancel={onCancel}
                  onDelete={onDelete}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="space-y-2 md:hidden">
        {rows.map((s) => (
          <ServiceCard
            key={s.id}
            s={s}
            actionId={actionId}
            completedActions={completedActions}
            onDownloadPdf={onDownloadPdf}
            pdfGeneratingId={pdfGeneratingId}
            onComplete={onComplete}
            onCancel={onCancel}
            onDelete={onDelete}
          />
        ))}
      </div>
    </>
  );
}

function ServiceTableRow({
  s,
  actionId,
  completedActions = false,
  onDownloadPdf,
  pdfGeneratingId,
  onComplete,
  onCancel,
  onDelete
}: {
  s: ServiceRow;
  actionId: string | null;
  completedActions?: boolean;
  onDownloadPdf: (row: ServiceRow) => void;
  pdfGeneratingId: string | null;
  onComplete: (id: string) => void;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const d = new Date(s.serviceDate);
  const dateStr = d.toLocaleDateString("es-ES");
  const spareHint = spareSaleSummary(s);
  return (
    <tr className="transition hover:bg-slate-800/40">
      <td className="whitespace-nowrap px-2 py-2 text-slate-400">{dateStr}</td>
      <td className="max-w-[200px] px-2 py-2">
        <div className="truncate font-medium text-slate-100" title={s.title}>
          {s.title}
        </div>
        {spareHint ? (
          <div className="truncate text-[10px] text-slate-500" title={spareHint}>
            {spareHint}
          </div>
        ) : null}
      </td>
      <td className="max-w-[100px] truncate px-2 py-2 text-[11px] text-slate-400" title={SERVICE_LABELS[s.type]}>
        {SERVICE_LABELS[s.type]}
      </td>
      <td className="max-w-[120px] px-2 py-2 text-slate-300">
        <div className="truncate font-medium" title={s.customerName}>
          {s.customerName}
        </div>
        <CustomerProfileLink
          customerName={s.customerName}
          customerPhone={s.customerPhone}
          className="mt-0.5 inline-flex text-[10px]"
        />
      </td>
      <td className="px-2 py-2">
        <StatusBadge variant={serviceStatusVariant(s.status)} size="table">
          {STATUS_LABELS[s.status]}
        </StatusBadge>
      </td>
      <td className="whitespace-nowrap px-2 py-2 text-slate-300">{money(s.salePrice)}</td>
      <td className="whitespace-nowrap px-2 py-2 text-emerald-300/90">{money(s.profit)}</td>
      <td className="px-2 py-2">
        <div className="flex flex-wrap justify-end gap-1">
          {s.status === "PENDING" ? (
            <>
              <button
                type="button"
                disabled={actionId === s.id}
                onClick={() => onComplete(s.id)}
                className={PRIMARY_ACTION_BUTTON_COMPACT}
              >
                Completar
              </button>
              <button
                type="button"
                disabled={actionId === s.id}
                onClick={() => onCancel(s.id)}
                className={SECONDARY_BUTTON_SM}
              >
                Cancelar
              </button>
            </>
          ) : null}
          <button
            type="button"
            disabled={actionId === s.id || pdfGeneratingId === s.id}
            onClick={() => onDownloadPdf(s)}
            className={SECONDARY_BUTTON_SM}
          >
            {pdfGeneratingId === s.id ? "PDF…" : "PDF"}
          </button>
          <Link
            to={`/services/${s.id}`}
            className={`${ORANGE_EDIT_BUTTON_SM} inline-flex items-center justify-center`}
          >
            Editar
          </Link>
          <button
            type="button"
            disabled={actionId === s.id}
            onClick={() => onDelete(s.id)}
            className={DESTRUCTIVE_BUTTON_SM}
          >
            Eliminar
          </button>
        </div>
      </td>
    </tr>
  );
}

function ServiceCard({
  s,
  actionId,
  completedActions = false,
  onDownloadPdf,
  pdfGeneratingId,
  onComplete,
  onCancel,
  onDelete
}: {
  s: ServiceRow;
  actionId: string | null;
  completedActions?: boolean;
  onDownloadPdf: (row: ServiceRow) => void;
  pdfGeneratingId: string | null;
  onComplete: (id: string) => void;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const d = new Date(s.serviceDate);
  const spareHint = spareSaleSummary(s);
  return (
    <article className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 break-words font-semibold text-slate-100">{s.title}</p>
          {spareHint ? (
            <p className="truncate text-[11px] text-slate-500" title={spareHint}>
              {spareHint}
            </p>
          ) : null}
          <p className="text-[11px] text-slate-500">{d.toLocaleDateString("es-ES")}</p>
          <p className="mt-0.5 truncate text-[11px] text-slate-400" title={SERVICE_LABELS[s.type]}>
            {SERVICE_LABELS[s.type]}
          </p>
        </div>
        <StatusBadge variant={serviceStatusVariant(s.status)} size="table">
          {STATUS_LABELS[s.status]}
        </StatusBadge>
      </div>
      <p className="truncate text-sm text-slate-300">{s.customerName}</p>
      <CustomerProfileLink
        customerName={s.customerName}
        customerPhone={s.customerPhone}
        className="mt-1 inline-flex text-xs"
      />
      <dl className="mt-3 space-y-1.5 border-t border-slate-800 pt-3 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="shrink-0 text-xs text-slate-500">Coste</dt>
          <dd className="min-w-0 text-right font-medium text-slate-300">{money(s.costPrice)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="shrink-0 text-xs text-slate-500">Venta</dt>
          <dd className="min-w-0 text-right text-base font-semibold text-emerald-300">{money(s.salePrice)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="shrink-0 text-xs text-slate-500">Beneficio</dt>
          <dd className="min-w-0 text-right text-base font-semibold text-emerald-300">{money(s.profit)}</dd>
        </div>
      </dl>
      <div className="mt-3 flex flex-col gap-2 border-t border-slate-800 pt-3">
        {s.status === "PENDING" ? (
          <>
            <button
              type="button"
              disabled={actionId === s.id}
              onClick={() => onComplete(s.id)}
              className={`${PRIMARY_ACTION_BUTTON} text-sm`}
            >
              Completar
            </button>
            <button
              type="button"
              disabled={actionId === s.id}
              onClick={() => onCancel(s.id)}
              className={`${SECONDARY_BUTTON} ${SERVICE_CARD_ACTION_TOUCH}`}
            >
              Cancelar
            </button>
          </>
        ) : null}
        <button
          type="button"
          disabled={actionId === s.id || pdfGeneratingId === s.id}
          onClick={() => onDownloadPdf(s)}
          className={`${SECONDARY_BUTTON} ${SERVICE_CARD_ACTION_TOUCH}`}
        >
          {pdfGeneratingId === s.id ? "Generando PDF…" : "Descargar PDF"}
        </button>
        <Link
          to={`/services/${s.id}`}
          className={`${ORANGE_EDIT_BUTTON_CARD} ${SERVICE_CARD_ACTION_TOUCH} inline-flex items-center justify-center`}
        >
          Editar
        </Link>
        <button
          type="button"
          disabled={actionId === s.id}
          onClick={() => onDelete(s.id)}
          className={`${DESTRUCTIVE_BUTTON_SM} ${SERVICE_CARD_ACTION_TOUCH}`}
        >
          Eliminar
        </button>
      </div>
    </article>
  );
}
