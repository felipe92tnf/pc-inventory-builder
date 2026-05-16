import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo, useState, useEffect } from "react";
import { useParts } from "../hooks/useParts";
import { useServices } from "../hooks/useServices";
import * as extraTemplatesApi from "../api/extraTemplates";
import { isPartPiece, PART_CATEGORIES, partCategoryLabel } from "../types/part";
import { SERVICE_TYPES, SERVICE_STATUSES } from "../types/service";
import { PRIMARY_ACTION_BUTTON, PRIMARY_ACTION_BUTTON_HEADER, STICKY_PRIMARY_MOBILE_DOCK, PRIMARY_ACTION_BUTTON_COMPACT, SECONDARY_BUTTON, SECONDARY_BUTTON_SM, FILTER_TOGGLE_ROW, DESTRUCTIVE_BUTTON_SM, ORANGE_EDIT_BUTTON_SM, ORANGE_EDIT_BUTTON_CARD } from "../theme/actionButtons";
import { PAGE_HERO, PAGE_OUTER_7XL } from "../theme/layoutDensity";
import { LIST_PAGE_ACCORDION_BODY, LIST_PAGE_ACCORDION_SHELL, LIST_PAGE_ACCORDION_TRIGGER, LIST_PAGE_COUNT_BADGE, LIST_PAGE_FILTER_SECTION, LIST_PAGE_LISTING_REGION, LIST_PAGE_LISTING_TITLE } from "../theme/listPageMobile";
import { StatusBadge, serviceStatusVariant } from "../components/ui/StatusBadge";
import { CustomerProfileLink } from "../components/customers/CustomerProfileLink";
import { CustomerPicker, emptyCustomerFields } from "../components/customers/CustomerPicker";
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
function toIsoDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
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
    const now = new Date();
    const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1);
    const [filterYear, setFilterYear] = useState(now.getFullYear());
    const [filterType, setFilterType] = useState("ALL");
    const [filterStatus, setFilterStatus] = useState("ALL");
    const typeParam = filterType === "ALL" ? undefined : filterType;
    const statusParam = filterStatus === "ALL" ? undefined : filterStatus;
    const { services, loading, error, submitting, actionId, reload, createService, patchService, deleteService, completeService } = useServices(filterMonth, filterYear, typeParam, statusParam);
    const { parts } = useParts();
    useEffect(() => {
        let cancelled = false;
        void extraTemplatesApi.listExtraTemplates(true).then((rows) => {
            if (!cancelled)
                setServiceExtraTemplates(rows);
        });
        return () => {
            cancelled = true;
        };
    }, []);
    const partsForSpare = useMemo(() => parts.filter((p) => isPartPiece(p) && p.stock > 0), [parts]);
    /** Piezas con stock para venta suelta, agrupadas por categoría (orden fijo) y nombre dentro de cada grupo */
    const sparePartsByCategory = useMemo(() => {
        const byCat = new Map();
        for (const p of partsForSpare) {
            const cat = (p.category ?? "OTHER");
            const list = byCat.get(cat);
            if (list)
                list.push(p);
            else
                byCat.set(cat, [p]);
        }
        for (const list of byCat.values()) {
            list.sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" }));
        }
        return PART_CATEGORIES.filter((c) => byCat.has(c)).map((category) => ({
            category,
            label: partCategoryLabel(category),
            parts: byCat.get(category)
        }));
    }, [partsForSpare]);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [openPending, setOpenPending] = useState(true);
    const [openCompleted, setOpenCompleted] = useState(false);
    const [openCancelled, setOpenCancelled] = useState(false);
    const [formType, setFormType] = useState("DIAGNOSTIC");
    const [title, setTitle] = useState("");
    const [customerFields, setCustomerFields] = useState(emptyCustomerFields);
    const [description, setDescription] = useState("");
    const [spareLines, setSpareLines] = useState([{ partId: "", quantity: 1 }]);
    const [costPrice, setCostPrice] = useState("");
    const [salePrice, setSalePrice] = useState("");
    const [isHomeService, setIsHomeService] = useState(false);
    const [homeServiceAddress, setHomeServiceAddress] = useState("");
    const [homeServiceSupplement, setHomeServiceSupplement] = useState("");
    const [serviceDate, setServiceDate] = useState(toIsoDate(new Date()));
    const [paymentMethod, setPaymentMethod] = useState("");
    const [notes, setNotes] = useState("");
    const [serviceExtraTemplates, setServiceExtraTemplates] = useState([]);
    const [createExtraLines, setCreateExtraLines] = useState([]);
    const [extraTplPickId, setExtraTplPickId] = useState("");
    const [extraTplPickQty, setExtraTplPickQty] = useState(1);
    const spareInventoryCost = useMemo(() => {
        if (formType !== "SPARE_PART_SALE")
            return null;
        let cost = 0;
        let anyLine = false;
        for (const line of spareLines) {
            if (!line.partId || line.quantity < 1)
                continue;
            const p = parts.find((x) => x.id === line.partId);
            if (!p)
                continue;
            anyLine = true;
            cost += Number(p.costPrice) * line.quantity;
        }
        return anyLine ? cost : null;
    }, [formType, spareLines, parts]);
    const sparePreview = useMemo(() => {
        if (formType !== "SPARE_PART_SALE" || spareInventoryCost === null) {
            return null;
        }
        const sup = typeof homeServiceSupplement === "number" ? homeServiceSupplement : 0;
        const manual = typeof salePrice === "number" && !Number.isNaN(salePrice) ? salePrice : null;
        if (manual === null) {
            return {
                cost: spareInventoryCost,
                sale: null,
                profit: null
            };
        }
        const sale = manual + sup;
        return { cost: spareInventoryCost, sale, profit: sale - spareInventoryCost };
    }, [formType, spareInventoryCost, homeServiceSupplement, salePrice]);
    const resetForm = () => {
        setFormType("DIAGNOSTIC");
        setTitle("");
        setCustomerFields(emptyCustomerFields());
        setDescription("");
        setSpareLines([{ partId: "", quantity: 1 }]);
        setCostPrice("");
        setSalePrice("");
        setIsHomeService(false);
        setHomeServiceAddress("");
        setHomeServiceSupplement("");
        setServiceDate(toIsoDate(new Date()));
        setPaymentMethod("");
        setNotes("");
        setCreateExtraLines([]);
        setExtraTplPickId("");
        setExtraTplPickQty(1);
    };
    const closeModal = () => {
        setCreateModalOpen(false);
        setEditingService(null);
    };
    const openCreateModal = () => {
        resetForm();
        setEditingService(null);
        setCreateModalOpen(true);
    };
    const updateSpareLine = (index, patch) => {
        setSpareLines((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
    };
    const addSpareLine = () => {
        setSpareLines((prev) => [...prev, { partId: "", quantity: 1 }]);
    };
    const removeSpareLine = (index) => {
        setSpareLines((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
    };
    const handleSubmit = async (event) => {
        event.preventDefault();
        const base = {
            type: formType,
            title: title.trim(),
            customerId: customerFields.customerId,
            customerName: customerFields.customerName.trim(),
            customerPhone: customerFields.customerPhone.trim(),
            customerEmail: customerFields.customerEmail.trim() || null,
            description: description.trim(),
            isHomeService,
            homeServiceAddress: isHomeService ? homeServiceAddress.trim() || null : null,
            homeServiceSupplement: typeof homeServiceSupplement === "number" && homeServiceSupplement > 0
                ? homeServiceSupplement
                : null,
            serviceDate: new Date(serviceDate).toISOString(),
            paymentMethod: paymentMethod.trim() || null,
            notes: notes.trim() || null
        };
        try {
            if (formType === "SPARE_PART_SALE") {
                const lines = spareLines
                    .filter((l) => l.partId.trim() !== "" && l.quantity >= 1)
                    .map((l) => ({ partId: l.partId.trim(), quantity: l.quantity }));
                if (lines.length === 0) {
                    window.alert("Añade al menos una pieza con cantidad.");
                    return;
                }
                const manualSale = typeof salePrice === "number" ? salePrice : NaN;
                if (!Number.isFinite(manualSale) || manualSale < 0) {
                    window.alert("Indica el precio de venta (puede ser 0).");
                    return;
                }
                await createService({
                    ...base,
                    sparePartLines: lines,
                    salePrice: manualSale,
                    selectedPartId: null,
                    quantity: null,
                    ...(createExtraLines.length > 0 ? { extraLines: createExtraLines } : {})
                });
            }
            else {
                const c = typeof costPrice === "number" ? costPrice : 0;
                const s = typeof salePrice === "number" ? salePrice : 0;
                await createService({
                    ...base,
                    costPrice: c,
                    salePrice: s,
                    selectedPartId: null,
                    quantity: null,
                    ...(createExtraLines.length > 0 ? { extraLines: createExtraLines } : {})
                });
            }
            resetForm();
            closeModal();
        }
        catch {
            /* error en estado del hook */
        }
    };
    const openEditService = (s) => {
        setCreateModalOpen(false);
        setFormType(s.type);
        setTitle(s.title);
        setCustomerFields({
            customerId: s.customerId ?? null,
            customerName: s.customerName,
            customerPhone: s.customerPhone,
            customerEmail: s.customerEmail ?? ""
        });
        setDescription(s.description ?? "");
        const sup = Number(s.homeServiceSupplement ?? 0);
        setHomeServiceSupplement(s.homeServiceSupplement != null && sup > 0 ? sup : "");
        setIsHomeService(s.isHomeService);
        setHomeServiceAddress(s.homeServiceAddress ?? "");
        setServiceDate(toIsoDate(new Date(s.serviceDate)));
        setPaymentMethod(s.paymentMethod ?? "");
        setNotes(s.notes ?? "");
        if (s.type === "SPARE_PART_SALE") {
            if (s.sparePartLines && s.sparePartLines.length > 0) {
                setSpareLines(s.sparePartLines.map((l) => ({ partId: l.partId, quantity: l.quantity })));
            }
            else if (s.selectedPartId && s.quantity) {
                setSpareLines([{ partId: s.selectedPartId, quantity: s.quantity }]);
            }
            else {
                setSpareLines([{ partId: "", quantity: 1 }]);
            }
            setCostPrice(Number(s.costPrice));
            setSalePrice(Number(s.salePrice) - sup);
        }
        else {
            setSpareLines([{ partId: "", quantity: 1 }]);
            setCostPrice(Number(s.costPrice));
            setSalePrice(Number(s.salePrice) - sup);
        }
        setEditingService(s);
    };
    const handleEditSubmit = async (event) => {
        event.preventDefault();
        const svc = editingService;
        if (!svc)
            return;
        const base = {
            title: title.trim(),
            customerId: customerFields.customerId,
            customerName: customerFields.customerName.trim(),
            customerPhone: customerFields.customerPhone.trim(),
            customerEmail: customerFields.customerEmail.trim() || null,
            description: description.trim(),
            isHomeService,
            homeServiceAddress: isHomeService ? homeServiceAddress.trim() || null : null,
            homeServiceSupplement: typeof homeServiceSupplement === "number" && homeServiceSupplement > 0
                ? homeServiceSupplement
                : null,
            serviceDate: new Date(serviceDate).toISOString(),
            paymentMethod: paymentMethod.trim() || null,
            notes: notes.trim() || null
        };
        try {
            if (svc.type === "SPARE_PART_SALE") {
                const manualSale = typeof salePrice === "number" ? salePrice : NaN;
                if (!Number.isFinite(manualSale) || manualSale < 0) {
                    window.alert("Indica el precio de venta (puede ser 0).");
                    return;
                }
                const c = typeof costPrice === "number" ? costPrice : NaN;
                if (!Number.isFinite(c) || c < 0) {
                    window.alert("Indica el coste (puede ser 0).");
                    return;
                }
                await patchService(svc.id, {
                    ...base,
                    salePrice: manualSale,
                    costPrice: c
                });
            }
            else {
                const c = typeof costPrice === "number" ? costPrice : 0;
                const s = typeof salePrice === "number" ? salePrice : 0;
                await patchService(svc.id, {
                    ...base,
                    costPrice: c,
                    salePrice: s
                });
            }
            resetForm();
            closeModal();
        }
        catch {
            /* error en estado del hook */
        }
    };
    const handleDeleteFromEdit = async () => {
        const svc = editingService;
        if (!svc)
            return;
        if (!window.confirm("Eliminar este servicio? Esta accion no se puede deshacer."))
            return;
        try {
            await deleteService(svc.id);
            resetForm();
            closeModal();
        }
        catch {
            /* error en estado del hook */
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
        }
    };
    return (_jsxs("div", { className: `${PAGE_OUTER_7XL} max-md:pb-32`, children: [_jsxs("section", { className: `${PAGE_HERO} flex flex-col gap-3 md:flex-row md:items-start md:justify-between`, children: [_jsx("h1", { className: "text-3xl font-bold tracking-tight", children: "Servicios" }), _jsx("button", { type: "button", onClick: openCreateModal, className: PRIMARY_ACTION_BUTTON_HEADER, children: "Nuevo servicio" })] }), error ? (_jsxs("div", { className: "flex flex-col gap-3 rounded-xl border border-rose-800/70 bg-rose-950/40 px-4 py-3 text-sm text-rose-200 md:flex-row md:items-center md:justify-between", children: [_jsx("span", { children: error }), _jsx("button", { type: "button", onClick: () => {
                            void reload();
                        }, className: "rounded-lg border border-rose-700 bg-rose-900/50 px-3 py-1.5 font-semibold text-rose-100 transition hover:bg-rose-800/70", children: "Reintentar" })] })) : null, _jsxs("section", { className: LIST_PAGE_FILTER_SECTION, children: [_jsxs("button", { type: "button", className: FILTER_TOGGLE_ROW, onClick: () => setFiltersOpen((v) => !v), "aria-expanded": filtersOpen, children: [_jsxs("span", { className: "min-w-0 text-left", children: [_jsx("span", { className: "block text-sm font-semibold text-slate-200", children: "Filtros" }), _jsx("span", { className: "mt-0.5 block text-xs font-normal text-slate-500", children: "Mes, tipo y estado" })] }), _jsx(ChevronDown, { open: filtersOpen })] }), filtersOpen ? (_jsx("div", { className: "border-t border-slate-800 px-4 pb-4 pt-1", children: _jsxs("div", { className: "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4", children: [_jsxs("label", { className: "flex flex-col gap-1 text-xs font-medium text-slate-300", children: ["Mes", _jsx("select", { value: filterMonth, onChange: (e) => setFilterMonth(Number(e.target.value)), className: "min-h-[40px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring", children: months.map(([num, label]) => (_jsx("option", { value: num, children: label }, num))) })] }), _jsxs("label", { className: "flex flex-col gap-1 text-xs font-medium text-slate-300", children: ["A\u00F1o", _jsx("select", { value: filterYear, onChange: (e) => setFilterYear(Number(e.target.value)), className: "min-h-[40px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring", children: years.map((y) => (_jsx("option", { value: y, children: y }, y))) })] }), _jsxs("label", { className: "flex flex-col gap-1 text-xs font-medium text-slate-300", children: ["Tipo", _jsxs("select", { value: filterType, onChange: (e) => setFilterType(e.target.value), className: "min-h-[40px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring", children: [_jsx("option", { value: "ALL", children: "Todos" }), SERVICE_TYPES.map((t) => (_jsx("option", { value: t, children: SERVICE_LABELS[t] }, t)))] })] }), _jsxs("label", { className: "flex flex-col gap-1 text-xs font-medium text-slate-300", children: ["Estado", _jsxs("select", { value: filterStatus, onChange: (e) => setFilterStatus(e.target.value), className: "min-h-[40px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring", children: [_jsx("option", { value: "ALL", children: "Todos" }), SERVICE_STATUSES.map((s) => (_jsx("option", { value: s, children: STATUS_LABELS[s] }, s)))] })] })] }) })) : null] }), _jsxs("section", { className: LIST_PAGE_LISTING_REGION, children: [_jsx("h2", { className: LIST_PAGE_LISTING_TITLE, children: "Listado de servicios" }), loading ? (_jsx("p", { className: "text-sm text-slate-400", children: "Cargando..." })) : services.length === 0 ? (_jsx("p", { className: "rounded-xl border border-dashed border-slate-700 bg-slate-950/40 px-4 py-8 text-center text-sm text-slate-500", children: "No hay servicios en este periodo con los filtros actuales." })) : (_jsxs("div", { className: "space-y-3", children: [_jsx(StatusAccordion, { title: "Pendientes", tone: "amber", open: openPending, onToggle: () => setOpenPending((v) => !v), stats: pendingStats, emptyHint: "No hay servicios pendientes.", children: _jsx(ServiceListSection, { rows: pending, actionId: actionId, ...serviceActions }) }), _jsx(StatusAccordion, { title: "Completados", tone: "emerald", open: openCompleted, onToggle: () => setOpenCompleted((v) => !v), stats: completedStats, emptyHint: "No hay servicios completados.", children: _jsxs("div", { className: "space-y-4", children: [completedParts.spare.length > 0 ? (_jsx(CompletedSubsection, { label: "Venta de pieza suelta", accent: "border-cyan-500/40 bg-cyan-500/5", rows: completedParts.spare, actionId: actionId, onEditService: openEditService, ...serviceActions })) : null, completedParts.technical.length > 0 ? (_jsx(CompletedSubsection, { label: "Servicios t\u00E9cnicos", accent: "border-indigo-500/40 bg-indigo-500/5", rows: completedParts.technical, actionId: actionId, onEditService: openEditService, ...serviceActions })) : null, completedParts.home.length > 0 ? (_jsx(CompletedSubsection, { label: "Servicios a domicilio", accent: "border-violet-500/40 bg-violet-500/5", rows: completedParts.home, actionId: actionId, onEditService: openEditService, ...serviceActions })) : null] }) }), _jsx(StatusAccordion, { title: "Cancelados", tone: "slate", open: openCancelled, onToggle: () => setOpenCancelled((v) => !v), stats: cancelledStats, emptyHint: "No hay servicios cancelados.", children: _jsx(ServiceListSection, { rows: cancelled, actionId: actionId, ...serviceActions }) })] }))] }), createModalOpen || editingService ? (_jsx("div", { className: "fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4", role: "dialog", "aria-modal": "true", "aria-labelledby": "service-modal-title", onClick: (e) => {
                    if (e.target === e.currentTarget)
                        closeModal();
                }, children: _jsxs("div", { className: "flex max-h-[92vh] w-full max-w-2xl flex-col rounded-t-2xl border border-slate-700 bg-slate-900 shadow-2xl sm:rounded-2xl", onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { className: "flex shrink-0 items-start justify-between gap-3 border-b border-slate-800 px-4 py-4 sm:px-6", children: [_jsx("div", { children: _jsx("h2", { id: "service-modal-title", className: "text-xl font-semibold text-slate-100", children: editingService ? "Editar servicio" : "Nuevo servicio" }) }), _jsx("button", { type: "button", onClick: closeModal, className: SECONDARY_BUTTON_SM, children: "Cerrar" })] }), _jsx("div", { className: "min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-2 sm:px-6", children: _jsxs("form", { onSubmit: (e) => void (editingService ? handleEditSubmit(e) : handleSubmit(e)), className: "grid grid-cols-1 gap-4 md:grid-cols-2", children: [_jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-2", children: ["Tipo", _jsx("select", { value: formType, onChange: (e) => setFormType(e.target.value), disabled: !!editingService, className: "min-h-[42px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring disabled:cursor-not-allowed disabled:opacity-60", children: SERVICE_TYPES.map((t) => (_jsx("option", { value: t, children: SERVICE_LABELS[t] }, t))) })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-2", children: ["Titulo", _jsx("input", { value: title, onChange: (e) => setTitle(e.target.value), required: true, className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring", placeholder: "Ej: Revision torre cliente Juan" })] }), _jsx("div", { className: "md:col-span-2", children: _jsx(CustomerPicker, { value: customerFields, onChange: setCustomerFields, requirePhone: true }) }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-2", children: ["Descripcion", _jsx("textarea", { value: description, onChange: (e) => setDescription(e.target.value), rows: 2, className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring" })] }), !editingService ? (_jsxs("div", { className: "md:col-span-2 rounded-xl border border-slate-700 bg-slate-950/30 p-4", children: [_jsx("p", { className: "text-sm font-medium text-slate-200", children: "Extras desde plantilla (sin stock)" }), _jsx("p", { className: "mt-1 text-xs text-slate-500", children: "Opcional. Se suman al coste y al PVP del servicio con los importes de la plantilla." }), createExtraLines.length > 0 ? (_jsx("ul", { className: "mt-3 space-y-1 text-sm text-slate-300", children: createExtraLines.map((row, i) => {
                                                    const t = serviceExtraTemplates.find((x) => x.id === row.extraTemplateId);
                                                    return (_jsxs("li", { className: "flex flex-wrap items-center justify-between gap-2 rounded border border-slate-700/80 bg-slate-900/50 px-2 py-1.5", children: [_jsxs("span", { children: [t?.name ?? row.extraTemplateId, " \u00D7", row.quantity ?? 1] }), _jsx("button", { type: "button", className: "text-xs font-semibold text-rose-300 hover:underline", onClick: () => setCreateExtraLines((prev) => prev.filter((_, j) => j !== i)), children: "Quitar" })] }, `${row.extraTemplateId}-${i}`));
                                                }) })) : null, _jsxs("div", { className: "mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end", children: [_jsxs("label", { className: "flex min-w-[10rem] flex-1 flex-col gap-1 text-xs font-medium text-slate-300", children: ["Plantilla", _jsxs("select", { value: extraTplPickId, onChange: (e) => setExtraTplPickId(e.target.value), className: "rounded-lg border border-slate-700 bg-slate-950/70 px-2 py-1.5 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring", children: [_jsx("option", { value: "", children: "Elegir\u2026" }), serviceExtraTemplates.map((t) => (_jsx("option", { value: t.id, children: t.name }, t.id)))] })] }), _jsxs("label", { className: "flex w-20 flex-col gap-1 text-xs font-medium text-slate-300", children: ["Cant.", _jsx("input", { type: "number", min: 1, value: extraTplPickQty, onChange: (e) => setExtraTplPickQty(Math.max(1, Number(e.target.value) || 1)), className: "rounded-lg border border-slate-700 bg-slate-950/70 px-2 py-1.5 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring" })] }), _jsx("button", { type: "button", className: SECONDARY_BUTTON_SM, onClick: () => {
                                                            if (!extraTplPickId) {
                                                                window.alert("Elige una plantilla.");
                                                                return;
                                                            }
                                                            setCreateExtraLines((prev) => [
                                                                ...prev,
                                                                { extraTemplateId: extraTplPickId, quantity: extraTplPickQty }
                                                            ]);
                                                            setExtraTplPickId("");
                                                            setExtraTplPickQty(1);
                                                        }, children: "A\u00F1adir a la lista" })] })] })) : null, formType === "SPARE_PART_SALE" ? (editingService?.status === "COMPLETED" ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "space-y-2 md:col-span-2", children: [_jsx("p", { className: "text-sm font-medium text-slate-200", children: "Piezas vendidas" }), _jsx("p", { className: "text-xs text-slate-500", children: "No se pueden cambiar las piezas tras completar; solo datos y precios." }), _jsx("ul", { className: "space-y-1 rounded-lg border border-slate-700 bg-slate-950/40 p-3 text-sm text-slate-200", children: editingService.sparePartLines && editingService.sparePartLines.length > 0
                                                            ? editingService.sparePartLines.map((l) => (_jsxs("li", { children: [l.part.name, " \u00D7 ", l.quantity] }, l.id)))
                                                            : editingService.selectedPart ? (_jsxs("li", { children: [editingService.selectedPart.name, " \u00D7 ", editingService.quantity ?? 1] })) : (_jsx("li", { className: "text-slate-500", children: "\u2014" })) })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-2", children: ["Coste (registrado)", _jsx("input", { type: "number", min: 0, step: "0.01", value: costPrice === "" ? "" : costPrice, onChange: (e) => setCostPrice(e.target.value === "" ? "" : Number(e.target.value)), required: true, className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring" })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-2", children: ["Precio de venta (base piezas, sin suplemento domicilio)", _jsx("input", { type: "number", min: 0, step: "0.01", value: salePrice === "" ? "" : salePrice, onChange: (e) => setSalePrice(e.target.value === "" ? "" : Number(e.target.value)), required: true, className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring" })] }), _jsxs("div", { className: "rounded-xl border border-indigo-500/30 bg-indigo-950/30 p-4 text-sm md:col-span-2", children: [_jsx("p", { className: "text-xs uppercase tracking-wide text-slate-500", children: "Venta total (base + domicilio)" }), _jsx("p", { className: "mt-1 text-lg font-semibold text-emerald-300", children: money((typeof salePrice === "number" ? salePrice : 0) +
                                                            (typeof homeServiceSupplement === "number" ? homeServiceSupplement : 0)) })] })] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "space-y-3 md:col-span-2", children: [_jsxs("div", { className: "flex flex-wrap items-end justify-between gap-2", children: [_jsx("p", { className: "text-sm font-medium text-slate-200", children: "Piezas (stock disponible)" }), _jsx("button", { type: "button", onClick: () => addSpareLine(), className: SECONDARY_BUTTON_SM, children: "A\u00F1adir otra pieza" })] }), spareLines.map((line, idx) => (_jsxs("div", { className: "flex flex-col gap-3 rounded-lg border border-slate-700 bg-slate-950/40 p-3 sm:flex-row sm:flex-wrap sm:items-end", children: [_jsxs("label", { className: "flex min-w-0 flex-1 flex-col gap-1 text-sm font-medium text-slate-200", children: ["Pieza", _jsxs("select", { value: line.partId, onChange: (e) => updateSpareLine(idx, { partId: e.target.value }), required: idx === 0, className: "min-h-[42px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring", children: [_jsx("option", { value: "", children: "Seleccionar..." }), sparePartsByCategory.map(({ category, label, parts: groupParts }) => (_jsx("optgroup", { label: label, children: groupParts.map((p) => (_jsxs("option", { value: p.id, children: [p.name, " \u2014 stock ", p.stock] }, p.id))) }, category)))] })] }), _jsxs("label", { className: "flex w-full flex-col gap-1 text-sm font-medium text-slate-200 sm:w-28", children: ["Cantidad", _jsx("input", { type: "number", min: 1, step: 1, value: line.quantity, onChange: (e) => updateSpareLine(idx, { quantity: Number(e.target.value) }), required: idx === 0, className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring" })] }), spareLines.length > 1 ? (_jsx("button", { type: "button", onClick: () => removeSpareLine(idx), className: DESTRUCTIVE_BUTTON_SM, children: "Quitar" })) : null] }, idx)))] }), spareInventoryCost !== null ? (_jsxs("div", { className: "rounded-lg border border-slate-700 bg-slate-950/50 px-3 py-2 text-sm md:col-span-2", children: [_jsx("p", { className: "text-xs uppercase tracking-wide text-slate-500", children: "Coste desde inventario" }), _jsx("p", { className: "mt-0.5 font-medium text-slate-200", children: money(spareInventoryCost) })] })) : null, _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-2", children: ["Precio de venta (total piezas)", _jsx("input", { type: "number", min: 0, step: "0.01", value: salePrice === "" ? "" : salePrice, onChange: (e) => setSalePrice(e.target.value === "" ? "" : Number(e.target.value)), required: true, className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring" })] }), sparePreview && sparePreview.sale !== null ? (_jsxs("div", { className: "rounded-xl border border-indigo-500/30 bg-indigo-950/30 p-4 text-sm md:col-span-2", children: [_jsx("p", { className: "text-xs uppercase tracking-wide text-slate-500", children: "Venta total" }), _jsx("p", { className: "mt-1 text-lg font-semibold text-emerald-300", children: money(sparePreview.sale) })] })) : null] }))) : (_jsxs(_Fragment, { children: [_jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Precio coste", _jsx("input", { type: "number", min: 0, step: "0.01", value: costPrice === "" ? "" : costPrice, onChange: (e) => setCostPrice(e.target.value === "" ? "" : Number(e.target.value)), required: true, className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring" })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Precio venta (trabajo)", _jsx("input", { type: "number", min: 0, step: "0.01", value: salePrice === "" ? "" : salePrice, onChange: (e) => setSalePrice(e.target.value === "" ? "" : Number(e.target.value)), required: true, className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring" })] })] })), _jsxs("label", { className: "flex items-center gap-2 text-sm font-medium text-slate-200 md:col-span-2", children: [_jsx("input", { type: "checkbox", checked: isHomeService, onChange: (e) => setIsHomeService(e.target.checked), className: "h-4 w-4 rounded border-slate-600 bg-slate-950 text-indigo-500" }), "Servicio a domicilio"] }), isHomeService ? (_jsxs(_Fragment, { children: [_jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-2", children: ["Direccion", _jsx("input", { value: homeServiceAddress, onChange: (e) => setHomeServiceAddress(e.target.value), className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring", placeholder: "Calle, ciudad..." })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-2", children: ["Suplemento domicilio (opcional, EUR)", _jsx("input", { type: "number", min: 0, step: "0.01", value: homeServiceSupplement === "" ? "" : homeServiceSupplement, onChange: (e) => setHomeServiceSupplement(e.target.value === "" ? "" : Number(e.target.value)), className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring" })] })] })) : null, _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Fecha del servicio", _jsx("input", { type: "date", value: serviceDate, onChange: (e) => setServiceDate(e.target.value), required: true, className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring" })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Forma de pago (opcional)", _jsx("input", { value: paymentMethod, onChange: (e) => setPaymentMethod(e.target.value), className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring", placeholder: "Efectivo, Bizum..." })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-2", children: ["Notas internas", _jsx("textarea", { value: notes, onChange: (e) => setNotes(e.target.value), rows: 2, className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring" })] }), _jsxs("div", { className: "flex flex-wrap gap-2 md:col-span-2", children: [_jsx("button", { type: "submit", disabled: submitting || (editingService != null && actionId === editingService.id), className: PRIMARY_ACTION_BUTTON, children: submitting ? "Guardando..." : editingService ? "Guardar cambios" : "Registrar servicio" }), _jsx("button", { type: "button", onClick: closeModal, className: SECONDARY_BUTTON_SM, children: "Cancelar" }), editingService ? (_jsx("button", { type: "button", disabled: submitting || actionId === editingService.id, onClick: () => void handleDeleteFromEdit(), className: DESTRUCTIVE_BUTTON_SM, children: "Eliminar servicio" })) : null] })] }) })] }) })) : null, _jsx("div", { className: STICKY_PRIMARY_MOBILE_DOCK, children: _jsx("button", { type: "button", onClick: openCreateModal, className: PRIMARY_ACTION_BUTTON, children: "Nuevo servicio" }) })] }));
}
function StatusAccordion({ title, tone, open, onToggle, stats, emptyHint, children }) {
    const toneBadge = tone === "amber"
        ? "border-amber-500/30 bg-amber-500/15 text-amber-200"
        : tone === "emerald"
            ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-200"
            : "border-slate-600 bg-slate-800 text-slate-300";
    return (_jsxs("section", { className: LIST_PAGE_ACCORDION_SHELL, children: [_jsxs("button", { type: "button", className: LIST_PAGE_ACCORDION_TRIGGER, onClick: onToggle, "aria-expanded": open, children: [_jsxs("div", { className: "flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:gap-3", children: [_jsx("span", { className: "text-lg font-semibold text-slate-100", children: title }), _jsx("span", { className: `${LIST_PAGE_COUNT_BADGE} ${toneBadge}`, children: stats.count })] }), _jsx(ChevronDown, { open: open })] }), open ? (_jsx("div", { className: LIST_PAGE_ACCORDION_BODY, children: stats.count === 0 ? (_jsx("p", { className: "py-3 text-sm text-slate-500", children: emptyHint })) : (children) })) : null] }));
}
function CompletedSubsection({ label, accent, rows, actionId, onComplete, onCancel, onDelete, onEditService }) {
    const st = aggregateStats(rows);
    return (_jsxs("div", { className: `rounded-lg border ${accent} p-4`, children: [_jsxs("div", { className: "mb-3 flex flex-wrap items-center justify-between gap-2", children: [_jsx("h3", { className: "text-sm font-semibold uppercase tracking-wide text-slate-300", children: label }), _jsx(StatusBadge, { variant: "neutral", size: "table", className: "tabular-nums", children: st.count })] }), _jsx(ServiceListSection, { rows: rows, actionId: actionId, completedActions: true, onEditService: onEditService, onComplete: onComplete, onCancel: onCancel, onDelete: onDelete })] }));
}
/** Botones táctiles en cards móvil de servicios */
const SERVICE_CARD_ACTION_TOUCH = "min-h-[44px] w-full justify-center px-4 py-2.5 text-sm font-semibold";
function ServiceListSection({ rows, actionId, completedActions = false, onEditService, onComplete, onCancel, onDelete }) {
    if (rows.length === 0)
        return null;
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "hidden overflow-hidden rounded-lg border border-slate-800 bg-slate-900/50 md:block", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full min-w-[720px] text-left text-xs text-slate-200", children: [_jsx("thead", { className: "bg-slate-950/80 text-[10px] uppercase tracking-wide text-slate-500", children: _jsxs("tr", { children: [_jsx("th", { className: "px-2 py-2", children: "Fecha" }), _jsx("th", { className: "px-2 py-2", children: "Titulo" }), _jsx("th", { className: "px-2 py-2", children: "Tipo" }), _jsx("th", { className: "px-2 py-2", children: "Cliente" }), _jsx("th", { className: "px-2 py-2", children: "Estado" }), _jsx("th", { className: "px-2 py-2", children: "Venta" }), _jsx("th", { className: "px-2 py-2", children: "Beneficio" }), _jsx("th", { className: "px-2 py-2 text-right", children: "Acciones" })] }) }), _jsx("tbody", { className: "divide-y divide-slate-800", children: rows.map((s) => (_jsx(ServiceTableRow, { s: s, actionId: actionId, completedActions: completedActions, onEditService: onEditService, onComplete: onComplete, onCancel: onCancel, onDelete: onDelete }, s.id))) })] }) }) }), _jsx("div", { className: "space-y-2 md:hidden", children: rows.map((s) => (_jsx(ServiceCard, { s: s, actionId: actionId, completedActions: completedActions, onEditService: onEditService, onComplete: onComplete, onCancel: onCancel, onDelete: onDelete }, s.id))) })] }));
}
function ServiceTableRow({ s, actionId, completedActions = false, onEditService, onComplete, onCancel, onDelete }) {
    const d = new Date(s.serviceDate);
    const dateStr = d.toLocaleDateString("es-ES");
    const spareHint = spareSaleSummary(s);
    return (_jsxs("tr", { className: "transition hover:bg-slate-800/40", children: [_jsx("td", { className: "whitespace-nowrap px-2 py-2 text-slate-400", children: dateStr }), _jsxs("td", { className: "max-w-[200px] px-2 py-2", children: [_jsx("div", { className: "truncate font-medium text-slate-100", title: s.title, children: s.title }), spareHint ? (_jsx("div", { className: "truncate text-[10px] text-slate-500", title: spareHint, children: spareHint })) : null] }), _jsx("td", { className: "max-w-[100px] truncate px-2 py-2 text-[11px] text-slate-400", title: SERVICE_LABELS[s.type], children: SERVICE_LABELS[s.type] }), _jsxs("td", { className: "max-w-[120px] px-2 py-2 text-slate-300", children: [_jsx("div", { className: "truncate font-medium", title: s.customerName, children: s.customerName }), _jsx(CustomerProfileLink, { customerName: s.customerName, customerPhone: s.customerPhone, className: "mt-0.5 inline-flex text-[10px]" })] }), _jsx("td", { className: "px-2 py-2", children: _jsx(StatusBadge, { variant: serviceStatusVariant(s.status), size: "table", children: STATUS_LABELS[s.status] }) }), _jsx("td", { className: "whitespace-nowrap px-2 py-2 text-slate-300", children: money(s.salePrice) }), _jsx("td", { className: "whitespace-nowrap px-2 py-2 text-emerald-300/90", children: money(s.profit) }), _jsx("td", { className: "px-2 py-2", children: _jsxs("div", { className: "flex flex-wrap justify-end gap-1", children: [s.status === "PENDING" ? (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", disabled: actionId === s.id, onClick: () => onComplete(s.id), className: PRIMARY_ACTION_BUTTON_COMPACT, children: "Completar" }), _jsx("button", { type: "button", disabled: actionId === s.id, onClick: () => onCancel(s.id), className: SECONDARY_BUTTON_SM, children: "Cancelar" })] })) : null, completedActions && s.status === "COMPLETED" && onEditService ? (_jsx("button", { type: "button", disabled: actionId === s.id, onClick: () => onEditService(s), className: ORANGE_EDIT_BUTTON_SM, children: "Editar" })) : (_jsx("button", { type: "button", disabled: actionId === s.id, onClick: () => onDelete(s.id), className: DESTRUCTIVE_BUTTON_SM, children: "Eliminar" }))] }) })] }));
}
function ServiceCard({ s, actionId, completedActions = false, onEditService, onComplete, onCancel, onDelete }) {
    const d = new Date(s.serviceDate);
    const spareHint = spareSaleSummary(s);
    return (_jsxs("article", { className: "rounded-xl border border-slate-800 bg-slate-950/60 p-3 shadow-sm", children: [_jsxs("div", { className: "flex flex-wrap items-start justify-between gap-2", children: [_jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("p", { className: "line-clamp-2 break-words font-semibold text-slate-100", children: s.title }), spareHint ? (_jsx("p", { className: "truncate text-[11px] text-slate-500", title: spareHint, children: spareHint })) : null, _jsx("p", { className: "text-[11px] text-slate-500", children: d.toLocaleDateString("es-ES") }), _jsx("p", { className: "mt-0.5 truncate text-[11px] text-slate-400", title: SERVICE_LABELS[s.type], children: SERVICE_LABELS[s.type] })] }), _jsx(StatusBadge, { variant: serviceStatusVariant(s.status), size: "table", children: STATUS_LABELS[s.status] })] }), _jsx("p", { className: "truncate text-sm text-slate-300", children: s.customerName }), _jsx(CustomerProfileLink, { customerName: s.customerName, customerPhone: s.customerPhone, className: "mt-1 inline-flex text-xs" }), _jsxs("dl", { className: "mt-3 space-y-1.5 border-t border-slate-800 pt-3 text-sm", children: [_jsxs("div", { className: "flex justify-between gap-3", children: [_jsx("dt", { className: "shrink-0 text-xs text-slate-500", children: "Coste" }), _jsx("dd", { className: "min-w-0 text-right font-medium text-slate-300", children: money(s.costPrice) })] }), _jsxs("div", { className: "flex justify-between gap-3", children: [_jsx("dt", { className: "shrink-0 text-xs text-slate-500", children: "Venta" }), _jsx("dd", { className: "min-w-0 text-right text-base font-semibold text-emerald-300", children: money(s.salePrice) })] }), _jsxs("div", { className: "flex justify-between gap-3", children: [_jsx("dt", { className: "shrink-0 text-xs text-slate-500", children: "Beneficio" }), _jsx("dd", { className: "min-w-0 text-right text-base font-semibold text-emerald-300", children: money(s.profit) })] })] }), _jsxs("div", { className: "mt-3 flex flex-col gap-2 border-t border-slate-800 pt-3", children: [s.status === "PENDING" ? (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", disabled: actionId === s.id, onClick: () => onComplete(s.id), className: `${PRIMARY_ACTION_BUTTON} text-sm`, children: "Completar" }), _jsx("button", { type: "button", disabled: actionId === s.id, onClick: () => onCancel(s.id), className: `${SECONDARY_BUTTON} ${SERVICE_CARD_ACTION_TOUCH}`, children: "Cancelar" })] })) : null, completedActions && s.status === "COMPLETED" && onEditService ? (_jsx("button", { type: "button", disabled: actionId === s.id, onClick: () => onEditService(s), className: ORANGE_EDIT_BUTTON_CARD, children: "Editar" })) : (_jsx("button", { type: "button", disabled: actionId === s.id, onClick: () => onDelete(s.id), className: `${DESTRUCTIVE_BUTTON_SM} ${SERVICE_CARD_ACTION_TOUCH}`, children: "Eliminar" }))] })] }));
}
