import {
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
  type MutableRefObject,
  useEffect,
  useRef,
  useState
} from "react";
import * as catalogApi from "../../api/catalog";
import {
  PART_CATEGORIES,
  PART_CONDITIONS,
  partCategoryLabel,
  type PartCatalogEntry,
  type PartCategory,
  type PartCondition
} from "../../types/part";
import { calculateSalePrice } from "../../utils/pricing";
import { SECONDARY_BUTTON_SM } from "../../theme/actionButtons";

const TEMPLATE_CONDITION_LABEL: Record<PartCondition, string> = {
  NEW: "Nuevo",
  USED: "Usado",
  REFURBISHED: "Reacondicionado"
};

const DECIMAL_TYPING_RE = /^\d*(?:[.,]\d*)?$/;

function isDecimalSeparatorKey(key: string, code?: string): boolean {
  return (
    key === "." ||
    key === "," ||
    key === "Decimal" ||
    key === "NumpadDecimal" ||
    code === "NumpadDecimal"
  );
}

function decimalSeparatorFromKey(key: string): string {
  return key === "," ? "," : ".";
}

function parseDecimalInput(raw: string): number {
  const t = raw.trim().replace(",", ".");
  if (t === "" || t === "." || t === "-") return 0;
  const n = Number.parseFloat(t);
  return Number.isFinite(n) ? n : 0;
}

function formatDecimalForInput(n: number): string {
  if (!Number.isFinite(n)) return "";
  return String(n);
}

function sanitizeDecimalTypingValue(value: string): string | null {
  if (!DECIMAL_TYPING_RE.test(value)) return null;
  if (/^0\d/.test(value)) {
    return value.replace(/^0+/, "");
  }
  return value;
}

type DecimalFieldHandlers = {
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onBlur: () => void;
};

function createDecimalFieldHandlers(options: {
  getValue: () => string;
  setValue: (value: string) => void;
  ignoreNextEmptyRef: MutableRefObject<boolean>;
  onAfterEdit?: () => void;
  onBlurEmpty?: () => void;
}): DecimalFieldHandlers {
  const { getValue, setValue, ignoreNextEmptyRef, onAfterEdit, onBlurEmpty } = options;

  return {
    onChange: (event) => {
      let value = event.target.value;

      if (value === "") {
        if (ignoreNextEmptyRef.current) {
          ignoreNextEmptyRef.current = false;
          return;
        }
        setValue("");
        onAfterEdit?.();
        return;
      }

      const sanitized = sanitizeDecimalTypingValue(value);
      if (sanitized === null) return;

      setValue(sanitized);
      onAfterEdit?.();
    },

    onKeyDown: (event) => {
      if (!isDecimalSeparatorKey(event.key, event.code)) return;

      const input = event.currentTarget;
      const { value, selectionStart, selectionEnd } = input;

      if (/[.,]/.test(value)) {
        event.preventDefault();
        return;
      }

      event.preventDefault();

      const start = selectionStart ?? value.length;
      const end = selectionEnd ?? value.length;
      const sep = decimalSeparatorFromKey(event.key);
      const rawNext = `${value.slice(0, start)}${sep}${value.slice(end)}`;
      const next = sanitizeDecimalTypingValue(rawNext);
      if (next === null) return;

      ignoreNextEmptyRef.current = true;
      setValue(next);
      onAfterEdit?.();

      const cursor = start + sep.length;
      requestAnimationFrame(() => {
        input.setSelectionRange(cursor, cursor);
      });
    },

    onBlur: () => {
      const trimmed = getValue().trim();
      if (trimmed === "" || trimmed === "." || trimmed === ",") {
        onBlurEmpty?.();
        return;
      }
      const withoutTrailingSep = trimmed.replace(/[.,]$/, "");
      const n = parseDecimalInput(withoutTrailingSep);
      setValue(formatDecimalForInput(n));
    }
  };
}

const DECIMAL_INPUT_CLASS =
  "min-h-[40px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring";

type NewCatalogPartFormProps = {
  onSuccess?: (created: PartCatalogEntry, meta: { condition: PartCondition }) => void;
};

