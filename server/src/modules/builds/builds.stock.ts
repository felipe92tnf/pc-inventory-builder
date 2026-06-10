import { BuildStatus, InventoryKind, PartCategory } from "@prisma/client";

/** Estados en los que las piezas del montaje siguen comprometidas (stock ya descontado al confirmar). */
export const BUILD_STOCK_COMMITTED_STATUSES: BuildStatus[] = [
  BuildStatus.CONFIRMED,
  BuildStatus.RESERVED,
  BuildStatus.PENDING_PAYMENT,
  BuildStatus.PENDING_PICKUP,
  BuildStatus.SOLD
];

export function categorySkipsStock(category: PartCategory): boolean {
  return category === PartCategory.OS || category === PartCategory.LABOR;
}

/** OS/LABOR no descuentan stock; PCs premontados si (unidades fisicas). */
export function partSkipsStockDeduction(part: {
  category: PartCategory | null;
  inventoryKind: InventoryKind;
}): boolean {
  if (part.inventoryKind === InventoryKind.PREBUILT_PC) return false;
  if (part.category === null) return false;
  return categorySkipsStock(part.category);
}

/** Montaje creado desde una unidad de PC completo en inventario (1 linea PREBUILT_PC). */
export function isPrebuiltInventoryBuild(build: {
  items: { part: { inventoryKind: InventoryKind } }[];
}): boolean {
  return (
    build.items.length === 1 && build.items[0]?.part.inventoryKind === InventoryKind.PREBUILT_PC
  );
}
