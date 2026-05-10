import { http } from "./http";
import type {
  AddBuildItemPayload,
  Build,
  BuildDetail,
  CreateBuildPayload,
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

export function confirmBuild(buildId: string) {
  return http<BuildDetail>(`/builds/${buildId}/confirm`, {
    method: "POST"
  });
}

export function revertBuildToDraft(buildId: string) {
  return http<BuildDetail>(`/builds/${buildId}/revert-draft`, {
    method: "POST"
  });
}
