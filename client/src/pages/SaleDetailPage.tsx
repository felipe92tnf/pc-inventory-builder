import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { BuildItemsTable } from "../components/builds/BuildItemsTable";
import { useSaleDetail } from "../hooks/useSaleDetail";

function money(n: number): string {
  return `${n.toFixed(2)} EUR`;
}

function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function profitClass(value: number): string {
  return value >= 0 ? "text-emerald-400" : "text-rose-400";
}

export function SaleDetailPage() {
  const { id } = useParams();
  const saleId = String(id ?? "");
  const navigate = useNavigate();
  const { sale, loading, saving, error, reload, updateSale, removeSale } = useSaleDetail(saleId);

  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editPayment, setEditPayment] = useState("");
  const [editWarranty, setEditWarranty] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editSoldAt, setEditSoldAt] = useState("");

  useEffect(() => {
    if (!sale) return;
    setEditName(sale.customerName);
    setEditPhone(sale.customerPhone);
    setEditEmail(sale.customerEmail ?? "");
    setEditPrice(sale.finalSalePrice.toFixed(2));
    setEditPayment(sale.paymentMethod ?? "");
    setEditWarranty(sale.warrantyMonths != null ? String(sale.warrantyMonths) : "");
    setEditNotes(sale.notes ?? "");
    setEditSoldAt(toDatetimeLocalValue(sale.soldAt));
  }, [sale]);

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!sale) return;
    const normalized = Number(editPrice.replace(",", ".").trim());
    if (!Number.isFinite(normalized) || normalized < 0) {
      window.alert("Precio final invalido.");
      return;
    }
    const soldDate = new Date(editSoldAt);
    if (Number.isNaN(soldDate.getTime())) {
      window.alert("Fecha de venta invalida.");
      return;
    }
    await updateSale({
      customerName: editName.trim(),
      customerPhone: editPhone.trim(),
      customerEmail: editEmail.trim() ? editEmail.trim() : null,
      finalSalePrice: Math.round(normalized * 100) / 100,
      paymentMethod: editPayment.trim() ? editPayment.trim() : null,
      warrantyMonths:
        editWarranty.trim() === "" ? null : Math.max(0, parseInt(editWarranty, 10) || 0),
      notes: editNotes.trim() ? editNotes.trim() : null,
      soldAt: soldDate.toISOString()
    });
  };

  const handleDeleteSale = async () => {
    if (!sale) return;
    const ok = window.confirm(
      "Eliminar esta venta? El montaje volvera al estado ensamblado (assembled) y podras registrar otra venta mas adelante."
    );
    if (!ok) return;
    try {
      await removeSale();
      void navigate(`/builds/${sale.buildId}`);
    } catch {
      /* error shown via hook */
    }
  };

  if (!id) {
    return (
      <section className="rounded-2xl border border-rose-800/70 bg-rose-950/40 p-6 text-rose-200">
        ID de venta invalido.
      </section>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 px-2 pb-8 md:px-4">
        <div className="h-36 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[1, 2, 3].map((k) => (
            <div key={k} className="h-28 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60" />
      </div>
    );
  }

  if (!sale) {
    return (
      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg shadow-slate-950/40">
        <p className="text-sm text-slate-300">{error ?? "Venta no encontrada."}</p>
        <Link to="/sales" className="mt-4 inline-flex text-sm font-medium text-indigo-300 hover:text-indigo-200">
          Volver a ventas
        </Link>
      </section>
    );
  }

  const b = sale.build;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-2 pb-8 text-slate-100 md:px-4">
      <section className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 shadow-[0_20px_50px_-24px_rgba(79,70,229,0.75)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Venta · {b.name}</h1>
            <p className="mt-1 text-sm text-slate-300">
              Cliente: <span className="font-medium text-slate-100">{sale.customerName}</span>
            </p>
          </div>
          <span className="rounded-full border border-cyan-500/40 bg-cyan-500/15 px-2.5 py-1 text-xs font-semibold text-cyan-300">
            Vendido
          </span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to="/sales"
            className="rounded-full border border-slate-600 bg-slate-950/60 px-3 py-1 text-xs font-medium text-slate-200 hover:bg-slate-800"
          >
            Ventas
          </Link>
          <Link
            to={`/builds/${b.id}`}
            className="rounded-full border border-slate-600 bg-slate-950/60 px-3 py-1 text-xs font-medium text-slate-200 hover:bg-slate-800"
          >
            Montaje
          </Link>
          {sale.paymentMethod ? (
            <span className="rounded-full border border-indigo-500/35 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-200">
              {sale.paymentMethod}
            </span>
          ) : null}
          {sale.warrantyMonths != null ? (
            <span className="rounded-full border border-emerald-500/35 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200">
              Garantia {sale.warrantyMonths} meses
            </span>
          ) : null}
        </div>
      </section>

      {error ? (
        <div className="rounded-xl border border-rose-800/70 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">
          {error}
          <button
            type="button"
            onClick={() => {
              void reload();
            }}
            className="ml-3 rounded-lg border border-rose-700 px-2 py-1 text-xs font-semibold text-rose-100"
          >
            Reintentar
          </button>
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg shadow-slate-950/40">
          <p className="text-xs uppercase tracking-wide text-slate-400">Coste (instantanea)</p>
          <p className="mt-2 text-2xl font-bold text-slate-100">{money(sale.totalCost)}</p>
        </article>
        <article className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg shadow-slate-950/40">
          <p className="text-xs uppercase tracking-wide text-slate-400">Precio venta final</p>
          <p className="mt-2 text-2xl font-bold text-emerald-400">{money(sale.finalSalePrice)}</p>
        </article>
        <article className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg shadow-slate-950/40">
          <p className="text-xs uppercase tracking-wide text-slate-400">Beneficio</p>
          <p className={`mt-2 text-2xl font-bold ${profitClass(sale.profit)}`}>{money(sale.profit)}</p>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg shadow-slate-950/40">
        <h2 className="text-lg font-semibold text-slate-100">Editar datos de la venta</h2>
        <p className="mt-1 text-sm text-slate-400">
          Modifica cliente, precio o condiciones. El beneficio se recalcula si cambias el precio final.
        </p>

        <form onSubmit={handleSave} className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-2">
            Nombre del cliente
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              disabled={saving}
              className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring disabled:opacity-50"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
            Telefono
            <input
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              disabled={saving}
              className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring disabled:opacity-50"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
            Email
            <input
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              disabled={saving}
              className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring disabled:opacity-50"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
            Precio final (EUR)
            <input
              value={editPrice}
              onChange={(e) => setEditPrice(e.target.value)}
              disabled={saving}
              inputMode="decimal"
              className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring disabled:opacity-50"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
            Fecha y hora de venta
            <input
              type="datetime-local"
              value={editSoldAt}
              onChange={(e) => setEditSoldAt(e.target.value)}
              disabled={saving}
              className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring disabled:opacity-50"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-2">
            Metodo de pago
            <input
              value={editPayment}
              onChange={(e) => setEditPayment(e.target.value)}
              disabled={saving}
              placeholder="Efectivo, Bizum, transferencia..."
              className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 placeholder:text-slate-500 focus:border-indigo-400 focus:ring disabled:opacity-50"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
            Garantia (meses)
            <input
              type="number"
              min={0}
              value={editWarranty}
              onChange={(e) => setEditWarranty(e.target.value)}
              disabled={saving}
              className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring disabled:opacity-50"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-2">
            Notas
            <textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              disabled={saving}
              rows={3}
              className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring disabled:opacity-50"
            />
          </label>
          <div className="flex flex-wrap gap-2 md:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                void handleDeleteSale();
              }}
              className="rounded-lg border border-rose-500/50 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20 disabled:opacity-50"
            >
              Eliminar venta
            </button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">Piezas del montaje</h2>
        <BuildItemsTable items={b.items} status="SOLD" actionLoading={false} onRemove={async () => {}} />
        <p className="mt-2 text-xs text-slate-500">
          Referencia del configuracion vendido; no se pueden modificar lineas desde aqui.
        </p>
      </section>
    </div>
  );
}
