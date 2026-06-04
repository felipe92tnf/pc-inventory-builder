-- Cobro previo (reserva / anticipo) al registrar la venta; no reduce finalSalePrice.
ALTER TABLE "Sale" ADD COLUMN "amountPaidAtSale" DECIMAL(12,2);
