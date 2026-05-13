import { http } from "./http";
export function getCustomerOverview(name, phone) {
    const sp = new URLSearchParams();
    sp.set("name", name);
    sp.set("phone", phone);
    return http(`/customers/overview?${sp.toString()}`);
}
export function patchCustomerNotes(payload) {
    return http(`/customers/notes`, {
        method: "PATCH",
        body: payload
    });
}
