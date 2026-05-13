import type { BuildStatus } from "../types/build";

export function buildStatusLabelEs(status: BuildStatus): string {
  switch (status) {
    case "SOLD":
      return "Vendido";
    case "CONFIRMED":
      return "Listo para la venta";
    case "PENDING_PICKUP":
      return "Pendiente de recogida";
    case "PENDING_PAYMENT":
      return "Pendiente de pago";
    case "RESERVED":
      return "Reservado";
    default:
      return "Borrador";
  }
}
