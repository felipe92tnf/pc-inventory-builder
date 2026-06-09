import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { deleteCustomer, listCustomers, patchCustomer } from "../api/customers";
import type { CustomerListItem } from "../types/customer";
import { PAGE_HERO, PAGE_OUTER_7XL, SECTION_SHELL, TABLE_CELL } from "../theme/layoutDensity";
import {
  DESTRUCTIVE_BUTTON_SM,
  ORANGE_EDIT_BUTTON_SM,
  PRIMARY_ACTION_BUTTON_COMPACT,
  SECONDARY_BUTTON_SM,
  SECONDARY_GHOST_SM
} from "../theme/actionButtons";

function money(n: number): string {
  return `${n.toFixed(2)} EUR`;
}

type CustomerSort =
  | "NAME_ASC"
  | "NAME_DESC"
  | "TOTAL_DESC"
  | "TOTAL_ASC"
  | "WORK_DESC"
  | "WORK_ASC"
  | "RECENT_DESC"
  | "OLDEST";

const SORT_OPTIONS: { value: CustomerSort; label: string }[] = [
  { value: "NAME_ASC", label: "Nombre A-Z" },
  { value: "NAME_DESC", label: "Nombre Z-A" },
  { value: "TOTAL_DESC", label: "Mas total generado" },
  { value: "TOTAL_ASC", label: "Menos total generado" },
  { value: "WORK_DESC", label: "Mas trabajos" },
  { value: "WORK_ASC", label: "Menos trabajos" },
  { value: "RECENT_DESC", label: "Mas recientes" },
  { value: "OLDEST", label: "Mas antiguos" }
];

function sortCustomers(rows: CustomerListItem[], sort: CustomerSort): CustomerListItem[] {
  const copy = [...rows];
  const nameCmp = (a: CustomerListItem, b: CustomerListItem) =>
    a.name.localeCompare(b.name, "es", { sensitivity: "base" });
  const dateCmp = (a: CustomerListItem, b: CustomerListItem) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();

  copy.sort((a, b) => {
    switch (sort) {
      case "NAME_ASC":
        return nameCmp(a, b);
      case "NAME_DESC":
        return nameCmp(b, a);
      case "TOTAL_DESC":
        return b.totalSpent - a.totalSpent || nameCmp(a, b);
      case "TOTAL_ASC":
        return a.totalSpent - b.totalSpent || nameCmp(a, b);
      case "WORK_DESC":
        return b.workCount - a.workCount || nameCmp(a, b);
      case "WORK_ASC":
        return a.workCount - b.workCount || nameCmp(a, b);
      case "RECENT_DESC":
        return dateCmp(b, a);
      case "OLDEST":
        return dateCmp(a, b);
      default:
        return 0;
    }
  });
  return copy;
}

const INPUT =
  "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring";

