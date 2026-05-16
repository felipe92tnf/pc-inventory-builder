import { http } from "./http";
export function listCustomers(q) {
    const sp = q?.trim() ? `?q=${encodeURIComponent(q.trim())}` : "";
    return http(`/customers${sp}`);
}
export function searchCustomers(q, limit = 12) {
    const sp = new URLSearchParams();
    sp.set("q", q);
    sp.set("limit", String(limit));
    return http(`/customers/search?${sp.toString()}`);
}
export function getCustomerById(id) {
    return http(`/customers/${id}`);
}
export function createCustomer(payload) {
    return http(`/customers`, { method: "POST", body: payload });
}
export function patchCustomer(id, payload) {
    return http(`/customers/${id}`, { method: "PATCH", body: payload });
}
export function getCustomerOverview(name, phone) {
    const sp = new URLSearchParams();
    sp.set("name", name);
    sp.set("phone", phone);
    return http(`/customers/overview?${sp.toString()}`);
}
export function patchCustomerNotes(payload) {
    return http(`/customers/notes`, { method: "PATCH", body: payload });
}
