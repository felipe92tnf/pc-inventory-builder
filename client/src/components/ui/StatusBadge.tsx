import type { ReactNode } from "react";
import type { BuildStatus } from "../../types/build";
import type { QuoteStatus } from "../../types/quote";
import type { ServiceStatus } from "../../types/service";

/** Paleta unificada (fondo oscuro, buen contraste). */
export type StatusBadgeVariant =
  | "draft"
  | "sent"
  | "accepted"
  | "rejected"
  | "expired"
  | "pending"
  | "completed"
  | "cancelled"
  | "sold"
  | "confirmed"
  | "wip"
  | "new"
  | "used"
  | "neutral"
  | "prebuilt"
  | "meta";

const VARIANT_CLASS: Record<StatusBadgeVariant, string> = {
  draft: "border-slate-500/50 bg-slate-500/15 text-slate-100",
  sent: "border-sky-500/50 bg-sky-500/15 text-sky-100",
  accepted: "border-emerald-500/50 bg-emerald-500/15 text-emerald-100",
  rejected: "border-rose-500/50 bg-rose-500/15 text-rose-100",
  expired: "border-amber-500/50 bg-amber-500/15 text-amber-100",
  pending: "border-amber-500/50 bg-amber-500/12 text-amber-100",
  completed: "border-emerald-500/50 bg-emerald-500/12 text-emerald-100",
  cancelled: "border-slate-600 bg-slate-800/95 text-slate-400",
  sold: "border-cyan-500/50 bg-cyan-500/15 text-cyan-100",
  confirmed: "border-violet-500/50 bg-violet-500/15 text-violet-100",
  wip: "border-amber-500/50 bg-amber-500/12 text-amber-200",
  new: "border-teal-500/50 bg-teal-500/15 text-teal-100",
  used: "border-amber-500/50 bg-amber-500/14 text-amber-100",
  neutral: "border-slate-600 bg-slate-800/90 text-slate-300",
  prebuilt: "border-violet-500/50 bg-violet-500/12 text-violet-100",
  meta: "border-indigo-500/45 bg-indigo-500/12 text-indigo-100"
};

const SIZE_CLASS = {
  table: "px-1.5 py-0.5 text-[10px]",
  card: "px-2.5 py-1 text-xs",
  detail: "px-3 py-1 text-xs"
} as const;

export type StatusBadgeSize = keyof typeof SIZE_CLASS;

export function serviceStatusVariant(status: ServiceStatus): StatusBadgeVariant {
  switch (status) {
    case "COMPLETED":
      return "completed";
    case "PENDING":
      return "pending";
    default:
      return "cancelled";
  }
}

export function quoteStatusVariant(status: QuoteStatus): StatusBadgeVariant {
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

export function buildStatusVariant(status: BuildStatus): StatusBadgeVariant {
  switch (status) {
    case "SOLD":
      return "sold";
    case "CONFIRMED":
      return "confirmed";
    case "DRAFT":
      return "wip";
    default:
      return "neutral";
  }
}

export function partConditionVariant(condition: string): StatusBadgeVariant {
  if (condition === "NEW") return "new";
  if (condition === "USED") return "used";
  return "neutral";
}

type StatusBadgeProps = {
  variant: StatusBadgeVariant;
  size?: StatusBadgeSize;
  className?: string;
  children: ReactNode;
};

export function StatusBadge({ variant, size = "card", className = "", children }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full border font-semibold ${VARIANT_CLASS[variant]} ${SIZE_CLASS[size]} ${className}`.trim()}
    >
      {children}
    </span>
  );
}
