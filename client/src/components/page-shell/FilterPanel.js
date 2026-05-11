import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { sb } from "../../theme/secondbyte";
import { ChevronDown } from "./Chevron";
function initialOpen(defaultOpen) {
    if (defaultOpen === true)
        return true;
    if (defaultOpen === false)
        return false;
    if (typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches)
        return true;
    return false;
}
export function FilterPanel({ title = "Filtros", defaultOpen, children }) {
    const [open, setOpen] = useState(() => initialOpen(defaultOpen));
    return (_jsxs("section", { className: sb.filterPanel, children: [_jsxs("button", { type: "button", className: "flex min-h-[48px] w-full items-center justify-between gap-3 px-4 py-3 text-left text-base font-semibold text-slate-100 transition hover:bg-slate-900/40 md:min-h-0 md:py-2.5 md:text-sm", onClick: () => setOpen((v) => !v), "aria-expanded": open, children: [_jsx("span", { children: title }), _jsx(ChevronDown, { open: open, className: "h-5 w-5 text-slate-400 md:h-5 md:w-5" })] }), open ? _jsx("div", { className: "border-t border-slate-800/90 px-4 pb-4 pt-1 md:pt-2", children: children }) : null] }));
}
