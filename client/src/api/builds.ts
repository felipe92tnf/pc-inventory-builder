import { http } from "./http";
import type { Build, BuildDetail, CreateBuildPayload, UpdateBuildPayload } from "../types/build";

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

export function addBuildItem(buildId: string, partId: string, quantity: number) {
  return http(`/builds/${buildId}/items`, {
    method: "POST",
    body: { partId, quantity }
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
