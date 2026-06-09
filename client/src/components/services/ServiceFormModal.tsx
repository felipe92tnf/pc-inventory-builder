import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import type {
  CreateServicePayload,
  PatchServicePayload,
  ServiceExtraLinePayload,
  ServiceRow,
  ServiceType
} from "../../types/service";
import { SERVICE_TYPES } from "../../types/service";
import type { Part, PartCategory } from "../../types/part";
import { isPartPiece, PART_CATEGORIES, partCategoryLabel } from "../../types/part";
import type { ExtraTemplate } from "../../types/extraTemplate";
import type { CustomerFieldValue } from "../../types/customer";
import { CustomerPicker, emptyCustomerFields } from "../customers/CustomerPicker";
import { PaymentMethodSelect } from "../ui/PaymentMethodSelect";
import {
  conceptLinesToPayload,
  type ConceptLineDraft,
  ensureHomeDeliveryLine,
  isHomeDeliveryLine,
  lineTotal,
  linesCostTotal,
  linesFromService,
  linesSaleTotal,
  HOME_DELIVERY_LABEL,
  newConceptLine,
  templateLinesFromService
} from "../../utils/serviceConceptLines";
import { customerFieldToForm, customerFieldsToApi } from "../../utils/customerUi";
import {
  PRIMARY_ACTION_BUTTON,
  SECONDARY_BUTTON_SM,
  DESTRUCTIVE_BUTTON_SM
} from "../../theme/actionButtons";

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

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function money(n: number): string {
  return `${n.toFixed(2)} EUR`;
}

const SECTION_SHELL =
  "rounded-xl border border-slate-800 bg-slate-950/40 p-4 shadow-inner shadow-black/20";
const SECTION_TITLE = "text-xs font-semibold uppercase tracking-wide text-indigo-300/90";
const FIELD_LABEL = "text-sm font-medium text-slate-200";
const INPUT =
  "min-h-[42px] w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 placeholder:text-slate-500 focus:border-indigo-400 focus:ring";

type SpareLineDraft = { partId: string; quantity: number };

export type ServiceFormModalProps = {
  open: boolean;
  editingService: ServiceRow | null;
  submitting: boolean;
  actionId: string | null;
  parts: Part[];
  /** Catálogo Inventario → Servicios (ExtraTemplate category SERVICE). */
  servicePresets: ExtraTemplate[];
  onClose: () => void;
  onCreate: (payload: CreateServicePayload) => Promise<void>;
  onPatch: (id: string, payload: PatchServicePayload) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
};

