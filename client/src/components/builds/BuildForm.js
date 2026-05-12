import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { PRIMARY_ACTION_BUTTON } from "../../theme/actionButtons";
export function BuildForm({ loading, title, submitLabel, loadingLabel, initialValues, onCancel, onSubmit }) {
    const [name, setName] = useState(initialValues?.name ?? "");
    const [notes, setNotes] = useState(initialValues?.notes ?? "");
    const handleSubmit = async (event) => {
        event.preventDefault();
        await onSubmit({ name, notes });
        if (!initialValues) {
            setName("");
            setNotes("");
        }
    };
    return (_jsxs("section", { className: "rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg shadow-slate-950/40", children: [_jsxs("div", { className: "mb-4 flex items-center justify-between", children: [_jsx("h2", { className: "text-lg font-semibold text-slate-100", children: title }), onCancel ? (_jsx("button", { type: "button", onClick: onCancel, className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-1.5 text-sm font-medium text-slate-200 transition hover:bg-slate-800", children: "Cancelar" })) : null] }), _jsxs("form", { onSubmit: handleSubmit, className: "grid grid-cols-1 gap-4 md:grid-cols-2", children: [_jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-2", children: ["Nombre del montaje", _jsx("input", { value: name, onChange: (event) => setName(event.target.value), required: true, className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring", placeholder: "Gaming 1080p, Oficina Pro, Edicion..." })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-2", children: ["Descripcion", _jsx("textarea", { value: notes, onChange: (event) => setNotes(event.target.value), rows: 3, className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 placeholder:text-slate-500 focus:border-indigo-400 focus:ring", placeholder: "Uso previsto, observaciones, accesorios..." })] }), _jsx("div", { className: "md:col-span-2", children: _jsx("button", { type: "submit", disabled: loading, className: PRIMARY_ACTION_BUTTON, children: loading ? loadingLabel : submitLabel }) })] })] }));
}
