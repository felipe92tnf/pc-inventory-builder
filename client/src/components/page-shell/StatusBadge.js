import { jsx as _jsx } from "react/jsx-runtime";
const VARIANT_CLASS = {
    draft: "border-slate-500/45 bg-slate-500/15 text-slate-200",
    pending: "border-amber-500/45 bg-amber-500/15 text-amber-200",
    completed: "border-emerald-500/45 bg-emerald-500/15 text-emerald-200",
    confirmed: "border-teal-500/45 bg-teal-500/15 text-teal-200",
    sold: "border-cyan-500/45 bg-cyan-500/15 text-cyan-200",
    accepted: "border-emerald-500/45 bg-emerald-500/18 text-emerald-100",
    rejected: "border-rose-500/45 bg-rose-500/15 text-rose-200",
    cancelled: "border-slate-600/80 bg-slate-800/90 text-slate-400",
    sent: "border-sky-500/45 bg-sky-500/15 text-sky-200",
    expired: "border-orange-500/40 bg-orange-500/12 text-orange-200",
    neutral: "border-slate-600 bg-slate-800 text-slate-300"
};
export function statusBadgeVariantForQuote(status) {
    switch (status) {
        case "DRAFT":
            return "draft";
        case "SENT":
            return "sent";
        case "ACCEPTED":
            return "accepted";
        case "REJECTED":
            return "rejected";
        case "EXPIRED":
            return "expired";
        default:
            return "neutral";
    }
}
export function statusBadgeVariantForService(status) {
    switch (status) {
        case "PENDING":
            return "pending";
        case "COMPLETED":
            return "completed";
        case "CANCELLED":
            return "cancelled";
        default:
            return "neutral";
    }
}
export function statusBadgeVariantForBuild(status, opts) {
    if (status === "SOLD")
        return "sold";
    if (status === "CONFIRMED")
        return "confirmed";
    if (status === "DRAFT") {
        if (opts?.hasItems)
            return "pending";
        return "draft";
    }
    return "neutral";
}
export function StatusBadge({ children, variant, className = "" }) {
    return (_jsx("span", { className: `inline-flex shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${VARIANT_CLASS[variant]} ${className}`, children: children }));
}
