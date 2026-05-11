import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Cpu, PackageSearch } from "lucide-react";
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
import { PRIMARY_ACTION_BUTTON } from "../../theme/actionButtons";

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
    if (form.manualSalePrice) return;
    setForm((prev) => ({
      ...prev,
      salePrice: calculateSalePrice(
        prev.costPrice || 0,
        prev.inventoryKind === "PREBUILT_PC"
          ? prev.condition
          : conditionForPricing(prev.category, prev.condition)
      )
    }));
  }, [form.costPrice, form.condition, form.category, form.inventoryKind, form.manualSalePrice]);

  const calculatedSalePrice = useMemo(
    () => calculateSalePrice(form.costPrice || 0, conditionForPricing(form.category, form.condition)),
    [form.costPrice, form.category, form.condition]
  );

  const referenceSalePrebuilt = useMemo(
    () => calculateSalePrice(form.costPrice || 0, form.condition),
    [form.costPrice, form.condition]
  );

  const autoSalePrice = isPrebuilt ? referenceSalePrebuilt : calculatedSalePrice;
  const activeSalePrice = form.manualSalePrice ? form.salePrice : autoSalePrice;
  const estimatedProfit = activeSalePrice - form.costPrice;
  const estimatedMargin = form.costPrice > 0 ? (estimatedProfit / form.costPrice) * 100 : 0;

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

      <form onSubmit={handleSubmit} className="space-y-5">
        <section className="space-y-3 rounded-xl border border-slate-800/90 bg-slate-950/30 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Tipo de articulo</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
              className={`group rounded-xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                !isPrebuilt
                  ? "border-indigo-400/70 bg-indigo-500/15 shadow-[0_0_0_1px_rgba(129,140,248,0.3)]"
                  : "border-slate-700 bg-slate-950/80 hover:border-slate-500"
              }`}
            >
              <div className="mb-2 flex items-center gap-2">
                <PackageSearch className={`h-5 w-5 ${!isPrebuilt ? "text-indigo-300" : "text-slate-400"}`} />
                <h3 className="text-sm font-semibold text-slate-100">Pieza suelta</h3>
              </div>
              <p className="text-xs text-slate-400">Componentes individuales con categoría, stock y precio dinámico.</p>
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
              className={`group rounded-xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                isPrebuilt
                  ? "border-cyan-400/70 bg-cyan-500/15 shadow-[0_0_0_1px_rgba(34,211,238,0.3)]"
                  : "border-slate-700 bg-slate-950/80 hover:border-slate-500"
              }`}
            >
              <div className="mb-2 flex items-center gap-2">
                <Cpu className={`h-5 w-5 ${isPrebuilt ? "text-cyan-300" : "text-slate-400"}`} />
                <h3 className="text-sm font-semibold text-slate-100">PC completo / premontado</h3>
              </div>
              <p className="text-xs text-slate-400">Equipos terminados con descripción de componentes y stock por unidad.</p>
            </button>
          </div>
          {isEditMode ? (
            <p className="text-xs text-slate-500">El tipo no se puede cambiar al editar; crea un artículo nuevo.</p>
          ) : null}
        </section>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_280px] xl:items-start">
          <div className="space-y-4">
            <section className="rounded-xl border border-slate-800/90 bg-slate-950/30 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Informacion basica</p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className={`flex flex-col gap-1 text-sm font-medium text-slate-200 ${isPrebuilt ? "md:col-span-2" : ""}`}>
                  {isPrebuilt ? "Nombre del PC" : "Nombre"}
                  <input
                    value={form.name}
                    onChange={(event) => updateField("name", event.target.value)}
                    className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring"
                    required
                  />
                </label>

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
                  <p className="self-end rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm text-slate-400">
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

                {isPrebuilt ? (
                  <label className="flex flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-2">
                    Descripcion de componentes
                    <textarea
                      value={form.description}
                      onChange={(event) => updateField("description", event.target.value)}
                      rows={5}
                      placeholder="CPU, RAM, GPU, almacenamiento, torre, Windows..."
                      className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 placeholder:text-slate-500 focus:border-indigo-400 focus:ring"
                    />
                  </label>
                ) : null}
              </div>
            </section>

            <section className="rounded-xl border border-slate-800/90 bg-slate-950/30 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Precios y stock</p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
                  {isPrebuilt ? "Precio coste total" : "Precio coste"}
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
                    value={form.manualSalePrice ? (form.salePrice === 0 ? "" : form.salePrice) : autoSalePrice.toFixed(2)}
                    readOnly={!form.manualSalePrice}
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
                      form.manualSalePrice ? "bg-slate-950/70" : "cursor-not-allowed bg-slate-950/50 text-slate-400"
                    }`}
                  />
                  <span className="text-xs font-normal text-slate-400">
                    Calculado automaticamente segun estado y coste.
                  </span>
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
                                prev.inventoryKind === "PREBUILT_PC"
                                  ? prev.condition
                                  : conditionForPricing(prev.category, prev.condition)
                              )
                        }));
                      }}
                      className="h-4 w-4 shrink-0 rounded border-slate-600 bg-slate-950 text-indigo-500 focus:ring-indigo-400"
                    />
                    Precio manual
                  </label>
                  {form.manualSalePrice ? (
                    <span className="text-xs font-normal text-amber-300/90">
                      Este precio no se recalculará automáticamente.
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
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <label className="flex min-w-0 shrink-0 flex-col gap-1 text-xs font-normal text-slate-400">
                        Stock rapido
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
                      <label className="flex min-w-0 flex-col gap-1 text-xs font-normal text-slate-400">
                        Cantidad manual
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
              </div>
            </section>

            <section className="rounded-xl border border-slate-800/90 bg-slate-950/30 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Notas y detalles</p>
              <label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
                Notas
                <textarea
                  value={form.notes}
                  onChange={(event) => updateField("notes", event.target.value)}
                  rows={3}
                  className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 placeholder:text-slate-500 focus:border-indigo-400 focus:ring"
                  placeholder="Incidencias, embalaje, garantia..."
                />
              </label>
            </section>
          </div>

          <aside className="h-fit rounded-xl border border-slate-800/90 bg-slate-950/50 p-4 xl:sticky xl:top-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Resumen estimado</p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2">
                <span className="text-slate-400">Coste total</span>
                <strong className="text-slate-100">{form.costPrice.toFixed(2)} EUR</strong>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2">
                <span className="text-slate-400">Venta estimada</span>
                <strong className="text-emerald-300">{activeSalePrice.toFixed(2)} EUR</strong>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2">
                <span className="text-slate-400">Beneficio potencial</span>
                <strong className={estimatedProfit >= 0 ? "text-emerald-300" : "text-rose-300"}>
                  {estimatedProfit.toFixed(2)} EUR
                </strong>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2">
                <span className="text-slate-400">Margen %</span>
                <strong className={estimatedMargin >= 0 ? "text-emerald-300" : "text-rose-300"}>
                  {estimatedMargin.toFixed(1)}%
                </strong>
              </div>
            </div>
          </aside>
        </div>

        <div className="sticky bottom-2 z-10 rounded-xl border border-slate-800/90 bg-slate-900/90 p-3 backdrop-blur md:static md:border-0 md:bg-transparent md:p-0">
          <button
            type="submit"
            disabled={submitting}
            className={PRIMARY_ACTION_BUTTON}
          >
            {submitting ? "Guardando..." : isPrebuilt ? "Guardar PC completo" : "Guardar pieza"}
          </button>
        </div>
      </form>
    </section>
  );
}
