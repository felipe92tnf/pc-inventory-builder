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
import type { BuildStatus, ConfirmBuildPayload, UpdateBuildPayload } from "../types/build";
import type { SaleListRow } from "../types/sale";
import {
  PRIMARY_ACTION_BUTTON,
  PRIMARY_ACTION_BUTTON_COMPACT,
  SECONDARY_BUTTON_SM
} from "../theme/actionButtons";
import {
  SUMMARY_CARD_GRID_THREE,
  SUMMARY_CARD_LABEL,
  SUMMARY_CARD_SHELL,
  SUMMARY_CARD_SHELL_AUTO,
  SUMMARY_VALUE_NEGATIVE,
  SUMMARY_VALUE_NEUTRAL,
  SUMMARY_VALUE_PROFIT_POS
} from "../theme/summaryCards";
import { PAGE_HEADER_COMPACT, PAGE_OUTER_7XL, SECTION_SHELL } from "../theme/layoutDensity";
import { StatusBadge, buildStatusVariant } from "../components/ui/StatusBadge";
import type { ExtraTemplate } from "../types/extraTemplate";
import { buildStatusLabelEs } from "../utils/buildStatusLabel";

function money(value: number): string {
  return `${value.toFixed(2)} EUR`;
}

const OPERATIONAL_STATUS_OPTIONS: { value: BuildStatus; label: string }[] = [
  { value: "CONFIRMED", label: "Listo para la venta" },
  { value: "PENDING_PICKUP", label: "Pendiente de recogida" },
  { value: "PENDING_PAYMENT", label: "Pendiente de pago" },
  { value: "RESERVED", label: "Reservado" }
];

/** Estados admitidos al confirmar desde borrador (sin venta / sin recogida). */
const CONFIRM_INITIAL_STATUS_OPTIONS: { value: BuildStatus; label: string }[] = [
  { value: "CONFIRMED", label: "Listo para la venta" },
  { value: "RESERVED", label: "Reservado" },
  { value: "PENDING_PAYMENT", label: "Pendiente de pago" }
];

function isAssembledOperational(status: BuildStatus): boolean {
  return (
    status === "CONFIRMED" ||
    status === "PENDING_PICKUP" ||
    status === "PENDING_PAYMENT" ||
    status === "RESERVED"
  );
}

function parseMoneyInput(raw: string): number | null {
  const n = Number(raw.replace(",", ".").trim());
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100) / 100;
}

