import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  OS_PART_CONDITION,
  PART_CATEGORIES,
  PART_CONDITIONS,
  isNonStockCategory,
  partCategoryLabel,
  type Part,
  type PartCategory,
  type PartCondition,
  type PartFormValues,
  type InventoryKind
} from "../../types/part";
import { calculateSalePrice } from "../../utils/pricing";

const STOCK_QUICK_OPTIONS = [1, 2, 3, 4, 5] as const;

const PREBUILT_DESCRIPTION_TEMPLATE = `CPU:
GPU:
RAM:
PSU:
PLACA:
ALMACENAMIENTO:
CASE:
COOLER:
OTRO:`;

const defaultValues: PartFormValues = {
  inventoryKind: "PART",
  name: "",
  category: "CPU",
  condition: "USED",
  costPrice: 0,
  salePrice: calculateSalePrice(0, "USED"),
  manualSalePrice: false,
  stock: 1,
  notes: "",
  description: ""
};

type PartFormProps = {
  selectedPart: Part | null;
  onSubmit: (values: PartFormValues) => Promise<void>;
  onCancelEdit: () => void;
  submitting: boolean;
  className?: string;
};

function toNumber(value: number | string): number {
  return Number(value);
}

function salePriceDiffersFromCalculated(saved: number, cost: number, condition: PartCondition): boolean {
  const calculated = calculateSalePrice(cost || 0, condition);
  return Math.abs(saved - calculated) > 0.005;
}

function conditionForPricing(category: PartCategory, condition: PartCondition): PartCondition {
  return isNonStockCategory(category) ? OS_PART_CONDITION : condition;
}

