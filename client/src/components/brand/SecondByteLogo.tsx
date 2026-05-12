/**
 * Marca SecondByte minimalista (paleta referencia: cyan / violeta / azul oscuro).
 */
export function SecondByteLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:gap-4 ${className}`}>
      <div
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#2563EB]/35 bg-[#111A2E]/90 shadow-[0_0_28px_-8px_rgba(6,182,212,0.35)] ring-1 ring-[#06B6D4]/20"
        aria-hidden
      >
        <svg viewBox="0 0 40 40" className="h-9 w-9" fill="none">
          <defs>
            <linearGradient id="sb-login-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
              <stop stopColor="#22d3ee" />
              <stop offset="1" stopColor="#a78bfa" />
            </linearGradient>
          </defs>
          <path
            d="M8 14h10v12H8V14zm14-6h10v24H22V8z"
            fill="url(#sb-login-grad)"
            opacity="0.95"
          />
          <path
            d="M8 14h10v12H8V14zm14-6h10v24H22V8z"
            stroke="url(#sb-login-grad)"
            strokeWidth="1.25"
            strokeLinejoin="round"
            fill="none"
            opacity="0.45"
          />
        </svg>
      </div>
      <div className="text-center sm:text-left">
        <p className="text-2xl font-black tracking-tight text-white sm:text-3xl">
          Second
          <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">Byte</span>
        </p>
        <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">Inventario & taller</p>
      </div>
    </div>
  );
}
