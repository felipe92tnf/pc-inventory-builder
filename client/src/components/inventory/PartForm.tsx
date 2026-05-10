import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  PART_CATEGORIES,
  PART_CONDITIONS,
  type Part,
  type PartCategory,
  type PartCondition,
  type PartFormValues
} from "../../types/part";
import { calculateSalePrice } from "../../utils/pricing";

const STOCK_QUICK_OPTIONS = [1, 2, 3, 4, 5] as const;

const defaultValues: PartFormValues = {
  name: "",
  category: "CPU",
  condition: "USED",
  costPrice: 0,
  stock: 1,
  notes: ""
};

type PartFormProps = {
  selectedPart: Part | null;
  onSubmit: (values: PartFormValues) => Promise<void>;
  onCancelEdit: () => void;
  submitting: boolean;
  /** Clases extra para el contenedor (p. ej. anidar en acordeón móvil). */
  className?: string;
};

function toNumber(value: number | string): number {
  return Number(value);
}

export function PartForm({ selectedPart, onSubmit, onCancelEdit, submitting, className = "" }: PartFormProps) {
  const [form, setForm] = useState<PartFormValues>(defaultValues);

  const isEditMode = useMemo(() => selectedPart !== null, [selectedPart]);

  useEffect(() => {
    if (!selectedPart) {
      setForm(defaultValues);
      return;
    }

    setForm({
      name: selectedPart.name,
      category: selectedPart.category,
      condition: selectedPart.condition,
      costPrice: toNumber(selectedPart.costPrice),
      stock: selectedPart.stock,
      notes: selectedPart.notes ?? ""
    });
  }, [selectedPart]);

  const calculatedSalePrice = useMemo(
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

  return (
    <section
      className={`rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg shadow-slate-950/40 backdrop-blur ${className}`.trim()}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-100">
          {isEditMode ? "Editar pieza" : "Nueva pieza"}
        </h2>
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

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
          Categoria
          <select
            value={form.category}
            onChange={(event) => updateField("category", event.target.value as PartCategory)}
            className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring"
          >
            {PART_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

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

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
          Precio venta
          <input
            type="number"
            min={0}
            step="0.01"
            value={calculatedSalePrice.toFixed(2)}
            readOnly
            className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring"
          />
          <span className="text-xs text-slate-400">Calculado automaticamente segun estado y coste.</span>
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-200 md:col-span-2">
          Stock
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
            <label className="flex min-w-0 shrink-0 flex-col gap-1 text-xs font-normal text-slate-400 sm:w-44">
              Rapido (1 a 5)
              <select
                value={
                  (STOCK_QUICK_OPTIONS as readonly number[]).includes(form.stock)
                    ? String(form.stock)
                    : ""
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
          <span className="text-xs font-normal text-slate-500">
            Usa el desplegable para 1–5 o escribe otro valor en el campo.
          </span>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-2">
          Notas
          <textarea
            value={form.notes}
            onChange={(event) => updateField("notes", event.target.value)}
            rows={3}
            className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 placeholder:text-slate-500 focus:border-indigo-400 focus:ring"
            placeholder="Estado estetico, pruebas, accesorios incluidos..."
          />
        </label>

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Guardando..." : isEditMode ? "Guardar cambios" : "Crear pieza"}
          </button>
        </div>
      </form>
    </section>
  );
}
