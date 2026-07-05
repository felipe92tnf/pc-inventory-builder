import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import * as servicesApi from "../api/services";
import { useServices } from "../hooks/useServices";
import { SERVICE_TYPES, SERVICE_STATUSES } from "../types/service";
import { API_EMPTY_CUSTOMER_MARKER, displayCustomerLabel, isUnsetCustomerValue } from "../utils/customerUi";
import { API_EMPTY_SERVICE_TITLE_MARKER, displayServiceTitleLabel } from "../utils/serviceUi";
import { downloadServicePdf } from "../utils/servicePdfExport";
import { PRIMARY_ACTION_BUTTON, PRIMARY_ACTION_BUTTON_HEADER, STICKY_PRIMARY_MOBILE_DOCK, PRIMARY_ACTION_BUTTON_COMPACT, SECONDARY_BUTTON, SECONDARY_BUTTON_SM, FILTER_TOGGLE_ROW, DESTRUCTIVE_BUTTON_SM, ORANGE_EDIT_BUTTON_SM, ORANGE_EDIT_BUTTON_CARD } from "../theme/actionButtons";
import { PAGE_HERO, PAGE_OUTER_7XL } from "../theme/layoutDensity";
import { LIST_PAGE_ACCORDION_BODY, LIST_PAGE_ACCORDION_SHELL, LIST_PAGE_ACCORDION_TRIGGER, LIST_PAGE_COUNT_BADGE, LIST_PAGE_FILTER_SECTION, LIST_PAGE_LISTING_REGION, LIST_PAGE_LISTING_TITLE } from "../theme/listPageMobile";
import { StatusBadge, serviceStatusVariant } from "../components/ui/StatusBadge";
import { CustomerProfileLink } from "../components/customers/CustomerProfileLink";
const SERVICE_LABELS = {
    SPARE_PART_SALE: "Venta de pieza suelta",
    PC_CLEANING: "Limpieza de PC",
    FORMATTING: "Formateo",
    OS_INSTALLATION: "Instalacion de sistema operativo",
    DIAGNOSTIC: "Diagnostico",
    THERMAL_PASTE_CHANGE: "Cambio de pasta termica",
    PARTIAL_ASSEMBLY: "Montaje parcial",
    HOME_SERVICE: "Servicio a domicilio",
    OTHER: "Otro"
};
const STATUS_LABELS = {
    PENDING: "Pendiente",
    COMPLETED: "Completado",
    CANCELLED: "Cancelado"
};
function money(n) {
    return `${n.toFixed(2)} EUR`;
}
function ChevronDown({ open, className = "" }) {
    return (_jsx("svg", { className: `h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""} ${className}`, fill: "none", viewBox: "0 0 24 24", strokeWidth: 2, stroke: "currentColor", "aria-hidden": true, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M19 9l-7 7-7-7" }) }));
}
function aggregateStats(rows) {
    const revenue = rows.reduce((a, s) => a + s.salePrice, 0);
    const profit = rows.reduce((a, s) => a + s.profit, 0);
    return { count: rows.length, revenue, profit };
}
/** Piezas sueltas vendidas como servicio */
function isSparePartSale(s) {
    return s.type === "SPARE_PART_SALE";
}
/** Domicilio: tipo HOME_SERVICE o flag (excluye venta pieza para no duplicar) */
function isHomeBucket(s) {
    if (s.type === "SPARE_PART_SALE")
        return false;
    return s.type === "HOME_SERVICE" || s.isHomeService;
}
function partitionCompleted(completed) {
    const spare = completed.filter(isSparePartSale);
    const home = completed.filter(isHomeBucket);
    const technical = completed.filter((s) => !isSparePartSale(s) && !isHomeBucket(s));
    return { spare, home, technical };
}
function spareSaleSummary(s) {
    if (!isSparePartSale(s))
        return null;
    if (s.sparePartLines?.length) {
        return s.sparePartLines.map((l) => `${l.part.name} × ${l.quantity}`).join(", ");
    }
    if (s.selectedPart && s.quantity) {
        return `${s.selectedPart.name} × ${s.quantity}`;
    }
    return null;
}
export function ServicesPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const now = new Date();
    const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1);
    const [filterYear, setFilterYear] = useState(now.getFullYear());
    const [filterType, setFilterType] = useState("ALL");
    const [filterStatus, setFilterStatus] = useState("ALL");
    const typeParam = filterType === "ALL" ? undefined : filterType;
    const statusParam = filterStatus === "ALL" ? undefined : filterStatus;
    const { services, loading, error, actionId, reload, patchService, deleteService, completeService } = useServices(filterMonth, filterYear, typeParam, statusParam);
    const [creatingQuick, setCreatingQuick] = useState(false);
    const [listFlash, setListFlash] = useState(null);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [openPending, setOpenPending] = useState(true);
    const [openCompleted, setOpenCompleted] = useState(false);
    const [openCancelled, setOpenCancelled] = useState(false);
    const [pdfGeneratingId, setPdfGeneratingId] = useState(null);
    const [pdfError, setPdfError] = useState(null);
    useEffect(() => {
        const msg = location.state?.flash;
        if (!msg)
            return;
        setListFlash(msg);
        navigate(location.pathname, { replace: true, state: {} });
        void reload();
    }, [location.pathname, location.state, navigate, reload]);
    const handleQuickCreate = async () => {
        setCreatingQuick(true);
        try {
            const created = await servicesApi.createService({
                type: "DIAGNOSTIC",
                title: API_EMPTY_SERVICE_TITLE_MARKER,
                customerName: API_EMPTY_CUSTOMER_MARKER,
                customerPhone: API_EMPTY_CUSTOMER_MARKER,
                serviceDate: new Date().toISOString(),
                costPrice: 0,
                salePrice: 0,
                manualLines: []
            });
            navigate(`/services/${created.id}`);
        }
        catch (err) {
            window.alert(err instanceof Error ? err.message : "No se pudo crear el servicio.");
        }
        finally {
            setCreatingQuick(false);
        }
    };
    const handleDownloadPdf = async (service) => {
        setPdfError(null);
        setPdfGeneratingId(service.id);
        try {
            await downloadServicePdf(service);
        }
        catch (err) {
            setPdfError(err instanceof Error ? err.message : "No se pudo generar el PDF.");
        }
        finally {
            setPdfGeneratingId(null);
        }
    };
    const years = useMemo(() => {
        const y = now.getFullYear();
        return [y - 1, y, y + 1];
    }, [now]);
    const months = [
        [1, "Enero"],
        [2, "Febrero"],
        [3, "Marzo"],
        [4, "Abril"],
        [5, "Mayo"],
        [6, "Junio"],
        [7, "Julio"],
        [8, "Agosto"],
        [9, "Septiembre"],
        [10, "Octubre"],
        [11, "Noviembre"],
        [12, "Diciembre"]
    ];
    const { pending, completed, cancelled } = useMemo(() => {
        return {
            pending: services.filter((s) => s.status === "PENDING"),
            completed: services.filter((s) => s.status === "COMPLETED"),
            cancelled: services.filter((s) => s.status === "CANCELLED")
        };
    }, [services]);
    const completedParts = useMemo(() => partitionCompleted(completed), [completed]);
    const pendingStats = aggregateStats(pending);
    const completedStats = aggregateStats(completed);
    const cancelledStats = aggregateStats(cancelled);
    const serviceActions = {
        onComplete: (id) => {
            void completeService(id);
        },
        onCancel: (id) => {
            void patchService(id, { status: "CANCELLED" });
        },
        onDelete: (id) => {
            if (window.confirm("Eliminar este servicio?")) {
                void deleteService(id);
            }
        },
        onDownloadPdf: (service) => {
            void handleDownloadPdf(service);
        },
        pdfGeneratingId
    };
    return (_jsxs("div", { className: `${PAGE_OUTER_7XL} max-md:pb-32`, children: [_jsxs("section", { className: `${PAGE_HERO} flex flex-col gap-3 md:flex-row md:items-start md:justify-between`, children: [_jsx("h1", { className: "text-3xl font-bold tracking-tight", children: "Servicios" }), _jsx("button", { type: "button", disabled: creatingQuick, onClick: () => void handleQuickCreate(), className: PRIMARY_ACTION_BUTTON_HEADER, children: creatingQuick ? "Creando…" : "Nuevo servicio" })] }), listFlash ? (_jsx("div", { className: "rounded-xl border border-emerald-500/40 bg-emerald-950/50 px-4 py-3 text-sm text-emerald-100", children: listFlash })) : null, error ? (_jsxs("div", { className: "flex flex-col gap-3 rounded-xl border border-rose-800/70 bg-rose-950/40 px-4 py-3 text-sm text-rose-200 md:flex-row md:items-center md:justify-between", children: [_jsx("span", { children: error }), _jsx("button", { type: "button", onClick: () => {
                            void reload();
                        }, className: "rounded-lg border border-rose-700 bg-rose-900/50 px-3 py-1.5 font-semibold text-rose-100 transition hover:bg-rose-800/70", children: "Reintentar" })] })) : null, pdfError ? (_jsxs("div", { className: "mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-800/70 bg-rose-950/40 px-4 py-3 text-sm text-rose-200", children: [_jsx("span", { children: pdfError }), _jsx("button", { type: "button", onClick: () => setPdfError(null), className: "rounded-lg border border-rose-700 bg-rose-900/50 px-3 py-1 text-xs font-semibold text-rose-100 hover:bg-rose-800/70", children: "Cerrar" })] })) : null, _jsxs("section", { className: LIST_PAGE_FILTER_SECTION, children: [_jsxs("button", { type: "button", className: FILTER_TOGGLE_ROW, onClick: () => setFiltersOpen((v) => !v), "aria-expanded": filtersOpen, children: [_jsxs("span", { className: "min-w-0 text-left", children: [_jsx("span", { className: "block text-sm font-semibold text-slate-200", children: "Filtros" }), _jsx("span", { className: "mt-0.5 block text-xs font-normal text-slate-500", children: "Mes, tipo y estado" })] }), _jsx(ChevronDown, { open: filtersOpen })] }), filtersOpen ? (_jsx("div", { className: "border-t border-slate-800 px-4 pb-4 pt-1", children: _jsxs("div", { className: "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4", children: [_jsxs("label", { className: "flex flex-col gap-1 text-xs font-medium text-slate-300", children: ["Mes", _jsx("select", { value: filterMonth, onChange: (e) => setFilterMonth(Number(e.target.value)), className: "min-h-[40px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring", children: months.map(([num, label]) => (_jsx("option", { value: num, children: label }, num))) })] }), _jsxs("label", { className: "flex flex-col gap-1 text-xs font-medium text-slate-300", children: ["A\u00F1o", _jsx("select", { value: filterYear, onChange: (e) => setFilterYear(Number(e.target.value)), className: "min-h-[40px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring", children: years.map((y) => (_jsx("option", { value: y, children: y }, y))) })] }), _jsxs("label", { className: "flex flex-col gap-1 text-xs font-medium text-slate-300", children: ["Tipo", _jsxs("select", { value: filterType, onChange: (e) => setFilterType(e.target.value), className: "min-h-[40px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring", children: [_jsx("option", { value: "ALL", children: "Todos" }), SERVICE_TYPES.map((t) => (_jsx("option", { value: t, children: SERVICE_LABELS[t] }, t)))] })] }), _jsxs("label", { className: "flex flex-col gap-1 text-xs font-medium text-slate-300", children: ["Estado", _jsxs("select", { value: filterStatus, onChange: (e) => setFilterStatus(e.target.value), className: "min-h-[40px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring", children: [_jsx("option", { value: "ALL", children: "Todos" }), SERVICE_STATUSES.map((s) => (_jsx("option", { value: s, children: STATUS_LABELS[s] }, s)))] })] })] }) })) : null] }), _jsxs("section", { className: LIST_PAGE_LISTING_REGION, children: [_jsx("h2", { className: LIST_PAGE_LISTING_TITLE, children: "Listado de servicios" }), loading ? (_jsx("p", { className: "text-sm text-slate-400", children: "Cargando..." })) : services.length === 0 ? (_jsx("p", { className: "rounded-xl border border-dashed border-slate-700 bg-slate-950/40 px-4 py-8 text-center text-sm text-slate-500", children: "No hay servicios en este periodo con los filtros actuales." })) : (_jsxs("div", { className: "space-y-3", children: [_jsx(StatusAccordion, { title: "Pendientes", tone: "amber", open: openPending, onToggle: () => setOpenPending((v) => !v), stats: pendingStats, emptyHint: "No hay servicios pendientes.", children: _jsx(ServiceListSection, { rows: pending, actionId: actionId, ...serviceActions }) }), _jsx(StatusAccordion, { title: "Completados", tone: "emerald", open: openCompleted, onToggle: () => setOpenCompleted((v) => !v), stats: completedStats, emptyHint: "No hay servicios completados.", children: _jsxs("div", { className: "space-y-4", children: [completedParts.spare.length > 0 ? (_jsx(CompletedSubsection, { label: "Venta de pieza suelta", accent: "border-cyan-500/40 bg-cyan-500/5", rows: completedParts.spare, actionId: actionId, ...serviceActions })) : null, completedParts.technical.length > 0 ? (_jsx(CompletedSubsection, { label: "Servicios t\u00E9cnicos", accent: "border-indigo-500/40 bg-indigo-500/5", rows: completedParts.technical, actionId: actionId, ...serviceActions })) : null, completedParts.home.length > 0 ? (_jsx(CompletedSubsection, { label: "Servicios a domicilio", accent: "border-violet-500/40 bg-violet-500/5", rows: completedParts.home, actionId: actionId, ...serviceActions })) : null] }) }), _jsx(StatusAccordion, { title: "Cancelados", tone: "slate", open: openCancelled, onToggle: () => setOpenCancelled((v) => !v), stats: cancelledStats, emptyHint: "No hay servicios cancelados.", children: _jsx(ServiceListSection, { rows: cancelled, actionId: actionId, ...serviceActions }) })] }))] }), _jsx("div", { className: STICKY_PRIMARY_MOBILE_DOCK, children: _jsx("button", { type: "button", disabled: creatingQuick, onClick: () => void handleQuickCreate(), className: PRIMARY_ACTION_BUTTON, children: creatingQuick ? "Creando…" : "Nuevo servicio" }) })] }));
}
function StatusAccordion({ title, tone, open, onToggle, stats, emptyHint, children }) {
    const toneBadge = tone === "amber"
        ? "border-amber-500/30 bg-amber-500/15 text-amber-200"
        : tone === "emerald"
            ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-200"
            : "border-slate-600 bg-slate-800 text-slate-300";
    return (_jsxs("section", { className: LIST_PAGE_ACCORDION_SHELL, children: [_jsxs("button", { type: "button", className: LIST_PAGE_ACCORDION_TRIGGER, onClick: onToggle, "aria-expanded": open, children: [_jsxs("div", { className: "flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:gap-3", children: [_jsx("span", { className: "text-lg font-semibold text-slate-100", children: title }), _jsx("span", { className: `${LIST_PAGE_COUNT_BADGE} ${toneBadge}`, children: stats.count })] }), _jsx(ChevronDown, { open: open })] }), open ? (_jsx("div", { className: LIST_PAGE_ACCORDION_BODY, children: stats.count === 0 ? (_jsx("p", { className: "py-3 text-sm text-slate-500", children: emptyHint })) : (children) })) : null] }));
}
function CompletedSubsection({ label, accent, rows, actionId, onComplete, onCancel, onDelete, onDownloadPdf, pdfGeneratingId }) {
    const st = aggregateStats(rows);
    return (_jsxs("div", { className: `rounded-lg border ${accent} p-4`, children: [_jsxs("div", { className: "mb-3 flex flex-wrap items-center justify-between gap-2", children: [_jsx("h3", { className: "text-sm font-semibold uppercase tracking-wide text-slate-300", children: label }), _jsx(StatusBadge, { variant: "neutral", size: "table", className: "tabular-nums", children: st.count })] }), _jsx(ServiceListSection, { rows: rows, actionId: actionId, completedActions: true, onDownloadPdf: onDownloadPdf, pdfGeneratingId: pdfGeneratingId, onComplete: onComplete, onCancel: onCancel, onDelete: onDelete })] }));
}
/** Botones táctiles en cards móvil de servicios */
const SERVICE_CARD_ACTION_TOUCH = "min-h-[44px] w-full justify-center px-4 py-2.5 text-sm font-semibold";
function ServiceListSection({ rows, actionId, completedActions = false, onDownloadPdf, pdfGeneratingId, onComplete, onCancel, onDelete }) {
    if (rows.length === 0)
        return null;
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "hidden overflow-hidden rounded-lg border border-slate-800 bg-slate-900/50 md:block", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full min-w-[720px] text-left text-xs text-slate-200", children: [_jsx("thead", { className: "bg-slate-950/80 text-[10px] uppercase tracking-wide text-slate-500", children: _jsxs("tr", { children: [_jsx("th", { className: "px-2 py-2", children: "Fecha" }), _jsx("th", { className: "px-2 py-2", children: "Titulo" }), _jsx("th", { className: "px-2 py-2", children: "Tipo" }), _jsx("th", { className: "px-2 py-2", children: "Cliente" }), _jsx("th", { className: "px-2 py-2", children: "Estado" }), _jsx("th", { className: "px-2 py-2", children: "Venta" }), _jsx("th", { className: "px-2 py-2", children: "Beneficio" }), _jsx("th", { className: "px-2 py-2 text-right", children: "Acciones" })] }) }), _jsx("tbody", { className: "divide-y divide-slate-800", children: rows.map((s) => (_jsx(ServiceTableRow, { s: s, actionId: actionId, completedActions: completedActions, onDownloadPdf: onDownloadPdf, pdfGeneratingId: pdfGeneratingId, onComplete: onComplete, onCancel: onCancel, onDelete: onDelete }, s.id))) })] }) }) }), _jsx("div", { className: "space-y-2 md:hidden", children: rows.map((s) => (_jsx(ServiceCard, { s: s, actionId: actionId, completedActions: completedActions, onDownloadPdf: onDownloadPdf, pdfGeneratingId: pdfGeneratingId, onComplete: onComplete, onCancel: onCancel, onDelete: onDelete }, s.id))) })] }));
}
function ServiceTableRow({ s, actionId, completedActions = false, onDownloadPdf, pdfGeneratingId, onComplete, onCancel, onDelete }) {
    const d = new Date(s.serviceDate);
    const dateStr = d.toLocaleDateString("es-ES");
    const spareHint = spareSaleSummary(s);
    return (_jsxs("tr", { className: "transition hover:bg-slate-800/40", children: [_jsx("td", { className: "whitespace-nowrap px-2 py-2 text-slate-400", children: dateStr }), _jsxs("td", { className: "max-w-[200px] px-2 py-2", children: [_jsx("div", { className: "truncate font-medium text-slate-100", title: displayServiceTitleLabel(s.title), children: displayServiceTitleLabel(s.title) }), spareHint ? (_jsx("div", { className: "truncate text-[10px] text-slate-500", title: spareHint, children: spareHint })) : null] }), _jsx("td", { className: "max-w-[100px] truncate px-2 py-2 text-[11px] text-slate-400", title: SERVICE_LABELS[s.type], children: SERVICE_LABELS[s.type] }), _jsxs("td", { className: "max-w-[120px] px-2 py-2 text-slate-300", children: [_jsx("div", { className: "truncate font-medium", title: displayCustomerLabel(s.customerName), children: displayCustomerLabel(s.customerName) }), !isUnsetCustomerValue(s.customerName) ? (_jsx(CustomerProfileLink, { customerName: s.customerName, customerPhone: s.customerPhone, className: "mt-0.5 inline-flex text-[10px]" })) : null] }), _jsx("td", { className: "px-2 py-2", children: _jsx(StatusBadge, { variant: serviceStatusVariant(s.status), size: "table", children: STATUS_LABELS[s.status] }) }), _jsx("td", { className: "whitespace-nowrap px-2 py-2 text-slate-300", children: money(s.salePrice) }), _jsx("td", { className: "whitespace-nowrap px-2 py-2 text-emerald-300/90", children: money(s.profit) }), _jsx("td", { className: "px-2 py-2", children: _jsxs("div", { className: "flex flex-wrap justify-end gap-1", children: [s.status === "PENDING" ? (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", disabled: actionId === s.id, onClick: () => onComplete(s.id), className: PRIMARY_ACTION_BUTTON_COMPACT, children: "Completar" }), _jsx("button", { type: "button", disabled: actionId === s.id, onClick: () => onCancel(s.id), className: SECONDARY_BUTTON_SM, children: "Cancelar" })] })) : null, _jsx("button", { type: "button", disabled: actionId === s.id || pdfGeneratingId === s.id, onClick: () => onDownloadPdf(s), className: SECONDARY_BUTTON_SM, children: pdfGeneratingId === s.id ? "PDF…" : "PDF" }), _jsx(Link, { to: `/services/${s.id}`, className: `${ORANGE_EDIT_BUTTON_SM} inline-flex items-center justify-center`, children: "Editar" }), _jsx("button", { type: "button", disabled: actionId === s.id, onClick: () => onDelete(s.id), className: DESTRUCTIVE_BUTTON_SM, children: "Eliminar" })] }) })] }));
}
function ServiceCard({ s, actionId, completedActions = false, onDownloadPdf, pdfGeneratingId, onComplete, onCancel, onDelete }) {
    const d = new Date(s.serviceDate);
    const spareHint = spareSaleSummary(s);
    return (_jsxs("article", { className: "rounded-xl border border-slate-800 bg-slate-950/60 p-3 shadow-sm", children: [_jsxs("div", { className: "flex flex-wrap items-start justify-between gap-2", children: [_jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("p", { className: "line-clamp-2 break-words font-semibold text-slate-100", children: displayServiceTitleLabel(s.title) }), spareHint ? (_jsx("p", { className: "truncate text-[11px] text-slate-500", title: spareHint, children: spareHint })) : null, _jsx("p", { className: "text-[11px] text-slate-500", children: d.toLocaleDateString("es-ES") }), _jsx("p", { className: "mt-0.5 truncate text-[11px] text-slate-400", title: SERVICE_LABELS[s.type], children: SERVICE_LABELS[s.type] })] }), _jsx(StatusBadge, { variant: serviceStatusVariant(s.status), size: "table", children: STATUS_LABELS[s.status] })] }), _jsx("p", { className: "truncate text-sm text-slate-300", children: displayCustomerLabel(s.customerName) }), !isUnsetCustomerValue(s.customerName) ? (_jsx(CustomerProfileLink, { customerName: s.customerName, customerPhone: s.customerPhone, className: "mt-1 inline-flex text-xs" })) : null, _jsxs("dl", { className: "mt-3 space-y-1.5 border-t border-slate-800 pt-3 text-sm", children: [_jsxs("div", { className: "flex justify-between gap-3", children: [_jsx("dt", { className: "shrink-0 text-xs text-slate-500", children: "Coste" }), _jsx("dd", { className: "min-w-0 text-right font-medium text-slate-300", children: money(s.costPrice) })] }), _jsxs("div", { className: "flex justify-between gap-3", children: [_jsx("dt", { className: "shrink-0 text-xs text-slate-500", children: "Venta" }), _jsx("dd", { className: "min-w-0 text-right text-base font-semibold text-emerald-300", children: money(s.salePrice) })] }), _jsxs("div", { className: "flex justify-between gap-3", children: [_jsx("dt", { className: "shrink-0 text-xs text-slate-500", children: "Beneficio" }), _jsx("dd", { className: "min-w-0 text-right text-base font-semibold text-emerald-300", children: money(s.profit) })] })] }), _jsxs("div", { className: "mt-3 flex flex-col gap-2 border-t border-slate-800 pt-3", children: [s.status === "PENDING" ? (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", disabled: actionId === s.id, onClick: () => onComplete(s.id), className: `${PRIMARY_ACTION_BUTTON} text-sm`, children: "Completar" }), _jsx("button", { type: "button", disabled: actionId === s.id, onClick: () => onCancel(s.id), className: `${SECONDARY_BUTTON} ${SERVICE_CARD_ACTION_TOUCH}`, children: "Cancelar" })] })) : null, _jsx("button", { type: "button", disabled: actionId === s.id || pdfGeneratingId === s.id, onClick: () => onDownloadPdf(s), className: `${SECONDARY_BUTTON} ${SERVICE_CARD_ACTION_TOUCH}`, children: pdfGeneratingId === s.id ? "Generando PDF…" : "Descargar PDF" }), _jsx(Link, { to: `/services/${s.id}`, className: `${ORANGE_EDIT_BUTTON_CARD} ${SERVICE_CARD_ACTION_TOUCH} inline-flex items-center justify-center`, children: "Editar" }), _jsx("button", { type: "button", disabled: actionId === s.id, onClick: () => onDelete(s.id), className: `${DESTRUCTIVE_BUTTON_SM} ${SERVICE_CARD_ACTION_TOUCH}`, children: "Eliminar" })] })] }));
}
