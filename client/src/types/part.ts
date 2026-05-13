export const PART_CATEGORIES = [
  "CPU",
  "GPU",
  "MOTHERBOARD",
  "RAM",
  "STORAGE",
  "PSU",
  "CASE",
  "COOLER",
  "FAN",
  "NETWORK",
  "MONITOR",
  "PERIPHERAL",
  "OS",
  "LABOR",
  "OTHER"
] as const;

export const PART_CONDITIONS = ["NEW", "USED", "REFURBISHED"] as const;

export type PartCategory = (typeof PART_CATEGORIES)[number];

/** Pieza suelta o PC completo / premontado en inventario. */
export type InventoryKind = "PART" | "PREBUILT_PC";

/** Categorias que no llevan stock (p. ej. licencia de SO); siempre 0 en BD y no se descuenta al vender montaje. */
export const NON_STOCK_PART_CATEGORIES: ReadonlySet<PartCategory> = new Set(["OS", "LABOR"]);

export function isNonStockCategory(category: PartCategory): boolean {
  return NON_STOCK_PART_CATEGORIES.has(category);
}

const CATEGORY_LABELS: Partial<Record<PartCategory, string>> = {
  MONITOR: "Monitor",
  PERIPHERAL: "Periférico",
  OS: "Sistema Operativo",
  LABOR: "Mano de obra"
};

export function partCategoryLabel(category: PartCategory): string {
  return CATEGORY_LABELS[category] ?? category;
}
export type PartCondition = (typeof PART_CONDITIONS)[number];

/** Piezas OS no muestran estado en UI; en BD se guarda siempre este valor. */
export const OS_PART_CONDITION: PartCondition = "NEW";

export type MoneyValue = number | string;

/** Plantilla de catalogo (pieza reutilizable). */
export type PartCatalogEntry = {
  id: string;
  sku: string | null;
  name: string;
  category: PartCategory;
  brand: string;
  model: string;
  defaultCostPrice: MoneyValue;
  defaultSalePrice: MoneyValue;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Part = {
  id: string;
  inventoryKind: InventoryKind;
  name: string;
  /** Solo piezas sueltas; null en PCs premontados. */
  category: PartCategory | null;
  condition: PartCondition;
  costPrice: MoneyValue;
  salePrice: MoneyValue;
  stock: number;
  notes: string | null;
  /** Componentes / especificaciones (PREBUILT_PC). */
  description: string;
  /** Si viene del catalogo de plantillas. */
  catalogPartId?: string | null;
  catalogPart?: {
    id: string;
    sku: string | null;
    name: string;
    brand: string;
    model: string;
    category?: PartCategory;
    defaultCostPrice?: MoneyValue;
    defaultSalePrice?: MoneyValue;
  } | null;
  createdAt: string;
  updatedAt: string;
};

/** Alta de stock a partir de una entrada del catalogo (crea o suma unidades en `Part`). */
export type StockFromCatalogPayload = {
  catalogPartId: string;
  quantity: number;
  actualCostPrice: number;
  salePrice?: number;
  condition: "NEW" | "USED";
  notes?: string | null;
};

export type CreateCatalogPayload = {
  sku?: string | null;
  name: string;
  category: PartCategory;
  brand?: string;
  model?: string;
  defaultCostPrice: number;
  defaultSalePrice: number;
  notes?: string | null;
};

export function isPartPiece(part: Part): boolean {
  return part.inventoryKind === "PART";
}

export function isPrebuiltPc(part: Part): boolean {
  return part.inventoryKind === "PREBUILT_PC";
}

/** Solo PART con categoría (excluye PCs premontados); usable en el configurador de montaje. */
export type ConfiguratorPart = Part & { inventoryKind: "PART"; category: PartCategory };

export function isConfiguratorPart(part: Part): part is ConfiguratorPart {
  return part.inventoryKind === "PART" && part.category != null;
}

export type PartFormValues = {
  inventoryKind: InventoryKind;
  name: string;
  category: PartCategory;
  condition: PartCondition;
  costPrice: number;
  salePrice: number;
  manualSalePrice: boolean;
  stock: number;
  notes: string;
  /** Texto largo para PCs premontados. */
  description: string;
};

export type PartPayload =
  | {
      inventoryKind: "PART";
      name: string;
      category: PartCategory;
      condition: PartCondition;
      costPrice: number;
      salePrice?: number;
      stock: number;
      notes?: string | null;
      description?: string;
    }
  | {
      inventoryKind: "PREBUILT_PC";
      name: string;
      condition: PartCondition;
      costPrice: number;
      salePrice?: number;
      stock: number;
      notes?: string | null;
      description: string;
    };
