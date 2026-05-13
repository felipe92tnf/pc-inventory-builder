import { http } from "./http";
import type { CreateExtraTemplatePayload, ExtraTemplate, PatchExtraTemplatePayload } from "../types/extraTemplate";

export function listExtraTemplates(activeOnly?: boolean) {
  const q = activeOnly ? "?activeOnly=1" : "";
  return http<ExtraTemplate[]>(`/extra-templates${q}`);
}

export function createExtraTemplate(payload: CreateExtraTemplatePayload) {
  return http<ExtraTemplate>("/extra-templates", {
    method: "POST",
    body: payload
  });
}

export function patchExtraTemplate(id: string, payload: PatchExtraTemplatePayload) {
  return http<ExtraTemplate>(`/extra-templates/${id}`, {
    method: "PATCH",
    body: payload
  });
}

export function deleteExtraTemplate(id: string) {
  return http<void>(`/extra-templates/${id}`, {
    method: "DELETE"
  });
}
