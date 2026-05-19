/** Categoría en ExtraTemplate para catálogo de servicios (sin stock físico). */
export const SERVICE_CATALOG_CATEGORY = "SERVICE";

export type ServiceCatalogDefaultItem = {
  name: string;
  description: string;
  defaultSalePrice: number;
  defaultCostPrice: number;
};

/** Precios base sugeridos para el catálogo de servicios. */
export const DEFAULT_SERVICE_CATALOG_ITEMS: ServiceCatalogDefaultItem[] = [
  { name: "Formateo", description: "", defaultSalePrice: 10, defaultCostPrice: 0 },
  { name: "Instalación S.O", description: "", defaultSalePrice: 20, defaultCostPrice: 0 },
  { name: "Mantenimiento PC", description: "", defaultSalePrice: 30, defaultCostPrice: 0 },
  { name: "Limpieza interna", description: "", defaultSalePrice: 25, defaultCostPrice: 0 },
  { name: "Instalación drivers", description: "", defaultSalePrice: 15, defaultCostPrice: 0 },
  { name: "Optimización sistema", description: "", defaultSalePrice: 20, defaultCostPrice: 0 },
  { name: "Backup básico", description: "", defaultSalePrice: 15, defaultCostPrice: 0 },
  { name: "Servicio a domicilio", description: "", defaultSalePrice: 20, defaultCostPrice: 0 }
];

export function isServiceCatalogCategory(category: string | null | undefined): boolean {
  return (category ?? "").trim().toUpperCase() === SERVICE_CATALOG_CATEGORY;
}
