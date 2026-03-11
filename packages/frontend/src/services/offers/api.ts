import type { DraftResponse, OfferResponse } from "@ev-offer/core";
import { request } from "@/utils/httpClient";

export type OffersListResponse = {
  data: OfferResponse[];
  total: number;
  page: number;
  limit: number;
};

export async function submitOffer(draftId: string): Promise<OfferResponse> {
  return request<OfferResponse>("/offers", {
    method: "POST",
    body: JSON.stringify({ draftId }),
  });
}

export async function listOffers(page = 1, limit = 10): Promise<OffersListResponse> {
  return request<OffersListResponse>(`/offers?page=${page}&limit=${limit}`);
}

export async function getOffer(id: string): Promise<OfferResponse> {
  return request<OfferResponse>(`/offers/${id}`);
}

export async function listMyOffers(page = 1, limit = 10): Promise<OffersListResponse> {
  return request<OffersListResponse>(`/offers/mine?page=${page}&limit=${limit}`);
}

export async function createDraftFromOffer(offerId: string): Promise<DraftResponse> {
  return request<DraftResponse>(`/offers/${offerId}/draft`, {
    method: "POST",
  });
}
