import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import * as extraTemplatesApi from "../api/extraTemplates";
import * as servicesApi from "../api/services";
import { useParts } from "../hooks/useParts";
import { ServiceDetailAccordion } from "../components/services/ServiceDetailAccordion";
import { ServiceConceptLinesSection } from "../components/services/ServiceConceptLinesSection";
import { ServiceSparePartsSection, type SpareLineDraft } from "../components/services/ServiceSparePartsSection";
import { CustomerPicker } from "../components/customers/CustomerPicker";
import type { CustomerFieldValue } from "../types/customer";
import type { ExtraTemplate } from "../types/extraTemplate";
import type { PatchServicePayload, ServiceRow, ServiceStatus, ServiceType } from "../types/service";
import { SERVICE_TYPES } from "../types/service";
import { isServiceCatalogCategory } from "../constants/serviceCatalog";
import {
  conceptLinesToPayload,
  linesCostTotal,
  isHomeDeliveryLine,
  linesFromService,
  linesSaleTotal,
  newConceptLine,
  templateLinesFromService
} from "../utils/serviceConceptLines";
import {
  customerFieldToForm,
  customerFieldsToApi,
  formatCustomerSubtitle
} from "../utils/customerUi";
import {
  displayServiceTitle,
  serviceTitleForApi,
  serviceTitleToForm
} from "../utils/serviceUi";
import { computeSpareSalePriceFromInventory } from "../utils/sparePartSalePrice";
import { downloadServicePdf } from "../utils/servicePdfExport";
import {
  PRIMARY_ACTION_BUTTON,
  PRIMARY_ACTION_BUTTON_COMPACT,
  SECONDARY_BUTTON_SM,
  DESTRUCTIVE_BUTTON_SM
} from "../theme/actionButtons";
import {
  SUMMARY_CARD_GRID,
  SUMMARY_CARD_LABEL,
  SUMMARY_CARD_SHELL,
  SUMMARY_VALUE_NEGATIVE,
  SUMMARY_VALUE_NEUTRAL,
  SUMMARY_VALUE_PROFIT_POS,
  SUMMARY_VALUE_REVENUE
} from "../theme/summaryCards";
import { PAGE_HEADER_COMPACT, SECTION_SHELL } from "../theme/layoutDensity";
import { StatusBadge, serviceStatusVariant } from "../components/ui/StatusBadge";

const SERVICE_PAGE_SHELL =
  "mx-auto w-full max-w-7xl space-y-3 px-2 pb-5 text-slate-100 md:space-y-3.5 md:px-4";

const SERVICE_SECTION =
  "rounded-xl border border-slate-800/90 bg-slate-900/70 p-2.5 shadow-sm shadow-slate-950/20 md:p-3";

const FIELD_LABEL = "text-xs font-medium text-slate-400";

function isSparePartSaleType(type: ServiceType): boolean {
  return type === "SPARE_PART_SALE";
}

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

const FIELD =
  "min-h-[40px] w-full rounded-lg border border-slate-700 bg-slate-950/70 px-2.5 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring";

function money(n: number): string {
  return `${n.toFixed(2)} EUR`;
}

