import type { DraftResponse } from "@ev-offer/core";
import { request } from "@/utils/httpClient";

export async function createDraft(): Promise<DraftResponse> {
  return request<DraftResponse>("/drafts", { method: "POST", body: "{}" });
}

export async function getDraft(id: string): Promise<DraftResponse> {
  return request<DraftResponse>(`/drafts/${id}`);
}

export async function listDrafts(): Promise<DraftResponse[]> {
  return request<DraftResponse[]>("/drafts");
}

export async function saveDraftStep(
  draftId: string,
  step: number,
  data: Record<string, unknown>,
): Promise<DraftResponse> {
  return request<DraftResponse>(`/drafts/${draftId}/steps/${step}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteDraft(id: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/drafts/${id}`, {
    method: "DELETE",
  });
}
