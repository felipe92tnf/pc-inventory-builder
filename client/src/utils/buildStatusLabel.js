export function buildStatusLabelEs(status) {
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
