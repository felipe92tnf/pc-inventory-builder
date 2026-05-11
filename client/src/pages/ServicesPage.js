import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import * as servicesApi from "../api/services";
import { useParts } from "../hooks/useParts";
import { useServices } from "../hooks/useServices";
import { isPartPiece } from "../types/part";
import { SERVICE_TYPES, SERVICE_STATUSES } from "../types/service";
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
function ChevronDown({ open }) {
    return (_jsx("svg", { className: `h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`, fill: "none", viewBox: "0 0 24 24", strokeWidth: 2, stroke: "currentColor", "aria-hidden": true, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M19 9l-7 7-7-7" }) }));
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
    const partsForSpare = useMemo(() => parts.filter((p) => isPartPiece(p) && p.stock > 0), [parts]);
    const [monthlyRows, setMonthlyRows] = useState([]);
    useEffect(() => {
        void servicesApi.getMonthlyServicesSummary().then(setMonthlyRows).catch(() => setMonthlyRows([]));
    }, []);
    const summaryBucket = useMemo(() => {
        return monthlyRows.find((r) => r.month === filterMonth && r.year === filterYear);
    }, [monthlyRows, filterMonth, filterYear]);
    const statsFromList = useMemo(() => {
        const completed = services.filter((s) => s.status === "COMPLETED");
        const pending = services.filter((s) => s.status === "PENDING");
        const revenue = completed.reduce((a, s) => a + s.salePrice, 0);
        const profit = completed.reduce((a, s) => a + s.profit, 0);
        return {
            revenue,
            profit,
            completedCount: completed.length,
            pendingCount: pending.length
        };
    }, [services]);
    const showGlobalMonthly = filterType === "ALL" && filterStatus === "ALL" && summaryBucket !== undefined;
    const displayRevenue = showGlobalMonthly ? summaryBucket.totalRevenue : statsFromList.revenue;
    const displayProfit = showGlobalMonthly ? summaryBucket.totalProfit : statsFromList.profit;
    const displayCompleted = showGlobalMonthly ? summaryBucket.servicesCount : statsFromList.completedCount;
    const [mobileFormOpen, setMobileFormOpen] = useState(false);
    const [formType, setFormType] = useState("DIAGNOSTIC");
    const [title, setTitle] = useState("");
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [description, setDescription] = useState("");
    const [selectedPartId, setSelectedPartId] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [costPrice, setCostPrice] = useState("");
    const [salePrice, setSalePrice] = useState("");
    const [isHomeService, setIsHomeService] = useState(false);
    const [homeServiceAddress, setHomeServiceAddress] = useState("");
    const [homeServiceSupplement, setHomeServiceSupplement] = useState("");
    const [serviceDate, setServiceDate] = useState(toIsoDate(new Date()));
    const [paymentMethod, setPaymentMethod] = useState("");
    const [notes, setNotes] = useState("");
    const selectedPart = useMemo(() => parts.find((p) => p.id === selectedPartId), [parts, selectedPartId]);
    const sparePreview = useMemo(() => {
        if (formType !== "SPARE_PART_SALE" || !selectedPart || !quantity || quantity < 1) {
            return null;
        }
        const sup = typeof homeServiceSupplement === "number" ? homeServiceSupplement : 0;
        const cost = Number(selectedPart.costPrice) * quantity;
        const manual = typeof salePrice === "number" && !Number.isNaN(salePrice) ? salePrice : null;
        if (manual === null) {
            return { cost, sale: null, profit: null };
        }
        const sale = manual + sup;
        return { cost, sale, profit: sale - cost };
    }, [formType, selectedPart, quantity, homeServiceSupplement, salePrice]);
    const resetForm = () => {
        setFormType("DIAGNOSTIC");
        setTitle("");
        setCustomerName("");
        setCustomerPhone("");
        setDescription("");
        setSelectedPartId("");
        setQuantity(1);
        setCostPrice("");
        setSalePrice("");
        setIsHomeService(false);
        setHomeServiceAddress("");
        setHomeServiceSupplement("");
        setServiceDate(toIsoDate(new Date()));
        setPaymentMethod("");
        setNotes("");
    };
    const handleSubmit = async (event) => {
        event.preventDefault();
        const base = {
            type: formType,
            title: title.trim(),
            customerName: customerName.trim(),
            customerPhone: customerPhone.trim(),
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
        if (formType === "SPARE_PART_SALE") {
            if (!selectedPartId) {
                window.alert("Selecciona una pieza.");
                return;
            }
            const manualSale = typeof salePrice === "number" ? salePrice : NaN;
            if (!Number.isFinite(manualSale) || manualSale < 0) {
                window.alert("Indica el precio de venta (puede ser 0).");
                return;
            }
            await createService({
                ...base,
                selectedPartId,
                quantity,
                salePrice: manualSale
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
                quantity: null
            });
        }
        resetForm();
        setMobileFormOpen(false);
        void servicesApi.getMonthlyServicesSummary().then(setMonthlyRows).catch(() => { });
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
    return (_jsxs("div", { className: "mx-auto w-full max-w-7xl space-y-6 px-2 pb-10 text-slate-100 md:px-4", children: [_jsxs("section", { className: "rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 shadow-[0_20px_50px_-24px_rgba(79,70,229,0.75)]", children: [_jsx("h1", { className: "text-2xl font-bold", children: "Servicios" }), _jsx("p", { className: "mt-2 text-sm text-slate-300", children: "Venta de piezas sueltas y servicios tecnicos: limpieza, formateo, diagnostico y mas." })] }), error ? (_jsxs("div", { className: "flex flex-col gap-3 rounded-xl border border-rose-800/70 bg-rose-950/40 px-4 py-3 text-sm text-rose-200 md:flex-row md:items-center md:justify-between", children: [_jsx("span", { children: error }), _jsx("button", { type: "button", onClick: () => {
                            void reload();
                        }, className: "rounded-lg border border-rose-700 bg-rose-900/50 px-3 py-1.5 font-semibold text-rose-100 transition hover:bg-rose-800/70", children: "Reintentar" })] })) : null, _jsxs("section", { className: "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4", children: [_jsxs("div", { className: "rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/40", children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-wide text-slate-500", children: "Ingresos (mes)" }), _jsx("p", { className: "mt-1 text-xl font-bold text-emerald-300", children: money(displayRevenue) }), _jsx("p", { className: "mt-1 text-xs text-slate-500", children: showGlobalMonthly ? "Todos los tipos (API mensual)" : "Lista filtrada" })] }), _jsxs("div", { className: "rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/40", children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-wide text-slate-500", children: "Beneficio (mes)" }), _jsx("p", { className: "mt-1 text-xl font-bold text-cyan-300", children: money(displayProfit) })] }), _jsxs("div", { className: "rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/40", children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-wide text-slate-500", children: "Completados" }), _jsx("p", { className: "mt-1 text-xl font-bold text-slate-100", children: displayCompleted })] }), _jsxs("div", { className: "rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/40", children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-wide text-slate-500", children: "Pendientes" }), _jsx("p", { className: "mt-1 text-xl font-bold text-amber-300", children: statsFromList.pendingCount })] })] }), _jsxs("section", { className: "overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-lg shadow-slate-950/40 md:border-slate-800 md:bg-slate-900/80", children: [_jsxs("button", { type: "button", className: "flex w-full items-center justify-between gap-3 border-b border-slate-800 px-4 py-3.5 text-left md:hidden", onClick: () => setMobileFormOpen((v) => !v), "aria-expanded": mobileFormOpen, children: [_jsx("span", { className: "text-sm font-semibold", children: "Nuevo servicio" }), _jsx(ChevronDown, { open: mobileFormOpen })] }), _jsx("div", { className: mobileFormOpen ? "block md:block" : "hidden md:block", children: _jsxs("form", { onSubmit: (e) => void handleSubmit(e), className: "grid grid-cols-1 gap-4 p-4 pt-3 md:grid-cols-2 md:p-6 md:pt-5", children: [_jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-2", children: ["Tipo", _jsx("select", { value: formType, onChange: (e) => setFormType(e.target.value), className: "min-h-[42px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring", children: SERVICE_TYPES.map((t) => (_jsx("option", { value: t, children: SERVICE_LABELS[t] }, t))) })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-2", children: ["Titulo", _jsx("input", { value: title, onChange: (e) => setTitle(e.target.value), required: true, className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring", placeholder: "Ej: Revision torre cliente Juan" })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Cliente", _jsx("input", { value: customerName, onChange: (e) => setCustomerName(e.target.value), required: true, className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring" })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Telefono", _jsx("input", { value: customerPhone, onChange: (e) => setCustomerPhone(e.target.value), required: true, className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring" })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-2", children: ["Descripcion", _jsx("textarea", { value: description, onChange: (e) => setDescription(e.target.value), rows: 2, className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring" })] }), formType === "SPARE_PART_SALE" ? (_jsxs(_Fragment, { children: [_jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-2", children: ["Pieza (stock disponible)", _jsxs("select", { value: selectedPartId, onChange: (e) => setSelectedPartId(e.target.value), required: true, className: "min-h-[42px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring", children: [_jsx("option", { value: "", children: "Seleccionar..." }), partsForSpare.map((p) => (_jsxs("option", { value: p.id, children: [p.name, " \u2014 stock ", p.stock] }, p.id)))] })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Cantidad", _jsx("input", { type: "number", min: 1, step: 1, value: quantity, onChange: (e) => setQuantity(Number(e.target.value)), required: true, className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring" })] }), selectedPart && quantity >= 1 ? (_jsxs("div", { className: "rounded-lg border border-slate-700 bg-slate-950/50 px-3 py-2 text-sm md:col-span-2", children: [_jsx("p", { className: "text-xs uppercase tracking-wide text-slate-500", children: "Coste desde inventario" }), _jsxs("p", { className: "mt-0.5 font-medium text-slate-200", children: [money(Number(selectedPart.costPrice) * quantity), " (", money(Number(selectedPart.costPrice)), " \u00D7 ", quantity, ")"] })] })) : null, _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-2", children: ["Precio de venta (total piezas)", _jsx("input", { type: "number", min: 0, step: "0.01", value: salePrice === "" ? "" : salePrice, onChange: (e) => setSalePrice(e.target.value === "" ? "" : Number(e.target.value)), required: true, className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring" }), _jsx("span", { className: "text-xs font-normal text-slate-500", children: "Lo que cobras por esta venta (sin contar el suplemento de domicilio abajo)." })] }), sparePreview && sparePreview.sale !== null ? (_jsxs("div", { className: "rounded-xl border border-indigo-500/30 bg-indigo-950/30 p-3 text-sm md:col-span-2", children: [_jsx("p", { className: "font-semibold text-indigo-200", children: "Vista previa (se guardara asi)" }), _jsxs("p", { className: "mt-1 text-slate-300", children: ["Coste total ", money(sparePreview.cost), " \u00B7 Venta total ", money(sparePreview.sale), " \u00B7 Beneficio", " ", money(sparePreview.profit ?? 0)] })] })) : null] })) : (_jsxs(_Fragment, { children: [_jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Precio coste", _jsx("input", { type: "number", min: 0, step: "0.01", value: costPrice === "" ? "" : costPrice, onChange: (e) => setCostPrice(e.target.value === "" ? "" : Number(e.target.value)), required: true, className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring" })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Precio venta (trabajo)", _jsx("input", { type: "number", min: 0, step: "0.01", value: salePrice === "" ? "" : salePrice, onChange: (e) => setSalePrice(e.target.value === "" ? "" : Number(e.target.value)), required: true, className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring" })] })] })), _jsxs("label", { className: "flex items-center gap-2 text-sm font-medium text-slate-200 md:col-span-2", children: [_jsx("input", { type: "checkbox", checked: isHomeService, onChange: (e) => setIsHomeService(e.target.checked), className: "h-4 w-4 rounded border-slate-600 bg-slate-950 text-indigo-500" }), "Servicio a domicilio"] }), isHomeService ? (_jsxs(_Fragment, { children: [_jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-2", children: ["Direccion", _jsx("input", { value: homeServiceAddress, onChange: (e) => setHomeServiceAddress(e.target.value), className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring", placeholder: "Calle, ciudad..." })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-2", children: ["Suplemento domicilio (opcional, EUR)", _jsx("input", { type: "number", min: 0, step: "0.01", value: homeServiceSupplement === "" ? "" : homeServiceSupplement, onChange: (e) => setHomeServiceSupplement(e.target.value === "" ? "" : Number(e.target.value)), className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring" }), _jsx("span", { className: "text-xs font-normal text-slate-500", children: "Se suma al precio de venta (pieza suelta o trabajo segun tipo)." })] })] })) : null, _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Fecha del servicio", _jsx("input", { type: "date", value: serviceDate, onChange: (e) => setServiceDate(e.target.value), required: true, className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring" })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Forma de pago (opcional)", _jsx("input", { value: paymentMethod, onChange: (e) => setPaymentMethod(e.target.value), className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring", placeholder: "Efectivo, Bizum..." })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-2", children: ["Notas internas", _jsx("textarea", { value: notes, onChange: (e) => setNotes(e.target.value), rows: 2, className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring" })] }), _jsx("div", { className: "md:col-span-2", children: _jsx("button", { type: "submit", disabled: submitting, className: "rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50", children: submitting ? "Guardando..." : "Registrar servicio" }) })] }) })] }), _jsxs("section", { className: "rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg md:p-5", children: [_jsx("h2", { className: "mb-3 text-lg font-semibold text-slate-100", children: "Filtros" }), _jsxs("div", { className: "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4", children: [_jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Mes", _jsx("select", { value: filterMonth, onChange: (e) => setFilterMonth(Number(e.target.value)), className: "min-h-[42px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring", children: months.map(([num, label]) => (_jsx("option", { value: num, children: label }, num))) })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Ano", _jsx("select", { value: filterYear, onChange: (e) => setFilterYear(Number(e.target.value)), className: "min-h-[42px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring", children: years.map((y) => (_jsx("option", { value: y, children: y }, y))) })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Tipo", _jsxs("select", { value: filterType, onChange: (e) => setFilterType(e.target.value), className: "min-h-[42px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring", children: [_jsx("option", { value: "ALL", children: "Todos" }), SERVICE_TYPES.map((t) => (_jsx("option", { value: t, children: SERVICE_LABELS[t] }, t)))] })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Estado", _jsxs("select", { value: filterStatus, onChange: (e) => setFilterStatus(e.target.value), className: "min-h-[42px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring", children: [_jsx("option", { value: "ALL", children: "Todos" }), SERVICE_STATUSES.map((s) => (_jsx("option", { value: s, children: STATUS_LABELS[s] }, s)))] })] })] })] }), _jsxs("section", { className: "space-y-3", children: [_jsx("h2", { className: "text-lg font-semibold text-slate-100", children: "Servicios registrados" }), loading ? (_jsx("p", { className: "text-sm text-slate-400", children: "Cargando..." })) : services.length === 0 ? (_jsx("p", { className: "text-sm text-slate-400", children: "No hay servicios en este periodo." })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "hidden overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-lg md:block", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full text-left text-sm text-slate-200", children: [_jsx("thead", { className: "bg-slate-950/70 text-xs uppercase tracking-wide text-slate-400", children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-3", children: "Fecha" }), _jsx("th", { className: "px-4 py-3", children: "Titulo" }), _jsx("th", { className: "px-4 py-3", children: "Tipo" }), _jsx("th", { className: "px-4 py-3", children: "Cliente" }), _jsx("th", { className: "px-4 py-3", children: "Estado" }), _jsx("th", { className: "px-4 py-3", children: "Venta" }), _jsx("th", { className: "px-4 py-3", children: "Beneficio" }), _jsx("th", { className: "px-4 py-3 text-right", children: "Acciones" })] }) }), _jsx("tbody", { className: "divide-y divide-slate-800", children: services.map((s) => (_jsx(ServiceTableRow, { s: s, actionId: actionId, onComplete: (id) => {
                                                        void completeService(id);
                                                        void servicesApi.getMonthlyServicesSummary().then(setMonthlyRows).catch(() => { });
                                                    }, onCancel: (id) => {
                                                        void patchService(id, { status: "CANCELLED" });
                                                        void servicesApi.getMonthlyServicesSummary().then(setMonthlyRows).catch(() => { });
                                                    }, onDelete: (id) => {
                                                        if (window.confirm("Eliminar este servicio?")) {
                                                            void deleteService(id);
                                                            void servicesApi.getMonthlyServicesSummary().then(setMonthlyRows).catch(() => { });
                                                        }
                                                    } }, s.id))) })] }) }) }), _jsx("div", { className: "space-y-3 md:hidden", children: services.map((s) => (_jsx(ServiceCard, { s: s, actionId: actionId, onComplete: (id) => {
                                        void completeService(id);
                                        void servicesApi.getMonthlyServicesSummary().then(setMonthlyRows).catch(() => { });
                                    }, onCancel: (id) => {
                                        void patchService(id, { status: "CANCELLED" });
                                        void servicesApi.getMonthlyServicesSummary().then(setMonthlyRows).catch(() => { });
                                    }, onDelete: (id) => {
                                        if (window.confirm("Eliminar este servicio?")) {
                                            void deleteService(id);
                                            void servicesApi.getMonthlyServicesSummary().then(setMonthlyRows).catch(() => { });
                                        }
                                    } }, s.id))) })] }))] })] }));
}
function ServiceTableRow({ s, actionId, onComplete, onCancel, onDelete }) {
    const d = new Date(s.serviceDate);
    const dateStr = d.toLocaleDateString("es-ES");
    return (_jsxs("tr", { className: "transition hover:bg-slate-800/40", children: [_jsx("td", { className: "whitespace-nowrap px-4 py-3 text-slate-400", children: dateStr }), _jsx("td", { className: "max-w-[180px] px-4 py-3 font-medium text-slate-100", children: s.title }), _jsx("td", { className: "px-4 py-3 text-xs text-slate-400", children: SERVICE_LABELS[s.type] }), _jsx("td", { className: "max-w-[140px] px-4 py-3 text-slate-300", children: s.customerName }), _jsx("td", { className: "px-4 py-3", children: _jsx("span", { className: `rounded-full border px-2 py-0.5 text-xs font-semibold ${s.status === "COMPLETED"
                        ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                        : s.status === "PENDING"
                            ? "border-amber-500/40 bg-amber-500/15 text-amber-300"
                            : "border-slate-600 bg-slate-800 text-slate-400"}`, children: STATUS_LABELS[s.status] }) }), _jsx("td", { className: "px-4 py-3 text-slate-300", children: money(s.salePrice) }), _jsx("td", { className: "px-4 py-3 text-emerald-300/90", children: money(s.profit) }), _jsx("td", { className: "px-4 py-3", children: _jsxs("div", { className: "flex flex-wrap justify-end gap-2", children: [s.status === "PENDING" ? (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", disabled: actionId === s.id, onClick: () => onComplete(s.id), className: "rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-50", children: "Completar" }), _jsx("button", { type: "button", disabled: actionId === s.id, onClick: () => onCancel(s.id), className: "rounded-lg border border-slate-600 bg-slate-800 px-2 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-700 disabled:opacity-50", children: "Cancelar" })] })) : null, _jsx("button", { type: "button", disabled: actionId === s.id, onClick: () => onDelete(s.id), className: "rounded-lg border border-rose-500/40 bg-rose-500/10 px-2 py-1 text-xs font-semibold text-rose-200 hover:bg-rose-500/20 disabled:opacity-50", children: "Eliminar" })] }) })] }));
}
function ServiceCard({ s, actionId, onComplete, onCancel, onDelete }) {
    const d = new Date(s.serviceDate);
    return (_jsxs("article", { className: "rounded-2xl border border-slate-800 bg-slate-950/50 p-4 shadow-md", children: [_jsxs("div", { className: "flex flex-wrap items-start justify-between gap-2", children: [_jsxs("div", { children: [_jsx("p", { className: "font-semibold text-slate-100", children: s.title }), _jsx("p", { className: "text-xs text-slate-500", children: d.toLocaleDateString("es-ES") })] }), _jsx("span", { className: `shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold ${s.status === "COMPLETED"
                            ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                            : s.status === "PENDING"
                                ? "border-amber-500/40 bg-amber-500/15 text-amber-300"
                                : "border-slate-600 bg-slate-800 text-slate-400"}`, children: STATUS_LABELS[s.status] })] }), _jsx("p", { className: "mt-2 text-sm text-slate-400", children: SERVICE_LABELS[s.type] }), _jsx("p", { className: "text-sm text-slate-300", children: s.customerName }), _jsxs("dl", { className: "mt-3 grid grid-cols-2 gap-2 border-t border-slate-800 pt-3 text-sm", children: [_jsxs("div", { children: [_jsx("dt", { className: "text-xs text-slate-500", children: "Venta" }), _jsx("dd", { className: "font-medium text-slate-200", children: money(s.salePrice) })] }), _jsxs("div", { children: [_jsx("dt", { className: "text-xs text-slate-500", children: "Beneficio" }), _jsx("dd", { className: "font-medium text-emerald-300", children: money(s.profit) })] })] }), _jsxs("div", { className: "mt-3 flex flex-wrap gap-2", children: [s.status === "PENDING" ? (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", disabled: actionId === s.id, onClick: () => onComplete(s.id), className: "rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-200 disabled:opacity-50", children: "Completar" }), _jsx("button", { type: "button", disabled: actionId === s.id, onClick: () => onCancel(s.id), className: "rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 disabled:opacity-50", children: "Cancelar servicio" })] })) : null, _jsx("button", { type: "button", disabled: actionId === s.id, onClick: () => onDelete(s.id), className: "rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-200 disabled:opacity-50", children: "Eliminar" })] })] }));
}
