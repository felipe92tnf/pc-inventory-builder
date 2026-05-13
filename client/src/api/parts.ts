import { http } from "./http";
import type { Part, PartPayload, StockFromCatalogPayload } from "../types/part";

export function listParts() {
  return http<Part[]>("/parts");
}

export function createStockFromCatalog(payload: StockFromCatalogPayload) {
  return http<Part>("/parts/from-catalog", {
    method: "POST",
    body: payload
  });
}

export function createPart(payload: PartPayload) {
  return http<Part>("/parts", {
    method: "POST",
    body: payload
  });
}

export function updatePart(partId: string, payload: Partial<PartPayload>) {
  return http<Part>(`/parts/${partId}`, {
    method: "PATCH",
    body: payload
  });
}

export function deletePart(partId: string) {
  return http<void>(`/parts/${partId}`, {
    method: "DELETE"
  });
}
