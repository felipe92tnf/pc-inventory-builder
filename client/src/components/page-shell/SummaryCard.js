import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { sb } from "../../theme/secondbyte";
export function SummaryGrid({ children }) {
    return (_jsx("div", { className: "grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4", children: children }));
}
export function SummaryCard({ label, value, hint, valueClassName = "text-slate-100" }) {
    return (_jsxs("article", { className: `${sb.summaryCard} px-4 py-4 md:px-5 md:py-5`, children: [_jsx("p", { className: "text-sm font-medium text-slate-400", children: label }), _jsx("p", { className: `mt-1 text-2xl font-semibold tabular-nums tracking-tight md:text-3xl ${valueClassName}`, children: value }), hint ? _jsx("p", { className: "mt-1 text-sm text-slate-600", children: hint }) : null] }));
}
