import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { ExtraTemplate } from "../../types/extraTemplate";
import {
  type ConceptLineDraft,
  HOME_DELIVERY_LABEL,
  ensureHomeDeliveryLine,
  isHomeDeliveryLine,
  lineTotal,
  newConceptLine
} from "../../utils/serviceConceptLines";
import {
  DESTRUCTIVE_BUTTON_SM,
  PRIMARY_ACTION_BUTTON_COMPACT,
  SECONDARY_BUTTON_SM
} from "../../theme/actionButtons";
import { TABLE_CELL } from "../../theme/layoutDensity";

const INPUT =
  "min-h-[36px] w-full rounded-lg border border-slate-700 bg-slate-950/70 px-2.5 py-1.5 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring";

function sortCatalogBySaleDesc(presets: ExtraTemplate[]): ExtraTemplate[] {
  return [...presets].sort((a, b) => {
    const priceDiff = Number(b.defaultSalePrice) - Number(a.defaultSalePrice);
    if (priceDiff !== 0) return priceDiff;
    return a.name.localeCompare(b.name, "es", { sensitivity: "base" });
  });
}

function money(n: number): string {
  return `${n.toFixed(2)} EUR`;
}

export type ServiceConceptLinesSectionProps = {
  lines: ConceptLineDraft[];
  onLinesChange: (lines: ConceptLineDraft[]) => void;
  servicePresets: ExtraTemplate[];
  isHomeService: boolean;
  onHomeServiceChange: (enabled: boolean) => void;
  disabled?: boolean;
};

