import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CustomerProfileLink } from "../components/customers/CustomerProfileLink";
import { BuildItemsTable } from "../components/builds/BuildItemsTable";
import { BuildExtraLinesTable } from "../components/builds/BuildExtraLinesTable";
import { useSaleDetail } from "../hooks/useSaleDetail";
import { PRIMARY_ACTION_BUTTON } from "../theme/actionButtons";
import { SUMMARY_CARD_GRID, SUMMARY_CARD_LABEL, SUMMARY_CARD_SHELL, SUMMARY_VALUE_NEGATIVE, SUMMARY_VALUE_NEUTRAL, SUMMARY_VALUE_PROFIT_POS, SUMMARY_VALUE_PROFIT_CYAN, SUMMARY_VALUE_REVENUE } from "../theme/summaryCards";
import { PAGE_HERO, PAGE_OUTER_7XL, SECTION_SHELL } from "../theme/layoutDensity";
import { PaymentMethodSelect } from "../components/ui/PaymentMethodSelect";
import { StatusBadge, saleStatusVariant } from "../components/ui/StatusBadge";
import { customerFieldToForm } from "../utils/customerUi";
import { isRevertedSale } from "../utils/salesStats";
import { buildPricingTotalSale, saleAmountPaid, saleAmountRemaining, saleLooksUnderstated } from "../utils/saleAmounts";
function money(n) {
    return `${n.toFixed(2)} EUR`;
}
function toDatetimeLocalValue(iso) {
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
export function SaleDetailPage() {
    const { id } = useParams();
    const saleId = String(id ?? "");
    const navigate = useNavigate();
    const { sale, loading, saving, error, reload, updateSale, revertSale, recalculateFromBuild } = useSaleDetail(saleId);
    const [editName, setEditName] = useState("");
    const [editPhone, setEditPhone] = useState("");
    const [editPrice, setEditPrice] = useState("");
    const [editPayment, setEditPayment] = useState("");
    const [editWarranty, setEditWarranty] = useState("");
    const [editNotes, setEditNotes] = useState("");
    const [editSoldAt, setEditSoldAt] = useState("");
    useEffect(() => {
        if (!sale)
            return;
        setEditName(customerFieldToForm(sale.customerName));
        setEditPhone(customerFieldToForm(sale.customerPhone));
        setEditPrice(sale.finalSalePrice.toFixed(2));
        setEditPayment(sale.paymentMethod ?? "");
        setEditWarranty(sale.warrantyMonths != null ? String(sale.warrantyMonths) : "");
        setEditNotes(sale.notes ?? "");
        setEditSoldAt(toDatetimeLocalValue(sale.soldAt));
    }, [sale]);
    const handleSave = async (event) => {
        event.preventDefault();
        if (!sale)
            return;
        const normalized = Number(editPrice.replace(",", ".").trim());
        if (!Number.isFinite(normalized) || normalized < 0) {
            window.alert("Precio final invalido.");
            return;
        }
        const soldDate = new Date(editSoldAt);
        if (Number.isNaN(soldDate.getTime())) {
            window.alert("Fecha de venta invalida.");
            return;
        }
        await updateSale({
            customerName: editName.trim(),
            customerPhone: editPhone.trim(),
            customerEmail: null,
            finalSalePrice: Math.round(normalized * 100) / 100,
            paymentMethod: editPayment.trim() ? editPayment.trim() : null,
            warrantyMonths: editWarranty.trim() === "" ? null : Math.max(0, parseInt(editWarranty, 10) || 0),
            notes: editNotes.trim() ? editNotes.trim() : null,
            soldAt: soldDate.toISOString()
        });
    };
    const handleConfirmPickup = async () => {
        if (!sale)
            return;
        const ok = window.confirm("Confirmar que el cliente ha recogido el equipo? Pasara a contar como PC entregado y el montaje quedara como vendido.");
        if (!ok)
            return;
        try {
            await updateSale({ pickupConfirmedAt: new Date().toISOString() });
        }
        catch {
            /* error shown via hook */
        }
    };
    const handleRecalculateFromBuild = async () => {
        if (!sale || sale.isImported || isRevertedSale(sale))
            return;
        const ok = window.confirm("Recalcular esta venta desde el montaje?\n\n- Precio total = precio de venta del montaje\n- Coste = suma real de piezas\n- Beneficio = total − coste\n- Se intentara restaurar el importe ya cobrado (reserva) si faltaba");
        if (!ok)
            return;
        try {
            await recalculateFromBuild();
        }
        catch {
            /* error shown via hook */
        }
    };
    const handleRevertSale = async () => {
        if (!sale || isRevertedSale(sale))
            return;
        const ok = window.confirm("Revertir esta venta?\n\n- El montaje volvera a listo para la venta (el stock sigue comprometido en el montaje)\n- La venta quedara en historial como revertida (no se borra)\n- Dejara de contar en ingresos y beneficios");
        if (!ok)
            return;
        try {
            await revertSale();
            void navigate(`/builds/${sale.buildId}`, {
                state: { flash: "Venta revertida. Montaje disponible de nuevo." }
            });
        }
        catch {
            /* error shown via hook */
        }
    };
    if (!id) {
        return (_jsx("section", { className: "rounded-2xl border border-rose-800/70 bg-rose-950/40 p-6 text-rose-200", children: "ID de venta invalido." }));
    }
    if (loading) {
        return (_jsxs("div", { className: PAGE_OUTER_7XL, children: [_jsx("div", { className: "h-32 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60" }), _jsx("div", { className: "grid grid-cols-1 gap-3 md:grid-cols-3", children: [1, 2, 3].map((k) => (_jsx("div", { className: "h-24 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60" }, k))) }), _jsx("div", { className: "h-56 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60" })] }));
    }
    if (!sale) {
        return (_jsxs("section", { className: SECTION_SHELL, children: [_jsx("p", { className: "text-sm text-slate-300", children: error ?? "Venta no encontrada." }), _jsx(Link, { to: "/sales", className: "mt-3 inline-flex text-sm font-medium text-indigo-300 hover:text-indigo-200", children: "Volver a ventas" })] }));
    }
    const b = sale.build;
    const isReverted = isRevertedSale(sale);
    const buildTotal = buildPricingTotalSale(b);
    const paidAtSale = saleAmountPaid(sale);
    const remainingAtSale = saleAmountRemaining(sale);
    const looksMispriced = saleLooksUnderstated(sale, buildTotal);
    return (_jsxs("div", { className: PAGE_OUTER_7XL, children: [_jsxs("section", { className: PAGE_HERO, children: [_jsxs("div", { className: "flex flex-wrap items-start justify-between gap-2.5", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-2xl font-bold tracking-tight", children: ["Venta \u00B7 ", b.name] }), _jsxs("p", { className: "mt-1 text-sm text-slate-300", children: ["Cliente: ", _jsx("span", { className: "font-medium text-slate-100", children: sale.customerName })] })] }), isReverted ? (_jsx(StatusBadge, { variant: saleStatusVariant("REVERTED"), size: "detail", children: "Venta revertida" })) : sale.pickupConfirmedAt == null ? (_jsx(StatusBadge, { variant: "pending", size: "detail", children: "Cobrado \u00B7 pendiente de recogida" })) : (_jsx(StatusBadge, { variant: "sold", size: "detail", children: "Entregado" }))] }), _jsxs("div", { className: "mt-4 flex flex-wrap gap-2", children: [_jsx(Link, { to: "/sales", className: "rounded-full border border-slate-600 bg-slate-950/60 px-3 py-1 text-xs font-medium text-slate-200 hover:bg-slate-800", children: "Ventas" }), _jsx(Link, { to: `/builds/${b.id}`, className: "rounded-full border border-slate-600 bg-slate-950/60 px-3 py-1 text-xs font-medium text-slate-200 hover:bg-slate-800", children: "Montaje" }), _jsx(CustomerProfileLink, { customerName: sale.customerName, customerPhone: sale.customerPhone, className: "rounded-full border border-slate-600 bg-slate-950/60 px-3 py-1 text-xs font-medium text-indigo-200 hover:bg-slate-800", children: "Ficha cliente" }), sale.paymentMethod ? (_jsx(StatusBadge, { variant: "meta", size: "detail", className: "font-medium", children: sale.paymentMethod })) : null, sale.warrantyMonths != null ? (_jsxs(StatusBadge, { variant: "completed", size: "detail", className: "font-medium", children: ["Garantia ", sale.warrantyMonths, " meses"] })) : null] })] }), error ? (_jsxs("div", { className: "rounded-xl border border-rose-800/70 bg-rose-950/40 px-4 py-3 text-sm text-rose-200", children: [error, _jsx("button", { type: "button", onClick: () => {
                            void reload();
                        }, className: "ml-3 rounded-lg border border-rose-700 px-2 py-1 text-xs font-semibold text-rose-100", children: "Reintentar" })] })) : null, isReverted ? (_jsxs("section", { className: "rounded-xl border border-rose-800/60 bg-rose-950/40 px-4 py-3 text-sm text-rose-100", children: [_jsx("p", { className: "font-medium", children: "Esta venta fue revertida." }), _jsxs("p", { className: "mt-1 text-rose-200/90", children: ["No cuenta en ingresos ni beneficios. El montaje quedo disponible para vender de nuevo.", sale.revertedAt
                                ? ` Revertida el ${new Date(sale.revertedAt).toLocaleString("es-ES")}.`
                                : null] }), _jsx(Link, { to: `/builds/${sale.buildId}`, className: "mt-3 inline-flex rounded-lg border border-rose-600/50 bg-rose-900/40 px-4 py-2 text-sm font-semibold text-rose-100 hover:bg-rose-900/60", children: "Ir al montaje" })] })) : null, !isReverted && sale.pickupConfirmedAt == null ? (_jsxs("section", { className: "rounded-xl border border-amber-700/60 bg-amber-950/35 px-4 py-3 text-sm text-amber-100", children: [_jsx("p", { className: "font-medium", children: "Esta venta esta cobrada pero el PC sigue en tienda." }), _jsx("p", { className: "mt-1 text-amber-200/90", children: "Cuenta en ingresos y beneficios del mes de la venta; no aparece en la lista de PCs entregados hasta que confirmes la recogida." }), _jsx("button", { type: "button", disabled: saving, onClick: () => {
                            void handleConfirmPickup();
                        }, className: "mt-3 rounded-lg border border-amber-500/60 bg-amber-500/15 px-4 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-500/25 disabled:opacity-50", children: saving ? "Guardando..." : "Confirmar recogida" })] })) : null, !isReverted && looksMispriced && !sale.isImported ? (_jsxs("section", { className: "rounded-xl border border-amber-700/60 bg-amber-950/35 px-4 py-3 text-sm text-amber-100", children: [_jsx("p", { className: "font-medium", children: "Posible error en el precio guardado" }), _jsxs("p", { className: "mt-1 text-amber-200/90", children: ["El importe registrado (", money(sale.finalSalePrice), ") parece ser solo el pendiente tras una reserva, no el total del montaje", buildTotal != null ? ` (${money(buildTotal)})` : "", "."] }), _jsx("button", { type: "button", disabled: saving, onClick: () => {
                            void handleRecalculateFromBuild();
                        }, className: "mt-3 rounded-lg border border-amber-500/60 bg-amber-500/15 px-4 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-500/25 disabled:opacity-50", children: saving ? "Recalculando..." : "Recalcular desde montaje" })] })) : null, _jsxs("section", { className: SUMMARY_CARD_GRID, children: [_jsxs("article", { className: SUMMARY_CARD_SHELL, children: [_jsx("p", { className: SUMMARY_CARD_LABEL, children: "Precio total venta" }), _jsx("p", { className: SUMMARY_VALUE_REVENUE, children: money(sale.finalSalePrice) })] }), _jsxs("article", { className: SUMMARY_CARD_SHELL, children: [_jsx("p", { className: SUMMARY_CARD_LABEL, children: "Pagado / reserva" }), _jsx("p", { className: SUMMARY_VALUE_PROFIT_CYAN, children: paidAtSale > 0.005 ? money(paidAtSale) : "—" })] }), _jsxs("article", { className: SUMMARY_CARD_SHELL, children: [_jsx("p", { className: SUMMARY_CARD_LABEL, children: "Pendiente" }), _jsx("p", { className: SUMMARY_VALUE_NEUTRAL, children: paidAtSale > 0.005 || remainingAtSale > 0.005 ? money(remainingAtSale) : "—" })] }), _jsxs("article", { className: SUMMARY_CARD_SHELL, children: [_jsx("p", { className: SUMMARY_CARD_LABEL, children: "Coste" }), _jsx("p", { className: SUMMARY_VALUE_NEUTRAL, children: money(sale.totalCost) })] }), _jsxs("article", { className: SUMMARY_CARD_SHELL, children: [_jsx("p", { className: SUMMARY_CARD_LABEL, children: "Beneficio" }), _jsx("p", { className: sale.profit >= 0 ? SUMMARY_VALUE_PROFIT_POS : SUMMARY_VALUE_NEGATIVE, children: money(sale.profit) })] })] }), !isReverted && !sale.isImported && !looksMispriced ? (_jsx("p", { className: "text-center text-xs text-slate-500", children: _jsx("button", { type: "button", disabled: saving, onClick: () => {
                        void handleRecalculateFromBuild();
                    }, className: "underline decoration-slate-600 underline-offset-2 hover:text-slate-300 disabled:opacity-50", children: "Recalcular precio, coste y beneficio desde el montaje" }) })) : null, _jsxs("section", { className: SECTION_SHELL, children: [_jsx("h2", { className: "text-lg font-semibold text-slate-100", children: isReverted ? "Datos de la venta (solo lectura)" : "Editar datos de la venta" }), _jsx("p", { className: "mt-1 text-sm text-slate-400", children: isReverted
                            ? "La venta revertida se conserva en el historial; no se puede editar."
                            : "Modifica cliente, precio total o condiciones. El beneficio se recalcula como precio total − coste." }), _jsxs("form", { onSubmit: handleSave, className: "mt-3 grid grid-cols-1 gap-3 md:grid-cols-2", children: [_jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-2", children: ["Nombre del cliente", _jsx("input", { value: editName, onChange: (e) => setEditName(e.target.value), disabled: saving || isReverted, className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring disabled:opacity-50" })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Telefono", _jsx("input", { value: editPhone, onChange: (e) => setEditPhone(e.target.value), disabled: saving || isReverted, className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring disabled:opacity-50" })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Precio total de venta (EUR)", _jsx("input", { value: editPrice, onChange: (e) => setEditPrice(e.target.value), disabled: saving || isReverted, inputMode: "decimal", className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring disabled:opacity-50" })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Fecha y hora de venta", _jsx("input", { type: "datetime-local", value: editSoldAt, onChange: (e) => setEditSoldAt(e.target.value), disabled: saving || isReverted, className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring disabled:opacity-50" })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-2", children: ["Metodo de pago", _jsx(PaymentMethodSelect, { value: editPayment, onChange: setEditPayment, disabled: saving || isReverted, className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring disabled:opacity-50" })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200", children: ["Garantia (meses)", _jsx("input", { type: "number", min: 0, value: editWarranty, onChange: (e) => setEditWarranty(e.target.value), disabled: saving || isReverted, className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring disabled:opacity-50" })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-2", children: ["Notas", _jsx("textarea", { value: editNotes, onChange: (e) => setEditNotes(e.target.value), disabled: saving || isReverted, rows: 3, className: "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring disabled:opacity-50" })] }), _jsx("div", { className: "flex flex-wrap gap-2 md:col-span-2", children: !isReverted ? (_jsxs(_Fragment, { children: [_jsx("button", { type: "submit", disabled: saving, className: PRIMARY_ACTION_BUTTON, children: saving ? "Guardando..." : "Guardar cambios" }), _jsx("button", { type: "button", disabled: saving, onClick: () => {
                                                void handleRevertSale();
                                            }, className: "rounded-lg border border-rose-500/60 bg-rose-600/20 px-4 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-600/35 disabled:opacity-50", children: "Revertir venta" })] })) : null })] })] }), _jsxs("section", { children: [_jsx("h2", { className: "mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400", children: "Piezas del montaje" }), _jsx(BuildItemsTable, { items: b.items, status: isReverted ? "CONFIRMED" : "SOLD", actionLoading: false, onRemove: async () => { } }), _jsx("p", { className: "mt-2 text-xs text-slate-500", children: "Referencia del configuracion vendido; no se pueden modificar lineas desde aqui." })] }), (b.extraLines?.length ?? 0) > 0 ? (_jsxs("section", { className: "mt-8", children: [_jsx("h2", { className: "mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400", children: "Extras del montaje" }), _jsx(BuildExtraLinesTable, { lines: b.extraLines ?? [], status: isReverted ? "CONFIRMED" : "SOLD", actionLoading: false, onRemove: async () => { } })] })) : null] }));
}
