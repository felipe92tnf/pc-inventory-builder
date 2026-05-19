import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import * as extraTemplatesApi from "../api/extraTemplates";
import * as servicesApi from "../api/services";
import { useParts } from "../hooks/useParts";
import { ServiceConceptLinesSection } from "../components/services/ServiceConceptLinesSection";
import { ServiceSparePartsSection } from "../components/services/ServiceSparePartsSection";
import { CustomerPicker } from "../components/customers/CustomerPicker";
import { SERVICE_TYPES } from "../types/service";
import { isServiceCatalogCategory } from "../constants/serviceCatalog";
import { conceptLinesToPayload, linesCostTotal, isHomeDeliveryLine, linesFromService, linesSaleTotal, newConceptLine, templateLinesFromService } from "../utils/serviceConceptLines";
import { downloadServicePdf } from "../utils/servicePdfExport";
import { PRIMARY_ACTION_BUTTON, PRIMARY_ACTION_BUTTON_COMPACT, SECONDARY_BUTTON_SM, DESTRUCTIVE_BUTTON_SM } from "../theme/actionButtons";
import { SUMMARY_CARD_GRID, SUMMARY_CARD_LABEL, SUMMARY_CARD_SHELL, SUMMARY_VALUE_NEGATIVE, SUMMARY_VALUE_NEUTRAL, SUMMARY_VALUE_PROFIT_POS, SUMMARY_VALUE_REVENUE } from "../theme/summaryCards";
import { PAGE_HEADER_COMPACT, SECTION_SHELL } from "../theme/layoutDensity";
import { StatusBadge, serviceStatusVariant } from "../components/ui/StatusBadge";
const SERVICE_PAGE_SHELL = "mx-auto w-full max-w-7xl space-y-3 px-2 pb-5 text-slate-100 md:space-y-3.5 md:px-4";
const SERVICE_SECTION = "rounded-xl border border-slate-800 bg-slate-900/80 p-3 shadow-md shadow-slate-950/30 md:p-4";
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
const FIELD = "min-h-[40px] w-full rounded-lg border border-slate-700 bg-slate-950/70 px-2.5 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring";
function money(n) {
    return `${n.toFixed(2)} EUR`;
}
function toIsoDateInput(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}
function syncFromService(service) {
    const spareLines = service.sparePartLines && service.sparePartLines.length > 0
        ? service.sparePartLines.map((l) => ({ partId: l.partId, quantity: l.quantity }))
        : service.selectedPartId && service.quantity
            ? [{ partId: service.selectedPartId, quantity: service.quantity }]
            : [{ partId: "", quantity: 1 }];
    const conceptLines = linesFromService(service);
    const manual = (service.extraLines ?? []).filter((l) => l.extraTemplateId == null);
    const conceptSale = manual.reduce((s, l) => s + Number(l.unitSalePrice) * l.quantity, 0);
    const templateSale = (service.extraLines ?? [])
        .filter((l) => l.extraTemplateId != null)
        .reduce((s, l) => s + Number(l.unitSalePrice) * l.quantity, 0);
    const legacySup = Number(service.homeServiceSupplement ?? 0);
    const spareSalePrice = service.type === "SPARE_PART_SALE"
        ? Math.max(0, Math.round((Number(service.salePrice) - conceptSale - templateSale - legacySup) * 100) / 100)
        : "";
    return {
        formType: service.type,
        title: service.title ?? "",
        customerFields: {
            customerId: service.customerId ?? null,
            customerName: service.customerName,
            customerPhone: service.customerPhone,
            customerEmail: service.customerEmail ?? ""
        },
        description: service.description ?? "",
        notes: service.notes ?? "",
        serviceDate: toIsoDateInput(new Date(service.serviceDate)),
        paymentMethod: service.paymentMethod ?? "",
        status: service.status,
        isHomeService: service.isHomeService || conceptLines.some(isHomeDeliveryLine),
        homeServiceAddress: service.homeServiceAddress ?? "",
        conceptLines,
        templateLines: templateLinesFromService(service).map((l) => ({
            extraTemplateId: l.extraTemplateId,
            quantity: l.quantity,
            unitCost: Number(l.unitCost),
            unitSalePrice: Number(l.unitSalePrice)
        })),
        spareLines,
        spareSalePrice
    };
}
export function ServiceDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const serviceId = String(id ?? "");
    const { parts } = useParts();
    const [service, setService] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState(null);
    const [savedFlash, setSavedFlash] = useState(false);
    const [pdfGenerating, setPdfGenerating] = useState(false);
    const [pdfError, setPdfError] = useState(null);
    const [servicePresets, setServicePresets] = useState([]);
    const [formType, setFormType] = useState("DIAGNOSTIC");
    const [title, setTitle] = useState("");
    const [customerFields, setCustomerFields] = useState({
        customerId: null,
        customerName: "",
        customerPhone: "",
        customerEmail: ""
    });
    const [description, setDescription] = useState("");
    const [notes, setNotes] = useState("");
    const [serviceDate, setServiceDate] = useState(toIsoDateInput(new Date()));
    const [paymentMethod, setPaymentMethod] = useState("");
    const [status, setStatus] = useState("PENDING");
    const [isHomeService, setIsHomeService] = useState(false);
    const [homeServiceAddress, setHomeServiceAddress] = useState("");
    const [conceptLines, setConceptLines] = useState([newConceptLine()]);
    const [templateLines, setTemplateLines] = useState([]);
    const [spareLines, setSpareLines] = useState([{ partId: "", quantity: 1 }]);
    const [spareSalePrice, setSpareSalePrice] = useState("");
    const syncedIdRef = useRef(null);
    const reload = useCallback(async () => {
        if (!serviceId)
            return;
        setLoading(true);
        setError(null);
        try {
            const row = await servicesApi.getService(serviceId);
            setService(row);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo cargar el servicio.");
            setService(null);
        }
        finally {
            setLoading(false);
        }
    }, [serviceId]);
    useEffect(() => {
        void reload();
    }, [reload]);
    useEffect(() => {
        let cancelled = false;
        void extraTemplatesApi.listExtraTemplates(true).then((rows) => {
            if (!cancelled) {
                setServicePresets(rows.filter((t) => t.active && isServiceCatalogCategory(t.category)));
            }
        });
        return () => {
            cancelled = true;
        };
    }, []);
    useEffect(() => {
        if (!service || syncedIdRef.current === service.id)
            return;
        syncedIdRef.current = service.id;
        const s = syncFromService(service);
        setFormType(s.formType);
        setTitle(s.title);
        setCustomerFields(s.customerFields);
        setDescription(s.description);
        setNotes(s.notes);
        setServiceDate(s.serviceDate);
        setPaymentMethod(s.paymentMethod);
        setStatus(s.status);
        setIsHomeService(s.isHomeService);
        setHomeServiceAddress(s.homeServiceAddress);
        setConceptLines(s.conceptLines);
        setTemplateLines(s.templateLines);
        setSpareLines(s.spareLines);
        setSpareSalePrice(s.spareSalePrice);
    }, [service]);
    const conceptCost = useMemo(() => linesCostTotal(conceptLines), [conceptLines]);
    const conceptSale = useMemo(() => linesSaleTotal(conceptLines), [conceptLines]);
    const spareInventoryCost = useMemo(() => {
        if (formType !== "SPARE_PART_SALE")
            return 0;
        let cost = 0;
        for (const line of spareLines) {
            if (!line.partId || line.quantity < 1)
                continue;
            const p = parts.find((x) => x.id === line.partId);
            if (p)
                cost += Number(p.costPrice) * line.quantity;
        }
        return Math.round(cost * 100) / 100;
    }, [formType, spareLines, parts]);
    const totalCost = useMemo(() => {
        if (formType === "SPARE_PART_SALE")
            return Math.round((spareInventoryCost + conceptCost) * 100) / 100;
        return conceptCost;
    }, [formType, spareInventoryCost, conceptCost]);
    const totalSale = useMemo(() => {
        if (formType === "SPARE_PART_SALE") {
            const pieces = typeof spareSalePrice === "number" ? spareSalePrice : 0;
            return Math.round((pieces + conceptSale) * 100) / 100;
        }
        return conceptSale;
    }, [formType, spareSalePrice, conceptSale]);
    const profit = totalSale - totalCost;
    const conceptCount = conceptLines.filter((l) => l.name.trim()).length;
    const lockedSpareParts = service?.status === "COMPLETED" && service.type === "SPARE_PART_SALE";
    const headerClient = [customerFields.customerName.trim(), customerFields.customerPhone.trim()]
        .filter(Boolean)
        .join(" · ");
    const buildPatch = () => {
        const manual = conceptLinesToPayload(conceptLines);
        const patch = {
            type: formType,
            title: title.trim(),
            customerId: customerFields.customerId,
            customerName: customerFields.customerName.trim(),
            customerPhone: customerFields.customerPhone.trim(),
            customerEmail: customerFields.customerEmail.trim() || null,
            description: description.trim(),
            isHomeService,
            homeServiceAddress: isHomeService ? homeServiceAddress.trim() || null : null,
            homeServiceSupplement: null,
            serviceDate: new Date(serviceDate).toISOString(),
            paymentMethod: paymentMethod.trim() || null,
            notes: notes.trim() || null,
            status,
            manualLines: manual,
            costPrice: totalCost
        };
        if (templateLines && templateLines.length > 0) {
            patch.extraLines = templateLines;
        }
        if (formType === "SPARE_PART_SALE" && !lockedSpareParts) {
            const lines = spareLines
                .filter((l) => l.partId.trim() && l.quantity >= 1)
                .map((l) => ({ partId: l.partId.trim(), quantity: l.quantity }));
            patch.sparePartLines = lines;
            const pieces = typeof spareSalePrice === "number" ? spareSalePrice : 0;
            patch.salePrice = pieces;
        }
        return patch;
    };
    const handleSave = async () => {
        if (!service)
            return false;
        const manual = conceptLinesToPayload(conceptLines);
        if (formType !== "SPARE_PART_SALE" && manual.length === 0 && (templateLines?.length ?? 0) === 0) {
            window.alert("Añade al menos un concepto de servicio.");
            return false;
        }
        if (formType === "SPARE_PART_SALE") {
            const lines = spareLines.filter((l) => l.partId.trim() && l.quantity >= 1);
            if (lines.length === 0) {
                window.alert("Añade al menos una pieza.");
                return false;
            }
            if (typeof spareSalePrice !== "number" || spareSalePrice < 0) {
                window.alert("Indica el precio de venta de las piezas.");
                return false;
            }
        }
        setActionLoading(true);
        setError(null);
        try {
            const updated = await servicesApi.patchService(service.id, buildPatch());
            setService(updated);
            syncedIdRef.current = null;
            setSavedFlash(true);
            window.setTimeout(() => setSavedFlash(false), 2500);
            return true;
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo guardar.");
            return false;
        }
        finally {
            setActionLoading(false);
        }
    };
    const handleComplete = async () => {
        if (!service)
            return;
        const saved = await handleSave();
        if (!saved)
            return;
        setActionLoading(true);
        try {
            const updated = await servicesApi.completeService(service.id);
            setService(updated);
            syncedIdRef.current = null;
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo completar.");
        }
        finally {
            setActionLoading(false);
        }
    };
    const handleDelete = async () => {
        if (!service)
            return;
        if (!window.confirm("Eliminar este servicio? Esta accion no se puede deshacer."))
            return;
        setActionLoading(true);
        try {
            await servicesApi.deleteService(service.id);
            navigate("/services", { state: { flash: "Servicio eliminado." } });
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo eliminar.");
        }
        finally {
            setActionLoading(false);
        }
    };
    const handleDownloadPdf = async () => {
        if (!service)
            return;
        setPdfError(null);
        setPdfGenerating(true);
        try {
            await downloadServicePdf(service);
        }
        catch (err) {
            setPdfError(err instanceof Error ? err.message : "No se pudo generar el PDF.");
        }
        finally {
            setPdfGenerating(false);
        }
    };
    if (!serviceId) {
        return (_jsx("section", { className: SECTION_SHELL, children: _jsx("p", { className: "text-sm text-slate-300", children: "ID de servicio invalido." }) }));
    }
    if (loading) {
        return (_jsx("section", { className: SECTION_SHELL, children: _jsx("p", { className: "text-sm text-slate-300", children: "Cargando servicio\u2026" }) }));
    }
    if (!service) {
        return (_jsxs("section", { className: SECTION_SHELL, children: [_jsx("p", { className: "text-sm text-slate-300", children: "No se encontro el servicio." }), _jsx(Link, { to: "/services", className: "mt-3 inline-flex text-sm text-indigo-300 hover:underline", children: "Volver a servicios" })] }));
    }
    return (_jsxs("div", { className: SERVICE_PAGE_SHELL, children: [savedFlash ? (_jsx("div", { className: "rounded-xl border border-emerald-500/40 bg-emerald-950/50 px-4 py-3 text-sm text-emerald-100", children: "Cambios guardados." })) : null, pdfError ? (_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-800/70 bg-rose-950/40 px-4 py-3 text-sm text-rose-200", children: [_jsx("span", { children: pdfError }), _jsx("button", { type: "button", onClick: () => setPdfError(null), className: SECONDARY_BUTTON_SM, children: "Cerrar" })] })) : null, error ? (_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-800/70 bg-rose-950/40 px-4 py-3 text-sm text-rose-200", children: [_jsx("span", { children: error }), _jsx("button", { type: "button", onClick: () => void reload(), className: SECONDARY_BUTTON_SM, children: "Reintentar" })] })) : null, _jsx("header", { className: `${PAGE_HEADER_COMPACT} !py-2.5 sm:!py-3`, children: _jsxs("div", { className: "flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between", children: [_jsx("div", { className: "min-w-0 flex-1 space-y-1", children: _jsx(HeaderTitleRow, { title: title.trim() || "Servicio", status: status, headerClient: headerClient }) }), _jsxs("div", { className: "flex flex-wrap items-center gap-2 lg:shrink-0 lg:justify-end", children: [_jsx("button", { type: "button", disabled: actionLoading, onClick: () => void handleSave(), className: PRIMARY_ACTION_BUTTON_COMPACT, children: actionLoading ? "Guardando…" : "Guardar" }), status === "PENDING" ? (_jsx("button", { type: "button", disabled: actionLoading, onClick: () => void handleComplete(), className: PRIMARY_ACTION_BUTTON, children: "Completar" })) : null, _jsx("button", { type: "button", disabled: pdfGenerating || actionLoading, onClick: () => void handleDownloadPdf(), className: SECONDARY_BUTTON_SM, children: pdfGenerating ? "PDF…" : "PDF" }), _jsx("button", { type: "button", disabled: actionLoading, onClick: () => void handleDelete(), className: DESTRUCTIVE_BUTTON_SM, children: "Eliminar" }), _jsx(Link, { to: "/services", className: `${SECONDARY_BUTTON_SM} inline-flex items-center justify-center`, children: "\u2190 Servicios" })] })] }) }), _jsxs("section", { className: SERVICE_SECTION, children: [_jsx("h2", { className: "mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500", children: "Informacion" }), _jsxs("div", { className: "grid grid-cols-1 gap-3 md:grid-cols-2", children: [_jsxs("label", { className: "flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 md:col-span-2", children: ["Titulo del servicio", _jsx("input", { value: title, onChange: (e) => setTitle(e.target.value), className: FIELD })] }), _jsxs("label", { className: "flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500", children: ["Tipo", _jsx("select", { value: formType, onChange: (e) => setFormType(e.target.value), className: FIELD, children: SERVICE_TYPES.map((t) => (_jsx("option", { value: t, children: SERVICE_LABELS[t] }, t))) })] }), _jsxs("label", { className: "flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500", children: ["Estado", _jsx("select", { value: status, onChange: (e) => setStatus(e.target.value), className: FIELD, children: ["PENDING", "COMPLETED", "CANCELLED"].map((s) => (_jsx("option", { value: s, children: STATUS_LABELS[s] }, s))) })] }), _jsxs("label", { className: "flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500", children: ["Fecha", _jsx("input", { type: "date", value: serviceDate, onChange: (e) => setServiceDate(e.target.value), className: FIELD })] }), _jsxs("label", { className: "flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500", children: ["Forma de pago", _jsx("input", { value: paymentMethod, onChange: (e) => setPaymentMethod(e.target.value), className: FIELD, placeholder: "Efectivo, Bizum\u2026" })] }), _jsxs("label", { className: "flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 md:col-span-2", children: ["Descripcion", _jsx("textarea", { value: description, onChange: (e) => setDescription(e.target.value), rows: 2, className: FIELD })] }), isHomeService ? (_jsxs("label", { className: "flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 md:col-span-2", children: ["Direccion domicilio", _jsx("input", { value: homeServiceAddress, onChange: (e) => setHomeServiceAddress(e.target.value), className: FIELD })] })) : null, _jsxs("label", { className: "flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 md:col-span-2", children: ["Notas internas", _jsx("textarea", { value: notes, onChange: (e) => setNotes(e.target.value), rows: 2, className: FIELD })] })] })] }), _jsxs("section", { className: SERVICE_SECTION, children: [_jsx("h2", { className: "mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500", children: "Cliente" }), _jsx(CustomerPicker, { value: customerFields, onChange: setCustomerFields, requirePhone: true })] }), formType === "SPARE_PART_SALE" ? (_jsx(ServiceSparePartsSection, { spareLines: spareLines, onLinesChange: setSpareLines, parts: parts, spareSalePrice: spareSalePrice, onSpareSalePriceChange: setSpareSalePrice, locked: lockedSpareParts })) : null, _jsxs("section", { className: SERVICE_SECTION, children: [_jsx("h2", { className: "mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500", children: "Servicios y conceptos" }), _jsx(ServiceConceptLinesSection, { lines: conceptLines, onLinesChange: setConceptLines, servicePresets: servicePresets, isHomeService: isHomeService, onHomeServiceChange: setIsHomeService })] }), _jsxs("div", { children: [_jsx("h2", { className: "mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500", children: "Totales" }), _jsxs("section", { className: SUMMARY_CARD_GRID, children: [_jsxs("article", { className: SUMMARY_CARD_SHELL, children: [_jsx("p", { className: SUMMARY_CARD_LABEL, children: "Coste total" }), _jsx("p", { className: SUMMARY_VALUE_NEUTRAL, children: money(totalCost) })] }), _jsxs("article", { className: SUMMARY_CARD_SHELL, children: [_jsx("p", { className: SUMMARY_CARD_LABEL, children: "Precio venta" }), _jsx("p", { className: SUMMARY_VALUE_REVENUE, children: money(totalSale) })] }), _jsxs("article", { className: SUMMARY_CARD_SHELL, children: [_jsx("p", { className: SUMMARY_CARD_LABEL, children: "Beneficio" }), _jsx("p", { className: profit >= 0 ? SUMMARY_VALUE_PROFIT_POS : SUMMARY_VALUE_NEGATIVE, children: money(profit) })] }), _jsxs("article", { className: SUMMARY_CARD_SHELL, children: [_jsx("p", { className: SUMMARY_CARD_LABEL, children: "Conceptos" }), _jsx("p", { className: SUMMARY_VALUE_NEUTRAL, children: conceptCount })] })] }), _jsx("p", { className: "mt-2 text-xs text-slate-500", children: "Los totales se calculan desde las lineas; no hay campos sueltos de precio." })] })] }));
}
function HeaderTitleRow({ title, status, headerClient }) {
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsx("h1", { className: "min-w-0 truncate text-lg font-bold tracking-tight text-slate-50 sm:text-xl", children: title }), _jsx(StatusBadge, { variant: serviceStatusVariant(status), size: "card", children: STATUS_LABELS[status] })] }), headerClient ? _jsx("p", { className: "truncate text-sm text-slate-400", children: headerClient }) : null] }));
}
