import type { DraftResponse, OfferResponse } from "@ev-offer/core";
import { type QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { invalidateDraftQueries } from "@/services/drafts/services";
import { createDraftFromOffer, getOffer, listMyOffers, listOffers, submitOffer } from "./api";
import { offerKeys } from "./keys";

type SubmitOfferMutationOptions = {
  onSuccess?: (offer: OfferResponse) => void;
  onError?: () => void;
};

type CreateDraftFromOfferMutationOptions = {
  onSuccess?: (draft: DraftResponse) => void;
  onError?: () => void;
};

export function usePublicOffersQuery(page: number, limit = 10) {
  return useQuery({
    queryKey: offerKeys.public(page),
    queryFn: () => listOffers(page, limit),
  });
}

export function useMyOffersQuery(page = 1, limit = 10) {
  return useQuery({
    queryKey: offerKeys.mine(page),
    queryFn: () => listMyOffers(page, limit),
    staleTime: 0,
    refetchOnMount: "always",
  });
}

export function useOfferByIdQuery(offerId: string | null, enabled = true) {
  return useQuery({
    queryKey: offerKeys.detail(offerId),
    queryFn: () => (offerId ? getOffer(offerId) : null),
    enabled: enabled && !!offerId,
    staleTime: 0,
    refetchOnMount: "always",
    retry: false,
  });
}

export function useCreateDraftFromOfferMutation(options: CreateDraftFromOfferMutationOptions = {}) {
  return useMutation({
    mutationFn: (offerId: string) => createDraftFromOffer(offerId),
    onSuccess: (draft) => options.onSuccess?.(draft),
    onError: () => options.onError?.(),
  });
}

export function useSubmitOfferMutation(options: SubmitOfferMutationOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitOffer,
    onSuccess: async (offer, draftId) => {
      await invalidateOfferQueries(queryClient);
      await invalidateDraftQueries(queryClient, draftId);
      options.onSuccess?.(offer);
    },
    onError: () => options.onError?.(),
  });
}

export async function invalidateOfferQueries(queryClient: QueryClient) {
  await queryClient.invalidateQueries({ queryKey: offerKeys.mineRoot });
  await queryClient.invalidateQueries({ queryKey: offerKeys.publicRoot });
}