export function CustomersPage() {
  const [rows, setRows] = useState<CustomerListItem[]>([]);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<CustomerSort>("RECENT_DESC");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [editing, setEditing] = useState<CustomerListItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listCustomers(query);
      setRows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron cargar los clientes.");
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    const t = setTimeout(() => void load(), query.trim() ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, query]);

  const sortedRows = useMemo(() => sortCustomers(rows, sort), [rows, sort]);

  const openEdit = (c: CustomerListItem) => {
    setEditing(c);
    setEditName(c.name);
    setEditPhone(c.phone);
    setEditNotes(c.notes ?? "");
    setError(null);
  };

  const closeEdit = () => {
    if (savingEdit) return;
    setEditing(null);
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    const name = editName.trim();
    if (!name) {
      window.alert("Indica el nombre del cliente.");
      return;
    }
    setSavingEdit(true);
    setError(null);
    try {
      await patchCustomer(editing.id, {
        name,
        phone: editPhone.trim(),
        notes: editNotes.trim() === "" ? null : editNotes.trim()
      });
      setEditing(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar el cliente.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (c: CustomerListItem) => {
    const ok = window.confirm(
      `¿Eliminar al cliente "${c.name}"?\n\nSolo se permite si no tiene presupuestos, servicios, montajes ni ventas asociados.`
    );
    if (!ok) return;
    setActionId(c.id);
    setError(null);
    try {
      await deleteCustomer(c.id);
      if (editing?.id === c.id) setEditing(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo eliminar el cliente.");
    } finally {
      setActionId(null);
    }
  };

  const actionButtons = (c: CustomerListItem, compact?: boolean) => (
    <div className={`flex flex-wrap gap-1 ${compact ? "mt-2" : "justify-end"}`}>
      <Link
        to={`/customers/${c.id}`}
        className={`${SECONDARY_GHOST_SM} ${compact ? "flex-1 justify-center py-2" : ""}`}
      >
        Ver
      </Link>
      <button
        type="button"
        disabled={actionId === c.id || savingEdit}
        onClick={() => openEdit(c)}
        className={`${ORANGE_EDIT_BUTTON_SM} ${compact ? "flex-1 justify-center py-2" : ""}`}
      >
        Editar
      </button>
      <button
        type="button"
        disabled={actionId === c.id || savingEdit}
        onClick={() => void handleDelete(c)}
        className={`${DESTRUCTIVE_BUTTON_SM} ${compact ? "flex-1 justify-center py-2" : ""}`}
      >
        {actionId === c.id ? "Eliminando…" : "Eliminar"}
      </button>
    </div>
  );

  return (
    <div className={PAGE_OUTER_7XL}>
      <section className={PAGE_HERO}>
        <h1 className="text-3xl font-bold tracking-tight text-slate-100">Clientes</h1>
        <p className="mt-1 text-sm text-slate-400">
          Fichas reutilizables. Se crean al guardar un presupuesto, montaje o servicio, o desde el buscador de
          cliente.
        </p>
      </section>

      <section className={`${SECTION_SHELL} mb-4`}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-200">
            Buscar
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nombre o telefono..."
              className={INPUT}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-200">
            Ordenar
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as CustomerSort)}
              className={INPUT}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {error ? (
        <div className="mb-4 rounded-xl border border-rose-800/70 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <section className={SECTION_SHELL}>
        {loading ? (
          <div className="h-32 animate-pulse rounded-xl bg-slate-900/60" />
        ) : sortedRows.length === 0 ? (
          <p className="text-sm text-slate-500">Ningun cliente encontrado.</p>
        ) : (
          <>
            <div className="hidden overflow-x-auto rounded-xl border border-slate-800 md:block">
              <table className="min-w-full text-left text-sm text-slate-200">
                <thead className="bg-slate-950/80 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className={TABLE_CELL}>Nombre</th>
                    <th className={TABLE_CELL}>Telefono</th>
                    <th className={TABLE_CELL}>Trabajos</th>
                    <th className={TABLE_CELL}>Total generado</th>
                    <th className={`${TABLE_CELL} text-right`}>Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {sortedRows.map((c) => (
                    <tr key={c.id} className="transition hover:bg-slate-800/40">
                      <td className={`${TABLE_CELL} font-medium text-slate-100`}>{c.name}</td>
                      <td className={TABLE_CELL}>{c.phone || "—"}</td>
                      <td className={TABLE_CELL}>{c.workCount}</td>
                      <td className={`${TABLE_CELL} text-emerald-300/95`}>{money(c.totalSpent)}</td>
                      <td className={TABLE_CELL}>{actionButtons(c)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="space-y-3 md:hidden">
              {sortedRows.map((c) => (
                <li key={c.id} className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                  <p className="font-semibold text-slate-100">{c.name}</p>
                  <p className="mt-0.5 text-sm text-slate-400">{c.phone || "Sin telefono"}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {c.workCount} trabajos · {money(c.totalSpent)} total generado
                  </p>
                  {actionButtons(c, true)}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {editing ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Cerrar"
            className="absolute inset-0 bg-black/75 backdrop-blur-[2px]"
            onClick={closeEdit}
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl shadow-black/60"
          >
            <h2 className="text-lg font-semibold text-slate-100">Editar cliente</h2>
            <p className="mt-1 text-sm text-slate-400">Nombre, telefono y notas internas.</p>
            <div className="mt-4 space-y-3">
              <label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
                Nombre
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  disabled={savingEdit}
                  className={INPUT}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
                Telefono
                <input
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  disabled={savingEdit}
                  className={INPUT}
                  placeholder="Opcional"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
                Notas
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  disabled={savingEdit}
                  rows={3}
                  className={`${INPUT} min-h-[72px]`}
                  placeholder="Notas internas (opcional)"
                />
              </label>
            </div>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button type="button" disabled={savingEdit} onClick={closeEdit} className={SECONDARY_BUTTON_SM}>
                Cancelar
              </button>
              <button
                type="button"
                disabled={savingEdit}
                onClick={() => void handleSaveEdit()}
                className={PRIMARY_ACTION_BUTTON_COMPACT}
              >
                {savingEdit ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
