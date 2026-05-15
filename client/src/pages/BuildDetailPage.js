import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import * as salesApi from "../api/sales";
import * as extraTemplatesApi from "../api/extraTemplates";
import { BuildItemsTable } from "../components/builds/BuildItemsTable";
import { BuildExtraLinesTable } from "../components/builds/BuildExtraLinesTable";
import { PcConfiguratorForm } from "../components/builds/PcConfiguratorForm";
import { SellPcModal } from "../components/sales/SellPcModal";
import { useBuildDetail } from "../hooks/useBuildDetail";
import { isConfiguratorPart } from "../types/part";
import { PRIMARY_ACTION_BUTTON, PRIMARY_ACTION_BUTTON_COMPACT, SECONDARY_BUTTON_SM } from "../theme/actionButtons";
import { SUMMARY_CARD_GRID_THREE, SUMMARY_CARD_LABEL, SUMMARY_CARD_SHELL, SUMMARY_CARD_SHELL_AUTO, SUMMARY_VALUE_NEGATIVE, SUMMARY_VALUE_NEUTRAL, SUMMARY_VALUE_PROFIT_POS } from "../theme/summaryCards";
import { PAGE_HEADER_COMPACT, PAGE_OUTER_7XL, SECTION_SHELL } from "../theme/layoutDensity";
import { StatusBadge, buildStatusVariant } from "../components/ui/StatusBadge";
import { buildStatusLabelEs } from "../utils/buildStatusLabel";
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
    const { build, parts, loading, actionLoading, error, addItem, updateBuildItemLine, removeItem, confirm, revertToDraft, updateBuildFields, reload, addExtraLine, updateExtraLine, removeExtraLine } = useBuildDetail(buildId);
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
    const sellSuggestedPrice = useMemo(() => {
        if (!build)
            return 0;
        if (build.status === "RESERVED" && build.reservationRemaining != null) {
            return Number(build.reservationRemaining);
        }
        if (build.status === "PENDING_PAYMENT" && build.pendingPaymentRemaining != null) {
            return Number(build.pendingPaymentRemaining);
        }
        return Number(build.totalSale);
    }, [build]);
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
        customerName: "",
        customerPhone: "",
        customerEmail: "",
        notes: "",
        initialStatus: "CONFIRMED",
        confirmResDeposit: "",
        confirmPayPaid: "",
        confirmPayRemaining: ""
    });
    const [mountDataSaved, setMountDataSaved] = useState(false);
    const headerClientLine = useMemo(() => {
        if (!build)
            return null;
        if (build.status === "DRAFT") {
            const a = mountForm.customerName.trim();
            const b = mountForm.customerPhone.trim();
            if (!a && !b)
                return null;
            return [a, b].filter(Boolean).join(" · ");
        }
        const a = (build.customerName ?? "").trim();
        const b = (build.customerPhone ?? "").trim();
        if (!a && !b)
            return null;
        return [a, b].filter(Boolean).join(" · ");
    }, [build, mountForm.customerName, mountForm.customerPhone]);
    const [opStatus, setOpStatus] = useState("CONFIRMED");
    const [resDeposit, setResDeposit] = useState("");
    const [payPaid, setPayPaid] = useState("");
    const [payRemaining, setPayRemaining] = useState("");
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
        setPayRemaining(build.pendingPaymentRemaining != null ? Number(build.pendingPaymentRemaining).toFixed(2) : "");
    }, [build]);
    useEffect(() => {
        if (!build?.id)
            return;
        let cancelled = false;
        void salesApi.listSales().then((rows) => {
            const hit = rows.find((s) => s.buildId === build.id);
            if (!cancelled)
                setLinkedSale(hit ?? null);
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
            customerName: build.customerName ?? "",
            customerPhone: build.customerPhone ?? "",
            customerEmail: build.customerEmail ?? "",
            notes: build.notes ?? "",
            initialStatus: "CONFIRMED",
            confirmResDeposit: "",
            confirmPayPaid: "",
            confirmPayRemaining: ""
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
            const r = parseMoneyInput(payRemaining);
            if (p === null || r === null) {
                window.alert("Indica importe cobrado y pendiente (numeros validos >= 0).");
                return;
            }
            payload.pendingPaymentPaid = p;
            payload.pendingPaymentRemaining = r;
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
        const emailTrim = mountForm.customerEmail.trim();
        if (emailTrim && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
            window.alert("Introduce un email valido o dejalo vacio.");
            return;
        }
        if (!mountForm.name.trim()) {
            window.alert("Indica al menos un nombre para el montaje.");
            return;
        }
        try {
            await updateBuildFields({
                name: mountForm.name.trim(),
                notes: mountForm.notes.trim() ? mountForm.notes.trim() : null,
                customerName: mountForm.customerName.trim() ? mountForm.customerName.trim() : null,
                customerPhone: mountForm.customerPhone.trim() ? mountForm.customerPhone.trim() : null,
                customerEmail: emailTrim ? emailTrim : null
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
        const emailTrim = mountForm.customerEmail.trim();
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
        if (emailTrim && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
            window.alert("Introduce un email valido o dejalo vacio.");
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
            customerName,
            customerPhone: phone,
            customerEmail: emailTrim ? emailTrim : null
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
            const r = parseMoneyInput(mountForm.confirmPayRemaining);
            if (p === null || r === null) {
                window.alert("Indica importe cobrado y pendiente (numeros validos >= 0).");
                return;
            }
            confirmPayload.pendingPaymentPaid = p;
            confirmPayload.pendingPaymentRemaining = r;
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
    return (_jsxs("div", { className: PAGE_OUTER_7XL, children: [flashMessage ? (_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/40 bg-emerald-950/50 px-4 py-3 text-sm text-emerald-100", children: [_jsx("span", { children: flashMessage }), _jsx("button", { type: "button", onClick: () => setFlashMessage(null), className: "rounded-lg border border-emerald-600/50 px-3 py-1 text-xs font-semibold text-emerald-200 hover:bg-emerald-900/40", children: "Cerrar" })] })) : null, pdfError ? (_jsxs("div", { className: "mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-800/70 bg-rose-950/40 px-4 py-3 text-sm text-rose-200", children: [_jsx("span", { children: pdfError }), _jsx("button", { type: "button", onClick: () => setPdfError(null), className: "rounded-lg border border-rose-700 bg-rose-900/50 px-3 py-1 text-xs font-semibold text-rose-100 hover:bg-rose-800/70", children: "Cerrar" })] })) : null, _jsx("header", { className: PAGE_HEADER_COMPACT, children: _jsxs("div", { className: "flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4", children: [_jsxs("div", { className: "min-w-0 flex-1 space-y-1", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsx("h1", { className: "min-w-0 max-w-full truncate text-lg font-bold tracking-tight text-slate-50 sm:text-xl", children: build.status === "DRAFT" ? mountForm.name.trim() || "Montaje en borrador" : build.name }), _jsx(StatusBadge, { variant: buildStatusVariant(build.status), size: "card", children: buildStatusLabelEs(build.status) })] }), headerClientLine ? (_jsx("p", { className: "truncate text-sm text-slate-400", children: headerClientLine })) : null] }), _jsxs("div", { className: "flex flex-wrap items-center gap-2 lg:shrink-0 lg:justify-end", children: [showPickupBanner ? (_jsx("button", { type: "button", disabled: actionLoading, onClick: () => handleConfirmPickupFromBuild(), className: "rounded-lg border border-emerald-500/50 bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-500/25 disabled:opacity-50 sm:text-sm", children: "Confirmar recogida" })) : null, linkedSale ? (_jsx(Link, { to: `/sales/${linkedSale.id}`, className: "text-xs font-semibold text-cyan-300 underline-offset-2 hover:text-cyan-200 hover:underline sm:text-sm", children: "Ver venta" })) : build.status === "SOLD" ? (_jsx("span", { className: "text-xs text-slate-500", children: "Buscando venta\u2026" })) : null, _jsx("button", { type: "button", disabled: pdfGenerating || actionLoading, onClick: () => void handleDownloadBuildPdf(), className: SECONDARY_BUTTON_SM, children: pdfGenerating ? "PDF…" : "Descargar PDF" }), canOpenSellModal ? (_jsx("button", { type: "button", disabled: actionLoading, onClick: () => {
                                        setSellFormKey((k) => k + 1);
                                        setSellModalOpen(true);
                                    }, className: PRIMARY_ACTION_BUTTON_COMPACT, children: "Vender PC" })) : null, _jsx(Link, { to: "/builds", className: `${SECONDARY_BUTTON_SM} inline-flex items-center justify-center`, children: "\u2190 Montajes" })] })] }) }), error ? (_jsxs("div", { className: "flex flex-col gap-3 rounded-xl border border-rose-800/70 bg-rose-950/40 px-4 py-3 text-sm text-rose-200 md:flex-row md:items-center md:justify-between", children: [_jsx("span", { children: error }), _jsx("button", { type: "button", onClick: () => {
                            void reload();
                        }, className: "rounded-lg border border-rose-700 bg-rose-900/50 px-3 py-1.5 font-semibold text-rose-100 transition hover:bg-rose-800/70", children: "Reintentar" })] })) : null, _jsxs("section", { className: SUMMARY_CARD_GRID_THREE, children: [_jsxs("article", { className: SUMMARY_CARD_SHELL, children: [_jsx("p", { className: SUMMARY_CARD_LABEL, children: "Coste total" }), _jsx("p", { className: SUMMARY_VALUE_NEUTRAL, children: money(build.totalCost) })] }), _jsxs("article", { className: SUMMARY_CARD_SHELL_AUTO, children: [_jsx("p", { className: SUMMARY_CARD_LABEL, children: "Precio venta" }), _jsx("input", { type: "text", inputMode: "decimal", value: saleDraft, onChange: (event) => setSaleDraft(event.target.value), disabled: actionLoading || pricingLocked, className: "mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-xl font-bold tabular-nums text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring disabled:opacity-50 sm:text-2xl", "aria-label": "Precio de venta total", title: `Calculado por líneas: ${money(build.computedSaleTotal)}` }), build.saleTotalOverride != null ? (_jsx("p", { className: "mt-1.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300/90", children: "Total manual" })) : null, _jsxs("div", { className: "mt-2 flex flex-wrap gap-2", children: [_jsx("button", { type: "button", disabled: actionLoading || pricingLocked, onClick: () => {
                                            const normalized = Number(saleDraft.replace(",", ".").trim());
                                            if (!Number.isFinite(normalized) || normalized < 0) {
                                                window.alert("Introduce un precio de venta valido (mayor o igual que 0).");
                                                return;
                                            }
                                            const rounded = Math.round(normalized * 100) / 100;
                                            void updateBuildFields({ saleTotalOverride: rounded });
                                        }, className: SECONDARY_BUTTON_SM, children: "Guardar precio" }), build.saleTotalOverride != null ? (_jsxs("button", { type: "button", disabled: actionLoading || pricingLocked, onClick: () => {
                                            void updateBuildFields({ saleTotalOverride: null });
                                        }, className: "rounded-lg border border-emerald-500/45 bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-50", children: ["Usar calculado (", money(build.computedSaleTotal), ")"] })) : null] })] }), _jsxs("article", { className: SUMMARY_CARD_SHELL, children: [_jsx("p", { className: SUMMARY_CARD_LABEL, children: "Beneficio estimado" }), _jsx("p", { className: build.profit >= 0 ? SUMMARY_VALUE_PROFIT_POS : SUMMARY_VALUE_NEGATIVE, children: money(build.profit) })] })] }), build.status === "DRAFT" ? (_jsx("section", { className: `${SECTION_SHELL} !py-3`, "aria-label": "Estado al confirmar", children: _jsxs("div", { className: "flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end", children: [_jsxs("label", { className: "flex min-w-[12rem] flex-1 flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500", children: ["Estado al confirmar", _jsx("select", { value: mountForm.initialStatus, onChange: (e) => {
                                        const next = e.target.value;
                                        setMountForm((m) => {
                                            const patch = { ...m, initialStatus: next };
                                            if (next === "PENDING_PAYMENT") {
                                                return {
                                                    ...patch,
                                                    confirmPayPaid: "0.00",
                                                    confirmPayRemaining: totalSaleShown > 0 ? totalSaleShown.toFixed(2) : "0.00"
                                                };
                                            }
                                            return patch;
                                        });
                                    }, disabled: actionLoading, className: "min-h-[40px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm font-medium text-slate-100 outline-none focus:border-indigo-400 focus:ring", children: CONFIRM_INITIAL_STATUS_OPTIONS.map((o) => (_jsx("option", { value: o.value, children: o.label }, o.value))) })] }), mountForm.initialStatus === "RESERVED" ? (_jsxs(_Fragment, { children: [_jsxs("label", { className: "flex w-full min-w-[8rem] max-w-[11rem] flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500", children: ["Reserva cobrada", _jsx("input", { value: mountForm.confirmResDeposit, onChange: (e) => setMountForm((m) => ({ ...m, confirmResDeposit: e.target.value })), disabled: actionLoading, inputMode: "decimal", className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm font-semibold tabular-nums text-slate-100 outline-none focus:border-indigo-400 focus:ring" })] }), _jsxs("div", { className: "flex min-w-[7rem] flex-col gap-0.5 rounded-lg border border-slate-700/80 bg-slate-900/60 px-3 py-2", children: [_jsx("span", { className: "text-[10px] font-semibold uppercase tracking-wide text-slate-500", children: "Restante" }), _jsx("span", { className: "text-base font-bold tabular-nums text-slate-100", children: draftDerivedReservationRemaining === null ? "—" : money(draftDerivedReservationRemaining) })] })] })) : null, mountForm.initialStatus === "PENDING_PAYMENT" ? (_jsxs(_Fragment, { children: [_jsxs("label", { className: "flex w-full min-w-[8rem] max-w-[11rem] flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500", children: ["Ya cobrado", _jsx("input", { value: mountForm.confirmPayPaid, onChange: (e) => setMountForm((m) => ({ ...m, confirmPayPaid: e.target.value })), disabled: actionLoading, inputMode: "decimal", className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm font-semibold tabular-nums text-slate-100 outline-none focus:border-indigo-400 focus:ring" })] }), _jsxs("label", { className: "flex w-full min-w-[8rem] max-w-[11rem] flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500", children: ["Pendiente", _jsx("input", { value: mountForm.confirmPayRemaining, onChange: (e) => setMountForm((m) => ({ ...m, confirmPayRemaining: e.target.value })), disabled: actionLoading, inputMode: "decimal", className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm font-semibold tabular-nums text-slate-100 outline-none focus:border-indigo-400 focus:ring" })] })] })) : null] }) })) : null, isAssembledOperational(build.status) && build.status !== "SOLD" ? (_jsx("section", { className: `${SECTION_SHELL} !py-3`, "aria-label": "Estado y cobro", children: _jsxs("div", { className: "flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end", children: [_jsxs("label", { className: "flex min-w-[10rem] flex-1 flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500", children: ["Estado", _jsx("select", { value: opStatus, onChange: (e) => {
                                        const next = e.target.value;
                                        if (next === "PENDING_PAYMENT" && build) {
                                            setPayPaid("0.00");
                                            setPayRemaining(totalSaleShown > 0 ? totalSaleShown.toFixed(2) : "0.00");
                                        }
                                        setOpStatus(next);
                                    }, disabled: actionLoading, className: "min-h-[40px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm font-medium text-slate-100 outline-none focus:border-indigo-400 focus:ring", children: OPERATIONAL_STATUS_OPTIONS.map((o) => (_jsx("option", { value: o.value, children: o.label }, o.value))) })] }), opStatus === "RESERVED" ? (_jsxs(_Fragment, { children: [_jsxs("label", { className: "flex w-full min-w-[8rem] max-w-[11rem] flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500", children: ["Reserva cobrada", _jsx("input", { value: resDeposit, onChange: (e) => setResDeposit(e.target.value), disabled: actionLoading, inputMode: "decimal", className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm font-semibold tabular-nums text-slate-100 outline-none focus:border-indigo-400 focus:ring" })] }), _jsxs("div", { className: "flex min-w-[7rem] flex-col gap-0.5 rounded-lg border border-slate-700/80 bg-slate-900/60 px-3 py-2", children: [_jsx("span", { className: "text-[10px] font-semibold uppercase tracking-wide text-slate-500", children: "Restante" }), _jsx("span", { className: "text-base font-bold tabular-nums text-slate-100", children: derivedReservationRemaining === null ? "—" : money(derivedReservationRemaining) })] })] })) : null, opStatus === "PENDING_PAYMENT" ? (_jsxs(_Fragment, { children: [_jsxs("label", { className: "flex w-full min-w-[8rem] max-w-[11rem] flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500", children: ["Cobrado", _jsx("input", { value: payPaid, onChange: (e) => setPayPaid(e.target.value), disabled: actionLoading, inputMode: "decimal", className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm font-semibold tabular-nums text-slate-100 outline-none focus:border-indigo-400 focus:ring" })] }), _jsxs("label", { className: "flex w-full min-w-[8rem] max-w-[11rem] flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500", children: ["Pendiente", _jsx("input", { value: payRemaining, onChange: (e) => setPayRemaining(e.target.value), disabled: actionLoading, inputMode: "decimal", className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm font-semibold tabular-nums text-slate-100 outline-none focus:border-indigo-400 focus:ring" })] })] })) : null] }) })) : null, build.status === "DRAFT" ? (_jsxs("section", { className: SECTION_SHELL, children: [mountDataSaved ? (_jsx("p", { className: "mb-3 text-xs font-medium text-emerald-300/90", children: "Guardado." })) : null, _jsxs("div", { className: "grid grid-cols-1 gap-3 md:grid-cols-2", children: [_jsxs("label", { className: "flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 md:col-span-2", children: ["Nombre del montaje", _jsx("input", { value: mountForm.name, onChange: (e) => setMountForm((m) => ({ ...m, name: e.target.value })), disabled: actionLoading, className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring", placeholder: "Ej: PC Oficina Garcia" })] }), _jsxs("label", { className: "flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500", children: ["Cliente", _jsx("input", { value: mountForm.customerName, onChange: (e) => setMountForm((m) => ({ ...m, customerName: e.target.value })), disabled: actionLoading, className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring", placeholder: "Nombre y apellidos" })] }), _jsxs("label", { className: "flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500", children: ["Telefono", _jsx("input", { value: mountForm.customerPhone, onChange: (e) => setMountForm((m) => ({ ...m, customerPhone: e.target.value })), disabled: actionLoading, inputMode: "tel", className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring", placeholder: "600 000 000" })] }), _jsxs("label", { className: "flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 md:col-span-2", children: ["Email (opcional)", _jsx("input", { type: "email", value: mountForm.customerEmail, onChange: (e) => setMountForm((m) => ({ ...m, customerEmail: e.target.value })), disabled: actionLoading, className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring", placeholder: "cliente@correo.es" })] }), _jsxs("label", { className: "flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 md:col-span-2", children: ["Notas", _jsx("textarea", { value: mountForm.notes, onChange: (e) => setMountForm((m) => ({ ...m, notes: e.target.value })), disabled: actionLoading, rows: 2, className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring", placeholder: "Preferencias, plazo\u2026" })] })] })] })) : null, build.status === "DRAFT" ? (_jsx("section", { className: `${SECTION_SHELL} !py-3`, children: _jsxs("div", { className: "flex max-w-3xl flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end", children: [_jsxs("label", { className: "flex min-w-[12rem] flex-1 flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500", children: ["Extra", _jsxs("select", { value: extraTemplateId, disabled: actionLoading, onChange: (e) => setExtraTemplateId(e.target.value), className: "rounded-lg border border-slate-600 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring", children: [_jsx("option", { value: "", children: "Elegir\u2026" }), extraTemplates.map((t) => (_jsxs("option", { value: t.id, children: [t.name, t.category?.trim() ? ` (${t.category})` : ""] }, t.id)))] })] }), _jsxs("label", { className: "flex w-20 flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500", children: ["Uds.", _jsx("input", { type: "number", min: 1, value: extraQty, disabled: actionLoading, onChange: (e) => setExtraQty(Math.max(1, Number(e.target.value) || 1)), className: "rounded-lg border border-slate-600 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring" })] }), _jsx("button", { type: "button", disabled: actionLoading || !extraTemplateId, onClick: () => {
                                void addExtraLine({ extraTemplateId, quantity: extraQty });
                            }, className: SECONDARY_BUTTON_SM, children: "A\u00F1adir" })] }) })) : null, build.status === "DRAFT" ? (_jsx(PcConfiguratorForm, { parts: configuratorParts, disabled: actionLoading, onAddSelected: handleAddConfiguratorParts, heading: "A\u00F1adir piezas", lead: "", compact: true })) : null, _jsxs("div", { className: "space-y-2", children: [_jsx("h2", { className: "text-base font-semibold tracking-tight text-slate-100 sm:text-lg", children: "Componentes" }), _jsx(BuildItemsTable, { prominent: true, items: build.items, status: build.status, actionLoading: actionLoading, onRemove: async (itemId) => {
                            await removeItem(itemId);
                        }, onUpdateLineSale: build.status === "DRAFT"
                            ? async (itemId, unitSalePrice) => {
                                await updateBuildItemLine(itemId, { unitSalePrice });
                            }
                            : undefined })] }), _jsx(BuildExtraLinesTable, { compactHeader: true, lines: build.extraLines ?? [], status: build.status, actionLoading: actionLoading, onRemove: async (lineId) => {
                    await removeExtraLine(lineId);
                }, onUpdateLine: build.status === "DRAFT"
                    ? async (lineId, unitSalePrice, unitCost) => {
                        await updateExtraLine(lineId, {
                            unitSalePrice,
                            ...(unitCost !== undefined ? { unitCost } : {})
                        });
                    }
                    : undefined }), _jsx("section", { className: "rounded-xl border border-slate-800/90 bg-slate-950/40 px-3 py-3 sm:px-4", children: _jsxs("div", { className: "flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between", children: [_jsxs("div", { className: "flex flex-wrap gap-2", children: [build.status === "DRAFT" ? (_jsx("button", { type: "button", disabled: actionLoading, onClick: () => void handleSaveMountData(), className: SECONDARY_BUTTON_SM, children: "Guardar cambios" })) : null, isAssembledOperational(build.status) && build.status !== "SOLD" ? (_jsx("button", { type: "button", disabled: actionLoading, onClick: () => void handleSaveOperationalStatus(), className: SECONDARY_BUTTON_SM, children: "Guardar estado" })) : null] }), _jsxs("div", { className: "flex flex-wrap gap-2 sm:justify-end", children: [isAssembledOperational(build.status) && !linkedSale ? (_jsx("button", { type: "button", disabled: actionLoading, onClick: () => {
                                        const ok = window.confirm("Volver este montaje a borrador? El stock descontado al confirmar se devolvera al inventario y podras cambiar componentes.");
                                        if (!ok)
                                            return;
                                        void revertToDraft();
                                    }, className: "rounded-lg border border-amber-500/50 bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-200 transition hover:bg-amber-500/25 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm", children: actionLoading ? "…" : "Volver a borrador" })) : null, _jsx("button", { type: "button", disabled: build.status !== "DRAFT" ||
                                        actionLoading ||
                                        ((build.items?.length ?? 0) === 0 && (build.extraLines?.length ?? 0) === 0), onClick: () => void handleConfirmMontaje(), className: PRIMARY_ACTION_BUTTON, children: build.status === "SOLD" || build.status === "PENDING_PICKUP"
                                        ? build.status === "PENDING_PICKUP"
                                            ? "Pendiente de recogida"
                                            : "Vendido"
                                        : isAssembledOperational(build.status)
                                            ? "Montaje confirmado"
                                            : actionLoading
                                                ? "Confirmando..."
                                                : "Confirmar montaje" })] })] }) }), _jsx(SellPcModal, { open: sellModalOpen, onClose: () => setSellModalOpen(false), buildId: build.id, suggestedSalePrice: sellSuggestedPrice, offerPendingPickup: true, disabled: actionLoading, formResetKey: sellFormKey, defaultCustomer: {
                    customerName: build.customerName,
                    customerPhone: build.customerPhone,
                    customerEmail: build.customerEmail
                }, onSuccess: async (sale) => {
                    await reload();
                    setSellModalOpen(false);
                    navigate("/sales", { state: { flash: `Venta registrada (${sale.customerName}).` } });
                } })] }));
}
