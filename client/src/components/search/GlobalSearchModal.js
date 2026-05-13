import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import * as buildsApi from "../../api/builds";
import * as partsApi from "../../api/parts";
import * as quotesApi from "../../api/quotes";
import * as salesApi from "../../api/sales";
import * as servicesApi from "../../api/services";
import { SECTION_SHELL } from "../../theme/layoutDensity";
const DEBOUNCE_MS = 280;
const CACHE_MS = 120000;
const MAX_PER_GROUP = 8;
function norm(s) {
    return (s ?? "").toLowerCase().trim();
}
function includesQ(text, q) {
    if (!q)
        return false;
    return norm(text).includes(q);
}
function useDebouncedValue(value, ms) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = window.setTimeout(() => setDebounced(value), ms);
        return () => window.clearTimeout(t);
    }, [value, ms]);
    return debounced;
}
function groupHits(hits) {
    const order = [
        { cat: "cliente", heading: "Clientes" },
        { cat: "inventario", heading: "Inventario" },
        { cat: "presupuesto", heading: "Presupuestos" },
        { cat: "servicio", heading: "Servicios" },
        { cat: "montaje", heading: "Montajes" }
    ];
    const map = new Map();
    for (const { cat } of order) {
        map.set(cat, []);
    }
    for (const h of hits) {
        map.get(h.category)?.push(h);
    }
    return order
        .map(({ cat, heading }) => ({
        heading,
        items: (map.get(cat) ?? []).slice(0, MAX_PER_GROUP)
    }))
        .filter((g) => g.items.length > 0);
}
function buildFlatList(groups) {
    return groups.flatMap((g) => g.items);
}
function rawHits(q, data) {
    if (!q.trim() || !data)
        return [];
    const qn = norm(q);
    const hits = [];
    const seen = new Set();
    const push = (h) => {
        if (seen.has(h.key))
            return;
        seen.add(h.key);
        hits.push(h);
    };
    for (const quote of data.quotes) {
        const clientMatch = includesQ(quote.customerName, qn) ||
            includesQ(quote.customerPhone, qn) ||
            includesQ(quote.customerEmail, qn);
        if (clientMatch) {
            push({
                key: `c-q-${quote.id}`,
                category: "cliente",
                title: quote.customerName,
                subtitle: `Presupuesto · ${quote.title} (#${quote.quoteNumber})`,
                to: `/quotes/${quote.id}`
            });
        }
    }
    for (const sale of data.sales) {
        if (includesQ(sale.customerName, qn) ||
            includesQ(sale.customerPhone, qn) ||
            includesQ(sale.customerEmail, qn)) {
            push({
                key: `c-s-${sale.id}`,
                category: "cliente",
                title: sale.customerName,
                subtitle: `Venta · ${sale.build.name}`,
                to: `/sales/${sale.id}`
            });
        }
    }
    for (const svc of data.services) {
        if (includesQ(svc.customerName, qn) ||
            includesQ(svc.customerPhone, qn) ||
            includesQ(svc.customerEmail, qn)) {
            push({
                key: `c-v-${svc.id}`,
                category: "cliente",
                title: svc.customerName,
                subtitle: `Servicio · ${svc.title}`,
                to: "/services"
            });
        }
    }
    for (const part of data.parts) {
        if (includesQ(part.name, qn) || includesQ(part.description, qn)) {
            push({
                key: `p-${part.id}`,
                category: "inventario",
                title: part.name,
                subtitle: part.inventoryKind === "PREBUILT_PC" ? "PC completo" : "Pieza / componente",
                to: `/?highlightPart=${encodeURIComponent(part.id)}`
            });
        }
    }
    for (const quote of data.quotes) {
        if (includesQ(quote.title, qn) ||
            includesQ(quote.description, qn) ||
            includesQ(String(quote.quoteNumber), qn)) {
            push({
                key: `q-${quote.id}`,
                category: "presupuesto",
                title: quote.title,
                subtitle: `${quote.customerName} · #${quote.quoteNumber}`,
                to: `/quotes/${quote.id}`
            });
        }
    }
    for (const svc of data.services) {
        if (includesQ(svc.title, qn) || includesQ(svc.description, qn) || includesQ(svc.customerName, qn)) {
            push({
                key: `v-${svc.id}`,
                category: "servicio",
                title: svc.title,
                subtitle: `${svc.customerName} · ${new Date(svc.serviceDate).toLocaleDateString("es-ES")}`,
                to: "/services"
            });
        }
    }
    for (const build of data.builds) {
        if (includesQ(build.name, qn) || includesQ(build.notes, qn)) {
            push({
                key: `b-${build.id}`,
                category: "montaje",
                title: build.name,
                subtitle: build.status === "SOLD" ? "Vendido" : build.status === "CONFIRMED" ? "Ensamblado" : "Borrador",
                to: `/builds/${build.id}`
            });
        }
    }
    return hits;
}
async function fetchBundle() {
    const [parts, builds, quotes, services, sales] = await Promise.all([
        partsApi.listParts(),
        buildsApi.listBuilds(),
        quotesApi.listQuotes(),
        servicesApi.listServices(),
        salesApi.listSales()
    ]);
    return { parts, builds, quotes, services, sales };
}
export function GlobalSearchModal() {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const debouncedQuery = useDebouncedValue(query, DEBOUNCE_MS);
    const [cache, setCache] = useState(null);
    const cacheRef = useRef(null);
    useEffect(() => {
        cacheRef.current = cache;
    }, [cache]);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState(null);
    const inputRef = useRef(null);
    const listRef = useRef(null);
    const itemRefs = useRef([]);
    const ensureCache = useCallback(async () => {
        const now = Date.now();
        const c = cacheRef.current;
        if (c && now - c.loadedAt < CACHE_MS)
            return;
        setLoading(true);
        setLoadError(null);
        try {
            const bundle = await fetchBundle();
            const next = { ...bundle, loadedAt: Date.now() };
            cacheRef.current = next;
            setCache(next);
        }
        catch (e) {
            setLoadError(e instanceof Error ? e.message : "No se pudieron cargar los datos.");
            cacheRef.current = null;
            setCache(null);
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => {
        if (!open)
            return;
        void ensureCache();
        const t = window.setTimeout(() => inputRef.current?.focus(), 0);
        return () => window.clearTimeout(t);
    }, [open, ensureCache]);
    const grouped = useMemo(() => {
        const raw = rawHits(debouncedQuery, cache);
        return groupHits(raw);
    }, [debouncedQuery, cache]);
    const flatList = useMemo(() => buildFlatList(grouped), [grouped]);
    const [activeIndex, setActiveIndex] = useState(0);
    useEffect(() => {
        setActiveIndex(0);
    }, [debouncedQuery, open]);
    useEffect(() => {
        setActiveIndex((i) => {
            if (flatList.length === 0)
                return 0;
            return Math.min(Math.max(0, i), flatList.length - 1);
        });
    }, [flatList]);
    useEffect(() => {
        if (activeIndex < 0 || activeIndex >= flatList.length)
            return;
        const el = itemRefs.current[activeIndex];
        el?.scrollIntoView({ block: "nearest" });
    }, [activeIndex, flatList.length]);
    useEffect(() => {
        const onKey = (e) => {
            const isMac = navigator.platform.toLowerCase().includes("mac");
            const mod = isMac ? e.metaKey : e.ctrlKey;
            if (mod && e.key.toLowerCase() === "k") {
                e.preventDefault();
                setOpen((v) => !v);
                return;
            }
            if (e.key === "Escape" && open) {
                e.preventDefault();
                setOpen(false);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open]);
    const goTo = useCallback((to) => {
        setOpen(false);
        setQuery("");
        navigate(to);
    }, [navigate]);
    const onListKeyDown = (e) => {
        if (flatList.length === 0)
            return;
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((i) => Math.min(flatList.length - 1, i + 1));
        }
        else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((i) => Math.max(0, i - 1));
        }
        else if (e.key === "Enter") {
            e.preventDefault();
            const hit = flatList[activeIndex];
            if (hit)
                goTo(hit.to);
        }
    };
    if (typeof document === "undefined")
        return null;
    const portal = open ? (_jsxs("div", { className: "fixed inset-0 z-[200] flex items-start justify-center p-4 pt-[12vh] sm:pt-[15vh]", children: [_jsx("button", { type: "button", className: "absolute inset-0 bg-black/70 backdrop-blur-[2px]", "aria-label": "Cerrar busqueda", onClick: () => setOpen(false) }), _jsxs("div", { role: "dialog", "aria-modal": "true", "aria-labelledby": "global-search-title", className: `relative w-full max-w-lg ${SECTION_SHELL} max-h-[min(70vh,32rem)] flex flex-col p-0 shadow-2xl ring-1 ring-slate-700/60`, onKeyDown: onListKeyDown, children: [_jsxs("div", { className: "border-b border-slate-800 px-3 py-2.5", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-slate-500", "aria-hidden": true, children: _jsxs("svg", { className: "h-4 w-4", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [_jsx("circle", { cx: "11", cy: "11", r: "7" }), _jsx("path", { d: "M21 21l-4.3-4.3", strokeLinecap: "round" })] }) }), _jsx("input", { ref: inputRef, id: "global-search-title", value: query, onChange: (e) => setQuery(e.target.value), placeholder: "Buscar clientes, inventario, presupuestos\u2026", className: "min-w-0 flex-1 border-0 bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500", autoComplete: "off", autoCorrect: "off", spellCheck: false }), _jsx("kbd", { className: "hidden shrink-0 rounded border border-slate-600 bg-slate-950 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 sm:inline", children: "Esc" })] }), _jsx("p", { className: "mt-1 text-[11px] text-slate-500", children: "Ctrl+K o \u2318K \u00B7 flechas y Enter" })] }), _jsx("div", { ref: listRef, className: "min-h-0 flex-1 overflow-y-auto px-2 py-2", children: loadError ? (_jsx("p", { className: "px-2 py-4 text-center text-sm text-rose-300", children: loadError })) : loading && !cache ? (_jsx("p", { className: "px-2 py-6 text-center text-sm text-slate-400", children: "Cargando datos\u2026" })) : !debouncedQuery.trim() ? (_jsx("p", { className: "px-2 py-6 text-center text-sm text-slate-500", children: "Escribe para buscar en toda la app." })) : flatList.length === 0 ? (_jsx("p", { className: "px-2 py-6 text-center text-sm text-slate-500", children: "Sin resultados." })) : (grouped.map((group) => (_jsxs("div", { className: "mb-3 last:mb-0", children: [_jsx("p", { className: "px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500", children: group.heading }), _jsx("ul", { className: "space-y-0.5", children: group.items.map((hit) => {
                                        const globalIdx = flatList.findIndex((h) => h.key === hit.key);
                                        const active = globalIdx === activeIndex;
                                        return (_jsx("li", { children: _jsxs("button", { type: "button", ref: (el) => {
                                                    itemRefs.current[globalIdx] = el;
                                                }, onClick: () => goTo(hit.to), onMouseEnter: () => setActiveIndex(globalIdx), className: `flex w-full flex-col rounded-lg px-2.5 py-2 text-left transition ${active ? "bg-slate-800/90 ring-1 ring-cyan-500/25" : "hover:bg-slate-800/50"}`, children: [_jsx("span", { className: "truncate text-sm font-medium text-slate-100", children: hit.title }), _jsx("span", { className: "truncate text-xs text-slate-400", children: hit.subtitle })] }) }, hit.key));
                                    }) })] }, group.heading)))) })] })] })) : null;
    return createPortal(portal, document.body);
}
