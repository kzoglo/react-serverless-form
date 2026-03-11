import { z } from "zod";

// ── Step 1: Vehicle Information ──────────────────────────────────────

export const vehicleConditions = ["new", "like_new", "excellent", "good", "fair"] as const;
export type VehicleCondition = (typeof vehicleConditions)[number];

export const vehicleColors = [
  "White",
  "Black",
  "Silver",
  "Grey",
  "Red",
  "Blue",
  "Green",
  "Brown",
  "Beige",
  "Orange",
  "Yellow",
] as const;
export type VehicleColor = (typeof vehicleColors)[number];

export const vehicleInfoSchema = z.object({
  make: z.string().min(1, "Make is required").max(100, "Make must be 100 characters or less"),
  model: z.string().min(1, "Model is required").max(100, "Model must be 100 characters or less"),
  year: z
    .number()
    .int()
    .min(2010, "Year must be 2010 or later")
    .max(new Date().getFullYear() + 1, "Year cannot be in the future"),
  mileageKm: z
    .number()
    .int()
    .min(0, "Mileage cannot be negative")
    .max(1_000_000, "Mileage seems too high"),
  batteryCapacityKwh: z
    .number()
    .positive("Battery capacity must be positive")
    .max(300, "Battery capacity seems too high"),
  rangeKm: z.number().int().positive("Range must be positive").max(1500, "Range seems too high"),
  vin: z
    .string()
    .length(17, "VIN must be exactly 17 characters")
    .regex(/^[A-HJ-NPR-Z0-9]+$/, "Invalid VIN format")
    .optional()
    .or(z.literal("")),
  condition: z.enum(vehicleConditions, {
    errorMap: () => ({ message: "Please select a vehicle condition" }),
  }),
  color: z.enum(vehicleColors, {
    errorMap: () => ({ message: "Please select a color" }),
  }),
});

// ── Step 2: Pricing & Warranty ───────────────────────────────────────

export const currencies = ["EUR", "USD", "GBP", "PLN", "CHF"] as const;
export type Currency = (typeof currencies)[number];
export const DEFAULT_CURRENCY: Currency = "EUR";

export const pricingSchema = z.object({
  price: z.number().positive("Price must be positive").max(10_000_000, "Price seems too high"),
  currency: z.enum(currencies, {
    errorMap: () => ({ message: "Please select a currency" }),
  }),
  negotiable: z.boolean().default(false),
  warrantyMonths: z
    .number()
    .int()
    .min(0, "Warranty cannot be negative")
    .max(120, "Warranty seems too long")
    .default(0),
});

// ── Step 3: Photos & Description ─────────────────────────────────────

export const photoSchema = z.object({
  url: z.string().url("Invalid photo URL"),
  sortOrder: z.number().int().min(0).default(0),
  caption: z.string().max(200, "Caption must be 200 characters or less").optional(),
});

export const photosStepSchema = z.object({
  photos: z.array(photoSchema).max(20, "Maximum 20 photos allowed"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(5000, "Description must be 5000 characters or less"),
});

// ── Full Offer Schema (all steps combined) ───────────────────────────

export const fullOfferSchema = vehicleInfoSchema.merge(pricingSchema).merge(photosStepSchema);

// ── Step schemas map (for dynamic step validation) ───────────────────

export const stepSchemas = {
  1: vehicleInfoSchema,
  2: pricingSchema,
  3: photosStepSchema,
} as const;

export type StepNumber = keyof typeof stepSchemas;
export const TOTAL_STEPS = 3 as const;
