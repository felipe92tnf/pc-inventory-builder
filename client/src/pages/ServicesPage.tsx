import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import * as servicesApi from "../api/services";
import { useParts } from "../hooks/useParts";
import { useServices } from "../hooks/useServices";
import type { CreateServicePayload, ServiceRow, ServiceStatus, ServiceType } from "../types/service";
import { isPartPiece } from "../types/part";
import { SERVICE_TYPES, SERVICE_STATUSES } from "../types/service";
import {
  PRIMARY_ACTION_BUTTON,
  PRIMARY_ACTION_BUTTON_COMPACT,
  SECONDARY_BUTTON_SM,
  FILTER_TOGGLE_ROW,
  DESTRUCTIVE_BUTTON_SM
} from "../theme/actionButtons";
import {
  SUMMARY_CARD_GRID,
  SUMMARY_CARD_LABEL,
  SUMMARY_CARD_SHELL,
  SUMMARY_VALUE_NEGATIVE,
  SUMMARY_VALUE_NEUTRAL,
  SUMMARY_VALUE_PROFIT_CYAN,
  SUMMARY_VALUE_REVENUE
} from "../theme/summaryCards";

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

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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

export function ServicesPage() {
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
    submitting,
    actionId,
    reload,
    createService,
    patchService,
    deleteService,
    completeService
  } = useServices(filterMonth, filterYear, typeParam, statusParam);

  const { parts } = useParts();

  const partsForSpare = useMemo(
    () => parts.filter((p) => isPartPiece(p) && p.stock > 0),
    [parts]
  );

  const [monthlyRows, setMonthlyRows] = useState<Awaited<ReturnType<typeof servicesApi.getMonthlyServicesSummary>>>(
    []
  );

  useEffect(() => {
    void servicesApi.getMonthlyServicesSummary().then(setMonthlyRows).catch(() => setMonthlyRows([]));
  }, []);

  const summaryBucket = useMemo(() => {
    return monthlyRows.find((r) => r.month === filterMonth && r.year === filterYear);
  }, [monthlyRows, filterMonth, filterYear]);

  const statsFromList = useMemo(() => {
    const completed = services.filter((s) => s.status === "COMPLETED");
    const pending = services.filter((s) => s.status === "PENDING");
    const revenue = completed.reduce((a, s) => a + s.salePrice, 0);
    const profit = completed.reduce((a, s) => a + s.profit, 0);
    return {
      revenue,
      profit,
      completedCount: completed.length,
      pendingCount: pending.length
    };
  }, [services]);

  const showGlobalMonthly =
    filterType === "ALL" && filterStatus === "ALL" && summaryBucket !== undefined;

  const displayRevenue = showGlobalMonthly ? summaryBucket.totalRevenue : statsFromList.revenue;
  const displayProfit = showGlobalMonthly ? summaryBucket.totalProfit : statsFromList.profit;
  const displayCompleted = showGlobalMonthly ? summaryBucket.servicesCount : statsFromList.completedCount;

  const refreshMonthlySummary = () => {
    void servicesApi.getMonthlyServicesSummary().then(setMonthlyRows).catch(() => {});
  };

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [openPending, setOpenPending] = useState(true);
  const [openCompleted, setOpenCompleted] = useState(false);
  const [openCancelled, setOpenCancelled] = useState(false);

  const [formType, setFormType] = useState<ServiceType>("DIAGNOSTIC");
  const [title, setTitle] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPartId, setSelectedPartId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [costPrice, setCostPrice] = useState<number | "">("");
  const [salePrice, setSalePrice] = useState<number | "">("");
  const [isHomeService, setIsHomeService] = useState(false);
  const [homeServiceAddress, setHomeServiceAddress] = useState("");
  const [homeServiceSupplement, setHomeServiceSupplement] = useState<number | "">("");
  const [serviceDate, setServiceDate] = useState(toIsoDate(new Date()));
  const [paymentMethod, setPaymentMethod] = useState("");
  const [notes, setNotes] = useState("");

  const selectedPart = useMemo(
    () => parts.find((p) => p.id === selectedPartId),
    [parts, selectedPartId]
  );

  const sparePreview = useMemo(() => {
    if (formType !== "SPARE_PART_SALE" || !selectedPart || !quantity || quantity < 1) {
      return null;
    }
    const sup = typeof homeServiceSupplement === "number" ? homeServiceSupplement : 0;
    const cost = Number(selectedPart.costPrice) * quantity;
    const manual = typeof salePrice === "number" && !Number.isNaN(salePrice) ? salePrice : null;
    if (manual === null) {
      return { cost, sale: null as number | null, profit: null as number | null };
    }
    const sale = manual + sup;
    return { cost, sale, profit: sale - cost };
  }, [formType, selectedPart, quantity, homeServiceSupplement, salePrice]);

  const resetForm = () => {
    setFormType("DIAGNOSTIC");
    setTitle("");
    setCustomerName("");
    setCustomerPhone("");
    setDescription("");
    setSelectedPartId("");
    setQuantity(1);
    setCostPrice("");
    setSalePrice("");
    setIsHomeService(false);
    setHomeServiceAddress("");
    setHomeServiceSupplement("");
    setServiceDate(toIsoDate(new Date()));
    setPaymentMethod("");
    setNotes("");
  };

  const closeModal = () => {
    setCreateModalOpen(false);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const base: CreateServicePayload = {
      type: formType,
      title: title.trim(),
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      description: description.trim(),
      isHomeService,
      homeServiceAddress: isHomeService ? homeServiceAddress.trim() || null : null,
      homeServiceSupplement:
        typeof homeServiceSupplement === "number" && homeServiceSupplement > 0
          ? homeServiceSupplement
          : null,
      serviceDate: new Date(serviceDate).toISOString(),
      paymentMethod: paymentMethod.trim() || null,
      notes: notes.trim() || null
    };

    try {
      if (formType === "SPARE_PART_SALE") {
        if (!selectedPartId) {
          window.alert("Selecciona una pieza.");
          return;
        }
        const manualSale = typeof salePrice === "number" ? salePrice : NaN;
        if (!Number.isFinite(manualSale) || manualSale < 0) {
          window.alert("Indica el precio de venta (puede ser 0).");
          return;
        }
        await createService({
          ...base,
          selectedPartId,
          quantity,
          salePrice: manualSale
        });
      } else {
        const c = typeof costPrice === "number" ? costPrice : 0;
        const s = typeof salePrice === "number" ? salePrice : 0;
        await createService({
          ...base,
          costPrice: c,
          salePrice: s,
          selectedPartId: null,
          quantity: null
        });
      }
      resetForm();
      closeModal();
      refreshMonthlySummary();
    } catch {
      /* error en estado del hook */
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
      refreshMonthlySummary();
    },
    onCancel: (id: string) => {
      void patchService(id, { status: "CANCELLED" });
      refreshMonthlySummary();
    },
    onDelete: (id: string) => {
      if (window.confirm("Eliminar este servicio?")) {
        void deleteService(id);
        refreshMonthlySummary();
      }
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 px-2 pb-10 text-slate-100 md:space-y-6 md:px-4">
      <section className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-5 shadow-[0_20px_50px_-24px_rgba(79,70,229,0.75)] md:flex-row md:items-start md:justify-between md:p-6">
        <h1 className="text-3xl font-bold tracking-tight">Servicios</h1>
        <button type="button" onClick={() => setCreateModalOpen(true)} className={PRIMARY_ACTION_BUTTON}>
          Nuevo servicio
        </button>
      </section>

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

      {/* Resumen compacto */}
      <section className={SUMMARY_CARD_GRID}>
        <div className={SUMMARY_CARD_SHELL}>
          <p className={SUMMARY_CARD_LABEL}>Ingresos</p>
          <p className={SUMMARY_VALUE_REVENUE}>{money(displayRevenue)}</p>
        </div>
        <div className={SUMMARY_CARD_SHELL}>
          <p className={SUMMARY_CARD_LABEL}>Beneficio</p>
          <p className={displayProfit >= 0 ? SUMMARY_VALUE_PROFIT_CYAN : SUMMARY_VALUE_NEGATIVE}>
            {money(displayProfit)}
          </p>
        </div>
        <div className={SUMMARY_CARD_SHELL}>
          <p className={SUMMARY_CARD_LABEL}>Completados</p>
          <p className={SUMMARY_VALUE_NEUTRAL}>{displayCompleted}</p>
        </div>
        <div className={SUMMARY_CARD_SHELL}>
          <p className={SUMMARY_CARD_LABEL}>Pendientes</p>
          <p className={SUMMARY_VALUE_NEUTRAL}>{statsFromList.pendingCount}</p>
        </div>
      </section>

      {/* Filtros colapsables */}
      <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 shadow-inner shadow-black/20">
        <button
          type="button"
          className={FILTER_TOGGLE_ROW}
          onClick={() => setFiltersOpen((v) => !v)}
          aria-expanded={filtersOpen}
        >
          <span>Filtros</span>
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
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-200">Servicios registrados</h2>

        {loading ? (
          <p className="text-sm text-slate-400">Cargando...</p>
        ) : services.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-700 bg-slate-950/40 px-4 py-8 text-center text-sm text-slate-500">
            No hay servicios en este periodo con los filtros actuales.
          </p>
        ) : (
          <div className="space-y-2">
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

      {/* Modal nuevo servicio */}
      {createModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="service-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            className="flex max-h-[92vh] w-full max-w-2xl flex-col rounded-t-2xl border border-slate-700 bg-slate-900 shadow-2xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-800 px-4 py-4 sm:px-6">
              <div>
                <h2 id="service-modal-title" className="text-xl font-semibold text-slate-100">
                  Nuevo servicio
                </h2>
              </div>
              <button type="button" onClick={closeModal} className={SECONDARY_BUTTON_SM}>
                Cerrar
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-2 sm:px-6">
              <form onSubmit={(e) => void handleSubmit(e)} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-2">
                  Tipo
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as ServiceType)}
                    className="min-h-[42px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring"
                  >
                    {SERVICE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {SERVICE_LABELS[t]}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-2">
                  Titulo
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring"
                    placeholder="Ej: Revision torre cliente Juan"
                  />
                </label>

                <label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
                  Cliente
                  <input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                    className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
                  Telefono
                  <input
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    required
                    className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring"
                  />
                </label>

                <label className="flex flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-2">
                  Descripcion
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring"
                  />
                </label>

                {formType === "SPARE_PART_SALE" ? (
                  <>
                    <label className="flex flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-2">
                      Pieza (stock disponible)
                      <select
                        value={selectedPartId}
                        onChange={(e) => setSelectedPartId(e.target.value)}
                        required
                        className="min-h-[42px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring"
                      >
                        <option value="">Seleccionar...</option>
                        {partsForSpare.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} — stock {p.stock}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
                      Cantidad
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        required
                        className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring"
                      />
                    </label>
                    {selectedPart && quantity >= 1 ? (
                      <div className="rounded-lg border border-slate-700 bg-slate-950/50 px-3 py-2 text-sm md:col-span-2">
                        <p className="text-xs uppercase tracking-wide text-slate-500">Coste desde inventario</p>
                        <p className="mt-0.5 font-medium text-slate-200">
                          {money(Number(selectedPart.costPrice) * quantity)} (
                          {money(Number(selectedPart.costPrice))} × {quantity})
                        </p>
                      </div>
                    ) : null}
                    <label className="flex flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-2">
                      Precio de venta (total piezas)
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={salePrice === "" ? "" : salePrice}
                        onChange={(e) =>
                          setSalePrice(e.target.value === "" ? "" : Number(e.target.value))
                        }
                        required
                        className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring"
                      />
                    </label>
                    {sparePreview && sparePreview.sale !== null ? (
                      <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/30 p-4 text-sm md:col-span-2">
                        <p className="text-xs uppercase tracking-wide text-slate-500">Venta total</p>
                        <p className="mt-1 text-lg font-semibold text-emerald-300">{money(sparePreview.sale)}</p>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <>
                    <label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
                      Precio coste
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={costPrice === "" ? "" : costPrice}
                        onChange={(e) =>
                          setCostPrice(e.target.value === "" ? "" : Number(e.target.value))
                        }
                        required
                        className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
                      Precio venta (trabajo)
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={salePrice === "" ? "" : salePrice}
                        onChange={(e) =>
                          setSalePrice(e.target.value === "" ? "" : Number(e.target.value))
                        }
                        required
                        className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring"
                      />
                    </label>
                  </>
                )}

                <label className="flex items-center gap-2 text-sm font-medium text-slate-200 md:col-span-2">
                  <input
                    type="checkbox"
                    checked={isHomeService}
                    onChange={(e) => setIsHomeService(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-600 bg-slate-950 text-indigo-500"
                  />
                  Servicio a domicilio
                </label>

                {isHomeService ? (
                  <>
                    <label className="flex flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-2">
                      Direccion
                      <input
                        value={homeServiceAddress}
                        onChange={(e) => setHomeServiceAddress(e.target.value)}
                        className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring"
                        placeholder="Calle, ciudad..."
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-2">
                      Suplemento domicilio (opcional, EUR)
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={homeServiceSupplement === "" ? "" : homeServiceSupplement}
                        onChange={(e) =>
                          setHomeServiceSupplement(e.target.value === "" ? "" : Number(e.target.value))
                        }
                        className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring"
                      />
                    </label>
                  </>
                ) : null}

                <label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
                  Fecha del servicio
                  <input
                    type="date"
                    value={serviceDate}
                    onChange={(e) => setServiceDate(e.target.value)}
                    required
                    className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring"
                  />
                </label>

                <label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
                  Forma de pago (opcional)
                  <input
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring"
                    placeholder="Efectivo, Bizum..."
                  />
                </label>

                <label className="flex flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-2">
                  Notas internas
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring"
                  />
                </label>

                <div className="flex flex-wrap gap-2 md:col-span-2">
                  <button type="submit" disabled={submitting} className={PRIMARY_ACTION_BUTTON}>
                    {submitting ? "Guardando..." : "Registrar servicio"}
                  </button>
                  <button type="button" onClick={closeModal} className={SECONDARY_BUTTON_SM}>
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}
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
  const toneBorder =
    tone === "amber"
      ? "border-amber-500/25"
      : tone === "emerald"
        ? "border-emerald-500/25"
        : "border-slate-600/80";
  const toneBadge =
    tone === "amber"
      ? "bg-amber-500/15 text-amber-200 border-amber-500/30"
      : tone === "emerald"
        ? "bg-emerald-500/15 text-emerald-200 border-emerald-500/30"
        : "bg-slate-800 text-slate-300 border-slate-600";

  return (
    <div className={`rounded-xl border ${toneBorder} bg-slate-950/40`}>
      <button
        type="button"
        className="flex w-full flex-wrap items-center justify-between gap-2 px-3 py-3 text-left sm:px-4"
        onClick={onToggle}
        aria-expanded={open}
      >
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:gap-3">
          <span className="text-lg font-semibold text-slate-100">{title}</span>
          <span
            className={`inline-flex shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${toneBadge}`}
          >
            {stats.count}
          </span>
        </div>
        <ChevronDown open={open} />
      </button>
      {open ? (
        <div className="border-t border-slate-800/90 px-3 pb-3 pt-1 sm:px-4">
          {stats.count === 0 ? (
            <p className="py-3 text-sm text-slate-500">{emptyHint}</p>
          ) : (
            children
          )}
        </div>
      ) : null}
    </div>
  );
}

function CompletedSubsection({
  label,
  accent,
  rows,
  actionId,
  onComplete,
  onCancel,
  onDelete
}: {
  label: string;
  accent: string;
  rows: ServiceRow[];
  actionId: string | null;
  onComplete: (id: string) => void;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const st = aggregateStats(rows);
  return (
    <div className={`rounded-lg border ${accent} p-4`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">{label}</h3>
        <span className="rounded-full border border-slate-600 bg-slate-900/80 px-2 py-0.5 text-xs font-semibold text-slate-300">
          {st.count}
        </span>
      </div>
      <ServiceListSection rows={rows} actionId={actionId} onComplete={onComplete} onCancel={onCancel} onDelete={onDelete} />
    </div>
  );
}

function ServiceListSection({
  rows,
  actionId,
  onComplete,
  onCancel,
  onDelete
}: {
  rows: ServiceRow[];
  actionId: string | null;
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
  onComplete,
  onCancel,
  onDelete
}: {
  s: ServiceRow;
  actionId: string | null;
  onComplete: (id: string) => void;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const d = new Date(s.serviceDate);
  const dateStr = d.toLocaleDateString("es-ES");
  return (
    <tr className="transition hover:bg-slate-800/40">
      <td className="whitespace-nowrap px-2 py-2 text-slate-400">{dateStr}</td>
      <td className="max-w-[140px] truncate px-2 py-2 font-medium text-slate-100" title={s.title}>
        {s.title}
      </td>
      <td className="max-w-[100px] truncate px-2 py-2 text-[11px] text-slate-400" title={SERVICE_LABELS[s.type]}>
        {SERVICE_LABELS[s.type]}
      </td>
      <td className="max-w-[100px] truncate px-2 py-2 text-slate-300" title={s.customerName}>
        {s.customerName}
      </td>
      <td className="px-2 py-2">
        <span
          className={`rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${
            s.status === "COMPLETED"
              ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
              : s.status === "PENDING"
                ? "border-amber-500/40 bg-amber-500/15 text-amber-300"
                : "border-slate-600 bg-slate-800 text-slate-400"
          }`}
        >
          {STATUS_LABELS[s.status]}
        </span>
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
  onComplete,
  onCancel,
  onDelete
}: {
  s: ServiceRow;
  actionId: string | null;
  onComplete: (id: string) => void;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const d = new Date(s.serviceDate);
  return (
    <article className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-100">{s.title}</p>
          <p className="text-[11px] text-slate-500">{d.toLocaleDateString("es-ES")}</p>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
            s.status === "COMPLETED"
              ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
              : s.status === "PENDING"
                ? "border-amber-500/40 bg-amber-500/15 text-amber-300"
                : "border-slate-600 bg-slate-800 text-slate-400"
          }`}
        >
          {STATUS_LABELS[s.status]}
        </span>
      </div>
      <p className="truncate text-sm text-slate-300">{s.customerName}</p>
      <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-800 pt-3 text-sm">
        <div>
          <dt className="text-xs text-slate-500">Venta</dt>
          <dd className="text-base font-semibold text-slate-200">{money(s.salePrice)}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Beneficio</dt>
          <dd className="text-base font-semibold text-emerald-300">{money(s.profit)}</dd>
        </div>
      </dl>
      <div className="mt-2 flex flex-wrap gap-2">
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
          disabled={actionId === s.id}
          onClick={() => onDelete(s.id)}
          className={DESTRUCTIVE_BUTTON_SM}
        >
          Eliminar
        </button>
      </div>
    </article>
  );
}
