export const draftKeys = {
  list: ["drafts"] as const,
  detail: (id: string | null) => ["draft", id] as const,
} as const;
