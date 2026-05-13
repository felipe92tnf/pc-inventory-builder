import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import * as salesApi from "../api/sales";
import * as extraTemplatesApi from "../api/extraTemplates";
import { BuildItemsTable } from "../components/builds/BuildItemsTable";
import { BuildExtraLinesTable } from "../components/builds/BuildExtraLinesTable";
import { PcConfiguratorForm } from "../components/builds/PcConfiguratorForm";
import { SellPcModal } from "../components/sales/SellPcModal";
import { useBuildDetail } from "../hooks/useBuildDetail";
import { isConfiguratorPart } from "../types/part";
import type { BuildStatus, UpdateBuildPayload } from "../types/build";
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
import { PAGE_HERO, PAGE_OUTER_7XL, SECTION_SHELL } from "../theme/layoutDensity";
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

  const [opStatus, setOpStatus] = useState<BuildStatus>("CONFIRMED");
  const [resDeposit, setResDeposit] = useState("");
  const [resRemaining, setResRemaining] = useState("");
  const [payPaid, setPayPaid] = useState("");
  const [payRemaining, setPayRemaining] = useState("");

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
    setResRemaining(build.reservationRemaining != null ? Number(build.reservationRemaining).toFixed(2) : "");
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
      const r = parseMoneyInput(resRemaining);
      if (d === null || r === null) {
        window.alert("Indica reserva cobrada y cantidad restante (numeros validos >= 0).");
        return;
      }
      payload.reservationDeposit = d;
      payload.reservationRemaining = r;
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
      <section className={PAGE_HERO}>
        <div className="flex flex-wrap items-start justify-between gap-2.5">
          <div>
            <h1 className="text-2xl font-bold">{build.name}</h1>
            <p className="mt-1 text-sm text-slate-300">{build.notes || "Sin descripcion."}</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
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
            {showPickupBanner ? (
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleConfirmPickupFromBuild()}
                className="rounded-lg border border-emerald-500/50 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/25 disabled:opacity-50"
              >
                Confirmar recogida
              </button>
            ) : null}
            <StatusBadge variant={buildStatusVariant(build.status)} size="card">
              {buildStatusLabelEs(build.status)}
            </StatusBadge>
            {linkedSale ? (
              <Link
                to={`/sales/${linkedSale.id}`}
                className="text-sm font-semibold text-cyan-300 underline-offset-2 hover:text-cyan-200 hover:underline"
              >
                Ver venta
              </Link>
            ) : build.status === "SOLD" ? (
              <span className="text-xs text-slate-500">Buscando venta...</span>
            ) : null}
          </div>
        </div>
        <Link to="/builds" className="mt-4 inline-flex text-sm font-medium text-indigo-300 hover:text-indigo-200">
          ← Volver a montajes
        </Link>
      </section>

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

      {isAssembledOperational(build.status) && build.status !== "SOLD" ? (
        <section className={SECTION_SHELL}>
          <h2 className="text-lg font-semibold text-slate-100">Estado del montaje</h2>
          <p className="mt-1 text-sm text-slate-400">
            Listo para la venta, pendiente de recogida (ya cobrado), pendiente de pago o reservado con anticipo. Pendiente
            de recogida requiere registrar la venta marcando &quot;Pendiente de recogida&quot; al cobrar.
          </p>
          <div className="mt-4 flex max-w-2xl flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <label className="flex min-w-[14rem] flex-1 flex-col gap-1 text-sm font-medium text-slate-200">
              Situacion
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
                className="min-h-[42px] rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none focus:border-indigo-400 focus:ring"
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
                <label className="flex w-36 flex-col gap-1 text-sm font-medium text-slate-200">
                  Reserva (EUR)
                  <input
                    value={resDeposit}
                    onChange={(e) => setResDeposit(e.target.value)}
                    disabled={actionLoading}
                    inputMode="decimal"
                    className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none focus:border-indigo-400 focus:ring"
                  />
                </label>
                <label className="flex w-36 flex-col gap-1 text-sm font-medium text-slate-200">
                  Restante (EUR)
                  <input
                    value={resRemaining}
                    onChange={(e) => setResRemaining(e.target.value)}
                    disabled={actionLoading}
                    inputMode="decimal"
                    className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none focus:border-indigo-400 focus:ring"
                  />
                </label>
              </>
            ) : null}
            {opStatus === "PENDING_PAYMENT" ? (
              <>
                <label className="flex w-36 flex-col gap-1 text-sm font-medium text-slate-200">
                  Cobrado (EUR)
                  <input
                    value={payPaid}
                    onChange={(e) => setPayPaid(e.target.value)}
                    disabled={actionLoading}
                    inputMode="decimal"
                    className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none focus:border-indigo-400 focus:ring"
                  />
                </label>
                <label className="flex w-36 flex-col gap-1 text-sm font-medium text-slate-200">
                  Pendiente (EUR)
                  <input
                    value={payRemaining}
                    onChange={(e) => setPayRemaining(e.target.value)}
                    disabled={actionLoading}
                    inputMode="decimal"
                    className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none focus:border-indigo-400 focus:ring"
                  />
                </label>
              </>
            ) : null}
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => void handleSaveOperationalStatus()}
              className={SECONDARY_BUTTON_SM}
            >
              Guardar estado
            </button>
          </div>
        </section>
      ) : null}

      <section className={SUMMARY_CARD_GRID_THREE}>
        <article className={SUMMARY_CARD_SHELL}>
          <p className={SUMMARY_CARD_LABEL}>Coste total</p>
          <p className={SUMMARY_VALUE_NEUTRAL}>{money(build.totalCost)}</p>
        </article>
        <article className={SUMMARY_CARD_SHELL_AUTO}>
          <p className={SUMMARY_CARD_LABEL}>Precio venta total</p>
          <input
            type="text"
            inputMode="decimal"
            value={saleDraft}
            onChange={(event) => setSaleDraft(event.target.value)}
            disabled={actionLoading || pricingLocked}
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-xl font-bold text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring disabled:opacity-50"
            aria-label="Precio de venta total"
          />
          <p className="mt-2 text-xs text-slate-500">
            Suma piezas + extras:{" "}
            <span className="font-medium text-slate-400">{money(build.computedSaleTotal)}</span>
          </p>
          {build.saleTotalOverride != null ? (
            <>
              <p className="mt-1 text-xs font-medium text-amber-300/90">Precio personalizado activo</p>
              <p className="mt-1 text-xs text-slate-500">
                El total del campo superior sustituye a la suma de ventas por pieza. Puedes volver al total calculado con
                el boton de abajo.
              </p>
            </>
          ) : (
            <p className="mt-1 text-xs text-slate-500">Usando suma de lineas (componentes + extras)</p>
          )}
          <div className="mt-3 flex flex-col gap-2">
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
              Guardar precio (total manual)
            </button>
            {build.saleTotalOverride != null ? (
              <button
                type="button"
                disabled={actionLoading || pricingLocked}
                onClick={() => {
                  void updateBuildFields({ saleTotalOverride: null });
                }}
                className="w-full rounded-lg border border-emerald-500/45 bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-100 shadow-sm transition hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:self-start"
              >
                Usar suma calculada ({money(build.computedSaleTotal)})
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
        <section className={SECTION_SHELL}>
          <h2 className="text-lg font-semibold text-slate-100">Anadir extra (plantilla)</h2>
          <p className="mt-1 text-sm text-slate-400">
            Conceptos sin stock (Windows, instalacion, etc.). Precios por defecto; puedes ajustarlos en la tabla.
          </p>
          <div className="mt-3 flex max-w-xl flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <label className="flex min-w-[12rem] flex-1 flex-col gap-1 text-xs font-medium text-slate-400">
              Plantilla
              <select
                value={extraTemplateId}
                disabled={actionLoading}
                onChange={(e) => setExtraTemplateId(e.target.value)}
                className="rounded-lg border border-slate-600 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring"
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
            <label className="flex w-24 flex-col gap-1 text-xs font-medium text-slate-400">
              Cantidad
              <input
                type="number"
                min={1}
                value={extraQty}
                disabled={actionLoading}
                onChange={(e) => setExtraQty(Math.max(1, Number(e.target.value) || 1))}
                className="rounded-lg border border-slate-600 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring"
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
              Anadir extra
            </button>
          </div>
        </section>
      ) : null}

      {build.status === "DRAFT" ? (
        <PcConfiguratorForm parts={configuratorParts} disabled={actionLoading} onAddSelected={handleAddConfiguratorParts} />
      ) : null}

      <BuildExtraLinesTable
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

      <BuildItemsTable
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

      <section className={SECTION_SHELL}>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Confirmar montaje</h2>
            <p className="text-sm text-slate-300">
              {pricingLocked
                ? build.status === "PENDING_PICKUP"
                  ? "Cobrado; pendiente de que el cliente recoja el equipo. Confirma la recogida cuando lo entregues."
                  : "Montaje vendido. Para cambiar piezas, elimina primero la venta en la ficha de venta."
                : "Valida stock y descuenta inventario. Despues quedara bloqueado para edicion."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
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
                className="rounded-lg border border-amber-500/50 bg-amber-500/15 px-4 py-2 text-sm font-semibold text-amber-200 transition hover:bg-amber-500/25 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {actionLoading ? "Procesando..." : "Volver a borrador"}
              </button>
            ) : null}
            <button
              type="button"
              disabled={
                build.status !== "DRAFT" ||
                actionLoading ||
                ((build.items?.length ?? 0) === 0 && (build.extraLines?.length ?? 0) === 0)
              }
              onClick={() => {
                void confirm();
              }}
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
        onSuccess={async (sale) => {
          await reload();
          setSellModalOpen(false);
          navigate("/sales", { state: { flash: `Venta registrada (${sale.customerName}).` } });
        }}
      />
    </div>
  );
}
