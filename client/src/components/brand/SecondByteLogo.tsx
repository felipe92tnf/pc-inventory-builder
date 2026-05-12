import { useId } from "react";

type SecondByteLogoProps = {
  className?: string;
  /** `header`: compacto, solo marca (cabecero). `default`: login con leyenda. */
  variant?: "default" | "header";
};

/**
 * Marca SecondByte — paleta referencia #06B6D4 → #8B5CF6 → #D946EF.
 */
export function SecondByteLogo({ className = "", variant = "default" }: SecondByteLogoProps) {
  const uid = useId().replace(/:/g, "");
  const gradId = `sb-logo-grad-${uid}`;
  const fillUrl = `url(#${gradId})`;
  const isHeader = variant === "header";

  return (
    <div
      className={[
        isHeader
          ? "flex flex-row items-center gap-2.5 sm:gap-3"
          : "flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:gap-4",
        className
      ].join(" ")}
    >
      <div
        className={[
          "flex shrink-0 items-center justify-center rounded-2xl border border-[#2563EB]/35 bg-[#111A2E]/90 shadow-[0_0_28px_-8px_rgba(6,182,212,0.35)] ring-1 ring-[#06B6D4]/20",
          isHeader ? "h-10 w-10 sm:h-11 sm:w-11" : "h-14 w-14"
        ].join(" ")}
        aria-hidden
      >
        <svg
          viewBox="0 0 48 56"
          className={isHeader ? "h-[1.65rem] w-[2.05rem] sm:h-7 sm:w-[1.85rem]" : "h-9 w-[2.35rem]"}
          fill="none"
        >
          <defs>
            <linearGradient id={gradId} x1="24" y1="4" x2="24" y2="52" gradientUnits="userSpaceOnUse">
              <stop stopColor="#06B6D4" />
              <stop offset="0.55" stopColor="#8B5CF6" />
              <stop offset="1" stopColor="#D946EF" />
            </linearGradient>
          </defs>
          <rect x="6" y="10" width="4" height="4" rx="0.5" fill={fillUrl} opacity="0.9" />
          <rect x="6" y="16" width="4" height="4" rx="0.5" fill={fillUrl} opacity="0.55" />
          <rect x="6" y="22" width="4" height="4" rx="0.5" fill={fillUrl} opacity="0.35" />
          <path
            d="M16 8h14c6.6 0 12 4.8 12 11.2 0 3.4-1.6 6.5-4.2 8.5 3.4 2.1 5.6 5.7 5.6 9.8 0 6.6-5.4 12-12 12H16V8z"
            stroke={fillUrl}
            strokeWidth="2.25"
            strokeLinejoin="round"
            fill="none"
            opacity="0.95"
          />
          <path
            d="M26 18h6a4 4 0 010 8h-6M26 30h7a4.5 4.5 0 010 9h-7"
            stroke={fillUrl}
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            opacity="0.88"
          />
          <circle cx="34" cy="22" r="2" fill={fillUrl} />
          <circle cx="35" cy="35" r="2" fill={fillUrl} />
        </svg>
      </div>
      <div className={isHeader ? "min-w-0 text-left" : "text-center sm:text-left"}>
        <p
          className={
            isHeader
              ? "text-lg font-black tracking-tight text-white sm:text-xl"
              : "text-2xl font-black tracking-tight text-white sm:text-3xl"
          }
        >
          Second
          <span className="bg-gradient-to-r from-cyan-400 to-cyan-200 bg-clip-text text-transparent">Byte</span>
        </p>
        {!isHeader ? (
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.32em] text-slate-400 sm:text-[11px]">
            Tecnología que te conecta
          </p>
        ) : null}
      </div>
    </div>
  );
}
