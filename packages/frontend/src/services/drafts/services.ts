import type { DraftResponse } from "@ev-offer/core";
import { type QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createDraft, getDraft, listDrafts, saveDraftStep } from "./api";
import { draftKeys } from "./keys";

type CreateDraftMutationOptions = {
  onSuccess?: (draft: DraftResponse) => void;
  onError?: () => void;
};

type SaveDraftStepInput = {
  id: string;
  step: number;
  data: Record<string, unknown>;
};

export function useDraftsListQuery() {
  return useQuery({
    queryKey: draftKeys.list,
    queryFn: listDrafts,
    staleTime: 0,
    refetchOnMount: "always",
  });
}

export function useDraftByIdQuery(draftId: string | null, enabled = true) {
  return useQuery({
    queryKey: draftKeys.detail(draftId),
    queryFn: () => (draftId ? getDraft(draftId) : null),
    enabled: enabled && !!draftId,
    staleTime: 0,
    refetchOnMount: "always",
    retry: false,
  });
}

export function useCreateDraftMutation(options: CreateDraftMutationOptions = {}) {
  return useMutation({
    mutationFn: createDraft,
    onSuccess: (draft) => options.onSuccess?.(draft),
    onError: () => options.onError?.(),
  });
}

export function useSaveDraftStepMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, step, data }: SaveDraftStepInput) => saveDraftStep(id, step, data),
    onSuccess: async (updatedDraft) => {
      queryClient.setQueryData(draftKeys.detail(updatedDraft.id), updatedDraft);
      await queryClient.invalidateQueries({ queryKey: draftKeys.list });
    },
  });
}

export async function invalidateDraftQueries(queryClient: QueryClient, draftId?: string | null) {
  await queryClient.invalidateQueries({ queryKey: draftKeys.list });

  if (draftId) {
    await queryClient.invalidateQueries({ queryKey: draftKeys.detail(draftId) });
  }
}
