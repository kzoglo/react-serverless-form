import type { ErrorHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";

export const errorHandler: ErrorHandler = (err, c) => {
  const requestId = c.req.header("x-amzn-requestid") || "unknown";

  if (err instanceof HTTPException) {
    return c.json(
      {
        error: {
          code: `HTTP_${err.status}`,
          message: err.message,
          requestId,
        },
      },
      err.status,
    );
  }

  if (err instanceof ZodError) {
    return c.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed",
          details: err.errors.map((e) => ({
            path: e.path.join("."),
            message: e.message,
          })),
          requestId,
        },
      },
      400,
    );
  }

  console.error("Unhandled error:", {
    message: err.message,
    stack: err.stack,
    requestId,
  });

  return c.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
        requestId,
      },
    },
    500,
  );
};
