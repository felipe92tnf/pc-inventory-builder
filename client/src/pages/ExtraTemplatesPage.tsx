import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import * as extraTemplatesApi from "../api/extraTemplates";
import type { ExtraTemplate } from "../types/extraTemplate";
import { SERVICE_CATALOG_CATEGORY, isServiceCatalogCategory } from "../constants/serviceCatalog";
import { seedDefaultServiceCatalog } from "../utils/serviceCatalogSeed";
import {
  DESTRUCTIVE_BUTTON_SM,
  ORANGE_EDIT_BUTTON_SM,
  PRIMARY_ACTION_BUTTON,
  SECONDARY_BUTTON_SM
} from "../theme/actionButtons";
import { PAGE_HERO, PAGE_OUTER_7XL, SECTION_SHELL, TABLE_CELL } from "../theme/layoutDensity";

function money(n: number): string {
  return `${n.toFixed(2)} EUR`;
}

export type ExtraTemplatesPageMode = "extra" | "service";

export type ExtraTemplatesPageProps = {
  embedded?: boolean;
  onTemplatesChanged?: () => void;
  /** `extra`: plantillas montajes/presupuestos. `service`: catálogo de servicios técnicos. */
  mode?: ExtraTemplatesPageMode;
};

function parsePrice(raw: string, optional: boolean): number | null {
  const t = raw.replace(",", ".").trim();
  if (t === "") return optional ? 0 : null;
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100) / 100;
}

