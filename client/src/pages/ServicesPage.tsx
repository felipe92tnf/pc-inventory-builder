import { useEffect, useMemo, useState, type FormEvent } from "react";
import * as servicesApi from "../api/services";
import { useParts } from "../hooks/useParts";
import { useServices } from "../hooks/useServices";
import type { CreateServicePayload, ServiceRow, ServiceStatus, ServiceType } from "../types/service";
import { isPartPiece } from "../types/part";
import { SERVICE_TYPES, SERVICE_STATUSES } from "../types/service";

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

function ChevronDown({ open }: { open: boolean }) {
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

  const [mobileFormOpen, setMobileFormOpen] = useState(false);

  const [formType, setFormType] = useState<ServiceType>("DIAGNOSTIC");
  const [title, setTitle] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
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
    const manual =
      typeof salePrice === "number" && !Number.isNaN(salePrice) ? salePrice : null;
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
    setCustomerEmail("");
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

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const base: CreateServicePayload = {
      type: formType,
      title: title.trim(),
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail.trim() || null,
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
    setMobileFormOpen(false);
    void servicesApi.getMonthlyServicesSummary().then(setMonthlyRows).catch(() => {});
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

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-2 pb-10 text-slate-100 md:px-4">
      <section className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 shadow-[0_20px_50px_-24px_rgba(79,70,229,0.75)]">
        <h1 className="text-2xl font-bold">Servicios</h1>
        <p className="mt-2 text-sm text-slate-300">
          Venta de piezas sueltas y servicios tecnicos: limpieza, formateo, diagnostico y mas.
        </p>
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

      {/* Resumen */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/40">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ingresos (mes)</p>
          <p className="mt-1 text-xl font-bold text-emerald-300">{money(displayRevenue)}</p>
          <p className="mt-1 text-xs text-slate-500">
            {showGlobalMonthly ? "Todos los tipos (API mensual)" : "Lista filtrada"}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/40">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Beneficio (mes)</p>
          <p className="mt-1 text-xl font-bold text-cyan-300">{money(displayProfit)}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/40">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Completados</p>
          <p className="mt-1 text-xl font-bold text-slate-100">{displayCompleted}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/40">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pendientes</p>
          <p className="mt-1 text-xl font-bold text-amber-300">{statsFromList.pendingCount}</p>
        </div>
      </section>

      {/* Formulario */}
      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-lg shadow-slate-950/40 md:border-slate-800 md:bg-slate-900/80">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 border-b border-slate-800 px-4 py-3.5 text-left md:hidden"
          onClick={() => setMobileFormOpen((v) => !v)}
          aria-expanded={mobileFormOpen}
        >
          <span className="text-sm font-semibold">Nuevo servicio</span>
          <ChevronDown open={mobileFormOpen} />
        </button>
        <div className={mobileFormOpen ? "block md:block" : "hidden md:block"}>
          <form
            onSubmit={(e) => void handleSubmit(e)}
            className="grid grid-cols-1 gap-4 p-4 pt-3 md:grid-cols-2 md:p-6 md:pt-5"
          >
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
              Email (opcional)
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
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
                  <span className="text-xs font-normal text-slate-500">
                    Lo que cobras por esta venta (sin contar el suplemento de domicilio abajo).
                  </span>
                </label>
                {sparePreview && sparePreview.sale !== null ? (
                  <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/30 p-3 text-sm md:col-span-2">
                    <p className="font-semibold text-indigo-200">Vista previa (se guardara asi)</p>
                    <p className="mt-1 text-slate-300">
                      Coste total {money(sparePreview.cost)} · Venta total {money(sparePreview.sale)} · Beneficio{" "}
                      {money(sparePreview.profit ?? 0)}
                    </p>
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
                  <span className="text-xs font-normal text-slate-500">
                    Se suma al precio de venta (pieza suelta o trabajo segun tipo).
                  </span>
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

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Guardando..." : "Registrar servicio"}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Filtros */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg md:p-5">
        <h2 className="mb-3 text-lg font-semibold text-slate-100">Filtros</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
            Mes
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(Number(e.target.value))}
              className="min-h-[42px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring"
            >
              {months.map(([num, label]) => (
                <option key={num} value={num}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
            Ano
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(Number(e.target.value))}
              className="min-h-[42px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
            Tipo
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as ServiceType | "ALL")}
              className="min-h-[42px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring"
            >
              <option value="ALL">Todos</option>
              {SERVICE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {SERVICE_LABELS[t]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
            Estado
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as ServiceStatus | "ALL")}
              className="min-h-[42px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring"
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
      </section>

      {/* Listado */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-100">Servicios registrados</h2>
        {loading ? (
          <p className="text-sm text-slate-400">Cargando...</p>
        ) : services.length === 0 ? (
          <p className="text-sm text-slate-400">No hay servicios en este periodo.</p>
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-lg md:block">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm text-slate-200">
                  <thead className="bg-slate-950/70 text-xs uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3">Titulo</th>
                      <th className="px-4 py-3">Tipo</th>
                      <th className="px-4 py-3">Cliente</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3">Venta</th>
                      <th className="px-4 py-3">Beneficio</th>
                      <th className="px-4 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {services.map((s) => (
                      <ServiceTableRow
                        key={s.id}
                        s={s}
                        actionId={actionId}
                        onComplete={(id) => {
                          void completeService(id);
                          void servicesApi.getMonthlyServicesSummary().then(setMonthlyRows).catch(() => {});
                        }}
                        onCancel={(id) => {
                          void patchService(id, { status: "CANCELLED" });
                          void servicesApi.getMonthlyServicesSummary().then(setMonthlyRows).catch(() => {});
                        }}
                        onDelete={(id) => {
                          if (window.confirm("Eliminar este servicio?")) {
                            void deleteService(id);
                            void servicesApi.getMonthlyServicesSummary().then(setMonthlyRows).catch(() => {});
                          }
                        }}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-3 md:hidden">
              {services.map((s) => (
                <ServiceCard
                  key={s.id}
                  s={s}
                  actionId={actionId}
                  onComplete={(id) => {
                    void completeService(id);
                    void servicesApi.getMonthlyServicesSummary().then(setMonthlyRows).catch(() => {});
                  }}
                  onCancel={(id) => {
                    void patchService(id, { status: "CANCELLED" });
                    void servicesApi.getMonthlyServicesSummary().then(setMonthlyRows).catch(() => {});
                  }}
                  onDelete={(id) => {
                    if (window.confirm("Eliminar este servicio?")) {
                      void deleteService(id);
                      void servicesApi.getMonthlyServicesSummary().then(setMonthlyRows).catch(() => {});
                    }
                  }}
                />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
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
      <td className="whitespace-nowrap px-4 py-3 text-slate-400">{dateStr}</td>
      <td className="max-w-[180px] px-4 py-3 font-medium text-slate-100">{s.title}</td>
      <td className="px-4 py-3 text-xs text-slate-400">{SERVICE_LABELS[s.type]}</td>
      <td className="max-w-[140px] px-4 py-3 text-slate-300">{s.customerName}</td>
      <td className="px-4 py-3">
        <span
          className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${
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
      <td className="px-4 py-3 text-slate-300">{money(s.salePrice)}</td>
      <td className="px-4 py-3 text-emerald-300/90">{money(s.profit)}</td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap justify-end gap-2">
          {s.status === "PENDING" ? (
            <>
              <button
                type="button"
                disabled={actionId === s.id}
                onClick={() => onComplete(s.id)}
                className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-50"
              >
                Completar
              </button>
              <button
                type="button"
                disabled={actionId === s.id}
                onClick={() => onCancel(s.id)}
                className="rounded-lg border border-slate-600 bg-slate-800 px-2 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-700 disabled:opacity-50"
              >
                Cancelar
              </button>
            </>
          ) : null}
          <button
            type="button"
            disabled={actionId === s.id}
            onClick={() => onDelete(s.id)}
            className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-2 py-1 text-xs font-semibold text-rose-200 hover:bg-rose-500/20 disabled:opacity-50"
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
    <article className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-slate-100">{s.title}</p>
          <p className="text-xs text-slate-500">{d.toLocaleDateString("es-ES")}</p>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold ${
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
      <p className="mt-2 text-sm text-slate-400">{SERVICE_LABELS[s.type]}</p>
      <p className="text-sm text-slate-300">{s.customerName}</p>
      <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-800 pt-3 text-sm">
        <div>
          <dt className="text-xs text-slate-500">Venta</dt>
          <dd className="font-medium text-slate-200">{money(s.salePrice)}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Beneficio</dt>
          <dd className="font-medium text-emerald-300">{money(s.profit)}</dd>
        </div>
      </dl>
      <div className="mt-3 flex flex-wrap gap-2">
        {s.status === "PENDING" ? (
          <>
            <button
              type="button"
              disabled={actionId === s.id}
              onClick={() => onComplete(s.id)}
              className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-200 disabled:opacity-50"
            >
              Completar
            </button>
            <button
              type="button"
              disabled={actionId === s.id}
              onClick={() => onCancel(s.id)}
              className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 disabled:opacity-50"
            >
              Cancelar servicio
            </button>
          </>
        ) : null}
        <button
          type="button"
          disabled={actionId === s.id}
          onClick={() => onDelete(s.id)}
          className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-200 disabled:opacity-50"
        >
          Eliminar
        </button>
      </div>
    </article>
  );
}
