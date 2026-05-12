import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Loader2 } from "lucide-react";
export function AuthLoadingScreen() {
    return (_jsxs("div", { className: "flex min-h-screen flex-col items-center justify-center gap-4 bg-blue-950 px-4 text-blue-100", children: [_jsx(Loader2, { className: "h-10 w-10 animate-spin text-cyan-400", "aria-hidden": true }), _jsx("p", { className: "text-sm font-medium text-blue-100/85", children: "Comprobando sesi\u00F3n\u2026" })] }));
}