export function ExtraTemplatesPage({
  embedded = false,
  onTemplatesChanged,
  mode = "extra"
}: ExtraTemplatesPageProps) {
  const isServiceMode = mode === "service";

  const [allRows, setAllRows] = useState<ExtraTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [defaultCostPrice, setDefaultCostPrice] = useState("");
  const [defaultSalePrice, setDefaultSalePrice] = useState("");

  const rows = useMemo(() => {
    if (isServiceMode) return allRows.filter((r) => isServiceCatalogCategory(r.category));
    return allRows.filter((r) => !isServiceCatalogCategory(r.category));
  }, [allRows, isServiceMode]);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setCategory("");
    setDefaultCostPrice("");
    setDefaultSalePrice("");
  };

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await extraTemplatesApi.listExtraTemplates(false);
      setAllRows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const startEdit = (row: ExtraTemplate) => {
    setEditingId(row.id);
    setName(row.name);
    setDescription(row.description ?? "");
    setCategory(row.category ?? "");
    setDefaultCostPrice(String(Number(row.defaultCostPrice)));
    setDefaultSalePrice(String(Number(row.defaultSalePrice)));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const cost = parsePrice(defaultCostPrice, isServiceMode);
    const sale = parsePrice(defaultSalePrice, false);
    if (!name.trim()) {
      window.alert("Nombre obligatorio.");
      return;
    }
    if (cost === null || sale === null) {
      window.alert(isServiceMode ? "Indica un PVP valido (coste opcional)." : "Indica coste y PVP validos.");
      return;
    }

    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      category: isServiceMode ? SERVICE_CATALOG_CATEGORY : category.trim() || null,
      defaultCostPrice: cost,
      defaultSalePrice: sale,
      active: true
    };

    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await extraTemplatesApi.patchExtraTemplate(editingId, payload);
      } else {
        await extraTemplatesApi.createExtraTemplate(payload);
      }
      resetForm();
      await reload();
      onTemplatesChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  };

  const handleSeedDefaults = async () => {
    setSaving(true);
    setError(null);
    try {
      const created = await seedDefaultServiceCatalog();
      await reload();
      onTemplatesChanged?.();
      window.alert(
        created > 0
          ? `Se han añadido ${created} servicio(s) al catálogo.`
          : "El catálogo ya contiene los servicios sugeridos."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar el catálogo sugerido.");
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
    const label = isServiceMode ? "servicio" : "plantilla";
    const ok = window.confirm(`Eliminar ${label} "${row.name}"? Las lineas existentes quedaran sin enlace.`);
    if (!ok) return;
    setSaving(true);
    setError(null);
    try {
      await extraTemplatesApi.deleteExtraTemplate(row.id);
      if (editingId === row.id) resetForm();
      await reload();
      onTemplatesChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar.");
    } finally {
      setSaving(false);
    }
  };

  const introTitle = isServiceMode ? "Catálogo de servicios" : "Plantillas extra";
  const introText = isServiceMode
    ? "Servicios técnicos frecuentes con precio base. No consumen stock ni aparecen como piezas físicas. Al registrar un servicio puedes elegirlos y ajustar el precio en cada caso."
    : "Conceptos reutilizables sin inventario físico (Windows, packs, extras de montaje). Se usan en montajes y presupuestos.";

  const intro = (
    <>
      {embedded ? (
        <EmbeddedIntro title={introTitle} text={introText} />
      ) : (
        <section className={PAGE_HERO}>
          <h1 className="text-2xl font-bold">{introTitle}</h1>
          <p className="mt-1 text-sm text-slate-300">{introText}</p>
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
        <h2 className="text-lg font-semibold text-slate-100">
          {editingId ? "Editar" : "Nuevo"} {isServiceMode ? "servicio" : "plantilla"}
        </h2>
        <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 grid max-w-2xl grid-cols-1 gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-2">
            Nombre
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none focus:border-indigo-400 focus:ring"
              placeholder={isServiceMode ? "Ej: Formateo" : "Ej: Instalacion Windows 11"}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-2">
            Descripcion (opcional)
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none focus:border-indigo-400 focus:ring"
            />
          </label>
          {!isServiceMode ? (
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
              Categoria (texto libre)
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none focus:border-indigo-400 focus:ring"
                placeholder="SO, Instalacion, Software…"
              />
            </label>
          ) : null}
          {!isServiceMode ? <div className="hidden md:block" /> : null}
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
            {isServiceMode ? "Coste interno opcional (EUR)" : "Coste por defecto (EUR)"}
            <input
              value={defaultCostPrice}
              onChange={(e) => setDefaultCostPrice(e.target.value)}
              required={!isServiceMode}
              inputMode="decimal"
              placeholder={isServiceMode ? "0" : undefined}
              className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none focus:border-indigo-400 focus:ring"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
            PVP base (EUR)
            <input
              value={defaultSalePrice}
              onChange={(e) => setDefaultSalePrice(e.target.value)}
              required
              inputMode="decimal"
              className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none focus:border-indigo-400 focus:ring"
            />
          </label>
          <div className="flex flex-wrap gap-2 md:col-span-2">
            <button type="submit" disabled={saving} className={PRIMARY_ACTION_BUTTON}>
              {saving ? "Guardando…" : editingId ? "Guardar cambios" : isServiceMode ? "Añadir servicio" : "Crear plantilla"}
            </button>
            {editingId ? (
              <button type="button" disabled={saving} onClick={resetForm} className={SECONDARY_BUTTON_SM}>
                Cancelar edicion
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className={`${SECTION_SHELL} mt-6`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-100">Listado</h2>
          {isServiceMode ? (
            <button
              type="button"
              disabled={saving || loading}
              onClick={() => void handleSeedDefaults()}
              className={SECONDARY_BUTTON_SM}
            >
              Cargar servicios sugeridos
            </button>
          ) : null}
        </div>
        {loading ? (
          <p className="mt-3 text-sm text-slate-400">Cargando…</p>
        ) : rows.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">
            {isServiceMode
              ? "No hay servicios en el catálogo. Crea uno arriba o usa «Cargar servicios sugeridos»."
              : "No hay plantillas. Crea la primera arriba."}
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-xl border border-slate-800">
            <table className="min-w-full text-left text-sm text-slate-200">
              <thead className="bg-slate-950/70 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className={TABLE_CELL}>Nombre</th>
                  {!isServiceMode ? <th className={TABLE_CELL}>Categoria</th> : null}
                  <th className={TABLE_CELL}>Coste</th>
                  <th className={TABLE_CELL}>PVP</th>
                  <th className={TABLE_CELL}>Activo</th>
                  <th className={`${TABLE_CELL} text-right`}>Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {rows.map((r) => (
                  <tr key={r.id} className={editingId === r.id ? "bg-indigo-950/30" : "hover:bg-slate-800/40"}>
                    <td className={`${TABLE_CELL} font-medium text-slate-100`}>
                      {r.name}
                      {r.description?.trim() ? (
                        <p className="mt-0.5 text-xs font-normal text-slate-500">{r.description}</p>
                      ) : null}
                    </td>
                    {!isServiceMode ? (
                      <td className={`${TABLE_CELL} text-slate-400`}>{r.category?.trim() || "—"}</td>
                    ) : null}
                    <td className={TABLE_CELL}>{money(Number(r.defaultCostPrice))}</td>
                    <td className={TABLE_CELL}>{money(Number(r.defaultSalePrice))}</td>
                    <td className={TABLE_CELL}>{r.active ? "Si" : "No"}</td>
                    <td className={`${TABLE_CELL} text-right`}>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => startEdit(r)}
                        className={ORANGE_EDIT_BUTTON_SM}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => void toggleActive(r)}
                        className={`${SECONDARY_BUTTON_SM} ml-2`}
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

      {!isServiceMode ? (
        <section className={`${SECTION_SHELL} mt-6`}>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Herramientas</h2>
          <p className="mt-2 text-sm text-slate-400">
            <Link
              to="/sales/import"
              className="font-medium text-indigo-300 underline-offset-2 hover:text-indigo-200 hover:underline"
            >
              Importación histórica de ventas (Excel e historial de lotes)
            </Link>
          </p>
        </section>
      ) : null}
    </>
  );

  if (embedded) {
    return <div className="space-y-6">{body}</div>;
  }

  return <div className={PAGE_OUTER_7XL}>{body}</div>;
}

function EmbeddedIntro({
  title,
  text
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-inner shadow-black/20 md:p-5">
      <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
      <p className="mt-2 text-sm text-slate-400">{text}</p>
    </div>
  );
}

