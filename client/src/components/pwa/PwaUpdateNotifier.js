import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
/** Comprueba actualizaciones del SW al volver a la pestaña y cada N minutos (sin cache HTTP del SW). */
const UPDATE_INTERVAL_MS = 5 * 60 * 1000;
export function PwaUpdateNotifier() {
    const [reloadOffered, setReloadOffered] = useState(false);
    const [offlineBanner, setOfflineBanner] = useState(false);
    const pollIntervalRef = useRef(null);
    useRegisterSW({
        immediate: true,
        /**
         * Con registerType: "autoUpdate", si definimos este callback el plugin NO recarga solo:
         * mostramos toast y el usuario confirma con "Actualizar".
         */
        onNeedReload() {
            setReloadOffered(true);
        },
        onOfflineReady() {
            setOfflineBanner(true);
        }
    });
    useEffect(() => {
        if (!("serviceWorker" in navigator))
            return;
        const ac = new AbortController();
        void (async () => {
            try {
                const reg = await navigator.serviceWorker.getRegistration();
                if (ac.signal.aborted || !reg?.active?.scriptURL)
                    return;
                const swUrl = reg.active.scriptURL;
                const check = async () => {
                    if (ac.signal.aborted || reg.installing)
                        return;
                    if (!navigator.onLine)
                        return;
                    try {
                        const resp = await fetch(swUrl, {
                            cache: "no-store",
                            headers: { "Cache-Control": "no-cache" }
                        });
                        if (resp.ok)
                            await reg.update();
                    }
                    catch {
                        /* red / servidor no disponible */
                    }
                };
                await check();
                if (ac.signal.aborted)
                    return;
                pollIntervalRef.current = setInterval(() => void check(), UPDATE_INTERVAL_MS);
                const onVisibility = () => {
                    if (document.visibilityState === "visible")
                        void check();
                };
                document.addEventListener("visibilitychange", onVisibility, { signal: ac.signal });
            }
            catch {
                /* sin SW activo */
            }
        })();
        return () => {
            ac.abort();
            if (pollIntervalRef.current != null) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
            }
        };
    }, []);
    const handleReload = () => {
        setReloadOffered(false);
        window.location.reload();
    };
    return (_jsxs(_Fragment, { children: [reloadOffered ? (_jsxs("div", { role: "dialog", "aria-live": "polite", "aria-labelledby": "pwa-update-title", className: "fixed bottom-4 left-4 right-4 z-[200] mx-auto flex max-w-md flex-col gap-3 rounded-2xl border border-cyan-500/35 bg-slate-900/95 p-4 shadow-2xl shadow-black/60 backdrop-blur-md sm:left-auto sm:right-6 sm:mx-0", children: [_jsxs("div", { children: [_jsx("p", { id: "pwa-update-title", className: "text-sm font-semibold text-slate-100", children: "Nueva versi\u00F3n disponible" }), _jsx("p", { className: "mt-1 text-xs text-slate-400", children: "Hay una actualizaci\u00F3n del instalador. Pulsa Actualizar para cargar la \u00FAltima versi\u00F3n." })] }), _jsxs("div", { className: "flex flex-wrap justify-end gap-2", children: [_jsx("button", { type: "button", onClick: () => setReloadOffered(false), className: "rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-800", children: "Despu\u00E9s" }), _jsx("button", { type: "button", onClick: handleReload, className: "rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-cyan-900/30 transition hover:bg-cyan-500", children: "Actualizar" })] })] })) : null, offlineBanner ? (_jsx("div", { className: "fixed bottom-4 left-4 right-4 z-[199] mx-auto max-w-sm rounded-xl border border-emerald-500/30 bg-emerald-950/90 px-3 py-2 text-xs text-emerald-100 shadow-lg backdrop-blur-sm sm:left-auto sm:right-6 sm:mx-0", children: _jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsx("span", { children: "Contenido guardado: puedes usar la app sin conexi\u00F3n de forma b\u00E1sica." }), _jsx("button", { type: "button", onClick: () => setOfflineBanner(false), className: "shrink-0 rounded border border-emerald-500/40 px-2 py-0.5 font-semibold text-emerald-200 hover:bg-emerald-900/60", children: "OK" })] }) })) : null] }));
}
