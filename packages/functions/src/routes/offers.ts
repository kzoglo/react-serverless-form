import {
  draftResponseSchema,
  fullOfferSchema,
  offerResponseSchema,
  submitOfferSchema,
  TOTAL_STEPS,
} from "@ev-offer/core";
import { DraftStatus, OfferStatus } from "@ev-offer/db/enums";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import type { AppEnv } from "../app.js";
import { prisma } from "../lib/db.js";
import { authMiddleware } from "../middleware/auth.js";

export const offersApp = new OpenAPIHono<AppEnv>();
const SOURCE_OFFER_ID_KEY = "_sourceOfferId";

// ── GET /offers ──────────────────────────────────────────────────────

const listOffersRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Offers"],
  summary: "List published offers",
  request: {
    query: z.object({
      page: z.string().optional().default("1"),
      limit: z.string().optional().default("20"),
    }),
  },
  responses: {
    200: {
      description: "List of offers",
      content: {
        "application/json": {
          schema: z.object({
            data: z.array(offerResponseSchema),
            total: z.number(),
            page: z.number(),
            limit: z.number(),
          }),
        },
      },
    },
  },
});

offersApp.openapi(listOffersRoute, async (c) => {
  const { page: pageStr, limit: limitStr } = c.req.valid("query");
  const page = Math.max(1, parseInt(pageStr, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(limitStr, 10) || 20));
  const skip = (page - 1) * limit;

  const [offers, total] = await Promise.all([
    prisma.evOffer.findMany({
      where: { status: OfferStatus.active },
      include: {
        vehicle: true,
        pricing: true,
        photos: { orderBy: { sortOrder: "asc" } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.evOffer.count({ where: { status: OfferStatus.active } }),
  ]);

  return c.json({
    data: offers.map((offer) => ({
      id: offer.id,
      userId: offer.userId,
      status: offer.status,
      vehicle: {
        make: offer.vehicle!.make,
        model: offer.vehicle!.model,
        year: offer.vehicle!.year,
        mileageKm: offer.vehicle!.mileageKm,
        batteryCapacityKwh: offer.vehicle!.batteryCapacityKwh,
        rangeKm: offer.vehicle!.rangeKm,
        vin: offer.vehicle!.vin,
        condition: offer.vehicle!.condition,
        color: offer.vehicle!.color,
      },
      pricing: {
        price: Number(offer.pricing!.price),
        currency: offer.pricing!.currency,
        negotiable: offer.pricing!.negotiable,
        warrantyMonths: offer.pricing!.warrantyMonths,
      },
      photos: offer.photos.map((p) => ({
        url: p.url,
        sortOrder: p.sortOrder,
        caption: p.caption,
      })),
      description: offer.description,
      createdAt: offer.createdAt.toISOString(),
      updatedAt: offer.updatedAt.toISOString(),
    })),
    total,
    page,
    limit,
  });
});

// ── Authenticated offers: submit + my offers ─────────────────────────

offersApp.use("*", authMiddleware);

// Submit final offer from draft

const submitOfferRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Offers"],
  summary: "Submit final offer from draft",
  request: {
    body: {
      content: {
        "application/json": {
          schema: submitOfferSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Offer created",
      content: {
        "application/json": {
          schema: offerResponseSchema,
        },
      },
    },
  },
});

offersApp.openapi(submitOfferRoute, async (c) => {
  const userId = c.get("userId");
  const { draftId } = c.req.valid("json");

  const draft = await prisma.offerDraft.findFirst({
    where: { id: draftId, userId, status: DraftStatus.draft },
  });

  if (!draft) {
    throw new HTTPException(404, { message: "Draft not found" });
  }

  const draftData = draft.data as Record<string, unknown>;
  const sourceOfferId =
    typeof draftData[SOURCE_OFFER_ID_KEY] === "string" ? draftData[SOURCE_OFFER_ID_KEY] : null;
  const parsed = fullOfferSchema.safeParse(draftData);

  if (!parsed.success) {
    throw new HTTPException(400, {
      message:
        "Draft data is incomplete or invalid: " +
        parsed.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", "),
    });
  }

  const data = parsed.data;
  const photoCreateData = data.photos.map((photo) => ({
    url: photo.url,
    sortOrder: photo.sortOrder,
    caption: photo.caption || null,
  }));

  const offerId = await prisma.$transaction(async (tx) => {
    let existingOffer = await tx.evOffer.findFirst({
      where: { draftId },
    });

    if (!existingOffer && sourceOfferId) {
      existingOffer = await tx.evOffer.findFirst({
        where: {
          id: sourceOfferId,
          userId,
        },
      });
    }

    if (!existingOffer) {
      const newOffer = await tx.evOffer.create({
        data: {
          userId,
          draftId,
          status: OfferStatus.active,
          description: data.description,
          vehicle: {
            create: {
              make: data.make,
              model: data.model,
              year: data.year,
              mileageKm: data.mileageKm,
              batteryCapacityKwh: data.batteryCapacityKwh,
              rangeKm: data.rangeKm,
              vin: data.vin || null,
              condition: data.condition,
              color: data.color,
            },
          },
          pricing: {
            create: {
              price: data.price,
              currency: data.currency,
              negotiable: data.negotiable,
              warrantyMonths: data.warrantyMonths,
            },
          },
          ...(photoCreateData.length > 0
            ? {
                photos: {
                  createMany: {
                    data: photoCreateData,
                  },
                },
              }
            : {}),
        },
      });

      await tx.offerDraft.update({
        where: { id: draftId },
        data: { status: DraftStatus.submitted },
      });

      return newOffer.id;
    }

    await tx.evOffer.update({
      where: { id: existingOffer.id },
      data: {
        draftId,
        description: data.description,
        status: OfferStatus.active,
      },
    });

    await tx.evVehicle.upsert({
      where: { offerId: existingOffer.id },
      update: {
        make: data.make,
        model: data.model,
        year: data.year,
        mileageKm: data.mileageKm,
        batteryCapacityKwh: data.batteryCapacityKwh,
        rangeKm: data.rangeKm,
        vin: data.vin || null,
        condition: data.condition,
        color: data.color,
      },
      create: {
        offerId: existingOffer.id,
        make: data.make,
        model: data.model,
        year: data.year,
        mileageKm: data.mileageKm,
        batteryCapacityKwh: data.batteryCapacityKwh,
        rangeKm: data.rangeKm,
        vin: data.vin || null,
        condition: data.condition,
        color: data.color,
      },
    });

    await tx.evPricing.upsert({
      where: { offerId: existingOffer.id },
      update: {
        price: data.price,
        currency: data.currency,
        negotiable: data.negotiable,
        warrantyMonths: data.warrantyMonths,
      },
      create: {
        offerId: existingOffer.id,
        price: data.price,
        currency: data.currency,
        negotiable: data.negotiable,
        warrantyMonths: data.warrantyMonths,
      },
    });

    await tx.evPhoto.deleteMany({
      where: { offerId: existingOffer.id },
    });

    if (photoCreateData.length > 0) {
      await tx.evPhoto.createMany({
        data: photoCreateData.map((p) => ({
          ...p,
          offerId: existingOffer.id,
        })),
      });
    }

    await tx.offerDraft.update({
      where: { id: draftId },
      data: { status: DraftStatus.submitted },
    });

    return existingOffer.id;
  });

  const offer = await prisma.evOffer.findUniqueOrThrow({
    where: { id: offerId },
    include: {
      vehicle: true,
      pricing: true,
      photos: { orderBy: { sortOrder: "asc" } },
    },
  });

  return c.json(
    {
      id: offer.id,
      userId: offer.userId,
      status: offer.status,
      vehicle: {
        make: offer.vehicle!.make,
        model: offer.vehicle!.model,
        year: offer.vehicle!.year,
        mileageKm: offer.vehicle!.mileageKm,
        batteryCapacityKwh: offer.vehicle!.batteryCapacityKwh,
        rangeKm: offer.vehicle!.rangeKm,
        vin: offer.vehicle!.vin,
        condition: offer.vehicle!.condition,
        color: offer.vehicle!.color,
      },
      pricing: {
        price: Number(offer.pricing!.price),
        currency: offer.pricing!.currency,
        negotiable: offer.pricing!.negotiable,
        warrantyMonths: offer.pricing!.warrantyMonths,
      },
      photos: offer.photos.map((p) => ({
        url: p.url,
        sortOrder: p.sortOrder,
        caption: p.caption,
      })),
      description: offer.description,
      createdAt: offer.createdAt.toISOString(),
      updatedAt: offer.updatedAt.toISOString(),
    },
    201,
  );
});

// ── GET /offers/mine ─ (authenticated creator's offers) ───────────────

const listMyOffersRoute = createRoute({
  method: "get",
  path: "/mine",
  tags: ["Offers"],
  summary: "List offers created by the authenticated user",
  request: {
    query: z.object({
      page: z.string().optional().default("1"),
      limit: z.string().optional().default("20"),
    }),
  },
  responses: {
    200: {
      description: "List of offers for current user",
      content: {
        "application/json": {
          schema: z.object({
            data: z.array(offerResponseSchema),
            total: z.number(),
            page: z.number(),
            limit: z.number(),
          }),
        },
      },
    },
  },
});

offersApp.openapi(listMyOffersRoute, async (c) => {
  const userId = c.get("userId");
  const { page: pageStr, limit: limitStr } = c.req.valid("query");
  const page = Math.max(1, parseInt(pageStr, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(limitStr, 10) || 20));
  const skip = (page - 1) * limit;

  const [offers, total] = await Promise.all([
    prisma.evOffer.findMany({
      where: { userId },
      include: {
        vehicle: true,
        pricing: true,
        photos: { orderBy: { sortOrder: "asc" } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.evOffer.count({ where: { userId } }),
  ]);

  return c.json({
    data: offers.map((offer) => ({
      id: offer.id,
      userId: offer.userId,
      status: offer.status,
      vehicle: {
        make: offer.vehicle!.make,
        model: offer.vehicle!.model,
        year: offer.vehicle!.year,
        mileageKm: offer.vehicle!.mileageKm,
        batteryCapacityKwh: offer.vehicle!.batteryCapacityKwh,
        rangeKm: offer.vehicle!.rangeKm,
        vin: offer.vehicle!.vin,
        condition: offer.vehicle!.condition,
        color: offer.vehicle!.color,
      },
      pricing: {
        price: Number(offer.pricing!.price),
        currency: offer.pricing!.currency,
        negotiable: offer.pricing!.negotiable,
        warrantyMonths: offer.pricing!.warrantyMonths,
      },
      photos: offer.photos.map((p) => ({
        url: p.url,
        sortOrder: p.sortOrder,
        caption: p.caption,
      })),
      description: offer.description,
      createdAt: offer.createdAt.toISOString(),
      updatedAt: offer.updatedAt.toISOString(),
    })),
    total,
    page,
    limit,
  });
});
// ── POST /offers/:id/draft ─ create a draft from an existing offer ───

const createDraftFromOfferRoute = createRoute({
  method: "post",
  path: "/{id}/draft",
  tags: ["Offers"],
  summary: "Create a new draft based on an existing offer",
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    201: {
      description: "Draft created from offer",
      content: {
        "application/json": {
          schema: draftResponseSchema,
        },
      },
    },
  },
});

offersApp.openapi(createDraftFromOfferRoute, async (c) => {
  const userId = c.get("userId");
  const { id } = c.req.valid("param");

  const offer = await prisma.evOffer.findFirst({
    where: { id, userId },
    include: {
      draft: true,
      vehicle: true,
      pricing: true,
      photos: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!offer || !offer.vehicle || !offer.pricing) {
    throw new HTTPException(404, { message: "Offer not found" });
  }

  if (offer.draft?.status === DraftStatus.draft) {
    return c.json(
      {
        id: offer.draft.id,
        userId: offer.draft.userId,
        currentStep: offer.draft.currentStep,
        data: offer.draft.data as Record<string, unknown>,
        status: offer.draft.status,
        createdAt: offer.draft.createdAt.toISOString(),
        updatedAt: offer.draft.updatedAt.toISOString(),
      },
      201,
    );
  }

  const existingData = offer.draft?.data as Record<string, unknown> | null | undefined;

  const reconstructedData = {
    make: offer.vehicle.make,
    model: offer.vehicle.model,
    year: offer.vehicle.year,
    mileageKm: offer.vehicle.mileageKm,
    batteryCapacityKwh: offer.vehicle.batteryCapacityKwh,
    rangeKm: offer.vehicle.rangeKm,
    vin: offer.vehicle.vin ?? "",
    condition: offer.vehicle.condition,
    color: offer.vehicle.color,
    price: Number(offer.pricing.price),
    currency: offer.pricing.currency,
    negotiable: offer.pricing.negotiable,
    warrantyMonths: offer.pricing.warrantyMonths,
    photos: offer.photos.map((p) => ({
      url: p.url,
      sortOrder: p.sortOrder,
      caption: p.caption ?? undefined,
    })),
    description: offer.description,
  };

  const candidateData = existingData ?? reconstructedData;

  const parsed = fullOfferSchema.safeParse(candidateData);
  if (!parsed.success) {
    throw new HTTPException(400, {
      message:
        "Could not create draft from offer: " +
        parsed.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", "),
    });
  }

  const newDraft = await prisma.$transaction(async (tx) => {
    const createdDraft = await tx.offerDraft.create({
      data: {
        userId,
        currentStep: TOTAL_STEPS,
        data: {
          ...parsed.data,
          [SOURCE_OFFER_ID_KEY]: offer.id,
        },
        status: DraftStatus.draft,
      },
    });

    await tx.evOffer.update({
      where: { id: offer.id },
      data: {
        draftId: createdDraft.id,
      },
    });

    return createdDraft;
  });

  return c.json(
    {
      id: newDraft.id,
      userId: newDraft.userId,
      currentStep: newDraft.currentStep,
      data: newDraft.data as Record<string, unknown>,
      status: newDraft.status,
      createdAt: newDraft.createdAt.toISOString(),
      updatedAt: newDraft.updatedAt.toISOString(),
    },
    201,
  );
});

// ── GET /offers/:id ──────────────────────────────────────────────────

const getOfferRoute = createRoute({
  method: "get",
  path: "/{id}",
  tags: ["Offers"],
  summary: "Get offer by ID",
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      description: "Offer details",
      content: {
        "application/json": {
          schema: offerResponseSchema,
        },
      },
    },
  },
});

offersApp.openapi(getOfferRoute, async (c) => {
  const { id } = c.req.valid("param");

  const offer = await prisma.evOffer.findUnique({
    where: { id },
    include: {
      vehicle: true,
      pricing: true,
      photos: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!offer) {
    throw new HTTPException(404, { message: "Offer not found" });
  }

  return c.json({
    id: offer.id,
    userId: offer.userId,
    status: offer.status,
    vehicle: {
      make: offer.vehicle!.make,
      model: offer.vehicle!.model,
      year: offer.vehicle!.year,
      mileageKm: offer.vehicle!.mileageKm,
      batteryCapacityKwh: offer.vehicle!.batteryCapacityKwh,
      rangeKm: offer.vehicle!.rangeKm,
      vin: offer.vehicle!.vin,
      condition: offer.vehicle!.condition,
      color: offer.vehicle!.color,
    },
    pricing: {
      price: Number(offer.pricing!.price),
      currency: offer.pricing!.currency,
      negotiable: offer.pricing!.negotiable,
      warrantyMonths: offer.pricing!.warrantyMonths,
    },
    photos: offer.photos.map((p) => ({
      url: p.url,
      sortOrder: p.sortOrder,
      caption: p.caption,
    })),
    description: offer.description,
    createdAt: offer.createdAt.toISOString(),
    updatedAt: offer.updatedAt.toISOString(),
  });
});

// ── PATCH /offers/:id ─ update an existing offer for the owner ─────────

const patchOfferRoute = createRoute({
  method: "patch",
  path: "/{id}",
  tags: ["Offers"],
  summary: "Update an existing offer (owner only)",
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: {
        "application/json": {
          schema: fullOfferSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Updated offer",
      content: {
        "application/json": {
          schema: offerResponseSchema,
        },
      },
    },
  },
});

offersApp.openapi(patchOfferRoute, async (c) => {
  const userId = c.get("userId");
  const { id } = c.req.valid("param");
  const data = c.req.valid("json");

  const photoCreateData = data.photos.map((photo) => ({
    url: photo.url,
    sortOrder: photo.sortOrder,
    caption: photo.caption || null,
  }));

  const offer = await prisma.$transaction(async (tx) => {
    const existingOffer = await tx.evOffer.findFirst({
      where: {
        id,
        userId,
        status: OfferStatus.active,
      },
    });

    if (!existingOffer) {
      throw new HTTPException(404, { message: "Offer not found" });
    }

    const updatedOffer = await tx.evOffer.update({
      where: { id: existingOffer.id },
      data: {
        description: data.description,
      },
    });

    await tx.evVehicle.upsert({
      where: { offerId: existingOffer.id },
      update: {
        make: data.make,
        model: data.model,
        year: data.year,
        mileageKm: data.mileageKm,
        batteryCapacityKwh: data.batteryCapacityKwh,
        rangeKm: data.rangeKm,
        vin: data.vin || null,
        condition: data.condition,
        color: data.color,
      },
      create: {
        offerId: existingOffer.id,
        make: data.make,
        model: data.model,
        year: data.year,
        mileageKm: data.mileageKm,
        batteryCapacityKwh: data.batteryCapacityKwh,
        rangeKm: data.rangeKm,
        vin: data.vin || null,
        condition: data.condition,
        color: data.color,
      },
    });

    await tx.evPricing.upsert({
      where: { offerId: existingOffer.id },
      update: {
        price: data.price,
        currency: data.currency,
        negotiable: data.negotiable,
        warrantyMonths: data.warrantyMonths,
      },
      create: {
        offerId: existingOffer.id,
        price: data.price,
        currency: data.currency,
        negotiable: data.negotiable,
        warrantyMonths: data.warrantyMonths,
      },
    });

    await tx.evPhoto.deleteMany({
      where: { offerId: existingOffer.id },
    });

    if (photoCreateData.length > 0) {
      await tx.evPhoto.createMany({
        data: photoCreateData.map((p) => ({
          ...p,
          offerId: existingOffer.id,
        })),
      });
    }

    return updatedOffer;
  });

  const fullOffer = await prisma.evOffer.findUniqueOrThrow({
    where: { id: offer.id },
    include: {
      vehicle: true,
      pricing: true,
      photos: { orderBy: { sortOrder: "asc" } },
    },
  });

  return c.json({
    id: fullOffer.id,
    userId: fullOffer.userId,
    status: fullOffer.status,
    vehicle: {
      make: fullOffer.vehicle!.make,
      model: fullOffer.vehicle!.model,
      year: fullOffer.vehicle!.year,
      mileageKm: fullOffer.vehicle!.mileageKm,
      batteryCapacityKwh: fullOffer.vehicle!.batteryCapacityKwh,
      rangeKm: fullOffer.vehicle!.rangeKm,
      vin: fullOffer.vehicle!.vin,
      condition: fullOffer.vehicle!.condition,
      color: fullOffer.vehicle!.color,
    },
    pricing: {
      price: Number(fullOffer.pricing!.price),
      currency: fullOffer.pricing!.currency,
      negotiable: fullOffer.pricing!.negotiable,
      warrantyMonths: fullOffer.pricing!.warrantyMonths,
    },
    photos: fullOffer.photos.map((p) => ({
      url: p.url,
      sortOrder: p.sortOrder,
      caption: p.caption,
    })),
    description: fullOffer.description,
    createdAt: fullOffer.createdAt.toISOString(),
    updatedAt: fullOffer.updatedAt.toISOString(),
  });
});
