import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import * as quotesApi from "../api/quotes";
import * as extraTemplatesApi from "../api/extraTemplates";
import { CustomerProfileLink } from "../components/customers/CustomerProfileLink";
import { PcConfiguratorForm } from "../components/builds/PcConfiguratorForm";
import { useParts } from "../hooks/useParts";
import { isConfiguratorPart, isPrebuiltPc } from "../types/part";
import { QUOTE_STATUSES } from "../types/quote";
import { aggregateQuoteFinancials, itemLineCostTotal, itemLineProfit, moneyOrDash } from "../utils/quoteFinancials";
import { DESTRUCTIVE_BUTTON_SM, PRIMARY_ACTION_BUTTON, PRIMARY_ACTION_BUTTON_COMPACT, SECONDARY_BUTTON_SM, SECONDARY_GHOST_SM } from "../theme/actionButtons";
import { SUMMARY_CARD_GRID, SUMMARY_CARD_LABEL, SUMMARY_CARD_SHELL, SUMMARY_CARD_SHELL_AUTO, SUMMARY_VALUE_NEGATIVE, SUMMARY_VALUE_NEUTRAL, SUMMARY_VALUE_PROFIT_POS, SUMMARY_VALUE_REVENUE } from "../theme/summaryCards";
import { PAGE_HERO, PAGE_OUTER_7XL, SECTION_SHELL, TABLE_CELL } from "../theme/layoutDensity";
function quoteItemTypeLabel(t) {
    switch (t) {
        case "INVENTORY_PART":
            return "Inventario";
        case "MANUAL_ITEM":
            return "Manual";
        case "SERVICE":
            return "Servicio";
        case "EXTRA_TEMPLATE":
            return "Extra";
        default:
            return t;
    }
}
function money(n) {
    return `${n.toFixed(2)} EUR`;
}
function isoDateOnly(iso) {
    if (!iso)
        return "";
    try {
        const d = new Date(iso);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
    }
    catch {
        return "";
    }
}
const STATUS_LABELS = {
    DRAFT: "Borrador",
    SENT: "Enviado",
    ACCEPTED: "Aceptado",
    REJECTED: "Rechazado",
    EXPIRED: "Caducado",
    PENDING_PAYMENT: "Pendiente de pago"
};
export function QuoteDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const quoteId = String(id ?? "");
    const { parts: inventoryParts, loading: partsLoading } = useParts();
    const [quote, setQuote] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [pdfGenerating, setPdfGenerating] = useState(false);
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [customerEmail, setCustomerEmail] = useState("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [validUntilDate, setValidUntilDate] = useState("");
    const [notes, setNotes] = useState("");
    const [discountDraft, setDiscountDraft] = useState("0");
    const [statusDraft, setStatusDraft] = useState("DRAFT");
    const [paymentTotalInput, setPaymentTotalInput] = useState("");
    const [amountPaidInput, setAmountPaidInput] = useState("0");
    const [paymentDateInput, setPaymentDateInput] = useState("");
    const [prebuiltPartId, setPrebuiltPartId] = useState("");
    const [prebuiltQty, setPrebuiltQty] = useState(1);
    const [manualKind, setManualKind] = useState("MANUAL_ITEM");
    const [manualName, setManualName] = useState("");
    const [manualDesc, setManualDesc] = useState("");
    const [manualQty, setManualQty] = useState(1);
    const [manualCost, setManualCost] = useState("");
    const [manualSale, setManualSale] = useState("");
    const [quoteExtraTemplates, setQuoteExtraTemplates] = useState([]);
    const [quoteExtraTplId, setQuoteExtraTplId] = useState("");
    const [quoteExtraQty, setQuoteExtraQty] = useState(1);
    const [quoteExtraSale, setQuoteExtraSale] = useState("");
    const [editingItem, setEditingItem] = useState(null);
    const [editName, setEditName] = useState("");
    const [editDesc, setEditDesc] = useState("");
    const [editQty, setEditQty] = useState(1);
    const [editCost, setEditCost] = useState("");
    const [editSale, setEditSale] = useState("");
    const applyQuoteToForm = useCallback((q) => {
        setCustomerName(q.customerName);
        setCustomerPhone(q.customerPhone ?? "");
        setCustomerEmail(q.customerEmail ?? "");
        setTitle(q.title);
        setDescription(q.description ?? "");
        setValidUntilDate(isoDateOnly(q.validUntil));
        setNotes(q.notes ?? "");
        setDiscountDraft(Number(q.discountAmount).toFixed(2));
        setStatusDraft(q.status);
        setPaymentTotalInput(q.paymentTotal != null ? Number(q.paymentTotal).toFixed(2) : "");
        setAmountPaidInput(Number(q.amountPaid ?? 0).toFixed(2));
        setPaymentDateInput(isoDateOnly(q.paymentDate));
    }, []);
    const reload = useCallback(async () => {
        if (!quoteId)
            return;
        setLoading(true);
        setError(null);
        try {
            const data = await quotesApi.getQuote(quoteId);
            setQuote(data);
            applyQuoteToForm(data);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo cargar el presupuesto.");
            setQuote(null);
        }
        finally {
            setLoading(false);
        }
    }, [quoteId, applyQuoteToForm]);
    useEffect(() => {
        void reload();
    }, [reload]);
    useEffect(() => {
        let cancelled = false;
        void extraTemplatesApi.listExtraTemplates(true).then((rows) => {
            if (!cancelled)
                setQuoteExtraTemplates(rows);
        });
        return () => {
            cancelled = true;
        };
    }, []);
    useEffect(() => {
        if (!editingItem)
            return;
        setEditName(editingItem.name);
        setEditDesc(editingItem.description ?? "");
        setEditQty(editingItem.quantity);
        setEditCost(editingItem.unitCost != null ? String(editingItem.unitCost) : "");
        setEditSale(String(editingItem.unitSalePrice));
    }, [editingItem]);
    const handleDownloadPdf = useCallback(async () => {
        if (!quote)
            return;
        setPdfGenerating(true);
        setError(null);
        try {
            const [{ pdf }, { QuotePdfDocument }] = await Promise.all([
                import("@react-pdf/renderer"),
                import("../components/quotes/QuotePdfDocument")
            ]);
            const blob = await pdf(_jsx(QuotePdfDocument, { quote: quote })).toBlob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `presupuesto-${quote.quoteNumber}.pdf`;
            a.rel = "noopener";
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo generar el PDF.");
        }
        finally {
            setPdfGenerating(false);
        }
    }, [quote]);
    const run = async (fn) => {
        setActionLoading(true);
        setError(null);
        try {
            const updated = await fn();
            if (updated) {
                setQuote(updated);
                applyQuoteToForm(updated);
            }
            else {
                await reload();
            }
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Operacion fallida.");
        }
        finally {
            setActionLoading(false);
        }
    };
    const handleSaveMeta = async () => {
        setActionLoading(true);
        setError(null);
        try {
            await quotesApi.patchQuote(quoteId, {
                customerName: customerName.trim(),
                customerPhone: customerPhone.trim() || null,
                customerEmail: customerEmail.trim() || null,
                title: title.trim(),
                description: description.trim() || null,
                validUntil: validUntilDate ? new Date(validUntilDate).toISOString() : null,
                notes: notes.trim() || null
            });
            navigate("/quotes");
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo guardar el presupuesto.");
        }
        finally {
            setActionLoading(false);
        }
    };
    const handleSaveDiscount = () => {
        const n = Number(discountDraft.replace(",", ".").trim());
        if (!Number.isFinite(n) || n < 0) {
            window.alert("Descuento invalido.");
            return;
        }
        void run(async () => quotesApi.patchQuote(quoteId, { discountAmount: Math.round(n * 100) / 100 }));
    };
    const handleStatusSave = () => run(async () => quotesApi.patchQuoteStatus(quoteId, { status: statusDraft }));
    const paymentPreviewDue = useMemo(() => {
        if (!quote)
            return 0;
        const t = paymentTotalInput.trim().replace(",", ".");
        if (t === "")
            return quote.total;
        const n = Number(t);
        return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : quote.total;
    }, [quote, paymentTotalInput]);
    const paymentPreviewRemaining = useMemo(() => {
        const p = Number(amountPaidInput.trim().replace(",", "."));
        const paid = Number.isFinite(p) && p >= 0 ? Math.round(p * 100) / 100 : 0;
        return Math.round((paymentPreviewDue - paid) * 100) / 100;
    }, [paymentPreviewDue, amountPaidInput]);
    const handleSavePayment = () => {
        if (!quote)
            return;
        const totalTrim = paymentTotalInput.trim().replace(",", ".");
        const paymentTotalPayload = totalTrim === "" ? null : Number(totalTrim);
        if (paymentTotalPayload != null && (!Number.isFinite(paymentTotalPayload) || paymentTotalPayload < 0)) {
            window.alert("Importe total invalido.");
            return;
        }
        const paidTrim = amountPaidInput.trim().replace(",", ".");
        const paidNum = Number(paidTrim);
        if (!Number.isFinite(paidNum) || paidNum < 0) {
            window.alert("Importe pagado invalido.");
            return;
        }
        const roundedPaid = Math.round(paidNum * 100) / 100;
        const roundedPt = paymentTotalPayload == null ? null : Math.round(paymentTotalPayload * 100) / 100;
        void run(async () => quotesApi.patchQuote(quoteId, {
            paymentTotal: roundedPt,
            amountPaid: roundedPaid,
            paymentDate: paymentDateInput ? new Date(`${paymentDateInput}T12:00:00`).toISOString() : null
        }));
    };
    const handleAddFromConfigurator = async (items) => {
        if (items.length === 0)
            return;
        await run(async () => {
            let last;
            for (const it of items) {
                if (it.quantity < 1)
                    continue;
                const payload = {
                    itemType: "INVENTORY_PART",
                    partId: it.partId,
                    quantity: it.quantity
                };
                last = await quotesApi.addQuoteItem(quoteId, payload);
            }
            return last;
        });
    };
    const handleAddPrebuiltFromInventory = () => {
        if (!prebuiltPartId) {
            window.alert("Selecciona un PC completo en stock.");
            return;
        }
        const part = inventoryParts.find((p) => p.id === prebuiltPartId);
        const max = part && isPrebuiltPc(part) ? Math.max(1, part.stock) : 1;
        const raw = Math.max(1, Math.floor(Number(prebuiltQty)));
        const qty = Math.min(raw, max);
        const payload = {
            itemType: "INVENTORY_PART",
            partId: prebuiltPartId,
            quantity: qty
        };
        void run(async () => quotesApi.addQuoteItem(quoteId, payload));
    };
    const handleAddManual = () => {
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
        let unitCost = undefined;
        if (manualCost.trim() !== "") {
            const c = Number(manualCost.replace(",", ".").trim());
            if (!Number.isFinite(c) || c < 0) {
                window.alert("Coste invalido.");
                return;
            }
            unitCost = Math.round(c * 100) / 100;
        }
        const payload = manualKind === "SERVICE"
            ? {
                itemType: "SERVICE",
                name: manualName.trim(),
                description: manualDesc.trim() || null,
                quantity: qty,
                unitCost: unitCost ?? null,
                unitSalePrice: Math.round(sale * 100) / 100
            }
            : {
                itemType: "MANUAL_ITEM",
                name: manualName.trim(),
                description: manualDesc.trim() || null,
                quantity: qty,
                unitCost: unitCost ?? null,
                unitSalePrice: Math.round(sale * 100) / 100
            };
        void run(async () => {
            const updated = await quotesApi.addQuoteItem(quoteId, payload);
            setManualName("");
            setManualDesc("");
            setManualQty(1);
            setManualCost("");
            setManualSale("");
            return updated;
        });
    };
    const handleAddExtraFromTemplate = () => {
        if (!quoteExtraTplId) {
            window.alert("Elige una plantilla de extra.");
            return;
        }
        const qty = Math.max(1, Math.floor(Number(quoteExtraQty)));
        const payload = {
            itemType: "EXTRA_TEMPLATE",
            extraTemplateId: quoteExtraTplId,
            quantity: qty
        };
        const saleRaw = quoteExtraSale.trim();
        if (saleRaw) {
            const s = Number(saleRaw.replace(",", "."));
            if (!Number.isFinite(s) || s < 0) {
                window.alert("Precio de venta opcional invalido.");
                return;
            }
            payload.unitSalePrice = Math.round(s * 100) / 100;
        }
        void run(async () => {
            const updated = await quotesApi.addQuoteItem(quoteId, payload);
            setQuoteExtraTplId("");
            setQuoteExtraQty(1);
            setQuoteExtraSale("");
            return updated;
        });
    };
    const handleSaveEditItem = () => {
        if (!editingItem)
            return;
        const qty = Math.max(1, Math.floor(Number(editQty)));
        const sale = Number(editSale.replace(",", ".").trim());
        if (!editName.trim()) {
            window.alert("Nombre obligatorio.");
            return;
        }
        if (!Number.isFinite(sale) || sale < 0) {
            window.alert("Precio venta invalido.");
            return;
        }
        const patch = {
            name: editName.trim(),
            description: editDesc.trim() || null,
            quantity: qty,
            unitSalePrice: Math.round(sale * 100) / 100
        };
        if (editCost.trim() === "") {
            patch.unitCost = null;
        }
        else {
            const c = Number(editCost.replace(",", ".").trim());
            if (!Number.isFinite(c) || c < 0) {
                window.alert("Coste invalido.");
                return;
            }
            patch.unitCost = Math.round(c * 100) / 100;
        }
        void run(async () => {
            const updated = await quotesApi.patchQuoteItem(quoteId, editingItem.id, patch);
            setEditingItem(null);
            return updated;
        });
    };
    const handleDeleteItem = (item) => {
        const ok = window.confirm(`Eliminar linea "${item.name}"?`);
        if (!ok)
            return;
        void run(async () => quotesApi.deleteQuoteItem(quoteId, item.id));
    };
    const handleAcceptAndCreateBuild = async () => {
        const ok = window.confirm("Se creará un montaje en borrador con las piezas del inventario y las líneas de extras por plantilla. Las líneas manuales o de servicio quedarán en las notas del montaje. ¿Continuar?");
        if (!ok)
            return;
        setActionLoading(true);
        setError(null);
        try {
            const build = await quotesApi.convertQuoteToBuild(quoteId);
            navigate(`/builds/${build.id}`, {
                state: { flash: "Montaje creado desde el presupuesto aceptado." }
            });
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo crear el montaje.");
        }
        finally {
            setActionLoading(false);
        }
    };
    const handleDeleteQuote = () => {
        const ok = window.confirm("Eliminar este presupuesto de forma permanente?");
        if (!ok)
            return;
        void (async () => {
            setActionLoading(true);
            setError(null);
            try {
                await quotesApi.deleteQuote(quoteId);
                navigate("/quotes");
            }
            catch (err) {
                setError(err instanceof Error ? err.message : "No se pudo eliminar.");
            }
            finally {
                setActionLoading(false);
            }
        })();
    };
    const configuratorParts = useMemo(() => inventoryParts.filter(isConfiguratorPart), [inventoryParts]);
    const prebuiltInStock = useMemo(() => [...inventoryParts]
        .filter((p) => isPrebuiltPc(p) && p.stock > 0)
        .sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" })), [inventoryParts]);
    const quoteFinancials = useMemo(() => {
        if (!quote)
            return null;
        return aggregateQuoteFinancials(quote);
    }, [quote]);
    if (!id) {
        return (_jsx("section", { className: "rounded-2xl border border-rose-800/70 bg-rose-950/40 p-6 text-rose-200", children: "ID de presupuesto invalido." }));
    }
    if (loading && !quote) {
        return (_jsx("section", { className: SECTION_SHELL, children: _jsx("p", { className: "text-sm text-slate-300", children: "Cargando presupuesto..." }) }));
    }
    if (!quote) {
        return (_jsxs("section", { className: SECTION_SHELL, children: [_jsx("p", { className: "text-sm text-slate-300", children: "Presupuesto no encontrado." }), _jsx(Link, { to: "/quotes", className: "mt-3 inline-flex text-indigo-300 hover:text-indigo-200", children: "Volver a presupuestos" })] }));
    }
    return (_jsxs("div", { className: PAGE_OUTER_7XL, children: [_jsx("header", { className: PAGE_HERO, children: _jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [_jsxs("div", { children: [_jsxs("p", { className: "font-mono text-sm text-slate-400", children: ["Presupuesto #", quote.quoteNumber] }), _jsx("h1", { className: "mt-1 text-2xl font-bold text-slate-100", children: quote.title })] }), _jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [_jsx("button", { type: "button", onClick: () => void handleDownloadPdf(), disabled: pdfGenerating || actionLoading, className: PRIMARY_ACTION_BUTTON, children: pdfGenerating ? "Generando PDF…" : "Descargar PDF" }), _jsx(Link, { to: "/quotes", className: "text-sm font-medium text-indigo-300 underline-offset-2 hover:text-indigo-200 hover:underline", children: "Presupuestos" })] })] }) }), error ? (_jsx("div", { className: "rounded-xl border border-rose-800/70 bg-rose-950/40 px-4 py-3 text-sm text-rose-200", children: error })) : null, quote.convertedToBuildId ? (_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/40 bg-emerald-950/35 px-4 py-3 text-sm text-emerald-100", children: [_jsxs("span", { children: ["Este presupuesto ya fue convertido en un montaje", quote.convertedAt
                                ? ` (${new Date(quote.convertedAt).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })})`
                                : "", "."] }), _jsx(Link, { to: `/builds/${quote.convertedToBuildId}`, className: `${SECONDARY_GHOST_SM} shrink-0 px-4 py-2 text-sm`, children: "Ver montaje generado" })] })) : null, _jsxs("section", { className: SECTION_SHELL, children: [_jsx("h2", { className: "text-lg font-semibold text-slate-100", children: "Estado" }), _jsxs("div", { className: "mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end", children: [_jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Estado del presupuesto", _jsx("select", { value: statusDraft, onChange: (e) => setStatusDraft(e.target.value), disabled: actionLoading, className: "min-h-[42px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none focus:border-indigo-400 focus:ring focus:ring-indigo-400/40", children: QUOTE_STATUSES.map((s) => (_jsx("option", { value: s, children: STATUS_LABELS[s] }, s))) })] }), _jsx("button", { type: "button", disabled: actionLoading || statusDraft === quote.status, onClick: () => void handleStatusSave(), className: PRIMARY_ACTION_BUTTON_COMPACT, children: "Actualizar estado" }), quote.convertedToBuildId ? null : (_jsx("button", { type: "button", disabled: actionLoading, onClick: () => void handleAcceptAndCreateBuild(), className: PRIMARY_ACTION_BUTTON, children: "Aceptar y crear montaje" }))] })] }), quote.status === "PENDING_PAYMENT" ? (_jsxs("section", { className: SECTION_SHELL, children: [_jsx("h2", { className: "text-lg font-semibold text-slate-100", children: "Cobro" }), _jsxs("p", { className: "mt-1 max-w-2xl text-sm text-slate-500", children: ["Si dejas vac\u00EDo el total a cobrar, se usa el total del presupuesto (", money(quote.total), "). El pendiente se calcula como total a cobrar menos pagado."] }), _jsxs("div", { className: "mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4", children: [_jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Total a cobrar (EUR)", _jsx("input", { type: "text", inputMode: "decimal", value: paymentTotalInput, onChange: (e) => setPaymentTotalInput(e.target.value), disabled: actionLoading, placeholder: money(quote.total), className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none focus:border-indigo-400 focus:ring" })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Pagado (EUR)", _jsx("input", { type: "text", inputMode: "decimal", value: amountPaidInput, onChange: (e) => setAmountPaidInput(e.target.value), disabled: actionLoading, className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none focus:border-indigo-400 focus:ring" })] }), _jsxs("div", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: [_jsx("span", { children: "Pendiente (vista previa)" }), _jsx("div", { className: `flex min-h-[42px] items-center rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2 tabular-nums ${paymentPreviewRemaining > 0 ? "text-amber-200" : paymentPreviewRemaining < 0 ? "text-rose-300" : "text-emerald-200"}`, children: money(paymentPreviewRemaining) })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["D\u00EDa de pago", _jsx("input", { type: "date", value: paymentDateInput, onChange: (e) => setPaymentDateInput(e.target.value), disabled: actionLoading, className: "min-h-[42px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none focus:border-indigo-400 focus:ring" })] })] }), _jsxs("div", { className: "mt-4 flex flex-wrap gap-3", children: [_jsx("button", { type: "button", disabled: actionLoading, onClick: () => void handleSavePayment(), className: PRIMARY_ACTION_BUTTON_COMPACT, children: "Guardar cobro" }), _jsxs("p", { className: "self-center text-xs text-slate-500", children: ["Total efectivo: ", money(paymentPreviewDue), " \u00B7 En servidor, pendiente: ", money(quote.paymentRemaining)] })] })] })) : null, _jsxs("section", { className: SECTION_SHELL, children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [_jsx("h2", { className: "text-lg font-semibold text-slate-100", children: "Cliente y datos generales" }), _jsx(CustomerProfileLink, { customerName: quote.customerName, customerPhone: quote.customerPhone })] }), _jsxs("div", { className: "mt-4 grid grid-cols-1 gap-4 md:grid-cols-2", children: [_jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Nombre del cliente", _jsx("input", { value: customerName, onChange: (e) => setCustomerName(e.target.value), className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none focus:border-indigo-400 focus:ring" })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Telefono (opcional)", _jsx("input", { value: customerPhone, onChange: (e) => setCustomerPhone(e.target.value), className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none focus:border-indigo-400 focus:ring" })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-2", children: ["Email", _jsx("input", { type: "email", value: customerEmail, onChange: (e) => setCustomerEmail(e.target.value), className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none focus:border-indigo-400 focus:ring" })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-2", children: ["Titulo", _jsx("input", { value: title, onChange: (e) => setTitle(e.target.value), className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none focus:border-indigo-400 focus:ring" })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-2", children: ["Descripcion", _jsx("textarea", { rows: 3, value: description, onChange: (e) => setDescription(e.target.value), className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none focus:border-indigo-400 focus:ring" })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Valido hasta", _jsx("input", { type: "date", value: validUntilDate, onChange: (e) => setValidUntilDate(e.target.value), className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none focus:border-indigo-400 focus:ring" })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-2", children: ["Notas internas", _jsx("textarea", { rows: 2, value: notes, onChange: (e) => setNotes(e.target.value), className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none focus:border-indigo-400 focus:ring" })] })] }), _jsxs("div", { className: "mt-4 flex flex-wrap items-center gap-3", children: [_jsx("button", { type: "button", disabled: actionLoading, onClick: () => void handleSaveMeta(), className: PRIMARY_ACTION_BUTTON, children: "Guardar presupuesto" }), _jsx("button", { type: "button", disabled: actionLoading, onClick: handleDeleteQuote, className: "rounded-lg border border-rose-600 bg-rose-900/40 px-4 py-2 text-sm font-semibold text-rose-100 hover:bg-rose-900/70 disabled:opacity-50", children: "Eliminar presupuesto" })] })] }), _jsxs("section", { className: SECTION_SHELL, children: [_jsx("h2", { className: "text-lg font-semibold text-slate-100", children: "Totales" }), quoteFinancials && quoteFinancials.linesWithoutCost > 0 ? (_jsxs("p", { className: "mt-2 text-xs text-amber-200/90", children: ["Hay ", quoteFinancials.linesWithoutCost, " l\u00EDnea", quoteFinancials.linesWithoutCost === 1 ? "" : "s", " sin coste: el coste total y el beneficio son parciales."] })) : null, _jsxs("div", { className: `mt-4 ${SUMMARY_CARD_GRID}`, children: [_jsxs("div", { className: SUMMARY_CARD_SHELL, children: [_jsx("p", { className: SUMMARY_CARD_LABEL, children: "Subtotal venta" }), _jsx("p", { className: SUMMARY_VALUE_NEUTRAL, children: money(quote.subtotal) })] }), _jsxs("div", { className: SUMMARY_CARD_SHELL, children: [_jsx("p", { className: SUMMARY_CARD_LABEL, children: "Coste total" }), _jsx("p", { className: SUMMARY_VALUE_NEUTRAL, children: money(quoteFinancials?.totalCost ?? 0) })] }), _jsxs("div", { className: SUMMARY_CARD_SHELL, children: [_jsx("p", { className: SUMMARY_CARD_LABEL, children: "Beneficio bruto" }), _jsx("p", { className: (quoteFinancials?.profitGross ?? 0) >= 0 ? SUMMARY_VALUE_PROFIT_POS : SUMMARY_VALUE_NEGATIVE, children: money(quoteFinancials?.profitGross ?? 0) })] }), _jsxs("div", { className: SUMMARY_CARD_SHELL_AUTO, children: [_jsx("p", { className: SUMMARY_CARD_LABEL, children: "Descuento" }), _jsx("input", { type: "text", inputMode: "decimal", value: discountDraft, onChange: (e) => setDiscountDraft(e.target.value), className: "mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xl font-bold text-amber-200 outline-none focus:border-indigo-400 focus:ring" }), _jsx("button", { type: "button", disabled: actionLoading, onClick: () => void handleSaveDiscount(), className: `${SECONDARY_BUTTON_SM} mt-2 w-full`, children: "Aplicar descuento" })] }), _jsxs("div", { className: SUMMARY_CARD_SHELL, children: [_jsx("p", { className: SUMMARY_CARD_LABEL, children: "Total venta" }), _jsx("p", { className: SUMMARY_VALUE_REVENUE, children: money(quote.total) })] }), _jsxs("div", { className: SUMMARY_CARD_SHELL, children: [_jsx("p", { className: SUMMARY_CARD_LABEL, children: "Beneficio neto" }), _jsx("p", { className: (quoteFinancials?.profitNet ?? 0) >= 0 ? SUMMARY_VALUE_PROFIT_POS : SUMMARY_VALUE_NEGATIVE, children: money(quoteFinancials?.profitNet ?? 0) })] })] })] }), _jsxs("section", { className: "grid grid-cols-1 gap-6 xl:grid-cols-2", children: [_jsxs("div", { className: "space-y-4", children: [_jsx(PcConfiguratorForm, { parts: configuratorParts, disabled: actionLoading || partsLoading, catalogSaleOnly: true, compact: true, heading: "Desde inventario", lead: "Misma rejilla que en Montajes: elige pieza y cantidad por ranura (CPU, RAM, etc.). Los precios de venta son los del catalogo; no descuenta stock al anadir al presupuesto.", onAddSelected: handleAddFromConfigurator }), _jsxs("div", { className: "rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/40", children: [_jsx("h3", { className: "text-sm font-semibold text-slate-100", children: "PC completo / premontado" }), _jsx("p", { className: "mt-1 text-xs text-slate-400", children: "Equipos tipo inventario \"PC completo\" con stock (no aparecen en las ranuras de componentes)." }), _jsxs("div", { className: "mt-3 flex flex-col gap-2 sm:flex-row sm:items-end", children: [_jsxs("label", { className: "flex min-w-0 flex-1 flex-col gap-0.5 text-xs font-medium text-slate-200", children: ["Equipo en stock", _jsxs("select", { value: prebuiltPartId, onChange: (e) => {
                                                            setPrebuiltPartId(e.target.value);
                                                            setPrebuiltQty(1);
                                                        }, disabled: partsLoading, className: "rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-indigo-400 focus:ring", children: [_jsx("option", { value: "", children: prebuiltInStock.length === 0 ? "Sin PCs completos en stock" : "Seleccionar..." }), prebuiltInStock.map((p) => (_jsxs("option", { value: p.id, children: [p.name, " (", p.stock, " u.) \u2014 ", money(Number(p.salePrice))] }, p.id)))] })] }), _jsxs("label", { className: "flex w-full flex-col gap-0.5 text-xs font-medium text-slate-200 sm:w-24 shrink-0", children: ["Cantidad", _jsx("input", { type: "number", min: 1, step: 1, value: prebuiltQty, onChange: (e) => setPrebuiltQty(Number(e.target.value)), className: "rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-indigo-400 focus:ring" })] }), _jsx("button", { type: "button", disabled: actionLoading || partsLoading || !prebuiltPartId, onClick: () => void handleAddPrebuiltFromInventory(), className: `${PRIMARY_ACTION_BUTTON_COMPACT} sm:shrink-0`, children: "Anadir PC" })] })] })] }), _jsxs("div", { className: SECTION_SHELL, children: [_jsx("h3", { className: "font-semibold text-slate-100", children: "Linea manual o servicio" }), _jsxs("div", { className: "mt-4 flex gap-2", children: [_jsx("button", { type: "button", onClick: () => setManualKind("MANUAL_ITEM"), className: `flex-1 rounded-lg border px-3 py-2 text-sm font-semibold ${manualKind === "MANUAL_ITEM"
                                            ? "border-indigo-500 bg-indigo-500/20 text-indigo-100"
                                            : "border-slate-700 text-slate-400 hover:bg-slate-800"}`, children: "Manual" }), _jsx("button", { type: "button", onClick: () => setManualKind("SERVICE"), className: `flex-1 rounded-lg border px-3 py-2 text-sm font-semibold ${manualKind === "SERVICE"
                                            ? "border-indigo-500 bg-indigo-500/20 text-indigo-100"
                                            : "border-slate-700 text-slate-400 hover:bg-slate-800"}`, children: "Servicio" })] }), _jsxs("div", { className: "mt-4 grid grid-cols-1 gap-3", children: [_jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Nombre", _jsx("input", { value: manualName, onChange: (e) => setManualName(e.target.value), className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none focus:border-indigo-400 focus:ring" })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Descripcion", _jsx("input", { value: manualDesc, onChange: (e) => setManualDesc(e.target.value), className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none focus:border-indigo-400 focus:ring" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Cantidad", _jsx("input", { type: "number", min: 1, value: manualQty, onChange: (e) => setManualQty(Number(e.target.value)), className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none focus:border-indigo-400 focus:ring" })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Coste unit. (opc.)", _jsx("input", { type: "text", inputMode: "decimal", value: manualCost, onChange: (e) => setManualCost(e.target.value), placeholder: "\u2014", className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none focus:border-indigo-400 focus:ring" })] })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Precio venta unitario", _jsx("input", { type: "text", inputMode: "decimal", value: manualSale, onChange: (e) => setManualSale(e.target.value), className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none focus:border-indigo-400 focus:ring" })] }), _jsx("button", { type: "button", disabled: actionLoading, onClick: () => void handleAddManual(), className: `${PRIMARY_ACTION_BUTTON} md:w-full`, children: "Anadir linea" })] })] })] }), _jsxs("section", { className: SECTION_SHELL, children: [_jsx("h3", { className: "font-semibold text-slate-100", children: "Extra desde plantilla (sin inventario)" }), _jsx("p", { className: "mt-1 text-xs text-slate-400", children: "Mismas plantillas que en Montajes: precios por defecto de la plantilla; puedes fijar otro PVP unitario opcional antes de anadir." }), _jsxs("div", { className: "mt-3 flex max-w-2xl flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end", children: [_jsxs("label", { className: "flex min-w-[12rem] flex-1 flex-col gap-1 text-xs font-medium text-slate-200", children: ["Plantilla", _jsxs("select", { value: quoteExtraTplId, disabled: actionLoading, onChange: (e) => setQuoteExtraTplId(e.target.value), className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring", children: [_jsx("option", { value: "", children: "Elegir\u2026" }), quoteExtraTemplates.map((t) => (_jsxs("option", { value: t.id, children: [t.name, t.category?.trim() ? ` (${t.category})` : ""] }, t.id)))] })] }), _jsxs("label", { className: "flex w-24 flex-col gap-1 text-xs font-medium text-slate-200", children: ["Cantidad", _jsx("input", { type: "number", min: 1, value: quoteExtraQty, disabled: actionLoading, onChange: (e) => setQuoteExtraQty(Math.max(1, Number(e.target.value) || 1)), className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring" })] }), _jsxs("label", { className: "flex min-w-[8rem] flex-1 flex-col gap-1 text-xs font-medium text-slate-200", children: ["PVP unit. (opc.)", _jsx("input", { type: "text", inputMode: "decimal", value: quoteExtraSale, disabled: actionLoading, onChange: (e) => setQuoteExtraSale(e.target.value), placeholder: "Defecto plantilla", className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring" })] }), _jsx("button", { type: "button", disabled: actionLoading || !quoteExtraTplId, onClick: () => void handleAddExtraFromTemplate(), className: PRIMARY_ACTION_BUTTON_COMPACT, children: "Anadir extra" })] })] }), _jsxs("section", { className: SECTION_SHELL, children: [_jsx("h2", { className: "text-lg font-semibold text-slate-100", children: "Lineas del presupuesto" }), _jsx("div", { className: "mt-3 hidden overflow-x-auto rounded-xl border border-slate-800 md:block", children: _jsxs("table", { className: "min-w-full text-left text-sm text-slate-200", children: [_jsx("thead", { className: "bg-slate-950/70 text-xs uppercase tracking-wide text-slate-400", children: _jsxs("tr", { children: [_jsx("th", { className: TABLE_CELL, children: "Nombre" }), _jsx("th", { className: TABLE_CELL, children: "Descripcion" }), _jsx("th", { className: TABLE_CELL, children: "Tipo" }), _jsx("th", { className: TABLE_CELL, children: "Cant." }), _jsx("th", { className: TABLE_CELL, children: "Coste u." }), _jsx("th", { className: TABLE_CELL, children: "Coste linea" }), _jsx("th", { className: TABLE_CELL, children: "P. venta u." }), _jsx("th", { className: TABLE_CELL, children: "Total venta" }), _jsx("th", { className: TABLE_CELL, children: "Beneficio" }), _jsx("th", { className: `${TABLE_CELL} text-right`, children: "Acciones" })] }) }), _jsx("tbody", { className: "divide-y divide-slate-800", children: quote.items.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 10, className: `${TABLE_CELL} py-4 text-center text-slate-500`, children: "Sin lineas. Anade desde inventario o manualmente." }) })) : (quote.items.map((item) => {
                                        const lineCost = itemLineCostTotal(item);
                                        const lineProfit = itemLineProfit(item);
                                        return (_jsxs("tr", { className: "hover:bg-slate-800/40", children: [_jsx("td", { className: `${TABLE_CELL} font-medium text-slate-100`, children: item.name }), _jsx("td", { className: `max-w-xs ${TABLE_CELL} text-xs text-slate-400`, children: _jsx("span", { className: "line-clamp-2", children: item.description || "—" }) }), _jsx("td", { className: `whitespace-nowrap ${TABLE_CELL} text-xs text-slate-500`, children: quoteItemTypeLabel(item.itemType) }), _jsx("td", { className: TABLE_CELL, children: item.quantity }), _jsx("td", { className: `${TABLE_CELL} text-slate-300`, children: moneyOrDash(item.unitCost) }), _jsx("td", { className: `${TABLE_CELL} text-slate-300`, children: moneyOrDash(lineCost) }), _jsx("td", { className: TABLE_CELL, children: money(item.unitSalePrice) }), _jsx("td", { className: `${TABLE_CELL} font-semibold text-emerald-300/95`, children: money(item.total) }), _jsx("td", { className: `${TABLE_CELL} font-medium ${lineProfit === null
                                                        ? "text-slate-500"
                                                        : lineProfit >= 0
                                                            ? "text-sky-300/95"
                                                            : "text-rose-300"}`, children: moneyOrDash(lineProfit) }), _jsx("td", { className: `${TABLE_CELL} text-right`, children: _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx("button", { type: "button", onClick: () => setEditingItem(item), className: SECONDARY_GHOST_SM, children: "Editar" }), _jsx("button", { type: "button", onClick: () => handleDeleteItem(item), disabled: actionLoading, className: DESTRUCTIVE_BUTTON_SM, children: "Eliminar" })] }) })] }, item.id));
                                    })) })] }) }), _jsx("div", { className: "mt-3 space-y-2.5 md:hidden", children: quote.items.length === 0 ? (_jsx("p", { className: "text-center text-sm text-slate-500", children: "Sin lineas." })) : (quote.items.map((item) => (_jsxs("article", { className: "rounded-xl border border-slate-800 bg-slate-950/50 p-3.5 shadow-md shadow-black/20", children: [_jsxs("div", { className: "flex justify-between gap-2", children: [_jsx("h3", { className: "font-semibold text-slate-100", children: item.name }), _jsx("span", { className: "text-[10px] uppercase text-slate-500", children: quoteItemTypeLabel(item.itemType) })] }), item.description ? (_jsx("p", { className: "mt-2 text-xs text-slate-400", children: item.description })) : null, _jsxs("dl", { className: "mt-3 grid grid-cols-2 gap-2 text-sm", children: [_jsxs("div", { children: [_jsx("dt", { className: "text-xs text-slate-500", children: "Cantidad" }), _jsx("dd", { children: item.quantity })] }), _jsxs("div", { children: [_jsx("dt", { className: "text-xs text-slate-500", children: "Coste u." }), _jsx("dd", { className: "text-slate-300", children: moneyOrDash(item.unitCost) })] }), _jsxs("div", { children: [_jsx("dt", { className: "text-xs text-slate-500", children: "Coste linea" }), _jsx("dd", { className: "text-slate-300", children: moneyOrDash(itemLineCostTotal(item)) })] }), _jsxs("div", { children: [_jsx("dt", { className: "text-xs text-slate-500", children: "P. venta u." }), _jsx("dd", { children: money(item.unitSalePrice) })] }), _jsxs("div", { className: "col-span-2", children: [_jsx("dt", { className: "text-xs text-slate-500", children: "Total venta" }), _jsx("dd", { className: "font-semibold text-emerald-300", children: money(item.total) })] }), _jsxs("div", { className: "col-span-2", children: [_jsx("dt", { className: "text-xs text-slate-500", children: "Beneficio" }), _jsx("dd", { className: `font-medium ${itemLineProfit(item) === null
                                                        ? "text-slate-500"
                                                        : (itemLineProfit(item) ?? 0) >= 0
                                                            ? "text-sky-300"
                                                            : "text-rose-300"}`, children: moneyOrDash(itemLineProfit(item)) })] })] }), _jsxs("div", { className: "mt-3 flex gap-2", children: [_jsx("button", { type: "button", onClick: () => setEditingItem(item), className: `${SECONDARY_GHOST_SM} flex-1 justify-center py-2`, children: "Editar" }), _jsx("button", { type: "button", onClick: () => handleDeleteItem(item), disabled: actionLoading, className: `${DESTRUCTIVE_BUTTON_SM} flex-1 justify-center py-2`, children: "Eliminar" })] })] }, item.id)))) })] }), editingItem ? (_jsxs("div", { className: "fixed inset-0 z-[120] flex items-end justify-center p-4 sm:items-center", children: [_jsx("button", { type: "button", className: "absolute inset-0 bg-black/70 backdrop-blur-[1px]", "aria-label": "Cerrar", onClick: () => setEditingItem(null) }), _jsxs("div", { role: "dialog", "aria-modal": "true", className: "relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl", children: [_jsx("h3", { className: "text-lg font-semibold text-slate-100", children: "Editar linea" }), _jsxs("div", { className: "mt-4 grid gap-3", children: [_jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Nombre", _jsx("input", { value: editName, onChange: (e) => setEditName(e.target.value), className: "rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-indigo-400 focus:ring" })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Descripcion", _jsx("input", { value: editDesc, onChange: (e) => setEditDesc(e.target.value), className: "rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-indigo-400 focus:ring" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Cantidad", _jsx("input", { type: "number", min: 1, value: editQty, onChange: (e) => setEditQty(Number(e.target.value)), className: "rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-indigo-400 focus:ring" })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Coste u. (opc.)", _jsx("input", { type: "text", inputMode: "decimal", value: editCost, onChange: (e) => setEditCost(e.target.value), className: "rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-indigo-400 focus:ring" })] })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Precio venta unitario", _jsx("input", { type: "text", inputMode: "decimal", value: editSale, onChange: (e) => setEditSale(e.target.value), className: "rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-indigo-400 focus:ring" })] })] }), _jsxs("div", { className: "mt-6 flex flex-wrap justify-end gap-2", children: [_jsx("button", { type: "button", onClick: () => setEditingItem(null), className: SECONDARY_BUTTON_SM, children: "Cancelar" }), _jsx("button", { type: "button", disabled: actionLoading, onClick: () => void handleSaveEditItem(), className: PRIMARY_ACTION_BUTTON_COMPACT, children: "Guardar" })] })] })] })) : null] }));
}
