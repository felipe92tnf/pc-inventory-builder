import { LogOut } from "lucide-react";
import { NavLink, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { SecondByteLogo } from "../components/brand/SecondByteLogo";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";
import { PwaUpdateNotifier } from "../components/pwa/PwaUpdateNotifier";
import { GlobalSearchModal } from "../components/search/GlobalSearchModal";
import { useAuth } from "../hooks/useAuth";
import { BuildDetailPage } from "../pages/BuildDetailPage";
import { BuildsPage } from "../pages/BuildsPage";
import { CustomerDetailPage } from "../pages/CustomerDetailPage";
import { CustomersIndexPage } from "../pages/CustomersIndexPage";
import { InventoryPage } from "../pages/InventoryPage";
import { LoginPage } from "../pages/LoginPage";
import { QuoteDetailPage } from "../pages/QuoteDetailPage";
import { QuotesPage } from "../pages/QuotesPage";
import { SaleDetailPage } from "../pages/SaleDetailPage";
import { SalesHistoricalImportPage } from "../pages/SalesHistoricalImportPage";
import { SalesPage } from "../pages/SalesPage";
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

function QuotesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

function UsersNavIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zm8 10v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
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
  "group flex min-h-[2.5rem] shrink-0 items-center justify-center gap-2 rounded-xl border px-3 py-1.5 text-sm font-semibold tracking-tight transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 sm:min-h-[2.75rem] sm:gap-2 sm:rounded-2xl sm:px-4 sm:py-2 sm:text-base";

const navInactive =
  "border-blue-800/70 bg-blue-950/80 text-blue-100/85 hover:border-cyan-600/35 hover:bg-blue-900/70 hover:text-white";

const navActive =
  "border-cyan-400/55 bg-gradient-to-br from-blue-900 to-blue-950 text-white shadow-[0_8px_30px_-6px_rgba(34,211,238,0.35)] ring-2 ring-cyan-400/35";

function AppShell() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-blue-950">
      <PwaUpdateNotifier />
      <header className="sticky top-0 z-30 relative overflow-hidden border-b border-cyan-500/25 bg-gradient-to-br from-blue-950/78 via-[#0a1628]/72 to-blue-950/78 shadow-[0_12px_40px_-8px_rgba(8,47,73,0.85)] backdrop-blur-md backdrop-saturate-150">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 80% 60% at 20% -20%, rgba(34, 211, 238, 0.22), transparent 55%), radial-gradient(ellipse 70% 50% at 100% 0%, rgba(14, 165, 233, 0.18), transparent 50%)"
          }}
        />
        {/* Marca SecondByte de fondo (no ocupa layout; no intercepta clics) */}
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
          aria-hidden
        >
          <div className="scale-[1.35] opacity-[0.11] blur-[7px] sm:scale-[1.55] sm:opacity-[0.14] sm:blur-[9px] md:scale-[1.75]">
            <SecondByteLogo variant="header" className="select-none" />
          </div>
        </div>
        <div className="relative z-10 mx-auto max-w-7xl px-3 py-2 sm:px-5 sm:py-2.5">
          <nav
            className="flex flex-nowrap items-stretch justify-start gap-1.5 overflow-x-auto overscroll-x-contain scroll-smooth scroll-pl-3 scroll-pr-3 rounded-2xl border border-white/12 bg-blue-950/65 px-3 py-2 shadow-inner shadow-black/35 backdrop-blur-md [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-2 sm:px-4 md:justify-center md:px-3 [&::-webkit-scrollbar]:hidden"
            aria-label="Secciones"
          >
            <NavLink
              to="/"
              end
              className={({ isActive }) => [navLinkClass, isActive ? navActive : navInactive].join(" ")}
            >
              <PackageIcon className="h-6 w-6 shrink-0 opacity-90 sm:h-7 sm:w-7" />
              <span className="whitespace-nowrap">Inventario</span>
            </NavLink>
            <NavLink
              to="/quotes"
              className={({ isActive }) => [navLinkClass, isActive ? navActive : navInactive].join(" ")}
            >
              <QuotesIcon className="h-6 w-6 shrink-0 opacity-90 sm:h-7 sm:w-7" />
              <span className="whitespace-nowrap">Presupuestos</span>
            </NavLink>
            <NavLink
              to="/builds"
              className={({ isActive }) => [navLinkClass, isActive ? navActive : navInactive].join(" ")}
            >
              <CpuIcon className="h-6 w-6 shrink-0 opacity-90 sm:h-7 sm:w-7" />
              <span className="whitespace-nowrap">Montajes</span>
            </NavLink>
            <NavLink
              to="/services"
              className={({ isActive }) => [navLinkClass, isActive ? navActive : navInactive].join(" ")}
            >
              <WrenchIcon className="h-6 w-6 shrink-0 opacity-90 sm:h-7 sm:w-7" />
              <span className="whitespace-nowrap">Servicios</span>
            </NavLink>
            <NavLink
              to="/sales"
              className={({ isActive }) => [navLinkClass, isActive ? navActive : navInactive].join(" ")}
            >
              <SalesIcon className="h-6 w-6 shrink-0 opacity-90 sm:h-7 sm:w-7" />
              <span className="whitespace-nowrap">Ventas</span>
            </NavLink>
            <NavLink
              to="/customers"
              end
              className={({ isActive }) => [navLinkClass, isActive ? navActive : navInactive].join(" ")}
            >
              <UsersNavIcon className="h-6 w-6 shrink-0 opacity-90 sm:h-7 sm:w-7" />
              <span className="whitespace-nowrap">Clientes</span>
            </NavLink>
            <button
              type="button"
              onClick={() => void signOut()}
              className={`${navLinkClass} ${navInactive} cursor-pointer`}
              title={user?.email ?? "Cerrar sesión"}
            >
              <LogOut className="h-6 w-6 shrink-0 opacity-90 sm:h-7 sm:w-7" aria-hidden />
              <span className="whitespace-nowrap">Cerrar sesión</span>
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-3 sm:p-4 md:p-6">
        <Outlet />
      </main>
      <GlobalSearchModal />
    </div>
  );
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<InventoryPage />} />
          <Route path="builds" element={<BuildsPage />} />
          <Route path="builds/:id" element={<BuildDetailPage />} />
          <Route path="sales/import" element={<SalesHistoricalImportPage />} />
          <Route path="sales" element={<SalesPage />} />
          <Route path="sales/:id" element={<SaleDetailPage />} />
          <Route path="quotes" element={<QuotesPage />} />
          <Route path="quotes/:id" element={<QuoteDetailPage />} />
          <Route path="extras" element={<Navigate to={{ pathname: "/", search: "?tab=catalog&nueva=extra" }} replace />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="customers" element={<CustomersIndexPage />} />
          <Route path="customers/:id" element={<CustomerDetailPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