export function NewCatalogPartForm({ onSuccess }: NewCatalogPartFormProps) {
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [newSku, setNewSku] = useState("");
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<PartCategory>("OTHER");
  const [newBrand, setNewBrand] = useState("");
  const [newModel, setNewModel] = useState("");
  const [costInput, setCostInput] = useState("0");
  const [templateCondition, setTemplateCondition] = useState<PartCondition>("NEW");
  const [pvpInput, setPvpInput] = useState("0");
  const [isPvpManual, setIsPvpManual] = useState(false);
  const [newNotes, setNewNotes] = useState("");
  const ignoreNextEmptyCostChangeRef = useRef(false);
  const ignoreNextEmptyPvpChangeRef = useRef(false);

  const normalizedCost = parseDecimalInput(costInput);

  useEffect(() => {
    if (isPvpManual) return;
    const autoPvp = calculateSalePrice(Math.max(0, normalizedCost), templateCondition);
    setPvpInput(formatDecimalForInput(autoPvp));
  }, [normalizedCost, templateCondition, isPvpManual]);

  const costField = createDecimalFieldHandlers({
    getValue: () => costInput,
    setValue: setCostInput,
    ignoreNextEmptyRef: ignoreNextEmptyCostChangeRef,
    onBlurEmpty: () => setCostInput("0")
  });

  const pvpField = createDecimalFieldHandlers({
    getValue: () => pvpInput,
    setValue: setPvpInput,
    ignoreNextEmptyRef: ignoreNextEmptyPvpChangeRef,
    onAfterEdit: () => setIsPvpManual(true),
    onBlurEmpty: () => {
      setIsPvpManual(false);
      const autoPvp = calculateSalePrice(Math.max(0, normalizedCost), templateCondition);
      setPvpInput(formatDecimalForInput(autoPvp));
    }
  });

  const handleCreateCatalog = async (event: FormEvent) => {
    event.preventDefault();
    if (!newName.trim()) return;
    setCreateSubmitting(true);
    setCreateError(null);
    try {
      const created = await catalogApi.createCatalogPart({
        sku: newSku.trim() ? newSku.trim() : null,
        name: newName.trim(),
        category: newCategory,
        brand: newBrand.trim(),
        model: newModel.trim(),
        defaultCostPrice: Math.max(0, parseDecimalInput(costInput)),
        defaultSalePrice: Math.max(0, parseDecimalInput(pvpInput)),
        notes: newNotes.trim() ? newNotes.trim() : null
      });
      setNewSku("");
      setNewName("");
      setNewCategory("OTHER");
      setNewBrand("");
      setNewModel("");
      setCostInput("0");
      setTemplateCondition("NEW");
      setIsPvpManual(false);
      setPvpInput(formatDecimalForInput(calculateSalePrice(0, "NEW")));
      setNewNotes("");
      onSuccess?.(created, { condition: templateCondition });
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "No se pudo crear la pieza en el catalogo.");
    } finally {
      setCreateSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/40 md:p-5">
      <h2 className="text-xl font-semibold text-slate-100">Alta de plantilla de pieza</h2>
      <p className="mt-2 text-sm text-slate-400">
        Define nombre, marca, modelo, categoría, SKU opcional y coste. El PVP se rellena según el estado (nuevo +15%,
        usado o reacondicionado +30%); puedes ajustarlo a mano si lo necesitas.
      </p>
      {createError ? (
        <p className="mt-3 rounded-lg border border-rose-800/60 bg-rose-950/40 px-3 py-2 text-sm text-rose-100">
          {createError}
        </p>
      ) : null}
      <form onSubmit={handleCreateCatalog} className="mt-4 space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
            SKU (opcional)
            <input
              value={newSku}
              onChange={(e) => setNewSku(e.target.value)}
              className="min-h-[40px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
            Nombre
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
              className="min-h-[40px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
            Categoría
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as PartCategory)}
              className="min-h-[40px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring"
            >
              {PART_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {partCategoryLabel(c)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
            Marca
            <input
              value={newBrand}
              onChange={(e) => setNewBrand(e.target.value)}
              className="min-h-[40px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
            Modelo
            <input
              value={newModel}
              onChange={(e) => setNewModel(e.target.value)}
              className="min-h-[40px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
            Estado (para calcular PVP recomendado)
            <select
              value={templateCondition}
              onChange={(e) => setTemplateCondition(e.target.value as PartCondition)}
              className="min-h-[40px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring"
            >
              {PART_CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {TEMPLATE_CONDITION_LABEL[c]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
            Coste recomendado
            <input
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={costInput}
              onChange={costField.onChange}
              onKeyDown={costField.onKeyDown}
              onBlur={costField.onBlur}
              className={DECIMAL_INPUT_CLASS}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-200 sm:col-span-2">
            PVP recomendado
            <input
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={pvpInput}
              onChange={pvpField.onChange}
              onKeyDown={pvpField.onKeyDown}
              onBlur={pvpField.onBlur}
              className={DECIMAL_INPUT_CLASS}
            />
            <span className="text-xs font-normal text-slate-500">
              Referencia automática al cambiar coste o estado: nuevo ×1,15 · usado o reacondicionado ×1,30 (euro
              redondeado).
            </span>
          </label>
        </div>
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
          Notas del catálogo
          <textarea
            value={newNotes}
            onChange={(e) => setNewNotes(e.target.value)}
            rows={2}
            className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring"
          />
        </label>
        <button
          type="submit"
          disabled={createSubmitting || !newName.trim()}
          className={`${SECONDARY_BUTTON_SM} disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {createSubmitting ? "Creando..." : "Guardar en catálogo"}
        </button>
      </form>
    </div>
  );
}
