import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { LogOut } from "lucide-react";
import { NavLink, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";
import { PwaUpdateNotifier } from "../components/pwa/PwaUpdateNotifier";
import { useAuth } from "../hooks/useAuth";
import { BuildDetailPage } from "../pages/BuildDetailPage";
import { BuildsPage } from "../pages/BuildsPage";
import { InventoryPage } from "../pages/InventoryPage";
import { LoginPage } from "../pages/LoginPage";
import { QuoteDetailPage } from "../pages/QuoteDetailPage";
import { QuotesPage } from "../pages/QuotesPage";
import { SaleDetailPage } from "../pages/SaleDetailPage";
import { SalesPage } from "../pages/SalesPage";
import { ServicesPage } from "../pages/ServicesPage";
function PackageIcon({ className }) {
    return (_jsx("svg", { className: className, viewBox: "0 0 24 24", fill: "none", "aria-hidden": "true", children: _jsx("path", { stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", d: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" }) }));
}
function SalesIcon({ className }) {
    return (_jsx("svg", { className: className, viewBox: "0 0 24 24", fill: "none", "aria-hidden": "true", children: _jsx("path", { stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", d: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" }) }));
}
function WrenchIcon({ className }) {
    return (_jsx("svg", { className: className, viewBox: "0 0 24 24", fill: "none", "aria-hidden": "true", children: _jsx("path", { stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", d: "M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" }) }));
}
function QuotesIcon({ className }) {
    return (_jsx("svg", { className: className, viewBox: "0 0 24 24", fill: "none", "aria-hidden": "true", children: _jsx("path", { stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" }) }));
}
function CpuIcon({ className }) {
    return (_jsx("svg", { className: className, viewBox: "0 0 24 24", fill: "none", "aria-hidden": "true", children: _jsx("path", { stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", d: "M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" }) }));
}
const navLinkClass = "group flex min-h-[3.25rem] flex-1 items-center justify-center gap-3 rounded-2xl border px-5 py-3.5 text-base font-semibold tracking-tight transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 sm:min-w-[11rem] sm:flex-none sm:justify-start";
const navInactive = "border-blue-800/70 bg-blue-950/80 text-blue-100/85 hover:border-cyan-600/35 hover:bg-blue-900/70 hover:text-white";
const navActive = "border-cyan-400/55 bg-gradient-to-br from-blue-900 to-blue-950 text-white shadow-[0_8px_30px_-6px_rgba(34,211,238,0.35)] ring-2 ring-cyan-400/35";
function AppShell() {
    const { user, signOut } = useAuth();
    return (_jsxs("div", { className: "min-h-screen bg-blue-950", children: [_jsx(PwaUpdateNotifier, {}), _jsxs("header", { className: "relative overflow-hidden border-b border-cyan-500/25 bg-gradient-to-br from-blue-950 via-[#0a1628] to-blue-950 shadow-[0_12px_40px_-8px_rgba(8,47,73,0.85)]", children: [_jsx("div", { className: "pointer-events-none absolute inset-0 opacity-[0.4]", style: {
                            backgroundImage: "radial-gradient(ellipse 80% 60% at 20% -20%, rgba(34, 211, 238, 0.22), transparent 55%), radial-gradient(ellipse 70% 50% at 100% 0%, rgba(14, 165, 233, 0.18), transparent 50%)"
                        } }), _jsx("div", { className: "relative mx-auto max-w-7xl px-4 py-6 sm:px-6 md:py-8", children: _jsxs("div", { className: "flex flex-col gap-5 md:flex-row md:items-end md:justify-between", children: [_jsxs("div", { className: "min-w-0 flex-1 space-y-1", children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300", children: "PC Inventory Builder" }), _jsx("p", { className: "text-lg font-bold text-white md:text-xl", children: "Navegaci\u00F3n principal" }), _jsx("p", { className: "max-w-md text-sm text-blue-100/75", children: "Inventario, presupuestos, montajes, servicios y ventas en un solo sitio." })] }), _jsxs("nav", { className: "flex w-full flex-col gap-3 rounded-2xl border border-white/15 bg-blue-950/70 p-3 shadow-inner shadow-black/40 backdrop-blur-md sm:flex-row sm:flex-wrap sm:items-stretch md:w-auto", "aria-label": "Secciones", children: [_jsxs(NavLink, { to: "/", end: true, className: ({ isActive }) => [navLinkClass, isActive ? navActive : navInactive].join(" "), children: [_jsx(PackageIcon, { className: "h-7 w-7 shrink-0 opacity-90" }), _jsx("span", { children: "Inventario" })] }), _jsxs(NavLink, { to: "/quotes", className: ({ isActive }) => [navLinkClass, isActive ? navActive : navInactive].join(" "), children: [_jsx(QuotesIcon, { className: "h-7 w-7 shrink-0 opacity-90" }), _jsx("span", { children: "Presupuestos" })] }), _jsxs(NavLink, { to: "/builds", className: ({ isActive }) => [navLinkClass, isActive ? navActive : navInactive].join(" "), children: [_jsx(CpuIcon, { className: "h-7 w-7 shrink-0 opacity-90" }), _jsx("span", { children: "Montajes" })] }), _jsxs(NavLink, { to: "/services", className: ({ isActive }) => [navLinkClass, isActive ? navActive : navInactive].join(" "), children: [_jsx(WrenchIcon, { className: "h-7 w-7 shrink-0 opacity-90" }), _jsx("span", { children: "Servicios" })] }), _jsxs(NavLink, { to: "/sales", className: ({ isActive }) => [navLinkClass, isActive ? navActive : navInactive].join(" "), children: [_jsx(SalesIcon, { className: "h-7 w-7 shrink-0 opacity-90" }), _jsx("span", { children: "Ventas" })] }), _jsxs("button", { type: "button", onClick: () => void signOut(), className: `${navLinkClass} ${navInactive} cursor-pointer`, title: user?.email ?? "Cerrar sesión", children: [_jsx(LogOut, { className: "h-7 w-7 shrink-0 opacity-90", "aria-hidden": true }), _jsx("span", { className: "whitespace-nowrap", children: "Cerrar sesi\u00F3n" })] })] })] }) })] }), _jsx("main", { className: "mx-auto max-w-7xl p-4 sm:p-6 md:p-8", children: _jsx(Outlet, {}) })] }));
}
export function AppRouter() {
    return (_jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(LoginPage, {}) }), _jsx(Route, { element: _jsx(ProtectedRoute, {}), children: _jsxs(Route, { element: _jsx(AppShell, {}), children: [_jsx(Route, { index: true, element: _jsx(InventoryPage, {}) }), _jsx(Route, { path: "builds", element: _jsx(BuildsPage, {}) }), _jsx(Route, { path: "builds/:id", element: _jsx(BuildDetailPage, {}) }), _jsx(Route, { path: "sales", element: _jsx(SalesPage, {}) }), _jsx(Route, { path: "sales/:id", element: _jsx(SaleDetailPage, {}) }), _jsx(Route, { path: "quotes", element: _jsx(QuotesPage, {}) }), _jsx(Route, { path: "quotes/:id", element: _jsx(QuoteDetailPage, {}) }), _jsx(Route, { path: "services", element: _jsx(ServicesPage, {}) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/", replace: true }) })] }) })] }));
}
