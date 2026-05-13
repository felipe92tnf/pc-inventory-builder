import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import * as extraTemplatesApi from "../api/extraTemplates";
import type { ExtraTemplate } from "../types/extraTemplate";
import {
  DESTRUCTIVE_BUTTON_SM,
  PRIMARY_ACTION_BUTTON,
  SECONDARY_BUTTON_SM
} from "../theme/actionButtons";
import { PAGE_HERO, PAGE_OUTER_7XL, SECTION_SHELL, TABLE_CELL } from "../theme/layoutDensity";

function money(n: number): string {
  return `${n.toFixed(2)} EUR`;
}

export type ExtraTemplatesPageProps = {
  /** Dentro de Inventario: sin envoltorio de página completa ni enlace «volver». */
  embedded?: boolean;
  /** Tras crear/editar/eliminar plantilla (p. ej. refrescar «Añadir stock» en inventario). */
  onTemplatesChanged?: () => void;
};

export function ExtraTemplatesPage({ embedded = false, onTemplatesChanged }: ExtraTemplatesPageProps) {
  const [rows, setRows] = useState<ExtraTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [defaultCostPrice, setDefaultCostPrice] = useState("");
  const [defaultSalePrice, setDefaultSalePrice] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await extraTemplatesApi.listExtraTemplates(false);
      setRows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    const cost = Number(defaultCostPrice.replace(",", ".").trim());
    const sale = Number(defaultSalePrice.replace(",", ".").trim());
    if (!name.trim()) {
      window.alert("Nombre obligatorio.");
      return;
    }
    if (!Number.isFinite(cost) || cost < 0 || !Number.isFinite(sale) || sale < 0) {
      window.alert("Indica coste y PVP por defecto validos.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await extraTemplatesApi.createExtraTemplate({
        name: name.trim(),
        description: description.trim() || null,
        category: category.trim() || null,
        defaultCostPrice: Math.round(cost * 100) / 100,
        defaultSalePrice: Math.round(sale * 100) / 100,
        active: true
      });
      setName("");
      setDescription("");
      setCategory("");
      setDefaultCostPrice("");
      setDefaultSalePrice("");
      await reload();
      onTemplatesChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (row: ExtraTemplate) => {
    setSaving(true);
    setError(null);
    try {
      await extraTemplatesApi.patchExtraTemplate(row.id, { active: !row.active });
      await reload();
      onTemplatesChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: ExtraTemplate) => {
    const ok = window.confirm(`Eliminar plantilla "${row.name}"? Las lineas existentes quedaran sin enlace.`);
    if (!ok) return;
    setSaving(true);
    setError(null);
    try {
      await extraTemplatesApi.deleteExtraTemplate(row.id);
      await reload();
      onTemplatesChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar.");
    } finally {
      setSaving(false);
    }
  };

  const intro = (
    <>
      {embedded ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-inner shadow-black/20 md:p-5">
          <h2 className="text-lg font-semibold text-slate-100">Plantillas extra</h2>
          <p className="mt-2 text-sm text-slate-400">
            Servicios y conceptos reutilizables sin inventario fisico (Windows, instalaciones, packs). Se usan en
            montajes, presupuestos y servicios.
          </p>
        </div>
      ) : (
        <section className={PAGE_HERO}>
          <h1 className="text-2xl font-bold">Plantillas extra</h1>
          <p className="mt-1 text-sm text-slate-300">
            Servicios y conceptos reutilizables sin inventario fisico (Windows, instalaciones, packs). Se usan en
            montajes, presupuestos y servicios.
          </p>
          <Link to="/" className="mt-4 inline-flex text-sm font-medium text-indigo-300 hover:text-indigo-200">
            ← Volver al inventario
          </Link>
        </section>
      )}

      {error ? (
        <div className="mb-4 rounded-xl border border-rose-800/70 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}
    </>
  );

  const body = (
    <>
      {intro}

      <section className={SECTION_SHELL}>
        <h2 className="text-lg font-semibold text-slate-100">Nueva plantilla</h2>
        <form onSubmit={(e) => void handleCreate(e)} className="mt-4 grid max-w-2xl grid-cols-1 gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-2">
            Nombre
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none focus:border-indigo-400 focus:ring"
              placeholder="Ej: Instalacion Windows 11"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-2">
            Descripcion
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none focus:border-indigo-400 focus:ring"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
            Categoria (texto libre)
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none focus:border-indigo-400 focus:ring"
              placeholder="SO, Instalacion, Software…"
            />
          </label>
          <div className="hidden md:block" />
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
            Coste por defecto (EUR)
            <input
              value={defaultCostPrice}
              onChange={(e) => setDefaultCostPrice(e.target.value)}
              required
              inputMode="decimal"
              className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none focus:border-indigo-400 focus:ring"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
            PVP por defecto (EUR)
            <input
              value={defaultSalePrice}
              onChange={(e) => setDefaultSalePrice(e.target.value)}
              required
              inputMode="decimal"
              className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none focus:border-indigo-400 focus:ring"
            />
          </label>
          <div className="md:col-span-2">
            <button type="submit" disabled={saving} className={PRIMARY_ACTION_BUTTON}>
              {saving ? "Guardando…" : "Crear plantilla"}
            </button>
          </div>
        </form>
      </section>

      <section className={`${SECTION_SHELL} mt-6`}>
        <h2 className="text-lg font-semibold text-slate-100">Listado</h2>
        {loading ? (
          <p className="mt-3 text-sm text-slate-400">Cargando…</p>
        ) : rows.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">No hay plantillas. Crea la primera arriba.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-xl border border-slate-800">
            <table className="min-w-full text-left text-sm text-slate-200">
              <thead className="bg-slate-950/70 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className={TABLE_CELL}>Nombre</th>
                  <th className={TABLE_CELL}>Categoria</th>
                  <th className={TABLE_CELL}>Coste</th>
                  <th className={TABLE_CELL}>PVP</th>
                  <th className={TABLE_CELL}>Activa</th>
                  <th className={`${TABLE_CELL} text-right`}>Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/40">
                    <td className={`${TABLE_CELL} font-medium text-slate-100`}>{r.name}</td>
                    <td className={`${TABLE_CELL} text-slate-400`}>{r.category?.trim() || "—"}</td>
                    <td className={TABLE_CELL}>{money(Number(r.defaultCostPrice))}</td>
                    <td className={TABLE_CELL}>{money(Number(r.defaultSalePrice))}</td>
                    <td className={TABLE_CELL}>{r.active ? "Si" : "No"}</td>
                    <td className={`${TABLE_CELL} text-right`}>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => void toggleActive(r)}
                        className={SECONDARY_BUTTON_SM}
                      >
                        {r.active ? "Desactivar" : "Activar"}
                      </button>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => void remove(r)}
                        className={`${DESTRUCTIVE_BUTTON_SM} ml-2`}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className={`${SECTION_SHELL} mt-6`}>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Herramientas</h2>
        <p className="mt-2 text-sm text-slate-400">
          <Link to="/sales/import" className="font-medium text-indigo-300 underline-offset-2 hover:text-indigo-200 hover:underline">
            Importación histórica de ventas (Excel e historial de lotes)
          </Link>
        </p>
      </section>
    </>
  );

  if (embedded) {
    return <div className="space-y-6">{body}</div>;
  }

  return <div className={PAGE_OUTER_7XL}>{body}</div>;
}
