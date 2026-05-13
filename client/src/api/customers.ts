import { http } from "./http";
import type { QuoteStatus } from "../types/quote";
import type { ServiceStatus, ServiceType } from "../types/service";

export type CustomerOverviewQuote = {
  id: string;
  quoteNumber: number;
  title: string;
  status: QuoteStatus;
  total: number;
  createdAt: string;
};

export type CustomerOverviewService = {
  id: string;
  title: string;
  type: ServiceType;
  status: ServiceStatus;
  salePrice: number;
  profit: number;
  serviceDate: string;
};

export type CustomerOverviewSale = {
  id: string;
  soldAt: string;
  finalSalePrice: number;
  profit: number;
  buildName: string;
};

export type CustomerOverview = {
  lookupKey: string;
  displayName: string;
  displayPhone: string;
  notes: string | null;
  quotes: CustomerOverviewQuote[];
  services: CustomerOverviewService[];
  sales: CustomerOverviewSale[];
};

export function getCustomerOverview(name: string, phone: string) {
  const sp = new URLSearchParams();
  sp.set("name", name);
  sp.set("phone", phone);
  return http<CustomerOverview>(`/customers/overview?${sp.toString()}`);
}

export function patchCustomerNotes(payload: { name: string; phone: string; notes: string | null }) {
  return http<{ lookupKey: string; notes: string | null; updatedAt: string }>(`/customers/notes`, {
    method: "PATCH",
    body: payload
  });
}
