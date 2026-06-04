import { useMemo } from "react";
import type { Part, PartCategory } from "../../types/part";
import { isPartPiece, PART_CATEGORIES, partCategoryLabel } from "../../types/part";
import { DESTRUCTIVE_BUTTON_SM, SECONDARY_BUTTON_SM } from "../../theme/actionButtons";

const INPUT =
  "min-h-[42px] w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring";
const FIELD_LABEL = "text-sm font-medium text-slate-200";

export type SpareLineDraft = { partId: string; quantity: number };

export function ServiceSparePartsSection({
  spareLines,
  onLinesChange,
  parts,
  spareSalePrice,
  onSpareSalePriceChange,
  locked,
  embedded = false
}: {
  spareLines: SpareLineDraft[];
  onLinesChange: (lines: SpareLineDraft[]) => void;
  parts: Part[];
  spareSalePrice: number | "";
  onSpareSalePriceChange: (v: number | "") => void;
  locked: boolean;
  /** Sin cáscara de sección (dentro de un acordeón). */
  embedded?: boolean;
}) {
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

  const inventoryCost = useMemo(() => {
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
  }, [spareLines, parts]);

  const update = (idx: number, patch: Partial<SpareLineDraft>) => {
    onLinesChange(spareLines.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  };

  const body = (
    <>
      {locked ? (
        <p className="mb-2 text-xs text-slate-500">
          Servicio completado: revierte el servicio para modificar piezas, cantidades y precio de venta.
        </p>
      ) : null}
      {!locked ? (
        <SpareAddButton onAdd={() => onLinesChange([...spareLines, { partId: "", quantity: 1 }])} />
      ) : null}
      <div className="space-y-3">
        {spareLines.map((line, idx) => (
          <div
            key={idx}
            className="flex flex-col gap-3 rounded-lg border border-slate-800 bg-slate-950/50 p-3 sm:flex-row sm:flex-wrap sm:items-end"
          >
            <label className={`flex min-w-0 flex-1 flex-col gap-1 ${FIELD_LABEL}`}>
              Pieza
              <select
                value={line.partId}
                onChange={(e) => update(idx, { partId: e.target.value })}
                disabled={locked}
                className={INPUT}
              >
                <option value="">Seleccionar…</option>
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
                onChange={(e) => update(idx, { quantity: Number(e.target.value) })}
                disabled={locked}
                className={INPUT}
              />
            </label>
            {spareLines.length > 1 && !locked ? (
              <button
                type="button"
                onClick={() =>
                  onLinesChange(spareLines.length <= 1 ? spareLines : spareLines.filter((_, i) => i !== idx))
                }
                className={DESTRUCTIVE_BUTTON_SM}
              >
                Quitar
              </button>
            ) : null}
          </div>
        ))}
      </div>
      {inventoryCost !== null ? (
        <p className="mt-2 text-xs text-slate-500">
          Coste piezas (inventario):{" "}
          <span className="font-medium text-slate-300">{inventoryCost.toFixed(2)} EUR</span>
        </p>
      ) : null}
      <label className={`mt-3 flex flex-col gap-1 ${embedded ? "text-sm font-medium text-slate-200" : FIELD_LABEL}`}>
        Precio de venta
        <input
          type="number"
          min={0}
          step="0.01"
          value={spareSalePrice === "" ? "" : spareSalePrice}
          onChange={(e) =>
            onSpareSalePriceChange(e.target.value === "" ? "" : Number(e.target.value))
          }
          disabled={locked}
          className={INPUT}
        />
      </label>
    </>
  );

  if (embedded) return <div className="space-y-2">{body}</div>;

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 shadow-md shadow-slate-950/30 md:p-4">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
        Piezas del inventario
      </h2>
      {body}
    </section>
  );
}

function SpareAddButton({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="mb-3 flex justify-end">
      <button type="button" onClick={onAdd} className={SECONDARY_BUTTON_SM}>
        Añadir pieza
      </button>
    </div>
  );
}
