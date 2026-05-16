import { useMemo, useState, type ReactNode } from "react";
import { isNonStockCategory, type ConfiguratorPart, type PartCategory } from "../../types/part";
import { PRIMARY_ACTION_BUTTON, PRIMARY_ACTION_BUTTON_COMPACT } from "../../theme/actionButtons";
import { SECTION_SHELL } from "../../theme/layoutDensity";

export type ConfiguratorSlotId =
  | "CPU"
  | "MOTHERBOARD"
  | "GPU"
  | "RAM"
  | "STORAGE"
  | "PSU"
  | "CASE"
  | "COOLING"
  | "FANS"
  | "MONITOR"
  | "PERIPHERAL"
  | "OS"
  | "LABOR"
  | "OTHER";

type SlotDef = {
  id: ConfiguratorSlotId;
  label: string;
  categories: PartCategory[];
};

const CONFIGURATOR_SLOTS: SlotDef[] = [
  { id: "CPU", label: "CPU", categories: ["CPU"] },
  { id: "MOTHERBOARD", label: "Motherboard", categories: ["MOTHERBOARD"] },
  { id: "GPU", label: "GPU", categories: ["GPU"] },
  { id: "RAM", label: "RAM", categories: ["RAM"] },
  { id: "STORAGE", label: "Storage", categories: ["STORAGE"] },
  { id: "PSU", label: "PSU", categories: ["PSU"] },
  { id: "CASE", label: "Case", categories: ["CASE"] },
  { id: "COOLING", label: "Cooling", categories: ["COOLER"] },
  { id: "FANS", label: "Fans", categories: ["FAN"] },
  { id: "MONITOR", label: "Monitor", categories: ["MONITOR"] },
  { id: "PERIPHERAL", label: "Periférico", categories: ["PERIPHERAL"] },
  { id: "OS", label: "Sistema operativo", categories: ["OS"] },
  { id: "LABOR", label: "Mano de obra", categories: ["LABOR"] },
  { id: "OTHER", label: "Other", categories: ["OTHER", "NETWORK"] }
];

const CONFIGURATOR_ACCORDION_GROUPS: { title: string; slotIds: ConfiguratorSlotId[] }[] = [
  { title: "Componentes principales", slotIds: ["CPU", "MOTHERBOARD", "GPU", "RAM", "STORAGE", "PSU"] },
  { title: "Caja y refrigeración", slotIds: ["CASE", "COOLING", "FANS"] },
  { title: "Periféricos y otros", slotIds: ["MONITOR", "PERIPHERAL", "OS", "LABOR", "OTHER"] }
];

function formatMoney(value: number | string): string {
  return `${Number(value).toFixed(2)} EUR`;
}

export type ConfiguratorAddItem = {
  partId: string;
  quantity: number;
  /** Opcional: distinto del catalogo al crear la linea en el montaje. */
  unitSalePrice?: number;
};

type PcConfiguratorFormProps = {
  parts: ConfiguratorPart[];
  disabled: boolean;
  onAddSelected: (items: ConfiguratorAddItem[]) => Promise<void>;
  /**
   * Solo precio de catalogo por linea (p. ej. presupuestos). Oculta el campo "Venta montaje"
   * y no envia `unitSalePrice` en el callback.
   */
  catalogSaleOnly?: boolean;
  /** Titulo de la seccion (por defecto: configurar montaje). */
  heading?: string;
  /** Texto introductorio bajo el titulo. */
  lead?: string;
  /** Ranuras mas compactas (menos padding y espacio entre filas). */
  compact?: boolean;
  /** Ranuras en una sola lista o agrupadas en acordeones (detalle montaje). */
  slotLayout?: "flat" | "accordion";
  /**
   * Contenido extra en un acordeón final (p. ej. plantillas de extra + concepto manual en montajes).
   * Solo se muestra con `slotLayout="accordion"`.
   */
  extrasAccordion?: ReactNode;
};

function emptySelections(): Record<ConfiguratorSlotId, string> {
  return CONFIGURATOR_SLOTS.reduce(
    (acc, slot) => {
      acc[slot.id] = "";
      return acc;
    },
    {} as Record<ConfiguratorSlotId, string>
  );
}

function emptyQuantities(): Record<ConfiguratorSlotId, number> {
  return CONFIGURATOR_SLOTS.reduce(
    (acc, slot) => {
      acc[slot.id] = 1;
      return acc;
    },
    {} as Record<ConfiguratorSlotId, number>
  );
}

function emptySaleDrafts(): Partial<Record<ConfiguratorSlotId, string>> {
  return {};
}

