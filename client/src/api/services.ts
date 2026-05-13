import { http } from "./http";
import type {
  CreateServicePayload,
  MonthlyServiceSummaryRow,
  PatchServiceExtraLinePayload,
  PatchServicePayload,
  ServiceExtraLinePayload,
  ServiceRow
} from "../types/service";

export type ListServicesParams = {
  type?: string;
  status?: string;
  month?: number;
  year?: number;
};

export function listServices(params?: ListServicesParams) {
  const sp = new URLSearchParams();
  if (params?.type) sp.set("type", params.type);
  if (params?.status) sp.set("status", params.status);
  if (params?.month !== undefined) sp.set("month", String(params.month));
  if (params?.year !== undefined) sp.set("year", String(params.year));
  const q = sp.toString();
  return http<ServiceRow[]>(`/services${q ? `?${q}` : ""}`);
}

export function getMonthlyServicesSummary() {
  return http<MonthlyServiceSummaryRow[]>("/services/summary/monthly");
}

export function createService(payload: CreateServicePayload) {
  return http<ServiceRow>("/services", {
    method: "POST",
    body: {
      ...payload,
      serviceDate: payload.serviceDate
    }
  });
}

export function getService(id: string) {
  return http<ServiceRow>(`/services/${id}`);
}

export function patchService(id: string, payload: PatchServicePayload) {
  return http<ServiceRow>(`/services/${id}`, {
    method: "PATCH",
    body: payload
  });
}

export function deleteService(id: string) {
  return http<void>(`/services/${id}`, {
    method: "DELETE"
  });
}

export function completeService(id: string) {
  return http<ServiceRow>(`/services/${id}/complete`, {
    method: "POST"
  });
}

export function addServiceExtraLine(serviceId: string, payload: ServiceExtraLinePayload) {
  return http<ServiceRow>(`/services/${serviceId}/extra-lines`, {
    method: "POST",
    body: payload
  });
}

export function patchServiceExtraLine(
  serviceId: string,
  lineId: string,
  payload: PatchServiceExtraLinePayload
) {
  return http<ServiceRow>(`/services/${serviceId}/extra-lines/${lineId}`, {
    method: "PATCH",
    body: payload
  });
}

export function deleteServiceExtraLine(serviceId: string, lineId: string) {
  return http<ServiceRow>(`/services/${serviceId}/extra-lines/${lineId}`, {
    method: "DELETE"
  });
}
