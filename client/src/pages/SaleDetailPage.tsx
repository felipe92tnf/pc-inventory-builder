import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CustomerProfileLink } from "../components/customers/CustomerProfileLink";
import { BuildItemsTable } from "../components/builds/BuildItemsTable";
import { useSaleDetail } from "../hooks/useSaleDetail";
import { PRIMARY_ACTION_BUTTON } from "../theme/actionButtons";
import {
  SUMMARY_CARD_GRID_THREE,
  SUMMARY_CARD_LABEL,
  SUMMARY_CARD_SHELL,
  SUMMARY_VALUE_NEGATIVE,
  SUMMARY_VALUE_NEUTRAL,
  SUMMARY_VALUE_PROFIT_POS,
  SUMMARY_VALUE_REVENUE
} from "../theme/summaryCards";
import { PAGE_HERO, PAGE_OUTER_7XL, SECTION_SHELL } from "../theme/layoutDensity";
import { StatusBadge } from "../components/ui/StatusBadge";

function money(n: number): string {
  return `${n.toFixed(2)} EUR`;
}

function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
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
      <div className={PAGE_OUTER_7XL}>
        <div className="h-32 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60" />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {[1, 2, 3].map((k) => (
            <div key={k} className="h-24 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60" />
          ))}
        </div>
        <div className="h-56 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60" />
      </div>
    );
  }

  if (!sale) {
    return (
      <section className={SECTION_SHELL}>
        <p className="text-sm text-slate-300">{error ?? "Venta no encontrada."}</p>
        <Link to="/sales" className="mt-3 inline-flex text-sm font-medium text-indigo-300 hover:text-indigo-200">
          Volver a ventas
        </Link>
      </section>
    );
  }

  const b = sale.build;

  return (
    <div className={PAGE_OUTER_7XL}>
      <section className={PAGE_HERO}>
        <div className="flex flex-wrap items-start justify-between gap-2.5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Venta · {b.name}</h1>
            <p className="mt-1 text-sm text-slate-300">
              Cliente: <span className="font-medium text-slate-100">{sale.customerName}</span>
            </p>
          </div>
          <StatusBadge variant="sold" size="detail">
            Vendido
          </StatusBadge>
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
          <CustomerProfileLink
            customerName={sale.customerName}
            customerPhone={sale.customerPhone}
            className="rounded-full border border-slate-600 bg-slate-950/60 px-3 py-1 text-xs font-medium text-indigo-200 hover:bg-slate-800"
          >
            Ficha cliente
          </CustomerProfileLink>
          {sale.paymentMethod ? (
            <StatusBadge variant="meta" size="detail" className="font-medium">
              {sale.paymentMethod}
            </StatusBadge>
          ) : null}
          {sale.warrantyMonths != null ? (
            <StatusBadge variant="completed" size="detail" className="font-medium">
              Garantia {sale.warrantyMonths} meses
            </StatusBadge>
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

      <section className={SUMMARY_CARD_GRID_THREE}>
        <article className={SUMMARY_CARD_SHELL}>
          <p className={SUMMARY_CARD_LABEL}>Coste</p>
          <p className={SUMMARY_VALUE_NEUTRAL}>{money(sale.totalCost)}</p>
        </article>
        <article className={SUMMARY_CARD_SHELL}>
          <p className={SUMMARY_CARD_LABEL}>Precio venta</p>
          <p className={SUMMARY_VALUE_REVENUE}>{money(sale.finalSalePrice)}</p>
        </article>
        <article className={SUMMARY_CARD_SHELL}>
          <p className={SUMMARY_CARD_LABEL}>Beneficio</p>
          <p className={sale.profit >= 0 ? SUMMARY_VALUE_PROFIT_POS : SUMMARY_VALUE_NEGATIVE}>{money(sale.profit)}</p>
        </article>
      </section>

      <section className={SECTION_SHELL}>
        <h2 className="text-lg font-semibold text-slate-100">Editar datos de la venta</h2>
        <p className="mt-1 text-sm text-slate-400">
          Modifica cliente, precio o condiciones. El beneficio se recalcula si cambias el precio final.
        </p>

        <form onSubmit={handleSave} className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
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
              className={PRIMARY_ACTION_BUTTON}
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