function slugForPdfFilename(name: string): string {
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

function roundMoney2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Restante de reserva = precio de venta total − reserva cobrada (no negativo). */
function reservationRemainingFromTotalAndDeposit(totalSale: number, deposit: number): number {
  return roundMoney2(Math.max(0, totalSale - deposit));
}

export function BuildDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const buildId = String(id ?? "");
  const {
    build,
    parts,
    loading,
    actionLoading,
    error,
    addItem,
    updateBuildItemLine,
    removeItem,
    confirm,
    revertToDraft,
    updateBuildFields,
    reload,
    addExtraLine,
    updateExtraLine,
    removeExtraLine
  } = useBuildDetail(buildId);

  const [linkedSale, setLinkedSale] = useState<SaleListRow | null>(null);

  const configuratorParts = useMemo(() => parts.filter(isConfiguratorPart), [parts]);

  /** Precio venta mostrado (override manual o total calculado). */
  const totalSaleShown = useMemo(() => {
    if (!build) return 0;
    const shown =
      build.saleTotalOverride != null
        ? Number(build.totalSale)
        : Number(build.computedSaleTotal ?? build.totalSale);
    return Number.isFinite(shown) ? Math.max(0, shown) : 0;
  }, [build, build?.totalSale, build?.saleTotalOverride, build?.computedSaleTotal]);

  const sellSuggestedPrice = useMemo(() => {
    if (!build) return 0;
    if (build.status === "RESERVED" && build.reservationRemaining != null) {
      return Number(build.reservationRemaining);
    }
    if (build.status === "PENDING_PAYMENT" && build.pendingPaymentRemaining != null) {
      return Number(build.pendingPaymentRemaining);
    }
    return Number(build.totalSale);
  }, [build]);

  const pricingLocked = build?.status === "SOLD" || build?.status === "PENDING_PICKUP";

  const canOpenSellModal =
    build &&
    ["CONFIRMED", "PENDING_PAYMENT", "RESERVED"].includes(build.status) &&
    !linkedSale;
  const showPickupBanner =
    build?.status === "PENDING_PICKUP" && linkedSale && linkedSale.pickupConfirmedAt == null;

  const [saleDraft, setSaleDraft] = useState("");
  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [extraTemplates, setExtraTemplates] = useState<ExtraTemplate[]>([]);
  const [extraTemplateId, setExtraTemplateId] = useState("");
  const [extraQty, setExtraQty] = useState(1);

  useEffect(() => {
    let cancelled = false;
    void extraTemplatesApi.listExtraTemplates(true).then((rows) => {
      if (!cancelled) setExtraTemplates(rows);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  const [sellFormKey, setSellFormKey] = useState(0);
  const [flashMessage, setFlashMessage] = useState<string | null>(null);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const mountSyncedBuildIdRef = useRef<string | null>(null);
  const [mountForm, setMountForm] = useState({
    name: "",
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    notes: "",
    initialStatus: "CONFIRMED" as BuildStatus,
    confirmResDeposit: "",
    confirmPayPaid: "",
    confirmPayRemaining: ""
  });
  const [mountDataSaved, setMountDataSaved] = useState(false);

  const headerClientLine = useMemo(() => {
    if (!build) return null;
    if (build.status === "DRAFT") {
      const a = mountForm.customerName.trim();
      const b = mountForm.customerPhone.trim();
      if (!a && !b) return null;
      return [a, b].filter(Boolean).join(" · ");
    }
    const a = (build.customerName ?? "").trim();
    const b = (build.customerPhone ?? "").trim();
    if (!a && !b) return null;
    return [a, b].filter(Boolean).join(" · ");
  }, [build, mountForm.customerName, mountForm.customerPhone]);

  const [opStatus, setOpStatus] = useState<BuildStatus>("CONFIRMED");
  const [resDeposit, setResDeposit] = useState("");
  const [payPaid, setPayPaid] = useState("");
  const [payRemaining, setPayRemaining] = useState("");

  /** Restante calculado al editar reserva (estado operativo Reservado). */
  const derivedReservationRemaining = useMemo(() => {
    const d = parseMoneyInput(resDeposit);
    if (d === null) return null;
    return reservationRemainingFromTotalAndDeposit(totalSaleShown, d);
  }, [resDeposit, totalSaleShown]);

  /** Restante al confirmar borrador como Reservado. */
  const draftDerivedReservationRemaining = useMemo(() => {
    const d = parseMoneyInput(mountForm.confirmResDeposit);
    if (d === null) return null;
    return reservationRemainingFromTotalAndDeposit(totalSaleShown, d);
  }, [mountForm.confirmResDeposit, totalSaleShown]);

  useEffect(() => {
    if (!build) return;
    const shown =
      build.saleTotalOverride != null
        ? Number(build.totalSale)
        : Number(build.computedSaleTotal ?? build.totalSale);
    if (Number.isFinite(shown)) {
      setSaleDraft(shown.toFixed(2));
    }
  }, [build?.id, build?.totalSale, build?.saleTotalOverride, build?.computedSaleTotal]);

  useEffect(() => {
    if (!build) return;
    if (isAssembledOperational(build.status)) {
      setOpStatus(build.status);
    }
    setResDeposit(build.reservationDeposit != null ? Number(build.reservationDeposit).toFixed(2) : "");
    setPayPaid(build.pendingPaymentPaid != null ? Number(build.pendingPaymentPaid).toFixed(2) : "");
    setPayRemaining(
      build.pendingPaymentRemaining != null ? Number(build.pendingPaymentRemaining).toFixed(2) : ""
    );
  }, [build]);

  useEffect(() => {
    if (!build?.id) return;
    let cancelled = false;
    void salesApi.listSales().then((rows) => {
      const hit = rows.find((s) => s.buildId === build.id);
      if (!cancelled) setLinkedSale(hit ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [build?.id]);

  useEffect(() => {
    const msg = (location.state as { flash?: string } | null)?.flash;
    if (!msg) return;
    setFlashMessage(msg);
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    if (!build) return;
    if (mountSyncedBuildIdRef.current === build.id) return;
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
    if (loading || !build) return;
    if (!["CONFIRMED", "PENDING_PAYMENT", "RESERVED"].includes(build.status)) return;
    if (location.hash !== "#registrar-venta") return;
    setSellFormKey((k) => k + 1);
    setSellModalOpen(true);
    navigate({ pathname: location.pathname, search: location.search, hash: "" }, { replace: true });
  }, [loading, build?.status, build?.id, location.hash, location.pathname, location.search, navigate]);

  const handleAddConfiguratorParts = async (
    items: { partId: string; quantity: number; unitSalePrice?: number }[]
  ) => {
    for (const payload of items) {
      if (payload.quantity < 1) continue;
      await addItem({
        partId: payload.partId,
        quantity: payload.quantity,
        ...(payload.unitSalePrice !== undefined ? { unitSalePrice: payload.unitSalePrice } : {})
      });
    }
  };

  const handleSaveOperationalStatus = () => {
    if (!build) return;
    if (opStatus === "PENDING_PICKUP" && !linkedSale) {
      window.alert("Primero registra la venta con la casilla Cobrado pendiente de recogida activada.");
      return;
    }
    const payload: UpdateBuildPayload = { status: opStatus };
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
    } else if (opStatus === "PENDING_PAYMENT") {
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
    if (!linkedSale) return;
    void (async () => {
      try {
        await salesApi.patchSale(linkedSale.id, { pickupConfirmedAt: new Date().toISOString() });
        await reload();
      } catch (err) {
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
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "No se pudieron guardar los datos.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleConfirmMontaje = async () => {
    if (!build) return;
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

    const patch: UpdateBuildPayload = {
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
    } else {
      patch.saleTotalOverride = roundedSale;
    }

    const confirmPayload: ConfirmBuildPayload = { initialStatus: mountForm.initialStatus };
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
    } else if (mountForm.initialStatus === "PENDING_PAYMENT") {
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
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "No se pudo confirmar el montaje.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleDownloadBuildPdf = useCallback(async () => {
    if (!build) return;
    setPdfGenerating(true);
    setPdfError(null);
    try {
      const [{ pdf }, { BuildPdfDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("../components/builds/BuildPdfDocument")
      ]);
      const blob = await pdf(<BuildPdfDocument build={build} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `montaje-${slugForPdfFilename(build.name)}.pdf`;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : "No se pudo generar el PDF.");
    } finally {
      setPdfGenerating(false);
    }
  }, [build]);

  if (!id) {
    return (
      <section className="rounded-2xl border border-rose-800/70 bg-rose-950/40 p-6 text-rose-200">
        ID de montaje invalido.
      </section>
    );
  }

  if (loading) {
    return (
      <section className={SECTION_SHELL}>
        <p className="text-sm text-slate-300">Cargando detalle del montaje...</p>
      </section>
    );
  }

  if (!build) {
    return (
      <section className={SECTION_SHELL}>
        <p className="text-sm text-slate-300">No se encontro el montaje solicitado.</p>
      </section>
    );
  }

  return (
    <div className={PAGE_OUTER_7XL}>
      {flashMessage ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/40 bg-emerald-950/50 px-4 py-3 text-sm text-emerald-100">
          <span>{flashMessage}</span>
          <button
            type="button"
            onClick={() => setFlashMessage(null)}
            className="rounded-lg border border-emerald-600/50 px-3 py-1 text-xs font-semibold text-emerald-200 hover:bg-emerald-900/40"
          >
            Cerrar
          </button>
        </div>
      ) : null}
      {pdfError ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-800/70 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">
          <span>{pdfError}</span>
          <button
            type="button"
            onClick={() => setPdfError(null)}
            className="rounded-lg border border-rose-700 bg-rose-900/50 px-3 py-1 text-xs font-semibold text-rose-100 hover:bg-rose-800/70"
          >
            Cerrar
          </button>
        </div>
      ) : null}
      <header className={PAGE_HEADER_COMPACT}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="min-w-0 max-w-full truncate text-lg font-bold tracking-tight text-slate-50 sm:text-xl">
                {build.status === "DRAFT" ? mountForm.name.trim() || "Montaje en borrador" : build.name}
              </h1>
              <StatusBadge variant={buildStatusVariant(build.status)} size="card">
                {buildStatusLabelEs(build.status)}
              </StatusBadge>
            </div>
            {headerClientLine ? (
              <p className="truncate text-sm text-slate-400">{headerClientLine}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2 lg:shrink-0 lg:justify-end">
            {showPickupBanner ? (
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleConfirmPickupFromBuild()}
                className="rounded-lg border border-emerald-500/50 bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-500/25 disabled:opacity-50 sm:text-sm"
              >
                Confirmar recogida
              </button>
            ) : null}
            {linkedSale ? (
              <Link
                to={`/sales/${linkedSale.id}`}
                className="text-xs font-semibold text-cyan-300 underline-offset-2 hover:text-cyan-200 hover:underline sm:text-sm"
              >
                Ver venta
              </Link>
            ) : build.status === "SOLD" ? (
              <span className="text-xs text-slate-500">Buscando venta…</span>
            ) : null}
            <button
              type="button"
              disabled={pdfGenerating || actionLoading}
              onClick={() => void handleDownloadBuildPdf()}
              className={SECONDARY_BUTTON_SM}
            >
              {pdfGenerating ? "PDF…" : "Descargar PDF"}
            </button>
            {canOpenSellModal ? (
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => {
                  setSellFormKey((k) => k + 1);
                  setSellModalOpen(true);
                }}
                className={PRIMARY_ACTION_BUTTON_COMPACT}
              >
                Vender PC
              </button>
            ) : null}
            <Link to="/builds" className={`${SECONDARY_BUTTON_SM} inline-flex items-center justify-center`}>
              ← Montajes
            </Link>
          </div>
        </div>
      </header>

      {error ? (
        <div className="flex flex-col gap-3 rounded-xl border border-rose-800/70 bg-rose-950/40 px-4 py-3 text-sm text-rose-200 md:flex-row md:items-center md:justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => {
              void reload();
            }}
            className="rounded-lg border border-rose-700 bg-rose-900/50 px-3 py-1.5 font-semibold text-rose-100 transition hover:bg-rose-800/70"
          >
            Reintentar
          </button>
        </div>
      ) : null}

      <section className={SUMMARY_CARD_GRID_THREE}>
        <article className={SUMMARY_CARD_SHELL}>
          <p className={SUMMARY_CARD_LABEL}>Coste total</p>
          <p className={SUMMARY_VALUE_NEUTRAL}>{money(build.totalCost)}</p>
        </article>
        <article className={SUMMARY_CARD_SHELL_AUTO}>
          <p className={SUMMARY_CARD_LABEL}>Precio venta</p>
          <input
            type="text"
            inputMode="decimal"
            value={saleDraft}
            onChange={(event) => setSaleDraft(event.target.value)}
            disabled={actionLoading || pricingLocked}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-xl font-bold tabular-nums text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring disabled:opacity-50 sm:text-2xl"
            aria-label="Precio de venta total"
            title={`Calculado por líneas: ${money(build.computedSaleTotal)}`}
          />
          {build.saleTotalOverride != null ? (
            <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300/90">Total manual</p>
          ) : null}
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={actionLoading || pricingLocked}
              onClick={() => {
                const normalized = Number(saleDraft.replace(",", ".").trim());
                if (!Number.isFinite(normalized) || normalized < 0) {
                  window.alert("Introduce un precio de venta valido (mayor o igual que 0).");
                  return;
                }
                const rounded = Math.round(normalized * 100) / 100;
                void updateBuildFields({ saleTotalOverride: rounded });
              }}
              className={SECONDARY_BUTTON_SM}
            >
              Guardar precio
            </button>
            {build.saleTotalOverride != null ? (
              <button
                type="button"
                disabled={actionLoading || pricingLocked}
                onClick={() => {
                  void updateBuildFields({ saleTotalOverride: null });
                }}
                className="rounded-lg border border-emerald-500/45 bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Usar calculado ({money(build.computedSaleTotal)})
              </button>
            ) : null}
          </div>
        </article>
        <article className={SUMMARY_CARD_SHELL}>
          <p className={SUMMARY_CARD_LABEL}>Beneficio estimado</p>
          <p className={build.profit >= 0 ? SUMMARY_VALUE_PROFIT_POS : SUMMARY_VALUE_NEGATIVE}>
            {money(build.profit)}
          </p>
        </article>
      </section>

      {build.status === "DRAFT" ? (
        <section className={`${SECTION_SHELL} !py-3`} aria-label="Estado al confirmar">
          <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
            <label className="flex min-w-[12rem] flex-1 flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Estado al confirmar
              <select
                value={mountForm.initialStatus}
                onChange={(e) => {
                  const next = e.target.value as BuildStatus;
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
                }}
                disabled={actionLoading}
                className="min-h-[40px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm font-medium text-slate-100 outline-none focus:border-indigo-400 focus:ring"
              >
                {CONFIRM_INITIAL_STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            {mountForm.initialStatus === "RESERVED" ? (
              <>
                <label className="flex w-full min-w-[8rem] max-w-[11rem] flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Reserva cobrada
                  <input
                    value={mountForm.confirmResDeposit}
                    onChange={(e) => setMountForm((m) => ({ ...m, confirmResDeposit: e.target.value }))}
                    disabled={actionLoading}
                    inputMode="decimal"
                    className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm font-semibold tabular-nums text-slate-100 outline-none focus:border-indigo-400 focus:ring"
                  />
                </label>
                <div className="flex min-w-[7rem] flex-col gap-0.5 rounded-lg border border-slate-700/80 bg-slate-900/60 px-3 py-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Restante</span>
                  <span className="text-base font-bold tabular-nums text-slate-100">
                    {draftDerivedReservationRemaining === null ? "—" : money(draftDerivedReservationRemaining)}
                  </span>
                </div>
              </>
            ) : null}
            {mountForm.initialStatus === "PENDING_PAYMENT" ? (
              <>
                <label className="flex w-full min-w-[8rem] max-w-[11rem] flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Ya cobrado
                  <input
                    value={mountForm.confirmPayPaid}
                    onChange={(e) => setMountForm((m) => ({ ...m, confirmPayPaid: e.target.value }))}
                    disabled={actionLoading}
                    inputMode="decimal"
                    className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm font-semibold tabular-nums text-slate-100 outline-none focus:border-indigo-400 focus:ring"
                  />
                </label>
                <label className="flex w-full min-w-[8rem] max-w-[11rem] flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Pendiente
                  <input
                    value={mountForm.confirmPayRemaining}
                    onChange={(e) => setMountForm((m) => ({ ...m, confirmPayRemaining: e.target.value }))}
                    disabled={actionLoading}
                    inputMode="decimal"
                    className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm font-semibold tabular-nums text-slate-100 outline-none focus:border-indigo-400 focus:ring"
                  />
                </label>
              </>
            ) : null}
          </div>
        </section>
      ) : null}

      {isAssembledOperational(build.status) && build.status !== "SOLD" ? (
        <section
          className={`${SECTION_SHELL} !py-3`}
          aria-label="Estado y cobro"
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
            <label className="flex min-w-[10rem] flex-1 flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Estado
              <select
                value={opStatus}
                onChange={(e) => {
                  const next = e.target.value as BuildStatus;
                  if (next === "PENDING_PAYMENT" && build) {
                    setPayPaid("0.00");
                    setPayRemaining(totalSaleShown > 0 ? totalSaleShown.toFixed(2) : "0.00");
                  }
                  setOpStatus(next);
                }}
                disabled={actionLoading}
                className="min-h-[40px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm font-medium text-slate-100 outline-none focus:border-indigo-400 focus:ring"
              >
                {OPERATIONAL_STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            {opStatus === "RESERVED" ? (
              <>
                <label className="flex w-full min-w-[8rem] max-w-[11rem] flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Reserva cobrada
                  <input
                    value={resDeposit}
                    onChange={(e) => setResDeposit(e.target.value)}
                    disabled={actionLoading}
                    inputMode="decimal"
                    className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm font-semibold tabular-nums text-slate-100 outline-none focus:border-indigo-400 focus:ring"
                  />
                </label>
                <div className="flex min-w-[7rem] flex-col gap-0.5 rounded-lg border border-slate-700/80 bg-slate-900/60 px-3 py-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Restante</span>
                  <span className="text-base font-bold tabular-nums text-slate-100">
                    {derivedReservationRemaining === null ? "—" : money(derivedReservationRemaining)}
                  </span>
                </div>
              </>
            ) : null}
            {opStatus === "PENDING_PAYMENT" ? (
              <>
                <label className="flex w-full min-w-[8rem] max-w-[11rem] flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Cobrado
                  <input
                    value={payPaid}
                    onChange={(e) => setPayPaid(e.target.value)}
                    disabled={actionLoading}
                    inputMode="decimal"
                    className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm font-semibold tabular-nums text-slate-100 outline-none focus:border-indigo-400 focus:ring"
                  />
                </label>
                <label className="flex w-full min-w-[8rem] max-w-[11rem] flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Pendiente
                  <input
                    value={payRemaining}
                    onChange={(e) => setPayRemaining(e.target.value)}
                    disabled={actionLoading}
                    inputMode="decimal"
                    className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm font-semibold tabular-nums text-slate-100 outline-none focus:border-indigo-400 focus:ring"
                  />
                </label>
              </>
            ) : null}
          </div>
        </section>
      ) : null}

      {build.status === "DRAFT" ? (
        <section className={SECTION_SHELL}>
          {mountDataSaved ? (
            <p className="mb-3 text-xs font-medium text-emerald-300/90">Guardado.</p>
          ) : null}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 md:col-span-2">
              Nombre del montaje
              <input
                value={mountForm.name}
                onChange={(e) => setMountForm((m) => ({ ...m, name: e.target.value }))}
                disabled={actionLoading}
                className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring"
                placeholder="Ej: PC Oficina Garcia"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Cliente
              <input
                value={mountForm.customerName}
                onChange={(e) => setMountForm((m) => ({ ...m, customerName: e.target.value }))}
                disabled={actionLoading}
                className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring"
                placeholder="Nombre y apellidos"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Telefono
              <input
                value={mountForm.customerPhone}
                onChange={(e) => setMountForm((m) => ({ ...m, customerPhone: e.target.value }))}
                disabled={actionLoading}
                inputMode="tel"
                className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring"
                placeholder="600 000 000"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 md:col-span-2">
              Email (opcional)
              <input
                type="email"
                value={mountForm.customerEmail}
                onChange={(e) => setMountForm((m) => ({ ...m, customerEmail: e.target.value }))}
                disabled={actionLoading}
                className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring"
                placeholder="cliente@correo.es"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 md:col-span-2">
              Notas
              <textarea
                value={mountForm.notes}
                onChange={(e) => setMountForm((m) => ({ ...m, notes: e.target.value }))}
                disabled={actionLoading}
                rows={2}
                className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring"
                placeholder="Preferencias, plazo…"
              />
            </label>
          </div>
        </section>
      ) : null}

      {build.status === "DRAFT" ? (
        <section className={`${SECTION_SHELL} !py-3`}>
          <div className="flex max-w-3xl flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <label className="flex min-w-[12rem] flex-1 flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Extra
              <select
                value={extraTemplateId}
                disabled={actionLoading}
                onChange={(e) => setExtraTemplateId(e.target.value)}
                className="rounded-lg border border-slate-600 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring"
              >
                <option value="">Elegir…</option>
                {extraTemplates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                    {t.category?.trim() ? ` (${t.category})` : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex w-20 flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Uds.
              <input
                type="number"
                min={1}
                value={extraQty}
                disabled={actionLoading}
                onChange={(e) => setExtraQty(Math.max(1, Number(e.target.value) || 1))}
                className="rounded-lg border border-slate-600 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring"
              />
            </label>
            <button
              type="button"
              disabled={actionLoading || !extraTemplateId}
              onClick={() => {
                void addExtraLine({ extraTemplateId, quantity: extraQty });
              }}
              className={SECONDARY_BUTTON_SM}
            >
              Añadir
            </button>
          </div>
        </section>
      ) : null}

      {build.status === "DRAFT" ? (
        <PcConfiguratorForm
          parts={configuratorParts}
          disabled={actionLoading}
          onAddSelected={handleAddConfiguratorParts}
          heading="Añadir piezas"
          lead=""
          compact
        />
      ) : null}

      <div className="space-y-2">
        <h2 className="text-base font-semibold tracking-tight text-slate-100 sm:text-lg">Componentes</h2>
        <BuildItemsTable
          prominent
          items={build.items}
          status={build.status}
          actionLoading={actionLoading}
          onRemove={async (itemId) => {
            await removeItem(itemId);
          }}
          onUpdateLineSale={
            build.status === "DRAFT"
              ? async (itemId, unitSalePrice) => {
                  await updateBuildItemLine(itemId, { unitSalePrice });
                }
              : undefined
          }
        />
      </div>

      <BuildExtraLinesTable
        compactHeader
        lines={build.extraLines ?? []}
        status={build.status}
        actionLoading={actionLoading}
        onRemove={async (lineId) => {
          await removeExtraLine(lineId);
        }}
        onUpdateLine={
          build.status === "DRAFT"
            ? async (lineId, unitSalePrice, unitCost) => {
                await updateExtraLine(lineId, {
                  unitSalePrice,
                  ...(unitCost !== undefined ? { unitCost } : {})
                });
              }
            : undefined
        }
      />

      <section className="rounded-xl border border-slate-800/90 bg-slate-950/40 px-3 py-3 sm:px-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {build.status === "DRAFT" ? (
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => void handleSaveMountData()}
                className={SECONDARY_BUTTON_SM}
              >
                Guardar cambios
              </button>
            ) : null}
            {isAssembledOperational(build.status) && build.status !== "SOLD" ? (
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => void handleSaveOperationalStatus()}
                className={SECONDARY_BUTTON_SM}
              >
                Guardar estado
              </button>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            {isAssembledOperational(build.status) && !linkedSale ? (
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => {
                  const ok = window.confirm(
                    "Volver este montaje a borrador? El stock descontado al confirmar se devolvera al inventario y podras cambiar componentes."
                  );
                  if (!ok) return;
                  void revertToDraft();
                }}
                className="rounded-lg border border-amber-500/50 bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-200 transition hover:bg-amber-500/25 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
              >
                {actionLoading ? "…" : "Volver a borrador"}
              </button>
            ) : null}
            <button
              type="button"
              disabled={
                build.status !== "DRAFT" ||
                actionLoading ||
                ((build.items?.length ?? 0) === 0 && (build.extraLines?.length ?? 0) === 0)
              }
              onClick={() => void handleConfirmMontaje()}
              className={PRIMARY_ACTION_BUTTON}
            >
              {build.status === "SOLD" || build.status === "PENDING_PICKUP"
                ? build.status === "PENDING_PICKUP"
                  ? "Pendiente de recogida"
                  : "Vendido"
                : isAssembledOperational(build.status)
                  ? "Montaje confirmado"
                  : actionLoading
                    ? "Confirmando..."
                    : "Confirmar montaje"}
            </button>
          </div>
        </div>
      </section>

      <SellPcModal
        open={sellModalOpen}
        onClose={() => setSellModalOpen(false)}
        buildId={build.id}
        suggestedSalePrice={sellSuggestedPrice}
        offerPendingPickup
        disabled={actionLoading}
        formResetKey={sellFormKey}
        defaultCustomer={{
          customerName: build.customerName,
          customerPhone: build.customerPhone,
          customerEmail: build.customerEmail
        }}
        onSuccess={async (sale) => {
          await reload();
          setSellModalOpen(false);
          navigate("/sales", { state: { flash: `Venta registrada (${sale.customerName}).` } });
        }}
      />
    </div>
  );
}
