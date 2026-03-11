import {
  createDraftSchema,
  draftResponseSchema,
  type StepNumber,
  stepSchemas,
  TOTAL_STEPS,
} from "@ev-offer/core";
import { DraftStatus } from "@ev-offer/db/enums";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import type { AppEnv } from "../app.js";
import { prisma } from "../lib/db.js";
import { authMiddleware } from "../middleware/auth.js";

export const draftsApp = new OpenAPIHono<AppEnv>();

draftsApp.use("*", authMiddleware);

// ── POST /drafts ─────────────────────────────────────────────────────

const createDraftRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Drafts"],
  summary: "Create a new draft",
  request: {
    body: {
      content: {
        "application/json": {
          schema: createDraftSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Draft created",
      content: {
        "application/json": {
          schema: draftResponseSchema,
        },
      },
    },
  },
});

draftsApp.openapi(createDraftRoute, async (c) => {
  const userId = c.get("userId");

  const draft = await prisma.offerDraft.create({
    data: {
      userId,
      currentStep: 1,
      data: {},
      status: DraftStatus.draft,
    },
  });

  return c.json(
    {
      id: draft.id,
      userId: draft.userId,
      currentStep: draft.currentStep,
      data: draft.data as Record<string, unknown>,
      status: draft.status,
      createdAt: draft.createdAt.toISOString(),
      updatedAt: draft.updatedAt.toISOString(),
    },
    201,
  );
});

// ── GET /drafts ──────────────────────────────────────────────────────

const listDraftsRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Drafts"],
  summary: "List user drafts",
  responses: {
    200: {
      description: "List of drafts",
      content: {
        "application/json": {
          schema: z.array(draftResponseSchema),
        },
      },
    },
  },
});

draftsApp.openapi(listDraftsRoute, async (c) => {
  const userId = c.get("userId");

  const drafts = await prisma.offerDraft.findMany({
    where: { userId, status: DraftStatus.draft },
    orderBy: { updatedAt: "desc" },
  });

  return c.json(
    drafts.map((d) => ({
      id: d.id,
      userId: d.userId,
      currentStep: d.currentStep,
      data: d.data as Record<string, unknown>,
      status: d.status,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    })),
  );
});

// ── GET /drafts/:id ──────────────────────────────────────────────────

const getDraftRoute = createRoute({
  method: "get",
  path: "/{id}",
  tags: ["Drafts"],
  summary: "Get a draft by ID",
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      description: "Draft details",
      content: {
        "application/json": {
          schema: draftResponseSchema,
        },
      },
    },
  },
});

draftsApp.openapi(getDraftRoute, async (c) => {
  const userId = c.get("userId");
  const { id } = c.req.valid("param");

  const draft = await prisma.offerDraft.findFirst({
    where: { id, userId },
  });

  if (!draft) {
    throw new HTTPException(404, { message: "Draft not found" });
  }

  return c.json({
    id: draft.id,
    userId: draft.userId,
    currentStep: draft.currentStep,
    data: draft.data as Record<string, unknown>,
    status: draft.status,
    createdAt: draft.createdAt.toISOString(),
    updatedAt: draft.updatedAt.toISOString(),
  });
});

// ── PUT /drafts/:id/steps/:step ──────────────────────────────────────

const updateStepRoute = createRoute({
  method: "put",
  path: "/{id}/steps/{step}",
  tags: ["Drafts"],
  summary: "Save step data (autosave)",
  request: {
    params: z.object({
      id: z.string().uuid(),
      step: z.string().regex(/^[1-3]$/),
    }),
    body: {
      content: {
        "application/json": {
          schema: z.record(z.string(), z.unknown()),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Step data saved",
      content: {
        "application/json": {
          schema: draftResponseSchema,
        },
      },
    },
  },
});

draftsApp.openapi(updateStepRoute, async (c) => {
  const userId = c.get("userId");
  const { id, step: stepStr } = c.req.valid("param");
  const stepNumber = parseInt(stepStr, 10) as StepNumber;
  const body = c.req.valid("json");

  const stepSchema = stepSchemas[stepNumber];
  if (!stepSchema) {
    throw new HTTPException(400, { message: `Invalid step number: ${stepStr}` });
  }

  const parsed = stepSchema.safeParse(body);
  if (!parsed.success) {
    throw new HTTPException(400, {
      message:
        "Step data validation failed: " +
        parsed.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", "),
    });
  }

  const draft = await prisma.offerDraft.findFirst({
    where: { id, userId, status: DraftStatus.draft },
  });

  if (!draft) {
    throw new HTTPException(404, { message: "Draft not found" });
  }

  const existingData = (draft.data as Record<string, unknown>) || {};
  const mergedData = { ...existingData, ...parsed.data };
  const nextStepNumber = Math.min(stepNumber + 1, TOTAL_STEPS);

  const updated = await prisma.offerDraft.update({
    where: { id },
    data: {
      data: mergedData,
      currentStep: nextStepNumber,
    },
  });

  return c.json({
    id: updated.id,
    userId: updated.userId,
    currentStep: updated.currentStep,
    data: updated.data as Record<string, unknown>,
    status: updated.status,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  });
});

// ── DELETE /drafts/:id ───────────────────────────────────────────────

const deleteDraftRoute = createRoute({
  method: "delete",
  path: "/{id}",
  tags: ["Drafts"],
  summary: "Delete a draft",
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      description: "Draft deleted",
      content: {
        "application/json": {
          schema: z.object({ success: z.boolean() }),
        },
      },
    },
  },
});

draftsApp.openapi(deleteDraftRoute, async (c) => {
  const userId = c.get("userId");
  const { id } = c.req.valid("param");

  const draft = await prisma.offerDraft.findFirst({
    where: { id, userId },
  });

  if (!draft) {
    throw new HTTPException(404, { message: "Draft not found" });
  }

  await prisma.offerDraft.delete({ where: { id } });

  return c.json({ success: true });
});
