import { PAYMENT_METHOD_OPTIONS, isStandardPaymentMethod } from "../../constants/paymentMethods";

const DEFAULT_CLASS =
  "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring disabled:opacity-50";

type PaymentMethodSelectProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
};

export function PaymentMethodSelect({
  value,
  onChange,
  disabled,
  className,
  id
}: PaymentMethodSelectProps) {
  const trimmed = value.trim();
  const selectValue =
    trimmed === "" ? "" : isStandardPaymentMethod(trimmed) ? trimmed : value;
  const showLegacy = trimmed !== "" && !isStandardPaymentMethod(trimmed);

  return (
    <select
      id={id}
      value={selectValue}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={className ?? DEFAULT_CLASS}
    >
      <option value="">Sin especificar</option>
      {PAYMENT_METHOD_OPTIONS.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
      {showLegacy ? (
        <option value={value}>
          {trimmed} (registrado antes)
        </option>
      ) : null}
    </select>
  );
}
