import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import * as buildsApi from "../../api/builds";
import * as partsApi from "../../api/parts";
import * as quotesApi from "../../api/quotes";
import * as salesApi from "../../api/sales";
import * as servicesApi from "../../api/services";
import type { Build } from "../../types/build";
import type { Part } from "../../types/part";
import type { Quote } from "../../types/quote";
import type { SaleListRow } from "../../types/sale";
import type { ServiceRow } from "../../types/service";
import { SECTION_SHELL } from "../../theme/layoutDensity";

const DEBOUNCE_MS = 280;
const CACHE_MS = 120_000;
const MAX_PER_GROUP = 8;

type SearchCategory = "cliente" | "inventario" | "presupuesto" | "servicio" | "montaje";

type SearchHit = {
  key: string;
  category: SearchCategory;
  title: string;
  subtitle: string;
  to: string;
};

type CacheBundle = {
  parts: Part[];
  builds: Build[];
  quotes: Quote[];
  services: ServiceRow[];
  sales: SaleListRow[];
  loadedAt: number;
};

function norm(s: string | null | undefined): string {
  return (s ?? "").toLowerCase().trim();
}

function includesQ(text: string | null | undefined, q: string): boolean {
  if (!q) return false;
  return norm(text).includes(q);
}

function useDebouncedValue<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), ms);
    return () => window.clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

function groupHits(hits: SearchHit[]): { heading: string; items: SearchHit[] }[] {
  const order: { cat: SearchCategory; heading: string }[] = [
    { cat: "cliente", heading: "Clientes" },
    { cat: "inventario", heading: "Inventario" },
    { cat: "presupuesto", heading: "Presupuestos" },
    { cat: "servicio", heading: "Servicios" },
    { cat: "montaje", heading: "Montajes" }
  ];
  const map = new Map<SearchCategory, SearchHit[]>();
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

function buildFlatList(groups: { heading: string; items: SearchHit[] }[]): SearchHit[] {
  return groups.flatMap((g) => g.items);
}

function rawHits(q: string, data: CacheBundle | null): SearchHit[] {
  if (!q.trim() || !data) return [];
  const qn = norm(q);
  const hits: SearchHit[] = [];
  const seen = new Set<string>();

  const push = (h: SearchHit) => {
    if (seen.has(h.key)) return;
    seen.add(h.key);
    hits.push(h);
  };

  for (const quote of data.quotes) {
    const clientMatch =
      includesQ(quote.customerName, qn) ||
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
    if (
      includesQ(sale.customerName, qn) ||
      includesQ(sale.customerPhone, qn) ||
      includesQ(sale.customerEmail, qn)
    ) {
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
    if (
      includesQ(svc.customerName, qn) ||
      includesQ(svc.customerPhone, qn) ||
      includesQ(svc.customerEmail, qn)
    ) {
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
    if (
      includesQ(quote.title, qn) ||
      includesQ(quote.description, qn) ||
      includesQ(String(quote.quoteNumber), qn)
    ) {
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

async function fetchBundle(): Promise<Omit<CacheBundle, "loadedAt">> {
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
  const [cache, setCache] = useState<CacheBundle | null>(null);
  const cacheRef = useRef<CacheBundle | null>(null);
  useEffect(() => {
    cacheRef.current = cache;
  }, [cache]);

  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const ensureCache = useCallback(async () => {
    const now = Date.now();
    const c = cacheRef.current;
    if (c && now - c.loadedAt < CACHE_MS) return;
    setLoading(true);
    setLoadError(null);
    try {
      const bundle = await fetchBundle();
      const next = { ...bundle, loadedAt: Date.now() };
      cacheRef.current = next;
      setCache(next);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "No se pudieron cargar los datos.");
      cacheRef.current = null;
      setCache(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
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
      if (flatList.length === 0) return 0;
      return Math.min(Math.max(0, i), flatList.length - 1);
    });
  }, [flatList]);

  useEffect(() => {
    if (activeIndex < 0 || activeIndex >= flatList.length) return;
    const el = itemRefs.current[activeIndex];
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, flatList.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
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

  const goTo = useCallback(
    (to: string) => {
      setOpen(false);
      setQuery("");
      navigate(to);
    },
    [navigate]
  );

  const onListKeyDown = (e: ReactKeyboardEvent) => {
    if (flatList.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(flatList.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const hit = flatList[activeIndex];
      if (hit) goTo(hit.to);
    }
  };

  if (typeof document === "undefined") return null;

  const portal = open ? (
    <div className="fixed inset-0 z-[200] flex items-start justify-center p-4 pt-[12vh] sm:pt-[15vh]">
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
        aria-label="Cerrar busqueda"
        onClick={() => setOpen(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="global-search-title"
        className={`relative w-full max-w-lg ${SECTION_SHELL} max-h-[min(70vh,32rem)] flex flex-col p-0 shadow-2xl ring-1 ring-slate-700/60`}
        onKeyDown={onListKeyDown}
      >
        <div className="border-b border-slate-800 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <span className="text-slate-500" aria-hidden>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
              </svg>
            </span>
            <input
              ref={inputRef}
              id="global-search-title"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar clientes, inventario, presupuestos…"
              className="min-w-0 flex-1 border-0 bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            <kbd className="hidden shrink-0 rounded border border-slate-600 bg-slate-950 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 sm:inline">
              Esc
            </kbd>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Ctrl+K o ⌘K · flechas y Enter</p>
        </div>

        <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
          {loadError ? (
            <p className="px-2 py-4 text-center text-sm text-rose-300">{loadError}</p>
          ) : loading && !cache ? (
            <p className="px-2 py-6 text-center text-sm text-slate-400">Cargando datos…</p>
          ) : !debouncedQuery.trim() ? (
            <p className="px-2 py-6 text-center text-sm text-slate-500">Escribe para buscar en toda la app.</p>
          ) : flatList.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-slate-500">Sin resultados.</p>
          ) : (
            grouped.map((group) => (
              <div key={group.heading} className="mb-3 last:mb-0">
                <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  {group.heading}
                </p>
                <ul className="space-y-0.5">
                  {group.items.map((hit) => {
                    const globalIdx = flatList.findIndex((h) => h.key === hit.key);
                    const active = globalIdx === activeIndex;
                    return (
                      <li key={hit.key}>
                        <button
                          type="button"
                          ref={(el) => {
                            itemRefs.current[globalIdx] = el;
                          }}
                          onClick={() => goTo(hit.to)}
                          onMouseEnter={() => setActiveIndex(globalIdx)}
                          className={`flex w-full flex-col rounded-lg px-2.5 py-2 text-left transition ${
                            active ? "bg-slate-800/90 ring-1 ring-cyan-500/25" : "hover:bg-slate-800/50"
                          }`}
                        >
                          <span className="truncate text-sm font-medium text-slate-100">{hit.title}</span>
                          <span className="truncate text-xs text-slate-400">{hit.subtitle}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  ) : null;

  return createPortal(portal, document.body);
}

