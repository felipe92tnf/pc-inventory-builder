import { http } from "./http";
import type {
  AddBuildExtraLinePayload,
  AddBuildManualLinePayload,
  AddBuildItemPayload,
  Build,
  BuildDetail,
  ConfirmBuildPayload,
  CreateBuildPayload,
  UpdateBuildExtraLinePayload,
  UpdateBuildPayload,
  UpdateBuildItemPayload
} from "../types/build";

export function listBuilds() {
  return http<Build[]>("/builds");
}

export function getBuild(buildId: string) {
  return http<BuildDetail>(`/builds/${buildId}`);
}

export function createBuild(payload: CreateBuildPayload) {
  return http<Build>("/builds", {
    method: "POST",
    body: payload
  });
}

/** Crea montaje confirmado desde 1 unidad de PC premontado en inventario (listo para venta). */
export function createBuildFromPrebuiltPart(partId: string) {
  return http<BuildDetail>("/builds/from-prebuilt-part", {
    method: "POST",
    body: { partId }
  });
}

export function updateBuild(buildId: string, payload: UpdateBuildPayload) {
  return http<BuildDetail>(`/builds/${buildId}`, {
    method: "PATCH",
    body: payload
  });
}

export function deleteBuild(buildId: string) {
  return http<void>(`/builds/${buildId}`, {
    method: "DELETE"
  });
}

export function addBuildItem(buildId: string, payload: AddBuildItemPayload) {
  return http<BuildDetail>(`/builds/${buildId}/items`, {
    method: "POST",
    body: payload
  });
}

export function updateBuildItem(buildId: string, itemId: string, payload: UpdateBuildItemPayload) {
  return http<BuildDetail>(`/builds/${buildId}/items/${itemId}`, {
    method: "PATCH",
    body: payload
  });
}

export function deleteBuildItem(buildId: string, itemId: string) {
  return http<void>(`/builds/${buildId}/items/${itemId}`, {
    method: "DELETE"
  });
}

export function addBuildManualLine(buildId: string, payload: AddBuildManualLinePayload) {
  return http<BuildDetail>(`/builds/${buildId}/manual-lines`, {
    method: "POST",
    body: payload
  });
}

export function addBuildExtraLine(buildId: string, payload: AddBuildExtraLinePayload) {
  return http<BuildDetail>(`/builds/${buildId}/extra-lines`, {
    method: "POST",
    body: payload
  });
}

export function updateBuildExtraLine(
  buildId: string,
  lineId: string,
  payload: UpdateBuildExtraLinePayload
) {
  return http<BuildDetail>(`/builds/${buildId}/extra-lines/${lineId}`, {
    method: "PATCH",
    body: payload
  });
}

export function deleteBuildExtraLine(buildId: string, lineId: string) {
  return http<void>(`/builds/${buildId}/extra-lines/${lineId}`, {
    method: "DELETE"
  });
}

export function confirmBuild(buildId: string, payload?: ConfirmBuildPayload) {
  return http<BuildDetail>(`/builds/${buildId}/confirm`, {
    method: "POST",
    body: payload ?? {}
  });
}

export function revertBuildToDraft(buildId: string) {
  return http<BuildDetail>(`/builds/${buildId}/revert-draft`, {
    method: "POST"
  });
}
