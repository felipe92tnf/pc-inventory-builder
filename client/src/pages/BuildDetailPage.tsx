import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import * as salesApi from "../api/sales";
import { BuildItemsTable } from "../components/builds/BuildItemsTable";
import { PcConfiguratorForm } from "../components/builds/PcConfiguratorForm";
import { SellPcModal } from "../components/sales/SellPcModal";
import { useBuildDetail } from "../hooks/useBuildDetail";
import { isConfiguratorPart } from "../types/part";
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

function money(value: number): string {
  return `${value.toFixed(2)} EUR`;
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
    reload
  } = useBuildDetail(buildId);

  const configuratorParts = useMemo(() => parts.filter(isConfiguratorPart), [parts]);

  const [saleDraft, setSaleDraft] = useState("");
  const [linkedSaleId, setLinkedSaleId] = useState<string | null>(null);
  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [sellFormKey, setSellFormKey] = useState(0);
  const [flashMessage, setFlashMessage] = useState<string | null>(null);

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
    if (build?.status !== "SOLD") {
      setLinkedSaleId(null);
      return;
    }
    let cancelled = false;
    void salesApi.listSales().then((rows) => {
      const hit = rows.find((s) => s.buildId === build?.id);
      if (!cancelled && hit) {
        setLinkedSaleId(hit.id);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [build?.id, build?.status]);

  useEffect(() => {
    const msg = (location.state as { flash?: string } | null)?.flash;
    if (!msg) return;
    setFlashMessage(msg);
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    if (loading || build?.status !== "CONFIRMED") return;
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
            {build.status === "CONFIRMED" ? (
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
            <StatusBadge variant={buildStatusVariant(build.status)} size="card">
              {build.status === "SOLD" ? "Vendido" : build.status === "CONFIRMED" ? "Assembled" : "Draft"}
            </StatusBadge>
            {build.status === "SOLD" ? (
              linkedSaleId ? (
                <Link
                  to={`/sales/${linkedSaleId}`}
                  className="text-sm font-semibold text-cyan-300 underline-offset-2 hover:text-cyan-200 hover:underline"
                >
                  Ver venta
                </Link>
              ) : (
                <span className="text-xs text-slate-500">Buscando venta...</span>
              )
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
            disabled={actionLoading || build.status === "SOLD"}
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-xl font-bold text-slate-100 outline-none ring-indigo-400/60 focus:border-indigo-400 focus:ring disabled:opacity-50"
            aria-label="Precio de venta total"
          />
          <p className="mt-2 text-xs text-slate-500">
            Calculado por piezas:{" "}
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
            <p className="mt-1 text-xs text-slate-500">Usando suma de ventas de las piezas</p>
          )}
          <div className="mt-3 flex flex-col gap-2">
            <button
              type="button"
              disabled={actionLoading || build.status === "SOLD"}
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
                disabled={actionLoading || build.status === "SOLD"}
                onClick={() => {
                  void updateBuildFields({ saleTotalOverride: null });
                }}
                className="w-full rounded-lg border border-emerald-500/45 bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-100 shadow-sm transition hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:self-start"
              >
                Usar suma de piezas ({money(build.computedSaleTotal)})
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
        <PcConfiguratorForm parts={configuratorParts} disabled={actionLoading} onAddSelected={handleAddConfiguratorParts} />
      ) : null}

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
              {build.status === "SOLD"
                ? "Montaje vendido. Para cambiar piezas, elimina primero la venta en la ficha de venta."
                : "Valida stock y descuenta inventario. Despues quedara bloqueado para edicion."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {build.status === "CONFIRMED" ? (
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
              disabled={build.status !== "DRAFT" || actionLoading}
              onClick={() => {
                void confirm();
              }}
              className={PRIMARY_ACTION_BUTTON}
            >
              {build.status === "SOLD"
                ? "Vendido"
                : build.status === "CONFIRMED"
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
        suggestedSalePrice={build.totalSale}
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
