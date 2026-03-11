import { OpenAPIHono } from "@hono/zod-openapi";
import { authMiddleware } from "../middleware/auth.js";

export const docsApp = new OpenAPIHono();

docsApp.use("*", authMiddleware);

docsApp.doc("/doc", {
  openapi: "3.1.0",
  info: {
    title: "EV Offer API",
    version: "1.0.0",
    description:
      "API for creating and managing electric vehicle sell offers. Supports multi-step draft creation with autosave and final offer submission.",
  },
  servers: [
    {
      url: "/",
      description: "Current environment",
    },
  ],
});

docsApp.get("/swagger", (c) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EV Offer API - Swagger UI</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: '/doc',
      dom_id: '#swagger-ui',
      deepLinking: true,
      presets: [
        SwaggerUIBundle.presets.apis,
        SwaggerUIBundle.SwaggerUIStandalonePreset
      ],
      layout: "BaseLayout"
    });
  </script>
</body>
</html>`;
  return c.html(html);
});
