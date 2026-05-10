import { http } from "./http";
import type {
  CreateSaleFromBuildPayload,
  MonthlySalesSummaryRow,
  PatchSalePayload,
  SaleDetail,
  SaleListRow
} from "../types/sale";

export function listSales() {
  return http<SaleListRow[]>("/sales");
}

export function getMonthlySalesSummary() {
  return http<MonthlySalesSummaryRow[]>("/sales/summary/monthly");
}

export function createSaleFromBuild(buildId: string, payload: CreateSaleFromBuildPayload) {
  return http<SaleDetail>(`/sales/from-build/${buildId}`, {
    method: "POST",
    body: payload
  });
}

export function getSale(saleId: string) {
  return http<SaleDetail>(`/sales/${saleId}`);
}

export function patchSale(saleId: string, payload: PatchSalePayload) {
  return http<SaleDetail>(`/sales/${saleId}`, {
    method: "PATCH",
    body: payload
  });
}

export function deleteSale(saleId: string) {
  return http<void>(`/sales/${saleId}`, {
    method: "DELETE"
  });
}