export function PartForm({ selectedPart, onSubmit, onCancelEdit, submitting, className = "" }: PartFormProps) {
  const [form, setForm] = useState<PartFormValues>(defaultValues);

  const isEditMode = useMemo(() => selectedPart !== null, [selectedPart]);
  const isPrebuilt = form.inventoryKind === "PREBUILT_PC";

  useEffect(() => {
    if (!selectedPart) {
      setForm(defaultValues);
      return;
    }

    const cost = toNumber(selectedPart.costPrice);
    const savedSale = toNumber(selectedPart.salePrice);

    if (selectedPart.inventoryKind === "PREBUILT_PC") {
      setForm({
        inventoryKind: "PREBUILT_PC",
        name: selectedPart.name,
        category: "CPU",
        condition: selectedPart.condition,
        costPrice: cost,
        salePrice: savedSale,
        manualSalePrice: true,
        stock: selectedPart.stock,
        notes: selectedPart.notes ?? "",
        description: selectedPart.description?.trim()
          ? selectedPart.description
          : PREBUILT_DESCRIPTION_TEMPLATE
      });
      return;
    }

    const cat = selectedPart.category ?? "OTHER";
    const condForCalc = isNonStockCategory(cat) ? OS_PART_CONDITION : selectedPart.condition;
    setForm({
      inventoryKind: "PART",
      name: selectedPart.name,
      category: cat,
      condition: isNonStockCategory(cat) ? OS_PART_CONDITION : selectedPart.condition,
      costPrice: cost,
      salePrice: savedSale,
      manualSalePrice: salePriceDiffersFromCalculated(savedSale, cost, condForCalc),
      stock: selectedPart.stock,
      notes: selectedPart.notes ?? "",
      description: selectedPart.description ?? ""
    });
  }, [selectedPart]);

  useEffect(() => {
    if (isPrebuilt || form.manualSalePrice) return;
    setForm((prev) => ({
      ...prev,
      salePrice: calculateSalePrice(
        prev.costPrice || 0,
        conditionForPricing(prev.category, prev.condition)
      )
    }));
  }, [form.costPrice, form.condition, form.category, form.manualSalePrice, isPrebuilt]);

  const calculatedSalePrice = useMemo(
    () => calculateSalePrice(form.costPrice || 0, conditionForPricing(form.category, form.condition)),
    [form.costPrice, form.category, form.condition]
  );

  const referenceSalePrebuilt = useMemo(
    () => calculateSalePrice(form.costPrice || 0, form.condition),
    [form.costPrice, form.condition]
  );

  const updateField = <K extends keyof PartFormValues>(key: K, value: PartFormValues[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit(form);
    if (!isEditMode) {
      setForm(defaultValues);
    }
  };

  const formTitle = isEditMode
    ? isPrebuilt
      ? "Editar PC completo"
      : "Editar pieza"
    : isPrebuilt
      ? "Nuevo PC completo"
      : "Nueva pieza";

  return (
    <section
      className={`rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg shadow-slate-950/40 backdrop-blur ${className}`.trim()}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-100">{formTitle}</h2>
        {isEditMode ? (
          <button
            type="button"
            onClick={onCancelEdit}
            className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-1.5 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
          >
            Cancelar
          </button>
        ) : null}
      </div>

      <div className="mb-4 flex flex-col gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Tipo de articulo</span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={isEditMode || submitting}
            onClick={() => {
              setForm((prev) => ({
                ...defaultValues,
                inventoryKind: "PART",
                name: prev.name,
                notes: prev.notes
              }));
            }}
            className={`rounded-lg border px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${
              !isPrebuilt
                ? "border-indigo-500/60 bg-indigo-500/20 text-indigo-100"
                : "border-slate-600 bg-slate-950/70 text-slate-400 hover:bg-slate-800"
            }`}
          >
            Pieza suelta
          </button>
          <button
            type="button"
            disabled={isEditMode || submitting}
            onClick={() => {
              setForm((prev) => ({
                ...defaultValues,
                inventoryKind: "PREBUILT_PC",
                manualSalePrice: true,
                name: prev.name,
                notes: prev.notes,
                description: PREBUILT_DESCRIPTION_TEMPLATE,
                salePrice: calculateSalePrice(prev.costPrice || 0, "USED"),
                condition: "USED"
              }));
            }}
            className={`rounded-lg border px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${
              isPrebuilt
                ? "border-cyan-500/60 bg-cyan-500/20 text-cyan-100"
                : "border-slate-600 bg-slate-950/70 text-slate-400 hover:bg-slate-800"
            }`}
          >
            PC completo / premontado
          </button>
        </div>
        {isEditMode ? (
          <p className="text-xs text-slate-500">El tipo no se puede cambiar al editar; crea un articulo nuevo.</p>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-2">
          Nombre
          <input
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring"
            required
          />
        </label>

        {isPrebuilt ? (
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-2">
            Descripcion / componentes incluidos
            <textarea
              value={form.description}
              onChange={(event) => updateField("description", event.target.value)}
              rows={4}
              placeholder="CPU, RAM, GPU, almacenamiento, torre, Windows..."
              className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 placeholder:text-slate-500 focus:border-indigo-400 focus:ring"
            />
          </label>
        ) : null}

        {!isPrebuilt ? (
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
            Categoria
            <select
              value={form.category}
              onChange={(event) => {
                const cat = event.target.value as PartCategory;
                setForm((prev) => {
                  const next = { ...prev, category: cat };
                  if (isNonStockCategory(cat)) {
                    return {
                      ...next,
                      stock: 0,
                      manualSalePrice: true,
                      condition: OS_PART_CONDITION
                    };
                  }
                  const wasNonStock = isNonStockCategory(prev.category);
                  return {
                    ...next,
                    stock: prev.stock < 1 ? 1 : prev.stock,
                    condition: wasNonStock ? "USED" : prev.condition
                  };
                });
              }}
              className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring"
            >
              {PART_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {partCategoryLabel(category)}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {!isPrebuilt && isNonStockCategory(form.category) ? (
          <p className="text-sm text-slate-400">
            Sin estado aplicable (se guarda internamente como licencia nueva).
          </p>
        ) : (
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
            Estado
            <select
              value={form.condition}
              onChange={(event) => updateField("condition", event.target.value as PartCondition)}
              className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring"
            >
              {PART_CONDITIONS.map((condition) => (
                <option key={condition} value={condition}>
                  {condition}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
          Precio coste
          <input
            type="number"
            min={0}
            step="0.01"
            value={form.costPrice === 0 ? "" : form.costPrice}
            onChange={(event) => {
              const raw = event.target.value;
              if (raw === "") {
                updateField("costPrice", 0);
                return;
              }
              const n = Number(raw);
              if (!Number.isNaN(n)) {
                updateField("costPrice", n);
              }
            }}
            className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring"
          />
        </label>

        <div className="flex flex-col gap-1 text-sm font-medium text-slate-200">
          <span>Precio venta estimado (EUR)</span>
          <input
            id="part-sale-price"
            type="number"
            min={0}
            step="0.01"
            value={
              isPrebuilt || form.manualSalePrice
                ? form.salePrice === 0
                  ? ""
                  : form.salePrice
                : calculatedSalePrice.toFixed(2)
            }
            readOnly={!isPrebuilt && !form.manualSalePrice}
            onChange={(event) => {
              const raw = event.target.value;
              if (raw === "") {
                updateField("salePrice", 0);
                return;
              }
              const n = Number(raw);
              if (!Number.isNaN(n)) {
                updateField("salePrice", n);
              }
            }}
            className={`rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring ${
              isPrebuilt || form.manualSalePrice ? "bg-slate-950/70" : "cursor-not-allowed bg-slate-950/50 text-slate-400"
            }`}
          />
          {isPrebuilt ? (
            <span className="text-xs font-normal text-slate-400">
              Referencia por coste y estado: {referenceSalePrebuilt.toFixed(2)} EUR (puedes fijar otro valor).
            </span>
          ) : (
            <label className="mt-1 flex cursor-pointer items-center gap-2 text-xs font-normal text-slate-300">
              <input
                type="checkbox"
                checked={form.manualSalePrice}
                onChange={(event) => {
                  const checked = event.target.checked;
                  setForm((prev) => ({
                    ...prev,
                    manualSalePrice: checked,
                    salePrice: checked
                      ? prev.salePrice
                      : calculateSalePrice(
                          prev.costPrice || 0,
                          conditionForPricing(prev.category, prev.condition)
                        )
                  }));
                }}
                className="h-4 w-4 shrink-0 rounded border-slate-600 bg-slate-950 text-indigo-500 focus:ring-indigo-400"
              />
              Introducir precio de venta manualmente
            </label>
          )}
          {!isPrebuilt ? (
            <span className="text-xs font-normal text-slate-400">
              {form.manualSalePrice
                ? `Referencia calculada: ${calculatedSalePrice.toFixed(2)} EUR${
                    isNonStockCategory(form.category) ? " (margen tipo nuevo)." : " (segun coste y estado)."
                  }`
                : isNonStockCategory(form.category)
                  ? "Calculado segun coste (margen tipo nuevo)."
                  : "Calculado automaticamente segun estado y coste."}
            </span>
          ) : null}
        </div>

        {!isPrebuilt && isNonStockCategory(form.category) ? (
          <p className="text-sm text-slate-400 md:col-span-2">
            Sin stock: define solo costes y precio de venta (licencia, mano de obra, etc.).
          </p>
        ) : (
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-200 md:col-span-2">
            Stock
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
              <label className="flex min-w-0 shrink-0 flex-col gap-1 text-xs font-normal text-slate-400 sm:w-44">
                Rapido (1 a 5)
                <select
                  value={
                    (STOCK_QUICK_OPTIONS as readonly number[]).includes(form.stock) ? String(form.stock) : ""
                  }
                  onChange={(event) => {
                    const v = event.target.value;
                    if (v === "") return;
                    updateField("stock", Number(v));
                  }}
                  className="min-h-[42px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring"
                >
                  <option value="">Elegir...</option>
                  {STOCK_QUICK_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs font-normal text-slate-400">
                Cantidad (manual)
                <input
                  type="number"
                  min={0}
                  step="1"
                  value={form.stock}
                  onChange={(event) => updateField("stock", Number(event.target.value))}
                  className="min-h-[42px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring"
                  required
                />
              </label>
            </div>
          </label>
        )}

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-2">
          Notas
          <textarea
            value={form.notes}
            onChange={(event) => updateField("notes", event.target.value)}
            rows={3}
            className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 placeholder:text-slate-500 focus:border-indigo-400 focus:ring"
            placeholder="Incidencias, embalaje, garantia..."
          />
        </label>

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Guardando..." : isEditMode ? "Guardar cambios" : isPrebuilt ? "Registrar PC" : "Crear pieza"}
          </button>
        </div>
      </form>
    </section>
  );
}
