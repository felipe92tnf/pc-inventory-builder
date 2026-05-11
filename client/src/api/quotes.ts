import { http } from "./http";
import type { BuildDetail } from "../types/build";
import type {
  AddQuoteItemPayload,
  CreateQuotePayload,
  PatchQuoteItemPayload,
  PatchQuotePayload,
  PatchQuoteStatusPayload,
  Quote
} from "../types/quote";

export function listQuotes() {
  return http<Quote[]>("/quotes");
}

export function getQuote(quoteId: string) {
  return http<Quote>(`/quotes/${quoteId}`);
}

export function createQuote(payload: CreateQuotePayload) {
  return http<Quote>("/quotes", {
    method: "POST",
    body: payload
  });
}

export function patchQuote(quoteId: string, payload: PatchQuotePayload) {
  return http<Quote>(`/quotes/${quoteId}`, {
    method: "PATCH",
    body: payload
  });
}

export function deleteQuote(quoteId: string) {
  return http<void>(`/quotes/${quoteId}`, {
    method: "DELETE"
  });
}

export function patchQuoteStatus(quoteId: string, payload: PatchQuoteStatusPayload) {
  return http<Quote>(`/quotes/${quoteId}/status`, {
    method: "PATCH",
    body: payload
  });
}

export function addQuoteItem(quoteId: string, payload: AddQuoteItemPayload) {
  return http<Quote>(`/quotes/${quoteId}/items`, {
    method: "POST",
    body: payload
  });
}

export function patchQuoteItem(quoteId: string, itemId: string, payload: PatchQuoteItemPayload) {
  return http<Quote>(`/quotes/${quoteId}/items/${itemId}`, {
    method: "PATCH",
    body: payload
  });
}

export function deleteQuoteItem(quoteId: string, itemId: string) {
  return http<Quote>(`/quotes/${quoteId}/items/${itemId}`, {
    method: "DELETE"
  });
}

export function convertQuoteToBuild(quoteId: string) {
  return http<BuildDetail>(`/quotes/${quoteId}/convert-to-build`, {
    method: "POST"
  });
}
