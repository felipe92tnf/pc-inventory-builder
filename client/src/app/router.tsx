import { NavLink, Route, Routes } from "react-router-dom";
import { PwaUpdateNotifier } from "../components/pwa/PwaUpdateNotifier";
import { InventoryPage } from "../pages/InventoryPage";
import { BuildsPage } from "../pages/BuildsPage";
import { BuildDetailPage } from "../pages/BuildDetailPage";
import { SalesPage } from "../pages/SalesPage";
import { SaleDetailPage } from "../pages/SaleDetailPage";
import { ServicesPage } from "../pages/ServicesPage";

function PackageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
      />
    </svg>
  );
}

function SalesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
      />
    </svg>
  );
}

function WrenchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"
      />
    </svg>
  );
}

function CpuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
      />
    </svg>
  );
}

const navLinkClass =
  "group flex min-h-[3.25rem] flex-1 items-center justify-center gap-3 rounded-2xl border px-5 py-3.5 text-base font-semibold tracking-tight transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 sm:min-w-[11rem] sm:flex-none sm:justify-start";

export function AppRouter() {
  return (
    <div className="min-h-screen bg-blue-950">
      <PwaUpdateNotifier />
      <header className="relative overflow-hidden border-b border-cyan-500/25 bg-gradient-to-br from-blue-950 via-[#0a1628] to-blue-950 shadow-[0_12px_40px_-8px_rgba(8,47,73,0.85)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 80% 60% at 20% -20%, rgba(34, 211, 238, 0.22), transparent 55%), radial-gradient(ellipse 70% 50% at 100% 0%, rgba(14, 165, 233, 0.18), transparent 50%)"
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 md:py-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">PC Inventory Builder</p>
              <p className="text-lg font-bold text-white md:text-xl">Navegación principal</p>
              <p className="max-w-md text-sm text-blue-100/75">
                Inventario, montajes, ventas de PCs y servicios tecnicos en un solo sitio.
              </p>
            </div>
            <nav
              className="flex w-full flex-col gap-3 rounded-2xl border border-white/15 bg-blue-950/70 p-3 shadow-inner shadow-black/40 backdrop-blur-md sm:flex-row sm:items-stretch md:w-auto"
              aria-label="Secciones"
            >
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  [
                    navLinkClass,
                    isActive
                      ? "border-cyan-400/55 bg-gradient-to-br from-blue-900 to-blue-950 text-white shadow-[0_8px_30px_-6px_rgba(34,211,238,0.35)] ring-2 ring-cyan-400/35"
                      : "border-blue-800/70 bg-blue-950/80 text-blue-100/85 hover:border-cyan-600/35 hover:bg-blue-900/70 hover:text-white"
                  ].join(" ")
                }
              >
                <PackageIcon className="h-7 w-7 shrink-0 opacity-90" />
                <span>Inventario</span>
              </NavLink>
              <NavLink
                to="/builds"
                className={({ isActive }) =>
                  [
                    navLinkClass,
                    isActive
                      ? "border-cyan-400/55 bg-gradient-to-br from-blue-900 to-blue-950 text-white shadow-[0_8px_30px_-6px_rgba(34,211,238,0.35)] ring-2 ring-cyan-400/35"
                      : "border-blue-800/70 bg-blue-950/80 text-blue-100/85 hover:border-cyan-600/35 hover:bg-blue-900/70 hover:text-white"
                  ].join(" ")
                }
              >
                <CpuIcon className="h-7 w-7 shrink-0 opacity-90" />
                <span>Montajes</span>
              </NavLink>
              <NavLink
                to="/services"
                className={({ isActive }) =>
                  [
                    navLinkClass,
                    isActive
                      ? "border-cyan-400/55 bg-gradient-to-br from-blue-900 to-blue-950 text-white shadow-[0_8px_30px_-6px_rgba(34,211,238,0.35)] ring-2 ring-cyan-400/35"
                      : "border-blue-800/70 bg-blue-950/80 text-blue-100/85 hover:border-cyan-600/35 hover:bg-blue-900/70 hover:text-white"
                  ].join(" ")
                }
              >
                <WrenchIcon className="h-7 w-7 shrink-0 opacity-90" />
                <span>Servicios</span>
              </NavLink>
              <NavLink
                to="/sales"
                className={({ isActive }) =>
                  [
                    navLinkClass,
                    isActive
                      ? "border-cyan-400/55 bg-gradient-to-br from-blue-900 to-blue-950 text-white shadow-[0_8px_30px_-6px_rgba(34,211,238,0.35)] ring-2 ring-cyan-400/35"
                      : "border-blue-800/70 bg-blue-950/80 text-blue-100/85 hover:border-cyan-600/35 hover:bg-blue-900/70 hover:text-white"
                  ].join(" ")
                }
              >
                <SalesIcon className="h-7 w-7 shrink-0 opacity-90" />
                <span>Ventas</span>
              </NavLink>
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-4 sm:p-6 md:p-8">
        <Routes>
          <Route path="/" element={<InventoryPage />} />
          <Route path="/builds" element={<BuildsPage />} />
          <Route path="/builds/:id" element={<BuildDetailPage />} />
          <Route path="/sales" element={<SalesPage />} />
          <Route path="/sales/:id" element={<SaleDetailPage />} />
          <Route path="/services" element={<ServicesPage />} />
        </Routes>
      </main>
    </div>
  );
}
