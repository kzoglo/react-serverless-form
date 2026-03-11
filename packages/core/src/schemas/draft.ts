import { z } from "zod";
import type { StepNumber } from "./ev-offer.js";
import { draftStatuses, offerStatuses } from "./status.js";

export const createDraftSchema = z.object({
  currentStep: z.literal(1).default(1),
});

export const updateDraftStepSchema = z.object({
  step: z.number().int().min(1).max(3) as z.ZodType<StepNumber>,
  data: z.record(z.string(), z.unknown()),
});

export const submitOfferSchema = z.object({
  draftId: z.string().uuid("Invalid draft ID"),
});

export const draftResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  currentStep: z.number().int(),
  data: z.record(z.string(), z.unknown()),
  status: z.enum(draftStatuses),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const offerResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  status: z.enum(offerStatuses),
  vehicle: z.object({
    make: z.string(),
    model: z.string(),
    year: z.number(),
    mileageKm: z.number(),
    batteryCapacityKwh: z.number(),
    rangeKm: z.number(),
    vin: z.string().nullable(),
    condition: z.string(),
    color: z.string(),
  }),
  pricing: z.object({
    price: z.number(),
    currency: z.string(),
    negotiable: z.boolean(),
    warrantyMonths: z.number(),
  }),
  photos: z.array(
    z.object({
      url: z.string(),
      sortOrder: z.number(),
      caption: z.string().nullable(),
    }),
  ),
  description: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