export function ServiceFormModal({
  open,
  editingService,
  submitting,
  actionId,
  parts,
  servicePresets,
  onClose,
  onCreate,
  onPatch,
  onDelete
}: ServiceFormModalProps) {
  const isEdit = editingService != null;
  const lockedSpare = isEdit && editingService.status === "COMPLETED";

  const [formType, setFormType] = useState<ServiceType>("DIAGNOSTIC");
  const [title, setTitle] = useState("");
  const [customerFields, setCustomerFields] = useState<CustomerFieldValue>(emptyCustomerFields);
  const [description, setDescription] = useState("");
  const [conceptLines, setConceptLines] = useState<ConceptLineDraft[]>([newConceptLine()]);
  const [templateLines, setTemplateLines] = useState<ServiceExtraLinePayload[]>([]);
  const [presetPickId, setPresetPickId] = useState("");
  const [internalCostOverride, setInternalCostOverride] = useState<number | "">("");
  const [spareLines, setSpareLines] = useState<SpareLineDraft[]>([{ partId: "", quantity: 1 }]);
  const [spareSalePrice, setSpareSalePrice] = useState<number | "">("");
  const [isHomeService, setIsHomeService] = useState(false);
  const [homeServiceAddress, setHomeServiceAddress] = useState("");
  const [serviceDate, setServiceDate] = useState(toIsoDate(new Date()));
  const [paymentMethod, setPaymentMethod] = useState("");
  const [notes, setNotes] = useState("");

  const partsForSpare = useMemo(() => parts.filter((p) => isPartPiece(p) && p.stock > 0), [parts]);

  const sparePartsByCategory = useMemo(() => {
    const byCat = new Map<PartCategory, Part[]>();
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

  const spareInventoryCost = useMemo(() => {
    if (formType !== "SPARE_PART_SALE") return null;
    let cost = 0;
    let any = false;
    for (const line of spareLines) {
      if (!line.partId || line.quantity < 1) continue;
      const p = parts.find((x) => x.id === line.partId);
      if (!p) continue;
      any = true;
      cost += Number(p.costPrice) * line.quantity;
    }
    return any ? cost : null;
  }, [formType, spareLines, parts]);

  const conceptSaleTotal = useMemo(() => linesSaleTotal(conceptLines), [conceptLines]);
  const conceptCostTotal = useMemo(() => linesCostTotal(conceptLines), [conceptLines]);

  const templateSaleEstimate = useMemo(() => {
    let sum = 0;
    for (const row of templateLines) {
      sum += Number(row.unitSalePrice ?? 0) * (row.quantity ?? 1);
    }
    return Math.round(sum * 100) / 100;
  }, [templateLines]);

  const templateCostEstimate = useMemo(() => {
    let sum = 0;
    for (const row of templateLines) {
      sum += Number(row.unitCost ?? 0) * (row.quantity ?? 1);
    }
    return Math.round(sum * 100) / 100;
  }, [templateLines]);

  const totalCost = useMemo(() => {
    const base =
      typeof internalCostOverride === "number" && Number.isFinite(internalCostOverride)
        ? internalCostOverride
        : conceptCostTotal + templateCostEstimate + (spareInventoryCost ?? 0);
    return Math.round(base * 100) / 100;
  }, [internalCostOverride, conceptCostTotal, templateCostEstimate, spareInventoryCost]);

  const totalSale = useMemo(() => {
    if (formType === "SPARE_PART_SALE") {
      const pieces = typeof spareSalePrice === "number" ? spareSalePrice : 0;
      return Math.round((pieces + conceptSaleTotal + templateSaleEstimate) * 100) / 100;
    }
    return Math.round((conceptSaleTotal + templateSaleEstimate) * 100) / 100;
  }, [formType, spareSalePrice, conceptSaleTotal, templateSaleEstimate]);

  const profit = totalSale - totalCost;

  useEffect(() => {
    if (!open) return;
    if (editingService) {
      const svc = editingService;
      setFormType(svc.type);
      setTitle(svc.title);
      setCustomerFields({
        customerId: svc.customerId ?? null,
        customerName: customerFieldToForm(svc.customerName),
        customerPhone: customerFieldToForm(svc.customerPhone),
        customerEmail: ""
      });
      setDescription(svc.description ?? "");
      const loadedLines = linesFromService(svc);
      setConceptLines(loadedLines);
      setIsHomeService(svc.isHomeService || loadedLines.some(isHomeDeliveryLine));
      setTemplateLines(
        templateLinesFromService(svc).map((l) => ({
          extraTemplateId: l.extraTemplateId!,
          quantity: l.quantity,
          unitCost: Number(l.unitCost),
          unitSalePrice: Number(l.unitSalePrice)
        }))
      );
      setInternalCostOverride(Number(svc.costPrice));
      setHomeServiceAddress(svc.homeServiceAddress ?? "");
      setServiceDate(toIsoDate(new Date(svc.serviceDate)));
      setPaymentMethod(svc.paymentMethod ?? "");
      setNotes(svc.notes ?? "");
      if (svc.type === "SPARE_PART_SALE") {
        if (svc.sparePartLines?.length) {
          setSpareLines(svc.sparePartLines.map((l) => ({ partId: l.partId, quantity: l.quantity })));
        } else if (svc.selectedPartId && svc.quantity) {
          setSpareLines([{ partId: svc.selectedPartId, quantity: svc.quantity }]);
        } else {
          setSpareLines([{ partId: "", quantity: 1 }]);
        }
        const manualRows = (svc.extraLines ?? []).filter((l) => l.extraTemplateId == null);
        const conceptSale = manualRows.reduce((s, l) => s + Number(l.unitSalePrice) * l.quantity, 0);
        const templateSale = (svc.extraLines ?? [])
          .filter((l) => l.extraTemplateId != null)
          .reduce((s, l) => s + Number(l.unitSalePrice) * l.quantity, 0);
        const legacySup = Number(svc.homeServiceSupplement ?? 0);
        setSpareSalePrice(
          Math.max(0, Math.round((Number(svc.salePrice) - conceptSale - templateSale - legacySup) * 100) / 100)
        );
      } else {
        setSpareLines([{ partId: "", quantity: 1 }]);
        setSpareSalePrice("");
      }
    } else {
      setFormType("DIAGNOSTIC");
      setTitle("");
      setCustomerFields(emptyCustomerFields());
      setDescription("");
      setConceptLines([newConceptLine()]);
      setTemplateLines([]);
      setInternalCostOverride("");
      setSpareLines([{ partId: "", quantity: 1 }]);
      setSpareSalePrice("");
      setIsHomeService(false);
      setHomeServiceAddress("");
      setServiceDate(toIsoDate(new Date()));
      setPaymentMethod("");
      setNotes("");
    }
    setPresetPickId("");
  }, [open, editingService]);

  const addPresetAsConcept = (preset: ExtraTemplate) => {
    const sale = Number(preset.defaultSalePrice);
    const cost = Number(preset.defaultCostPrice);
    if (preset.name.trim().toLowerCase() === HOME_DELIVERY_LABEL.toLowerCase()) {
      setIsHomeService(true);
      setConceptLines((prev) => ensureHomeDeliveryLine(prev, true, sale));
      return;
    }
    setConceptLines((prev) => [
      ...prev,
      newConceptLine({
        name: preset.name.trim(),
        quantity: 1,
        unitCost: Number.isFinite(cost) ? cost : 0,
        unitSalePrice: Number.isFinite(sale) ? sale : 0
      })
    ]);
  };

  const handleHomeToggle = (checked: boolean) => {
    setIsHomeService(checked);
    setConceptLines((prev) => ensureHomeDeliveryLine(prev, checked));
  };

  const updateConceptLine = (key: string, patch: Partial<ConceptLineDraft>) => {
    setConceptLines((prev) => prev.map((l) => (l.clientKey === key ? { ...l, ...patch } : l)));
  };

  const addConceptLine = () => setConceptLines((prev) => [...prev, newConceptLine()]);

  const removeConceptLine = (key: string) => {
    setConceptLines((prev) => {
      const row = prev.find((l) => l.clientKey === key);
      if (row && isHomeDeliveryLine(row)) setIsHomeService(false);
      const next = prev.filter((l) => l.clientKey !== key);
      return next.length === 0 ? [newConceptLine()] : next;
    });
  };

  const buildBasePayload = () => {
    const customer = customerFieldsToApi(customerFields);
    return {
      title: title.trim(),
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
      manualLines: conceptLinesToPayload(conceptLines),
      extraLines: templateLines.length > 0 ? templateLines : undefined,
      costPrice: totalCost
    };
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const manual = conceptLinesToPayload(conceptLines);
    if (formType !== "SPARE_PART_SALE" && manual.length === 0 && templateLines.length === 0) {
      window.alert("Añade al menos un concepto o plantilla de servicio.");
      return;
    }

    try {
      if (isEdit && editingService) {
        const patch: PatchServicePayload = {
          ...buildBasePayload(),
          manualLines: manual,
          extraLines: templateLines
        };
        if (editingService.type === "SPARE_PART_SALE" && !lockedSpare) {
          const lines = spareLines
            .filter((l) => l.partId.trim() && l.quantity >= 1)
            .map((l) => ({ partId: l.partId.trim(), quantity: l.quantity }));
          if (lines.length === 0) {
            window.alert("Añade al menos una pieza.");
            return;
          }
          const piecesSale = typeof spareSalePrice === "number" ? spareSalePrice : NaN;
          if (!Number.isFinite(piecesSale) || piecesSale < 0) {
            window.alert("Indica el precio de venta de las piezas.");
            return;
          }
          patch.sparePartLines = lines;
          patch.salePrice = piecesSale;
        }
        await onPatch(editingService.id, patch);
      } else {
        const base = buildBasePayload();
        if (formType === "SPARE_PART_SALE") {
          const lines = spareLines
            .filter((l) => l.partId.trim() && l.quantity >= 1)
            .map((l) => ({ partId: l.partId.trim(), quantity: l.quantity }));
          if (lines.length === 0) {
            window.alert("Añade al menos una pieza.");
            return;
          }
          const piecesSale = typeof spareSalePrice === "number" ? spareSalePrice : NaN;
          if (!Number.isFinite(piecesSale) || piecesSale < 0) {
            window.alert("Indica el precio de venta de las piezas.");
            return;
          }
          await onCreate({
            type: formType,
            ...base,
            sparePartLines: lines,
            salePrice: piecesSale,
            selectedPartId: null,
            quantity: null
          });
        } else {
          await onCreate({ type: formType, ...base, selectedPartId: null, quantity: null });
        }
      }
      onClose();
    } catch {
      /* hook */
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="service-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-3xl flex-col rounded-t-2xl border border-slate-700 bg-slate-900 shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-800 px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 id="service-modal-title" className="text-xl font-semibold text-slate-100">
              {isEdit ? "Editar servicio" : "Nuevo servicio"}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {isEdit && editingService
                ? `${SERVICE_LABELS[editingService.type]} · venta desde conceptos`
                : "Cliente, conceptos, domicilio y totales automaticos."}
            </p>
          </div>
          <button type="button" onClick={onClose} className={SECONDARY_BUTTON_SM}>
            Cerrar
          </button>
        </header>

        <form onSubmit={(e) => void handleSubmit(e)} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4 sm:px-6">
            <FormSection title="Datos del servicio">
              <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className={`flex flex-col gap-1.5 ${FIELD_LABEL}`}>
                  Tipo
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as ServiceType)}
                    disabled={isEdit}
                    className={INPUT}
                  >
                    {SERVICE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {SERVICE_LABELS[t]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={`flex flex-col gap-1.5 md:col-span-2 ${FIELD_LABEL}`}>
                  Titulo / referencia
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className={INPUT}
                    placeholder="Ej: Revision torre cliente Juan"
                  />
                </label>
                <label className={`flex flex-col gap-1.5 md:col-span-2 ${FIELD_LABEL}`}>
                  Descripcion (opcional)
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className={`${INPUT} min-h-[72px]`}
                  />
                </label>
                <label className={`flex flex-col gap-1.5 ${FIELD_LABEL}`}>
                  Fecha
                  <input
                    type="date"
                    value={serviceDate}
                    onChange={(e) => setServiceDate(e.target.value)}
                    required
                    className={INPUT}
                  />
                </label>
              </div>
            </FormSection>

            <FormSection title="Cliente">
              <div className="mt-3">
                <CustomerPicker value={customerFields} onChange={setCustomerFields} requirePhone />
              </div>
            </FormSection>

            {formType === "SPARE_PART_SALE" ? (
              <FormSection title="Piezas del inventario">
                {lockedSpare ? (
                  <p className="mt-2 text-xs text-slate-500">
                    Las piezas no se modifican en servicios completados; puedes editar conceptos y datos.
                  </p>
                ) : null}
                <SpareLinesEditor
                  spareLines={spareLines}
                  sparePartsByCategory={sparePartsByCategory}
                  locked={lockedSpare}
                  onUpdate={(idx, patch) =>
                    setSpareLines((prev) => prev.map((row, i) => (i === idx ? { ...row, ...patch } : row)))
                  }
                  onAdd={() => setSpareLines((prev) => [...prev, { partId: "", quantity: 1 }])}
                  onRemove={(idx) =>
                    setSpareLines((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)))
                  }
                />
                {spareInventoryCost !== null ? (
                  <p className="mt-2 text-xs text-slate-500">
                    Coste piezas (inventario):{" "}
                    <span className="font-medium text-slate-300">{money(spareInventoryCost)}</span>
                  </p>
                ) : null}
                <label className={`mt-3 flex flex-col gap-1.5 ${FIELD_LABEL}`}>
                  Precio venta piezas (sin conceptos ni plantillas)
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={spareSalePrice === "" ? "" : spareSalePrice}
                    onChange={(e) =>
                      setSpareSalePrice(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    disabled={lockedSpare}
                    className={INPUT}
                  />
                </label>
              </FormSection>
            ) : null}

            <FormSection title="Servicios / conceptos">
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-slate-500">
                  Lineas manuales; el total de venta se calcula automaticamente.
                </p>
                <button type="button" onClick={addConceptLine} className={SECONDARY_BUTTON_SM}>
                  Añadir concepto
                </button>
              </div>
              <ServiceCatalogPresetPicker
                presets={servicePresets}
                presetPickId={presetPickId}
                onPickId={setPresetPickId}
                onAdd={(preset) => {
                  addPresetAsConcept(preset);
                  setPresetPickId("");
                }}
              />
              {templateLines.length > 0 ? (
                <p className="mt-3 text-xs text-amber-200/90">
                  Este servicio tiene {templateLines.length} linea(s) antigua(s) vinculadas a plantilla; se
                  conservan al guardar.
                </p>
              ) : null}
              <ConceptLinesTable
                lines={conceptLines}
                onUpdate={updateConceptLine}
                onRemove={removeConceptLine}
              />
            </FormSection>

            <FormSection title="Domicilio">
              <label className="mt-3 flex items-center gap-2 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={isHomeService}
                  onChange={(e) => handleHomeToggle(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-950 text-indigo-500"
                />
                Servicio a domicilio (concepto 20 EUR editable, sin duplicar)
              </label>
              {isHomeService ? (
                <label className={`mt-3 flex flex-col gap-1.5 ${FIELD_LABEL}`}>
                  Direccion
                  <input
                    value={homeServiceAddress}
                    onChange={(e) => setHomeServiceAddress(e.target.value)}
                    className={INPUT}
                    placeholder="Calle, ciudad..."
                  />
                </label>
              ) : null}
            </FormSection>

            <FormSection title="Resumen economico" accent>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <Stat label="Venta total" value={money(totalSale)} highlight />
                <Stat label="Coste" value={money(totalCost)} />
                <Stat label="Beneficio" value={money(profit)} positive={profit >= 0} />
                <Stat label="Lineas" value={String(conceptLines.length)} />
              </dl>
              <label className={`mt-3 flex flex-col gap-1.5 ${FIELD_LABEL}`}>
                Coste interno opcional (sustituye calculo automatico)
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={internalCostOverride === "" ? "" : internalCostOverride}
                  onChange={(e) =>
                    setInternalCostOverride(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  className={INPUT}
                  placeholder="Vacio = suma conceptos + plantillas + piezas"
                />
              </label>
            </FormSection>

            <FormSection title="Pago y notas">
              <div className="mt-3 grid grid-cols-1 gap-4">
                <label className={`flex flex-col gap-1.5 ${FIELD_LABEL}`}>
                  Forma de pago
                  <PaymentMethodSelect
                    value={paymentMethod}
                    onChange={setPaymentMethod}
                    className={INPUT}
                  />
                </label>
                <label className={`flex flex-col gap-1.5 ${FIELD_LABEL}`}>
                  Notas internas
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className={`${INPUT} min-h-[72px]`}
                  />
                </label>
              </div>
            </FormSection>
          </div>

          <footer className="flex shrink-0 flex-wrap gap-2 border-t border-slate-800 bg-slate-950/60 px-4 py-4 sm:px-6">
            <button
              type="submit"
              disabled={submitting || (isEdit && actionId === editingService?.id)}
              className={PRIMARY_ACTION_BUTTON}
            >
              {submitting ? "Guardando..." : isEdit ? "Guardar cambios" : "Registrar servicio"}
            </button>
            <button type="button" onClick={onClose} className={SECONDARY_BUTTON_SM}>
              Cancelar
            </button>
            {isEdit && onDelete && editingService ? (
              <button
                type="button"
                disabled={submitting || actionId === editingService.id}
                onClick={() => {
                  if (!window.confirm("Eliminar este servicio? Esta accion no se puede deshacer.")) return;
                  void onDelete(editingService.id).then(() => onClose());
                }}
                className={DESTRUCTIVE_BUTTON_SM}
              >
                Eliminar servicio
              </button>
            ) : null}
          </footer>
        </form>
      </div>
    </div>
  );
}

function FormSection({
  title,
  accent,
  children
}: {
  title: string;
  accent?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      className={
        accent
          ? `${SECTION_SHELL} border-indigo-500/25 bg-indigo-950/20`
          : SECTION_SHELL
      }
    >
      <h3 className={SECTION_TITLE}>{title}</h3>
      {children}
    </section>
  );
}

function Stat({
  label,
  value,
  highlight,
  positive
}: {
  label: string;
  value: string;
  highlight?: boolean;
  positive?: boolean;
}) {
  const valueClass = highlight
    ? "text-cyan-300"
    : positive === false
      ? "text-rose-300"
      : positive === true
        ? "text-emerald-300"
        : "text-slate-200";
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2">
      <dt className="text-[10px] uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className={`mt-0.5 text-base font-semibold ${valueClass}`}>{value}</dd>
    </div>
  );
}

function ConceptLinesTable({
  lines,
  onUpdate,
  onRemove
}: {
  lines: ConceptLineDraft[];
  onUpdate: (key: string, patch: Partial<ConceptLineDraft>) => void;
  onRemove: (key: string) => void;
}) {
  return (
    <div className="mt-3 overflow-x-auto rounded-lg border border-slate-800">
      <table className="min-w-full text-left text-sm text-slate-200">
        <thead className="bg-slate-950/80 text-[10px] uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-2 py-2">Concepto</th>
            <th className="w-16 px-2 py-2">Cant.</th>
            <th className="w-24 px-2 py-2">PVP u.</th>
            <th className="w-24 px-2 py-2 text-right">Total</th>
            <th className="w-14 px-2 py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {lines.map((line) => (
            <tr key={line.clientKey} className={isHomeDeliveryLine(line) ? "bg-violet-950/20" : undefined}>
              <td className="px-2 py-2">
                <input
                  value={line.name}
                  onChange={(e) => onUpdate(line.clientKey, { name: e.target.value })}
                  disabled={isHomeDeliveryLine(line)}
                  className={`${INPUT} min-h-[36px] py-1.5 text-sm`}
                  placeholder="Ej: Instalacion SO"
                />
              </td>
              <td className="px-2 py-2">
                <input
                  type="number"
                  min={1}
                  value={line.quantity}
                  onChange={(e) =>
                    onUpdate(line.clientKey, { quantity: Math.max(1, Number(e.target.value) || 1) })
                  }
                  className={`${INPUT} min-h-[36px] py-1.5 text-sm`}
                />
              </td>
              <td className="px-2 py-2">
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={line.unitSalePrice}
                  onChange={(e) =>
                    onUpdate(line.clientKey, {
                      unitSalePrice: Math.max(0, Number(e.target.value) || 0)
                    })
                  }
                  className={`${INPUT} min-h-[36px] py-1.5 text-sm`}
                />
              </td>
              <td className="px-2 py-2 text-right font-medium text-emerald-300/90">
                {money(lineTotal(line))}
              </td>
              <td className="px-2 py-2 text-right">
                {lines.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => onRemove(line.clientKey)}
                    className="text-xs font-semibold text-rose-300 hover:underline"
                  >
                    Quitar
                  </button>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ServiceCatalogPresetPicker({
  presets,
  presetPickId,
  onPickId,
  onAdd
}: {
  presets: ExtraTemplate[];
  presetPickId: string;
  onPickId: (id: string) => void;
  onAdd: (preset: ExtraTemplate) => void;
}) {
  return (
    <div className="mt-3 rounded-lg border border-indigo-500/25 bg-indigo-950/20 p-3">
      <p className="text-xs font-medium text-indigo-200/90">Catálogo de servicios</p>
      <p className="mt-1 text-[11px] text-slate-500">
        Añade un servicio predefinido; el precio se puede editar en la tabla de conceptos.
      </p>
      <div className="mt-2 flex flex-wrap items-end gap-2">
        <select
          value={presetPickId}
          onChange={(e) => onPickId(e.target.value)}
          className={`${INPUT} min-w-[12rem] flex-1`}
          disabled={presets.length === 0}
        >
          <option value="">
            {presets.length === 0 ? "Sin servicios en catálogo" : "Elegir servicio…"}
          </option>
          {presets.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} — {Number(t.defaultSalePrice).toFixed(2)} EUR
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={!presetPickId}
          className={SECONDARY_BUTTON_SM}
          onClick={() => {
            const preset = presets.find((t) => t.id === presetPickId);
            if (!preset) {
              window.alert("Elige un servicio del catálogo.");
              return;
            }
            onAdd(preset);
          }}
        >
          Añadir concepto
        </button>
      </div>
      <Link
        to="/?tab=services"
        className="mt-2 inline-flex text-xs font-medium text-indigo-300 underline-offset-2 hover:text-indigo-200 hover:underline"
      >
        Gestionar catálogo en Inventario
      </Link>
    </div>
  );
}

function SpareLinesEditor({
  spareLines,
  sparePartsByCategory,
  locked,
  onUpdate,
  onAdd,
  onRemove
}: {
  spareLines: SpareLineDraft[];
  sparePartsByCategory: { category: PartCategory; label: string; parts: Part[] }[];
  locked: boolean;
  onUpdate: (idx: number, patch: Partial<SpareLineDraft>) => void;
  onAdd: () => void;
  onRemove: (idx: number) => void;
}) {
  return (
    <div className="mt-3 space-y-3">
      {!locked ? (
        <div className="flex justify-end">
          <button type="button" onClick={onAdd} className={SECONDARY_BUTTON_SM}>
            Añadir pieza
          </button>
        </div>
      ) : null}
      {spareLines.map((line, idx) => (
        <div
          key={idx}
          className="flex flex-col gap-3 rounded-lg border border-slate-800 bg-slate-950/50 p-3 sm:flex-row sm:flex-wrap sm:items-end"
        >
          <label className={`flex min-w-0 flex-1 flex-col gap-1 ${FIELD_LABEL}`}>
            Pieza
            <select
              value={line.partId}
              onChange={(e) => onUpdate(idx, { partId: e.target.value })}
              disabled={locked}
              className={INPUT}
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
          <label className={`flex w-full flex-col gap-1 sm:w-24 ${FIELD_LABEL}`}>
            Cant.
            <input
              type="number"
              min={1}
              value={line.quantity}
              onChange={(e) => onUpdate(idx, { quantity: Number(e.target.value) })}
              disabled={locked}
              className={INPUT}
            />
          </label>
          {spareLines.length > 1 && !locked ? (
            <button type="button" onClick={() => onRemove(idx)} className={DESTRUCTIVE_BUTTON_SM}>
              Quitar
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
}
