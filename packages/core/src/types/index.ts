import type { z } from "zod";
import type { draftResponseSchema, offerResponseSchema } from "../schemas/draft.js";
import type {
  fullOfferSchema,
  photoSchema,
  photosStepSchema,
  pricingSchema,
  vehicleInfoSchema,
} from "../schemas/ev-offer.js";

// Inferred types from Zod schemas
export type VehicleInfo = z.infer<typeof vehicleInfoSchema>;
export type Pricing = z.infer<typeof pricingSchema>;
export type Photo = z.infer<typeof photoSchema>;
export type PhotosStep = z.infer<typeof photosStepSchema>;
export type FullOffer = z.infer<typeof fullOfferSchema>;

// API response types
export type DraftResponse = z.infer<typeof draftResponseSchema>;
export type OfferResponse = z.infer<typeof offerResponseSchema>;

// Form step data union
export type StepData = VehicleInfo | Pricing | PhotosStep;
