import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import * as quotesApi from "../api/quotes";
import { PcConfiguratorForm, type ConfiguratorAddItem } from "../components/builds/PcConfiguratorForm";
import { useParts } from "../hooks/useParts";
import { isConfiguratorPart, isPrebuiltPc } from "../types/part";
import type { AddQuoteItemPayload, PatchQuoteItemPayload, Quote, QuoteItem, QuoteStatus } from "../types/quote";
import { QUOTE_STATUSES } from "../types/quote";
import {
  aggregateQuoteFinancials,
  itemLineCostTotal,
  itemLineProfit,
  moneyOrDash
} from "../utils/quoteFinancials";

function money(n: number): string {
  return `${n.toFixed(2)} EUR`;
}

function isoDateOnly(iso: string | null): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  } catch {
    return "";
  }
}

const STATUS_LABELS: Record<QuoteStatus, string> = {
  DRAFT: "Borrador",
  SENT: "Enviado",
  ACCEPTED: "Aceptado",
  REJECTED: "Rechazado",
  EXPIRED: "Caducado"
};

export function QuoteDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const quoteId = String(id ?? "");
  const { parts: inventoryParts, loading: partsLoading } = useParts();

  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  const [statusDraft, setStatusDraft] = useState<QuoteStatus>("DRAFT");

  const [prebuiltPartId, setPrebuiltPartId] = useState("");
  const [prebuiltQty, setPrebuiltQty] = useState(1);

  const [manualKind, setManualKind] = useState<"MANUAL_ITEM" | "SERVICE">("MANUAL_ITEM");
  const [manualName, setManualName] = useState("");
  const [manualDesc, setManualDesc] = useState("");
  const [manualQty, setManualQty] = useState(1);
  const [manualCost, setManualCost] = useState("");
  const [manualSale, setManualSale] = useState("");

  const [editingItem, setEditingItem] = useState<QuoteItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editQty, setEditQty] = useState(1);
  const [editCost, setEditCost] = useState("");
  const [editSale, setEditSale] = useState("");

  const applyQuoteToForm = useCallback((q: Quote) => {
    setCustomerName(q.customerName);
    setCustomerPhone(q.customerPhone ?? "");
    setCustomerEmail(q.customerEmail ?? "");
    setTitle(q.title);
    setDescription(q.description ?? "");
    setValidUntilDate(isoDateOnly(q.validUntil));
    setNotes(q.notes ?? "");
    setDiscountDraft(Number(q.discountAmount).toFixed(2));
    setStatusDraft(q.status);
  }, []);

  const reload = useCallback(async () => {
    if (!quoteId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await quotesApi.getQuote(quoteId);
      setQuote(data);
      applyQuoteToForm(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar el presupuesto.");
      setQuote(null);
    } finally {
      setLoading(false);
    }
  }, [quoteId, applyQuoteToForm]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!editingItem) return;
    setEditName(editingItem.name);
    setEditDesc(editingItem.description ?? "");
    setEditQty(editingItem.quantity);
    setEditCost(editingItem.unitCost != null ? String(editingItem.unitCost) : "");
    setEditSale(String(editingItem.unitSalePrice));
  }, [editingItem]);

  const handleDownloadPdf = useCallback(async () => {
    if (!quote) return;
    setPdfGenerating(true);
    setError(null);
    try {
      const [{ pdf }, { QuotePdfDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("../components/quotes/QuotePdfDocument")
      ]);
      const blob = await pdf(<QuotePdfDocument quote={quote} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `presupuesto-${quote.quoteNumber}.pdf`;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo generar el PDF.");
    } finally {
      setPdfGenerating(false);
    }
  }, [quote]);

  const run = async (fn: () => Promise<Quote | void>) => {
    setActionLoading(true);
    setError(null);
    try {
      const updated = await fn();
      if (updated) {
        setQuote(updated);
        applyQuoteToForm(updated);
      } else {
        await reload();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operacion fallida.");
    } finally {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el presupuesto.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveDiscount = () => {
    const n = Number(discountDraft.replace(",", ".").trim());
    if (!Number.isFinite(n) || n < 0) {
      window.alert("Descuento invalido.");
      return;
    }
    void run(async () =>
      quotesApi.patchQuote(quoteId, { discountAmount: Math.round(n * 100) / 100 })
    );
  };

  const handleStatusSave = () =>
    run(async () => quotesApi.patchQuoteStatus(quoteId, { status: statusDraft }));

  const handleAddFromConfigurator = async (items: ConfiguratorAddItem[]) => {
    if (items.length === 0) return;
    await run(async () => {
      let last: Quote | undefined;
      for (const it of items) {
        if (it.quantity < 1) continue;
        const payload: AddQuoteItemPayload = {
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
    const payload: AddQuoteItemPayload = {
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
    let unitCost: number | null | undefined = undefined;
    if (manualCost.trim() !== "") {
      const c = Number(manualCost.replace(",", ".").trim());
      if (!Number.isFinite(c) || c < 0) {
        window.alert("Coste invalido.");
        return;
      }
      unitCost = Math.round(c * 100) / 100;
    }
    const payload: AddQuoteItemPayload =
      manualKind === "SERVICE"
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

  const handleSaveEditItem = () => {
    if (!editingItem) return;
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
    const patch: PatchQuoteItemPayload = {
      name: editName.trim(),
      description: editDesc.trim() || null,
      quantity: qty,
      unitSalePrice: Math.round(sale * 100) / 100
    };
    if (editCost.trim() === "") {
      patch.unitCost = null;
    } else {
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

  const handleDeleteItem = (item: QuoteItem) => {
    const ok = window.confirm(`Eliminar linea "${item.name}"?`);
    if (!ok) return;
    void run(async () => quotesApi.deleteQuoteItem(quoteId, item.id));
  };

  const handleAcceptAndCreateBuild = async () => {
    const ok = window.confirm(
      "Se creará un montaje en borrador con las piezas del inventario. Las líneas manuales o de servicio quedarán en las notas del montaje. ¿Continuar?"
    );
    if (!ok) return;
    setActionLoading(true);
    setError(null);
    try {
      const build = await quotesApi.convertQuoteToBuild(quoteId);
      navigate(`/builds/${build.id}`, {
        state: { flash: "Montaje creado desde el presupuesto aceptado." }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el montaje.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteQuote = () => {
    const ok = window.confirm("Eliminar este presupuesto de forma permanente?");
    if (!ok) return;
    void (async () => {
      setActionLoading(true);
      setError(null);
      try {
        await quotesApi.deleteQuote(quoteId);
        navigate("/quotes");
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo eliminar.");
      } finally {
        setActionLoading(false);
      }
    })();
  };

  const configuratorParts = useMemo(
    () => inventoryParts.filter(isConfiguratorPart),
    [inventoryParts]
  );

  const prebuiltInStock = useMemo(
    () =>
      [...inventoryParts]
        .filter((p) => isPrebuiltPc(p) && p.stock > 0)
        .sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" })),
    [inventoryParts]
  );

  const quoteFinancials = useMemo(() => {
    if (!quote) return null;
    return aggregateQuoteFinancials(quote);
  }, [quote]);

  if (!id) {
    return (
      <section className="rounded-2xl border border-rose-800/70 bg-rose-950/40 p-6 text-rose-200">
        ID de presupuesto invalido.
      </section>
    );
  }

  if (loading && !quote) {
    return (
      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
        <p className="text-sm text-slate-300">Cargando presupuesto...</p>
      </section>
    );
  }

  if (!quote) {
    return (
      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
        <p className="text-sm text-slate-300">Presupuesto no encontrado.</p>
        <Link to="/quotes" className="mt-4 inline-flex text-indigo-300 hover:text-indigo-200">
          Volver a presupuestos
        </Link>
      </section>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-2 pb-8 text-slate-100 md:px-4">
      <header className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 shadow-[0_20px_50px_-24px_rgba(79,70,229,0.75)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-sm text-slate-400">Presupuesto #{quote.quoteNumber}</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-100">{quote.title}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void handleDownloadPdf()}
              disabled={pdfGenerating || actionLoading}
              className="rounded-lg border border-slate-600 bg-slate-900/80 px-4 py-2 text-sm font-semibold text-slate-100 shadow-sm transition hover:border-cyan-500/40 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pdfGenerating ? "Generando PDF…" : "Descargar PDF"}
            </button>
            <Link
              to="/quotes"
              className="text-sm font-medium text-indigo-300 underline-offset-2 hover:text-indigo-200 hover:underline"
            >
              Presupuestos
            </Link>
          </div>
        </div>
      </header>

      {error ? (
        <div className="rounded-xl border border-rose-800/70 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      {quote.convertedToBuildId ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/40 bg-emerald-950/35 px-4 py-3 text-sm text-emerald-100">
          <span>
            Este presupuesto ya fue convertido en un montaje
            {quote.convertedAt
              ? ` (${new Date(quote.convertedAt).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })})`
              : ""}
            .
          </span>
          <Link
            to={`/builds/${quote.convertedToBuildId}`}
            className="rounded-lg border border-emerald-500/50 bg-emerald-900/40 px-4 py-2 text-sm font-semibold text-emerald-100 hover:bg-emerald-900/70"
          >
            Ver montaje generado
          </Link>
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg shadow-slate-950/40">
        <h2 className="text-lg font-semibold text-slate-100">Estado</h2>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
            Estado del presupuesto
            <select
              value={statusDraft}
              onChange={(e) => setStatusDraft(e.target.value as QuoteStatus)}
              disabled={actionLoading}
              className="min-h-[42px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none focus:border-indigo-400 focus:ring focus:ring-indigo-400/40"
            >
              {QUOTE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            disabled={actionLoading || statusDraft === quote.status}
            onClick={() => void handleStatusSave()}
            className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-cyan-500 disabled:opacity-50"
          >
            Actualizar estado
          </button>
          {quote.convertedToBuildId ? null : (
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => void handleAcceptAndCreateBuild()}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-emerald-500 disabled:opacity-50"
            >
              Aceptar y crear montaje
            </button>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg shadow-slate-950/40">
        <h2 className="text-lg font-semibold text-slate-100">Cliente y datos generales</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
            Nombre del cliente
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none focus:border-indigo-400 focus:ring"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
            Telefono (opcional)
            <input
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none focus:border-indigo-400 focus:ring"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-2">
            Email
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none focus:border-indigo-400 focus:ring"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-2">
            Titulo
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none focus:border-indigo-400 focus:ring"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-2">
            Descripcion
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none focus:border-indigo-400 focus:ring"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
            Valido hasta
            <input
              type="date"
              value={validUntilDate}
              onChange={(e) => setValidUntilDate(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none focus:border-indigo-400 focus:ring"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-200 md:col-span-2">
            Notas internas
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none focus:border-indigo-400 focus:ring"
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={actionLoading}
            onClick={() => void handleSaveMeta()}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            Guardar presupuesto
          </button>
          <button
            type="button"
            disabled={actionLoading}
            onClick={handleDeleteQuote}
            className="rounded-lg border border-rose-600 bg-rose-900/40 px-4 py-2 text-sm font-semibold text-rose-100 hover:bg-rose-900/70 disabled:opacity-50"
          >
            Eliminar presupuesto
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg shadow-slate-950/40">
        <h2 className="text-lg font-semibold text-slate-100">Totales</h2>
        {quoteFinancials && quoteFinancials.linesWithoutCost > 0 ? (
          <p className="mt-2 text-xs text-amber-200/90">
            Hay {quoteFinancials.linesWithoutCost} línea
            {quoteFinancials.linesWithoutCost === 1 ? "" : "s"} sin coste: el coste total y el beneficio son parciales.
          </p>
        ) : null}
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
            <p className="text-xs uppercase text-slate-500">Subtotal venta</p>
            <p className="mt-1 text-xl font-bold text-slate-100">{money(quote.subtotal)}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
            <p className="text-xs uppercase text-slate-500">Total coste</p>
            <p className="mt-1 text-xl font-bold text-slate-200">{money(quoteFinancials?.totalCost ?? 0)}</p>
          </div>
          <div className="rounded-xl border border-sky-500/25 bg-sky-950/25 p-4">
            <p className="text-xs uppercase text-sky-400/90">Beneficio bruto</p>
            <p
              className={`mt-1 text-xl font-bold ${
                (quoteFinancials?.profitGross ?? 0) >= 0 ? "text-sky-300" : "text-rose-300"
              }`}
            >
              {money(quoteFinancials?.profitGross ?? 0)}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">Subtotal venta menos coste</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
            <p className="text-xs uppercase text-slate-500">Descuento</p>
            <input
              type="text"
              inputMode="decimal"
              value={discountDraft}
              onChange={(e) => setDiscountDraft(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xl font-bold text-amber-200 outline-none focus:border-indigo-400 focus:ring"
            />
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => void handleSaveDiscount()}
              className="mt-2 w-full rounded-lg border border-amber-500/40 bg-amber-500/10 py-2 text-xs font-semibold text-amber-100 hover:bg-amber-500/20 disabled:opacity-50"
            >
              Aplicar descuento
            </button>
          </div>
          <div className="rounded-xl border border-emerald-500/25 bg-emerald-950/30 p-4">
            <p className="text-xs uppercase text-emerald-400/90">Total venta (cliente)</p>
            <p className="mt-1 text-xl font-bold text-emerald-300">{money(quote.total)}</p>
          </div>
          <div className="rounded-xl border border-violet-500/25 bg-violet-950/30 p-4">
            <p className="text-xs uppercase text-violet-300/90">Beneficio neto</p>
            <p
              className={`mt-1 text-xl font-bold ${
                (quoteFinancials?.profitNet ?? 0) >= 0 ? "text-violet-200" : "text-rose-300"
              }`}
            >
              {money(quoteFinancials?.profitNet ?? 0)}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">Total cliente menos coste</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="space-y-4">
          <PcConfiguratorForm
            parts={configuratorParts}
            disabled={actionLoading || partsLoading}
            catalogSaleOnly
            compact
            heading="Desde inventario"
            lead="Misma rejilla que en Montajes: elige pieza y cantidad por ranura (CPU, RAM, etc.). Los precios de venta son los del catalogo; no descuenta stock al anadir al presupuesto."
            onAddSelected={handleAddFromConfigurator}
          />

          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/40">
            <h3 className="text-sm font-semibold text-slate-100">PC completo / premontado</h3>
            <p className="mt-1 text-xs text-slate-400">
              Equipos tipo inventario &quot;PC completo&quot; con stock (no aparecen en las ranuras de componentes).
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
              <label className="flex min-w-0 flex-1 flex-col gap-0.5 text-xs font-medium text-slate-200">
                Equipo en stock
                <select
                  value={prebuiltPartId}
                  onChange={(e) => {
                    setPrebuiltPartId(e.target.value);
                    setPrebuiltQty(1);
                  }}
                  disabled={partsLoading}
                  className="rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-indigo-400 focus:ring"
                >
                  <option value="">
                    {prebuiltInStock.length === 0 ? "Sin PCs completos en stock" : "Seleccionar..."}
                  </option>
                  {prebuiltInStock.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.stock} u.) — {money(Number(p.salePrice))}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex w-full flex-col gap-0.5 text-xs font-medium text-slate-200 sm:w-24 shrink-0">
                Cantidad
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={prebuiltQty}
                  onChange={(e) => setPrebuiltQty(Number(e.target.value))}
                  className="rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-indigo-400 focus:ring"
                />
              </label>
              <button
                type="button"
                disabled={actionLoading || partsLoading || !prebuiltPartId}
                onClick={() => void handleAddPrebuiltFromInventory()}
                className="rounded-md bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-500 disabled:opacity-50 sm:shrink-0"
              >
                Anadir PC
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg shadow-slate-950/40">
          <h3 className="font-semibold text-slate-100">Linea manual o servicio</h3>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setManualKind("MANUAL_ITEM")}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold ${
                manualKind === "MANUAL_ITEM"
                  ? "border-indigo-500 bg-indigo-500/20 text-indigo-100"
                  : "border-slate-700 text-slate-400 hover:bg-slate-800"
              }`}
            >
              Manual
            </button>
            <button
              type="button"
              onClick={() => setManualKind("SERVICE")}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold ${
                manualKind === "SERVICE"
                  ? "border-indigo-500 bg-indigo-500/20 text-indigo-100"
                  : "border-slate-700 text-slate-400 hover:bg-slate-800"
              }`}
            >
              Servicio
            </button>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3">
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
              Nombre
              <input
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none focus:border-indigo-400 focus:ring"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
              Descripcion
              <input
                value={manualDesc}
                onChange={(e) => setManualDesc(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none focus:border-indigo-400 focus:ring"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
                Cantidad
                <input
                  type="number"
                  min={1}
                  value={manualQty}
                  onChange={(e) => setManualQty(Number(e.target.value))}
                  className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none focus:border-indigo-400 focus:ring"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
                Coste unit. (opc.)
                <input
                  type="text"
                  inputMode="decimal"
                  value={manualCost}
                  onChange={(e) => setManualCost(e.target.value)}
                  placeholder="—"
                  className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none focus:border-indigo-400 focus:ring"
                />
              </label>
            </div>
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
              Precio venta unitario
              <input
                type="text"
                inputMode="decimal"
                value={manualSale}
                onChange={(e) => setManualSale(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none focus:border-indigo-400 focus:ring"
              />
            </label>
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => void handleAddManual()}
              className="rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              Anadir linea
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg shadow-slate-950/40">
        <h2 className="text-lg font-semibold text-slate-100">Lineas del presupuesto</h2>

        <div className="mt-4 hidden overflow-x-auto rounded-xl border border-slate-800 md:block">
          <table className="min-w-full text-left text-sm text-slate-200">
            <thead className="bg-slate-950/70 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Descripcion</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Cant.</th>
                <th className="px-4 py-3">Coste u.</th>
                <th className="px-4 py-3">Coste linea</th>
                <th className="px-4 py-3">P. venta u.</th>
                <th className="px-4 py-3">Total venta</th>
                <th className="px-4 py-3">Beneficio</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {quote.items.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-6 text-center text-slate-500">
                    Sin lineas. Anade desde inventario o manualmente.
                  </td>
                </tr>
              ) : (
                quote.items.map((item) => {
                  const lineCost = itemLineCostTotal(item);
                  const lineProfit = itemLineProfit(item);
                  return (
                  <tr key={item.id} className="hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-medium text-slate-100">{item.name}</td>
                    <td className="max-w-xs px-4 py-3 text-xs text-slate-400">
                      <span className="line-clamp-2">{item.description || "—"}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">{item.itemType}</td>
                    <td className="px-4 py-3">{item.quantity}</td>
                    <td className="px-4 py-3 text-slate-300">{moneyOrDash(item.unitCost)}</td>
                    <td className="px-4 py-3 text-slate-300">{moneyOrDash(lineCost)}</td>
                    <td className="px-4 py-3">{money(item.unitSalePrice)}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-300/95">{money(item.total)}</td>
                    <td
                      className={`px-4 py-3 font-medium ${
                        lineProfit === null
                          ? "text-slate-500"
                          : lineProfit >= 0
                            ? "text-sky-300/95"
                            : "text-rose-300"
                      }`}
                    >
                      {moneyOrDash(lineProfit)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingItem(item)}
                          className="rounded-lg border border-indigo-500/40 bg-indigo-500/10 px-2 py-1 text-xs font-semibold text-indigo-200"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item)}
                          disabled={actionLoading}
                          className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-2 py-1 text-xs font-semibold text-rose-200 disabled:opacity-50"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 space-y-3 md:hidden">
          {quote.items.length === 0 ? (
            <p className="text-center text-sm text-slate-500">Sin lineas.</p>
          ) : (
            quote.items.map((item) => (
              <article
                key={item.id}
                className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 shadow-md shadow-black/20"
              >
                <div className="flex justify-between gap-2">
                  <h3 className="font-semibold text-slate-100">{item.name}</h3>
                  <span className="text-[10px] uppercase text-slate-500">{item.itemType}</span>
                </div>
                {item.description ? (
                  <p className="mt-2 text-xs text-slate-400">{item.description}</p>
                ) : null}
                <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <dt className="text-xs text-slate-500">Cantidad</dt>
                    <dd>{item.quantity}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Coste u.</dt>
                    <dd className="text-slate-300">{moneyOrDash(item.unitCost)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Coste linea</dt>
                    <dd className="text-slate-300">{moneyOrDash(itemLineCostTotal(item))}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">P. venta u.</dt>
                    <dd>{money(item.unitSalePrice)}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-xs text-slate-500">Total venta</dt>
                    <dd className="font-semibold text-emerald-300">{money(item.total)}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-xs text-slate-500">Beneficio</dt>
                    <dd
                      className={`font-medium ${
                        itemLineProfit(item) === null
                          ? "text-slate-500"
                          : (itemLineProfit(item) ?? 0) >= 0
                            ? "text-sky-300"
                            : "text-rose-300"
                      }`}
                    >
                      {moneyOrDash(itemLineProfit(item))}
                    </dd>
                  </div>
                </dl>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingItem(item)}
                    className="flex-1 rounded-lg border border-indigo-500/40 bg-indigo-500/10 py-2 text-xs font-semibold text-indigo-200"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item)}
                    disabled={actionLoading}
                    className="flex-1 rounded-lg border border-rose-500/40 bg-rose-500/10 py-2 text-xs font-semibold text-rose-200 disabled:opacity-50"
                  >
                    Eliminar
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      {editingItem ? (
        <div className="fixed inset-0 z-[120] flex items-end justify-center p-4 sm:items-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/70 backdrop-blur-[1px]"
            aria-label="Cerrar"
            onClick={() => setEditingItem(null)}
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
          >
            <h3 className="text-lg font-semibold text-slate-100">Editar linea</h3>
            <div className="mt-4 grid gap-3">
              <label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
                Nombre
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-indigo-400 focus:ring"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
                Descripcion
                <input
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-indigo-400 focus:ring"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
                  Cantidad
                  <input
                    type="number"
                    min={1}
                    value={editQty}
                    onChange={(e) => setEditQty(Number(e.target.value))}
                    className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-indigo-400 focus:ring"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
                  Coste u. (opc.)
                  <input
                    type="text"
                    inputMode="decimal"
                    value={editCost}
                    onChange={(e) => setEditCost(e.target.value)}
                    className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-indigo-400 focus:ring"
                  />
                </label>
              </div>
              <label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
                Precio venta unitario
                <input
                  type="text"
                  inputMode="decimal"
                  value={editSale}
                  onChange={(e) => setEditSale(e.target.value)}
                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-indigo-400 focus:ring"
                />
              </label>
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => void handleSaveEditItem()}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
