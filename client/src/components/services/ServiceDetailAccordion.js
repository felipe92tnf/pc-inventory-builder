import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { LIST_PAGE_ACCORDION_BODY, LIST_PAGE_ACCORDION_SHELL, LIST_PAGE_ACCORDION_TRIGGER } from "../../theme/listPageMobile";
function Chevron() {
    return (_jsx("svg", { className: "h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180", fill: "none", viewBox: "0 0 24 24", strokeWidth: 2, stroke: "currentColor", "aria-hidden": true, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M19 9l-7 7-7-7" }) }));
}
/** Acordeón compacto para la ficha de servicio (misma línea que listados SecondByte). */
export function ServiceDetailAccordion({ title, subtitle, defaultOpen = false, badge, children }) {
    return (_jsxs("details", { className: `group ${LIST_PAGE_ACCORDION_SHELL}`, open: defaultOpen, children: [_jsxs("summary", { className: LIST_PAGE_ACCORDION_TRIGGER, children: [_jsxs("span", { className: "min-w-0 flex-1 text-left", children: [_jsxs("span", { className: "flex flex-wrap items-center gap-2", children: [_jsx("span", { className: "text-sm font-semibold text-slate-100", children: title }), badge] }), subtitle ? _jsx("span", { className: "mt-0.5 block text-xs text-slate-500", children: subtitle }) : null] }), _jsx(Chevron, {})] }), _jsx("div", { className: LIST_PAGE_ACCORDION_BODY, children: children })] }));
}
