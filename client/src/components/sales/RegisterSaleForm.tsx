import { useEffect, useState, type FormEvent } from "react";
import * as salesApi from "../../api/sales";
import type { CreateSaleFromBuildPayload, SaleDetail } from "../../types/sale";
import { CustomerPicker, emptyCustomerFields } from "../customers/CustomerPicker";
import type { CustomerFieldValue } from "../../types/customer";
import { PaymentMethodSelect } from "../ui/PaymentMethodSelect";
import { PRIMARY_ACTION_BUTTON } from "../../theme/actionButtons";
import { SECTION_SHELL } from "../../theme/layoutDensity";

type RegisterSaleFormProps = {
  buildId: string;
  suggestedSalePrice: number;
  /** Reserva o anticipo ya cobrado (solo informativo en el formulario). */
  amountAlreadyPaid?: number;
  disabled?: boolean;
  onSuccess: (sale: SaleDetail) => void;
  /** "card" = seccion completa; "plain" = solo formulario (p. ej. dentro de un modal) */
  variant?: "card" | "plain";
  submitLabel?: string;
  offerPendingPickup?: boolean;
  /** Desde ficha de montaje (cliente en borrador). */
  defaultCustomer?: {
    customerId?: string | null;
    customerName?: string | null;
    customerPhone?: string | null;
    customerEmail?: string | null;
  };
};

export function RegisterSaleForm({
  buildId,
  suggestedSalePrice,
  amountAlreadyPaid = 0,
  disabled,
  onSuccess,
  variant = "card",
  submitLabel,
  offerPendingPickup = false,
  defaultCustomer
}: RegisterSaleFormProps) {
  const [customerFields, setCustomerFields] = useState<CustomerFieldValue>(() => ({
    customerId: defaultCustomer?.customerId ?? null,
    customerName: defaultCustomer?.customerName?.trim() ?? "",
    customerPhone: defaultCustomer?.customerPhone?.trim() ?? "",
    customerEmail: defaultCustomer?.customerEmail?.trim() ?? ""
  }));
  const [finalPrice, setFinalPrice] = useState(() => suggestedSalePrice.toFixed(2));
  const [paymentMethod, setPaymentMethod] = useState("");
  const [warrantyMonths, setWarrantyMonths] = useState("");
  const [notes, setNotes] = useState("");
  const [pendingPickup, setPendingPickup] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const paidShown = Math.max(0, Math.round(amountAlreadyPaid * 100) / 100);
  const pendingShown = Math.max(
    0,
    Math.round((suggestedSalePrice - paidShown) * 100) / 100
  );

  useEffect(() => {
    setFinalPrice(suggestedSalePrice.toFixed(2));
    setPendingPickup(false);
  }, [suggestedSalePrice]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const name = customerFields.customerName.trim();
    const phone = customerFields.customerPhone.trim();
    if (!name || !phone) {
      window.alert("Nombre y telefono del cliente son obligatorios.");
      return;
    }
    const normalized = Number(finalPrice.replace(",", ".").trim());
    if (!Number.isFinite(normalized) || normalized < 0) {
      window.alert("Introduce un precio de venta valido.");
      return;
    }

    const warrantyRaw = warrantyMonths.trim();
    const warrantyParsed =
      warrantyRaw === "" ? null : Math.max(0, Number.parseInt(warrantyRaw, 10) || 0);

    const payload: CreateSaleFromBuildPayload = {
      customerId: customerFields.customerId ?? null,
      customerName: name,
      customerPhone: phone,
      customerEmail:
        customerFields.customerEmail.trim() ? customerFields.customerEmail.trim() : null,
      finalSalePrice: Math.round(normalized * 100) / 100,
      paymentMethod: paymentMethod.trim() ? paymentMethod.trim() : null,
      warrantyMonths: warrantyParsed,
      notes: notes.trim() ? notes.trim() : null,
      ...(pendingPickup ? { pendingPickup: true } : {})
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
      <div className="md:col-span-2">
        <CustomerPicker
          value={customerFields}
          onChange={setCustomerFields}
          requirePhone
        />
      </div>

      {paidShown > 0.005 ? (
        <div className="rounded-lg border border-cyan-800/50 bg-cyan-950/25 px-3 py-2 text-sm text-cyan-100/90 md:col-span-2">
          <p>
            <span className="font-medium text-cyan-100">Precio total del montaje:</span>{" "}
            {suggestedSalePrice.toFixed(2)} EUR
          </p>
          <p className="mt-1">
            <span className="font-medium text-cyan-100">Ya cobrado (reserva/anticipo):</span>{" "}
            {paidShown.toFixed(2)} EUR ·{" "}
            <span className="font-medium text-cyan-100">Pendiente al cobrar:</span>{" "}
            {pendingShown.toFixed(2)} EUR
          </p>
          <p className="mt-1 text-xs text-cyan-200/70">
            El precio de venta registrado es el total del montaje; la reserva no lo reduce.
          </p>
        </div>
      ) : null}

      <label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
        Precio total de venta (EUR)
        <input
          value={finalPrice}
          onChange={(e) => setFinalPrice(e.target.value)}
          disabled={disabled || submitting}
          inputMode="decimal"
          className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring disabled:opacity-50"
        />
        <span className="text-xs font-normal text-slate-500">
          {paidShown > 0.005
            ? `Total del montaje (${suggestedSalePrice.toFixed(2)} EUR). Editable si acordaste otro importe final.`
            : `Por defecto: precio de venta del montaje (${suggestedSalePrice.toFixed(2)} EUR).`}
        </span>
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
        Metodo de pago (opcional)
        <PaymentMethodSelect
          value={paymentMethod}
          onChange={setPaymentMethod}
          disabled={disabled || submitting}
          className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring disabled:opacity-50"
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

      {offerPendingPickup ? (
        <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-300 md:col-span-2">
          <input
            type="checkbox"
            checked={pendingPickup}
            onChange={(e) => setPendingPickup(e.target.checked)}
            disabled={disabled || submitting}
            className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-950 text-indigo-500 focus:ring-indigo-400"
          />
          <span>
            <span className="font-medium text-slate-200">Cobrado, pendiente de recogida</span>
            <span className="mt-0.5 block text-xs text-slate-500">
              El ingreso cuenta en ventas; el PC no aparecera en &quot;PCs entregados&quot; hasta confirmar la recogida.
            </span>
          </span>
        </label>
      ) : null}

      <div className="md:col-span-2">
        <button
          type="submit"
          disabled={disabled || submitting}
          className={PRIMARY_ACTION_BUTTON}
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
    <section className={SECTION_SHELL}>
      <h2 className="text-lg font-semibold text-slate-100">Registrar venta</h2>
      <p className="mt-1 text-sm text-slate-400">
        El montaje esta ensamblado. Completa los datos del cliente y confirma el precio final de venta.
      </p>
      <div className="mt-3">{form}</div>
    </section>
  );
}
