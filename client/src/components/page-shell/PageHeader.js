import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { sb } from "../../theme/secondbyte";
export function PageHeader({ title, tagline, description, action }) {
    const secondary = tagline ?? description;
    return (_jsx("section", { className: sb.pageHeader, children: _jsxs("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6", children: [_jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("h1", { className: "text-3xl font-bold tracking-tight text-white md:text-4xl", children: title }), secondary ? (_jsx("p", { className: "mt-2 max-w-2xl text-base leading-snug text-slate-300 md:text-lg", children: secondary })) : null] }), action ? (_jsx("div", { className: "flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center", children: action })) : null] }) }));
}
