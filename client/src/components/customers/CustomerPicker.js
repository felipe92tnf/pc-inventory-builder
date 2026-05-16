import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { UserPlus } from "lucide-react";
import * as customersApi from "../../api/customers";
import { PRIMARY_ACTION_BUTTON_COMPACT, SECONDARY_BUTTON_SM } from "../../theme/actionButtons";
export const emptyCustomerFields = () => ({
    customerId: null,
    customerName: "",
    customerPhone: "",
    customerEmail: ""
});
const inputClass = "w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring";
export function CustomerPicker({ value, onChange, requireName = true, requirePhone = false, className = "" }) {
    const listId = useId();
    const [suggestions, setSuggestions] = useState([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showQuickCreate, setShowQuickCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const debounceRef = useRef(null);
    const wrapRef = useRef(null);
    const search = useCallback(async (q) => {
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
        }
        catch {
            setSuggestions([]);
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => {
        const onDoc = (e) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, []);
    const scheduleSearch = (parts) => {
        const merged = { ...value, ...parts };
        const q = [merged.customerName, merged.customerPhone, merged.customerEmail].filter(Boolean).join(" ");
        if (debounceRef.current)
            clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => void search(q), 280);
    };
    const selectCustomer = (row) => {
        onChange({
            customerId: row.id,
            customerName: row.name,
            customerPhone: row.phone,
            customerEmail: row.email ?? ""
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
                email: value.customerEmail.trim() || null
            });
            onChange({
                customerId: row.id,
                customerName: row.name,
                customerPhone: row.phone,
                customerEmail: row.email ?? ""
            });
            setShowQuickCreate(false);
            setOpen(false);
        }
        catch (e) {
            window.alert(e instanceof Error ? e.message : "No se pudo crear el cliente.");
        }
        finally {
            setCreating(false);
        }
    };
    return (_jsxs("div", { className: `space-y-3 ${className}`, children: [_jsxs("div", { ref: wrapRef, className: "relative", children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [_jsx("span", { className: "text-xs font-medium uppercase tracking-wide text-slate-500", children: "Cliente" }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [value.customerId ? (_jsx("button", { type: "button", onClick: clearSelection, className: SECONDARY_BUTTON_SM, children: "Cambiar cliente" })) : null, _jsxs("button", { type: "button", onClick: () => setShowQuickCreate((v) => !v), className: `${SECONDARY_BUTTON_SM} inline-flex items-center gap-1`, children: [_jsx(UserPlus, { className: "h-3.5 w-3.5", "aria-hidden": true }), "Nuevo cliente"] })] })] }), value.customerId ? (_jsx("p", { className: "mt-1 text-xs text-emerald-300/90", children: "Cliente guardado seleccionado" })) : null, _jsxs("div", { className: "mt-2 grid gap-3 sm:grid-cols-2", children: [_jsxs("div", { children: [_jsxs("label", { className: "mb-1 block text-xs text-slate-500", children: ["Nombre", requireName ? " *" : ""] }), _jsx("input", { type: "text", list: listId, value: value.customerName, onChange: (e) => {
                                            const customerName = e.target.value;
                                            onChange({ ...value, customerId: null, customerName });
                                            scheduleSearch({ customerName });
                                        }, onFocus: () => {
                                            if (suggestions.length > 0)
                                                setOpen(true);
                                            else
                                                void search(value.customerName);
                                        }, className: inputClass, placeholder: "Nombre del cliente", required: requireName, autoComplete: "off" })] }), _jsxs("div", { children: [_jsxs("label", { className: "mb-1 block text-xs text-slate-500", children: ["Telefono", requirePhone ? " *" : ""] }), _jsx("input", { type: "tel", value: value.customerPhone, onChange: (e) => {
                                            const customerPhone = e.target.value;
                                            onChange({ ...value, customerId: null, customerPhone });
                                            scheduleSearch({ customerPhone });
                                        }, onFocus: () => void search([value.customerName, value.customerPhone].join(" ")), className: inputClass, placeholder: "600 000 000", required: requirePhone, autoComplete: "off" })] }), _jsxs("div", { className: "sm:col-span-2", children: [_jsx("label", { className: "mb-1 block text-xs text-slate-500", children: "Email" }), _jsx("input", { type: "email", value: value.customerEmail, onChange: (e) => onChange({ ...value, customerId: null, customerEmail: e.target.value }), className: inputClass, placeholder: "opcional@email.com", autoComplete: "off" })] })] }), _jsx("datalist", { id: listId, children: suggestions.map((s) => (_jsx("option", { value: s.name, label: `${s.phone}${s.email ? ` · ${s.email}` : ""}` }, s.id))) }), open && suggestions.length > 0 ? (_jsx("ul", { className: "absolute z-20 mt-1 max-h-52 w-full overflow-auto rounded-xl border border-slate-700 bg-slate-950 shadow-xl", role: "listbox", children: suggestions.map((s) => (_jsx("li", { children: _jsxs("button", { type: "button", role: "option", className: "flex w-full flex-col gap-0.5 px-3 py-2 text-left text-sm text-slate-100 hover:bg-slate-800/80", onMouseDown: (e) => e.preventDefault(), onClick: () => selectCustomer(s), children: [_jsx("span", { className: "font-medium", children: s.name }), _jsxs("span", { className: "text-xs text-slate-400", children: [s.phone || "Sin telefono", s.email ? ` · ${s.email}` : ""] })] }) }, s.id))) })) : null, loading ? _jsx("p", { className: "mt-1 text-xs text-slate-500", children: "Buscando..." }) : null] }), showQuickCreate ? (_jsxs("div", { className: "rounded-xl border border-dashed border-cyan-700/50 bg-cyan-950/20 p-3", children: [_jsx("p", { className: "text-xs text-slate-400", children: "Guarda este cliente para reutilizarlo en presupuestos, montajes y servicios." }), _jsx("button", { type: "button", disabled: creating, onClick: () => void handleQuickCreate(), className: `${PRIMARY_ACTION_BUTTON_COMPACT} mt-2`, children: creating ? "Guardando..." : "Guardar cliente" })] })) : null] }));
}