export function PcConfiguratorForm({
  parts,
  disabled,
  onAddSelected,
  catalogSaleOnly = false,
  heading = "Configurar montaje",
  lead = "Elige pieza y cantidad por ranura (opcional). Puedes ajustar el precio de venta unitario para este montaje (por defecto es el del inventario). En sistema operativo y mano de obra no hay stock y la cantidad es 1. Pulsa el boton para anadirlas al montaje.",
  compact = false,
  slotLayout = "flat",
  extrasAccordion
}: PcConfiguratorFormProps) {
  const [selections, setSelections] = useState<Record<ConfiguratorSlotId, string>>(emptySelections);
  const [quantities, setQuantities] = useState<Record<ConfiguratorSlotId, number>>(emptyQuantities);
  const [saleDraftBySlot, setSaleDraftBySlot] = useState<Partial<Record<ConfiguratorSlotId, string>>>(() =>
    emptySaleDrafts()
  );
  const [submitting, setSubmitting] = useState(false);

  const partsBySlot = useMemo(() => {
    const map = new Map<ConfiguratorSlotId, ConfiguratorPart[]>();
    for (const slot of CONFIGURATOR_SLOTS) {
      const list = parts.filter((part) => {
        if (!slot.categories.includes(part.category)) {
          return false;
        }
        if (isNonStockCategory(part.category)) {
          return true;
        }
        return part.stock > 0;
      });
      map.set(slot.id, list.sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" })));
    }
    return map;
  }, [parts]);

  const selectedPartBySlot = useMemo(() => {
    const map = new Map<ConfiguratorSlotId, ConfiguratorPart | null>();
    for (const slot of CONFIGURATOR_SLOTS) {
      const id = selections[slot.id];
      if (!id) {
        map.set(slot.id, null);
        continue;
      }
      const found = parts.find((p) => p.id === id) ?? null;
      map.set(slot.id, found);
    }
    return map;
  }, [parts, selections]);

  const handleSelectChange = (slotId: ConfiguratorSlotId, partId: string) => {
    setSelections((prev) => ({ ...prev, [slotId]: partId }));
    if (!partId) {
      setQuantities((prev) => ({ ...prev, [slotId]: 1 }));
      setSaleDraftBySlot((prev) => {
        const next = { ...prev };
        delete next[slotId];
        return next;
      });
      return;
    }
    const part = parts.find((p) => p.id === partId);
    if (part) {
      setSaleDraftBySlot((prev) => ({
        ...prev,
        [slotId]: Number(part.salePrice).toFixed(2)
      }));
    }
    const maxStock = part
      ? isNonStockCategory(part.category)
        ? 1
        : Math.max(1, part.stock)
      : 1;
    setQuantities((prev) => ({
      ...prev,
      [slotId]: Math.min(Math.max(1, prev[slotId]), maxStock)
    }));
  };

  const handleQuantityChange = (slotId: ConfiguratorSlotId, raw: number) => {
    const selected = selectedPartBySlot.get(slotId);
    const max = selected
      ? isNonStockCategory(selected.category)
        ? 1
        : Math.max(1, selected.stock)
      : 1;
    const next = Number.isFinite(raw) ? Math.floor(raw) : 1;
    const clamped = Math.min(Math.max(1, next), max);
    setQuantities((prev) => ({ ...prev, [slotId]: clamped }));
  };

  const handleAddSelected = async () => {
    const merged = new Map<string, { quantity: number; unitSalePrice?: number }>();

    for (const slot of CONFIGURATOR_SLOTS) {
      const partId = selections[slot.id];
      if (!partId) continue;
      const qty = quantities[slot.id];
      if (qty < 1) continue;
      const part = parts.find((p) => p.id === partId);
      if (!part) continue;

      const rawDraft = saleDraftBySlot[slot.id]?.trim();
      const base = Number(part.salePrice);
      let unitSalePrice: number | undefined;
      if (!catalogSaleOnly && rawDraft !== undefined && rawDraft !== "") {
        const n = Number(rawDraft.replace(",", "."));
        if (Number.isFinite(n) && n >= 0 && Math.abs(n - base) >= 0.005) {
          unitSalePrice = Math.round(n * 100) / 100;
        }
      }

      const prev = merged.get(partId);
      if (!prev) {
        merged.set(partId, {
          quantity: qty,
          ...(unitSalePrice !== undefined ? { unitSalePrice } : {})
        });
      } else {
        merged.set(partId, {
          quantity: prev.quantity + qty,
          unitSalePrice: unitSalePrice !== undefined ? unitSalePrice : prev.unitSalePrice
        });
      }
    }

    const items: ConfiguratorAddItem[] = Array.from(merged.entries()).map(([partId, v]) => ({
      partId,
      quantity: v.quantity,
      ...(v.unitSalePrice !== undefined ? { unitSalePrice: v.unitSalePrice } : {})
    }));

    if (items.length === 0) {
      return;
    }

    setSubmitting(true);
    try {
      await onAddSelected(items);
      setSelections(emptySelections());
      setQuantities(emptyQuantities());
      setSaleDraftBySlot(emptySaleDrafts());
    } finally {
      setSubmitting(false);
    }
  };

  const hasAnySelection = CONFIGURATOR_SLOTS.some((slot) => selections[slot.id] !== "");
  const busy = disabled || submitting;

  const renderConfiguratorSlot = (slot: SlotDef) => {
    const options = partsBySlot.get(slot.id) ?? [];
    const selected = selectedPartBySlot.get(slot.id) ?? null;
    const selectValue = selections[slot.id];
    const qtyValue = quantities[slot.id];
    const maxQty = selected
      ? isNonStockCategory(selected.category)
        ? 1
        : Math.max(1, selected.stock)
      : 1;

    return (
      <div
        key={slot.id}
        className={
          compact
            ? "flex flex-col gap-2 rounded-lg border border-slate-800/90 bg-slate-950/40 p-2.5 lg:flex-row lg:items-center lg:gap-2"
            : "flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-4 lg:flex-row lg:items-end lg:gap-4"
        }
      >
        <label
          className={
            compact
              ? "min-w-0 flex-1 flex flex-col gap-0.5 text-xs font-medium text-slate-200"
              : "min-w-0 flex-1 flex flex-col gap-1 text-sm font-medium text-slate-200"
          }
        >
          {slot.label}
          <select
            value={selectValue}
            onChange={(event) => handleSelectChange(slot.id, event.target.value)}
            disabled={busy || options.length === 0}
            className={
              compact
                ? "rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1.5 text-xs text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring disabled:opacity-50"
                : "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring disabled:opacity-50"
            }
          >
            <option value="">{options.length === 0 ? "Sin stock en esta categoria" : "Sin seleccionar"}</option>
            {options.map((part) => (
              <option key={part.id} value={part.id}>
                {part.name}
              </option>
            ))}
          </select>
        </label>

        <label
          className={
            compact
              ? "flex w-full flex-col gap-0.5 text-xs font-medium text-slate-200 lg:w-24 shrink-0"
              : "flex w-full flex-col gap-1 text-sm font-medium text-slate-200 lg:w-36"
          }
        >
          Cantidad
          <select
            value={selected && maxQty >= 1 ? String(Math.min(Math.max(1, qtyValue), maxQty)) : ""}
            onChange={(event) => handleQuantityChange(slot.id, Number(event.target.value))}
            disabled={busy || !selected || maxQty < 1}
            className={
              compact
                ? "rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1.5 text-xs text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring disabled:opacity-50"
                : "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring disabled:opacity-50"
            }
          >
            {!selected || maxQty < 1 ? (
              <option value="">—</option>
            ) : (
              Array.from({ length: maxQty }, (_, index) => index + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))
            )}
          </select>
        </label>

        <div
          className={
            compact
              ? "flex flex-wrap gap-x-2.5 gap-y-1 text-[11px] lg:shrink-0 lg:flex-1 lg:justify-end"
              : "flex flex-wrap gap-4 text-sm lg:shrink-0 lg:flex-1 lg:justify-end"
          }
        >
          <div>
            <p
              className={
                compact
                  ? "text-[10px] uppercase tracking-wide text-slate-500"
                  : "text-xs uppercase tracking-wide text-slate-500"
              }
            >
              Stock
            </p>
            <p className={compact ? "font-medium leading-tight text-slate-200" : "font-medium text-slate-200"}>
              {selected ? (isNonStockCategory(selected.category) ? "N/A" : selected.stock) : "—"}
            </p>
          </div>
          <div>
            <p
              className={
                compact
                  ? "text-[10px] uppercase tracking-wide text-slate-500"
                  : "text-xs uppercase tracking-wide text-slate-500"
              }
            >
              Coste inv.
            </p>
            <p className={compact ? "font-medium leading-tight text-slate-200" : "font-medium text-slate-200"}>
              {selected ? formatMoney(selected.costPrice) : "—"}
            </p>
          </div>
          <div>
            <p
              className={
                compact
                  ? "text-[10px] uppercase tracking-wide text-slate-500"
                  : "text-xs uppercase tracking-wide text-slate-500"
              }
            >
              Venta inv.
            </p>
            <p className={compact ? "font-medium leading-tight text-slate-400" : "font-medium text-slate-400"}>
              {selected ? formatMoney(selected.salePrice) : "—"}
            </p>
          </div>
          {!catalogSaleOnly ? (
            <label className="flex min-w-[9rem] flex-col gap-1">
              <span className="text-xs uppercase tracking-wide text-slate-500">Venta montaje</span>
              <input
                type="text"
                inputMode="decimal"
                value={selected ? (saleDraftBySlot[slot.id] ?? Number(selected.salePrice).toFixed(2)) : ""}
                onChange={(event) =>
                  setSaleDraftBySlot((prev) => ({
                    ...prev,
                    [slot.id]: event.target.value
                  }))
                }
                disabled={busy || !selected}
                placeholder="EUR"
                className="rounded-lg border border-slate-600 bg-slate-950/70 px-2 py-1.5 text-sm font-medium text-emerald-200/95 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring disabled:opacity-50"
              />
            </label>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <section
      className={
        compact
          ? "rounded-xl border border-slate-800 bg-slate-900/80 p-3 shadow-md shadow-slate-950/40 sm:p-4"
          : SECTION_SHELL
      }
    >
      <h2 className={compact ? "mb-0.5 text-base font-semibold text-slate-100" : "mb-1 text-lg font-semibold text-slate-100"}>
        {heading}
      </h2>
      {lead !== "" ? (
        <p className={compact ? "mb-2 text-xs leading-snug text-slate-400" : "mb-3 text-sm text-slate-400"}>{lead}</p>
      ) : null}

      <div
        className={
          slotLayout === "accordion"
            ? "space-y-1.5"
            : compact
              ? "space-y-2"
              : "space-y-3"
        }
      >
        {slotLayout === "accordion"
          ? CONFIGURATOR_ACCORDION_GROUPS.map((group) => (
              <details
                key={group.title}
                className="group rounded-lg border border-slate-800/90 bg-slate-950/30 open:border-slate-700/85"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-lg px-2 py-2 text-sm font-semibold text-slate-100 outline-none hover:bg-slate-900/50 sm:px-3 [&::-webkit-details-marker]:hidden">
                  <span>{group.title}</span>
                  <span
                    className="inline-block text-slate-500 transition-transform duration-200 group-open:rotate-90"
                    aria-hidden
                  >
                    ▸
                  </span>
                </summary>
                <div
                  className={
                    compact
                      ? "space-y-2 border-t border-slate-800/70 p-2 pt-2"
                      : "space-y-3 border-t border-slate-800/70 p-2 pt-3"
                  }
                >
                  {group.slotIds.map((id) => {
                    const slot = CONFIGURATOR_SLOTS.find((s) => s.id === id);
                    return slot ? renderConfiguratorSlot(slot) : null;
                  })}
                </div>
              </details>
            ))
          : CONFIGURATOR_SLOTS.map((slot) => renderConfiguratorSlot(slot))}
        {slotLayout === "accordion" && extrasAccordion ? (
          <details className="group rounded-lg border border-slate-800/90 bg-slate-950/30 open:border-slate-700/85">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-lg px-2 py-2 text-sm font-semibold text-slate-100 outline-none hover:bg-slate-900/50 sm:px-3 [&::-webkit-details-marker]:hidden">
              <span>Extras y servicios</span>
              <span
                className="inline-block text-slate-500 transition-transform duration-200 group-open:rotate-90"
                aria-hidden
              >
                ▸
              </span>
            </summary>
            <div
              className={
                compact
                  ? "space-y-2 border-t border-slate-800/70 p-2 pt-2"
                  : "space-y-3 border-t border-slate-800/70 p-2 pt-3"
              }
            >
              {extrasAccordion}
            </div>
          </details>
        ) : null}
      </div>

      <div className={compact ? "mt-3 flex flex-wrap items-center gap-2" : "mt-6 flex flex-wrap items-center gap-3"}>
        <button
          type="button"
          onClick={() => {
            void handleAddSelected();
          }}
          disabled={busy || !hasAnySelection}
          className={compact ? PRIMARY_ACTION_BUTTON_COMPACT : PRIMARY_ACTION_BUTTON}
        >
          {submitting ? "Anadiendo..." : catalogSaleOnly ? "Anadir al presupuesto" : "Anadir piezas seleccionadas"}
        </button>
      </div>
    </section>
  );
}
