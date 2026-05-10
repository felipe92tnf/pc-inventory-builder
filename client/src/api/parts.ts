import { http } from "./http";
import type { Part, PartPayload } from "../types/part";

export function listParts() {
  return http<Part[]>("/parts");
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
