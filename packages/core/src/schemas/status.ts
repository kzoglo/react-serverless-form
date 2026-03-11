import {
  DraftStatus as PrismaDraftStatus,
  OfferStatus as PrismaOfferStatus,
} from "@ev-offer/db/enums";

function enumValues<T extends Record<string, string>>(
  enumObj: T,
): [T[keyof T], ...Array<T[keyof T]>] {
  return Object.values(enumObj) as [T[keyof T], ...Array<T[keyof T]>];
}

// Statuses are derived from Prisma schema enums (single source of truth).
export const draftStatuses = enumValues(PrismaDraftStatus);
export type DraftStatus = (typeof draftStatuses)[number];

export const offerStatuses = enumValues(PrismaOfferStatus);
export type OfferStatus = (typeof offerStatuses)[number];
