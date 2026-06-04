import type { ReactNode } from "react";
import {
  LIST_PAGE_ACCORDION_BODY,
  LIST_PAGE_ACCORDION_SHELL,
  LIST_PAGE_ACCORDION_TRIGGER
} from "../../theme/listPageMobile";

type ServiceDetailAccordionProps = {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  badge?: ReactNode;
  children: ReactNode;
};

function Chevron() {
  return (
    <svg
      className="h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

/** Acordeón compacto para la ficha de servicio (misma línea que listados SecondByte). */
export function ServiceDetailAccordion({
  title,
  subtitle,
  defaultOpen = false,
  badge,
  children
}: ServiceDetailAccordionProps) {
  return (
    <details className={`group ${LIST_PAGE_ACCORDION_SHELL}`} open={defaultOpen}>
      <summary className={LIST_PAGE_ACCORDION_TRIGGER}>
        <span className="min-w-0 flex-1 text-left">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-slate-100">{title}</span>
            {badge}
          </span>
          {subtitle ? <span className="mt-0.5 block text-xs text-slate-500">{subtitle}</span> : null}
        </span>
        <Chevron />
      </summary>
      <div className={LIST_PAGE_ACCORDION_BODY}>{children}</div>
    </details>
  );
}
