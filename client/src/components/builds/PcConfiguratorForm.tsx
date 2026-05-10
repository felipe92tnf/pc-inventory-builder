import { useMemo, useState } from "react";
import type { Part, PartCategory } from "../../types/part";

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
  { id: "OTHER", label: "Other", categories: ["OTHER", "NETWORK"] }
];

function formatMoney(value: number | string): string {
  return `${Number(value).toFixed(2)} EUR`;
}

export type ConfiguratorAddItem = {
  partId: string;
  quantity: number;
};

type PcConfiguratorFormProps = {
  parts: Part[];
  disabled: boolean;
  onAddSelected: (items: ConfiguratorAddItem[]) => Promise<void>;
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

export function PcConfiguratorForm({ parts, disabled, onAddSelected }: PcConfiguratorFormProps) {
  const [selections, setSelections] = useState<Record<ConfiguratorSlotId, string>>(emptySelections);
  const [quantities, setQuantities] = useState<Record<ConfiguratorSlotId, number>>(emptyQuantities);
  const [submitting, setSubmitting] = useState(false);

  const partsBySlot = useMemo(() => {
    const map = new Map<ConfiguratorSlotId, Part[]>();
    for (const slot of CONFIGURATOR_SLOTS) {
      const list = parts.filter(
        (part) => part.stock > 0 && slot.categories.includes(part.category)
      );
      map.set(slot.id, list.sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" })));
    }
    return map;
  }, [parts]);

  const selectedPartBySlot = useMemo(() => {
    const map = new Map<ConfiguratorSlotId, Part | null>();
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
      return;
    }
    const part = parts.find((p) => p.id === partId);
    const maxStock = part?.stock ?? 1;
    setQuantities((prev) => ({
      ...prev,
      [slotId]: Math.min(Math.max(1, prev[slotId]), maxStock)
    }));
  };

  const handleQuantityChange = (slotId: ConfiguratorSlotId, raw: number) => {
    const selected = selectedPartBySlot.get(slotId);
    const max = selected?.stock ?? 1;
    const next = Number.isFinite(raw) ? Math.floor(raw) : 1;
    const clamped = Math.min(Math.max(1, next), max);
    setQuantities((prev) => ({ ...prev, [slotId]: clamped }));
  };

  const handleAddSelected = async () => {
    const perSlot: ConfiguratorAddItem[] = [];
    for (const slot of CONFIGURATOR_SLOTS) {
      const partId = selections[slot.id];
      if (!partId) continue;
      const qty = quantities[slot.id];
      if (qty < 1) continue;
      perSlot.push({ partId, quantity: qty });
    }

    const merged = new Map<string, number>();
    for (const { partId, quantity } of perSlot) {
      merged.set(partId, (merged.get(partId) ?? 0) + quantity);
    }

    const items = Array.from(merged.entries()).map(([partId, quantity]) => ({ partId, quantity }));
    if (items.length === 0) {
      return;
    }

    setSubmitting(true);
    try {
      await onAddSelected(items);
      setSelections(emptySelections());
      setQuantities(emptyQuantities());
    } finally {
      setSubmitting(false);
    }
  };

  const hasAnySelection = CONFIGURATOR_SLOTS.some((slot) => selections[slot.id] !== "");
  const busy = disabled || submitting;

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg shadow-slate-950/40">
      <h2 className="mb-1 text-lg font-semibold text-slate-100">Configurar montaje</h2>
      <p className="mb-4 text-sm text-slate-400">
        Elige pieza y cantidad por ranura (opcional). La cantidad es un desplegable del 1 hasta el stock disponible. Pulsa el boton para anadirlas al montaje.
      </p>

      <div className="space-y-4">
        {CONFIGURATOR_SLOTS.map((slot) => {
          const options = partsBySlot.get(slot.id) ?? [];
          const selected = selectedPartBySlot.get(slot.id) ?? null;
          const selectValue = selections[slot.id];
          const qtyValue = quantities[slot.id];
          const maxQty = selected ? selected.stock : 1;

          return (
            <div
              key={slot.id}
              className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-4 lg:flex-row lg:items-end lg:gap-4"
            >
              <label className="min-w-0 flex-1 flex flex-col gap-1 text-sm font-medium text-slate-200">
                {slot.label}
                <select
                  value={selectValue}
                  onChange={(event) => handleSelectChange(slot.id, event.target.value)}
                  disabled={busy || options.length === 0}
                  className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring disabled:opacity-50"
                >
                  <option value="">{options.length === 0 ? "Sin stock en esta categoria" : "Sin seleccionar"}</option>
                  {options.map((part) => (
                    <option key={part.id} value={part.id}>
                      {part.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex w-full flex-col gap-1 text-sm font-medium text-slate-200 lg:w-36">
                Cantidad
                <select
                  value={
                    selected && maxQty >= 1 ? String(Math.min(Math.max(1, qtyValue), maxQty)) : ""
                  }
                  onChange={(event) => handleQuantityChange(slot.id, Number(event.target.value))}
                  disabled={busy || !selected || maxQty < 1}
                  className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring disabled:opacity-50"
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

              <div className="flex flex-wrap gap-4 text-sm lg:shrink-0">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Stock</p>
                  <p className="font-medium text-slate-200">{selected ? selected.stock : "—"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Coste</p>
                  <p className="font-medium text-slate-200">{selected ? formatMoney(selected.costPrice) : "—"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Venta</p>
                  <p className="font-medium text-slate-200">{selected ? formatMoney(selected.salePrice) : "—"}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => {
            void handleAddSelected();
          }}
          disabled={busy || !hasAnySelection}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Anadiendo..." : "Anadir piezas seleccionadas"}
        </button>
      </div>
    </section>
  );
}
