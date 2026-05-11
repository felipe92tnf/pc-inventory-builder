import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function EmptyState({ title, children }) {
    return (_jsxs("section", { className: "rounded-2xl border border-dashed border-[#2563EB]/25 bg-[#111A2E]/50 px-4 py-12 text-center ring-1 ring-[#8B5CF6]/10", role: "status", children: [title ? _jsx("p", { className: "text-base font-medium text-slate-400", children: title }) : null, _jsx("p", { className: "mt-1 text-base text-slate-500", children: children })] }));
}
