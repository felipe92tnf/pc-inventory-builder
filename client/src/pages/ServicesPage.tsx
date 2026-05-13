import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useParts } from "../hooks/useParts";
import { useServices } from "../hooks/useServices";
import type {
  CreateServicePayload,
  PatchServicePayload,
  ServiceRow,
  ServiceStatus,
  ServiceType
} from "../types/service";
import { isPartPiece, PART_CATEGORIES, partCategoryLabel, type PartCategory } from "../types/part";
import { SERVICE_TYPES, SERVICE_STATUSES } from "../types/service";
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

type SpareLineDraft = { partId: string; quantity: number };

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

  /** Piezas con stock para venta suelta, agrupadas por categoría (orden fijo) y nombre dentro de cada grupo */
  const sparePartsByCategory = useMemo(() => {
    const byCat = new Map<PartCategory, typeof partsForSpare>();
    for (const p of partsForSpare) {
      const cat = (p.category ?? "OTHER") as PartCategory;
      const list = byCat.get(cat);
      if (list) list.push(p);
      else byCat.set(cat, [p]);
    }
    for (const list of byCat.values()) {
      list.sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" }));
    }
    return PART_CATEGORIES.filter((c) => byCat.has(c)).map((category) => ({
      category,
      label: partCategoryLabel(category),
      parts: byCat.get(category)!
    }));
  }, [partsForSpare]);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceRow | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [openPending, setOpenPending] = useState(true);
  const [openCompleted, setOpenCompleted] = useState(false);
  const [openCancelled, setOpenCancelled] = useState(false);

  const [formType, setFormType] = useState<ServiceType>("DIAGNOSTIC");
  const [title, setTitle] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [description, setDescription] = useState("");
  const [spareLines, setSpareLines] = useState<SpareLineDraft[]>([{ partId: "", quantity: 1 }]);
  const [costPrice, setCostPrice] = useState<number | "">("");
  const [salePrice, setSalePrice] = useState<number | "">("");
  const [isHomeService, setIsHomeService] = useState(false);
  const [homeServiceAddress, setHomeServiceAddress] = useState("");
  const [homeServiceSupplement, setHomeServiceSupplement] = useState<number | "">("");
  const [serviceDate, setServiceDate] = useState(toIsoDate(new Date()));
  const [paymentMethod, setPaymentMethod] = useState("");
  const [notes, setNotes] = useState("");

  const spareInventoryCost = useMemo(() => {
    if (formType !== "SPARE_PART_SALE") return null;
    let cost = 0;
    let anyLine = false;
    for (const line of spareLines) {
      if (!line.partId || line.quantity < 1) continue;
      const p = parts.find((x) => x.id === line.partId);
      if (!p) continue;
      anyLine = true;
      cost += Number(p.costPrice) * line.quantity;
    }
    return anyLine ? cost : null;
  }, [formType, spareLines, parts]);

  const sparePreview = useMemo(() => {
    if (formType !== "SPARE_PART_SALE" || spareInventoryCost === null) {
      return null;
    }
    const sup = typeof homeServiceSupplement === "number" ? homeServiceSupplement : 0;
    const manual = typeof salePrice === "number" && !Number.isNaN(salePrice) ? salePrice : null;
    if (manual === null) {
      return {
        cost: spareInventoryCost,
        sale: null as number | null,
        profit: null as number | null
      };
    }
    const sale = manual + sup;
    return { cost: spareInventoryCost, sale, profit: sale - spareInventoryCost };
  }, [formType, spareInventoryCost, homeServiceSupplement, salePrice]);

  const resetForm = () => {
    setFormType("DIAGNOSTIC");
    setTitle("");
    setCustomerName("");
    setCustomerPhone("");
    setDescription("");
    setSpareLines([{ partId: "", quantity: 1 }]);
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
    setEditingService(null);
  };

  const openCreateModal = () => {
    resetForm();
    setEditingService(null);
    setCreateModalOpen(true);
  };

  const updateSpareLine = (index: number, patch: Partial<SpareLineDraft>) => {
    setSpareLines((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const addSpareLine = () => {
    setSpareLines((prev) => [...prev, { partId: "", quantity: 1 }]);
  };

  const removeSpareLine = (index: number) => {
    setSpareLines((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
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
        const lines = spareLines
          .filter((l) => l.partId.trim() !== "" && l.quantity >= 1)
          .map((l) => ({ partId: l.partId.trim(), quantity: l.quantity }));
        if (lines.length === 0) {
          window.alert("Añade al menos una pieza con cantidad.");
          return;
        }
        const manualSale = typeof salePrice === "number" ? salePrice : NaN;
        if (!Number.isFinite(manualSale) || manualSale < 0) {
          window.alert("Indica el precio de venta (puede ser 0).");
          return;
        }
        await createService({
          ...base,
          sparePartLines: lines,
          salePrice: manualSale,
          selectedPartId: null,
          quantity: null
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
    } catch {
      /* error en estado del hook */
    }
  };

  const openEditService = (s: ServiceRow) => {
    setCreateModalOpen(false);
    setFormType(s.type);
    setTitle(s.title);
    setCustomerName(s.customerName);
    setCustomerPhone(s.customerPhone);
    setDescription(s.description ?? "");
    const sup = Number(s.homeServiceSupplement ?? 0);
    setHomeServiceSupplement(s.homeServiceSupplement != null && sup > 0 ? sup : "");
    setIsHomeService(s.isHomeService);
    setHomeServiceAddress(s.homeServiceAddress ?? "");
    setServiceDate(toIsoDate(new Date(s.serviceDate)));
    setPaymentMethod(s.paymentMethod ?? "");
    setNotes(s.notes ?? "");
    if (s.type === "SPARE_PART_SALE") {
      if (s.sparePartLines && s.sparePartLines.length > 0) {
        setSpareLines(s.sparePartLines.map((l) => ({ partId: l.partId, quantity: l.quantity })));
      } else if (s.selectedPartId && s.quantity) {
        setSpareLines([{ partId: s.selectedPartId, quantity: s.quantity }]);
      } else {
        setSpareLines([{ partId: "", quantity: 1 }]);
      }
      setCostPrice(Number(s.costPrice));
      setSalePrice(Number(s.salePrice) - sup);
    } else {
      setSpareLines([{ partId: "", quantity: 1 }]);
      setCostPrice(Number(s.costPrice));
      setSalePrice(Number(s.salePrice) - sup);
    }
    setEditingService(s);
  };

  const handleEditSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const svc = editingService;
    if (!svc) return;

    const base: PatchServicePayload = {
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
      if (svc.type === "SPARE_PART_SALE") {
        const manualSale = typeof salePrice === "number" ? salePrice : NaN;
        if (!Number.isFinite(manualSale) || manualSale < 0) {
          window.alert("Indica el precio de venta (puede ser 0).");
          return;
        }
        const c = typeof costPrice === "number" ? costPrice : NaN;
        if (!Number.isFinite(c) || c < 0) {
          window.alert("Indica el coste (puede ser 0).");
          return;
        }
        await patchService(svc.id, {
          ...base,
          salePrice: manualSale,
          costPrice: c
        });
      } else {
        const c = typeof costPrice === "number" ? costPrice : 0;
        const s = typeof salePrice === "number" ? salePrice : 0;
        await patchService(svc.id, {
          ...base,
          costPrice: c,
          salePrice: s
        });
      }
      resetForm();
      closeModal();
    } catch {
      /* error en estado del hook */
    }
  };

  const handleDeleteFromEdit = async () => {
    const svc = editingService;
    if (!svc) return;
    if (!window.confirm("Eliminar este servicio? Esta accion no se puede deshacer.")) return;
    try {
      await deleteService(svc.id);
      resetForm();
      closeModal();
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
    },
    onCancel: (id: string) => {
      void patchService(id, { status: "CANCELLED" });
    },
    onDelete: (id: string) => {
      if (window.confirm("Eliminar este servicio?")) {
        void deleteService(id);
      }
    }
  };

  return (
    <div className={`${PAGE_OUTER_7XL} max-md:pb-32`}>
      <section className={`${PAGE_HERO} flex flex-col gap-3 md:flex-row md:items-start md:justify-between`}>
        <h1 className="text-3xl font-bold tracking-tight">Servicios</h1>
        <button type="button" onClick={openCreateModal} className={PRIMARY_ACTION_BUTTON_HEADER}>
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
                    onEditService={openEditService}
                    {...serviceActions}
                  />
                ) : null}
                {completedParts.technical.length > 0 ? (
                  <CompletedSubsection
                    label="Servicios técnicos"
                    accent="border-indigo-500/40 bg-indigo-500/5"
                    rows={completedParts.technical}
                    actionId={actionId}
                    onEditService={openEditService}
                    {...serviceActions}
                  />
                ) : null}
                {completedParts.home.length > 0 ? (
                  <CompletedSubsection
                    label="Servicios a domicilio"
                    accent="border-violet-500/40 bg-violet-500/5"
                    rows={completedParts.home}
                    actionId={actionId}
                    onEditService={openEditService}
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

      {/* Modal nuevo servicio / editar completado */}
      {createModalOpen || editingService ? (
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
                  {editingService ? "Editar servicio" : "Nuevo servicio"}
                </h2>
              </div>
              <button type="button" onClick={closeModal} className={SECONDARY_BUTTON_SM}>
                Cerrar
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-2 sm:px-6">
              <form
                onSubmit={(e) => void (editingService ? handleEditSubmit(e) : handleSubmit(e))}
                className="grid grid-cols-1 gap-4 md:grid-cols-2"
              >
                <label className="flex flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-2">
                  Tipo
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as ServiceType)}
                    disabled={!!editingService}
                    className="min-h-[42px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring disabled:cursor-not-allowed disabled:opacity-60"
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
                  editingService?.status === "COMPLETED" ? (
                    <>
                      <div className="space-y-2 md:col-span-2">
                        <p className="text-sm font-medium text-slate-200">Piezas vendidas</p>
                        <p className="text-xs text-slate-500">
                          No se pueden cambiar las piezas tras completar; solo datos y precios.
                        </p>
                        <ul className="space-y-1 rounded-lg border border-slate-700 bg-slate-950/40 p-3 text-sm text-slate-200">
                          {editingService.sparePartLines && editingService.sparePartLines.length > 0
                            ? editingService.sparePartLines.map((l) => (
                                <li key={l.id}>
                                  {l.part.name} × {l.quantity}
                                </li>
                              ))
                            : editingService.selectedPart ? (
                                <li>
                                  {editingService.selectedPart.name} × {editingService.quantity ?? 1}
                                </li>
                              ) : (
                                <li className="text-slate-500">—</li>
                              )}
                        </ul>
                      </div>
                      <label className="flex flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-2">
                        Coste (registrado)
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
                      <label className="flex flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-2">
                        Precio de venta (base piezas, sin suplemento domicilio)
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
                      <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/30 p-4 text-sm md:col-span-2">
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          Venta total (base + domicilio)
                        </p>
                        <p className="mt-1 text-lg font-semibold text-emerald-300">
                          {money(
                            (typeof salePrice === "number" ? salePrice : 0) +
                              (typeof homeServiceSupplement === "number" ? homeServiceSupplement : 0)
                          )}
                        </p>
                      </div>
                    </>
                  ) : (
                  <>
                    <div className="space-y-3 md:col-span-2">
                      <div className="flex flex-wrap items-end justify-between gap-2">
                        <p className="text-sm font-medium text-slate-200">Piezas (stock disponible)</p>
                        <button type="button" onClick={() => addSpareLine()} className={SECONDARY_BUTTON_SM}>
                          Añadir otra pieza
                        </button>
                      </div>
                      {spareLines.map((line, idx) => (
                        <div
                          key={idx}
                          className="flex flex-col gap-3 rounded-lg border border-slate-700 bg-slate-950/40 p-3 sm:flex-row sm:flex-wrap sm:items-end"
                        >
                          <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm font-medium text-slate-200">
                            Pieza
                            <select
                              value={line.partId}
                              onChange={(e) => updateSpareLine(idx, { partId: e.target.value })}
                              required={idx === 0}
                              className="min-h-[42px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring"
                            >
                              <option value="">Seleccionar...</option>
                              {sparePartsByCategory.map(({ category, label, parts: groupParts }) => (
                                <optgroup key={category} label={label}>
                                  {groupParts.map((p) => (
                                    <option key={p.id} value={p.id}>
                                      {p.name} — stock {p.stock}
                                    </option>
                                  ))}
                                </optgroup>
                              ))}
                            </select>
                          </label>
                          <label className="flex w-full flex-col gap-1 text-sm font-medium text-slate-200 sm:w-28">
                            Cantidad
                            <input
                              type="number"
                              min={1}
                              step={1}
                              value={line.quantity}
                              onChange={(e) =>
                                updateSpareLine(idx, { quantity: Number(e.target.value) })
                              }
                              required={idx === 0}
                              className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring"
                            />
                          </label>
                          {spareLines.length > 1 ? (
                            <button
                              type="button"
                              onClick={() => removeSpareLine(idx)}
                              className={DESTRUCTIVE_BUTTON_SM}
                            >
                              Quitar
                            </button>
                          ) : null}
                        </div>
                      ))}
                    </div>
                    {spareInventoryCost !== null ? (
                      <div className="rounded-lg border border-slate-700 bg-slate-950/50 px-3 py-2 text-sm md:col-span-2">
                        <p className="text-xs uppercase tracking-wide text-slate-500">Coste desde inventario</p>
                        <p className="mt-0.5 font-medium text-slate-200">{money(spareInventoryCost)}</p>
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
                  )
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
                  <button
                    type="submit"
                    disabled={submitting || (editingService != null && actionId === editingService.id)}
                    className={PRIMARY_ACTION_BUTTON}
                  >
                    {submitting ? "Guardando..." : editingService ? "Guardar cambios" : "Registrar servicio"}
                  </button>
                  <button type="button" onClick={closeModal} className={SECONDARY_BUTTON_SM}>
                    Cancelar
                  </button>
                  {editingService ? (
                    <button
                      type="button"
                      disabled={submitting || actionId === editingService.id}
                      onClick={() => void handleDeleteFromEdit()}
                      className={DESTRUCTIVE_BUTTON_SM}
                    >
                      Eliminar servicio
                    </button>
                  ) : null}
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}
      <div className={STICKY_PRIMARY_MOBILE_DOCK}>
        <button type="button" onClick={openCreateModal} className={PRIMARY_ACTION_BUTTON}>
          Nuevo servicio
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
  onEditService
}: {
  label: string;
  accent: string;
  rows: ServiceRow[];
  actionId: string | null;
  onComplete: (id: string) => void;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
  onEditService: (s: ServiceRow) => void;
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
        onEditService={onEditService}
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
  onEditService,
  onComplete,
  onCancel,
  onDelete
}: {
  rows: ServiceRow[];
  actionId: string | null;
  completedActions?: boolean;
  onEditService?: (s: ServiceRow) => void;
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
                  onEditService={onEditService}
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
            onEditService={onEditService}
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
  onEditService,
  onComplete,
  onCancel,
  onDelete
}: {
  s: ServiceRow;
  actionId: string | null;
  completedActions?: boolean;
  onEditService?: (row: ServiceRow) => void;
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
          {completedActions && s.status === "COMPLETED" && onEditService ? (
            <button
              type="button"
              disabled={actionId === s.id}
              onClick={() => onEditService(s)}
              className={ORANGE_EDIT_BUTTON_SM}
            >
              Editar
            </button>
          ) : (
            <button
              type="button"
              disabled={actionId === s.id}
              onClick={() => onDelete(s.id)}
              className={DESTRUCTIVE_BUTTON_SM}
            >
              Eliminar
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

function ServiceCard({
  s,
  actionId,
  completedActions = false,
  onEditService,
  onComplete,
  onCancel,
  onDelete
}: {
  s: ServiceRow;
  actionId: string | null;
  completedActions?: boolean;
  onEditService?: (row: ServiceRow) => void;
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
        {completedActions && s.status === "COMPLETED" && onEditService ? (
          <button
            type="button"
            disabled={actionId === s.id}
            onClick={() => onEditService(s)}
            className={ORANGE_EDIT_BUTTON_CARD}
          >
            Editar
          </button>
        ) : (
          <button
            type="button"
            disabled={actionId === s.id}
            onClick={() => onDelete(s.id)}
            className={`${DESTRUCTIVE_BUTTON_SM} ${SERVICE_CARD_ACTION_TOUCH}`}
          >
            Eliminar
          </button>
        )}
      </div>
    </article>
  );
}
