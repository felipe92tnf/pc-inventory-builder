import { http } from "./http";
import type {
  CustomerDetail,
  CustomerListItem,
  CustomerOverview,
  CustomerSearchResult
} from "../types/customer";

export type {
  CustomerOverviewQuote,
  CustomerOverviewService,
  CustomerOverviewSale,
  CustomerOverviewBuild
} from "../types/customer";

export function listCustomers(q?: string) {
  const sp = q?.trim() ? `?q=${encodeURIComponent(q.trim())}` : "";
  return http<CustomerListItem[]>(`/customers${sp}`);
}

export function searchCustomers(q: string, limit = 12) {
  const sp = new URLSearchParams();
  sp.set("q", q);
  sp.set("limit", String(limit));
  return http<CustomerSearchResult[]>(`/customers/search?${sp.toString()}`);
}

export function getCustomerById(id: string) {
  return http<CustomerDetail>(`/customers/${id}`);
}

export function createCustomer(payload: {
  name: string;
  phone?: string;
  email?: string | null;
  notes?: string | null;
}) {
  return http<CustomerDetail>(`/customers`, { method: "POST", body: payload });
}

export function patchCustomer(
  id: string,
  payload: { name?: string; phone?: string; email?: string | null; notes?: string | null }
) {
  return http<CustomerDetail>(`/customers/${id}`, { method: "PATCH", body: payload });
}

export function getCustomerOverview(name: string, phone: string) {
  const sp = new URLSearchParams();
  sp.set("name", name);
  sp.set("phone", phone);
  return http<CustomerOverview>(`/customers/overview?${sp.toString()}`);
}

export function patchCustomerNotes(payload: { name: string; phone: string; notes: string | null }) {
  return http<{ customerId: string | null; lookupKey: string; notes: string | null; updatedAt: string }>(
    `/customers/notes`,
    { method: "PATCH", body: payload }
  );
}
