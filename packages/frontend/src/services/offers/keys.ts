export const offerKeys = {
  mine: (page: number) => ["myOffers", page] as const,
  mineRoot: ["myOffers"] as const,
  detail: (id: string | null) => ["offer", id] as const,
  public: (page: number) => ["publicOffers", page] as const,
  publicRoot: ["publicOffers"] as const,
} as const;
