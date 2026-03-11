import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";

export const healthApp = new OpenAPIHono();

const healthRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Health"],
  summary: "Health check",
  responses: {
    200: {
      description: "Service is healthy",
      content: {
        "application/json": {
          schema: z.object({
            status: z.string(),
            timestamp: z.string(),
          }),
        },
      },
    },
  },
});

healthApp.openapi(healthRoute, (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});