export function ServiceConceptLinesSection({
  lines,
  onLinesChange,
  servicePresets,
  isHomeService,
  onHomeServiceChange,
  disabled = false
}: ServiceConceptLinesSectionProps) {
  const [presetPickId, setPresetPickId] = useState("");
  const [catalogQuery, setCatalogQuery] = useState("");
  const [manualOpen, setManualOpen] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualQty, setManualQty] = useState(1);
  const [manualCost, setManualCost] = useState("");
  const [manualSale, setManualSale] = useState("");

  const filteredPresets = useMemo(() => {
    const q = catalogQuery.trim().toLowerCase();
    const matched = !q
      ? servicePresets
      : servicePresets.filter((p) => p.name.toLowerCase().includes(q));
    return sortCatalogBySaleDesc(matched);
  }, [servicePresets, catalogQuery]);

  const updateLine = (key: string, patch: Partial<ConceptLineDraft>) => {
    onLinesChange(lines.map((l) => (l.clientKey === key ? { ...l, ...patch } : l)));
  };

  const removeLine = (key: string) => {
    const row = lines.find((l) => l.clientKey === key);
    if (row && isHomeDeliveryLine(row)) onHomeServiceChange(false);
    const next = lines.filter((l) => l.clientKey !== key);
    onLinesChange(next.length === 0 ? [newConceptLine()] : next);
  };

  const addPreset = (preset: ExtraTemplate) => {
    const sale = Number(preset.defaultSalePrice);
    const cost = Number(preset.defaultCostPrice);
    if (preset.name.trim().toLowerCase() === HOME_DELIVERY_LABEL.toLowerCase()) {
      onHomeServiceChange(true);
      onLinesChange(ensureHomeDeliveryLine(lines, true, sale));
      return;
    }
    onLinesChange([
      ...lines,
      newConceptLine({
        name: preset.name.trim(),
        quantity: 1,
        unitCost: Number.isFinite(cost) ? cost : 0,
        unitSalePrice: Number.isFinite(sale) ? sale : 0
      })
    ]);
  };

  const addManualLine = () => {
    const sale = Number(manualSale.replace(",", ".").trim());
    if (!manualName.trim()) {
      window.alert("Indica la descripción del concepto.");
      return;
    }
    if (!Number.isFinite(sale) || sale < 0) {
      window.alert("Indica un precio de venta válido.");
      return;
    }
    let cost = 0;
    if (manualCost.trim() !== "") {
      const c = Number(manualCost.replace(",", ".").trim());
      if (!Number.isFinite(c) || c < 0) {
        window.alert("Coste unitario inválido.");
        return;
      }
      cost = c;
    }
    onLinesChange([
      ...lines,
      newConceptLine({
        name: manualName.trim(),
        quantity: Math.max(1, Math.floor(manualQty)),
        unitCost: cost,
        unitSalePrice: sale
      })
    ]);
    setManualName("");
    setManualQty(1);
    setManualCost("");
    setManualSale("");
    setManualOpen(false);
  };

  const handleHomeToggle = (checked: boolean) => {
    onHomeServiceChange(checked);
    onLinesChange(ensureHomeDeliveryLine(lines, checked));
  };

  return (
    <div className="space-y-4">
      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-violet-500/30 bg-violet-950/20 px-4 py-3">
        <input
          type="checkbox"
          checked={isHomeService}
          onChange={(e) => handleHomeToggle(e.target.checked)}
          disabled={disabled}
          className="h-4 w-4 rounded border-slate-600 bg-slate-950 text-violet-500"
        />
        <span className="text-sm text-slate-200">
          Servicio a domicilio — añade concepto de 20 EUR (editable en la tabla)
        </span>
      </label>

      <CatalogBlock
        presetPickId={presetPickId}
        setPresetPickId={setPresetPickId}
        catalogQuery={catalogQuery}
        setCatalogQuery={setCatalogQuery}
        filteredPresets={filteredPresets}
        servicePresets={servicePresets}
        disabled={disabled}
        onAddPreset={(preset) => {
          addPreset(preset);
          setPresetPickId("");
        }}
      />

      <div className="rounded-xl border border-slate-800 bg-slate-950/40">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setManualOpen((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-slate-200"
        >
          + Añadir concepto manual
          <span className="text-slate-500">{manualOpen ? "▲" : "▼"}</span>
        </button>
        {manualOpen ? (
          <div className="border-t border-slate-800 px-4 pb-4 pt-3">
            <ManualConceptGrid
              manualName={manualName}
              setManualName={setManualName}
              manualQty={manualQty}
              setManualQty={setManualQty}
              manualCost={manualCost}
              setManualCost={setManualCost}
              manualSale={manualSale}
              setManualSale={setManualSale}
              disabled={disabled}
              onAdd={addManualLine}
            />
          </div>
        ) : null}
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-lg shadow-slate-950/40">
        <div className="border-b border-slate-800 px-3 py-2 md:px-4">
          <h3 className="text-sm font-semibold text-slate-100">Conceptos del servicio</h3>
          <p className="mt-0.5 text-xs text-slate-500">Edita cantidades y precios; el total se calcula automáticamente.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-200">
            <thead className="bg-slate-950/70 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className={TABLE_CELL}>Concepto</th>
                <th className={TABLE_CELL}>Cant.</th>
                <th className={TABLE_CELL}>Coste u.</th>
                <th className={TABLE_CELL}>Venta u.</th>
                <th className={`${TABLE_CELL} text-right`}>Total</th>
                <th className={`${TABLE_CELL} text-right`}>Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {lines.map((line) => (
                <tr
                  key={line.clientKey}
                  className={isHomeDeliveryLine(line) ? "bg-violet-950/25" : "hover:bg-slate-800/40"}
                >
                  <td className={TABLE_CELL}>
                    <input
                      value={line.name}
                      disabled={disabled || isHomeDeliveryLine(line)}
                      onChange={(e) => updateLine(line.clientKey, { name: e.target.value })}
                      className={`${INPUT} min-w-[10rem]`}
                      placeholder="Concepto"
                    />
                  </td>
                  <td className={TABLE_CELL}>
                    <input
                      type="number"
                      min={1}
                      value={line.quantity}
                      disabled={disabled}
                      onChange={(e) =>
                        updateLine(line.clientKey, {
                          quantity: Math.max(1, Number(e.target.value) || 1)
                        })
                      }
                      className={`${INPUT} w-20 tabular-nums`}
                    />
                  </td>
                  <td className={TABLE_CELL}>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={line.unitCost}
                      disabled={disabled}
                      onChange={(e) => {
                        const v = Number(e.target.value.replace(",", "."));
                        if (Number.isFinite(v) && v >= 0) updateLine(line.clientKey, { unitCost: v });
                      }}
                      className={`${INPUT} w-24 tabular-nums`}
                    />
                  </td>
                  <td className={TABLE_CELL}>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={line.unitSalePrice}
                      disabled={disabled}
                      onChange={(e) => {
                        const v = Number(e.target.value.replace(",", "."));
                        if (Number.isFinite(v) && v >= 0) updateLine(line.clientKey, { unitSalePrice: v });
                      }}
                      className={`${INPUT} w-24 tabular-nums`}
                    />
                  </td>
                  <td className={`${TABLE_CELL} text-right font-medium tabular-nums text-emerald-300/90`}>
                    {money(lineTotal(line))}
                  </td>
                  <td className={`${TABLE_CELL} text-right`}>
                    {lines.length > 1 && !disabled ? (
                      <button
                        type="button"
                        onClick={() => removeLine(line.clientKey)}
                        className={DESTRUCTIVE_BUTTON_SM}
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
      </section>
    </div>
  );
}

function CatalogBlock({
  presetPickId,
  setPresetPickId,
  catalogQuery,
  setCatalogQuery,
  filteredPresets,
  servicePresets,
  disabled,
  onAddPreset
}: {
  presetPickId: string;
  setPresetPickId: (id: string) => void;
  catalogQuery: string;
  setCatalogQuery: (q: string) => void;
  filteredPresets: ExtraTemplate[];
  servicePresets: ExtraTemplate[];
  disabled: boolean;
  onAddPreset: (preset: ExtraTemplate) => void;
}) {
  return (
    <div className="rounded-xl border border-indigo-500/25 bg-indigo-950/20 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-200/80">
        Catálogo de servicios
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
        <label className="flex min-w-[10rem] flex-1 flex-col gap-1 text-xs font-medium text-slate-400">
          Buscar
          <input
            value={catalogQuery}
            onChange={(e) => setCatalogQuery(e.target.value)}
            disabled={disabled}
            placeholder="Filtrar…"
            className={INPUT}
          />
        </label>
        <label className="flex min-w-[12rem] flex-1 flex-col gap-1 text-xs font-medium text-slate-400">
          Servicio
          <select
            value={presetPickId}
            onChange={(e) => setPresetPickId(e.target.value)}
            disabled={disabled || servicePresets.length === 0}
            className={INPUT}
          >
            <option value="">
              {servicePresets.length === 0 ? "Sin catálogo" : "Elegir servicio…"}
            </option>
            {filteredPresets.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} — {Number(t.defaultSalePrice).toFixed(2)} EUR
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={disabled || !presetPickId}
          className={PRIMARY_ACTION_BUTTON_COMPACT}
          onClick={() => {
            const preset = servicePresets.find((t) => t.id === presetPickId);
            if (!preset) return;
            onAddPreset(preset);
          }}
        >
          Añadir al servicio
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

function ManualConceptGrid({
  manualName,
  setManualName,
  manualQty,
  setManualQty,
  manualCost,
  setManualCost,
  manualSale,
  setManualSale,
  disabled,
  onAdd
}: {
  manualName: string;
  setManualName: (v: string) => void;
  manualQty: number;
  setManualQty: (n: number) => void;
  manualCost: string;
  setManualCost: (v: string) => void;
  manualSale: string;
  setManualSale: (v: string) => void;
  disabled: boolean;
  onAdd: () => void;
}) {
  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-300 sm:col-span-2">
          Descripción
          <input
            value={manualName}
            onChange={(e) => setManualName(e.target.value)}
            disabled={disabled}
            className={INPUT}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-300">
          Cantidad
          <input
            type="number"
            min={1}
            value={manualQty}
            onChange={(e) => setManualQty(Math.max(1, Number(e.target.value) || 1))}
            disabled={disabled}
            className={INPUT}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-300">
          Coste u. (opc.)
          <input
            value={manualCost}
            onChange={(e) => setManualCost(e.target.value)}
            disabled={disabled}
            placeholder="0"
            className={INPUT}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-300">
          Venta u.
          <input
            value={manualSale}
            onChange={(e) => setManualSale(e.target.value)}
            disabled={disabled}
            className={INPUT}
          />
        </label>
      </div>
      <button type="button" disabled={disabled} onClick={onAdd} className={`${PRIMARY_ACTION_BUTTON_COMPACT} mt-3`}>
        Añadir línea
      </button>
    </>
  );
}

