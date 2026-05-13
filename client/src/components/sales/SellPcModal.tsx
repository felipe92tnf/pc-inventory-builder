import type { SaleDetail } from "../../types/sale";
import { RegisterSaleForm } from "./RegisterSaleForm";

type SellPcModalProps = {
  open: boolean;
  onClose: () => void;
  buildId: string;
  suggestedSalePrice: number;
  disabled?: boolean;
  onSuccess: (sale: SaleDetail) => void;
  /** Incrementar al abrir el modal para reiniciar el formulario */
  formResetKey?: number;
};

export function SellPcModal({
  open,
  onClose,
  buildId,
  suggestedSalePrice,
  disabled,
  onSuccess,
  formResetKey = 0
}: SellPcModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar modal"
        className="absolute inset-0 bg-black/75 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sell-pc-modal-title"
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl shadow-black/60"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h2 id="sell-pc-modal-title" className="text-lg font-semibold text-slate-100">
              Vender PC
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Datos del cliente y venta. El precio inicial es el del montaje (editable).
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-600 px-2.5 py-1 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
          >
            Cerrar
          </button>
        </div>

        <div className="mt-4">
          <RegisterSaleForm
            key={`${buildId}-${formResetKey}`}
            variant="plain"
            buildId={buildId}
            suggestedSalePrice={suggestedSalePrice}
            disabled={disabled}
            submitLabel="Confirmar venta"
            onSuccess={onSuccess}
          />
        </div>
      </div>
    </div>
  );
}
