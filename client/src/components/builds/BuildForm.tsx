import { useState, type FormEvent } from "react";
import { PRIMARY_ACTION_BUTTON } from "../../theme/actionButtons";

type BuildFormProps = {
  loading: boolean;
  title: string;
  submitLabel: string;
  loadingLabel: string;
  initialValues?: { name: string; notes: string };
  onCancel?: () => void;
  onSubmit: (values: { name: string; notes: string }) => Promise<void>;
};

export function BuildForm({
  loading,
  title,
  submitLabel,
  loadingLabel,
  initialValues,
  onCancel,
  onSubmit
}: BuildFormProps) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [notes, setNotes] = useState(initialValues?.notes ?? "");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit({ name, notes });
    if (!initialValues) {
      setName("");
      setNotes("");
    }
  };

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg shadow-slate-950/40">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-1.5 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
          >
            Cancelar
          </button>
        ) : null}
      </div>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-2">
          Nombre del montaje
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring"
            placeholder="Gaming 1080p, Oficina Pro, Edicion..."
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-2">
          Descripcion
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 placeholder:text-slate-500 focus:border-indigo-400 focus:ring"
            placeholder="Uso previsto, observaciones, accesorios..."
          />
        </label>

        <div className="md:col-span-2">
          <button type="submit" disabled={loading} className={PRIMARY_ACTION_BUTTON}>
            {loading ? loadingLabel : submitLabel}
          </button>
        </div>
      </form>
    </section>
  );
}
