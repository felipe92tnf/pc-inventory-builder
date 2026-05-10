import { useEffect, useState, type FormEvent } from "react";
import * as salesApi from "../../api/sales";
import type { CreateSaleFromBuildPayload, SaleDetail } from "../../types/sale";

type RegisterSaleFormProps = {
  buildId: string;
  suggestedSalePrice: number;
  disabled?: boolean;
  onSuccess: (sale: SaleDetail) => void;
  /** "card" = seccion completa; "plain" = solo formulario (p. ej. dentro de un modal) */
  variant?: "card" | "plain";
  submitLabel?: string;
};

export function RegisterSaleForm({
  buildId,
  suggestedSalePrice,
  disabled,
  onSuccess,
  variant = "card",
  submitLabel
}: RegisterSaleFormProps) {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [finalPrice, setFinalPrice] = useState(() => suggestedSalePrice.toFixed(2));
  const [paymentMethod, setPaymentMethod] = useState("");
  const [warrantyMonths, setWarrantyMonths] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setFinalPrice(suggestedSalePrice.toFixed(2));
  }, [suggestedSalePrice]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const name = customerName.trim();
    const phone = customerPhone.trim();
    if (!name || !phone) {
      window.alert("Nombre y telefono del cliente son obligatorios.");
      return;
    }
    const normalized = Number(finalPrice.replace(",", ".").trim());
    if (!Number.isFinite(normalized) || normalized < 0) {
      window.alert("Introduce un precio de venta valido.");
      return;
    }

    const payload: CreateSaleFromBuildPayload = {
      customerName: name,
      customerPhone: phone,
      customerEmail: customerEmail.trim() ? customerEmail.trim() : undefined,
      finalSalePrice: Math.round(normalized * 100) / 100,
      paymentMethod: paymentMethod.trim() ? paymentMethod.trim() : undefined,
      warrantyMonths:
        warrantyMonths.trim() === "" ? undefined : Math.max(0, parseInt(warrantyMonths, 10) || 0),
      notes: notes.trim() ? notes.trim() : undefined
    };

    setSubmitting(true);
    try {
      const sale = await salesApi.createSaleFromBuild(buildId, payload);
      onSuccess(sale);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "No se pudo registrar la venta.");
    } finally {
      setSubmitting(false);
    }
  };

  const form = (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <label className="flex flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-2">
        Nombre del cliente
        <input
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          disabled={disabled || submitting}
          required
          className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring disabled:opacity-50"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
        Telefono
        <input
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
          disabled={disabled || submitting}
          required
          className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring disabled:opacity-50"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
        Email (opcional)
        <input
          type="email"
          value={customerEmail}
          onChange={(e) => setCustomerEmail(e.target.value)}
          disabled={disabled || submitting}
          className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring disabled:opacity-50"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
        Precio final de venta (EUR)
        <input
          value={finalPrice}
          onChange={(e) => setFinalPrice(e.target.value)}
          disabled={disabled || submitting}
          inputMode="decimal"
          className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring disabled:opacity-50"
        />
        <span className="text-xs font-normal text-slate-500">
          Por defecto: precio de venta del montaje ({suggestedSalePrice.toFixed(2)} EUR).
        </span>
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
        Metodo de pago (opcional)
        <input
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          disabled={disabled || submitting}
          placeholder="Efectivo, transferencia, Bizum..."
          className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 placeholder:text-slate-500 focus:border-indigo-400 focus:ring disabled:opacity-50"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
        Garantia (meses, opcional)
        <input
          type="number"
          min={0}
          step={1}
          value={warrantyMonths}
          onChange={(e) => setWarrantyMonths(e.target.value)}
          disabled={disabled || submitting}
          className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring disabled:opacity-50"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-2">
        Notas (opcional)
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={disabled || submitting}
          rows={2}
          className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 placeholder:text-slate-500 focus:border-indigo-400 focus:ring disabled:opacity-50"
        />
      </label>

      <div className="md:col-span-2">
        <button
          type="submit"
          disabled={disabled || submitting}
          className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan-900/30 transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Registrando..." : submitLabel ?? "Registrar venta"}
        </button>
      </div>
    </form>
  );

  if (variant === "plain") {
    return form;
  }

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg shadow-slate-950/40">
      <h2 className="text-lg font-semibold text-slate-100">Registrar venta</h2>
      <p className="mt-1 text-sm text-slate-400">
        El montaje esta ensamblado. Completa los datos del cliente y confirma el precio final de venta.
      </p>
      <div className="mt-4">{form}</div>
    </section>
  );
}
