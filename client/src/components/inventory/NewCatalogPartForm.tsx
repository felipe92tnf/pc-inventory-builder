import { type FormEvent, useState } from "react";
import * as catalogApi from "../../api/catalog";
import { PART_CATEGORIES, partCategoryLabel, type PartCatalogEntry, type PartCategory } from "../../types/part";
import { SECONDARY_BUTTON_SM } from "../../theme/actionButtons";

type NewCatalogPartFormProps = {
  onSuccess?: (created: PartCatalogEntry) => void;
};

export function NewCatalogPartForm({ onSuccess }: NewCatalogPartFormProps) {
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [newSku, setNewSku] = useState("");
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<PartCategory>("OTHER");
  const [newBrand, setNewBrand] = useState("");
  const [newModel, setNewModel] = useState("");
  const [newDefaultCost, setNewDefaultCost] = useState(0);
  const [newDefaultSale, setNewDefaultSale] = useState(0);
  const [newNotes, setNewNotes] = useState("");

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
        defaultCostPrice: Math.max(0, newDefaultCost),
        defaultSalePrice: Math.max(0, newDefaultSale),
        notes: newNotes.trim() ? newNotes.trim() : null
      });
      setNewSku("");
      setNewName("");
      setNewCategory("OTHER");
      setNewBrand("");
      setNewModel("");
      setNewDefaultCost(0);
      setNewDefaultSale(0);
      setNewNotes("");
      onSuccess?.(created);
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "No se pudo crear la pieza en el catalogo.");
    } finally {
      setCreateSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/40 md:p-5">
      <h2 className="text-xl font-semibold text-slate-100">Nueva plantilla en el catálogo</h2>
      <p className="mt-2 text-sm text-slate-400">
        Define la pieza una sola vez (nombre, marca, modelo, categoría, SKU y precios recomendados). Luego añade
        stock físico en la pestaña «Añadir stock».
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
            Coste recomendado
            <input
              type="number"
              min={0}
              step="0.01"
              value={newDefaultCost}
              onChange={(e) => setNewDefaultCost(Number(e.target.value))}
              className="min-h-[40px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
            PVP recomendado
            <input
              type="number"
              min={0}
              step="0.01"
              value={newDefaultSale}
              onChange={(e) => setNewDefaultSale(Number(e.target.value))}
              className="min-h-[40px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring"
            />
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