function toIsoDateInput(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function syncFromService(service: ServiceRow) {
  const spareLines: SpareLineDraft[] =
    service.sparePartLines && service.sparePartLines.length > 0
      ? service.sparePartLines.map((l) => ({ partId: l.partId, quantity: l.quantity }))
      : service.selectedPartId && service.quantity
        ? [{ partId: service.selectedPartId, quantity: service.quantity }]
        : [{ partId: "", quantity: 1 }];

  const conceptLines = linesFromService(service);
  const manual = (service.extraLines ?? []).filter((l) => l.extraTemplateId == null);
  const conceptSale = manual.reduce((s, l) => s + Number(l.unitSalePrice) * l.quantity, 0);
  const templateSale = (service.extraLines ?? [])
    .filter((l) => l.extraTemplateId != null)
    .reduce((s, l) => s + Number(l.unitSalePrice) * l.quantity, 0);
  const legacySup = Number(service.homeServiceSupplement ?? 0);
  const spareSalePrice: number | "" =
    service.type === "SPARE_PART_SALE"
      ? Math.max(0, Math.round((Number(service.salePrice) - conceptSale - templateSale - legacySup) * 100) / 100)
      : "";

  return {
    formType: service.type,
    title: serviceTitleToForm(service.title),
    customerFields: {
      customerId: service.customerId ?? null,
      customerName: customerFieldToForm(service.customerName),
      customerPhone: customerFieldToForm(service.customerPhone),
      customerEmail: ""
    } satisfies CustomerFieldValue,
    description: service.description ?? "",
    notes: service.notes ?? "",
    serviceDate: toIsoDateInput(new Date(service.serviceDate)),
    paymentMethod: service.paymentMethod ?? "",
    status: service.status,
    isHomeService: service.isHomeService || conceptLines.some(isHomeDeliveryLine),
    homeServiceAddress: service.homeServiceAddress ?? "",
    conceptLines,
    templateLines: templateLinesFromService(service).map((l) => ({
      extraTemplateId: l.extraTemplateId!,
      quantity: l.quantity,
      unitCost: Number(l.unitCost),
      unitSalePrice: Number(l.unitSalePrice)
    })),
    spareLines,
    spareSalePrice
  };
}

export function ServiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const serviceId = String(id ?? "");

  const { parts } = useParts();
  const [service, setService] = useState<ServiceRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [servicePresets, setServicePresets] = useState<ExtraTemplate[]>([]);

  const [formType, setFormType] = useState<ServiceType>("DIAGNOSTIC");
  const [title, setTitle] = useState("");
  const [customerFields, setCustomerFields] = useState<CustomerFieldValue>({
    customerId: null,
    customerName: "",
    customerPhone: "",
    customerEmail: ""
  });
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [serviceDate, setServiceDate] = useState(toIsoDateInput(new Date()));
  const [paymentMethod, setPaymentMethod] = useState("");
  const [status, setStatus] = useState<ServiceStatus>("PENDING");
  const [isHomeService, setIsHomeService] = useState(false);
  const [homeServiceAddress, setHomeServiceAddress] = useState("");
  const [conceptLines, setConceptLines] = useState([newConceptLine()]);
  const [templateLines, setTemplateLines] = useState<PatchServicePayload["extraLines"]>([]);
  const [spareLines, setSpareLines] = useState<SpareLineDraft[]>([{ partId: "", quantity: 1 }]);
  const [spareSalePrice, setSpareSalePrice] = useState<number | "">("");

  const syncedIdRef = useRef<string | null>(null);
  const spareSalePriceManualRef = useRef(false);
  const spareLinesKeyRef = useRef("");

  const reload = useCallback(async () => {
    if (!serviceId) return;
    setLoading(true);
    setError(null);
    try {
      const row = await servicesApi.getService(serviceId);
      setService(row);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar el servicio.");
      setService(null);
    } finally {
      setLoading(false);
    }
  }, [serviceId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    let cancelled = false;
    void extraTemplatesApi.listExtraTemplates(true).then((rows) => {
      if (!cancelled) {
        setServicePresets(rows.filter((t) => t.active && isServiceCatalogCategory(t.category)));
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!service || syncedIdRef.current === service.id) return;
    syncedIdRef.current = service.id;
    const s = syncFromService(service);
    setFormType(s.formType);
    setTitle(s.title);
    setCustomerFields(s.customerFields);
    setDescription(s.description);
    setNotes(s.notes);
    setServiceDate(s.serviceDate);
    setPaymentMethod(s.paymentMethod);
    setStatus(s.status);
    setIsHomeService(s.isHomeService);
    setHomeServiceAddress(s.homeServiceAddress);
    setConceptLines(s.conceptLines);
    setTemplateLines(s.templateLines);
    setSpareLines(s.spareLines);
    setSpareSalePrice(s.spareSalePrice);
  }, [service]);

  useEffect(() => {
    if (!isSparePartSaleType(formType)) return;
    const key = spareLines.map((l) => `${l.partId}:${l.quantity}`).join("|");
    if (key !== spareLinesKeyRef.current) {
      spareLinesKeyRef.current = key;
      spareSalePriceManualRef.current = false;
    }
    if (spareSalePriceManualRef.current) return;
    setSpareSalePrice(computeSpareSalePriceFromInventory(spareLines, parts));
  }, [formType, spareLines, parts]);

  const conceptCost = useMemo(() => linesCostTotal(conceptLines), [conceptLines]);
  const conceptSale = useMemo(() => linesSaleTotal(conceptLines), [conceptLines]);
  const spareInventoryCost = useMemo(() => {
    if (formType !== "SPARE_PART_SALE") return 0;
    let cost = 0;
    for (const line of spareLines) {
      if (!line.partId || line.quantity < 1) continue;
      const p = parts.find((x) => x.id === line.partId);
      if (p) cost += Number(p.costPrice) * line.quantity;
    }
    return Math.round(cost * 100) / 100;
  }, [formType, spareLines, parts]);

  const totalCost = useMemo(() => {
    if (formType === "SPARE_PART_SALE") return Math.round((spareInventoryCost + conceptCost) * 100) / 100;
    return conceptCost;
  }, [formType, spareInventoryCost, conceptCost]);

  const totalSale = useMemo(() => {
    if (formType === "SPARE_PART_SALE") {
      const pieces = typeof spareSalePrice === "number" ? spareSalePrice : 0;
      return Math.round((pieces + conceptSale) * 100) / 100;
    }
    return conceptSale;
  }, [formType, spareSalePrice, conceptSale]);

  const profit = totalSale - totalCost;
  const conceptCount = conceptLines.filter((l) => l.name.trim()).length;

  const isCompleted = service?.status === "COMPLETED";
  const lockedSpareParts = isCompleted && service?.type === "SPARE_PART_SALE";
  const isSpareSale = isSparePartSaleType(formType);
  const fieldsLocked = isCompleted;

  const headerClient = formatCustomerSubtitle(
    customerFields.customerName,
    customerFields.customerPhone
  );

  const buildPatch = (): PatchServicePayload => {
    const customer = customerFieldsToApi(customerFields);
    if (isCompleted) {
      return {
        title: serviceTitleForApi(title),
        customerId: customer.customerId,
        customerName: customer.customerName,
        customerPhone: customer.customerPhone,
        customerEmail: customer.customerEmail,
        paymentMethod: paymentMethod.trim() || null,
        notes: notes.trim() || null
      };
    }
    const manual = conceptLinesToPayload(conceptLines);
    const patch: PatchServicePayload = {
      type: formType,
      title: serviceTitleForApi(title),
      customerId: customer.customerId,
      customerName: customer.customerName,
      customerPhone: customer.customerPhone,
      customerEmail: customer.customerEmail,
      description: description.trim(),
      isHomeService,
      homeServiceAddress: isHomeService ? homeServiceAddress.trim() || null : null,
      homeServiceSupplement: null,
      serviceDate: new Date(serviceDate).toISOString(),
      paymentMethod: paymentMethod.trim() || null,
      notes: notes.trim() || null,
      status,
      manualLines: manual,
      costPrice: totalCost
    };
    if (templateLines && templateLines.length > 0) {
      patch.extraLines = templateLines;
    }
    if (formType === "SPARE_PART_SALE") {
      const lines = spareLines
        .filter((l) => l.partId.trim() && l.quantity >= 1)
        .map((l) => ({ partId: l.partId.trim(), quantity: l.quantity }));
      patch.sparePartLines = lines;
      const pieces = typeof spareSalePrice === "number" ? spareSalePrice : 0;
      patch.salePrice = pieces;
    }
    return patch;
  };

  const handleSave = async (): Promise<boolean> => {
    if (!service) return false;
    if (!isCompleted) {
      const manual = conceptLinesToPayload(conceptLines);
      if (formType !== "SPARE_PART_SALE" && manual.length === 0 && (templateLines?.length ?? 0) === 0) {
        window.alert("Añade al menos un concepto de servicio.");
        return false;
      }
      if (formType === "SPARE_PART_SALE") {
        const lines = spareLines.filter((l) => l.partId.trim() && l.quantity >= 1);
        if (lines.length === 0) {
          window.alert("Añade al menos una pieza.");
          return false;
        }
        if (typeof spareSalePrice !== "number" || spareSalePrice < 0) {
          window.alert("Indica el precio de venta de las piezas.");
          return false;
        }
      }
    }
    setActionLoading(true);
    setError(null);
    try {
      const updated = await servicesApi.patchService(service.id, buildPatch());
      setService(updated);
      syncedIdRef.current = null;
      setSavedFlash(true);
      window.setTimeout(() => setSavedFlash(false), 2500);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar.");
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!service) return;
    const saved = await handleSave();
    if (!saved) return;
    setActionLoading(true);
    try {
      const updated = await servicesApi.completeService(service.id);
      setService(updated);
      syncedIdRef.current = null;
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo completar el servicio.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevert = async () => {
    if (!service || service.status !== "COMPLETED") return;
    const ok = window.confirm(
      "¿Seguro que quieres revertir este servicio? Se devolverá el stock y podrás editarlo de nuevo."
    );
    if (!ok) return;
    setActionLoading(true);
    setError(null);
    try {
      const updated = await servicesApi.revertService(service.id);
      setService(updated);
      syncedIdRef.current = null;
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo revertir el servicio.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!service) return;
    if (!window.confirm("Eliminar este servicio? Esta accion no se puede deshacer.")) return;
    setActionLoading(true);
    try {
      await servicesApi.deleteService(service.id);
      navigate("/services", { state: { flash: "Servicio eliminado." } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!service) return;
    setPdfError(null);
    setPdfGenerating(true);
    try {
      await downloadServicePdf(service);
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : "No se pudo generar el PDF.");
    } finally {
      setPdfGenerating(false);
    }
  };

  if (!serviceId) {
    return (
      <section className={SECTION_SHELL}>
        <p className="text-sm text-slate-300">ID de servicio invalido.</p>
      </section>
    );
  }

  if (loading) {
    return (
      <section className={SECTION_SHELL}>
        <p className="text-sm text-slate-300">Cargando servicio…</p>
      </section>
    );
  }

  if (!service) {
    return (
      <section className={SECTION_SHELL}>
        <p className="text-sm text-slate-300">No se encontro el servicio.</p>
        <Link to="/services" className="mt-3 inline-flex text-sm text-indigo-300 hover:underline">
          Volver a servicios
        </Link>
      </section>
    );
  }

  return (
    <div className={SERVICE_PAGE_SHELL}>
      {savedFlash ? (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/50 px-4 py-3 text-sm text-emerald-100">
          Cambios guardados.
        </div>
      ) : null}
      {pdfError ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-800/70 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">
          <span>{pdfError}</span>
          <button type="button" onClick={() => setPdfError(null)} className={SECONDARY_BUTTON_SM}>
            Cerrar
          </button>
        </div>
      ) : null}
      {error ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-800/70 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">
          <span>{error}</span>
          <button type="button" onClick={() => void reload()} className={SECONDARY_BUTTON_SM}>
            Reintentar
          </button>
        </div>
      ) : null}

      {isCompleted ? (
        <section className="rounded-xl border border-cyan-700/50 bg-cyan-950/30 px-4 py-3 text-sm text-cyan-100">
          Este servicio está completado. Para cambiar piezas, cantidades, precios o conceptos, usa «Revertir servicio»,
          edita y vuelve a completar. Mientras tanto solo puedes ajustar título, cliente, teléfono, forma de pago y notas.
        </section>
      ) : null}

      <header className={`${PAGE_HEADER_COMPACT} !py-2.5 sm:!py-3`}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1 space-y-1">
            <HeaderTitleRow
              title={displayServiceTitle(title)}
              status={status}
              headerClient={headerClient}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 lg:shrink-0 lg:justify-end">
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => void handleSave()}
              className={PRIMARY_ACTION_BUTTON_COMPACT}
            >
              {actionLoading ? "Guardando…" : "Guardar"}
            </button>
            {status === "PENDING" ? (
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => void handleComplete()}
                className={PRIMARY_ACTION_BUTTON}
              >
                Completar
              </button>
            ) : null}
            {status === "COMPLETED" ? (
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => void handleRevert()}
                className={SECONDARY_BUTTON_SM}
              >
                Revertir servicio
              </button>
            ) : null}
            <button
              type="button"
              disabled={pdfGenerating || actionLoading}
              onClick={() => void handleDownloadPdf()}
              className={SECONDARY_BUTTON_SM}
            >
              {pdfGenerating ? "PDF…" : "PDF"}
            </button>
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => void handleDelete()}
              className={DESTRUCTIVE_BUTTON_SM}
            >
              Eliminar
            </button>
            <Link to="/services" className={`${SECONDARY_BUTTON_SM} inline-flex items-center justify-center`}>
              ← Servicios
            </Link>
          </div>
        </div>
      </header>

      <section className={SERVICE_SECTION}>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          {isSpareSale ? "Venta rapida" : "Orden de trabajo"}
        </h2>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <label className={`flex flex-col gap-1 sm:col-span-2 ${FIELD_LABEL}`}>
            Titulo del servicio
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={FIELD}
              placeholder="Ej: Limpieza PC, venta RAM…"
            />
          </label>
          <label className={`flex flex-col gap-1 ${FIELD_LABEL}`}>
            Tipo
            <select
              value={formType}
              onChange={(e) => setFormType(e.target.value as ServiceType)}
              disabled={fieldsLocked}
              className={FIELD}
            >
              {SERVICE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {SERVICE_LABELS[t]}
                </option>
              ))}
            </select>
          </label>
          <label className={`flex flex-col gap-1 ${FIELD_LABEL}`}>
            Estado
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ServiceStatus)}
              disabled={fieldsLocked}
              className={FIELD}
            >
              {(["PENDING", "COMPLETED", "CANCELLED"] as const).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
          <label className={`flex flex-col gap-1 ${FIELD_LABEL}`}>
            Fecha
            <input
              type="date"
              value={serviceDate}
              onChange={(e) => setServiceDate(e.target.value)}
              disabled={fieldsLocked}
              className={FIELD}
            />
          </label>
          <label className={`flex flex-col gap-1 ${FIELD_LABEL}`}>
            Forma de pago
            <input
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className={FIELD}
              placeholder="Efectivo, Bizum…"
            />
          </label>
          {!isSpareSale ? (
            <label className={`flex flex-col gap-1 sm:col-span-2 ${FIELD_LABEL}`}>
              Descripcion (opcional)
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                disabled={fieldsLocked}
                className={FIELD}
              />
            </label>
          ) : null}
          {!isSpareSale && isHomeService ? (
            <label className={`flex flex-col gap-1 sm:col-span-2 ${FIELD_LABEL}`}>
              Direccion domicilio
              <input
                value={homeServiceAddress}
                onChange={(e) => setHomeServiceAddress(e.target.value)}
                className={FIELD}
              />
            </label>
          ) : null}
        </div>
      </section>

      <section className={SERVICE_SECTION}>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Cliente</h2>
        <CustomerPicker value={customerFields} onChange={setCustomerFields} requirePhone />
      </section>

      {isSpareSale ? (
        <ServiceDetailAccordion
          key="spare-parts"
          title="Pieza de inventario"
          subtitle="Pieza, cantidad y precio de venta"
          defaultOpen
        >
          <ServiceSparePartsSection
            embedded
            spareLines={spareLines}
            onLinesChange={setSpareLines}
            parts={parts}
            spareSalePrice={spareSalePrice}
            onSpareSalePriceChange={(v) => {
              spareSalePriceManualRef.current = true;
              setSpareSalePrice(v);
            }}
            locked={lockedSpareParts}
          />
        </ServiceDetailAccordion>
      ) : (
        <div className={fieldsLocked ? "pointer-events-none opacity-60" : undefined}>
          <ServiceConceptLinesSection
            key="technical-lines"
            lines={conceptLines}
            onLinesChange={setConceptLines}
            servicePresets={servicePresets}
            isHomeService={isHomeService}
            onHomeServiceChange={setIsHomeService}
            accordionMode
            showCatalog
            showManual
            showHomeService
            catalogDefaultOpen
          />
        </div>
      )}

      <ServiceDetailAccordion key="internal-notes" title="Notas internas" defaultOpen={false}>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className={FIELD}
          placeholder="Solo uso interno…"
        />
      </ServiceDetailAccordion>

      <div className="pt-1">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Totales</h2>
        <section className={isSpareSale ? "grid grid-cols-1 gap-2 sm:grid-cols-3" : SUMMARY_CARD_GRID}>
          <article className={SUMMARY_CARD_SHELL}>
            <p className={SUMMARY_CARD_LABEL}>Coste total</p>
            <p className={SUMMARY_VALUE_NEUTRAL}>{money(totalCost)}</p>
          </article>
          <article className={SUMMARY_CARD_SHELL}>
            <p className={SUMMARY_CARD_LABEL}>Precio venta</p>
            <p className={SUMMARY_VALUE_REVENUE}>{money(totalSale)}</p>
          </article>
          <article className={SUMMARY_CARD_SHELL}>
            <p className={SUMMARY_CARD_LABEL}>Beneficio</p>
            <p className={profit >= 0 ? SUMMARY_VALUE_PROFIT_POS : SUMMARY_VALUE_NEGATIVE}>
              {money(profit)}
            </p>
          </article>
          {!isSpareSale ? (
            <article className={SUMMARY_CARD_SHELL}>
              <p className={SUMMARY_CARD_LABEL}>Conceptos</p>
              <p className={SUMMARY_VALUE_NEUTRAL}>{conceptCount}</p>
            </article>
          ) : null}
        </section>
      </div>
    </div>
  );
}

function HeaderTitleRow({
  title,
  status,
  headerClient
}: {
  title: string;
  status: ServiceStatus;
  headerClient: string | null;
}) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="min-w-0 truncate text-lg font-bold tracking-tight text-slate-50 sm:text-xl">{title}</h1>
        <StatusBadge variant={serviceStatusVariant(status)} size="card">
          {STATUS_LABELS[status]}
        </StatusBadge>
      </div>
      {headerClient ? <p className="truncate text-sm text-slate-400">{headerClient}</p> : null}
    </>
  );
}
