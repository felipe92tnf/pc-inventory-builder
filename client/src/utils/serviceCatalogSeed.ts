import * as extraTemplatesApi from "../api/extraTemplates";
import {
  DEFAULT_SERVICE_CATALOG_ITEMS,
  SERVICE_CATALOG_CATEGORY,
  isServiceCatalogCategory
} from "../constants/serviceCatalog";

/** Crea entradas sugeridas que aún no existan (por nombre, sin duplicar). */
export async function seedDefaultServiceCatalog(): Promise<number> {
  const all = await extraTemplatesApi.listExtraTemplates(false);
  const existing = all.filter((t) => isServiceCatalogCategory(t.category));
  const existingNames = new Set(existing.map((t) => t.name.trim().toLowerCase()));
  let created = 0;

  for (const item of DEFAULT_SERVICE_CATALOG_ITEMS) {
    const key = item.name.trim().toLowerCase();
    if (existingNames.has(key)) continue;
    await extraTemplatesApi.createExtraTemplate({
      name: item.name.trim(),
      description: item.description.trim() || null,
      category: SERVICE_CATALOG_CATEGORY,
      defaultCostPrice: item.defaultCostPrice,
      defaultSalePrice: item.defaultSalePrice,
      active: true
    });
    existingNames.add(key);
    created += 1;
  }

  return created;
}
