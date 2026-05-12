import { jsx as _jsx } from "react/jsx-runtime";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { AuthLoadingScreen } from "./AuthLoadingScreen";
/**
 * Envuelve rutas que requieren sesión. Redirige a `/login` si no hay usuario.
 */
export function ProtectedRoute() {
    const { user, loading } = useAuth();
    const location = useLocation();
    if (loading) {
        return _jsx(AuthLoadingScreen, {});
    }
    if (!user) {
        return _jsx(Navigate, { to: "/login", replace: true, state: { from: location.pathname } });
    }
    return _jsx(Outlet, {});
}
