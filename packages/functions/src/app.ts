import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { rateLimiter } from "hono-rate-limiter";
import { errorHandler } from "./middleware/error.js";
import { docsApp } from "./routes/docs.js";
import { draftsApp } from "./routes/drafts.js";
import { healthApp } from "./routes/health.js";
import { offersApp } from "./routes/offers.js";

export type AppEnv = {
  Variables: {
    userId: string;
  };
};

const app = new OpenAPIHono<AppEnv>();

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400,
  }),
);

app.use(
  "*",
  rateLimiter({
    windowMs: 15 * 60 * 1000,
    limit: 200,
    keyGenerator: (c) => {
      const forwarded = c.req.header("x-forwarded-for");
      const first = forwarded?.split(",")[0];
      const ip = first?.trim() ?? c.req.header("x-real-ip") ?? "anonymous";
      return ip;
    },
  }),
);

app.onError(errorHandler);

app.route("/health", healthApp);
app.route("/drafts", draftsApp);
app.route("/offers", offersApp);
app.route("/", docsApp);

export { app };
