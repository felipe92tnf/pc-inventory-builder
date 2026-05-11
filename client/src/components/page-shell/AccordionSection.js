import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ChevronDown } from "./Chevron";
/** Estilo “glass” por tono: degradado suave + borde luminoso */
const TONE_SHELL = {
    amber: {
        shell: "border-amber-400/25 bg-gradient-to-br from-amber-950/45 via-slate-950/90 to-slate-950 shadow-[0_0_36px_-14px_rgba(251,191,36,0.22)] ring-1 ring-amber-400/15",
        orb: "from-amber-400/35 to-orange-600/25",
        amount: "text-amber-100",
        chevron: "text-amber-300/90"
    },
    emerald: {
        shell: "border-emerald-400/25 bg-gradient-to-br from-emerald-950/40 via-slate-950/90 to-blue-950/50 shadow-[0_0_36px_-14px_rgba(52,211,153,0.2)] ring-1 ring-emerald-400/15",
        orb: "from-emerald-400/30 to-cyan-600/25",
        amount: "text-emerald-100",
        chevron: "text-emerald-300/90"
    },
    slate: {
        shell: "border-slate-500/35 bg-gradient-to-br from-slate-900/90 via-slate-950 to-indigo-950/60 shadow-[0_0_28px_-12px_rgba(148,163,184,0.12)] ring-1 ring-slate-500/20",
        orb: "from-slate-500/35 to-indigo-700/25",
        amount: "text-slate-100",
        chevron: "text-slate-400"
    },
    violet: {
        shell: "border-violet-400/25 bg-gradient-to-br from-violet-950/50 via-slate-950 to-indigo-950/70 shadow-[0_0_36px_-14px_rgba(167,139,250,0.22)] ring-1 ring-violet-400/15",
        orb: "from-violet-400/35 to-fuchsia-700/25",
        amount: "text-violet-100",
        chevron: "text-violet-300/90"
    },
    cyan: {
        shell: "border-cyan-400/30 bg-gradient-to-br from-cyan-950/45 via-blue-950/80 to-indigo-950/90 shadow-[0_0_40px_-14px_rgba(34,211,238,0.28)] ring-1 ring-cyan-400/20",
        orb: "from-cyan-400/40 to-blue-700/30",
        amount: "text-cyan-100",
        chevron: "text-cyan-300/90"
    },
    indigo: {
        shell: "border-indigo-400/25 bg-gradient-to-br from-indigo-950/50 via-slate-950 to-blue-950/70 shadow-[0_0_36px_-14px_rgba(99,102,241,0.22)] ring-1 ring-indigo-400/15",
        orb: "from-indigo-400/35 to-violet-700/25",
        amount: "text-indigo-100",
        chevron: "text-indigo-300/90"
    }
};
export function AccordionSection({ labelLine, amountPrimary, tone = "slate", open, onToggle, emptyHint = "Sin registros.", isEmpty, children }) {
    const empty = isEmpty ?? false;
    const t = TONE_SHELL[tone];
    return (_jsxs("div", { className: `rounded-2xl border ${t.shell}`, children: [_jsxs("button", { type: "button", className: "flex min-h-[72px] w-full items-center gap-4 px-4 py-4 text-left md:min-h-[80px] md:px-5 md:py-5", onClick: onToggle, "aria-expanded": open, children: [_jsx("div", { className: `flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br shadow-inner shadow-black/30 md:h-16 md:w-16 ${t.orb}`, "aria-hidden": true, children: _jsx("span", { className: "h-3.5 w-3.5 rounded-full bg-white/90 shadow-[0_0_14px_rgba(255,255,255,0.45)] md:h-4 md:w-4" }) }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("p", { className: "text-base font-semibold leading-snug text-slate-100 md:text-lg", children: labelLine }), _jsx("p", { className: `mt-1 tabular-nums text-2xl font-bold tracking-tight md:text-3xl ${t.amount}`, children: amountPrimary })] }), _jsx(ChevronDown, { open: open, className: `h-7 w-7 shrink-0 md:h-8 md:w-8 ${t.chevron}` })] }), open ? (_jsx("div", { className: "border-t border-white/10 px-4 pb-5 pt-2 md:px-5", children: empty ? _jsx("p", { className: "py-4 text-base text-slate-500", children: emptyHint }) : children })) : null] }));
}
