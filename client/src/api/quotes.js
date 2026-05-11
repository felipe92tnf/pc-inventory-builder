import { http } from "./http";
export function listQuotes() {
    return http("/quotes");
}
export function getQuote(quoteId) {
    return http(`/quotes/${quoteId}`);
}
export function createQuote(payload) {
    return http("/quotes", {
        method: "POST",
        body: payload
    });
}
export function patchQuote(quoteId, payload) {
    return http(`/quotes/${quoteId}`, {
        method: "PATCH",
        body: payload
    });
}
export function deleteQuote(quoteId) {
    return http(`/quotes/${quoteId}`, {
        method: "DELETE"
    });
}
export function patchQuoteStatus(quoteId, payload) {
    return http(`/quotes/${quoteId}/status`, {
        method: "PATCH",
        body: payload
    });
}
export function addQuoteItem(quoteId, payload) {
    return http(`/quotes/${quoteId}/items`, {
        method: "POST",
        body: payload
    });
}
export function patchQuoteItem(quoteId, itemId, payload) {
    return http(`/quotes/${quoteId}/items/${itemId}`, {
        method: "PATCH",
        body: payload
    });
}
export function deleteQuoteItem(quoteId, itemId) {
    return http(`/quotes/${quoteId}/items/${itemId}`, {
        method: "DELETE"
    });
}
