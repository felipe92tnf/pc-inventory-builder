import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import * as salesApi from "../api/sales";
import * as extraTemplatesApi from "../api/extraTemplates";
import { BuildItemsTable } from "../components/builds/BuildItemsTable";
import { BuildExtraLinesTable } from "../components/builds/BuildExtraLinesTable";
import { BuildManualLinesTable } from "../components/builds/BuildManualLinesTable";
import { PcConfiguratorForm } from "../components/builds/PcConfiguratorForm";
import { SellPcModal } from "../components/sales/SellPcModal";
import { useBuildDetail } from "../hooks/useBuildDetail";
import { isConfiguratorPart } from "../types/part";
import { PRIMARY_ACTION_BUTTON_BUILD_CONFIRM, PRIMARY_ACTION_BUTTON_COMPACT, SECONDARY_BUTTON_SM, SECONDARY_GHOST_SM } from "../theme/actionButtons";
import { SUMMARY_CARD_GRID_THREE, SUMMARY_CARD_LABEL, SUMMARY_VALUE_NEGATIVE, SUMMARY_VALUE_NEUTRAL, SUMMARY_VALUE_PROFIT_POS } from "../theme/summaryCards";
import { PAGE_HEADER_COMPACT, SECTION_SHELL } from "../theme/layoutDensity";
import { StatusBadge, buildStatusVariant } from "../components/ui/StatusBadge";
import { buildStatusLabelEs } from "../utils/buildStatusLabel";
import { customerFieldToForm, formatCustomerSubtitle } from "../utils/customerUi";
import { isActiveSale } from "../utils/salesStats";
import { CustomerPicker } from "../components/customers/CustomerPicker";
const BUILD_PAGE_SHELL = "mx-auto w-full max-w-7xl space-y-3 px-2 pb-5 text-slate-100 md:space-y-3.5 md:px-4";
const BUILD_SECTION = "rounded-xl border border-slate-800 bg-slate-900/80 p-3 shadow-md shadow-slate-950/30 md:p-4";
/** KPI alineadas (detalle montaje): misma altura mínima. */
const BUILD_KPI_CARD = "flex min-h-[7.25rem] flex-col justify-between rounded-2xl border border-cyan-500/25 bg-gradient-to-br from-[#0a0f1a] via-[#0c1424] to-[#081018] p-3 shadow-[0_12px_40px_-16px_rgba(6,182,212,0.18)] ring-1 ring-cyan-500/10 sm:min-h-[7.5rem] sm:p-3.5";
function money(value) {
    return `${value.toFixed(2)} EUR`;
}
const OPERATIONAL_STATUS_OPTIONS = [
    { value: "CONFIRMED", label: "Listo para la venta" },
    { value: "PENDING_PICKUP", label: "Pendiente de recogida" },
    { value: "PENDING_PAYMENT", label: "Pendiente de pago" },
    { value: "RESERVED", label: "Reservado" }
];
/** Estados admitidos al confirmar desde borrador (sin venta / sin recogida). */
const CONFIRM_INITIAL_STATUS_OPTIONS = [
    { value: "CONFIRMED", label: "Listo para la venta" },
    { value: "RESERVED", label: "Reservado" },
    { value: "PENDING_PAYMENT", label: "Pendiente de pago" }
];
function isAssembledOperational(status) {
    return (status === "CONFIRMED" ||
        status === "PENDING_PICKUP" ||
        status === "PENDING_PAYMENT" ||
        status === "RESERVED");
}
function parseMoneyInput(raw) {
    const n = Number(raw.replace(",", ".").trim());
    if (!Number.isFinite(n) || n < 0)
        return null;
    return Math.round(n * 100) / 100;
}
function slugForPdfFilename(name) {
    const s = name
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 48);
    return s.length > 0 ? s : "montaje";
}
function roundMoney2(n) {
    return Math.round(n * 100) / 100;
}
/** Restante de reserva = precio de venta total − reserva cobrada (no negativo). */
function reservationRemainingFromTotalAndDeposit(totalSale, deposit) {
    return roundMoney2(Math.max(0, totalSale - deposit));
}
export function BuildDetailPage() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const buildId = String(id ?? "");
    const { build, parts, loading, actionLoading, error, addItem, updateBuildItemLine, removeItem, confirm, revertToDraft, updateBuildFields, reload, addManualLine, addExtraLine, updateExtraLine, removeExtraLine } = useBuildDetail(buildId);
    const [manualName, setManualName] = useState("");
    const [manualDesc, setManualDesc] = useState("");
    const [manualQty, setManualQty] = useState(1);
    const [manualCost, setManualCost] = useState("");
    const [manualSale, setManualSale] = useState("");
    const [linkedSale, setLinkedSale] = useState(null);
    const configuratorParts = useMemo(() => parts.filter(isConfiguratorPart), [parts]);
    /** Precio venta mostrado (override manual o total calculado). */
    const totalSaleShown = useMemo(() => {
        if (!build)
            return 0;
        const shown = build.saleTotalOverride != null
            ? Number(build.totalSale)
            : Number(build.computedSaleTotal ?? build.totalSale);
        return Number.isFinite(shown) ? Math.max(0, shown) : 0;
    }, [build, build?.totalSale, build?.saleTotalOverride, build?.computedSaleTotal]);
    const pricingLocked = build?.status === "SOLD" || build?.status === "PENDING_PICKUP";
    const canOpenSellModal = build &&
        ["CONFIRMED", "PENDING_PAYMENT", "RESERVED"].includes(build.status) &&
        !linkedSale;
    const showPickupBanner = build?.status === "PENDING_PICKUP" && linkedSale && linkedSale.pickupConfirmedAt == null;
    const [saleDraft, setSaleDraft] = useState("");
    const [sellModalOpen, setSellModalOpen] = useState(false);
    const [extraTemplates, setExtraTemplates] = useState([]);
    const [extraTemplateId, setExtraTemplateId] = useState("");
    const [extraQty, setExtraQty] = useState(1);
    useEffect(() => {
        let cancelled = false;
        void extraTemplatesApi.listExtraTemplates(true).then((rows) => {
            if (!cancelled)
                setExtraTemplates(rows);
        });
        return () => {
            cancelled = true;
        };
    }, []);
    const [sellFormKey, setSellFormKey] = useState(0);
    const [flashMessage, setFlashMessage] = useState(null);
    const [pdfGenerating, setPdfGenerating] = useState(false);
    const [pdfError, setPdfError] = useState(null);
    const mountSyncedBuildIdRef = useRef(null);
    const [mountForm, setMountForm] = useState({
        name: "",
        customerId: null,
        customerName: "",
        customerPhone: "",
        notes: "",
        initialStatus: "CONFIRMED",
        confirmResDeposit: "",
        confirmPayPaid: ""
    });
    const [mountDataSaved, setMountDataSaved] = useState(false);
    const [manualConceptOpen, setManualConceptOpen] = useState(false);
    const headerClientLine = useMemo(() => {
        if (!build)
            return null;
        if (build.status === "DRAFT") {
            return formatCustomerSubtitle(mountForm.customerName, mountForm.customerPhone);
        }
        return formatCustomerSubtitle(build.customerName, build.customerPhone);
    }, [build, mountForm.customerName, mountForm.customerPhone]);
    const [opStatus, setOpStatus] = useState("CONFIRMED");
    const [resDeposit, setResDeposit] = useState("");
    const [payPaid, setPayPaid] = useState("");
    /** Restante calculado al editar reserva (estado operativo Reservado). */
    const derivedReservationRemaining = useMemo(() => {
        const d = parseMoneyInput(resDeposit);
        if (d === null)
            return null;
        return reservationRemainingFromTotalAndDeposit(totalSaleShown, d);
    }, [resDeposit, totalSaleShown]);
    /** Restante al confirmar borrador como Reservado. */
    const draftDerivedReservationRemaining = useMemo(() => {
        const d = parseMoneyInput(mountForm.confirmResDeposit);
        if (d === null)
            return null;
        return reservationRemainingFromTotalAndDeposit(totalSaleShown, d);
    }, [mountForm.confirmResDeposit, totalSaleShown]);
    /** Pendiente = total venta − ya cobrado (mismo cálculo que resto de reserva). */
    const derivedPendingRemaining = useMemo(() => {
        const p = parseMoneyInput(payPaid);
        if (p === null)
            return null;
        return reservationRemainingFromTotalAndDeposit(totalSaleShown, p);
    }, [payPaid, totalSaleShown]);
    const draftDerivedPendingRemaining = useMemo(() => {
        const p = parseMoneyInput(mountForm.confirmPayPaid);
        if (p === null)
            return null;
        return reservationRemainingFromTotalAndDeposit(totalSaleShown, p);
    }, [mountForm.confirmPayPaid, totalSaleShown]);
    /** Precio total del montaje al registrar la venta (nunca solo el pendiente). */
    const sellSuggestedPrice = totalSaleShown;
    const sellAmountAlreadyPaid = useMemo(() => {
        if (!build)
            return 0;
        if (build.status === "RESERVED") {
            const d = parseMoneyInput(resDeposit);
            if (d !== null)
                return d;
            return build.reservationDeposit != null ? Number(build.reservationDeposit) : 0;
        }
        if (build.status === "PENDING_PAYMENT") {
            const p = parseMoneyInput(payPaid);
            if (p !== null)
                return p;
            return build.pendingPaymentPaid != null ? Number(build.pendingPaymentPaid) : 0;
        }
        return 0;
    }, [build, resDeposit, payPaid]);
    useEffect(() => {
        if (!build)
            return;
        const shown = build.saleTotalOverride != null
            ? Number(build.totalSale)
            : Number(build.computedSaleTotal ?? build.totalSale);
        if (Number.isFinite(shown)) {
            setSaleDraft(shown.toFixed(2));
        }
    }, [build?.id, build?.totalSale, build?.saleTotalOverride, build?.computedSaleTotal]);
    useEffect(() => {
        if (!build)
            return;
        if (isAssembledOperational(build.status)) {
            setOpStatus(build.status);
        }
        setResDeposit(build.reservationDeposit != null ? Number(build.reservationDeposit).toFixed(2) : "");
        setPayPaid(build.pendingPaymentPaid != null ? Number(build.pendingPaymentPaid).toFixed(2) : "");
    }, [build]);
    useEffect(() => {
        if (!build?.id)
            return;
        let cancelled = false;
        void salesApi.listSales().then((rows) => {
            const active = rows.find((s) => s.buildId === build.id && isActiveSale(s));
            if (!cancelled)
                setLinkedSale(active ?? null);
        });
        return () => {
            cancelled = true;
        };
    }, [build?.id]);
    useEffect(() => {
        const msg = location.state?.flash;
        if (!msg)
            return;
        setFlashMessage(msg);
        navigate(location.pathname, { replace: true, state: {} });
    }, [location.pathname, location.state, navigate]);
    useEffect(() => {
        if (!build)
            return;
        if (mountSyncedBuildIdRef.current === build.id)
            return;
        mountSyncedBuildIdRef.current = build.id;
        setMountForm({
            name: build.name,
            customerId: build.customerId ?? null,
            customerName: customerFieldToForm(build.customerName),
            customerPhone: customerFieldToForm(build.customerPhone),
            notes: build.notes ?? "",
            initialStatus: "CONFIRMED",
            confirmResDeposit: "",
            confirmPayPaid: ""
        });
        setMountDataSaved(false);
    }, [build]);
    useEffect(() => {
        if (loading || !build)
            return;
        if (!["CONFIRMED", "PENDING_PAYMENT", "RESERVED"].includes(build.status))
            return;
        if (location.hash !== "#registrar-venta")
            return;
        setSellFormKey((k) => k + 1);
        setSellModalOpen(true);
        navigate({ pathname: location.pathname, search: location.search, hash: "" }, { replace: true });
    }, [loading, build?.status, build?.id, location.hash, location.pathname, location.search, navigate]);
    const handleAddConfiguratorParts = async (items) => {
        for (const payload of items) {
            if (payload.quantity < 1)
                continue;
            await addItem({
                partId: payload.partId,
                quantity: payload.quantity,
                ...(payload.unitSalePrice !== undefined ? { unitSalePrice: payload.unitSalePrice } : {})
            });
        }
    };
    const handleSaveOperationalStatus = () => {
        if (!build)
            return;
        if (opStatus === "PENDING_PICKUP" && !linkedSale) {
            window.alert("Primero registra la venta con la casilla Cobrado pendiente de recogida activada.");
            return;
        }
        const payload = { status: opStatus };
        if (opStatus === "RESERVED") {
            const d = parseMoneyInput(resDeposit);
            if (d === null) {
                window.alert("Indica la reserva cobrada (numero valido >= 0).");
                return;
            }
            if (d > totalSaleShown + 0.005) {
                window.alert("La reserva cobrada no puede ser mayor que el precio de venta total del montaje.");
                return;
            }
            payload.reservationDeposit = d;
            payload.reservationRemaining = reservationRemainingFromTotalAndDeposit(totalSaleShown, d);
        }
        else if (opStatus === "PENDING_PAYMENT") {
            const p = parseMoneyInput(payPaid);
            if (p === null) {
                window.alert("Indica importe cobrado (numero valido >= 0).");
                return;
            }
            if (p > totalSaleShown + 0.005) {
                window.alert("El importe cobrado no puede ser mayor que el precio de venta total del montaje.");
                return;
            }
            payload.pendingPaymentPaid = p;
            payload.pendingPaymentRemaining = reservationRemainingFromTotalAndDeposit(totalSaleShown, p);
        }
        void updateBuildFields(payload);
    };
    const handleConfirmPickupFromBuild = () => {
        if (!linkedSale)
            return;
        void (async () => {
            try {
                await salesApi.patchSale(linkedSale.id, { pickupConfirmedAt: new Date().toISOString() });
                await reload();
            }
            catch (err) {
                window.alert(err instanceof Error ? err.message : "No se pudo confirmar la recogida.");
            }
        })();
    };
    const handleSaveMountData = async () => {
        if (!mountForm.name.trim()) {
            window.alert("Indica al menos un nombre para el montaje.");
            return;
        }
        try {
            await updateBuildFields({
                name: mountForm.name.trim(),
                notes: mountForm.notes.trim() ? mountForm.notes.trim() : null,
                customerId: mountForm.customerId,
                customerName: mountForm.customerName.trim() ? mountForm.customerName.trim() : null,
                customerPhone: mountForm.customerPhone.trim() ? mountForm.customerPhone.trim() : null,
                customerEmail: null
            });
            setMountDataSaved(true);
            window.setTimeout(() => setMountDataSaved(false), 2800);
        }
        catch (err) {
            window.alert(err instanceof Error ? err.message : "No se pudieron guardar los datos.");
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };
    const handleConfirmMontaje = async () => {
        if (!build)
            return;
        const name = mountForm.name.trim();
        const customerName = mountForm.customerName.trim();
        const phone = mountForm.customerPhone.trim();
        if (!name) {
            window.alert("Indica un nombre para el montaje.");
            return;
        }
        if (!customerName) {
            window.alert("Indica el nombre del cliente.");
            return;
        }
        if (!phone) {
            window.alert("Indica un telefono de contacto.");
            return;
        }
        const saleNum = parseMoneyInput(saleDraft);
        if (saleNum === null) {
            window.alert("Introduce un precio de venta total valido (mayor o igual que 0).");
            return;
        }
        const patch = {
            name,
            notes: mountForm.notes.trim() ? mountForm.notes.trim() : null,
            customerId: mountForm.customerId,
            customerName,
            customerPhone: phone,
            customerEmail: null
        };
        const roundedSale = Math.round(saleNum * 100) / 100;
        const computed = Number(build.computedSaleTotal);
        if (Math.abs(roundedSale - computed) < 0.005) {
            patch.saleTotalOverride = null;
        }
        else {
            patch.saleTotalOverride = roundedSale;
        }
        const confirmPayload = { initialStatus: mountForm.initialStatus };
        if (mountForm.initialStatus === "RESERVED") {
            const d = parseMoneyInput(mountForm.confirmResDeposit);
            if (d === null) {
                window.alert("Indica la reserva cobrada (numero valido >= 0).");
                return;
            }
            const saleTotalForReserve = roundedSale;
            if (d > saleTotalForReserve + 0.005) {
                window.alert("La reserva cobrada no puede ser mayor que el precio de venta total.");
                return;
            }
            confirmPayload.reservationDeposit = d;
            confirmPayload.reservationRemaining = reservationRemainingFromTotalAndDeposit(saleTotalForReserve, d);
        }
        else if (mountForm.initialStatus === "PENDING_PAYMENT") {
            const p = parseMoneyInput(mountForm.confirmPayPaid);
            if (p === null) {
                window.alert("Indica importe ya cobrado (numero valido >= 0).");
                return;
            }
            if (p > roundedSale + 0.005) {
                window.alert("El importe cobrado no puede ser mayor que el precio de venta total.");
                return;
            }
            confirmPayload.pendingPaymentPaid = p;
            confirmPayload.pendingPaymentRemaining = reservationRemainingFromTotalAndDeposit(roundedSale, p);
        }
        try {
            await updateBuildFields(patch);
            await confirm(confirmPayload);
            navigate("/builds", { state: { flash: `Montaje confirmado: ${name}.` } });
        }
        catch (err) {
            window.alert(err instanceof Error ? err.message : "No se pudo confirmar el montaje.");
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };
    const handleDownloadBuildPdf = useCallback(async () => {
        if (!build)
            return;
        setPdfGenerating(true);
        setPdfError(null);
        try {
            const [{ pdf }, { BuildPdfDocument }] = await Promise.all([
                import("@react-pdf/renderer"),
                import("../components/builds/BuildPdfDocument")
            ]);
            const blob = await pdf(_jsx(BuildPdfDocument, { build: build })).toBlob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `montaje-${slugForPdfFilename(build.name)}.pdf`;
            a.rel = "noopener";
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        }
        catch (err) {
            setPdfError(err instanceof Error ? err.message : "No se pudo generar el PDF.");
        }
        finally {
            setPdfGenerating(false);
        }
    }, [build]);
    if (!id) {
        return (_jsx("section", { className: "rounded-2xl border border-rose-800/70 bg-rose-950/40 p-6 text-rose-200", children: "ID de montaje invalido." }));
    }
    if (loading) {
        return (_jsx("section", { className: SECTION_SHELL, children: _jsx("p", { className: "text-sm text-slate-300", children: "Cargando detalle del montaje..." }) }));
    }
    if (!build) {
        return (_jsx("section", { className: SECTION_SHELL, children: _jsx("p", { className: "text-sm text-slate-300", children: "No se encontro el montaje solicitado." }) }));
    }
    return (_jsxs("div", { className: BUILD_PAGE_SHELL, children: [flashMessage ? (_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/40 bg-emerald-950/50 px-4 py-3 text-sm text-emerald-100", children: [_jsx("span", { children: flashMessage }), _jsx("button", { type: "button", onClick: () => setFlashMessage(null), className: "rounded-lg border border-emerald-600/50 px-3 py-1 text-xs font-semibold text-emerald-200 hover:bg-emerald-900/40", children: "Cerrar" })] })) : null, pdfError ? (_jsxs("div", { className: "mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-800/70 bg-rose-950/40 px-4 py-3 text-sm text-rose-200", children: [_jsx("span", { children: pdfError }), _jsx("button", { type: "button", onClick: () => setPdfError(null), className: "rounded-lg border border-rose-700 bg-rose-900/50 px-3 py-1 text-xs font-semibold text-rose-100 hover:bg-rose-800/70", children: "Cerrar" })] })) : null, _jsx("header", { className: `${PAGE_HEADER_COMPACT} !py-2.5 sm:!py-3`, children: _jsxs("div", { className: "flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4", children: [_jsxs("div", { className: "min-w-0 flex-1 space-y-1", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsx("h1", { className: "min-w-0 max-w-full truncate text-lg font-bold tracking-tight text-slate-50 sm:text-xl", children: build.status === "DRAFT" ? mountForm.name.trim() || "Montaje en borrador" : build.name }), _jsx(StatusBadge, { variant: buildStatusVariant(build.status), size: "card", children: buildStatusLabelEs(build.status) })] }), headerClientLine ? (_jsx("p", { className: "truncate text-sm text-slate-400", children: headerClientLine })) : null] }), _jsxs("div", { className: "flex flex-wrap items-center gap-2 lg:shrink-0 lg:justify-end", children: [showPickupBanner ? (_jsx("button", { type: "button", disabled: actionLoading, onClick: () => handleConfirmPickupFromBuild(), className: "rounded-lg border border-emerald-500/50 bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-500/25 disabled:opacity-50 sm:text-sm", children: "Confirmar recogida" })) : null, linkedSale ? (_jsx(Link, { to: `/sales/${linkedSale.id}`, className: "text-xs font-semibold text-cyan-300 underline-offset-2 hover:text-cyan-200 hover:underline sm:text-sm", children: "Ver venta" })) : build.status === "SOLD" ? (_jsx("span", { className: "text-xs text-slate-500", children: "Buscando venta\u2026" })) : null, _jsx("button", { type: "button", disabled: pdfGenerating || actionLoading, onClick: () => void handleDownloadBuildPdf(), className: SECONDARY_BUTTON_SM, children: pdfGenerating ? "PDF…" : "Descargar PDF" }), canOpenSellModal ? (_jsx("button", { type: "button", disabled: actionLoading, onClick: () => {
                                        setSellFormKey((k) => k + 1);
                                        setSellModalOpen(true);
                                    }, className: PRIMARY_ACTION_BUTTON_COMPACT, children: "Vender PC" })) : null, _jsx(Link, { to: "/builds", className: `${SECONDARY_BUTTON_SM} inline-flex items-center justify-center`, children: "\u2190 Montajes" })] })] }) }), error ? (_jsxs("div", { className: "flex flex-col gap-3 rounded-xl border border-rose-800/70 bg-rose-950/40 px-4 py-3 text-sm text-rose-200 md:flex-row md:items-center md:justify-between", children: [_jsx("span", { children: error }), _jsx("button", { type: "button", onClick: () => {
                            void reload();
                        }, className: "rounded-lg border border-rose-700 bg-rose-900/50 px-3 py-1.5 font-semibold text-rose-100 transition hover:bg-rose-800/70", children: "Reintentar" })] })) : null, (build.status === "DRAFT" || isAssembledOperational(build.status)) ? (_jsxs("section", { className: BUILD_SECTION, children: [_jsx("h2", { className: "mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500", children: "Informaci\u00F3n" }), build.status === "DRAFT" ? (_jsxs(_Fragment, { children: [mountDataSaved ? (_jsx("p", { className: "mb-2 text-xs font-medium text-emerald-300/90", children: "Guardado." })) : null, _jsxs("div", { className: "grid grid-cols-1 gap-2.5 md:grid-cols-2", children: [_jsxs("label", { className: "flex flex-col gap-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 md:col-span-2", children: ["Nombre del montaje", _jsx("input", { value: mountForm.name, onChange: (e) => setMountForm((m) => ({ ...m, name: e.target.value })), disabled: actionLoading, className: "min-h-[36px] rounded-lg border border-slate-700 bg-slate-950/70 px-2.5 py-1.5 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring", placeholder: "Ej: PC Oficina Garcia" })] }), _jsx("div", { className: "md:col-span-2", children: _jsx(CustomerPicker, { value: {
                                                customerId: mountForm.customerId,
                                                customerName: mountForm.customerName,
                                                customerPhone: mountForm.customerPhone,
                                                customerEmail: ""
                                            }, onChange: (c) => setMountForm((m) => ({
                                                ...m,
                                                customerId: c.customerId,
                                                customerName: c.customerName,
                                                customerPhone: c.customerPhone
                                            })), requireName: false, requirePhone: false }) }), _jsxs("label", { className: "flex flex-col gap-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 md:col-span-2", children: ["Notas", _jsx("textarea", { value: mountForm.notes, onChange: (e) => setMountForm((m) => ({ ...m, notes: e.target.value })), disabled: actionLoading, rows: 2, className: "rounded-lg border border-slate-700 bg-slate-950/70 px-2.5 py-1.5 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring", placeholder: "Preferencias, plazo\u2026" })] })] })] })) : null, isAssembledOperational(build.status) && build.status !== "SOLD" ? (_jsxs("div", { className: "flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-end", children: [_jsxs("label", { className: "flex min-w-[10rem] flex-1 flex-col gap-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500", children: ["Estado", _jsx("select", { value: opStatus, onChange: (e) => {
                                            const next = e.target.value;
                                            if (next === "PENDING_PAYMENT" && build) {
                                                setPayPaid("0.00");
                                            }
                                            setOpStatus(next);
                                        }, disabled: actionLoading, className: "min-h-[36px] rounded-lg border border-slate-700 bg-slate-950/70 px-2.5 py-1.5 text-sm font-medium text-slate-100 outline-none focus:border-indigo-400 focus:ring", children: OPERATIONAL_STATUS_OPTIONS.map((o) => (_jsx("option", { value: o.value, children: o.label }, o.value))) })] }), opStatus === "RESERVED" ? (_jsxs(_Fragment, { children: [_jsxs("label", { className: "flex w-full min-w-[8rem] max-w-[11rem] flex-col gap-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500", children: ["Reserva cobrada", _jsx("input", { value: resDeposit, onChange: (e) => setResDeposit(e.target.value), disabled: actionLoading, inputMode: "decimal", className: "min-h-[36px] rounded-lg border border-slate-700 bg-slate-950/70 px-2.5 py-1.5 text-sm font-semibold tabular-nums text-slate-100 outline-none focus:border-indigo-400 focus:ring" })] }), _jsxs("div", { className: "flex min-w-[7rem] flex-col gap-0.5 rounded-lg border border-slate-700/80 bg-slate-900/60 px-2.5 py-1.5", children: [_jsx("span", { className: "text-[10px] font-semibold uppercase tracking-wide text-slate-500", children: "Restante" }), _jsx("span", { className: "text-sm font-bold tabular-nums text-slate-100", children: derivedReservationRemaining === null ? "—" : money(derivedReservationRemaining) })] })] })) : null, opStatus === "PENDING_PAYMENT" ? (_jsxs(_Fragment, { children: [_jsxs("label", { className: "flex w-full min-w-[8rem] max-w-[11rem] flex-col gap-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500", children: ["Cobrado", _jsx("input", { value: payPaid, onChange: (e) => setPayPaid(e.target.value), disabled: actionLoading, inputMode: "decimal", className: "min-h-[36px] rounded-lg border border-slate-700 bg-slate-950/70 px-2.5 py-1.5 text-sm font-semibold tabular-nums text-slate-100 outline-none focus:border-indigo-400 focus:ring" })] }), _jsxs("div", { className: "flex min-w-[7rem] flex-col gap-0.5 rounded-lg border border-slate-700/80 bg-slate-900/60 px-2.5 py-1.5", children: [_jsx("span", { className: "text-[10px] font-semibold uppercase tracking-wide text-slate-500", children: "Pendiente" }), _jsx("span", { className: "text-sm font-bold tabular-nums text-slate-100", children: derivedPendingRemaining === null ? "—" : money(derivedPendingRemaining) })] })] })) : null] })) : null] })) : null, _jsxs("section", { className: BUILD_SECTION, children: [_jsx("h2", { className: "mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500", children: "Montaje" }), build.status === "DRAFT" ? (_jsx(PcConfiguratorForm, { parts: configuratorParts, disabled: actionLoading, onAddSelected: handleAddConfiguratorParts, heading: "A\u00F1adir desde inventario", lead: "", compact: true, slotLayout: "accordion", extrasAccordion: _jsxs(_Fragment, { children: [_jsxs("div", { className: "flex max-w-3xl flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end", children: [_jsxs("label", { className: "flex min-w-[12rem] flex-1 flex-col gap-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500", children: ["Extra (plantilla)", _jsxs("select", { value: extraTemplateId, disabled: actionLoading, onChange: (e) => setExtraTemplateId(e.target.value), className: "min-h-[36px] rounded-lg border border-slate-600 bg-slate-950/70 px-2.5 py-1.5 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring", children: [_jsx("option", { value: "", children: "Elegir\u2026" }), extraTemplates.map((t) => (_jsxs("option", { value: t.id, children: [t.name, t.category?.trim() ? ` (${t.category})` : ""] }, t.id)))] })] }), _jsxs("label", { className: "flex w-16 flex-col gap-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 sm:w-20", children: ["Uds.", _jsx("input", { type: "number", min: 1, value: extraQty, disabled: actionLoading, onChange: (e) => setExtraQty(Math.max(1, Number(e.target.value) || 1)), className: "min-h-[36px] rounded-lg border border-slate-600 bg-slate-950/70 px-2.5 py-1.5 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring" })] }), _jsx("button", { type: "button", disabled: actionLoading || !extraTemplateId, onClick: () => {
                                                void addExtraLine({ extraTemplateId, quantity: extraQty });
                                            }, className: SECONDARY_BUTTON_SM, children: "A\u00F1adir" })] }), _jsx("div", { className: "mt-2", children: !manualConceptOpen ? (_jsx("button", { type: "button", onClick: () => setManualConceptOpen(true), className: `${SECONDARY_GHOST_SM} w-full justify-center sm:w-auto`, children: "+ A\u00F1adir concepto manual" })) : (_jsxs("div", { className: "rounded-lg border border-indigo-500/35 bg-slate-950/50 p-3", children: [_jsxs("div", { className: "mb-2 flex flex-wrap items-center justify-between gap-2", children: [_jsx("span", { className: "text-sm font-semibold text-slate-100", children: "Concepto manual" }), _jsx("button", { type: "button", onClick: () => setManualConceptOpen(false), className: "rounded-md px-2 py-1 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200", children: "Cerrar" })] }), _jsxs("div", { className: "grid grid-cols-1 gap-2.5 sm:grid-cols-2", children: [_jsxs("label", { className: "flex flex-col gap-0.5 text-xs font-medium text-slate-200 sm:col-span-2", children: ["Nombre", _jsx("input", { value: manualName, onChange: (e) => setManualName(e.target.value), disabled: actionLoading, className: "min-h-[36px] rounded-lg border border-slate-700 bg-slate-950/70 px-2.5 py-1.5 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring" })] }), _jsxs("label", { className: "flex flex-col gap-0.5 text-xs font-medium text-slate-200 sm:col-span-2", children: ["Descripci\u00F3n", _jsx("input", { value: manualDesc, onChange: (e) => setManualDesc(e.target.value), disabled: actionLoading, className: "min-h-[36px] rounded-lg border border-slate-700 bg-slate-950/70 px-2.5 py-1.5 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring" })] }), _jsxs("label", { className: "flex flex-col gap-0.5 text-xs font-medium text-slate-200", children: ["Cantidad", _jsx("input", { type: "number", min: 1, value: manualQty, onChange: (e) => setManualQty(Math.max(1, Number(e.target.value) || 1)), disabled: actionLoading, className: "min-h-[36px] rounded-lg border border-slate-700 bg-slate-950/70 px-2.5 py-1.5 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring" })] }), _jsxs("label", { className: "flex flex-col gap-0.5 text-xs font-medium text-slate-200", children: ["Coste u. (opc.)", _jsx("input", { type: "text", inputMode: "decimal", value: manualCost, onChange: (e) => setManualCost(e.target.value), disabled: actionLoading, placeholder: "\u2014", className: "min-h-[36px] rounded-lg border border-slate-700 bg-slate-950/70 px-2.5 py-1.5 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring" })] }), _jsxs("label", { className: "flex flex-col gap-0.5 text-xs font-medium text-slate-200 sm:col-span-2", children: ["Precio venta unit.", _jsx("input", { type: "text", inputMode: "decimal", value: manualSale, onChange: (e) => setManualSale(e.target.value), disabled: actionLoading, className: "min-h-[36px] rounded-lg border border-slate-700 bg-slate-950/70 px-2.5 py-1.5 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring" })] })] }), _jsx("button", { type: "button", disabled: actionLoading, className: `${PRIMARY_ACTION_BUTTON_COMPACT} mt-3 w-full sm:w-auto`, onClick: () => {
                                                    const qty = Math.max(1, Math.floor(Number(manualQty)));
                                                    const sale = Number(manualSale.replace(",", ".").trim());
                                                    if (!manualName.trim()) {
                                                        window.alert("Nombre obligatorio.");
                                                        return;
                                                    }
                                                    if (!Number.isFinite(sale) || sale < 0) {
                                                        window.alert("Precio de venta unitario invalido.");
                                                        return;
                                                    }
                                                    let unitCost = 0;
                                                    if (manualCost.trim() !== "") {
                                                        const c = Number(manualCost.replace(",", ".").trim());
                                                        if (!Number.isFinite(c) || c < 0) {
                                                            window.alert("Coste unitario invalido.");
                                                            return;
                                                        }
                                                        unitCost = c;
                                                    }
                                                    void addManualLine({
                                                        name: manualName.trim(),
                                                        description: manualDesc.trim() || null,
                                                        quantity: qty,
                                                        unitCost,
                                                        unitSalePrice: sale
                                                    }).then(() => {
                                                        setManualName("");
                                                        setManualDesc("");
                                                        setManualQty(1);
                                                        setManualCost("");
                                                        setManualSale("");
                                                        setManualConceptOpen(false);
                                                    });
                                                }, children: "A\u00F1adir l\u00EDnea" })] })) })] }) })) : null, _jsxs("div", { className: build.status === "DRAFT" ? "mt-3 border-t border-slate-800/70 pt-3" : "", children: [_jsx("p", { className: "mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500", children: "Piezas en el montaje" }), _jsx(BuildItemsTable, { prominent: true, compactDensity: true, items: build.items, status: build.status, actionLoading: actionLoading, onRemove: async (itemId) => {
                                    await removeItem(itemId);
                                }, onUpdateLineSale: build.status === "DRAFT"
                                    ? async (itemId, unitSalePrice) => {
                                        await updateBuildItemLine(itemId, { unitSalePrice });
                                    }
                                    : undefined }), _jsxs("div", { className: "mt-2 space-y-2", children: [_jsx(BuildManualLinesTable, { lines: build.extraLines ?? [], status: build.status, actionLoading: actionLoading, onRemove: removeExtraLine, onUpdateLine: build.status === "DRAFT"
                                            ? async (lineId, unitSalePrice, unitCost) => {
                                                await updateExtraLine(lineId, {
                                                    unitSalePrice,
                                                    ...(unitCost !== undefined ? { unitCost } : {})
                                                });
                                            }
                                            : undefined }), _jsx(BuildExtraLinesTable, { compactHeader: true, lines: build.extraLines ?? [], status: build.status, actionLoading: actionLoading, onRemove: async (lineId) => {
                                            await removeExtraLine(lineId);
                                        }, onUpdateLine: build.status === "DRAFT"
                                            ? async (lineId, unitSalePrice, unitCost) => {
                                                await updateExtraLine(lineId, {
                                                    unitSalePrice,
                                                    ...(unitCost !== undefined ? { unitCost } : {})
                                                });
                                            }
                                            : undefined })] })] })] }), _jsxs("div", { children: [_jsx("h2", { className: "mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500", children: "Totales" }), _jsxs("section", { className: SUMMARY_CARD_GRID_THREE, children: [_jsxs("article", { className: BUILD_KPI_CARD, children: [_jsx("p", { className: SUMMARY_CARD_LABEL, children: "Coste total" }), _jsx("p", { className: `${SUMMARY_VALUE_NEUTRAL} !text-lg sm:!text-xl`, children: money(build.totalCost) })] }), _jsxs("article", { className: BUILD_KPI_CARD, children: [_jsx("p", { className: SUMMARY_CARD_LABEL, children: "Precio venta" }), _jsx("input", { type: "text", inputMode: "decimal", value: saleDraft, onChange: (event) => setSaleDraft(event.target.value), disabled: actionLoading || pricingLocked, className: "mt-0.5 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-2.5 py-1.5 text-lg font-bold tabular-nums text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring disabled:opacity-50 sm:text-xl", "aria-label": "Precio de venta total", title: `Calculado: ${money(build.computedSaleTotal)}` }), build.saleTotalOverride != null ? (_jsx("p", { className: "mt-1 text-[10px] font-semibold uppercase tracking-wide text-amber-300/90", children: "Manual" })) : null, _jsxs("div", { className: "mt-2 flex flex-wrap gap-1.5", children: [_jsx("button", { type: "button", disabled: actionLoading || pricingLocked, onClick: () => {
                                                    const normalized = Number(saleDraft.replace(",", ".").trim());
                                                    if (!Number.isFinite(normalized) || normalized < 0) {
                                                        window.alert("Introduce un precio de venta valido (mayor o igual que 0).");
                                                        return;
                                                    }
                                                    const rounded = Math.round(normalized * 100) / 100;
                                                    void updateBuildFields({ saleTotalOverride: rounded });
                                                }, className: SECONDARY_BUTTON_SM, children: "Guardar precio" }), build.saleTotalOverride != null ? (_jsxs("button", { type: "button", disabled: actionLoading || pricingLocked, onClick: () => {
                                                    void updateBuildFields({ saleTotalOverride: null });
                                                }, className: "rounded-lg border border-emerald-500/45 bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-100 transition hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-50", children: ["Calculado (", money(build.computedSaleTotal), ")"] })) : null] })] }), _jsxs("article", { className: BUILD_KPI_CARD, children: [_jsx("p", { className: SUMMARY_CARD_LABEL, children: "Beneficio" }), _jsx("p", { className: build.profit >= 0 ? SUMMARY_VALUE_PROFIT_POS : SUMMARY_VALUE_NEGATIVE, children: money(build.profit) })] })] })] }), _jsxs("section", { className: BUILD_SECTION, children: [build.status === "DRAFT" ? (_jsxs("div", { className: "mb-3 flex flex-col gap-2 border-b border-slate-800/70 pb-3 lg:flex-row lg:flex-wrap lg:items-end", "aria-label": "Estado al confirmar", children: [_jsxs("label", { className: "flex min-w-[12rem] flex-1 flex-col gap-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500", children: ["Estado al confirmar", _jsx("select", { value: mountForm.initialStatus, onChange: (e) => {
                                            const next = e.target.value;
                                            setMountForm((m) => {
                                                const patch = { ...m, initialStatus: next };
                                                if (next === "PENDING_PAYMENT") {
                                                    return {
                                                        ...patch,
                                                        confirmPayPaid: "0.00"
                                                    };
                                                }
                                                return patch;
                                            });
                                        }, disabled: actionLoading, className: "min-h-[36px] rounded-lg border border-slate-700 bg-slate-950/70 px-2.5 py-1.5 text-sm font-medium text-slate-100 outline-none focus:border-indigo-400 focus:ring", children: CONFIRM_INITIAL_STATUS_OPTIONS.map((o) => (_jsx("option", { value: o.value, children: o.label }, o.value))) })] }), mountForm.initialStatus === "RESERVED" ? (_jsxs(_Fragment, { children: [_jsxs("label", { className: "flex w-full min-w-[8rem] max-w-[11rem] flex-col gap-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500", children: ["Reserva cobrada", _jsx("input", { value: mountForm.confirmResDeposit, onChange: (e) => setMountForm((m) => ({ ...m, confirmResDeposit: e.target.value })), disabled: actionLoading, inputMode: "decimal", className: "min-h-[36px] rounded-lg border border-slate-700 bg-slate-950/70 px-2.5 py-1.5 text-sm font-semibold tabular-nums text-slate-100 outline-none focus:border-indigo-400 focus:ring" })] }), _jsxs("div", { className: "flex min-w-[7rem] flex-col gap-0.5 rounded-lg border border-slate-700/80 bg-slate-900/60 px-2.5 py-1.5", children: [_jsx("span", { className: "text-[10px] font-semibold uppercase tracking-wide text-slate-500", children: "Restante" }), _jsx("span", { className: "text-sm font-bold tabular-nums text-slate-100", children: draftDerivedReservationRemaining === null ? "—" : money(draftDerivedReservationRemaining) })] })] })) : null, mountForm.initialStatus === "PENDING_PAYMENT" ? (_jsxs(_Fragment, { children: [_jsxs("label", { className: "flex w-full min-w-[8rem] max-w-[11rem] flex-col gap-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500", children: ["Ya cobrado", _jsx("input", { value: mountForm.confirmPayPaid, onChange: (e) => setMountForm((m) => ({ ...m, confirmPayPaid: e.target.value })), disabled: actionLoading, inputMode: "decimal", className: "min-h-[36px] rounded-lg border border-slate-700 bg-slate-950/70 px-2.5 py-1.5 text-sm font-semibold tabular-nums text-slate-100 outline-none focus:border-indigo-400 focus:ring" })] }), _jsxs("div", { className: "flex min-w-[7rem] flex-col gap-0.5 rounded-lg border border-slate-700/80 bg-slate-900/60 px-2.5 py-1.5", children: [_jsx("span", { className: "text-[10px] font-semibold uppercase tracking-wide text-slate-500", children: "Pendiente" }), _jsx("span", { className: "text-sm font-bold tabular-nums text-slate-100", children: draftDerivedPendingRemaining === null ? "—" : money(draftDerivedPendingRemaining) })] })] })) : null] })) : null, _jsxs("div", { className: "flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between", children: [_jsxs("div", { className: "flex flex-wrap gap-2", children: [build.status === "DRAFT" ? (_jsx("button", { type: "button", disabled: actionLoading, onClick: () => void handleSaveMountData(), className: SECONDARY_BUTTON_SM, children: "Guardar cambios" })) : null, isAssembledOperational(build.status) && build.status !== "SOLD" ? (_jsx("button", { type: "button", disabled: actionLoading, onClick: () => void handleSaveOperationalStatus(), className: SECONDARY_BUTTON_SM, children: "Guardar estado" })) : null] }), _jsxs("div", { className: "flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end", children: [isAssembledOperational(build.status) && !linkedSale ? (_jsx("button", { type: "button", disabled: actionLoading, onClick: () => {
                                            const ok = window.confirm("Volver este montaje a borrador? El stock descontado al confirmar se devolvera al inventario y podras cambiar componentes.");
                                            if (!ok)
                                                return;
                                            void revertToDraft();
                                        }, className: "rounded-lg border border-amber-500/50 bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-200 transition hover:bg-amber-500/25 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm", children: actionLoading ? "…" : "Volver a borrador" })) : null, _jsx("button", { type: "button", disabled: build.status !== "DRAFT" ||
                                            actionLoading ||
                                            ((build.items?.length ?? 0) === 0 && (build.extraLines?.length ?? 0) === 0), onClick: () => void handleConfirmMontaje(), className: PRIMARY_ACTION_BUTTON_BUILD_CONFIRM, children: build.status === "SOLD" || build.status === "PENDING_PICKUP"
                                            ? build.status === "PENDING_PICKUP"
                                                ? "Pendiente de recogida"
                                                : "Vendido"
                                            : isAssembledOperational(build.status)
                                                ? "Montaje confirmado"
                                                : actionLoading
                                                    ? "Confirmando..."
                                                    : "Confirmar montaje" })] })] })] }), _jsx(SellPcModal, { open: sellModalOpen, onClose: () => setSellModalOpen(false), buildId: build.id, suggestedSalePrice: sellSuggestedPrice, amountAlreadyPaid: sellAmountAlreadyPaid, offerPendingPickup: true, disabled: actionLoading, formResetKey: sellFormKey, defaultCustomer: {
                    customerId: build.customerId,
                    customerName: build.customerName,
                    customerPhone: build.customerPhone,
                    customerEmail: null
                }, onSuccess: async (sale) => {
                    await reload();
                    setSellModalOpen(false);
                    navigate("/sales", { state: { flash: `Venta registrada (${sale.customerName}).` } });
                } })] }));
}
