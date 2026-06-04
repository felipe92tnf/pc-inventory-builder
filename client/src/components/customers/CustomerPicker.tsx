import { useCallback, useEffect, useId, useRef, useState } from "react";
import { UserPlus } from "lucide-react";
import * as customersApi from "../../api/customers";
import type { CustomerFieldValue, CustomerSearchResult } from "../../types/customer";
import { PRIMARY_ACTION_BUTTON_COMPACT, SECONDARY_BUTTON_SM } from "../../theme/actionButtons";

export const emptyCustomerFields = (): CustomerFieldValue => ({
  customerId: null,
  customerName: "",
  customerPhone: "",
  customerEmail: ""
});

type CustomerPickerProps = {
  value: CustomerFieldValue;
  onChange: (value: CustomerFieldValue) => void;
  requireName?: boolean;
  requirePhone?: boolean;
  className?: string;
};

const inputClass =
  "w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring";

export function CustomerPicker({
  value,
  onChange,
  requireName = true,
  requirePhone = false,
  className = ""
}: CustomerPickerProps) {
  const listId = useId();
  const [suggestions, setSuggestions] = useState<CustomerSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string) => {
    const t = q.trim();
    if (t.length < 1) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const rows = await customersApi.searchCustomers(t, 10);
      setSuggestions(rows);
      setOpen(rows.length > 0);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const scheduleSearch = (parts: Partial<CustomerFieldValue>) => {
    const merged = { ...value, ...parts };
    const q = [merged.customerName, merged.customerPhone].filter(Boolean).join(" ");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void search(q), 280);
  };

  const selectCustomer = (row: CustomerSearchResult) => {
    onChange({
      customerId: row.id,
      customerName: row.name,
      customerPhone: row.phone,
      customerEmail: ""
    });
    setOpen(false);
    setSuggestions([]);
  };

  const clearSelection = () => {
    onChange(emptyCustomerFields());
    setSuggestions([]);
    setOpen(false);
  };

  const handleQuickCreate = async () => {
    const name = value.customerName.trim();
    if (!name) {
      window.alert("Indica al menos el nombre del cliente.");
      return;
    }
    if (requirePhone && !value.customerPhone.trim()) {
      window.alert("Indica el telefono del cliente.");
      return;
    }
    setCreating(true);
    try {
      const row = await customersApi.createCustomer({
        name,
        phone: value.customerPhone.trim(),
        email: null
      });
      onChange({
        customerId: row.id,
        customerName: row.name,
        customerPhone: row.phone,
        customerEmail: ""
      });
      setShowQuickCreate(false);
      setOpen(false);
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "No se pudo crear el cliente.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div ref={wrapRef} className="relative">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Cliente</span>
          <div className="flex flex-wrap gap-2">
            {value.customerId ? (
              <button type="button" onClick={clearSelection} className={SECONDARY_BUTTON_SM}>
                Cambiar cliente
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setShowQuickCreate((v) => !v)}
              className={`${SECONDARY_BUTTON_SM} inline-flex items-center gap-1`}
            >
              <UserPlus className="h-3.5 w-3.5" aria-hidden />
              Nuevo cliente
            </button>
          </div>
        </div>

        {value.customerId ? (
          <p className="mt-1 text-xs text-emerald-300/90">Cliente guardado seleccionado</p>
        ) : null}

        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-slate-500">Nombre{requireName ? " *" : ""}</label>
            <input
              type="text"
              list={listId}
              value={value.customerName}
              onChange={(e) => {
                const customerName = e.target.value;
                onChange({ ...value, customerId: null, customerName });
                scheduleSearch({ customerName });
              }}
              onFocus={() => {
                if (suggestions.length > 0) setOpen(true);
                else void search(value.customerName);
              }}
              className={inputClass}
              placeholder="Selecciona o añade un cliente"
              required={requireName}
              autoComplete="off"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Telefono{requirePhone ? " *" : ""}</label>
            <input
              type="tel"
              value={value.customerPhone}
              onChange={(e) => {
                const customerPhone = e.target.value;
                onChange({ ...value, customerId: null, customerPhone });
                scheduleSearch({ customerPhone });
              }}
              onFocus={() => void search([value.customerName, value.customerPhone].join(" "))}
              className={inputClass}
              placeholder="600 000 000"
              required={requirePhone}
              autoComplete="off"
            />
          </div>
        </div>

        <datalist id={listId}>
          {suggestions.map((s) => (
            <option key={s.id} value={s.name} label={s.phone || s.name} />
          ))}
        </datalist>

        {open && suggestions.length > 0 ? (
          <ul
            className="absolute z-20 mt-1 max-h-52 w-full overflow-auto rounded-xl border border-slate-700 bg-slate-950 shadow-xl"
            role="listbox"
          >
            {suggestions.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  role="option"
                  className="flex w-full flex-col gap-0.5 px-3 py-2 text-left text-sm text-slate-100 hover:bg-slate-800/80"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectCustomer(s)}
                >
                  <span className="font-medium">{s.name}</span>
                  <span className="text-xs text-slate-400">{s.phone || "Sin telefono"}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {loading ? <p className="mt-1 text-xs text-slate-500">Buscando...</p> : null}
      </div>

      {showQuickCreate ? (
        <div className="rounded-xl border border-dashed border-cyan-700/50 bg-cyan-950/20 p-3">
          <p className="text-xs text-slate-400">
            Guarda este cliente para reutilizarlo en presupuestos, montajes y servicios.
          </p>
          <button
            type="button"
            disabled={creating}
            onClick={() => void handleQuickCreate()}
            className={`${PRIMARY_ACTION_BUTTON_COMPACT} mt-2`}
          >
            {creating ? "Guardando..." : "Guardar cliente"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
