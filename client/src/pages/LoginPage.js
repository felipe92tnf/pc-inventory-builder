import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { SecondByteLogo } from "../components/brand/SecondByteLogo";
import { useAuth } from "../hooks/useAuth";
import { supabaseConfigured } from "../lib/supabase";
import { sb } from "../theme/secondbyte.js";
export function LoginPage() {
    const { user, loading, signInWithPassword } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from ?? "/";
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    if (loading) {
        return (_jsx("div", { className: "flex min-h-screen items-center justify-center bg-blue-950 text-blue-100", children: _jsx(Loader2, { className: "h-10 w-10 animate-spin text-cyan-400", "aria-hidden": true }) }));
    }
    if (user) {
        return _jsx(Navigate, { to: from === "/login" ? "/" : from, replace: true });
    }
    async function handleSubmit(event) {
        event.preventDefault();
        setErrorMessage(null);
        setSubmitting(true);
        try {
            const { error } = await signInWithPassword(email.trim(), password);
            if (error) {
                setErrorMessage(error.message === "Invalid login credentials" ? "Email o contraseña incorrectos." : error.message);
                return;
            }
            navigate(from, { replace: true });
        }
        finally {
            setSubmitting(false);
        }
    }
    return (_jsxs("div", { className: "relative min-h-screen bg-blue-950", children: [_jsx("div", { className: "pointer-events-none absolute inset-0 opacity-[0.35]", style: {
                    backgroundImage: "radial-gradient(ellipse 80% 60% at 20% -20%, rgba(34, 211, 238, 0.22), transparent 55%), radial-gradient(ellipse 70% 50% at 100% 0%, rgba(14, 165, 233, 0.18), transparent 50%)"
                } }), _jsxs("div", { className: "relative mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-10 sm:px-6", children: [_jsxs("div", { className: "mb-10 space-y-5 text-center sm:text-left", children: [_jsx(SecondByteLogo, { className: "sm:justify-start" }), _jsxs("div", { className: "space-y-1", children: [_jsx("h1", { className: "text-xl font-bold tracking-tight text-white sm:text-2xl", children: "Iniciar sesi\u00F3n" }), _jsx("p", { className: "text-sm text-blue-100/75", children: "PC Inventory Builder \u00B7 acceso seguro con tu cuenta demo." })] })] }), _jsxs("section", { className: sb.pageHeader, children: [!supabaseConfigured ? (_jsxs("div", { className: "mb-5 rounded-xl border border-amber-500/45 bg-amber-950/40 px-4 py-3 text-sm text-amber-100", role: "status", children: [_jsx("p", { className: "font-semibold text-amber-50", children: "Falta configurar Supabase en el cliente" }), _jsxs("p", { className: "mt-2 text-amber-100/90", children: ["Crea el archivo ", _jsx("code", { className: "rounded bg-black/30 px-1.5 py-0.5 text-xs", children: "client/.env" }), " con:"] }), _jsx("pre", { className: "mt-2 overflow-x-auto rounded-lg bg-black/40 p-3 text-left text-xs leading-relaxed text-slate-200", children: `VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_anon_publica` }), _jsxs("p", { className: "mt-2 text-amber-100/85", children: ["Reinicia ", _jsx("code", { className: "rounded bg-black/30 px-1 py-0.5 text-xs", children: "npm run dev" }), " tras guardar. Las claves est\u00E1n en Supabase \u2192", " ", _jsx("span", { className: "font-medium", children: "Project Settings \u2192 API" }), "."] })] })) : null, _jsxs("form", { className: "space-y-5", onSubmit: (e) => void handleSubmit(e), noValidate: true, children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { htmlFor: "login-email", className: "block text-sm font-semibold text-slate-200", children: "Email" }), _jsx("input", { id: "login-email", name: "email", type: "email", autoComplete: "email", required: true, value: email, onChange: (e) => setEmail(e.target.value), className: "w-full rounded-xl border border-[#2563EB]/35 bg-[#0D1321]/80 px-4 py-3 text-base text-white shadow-inner shadow-black/30 outline-none ring-0 transition placeholder:text-slate-500 focus:border-cyan-400/55 focus:ring-2 focus:ring-cyan-400/25", placeholder: "tu@email.com" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { htmlFor: "login-password", className: "block text-sm font-semibold text-slate-200", children: "Contrase\u00F1a" }), _jsx("input", { id: "login-password", name: "password", type: "password", autoComplete: "current-password", required: true, value: password, onChange: (e) => setPassword(e.target.value), className: "w-full rounded-xl border border-[#2563EB]/35 bg-[#0D1321]/80 px-4 py-3 text-base text-white shadow-inner shadow-black/30 outline-none ring-0 transition placeholder:text-slate-500 focus:border-cyan-400/55 focus:ring-2 focus:ring-cyan-400/25", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" })] }), errorMessage ? (_jsx("p", { className: "rounded-xl border border-rose-500/40 bg-rose-950/50 px-4 py-3 text-sm text-rose-100", role: "alert", children: errorMessage })) : null, _jsx("button", { type: "submit", disabled: submitting || !supabaseConfigured, className: "flex w-full items-center justify-center gap-2 rounded-2xl border border-cyan-400/45 bg-gradient-to-br from-blue-900 to-blue-950 px-5 py-3.5 text-base font-semibold text-white shadow-[0_8px_30px_-6px_rgba(34,211,238,0.35)] ring-2 ring-cyan-400/25 transition hover:border-cyan-300/60 hover:ring-cyan-300/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 disabled:cursor-not-allowed disabled:opacity-60", children: submitting ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "h-5 w-5 shrink-0 animate-spin", "aria-hidden": true }), "Entrando\u2026"] })) : ("Iniciar sesión") })] })] })] })] }));
}
