import { jsx as _jsx } from "react/jsx-runtime";
export function ChevronDown({ open, className = "" }) {
    return (_jsx("svg", { className: `shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""} ${className}`.trim(), fill: "none", viewBox: "0 0 24 24", strokeWidth: 2, stroke: "currentColor", "aria-hidden": true, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M19 9l-7 7-7-7" }) }));
}
