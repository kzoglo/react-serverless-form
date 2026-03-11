## Web (StaticSite) – Env Injection Notes

- **Component**
  - Defined in `infra/web.ts` as:
    - `new sst.aws.StaticSite("Web", { path: "packages/frontend", build: { command: "pnpm run build", output: "dist" }, environment: { ... } })`.

- **Dynamically injected env vars**
  - `VITE_API_URL` ← `api.url` from `infra/api.ts` (API Gateway HTTP API URL).
  - `VITE_USER_POOL_ID` ← `userPool.id` from `infra/auth.ts` (Cognito User Pool).
  - `VITE_USER_POOL_CLIENT_ID` ← `userPoolClient.id` from `infra/auth.ts` (Cognito app client).
  - `VITE_AWS_REGION` ← `aws.getRegionOutput().name`.

- **How this behaves in different modes**
  - **`sst dev`**
    - SST deploys the API and Cognito resources to AWS.
    - It runs the frontend dev server for `packages/frontend` locally, but **injects the above values as env vars** into the Vite dev process.
    - You do **not** need to manually copy the Cognito IDs or API URL into `.env` for SST‑driven dev; they come from infra.
  - **`sst deploy --stage <name>`**
    - SST builds the frontend (`pnpm run build`) and uploads it as a `StaticSite` (S3 + CloudFront).
    - The same environment mapping is used at build time, so the compiled SPA has the correct:
      - API URL for that stage.
      - Cognito User Pool ID and client ID for that stage.

- **Local frontend without SST**
  - If you run `pnpm --filter @ev-offer/frontend dev` directly, Vite reads from `packages/frontend/.env` instead.
  - That file mirrors the same variables (`VITE_API_URL`, `VITE_USER_POOL_ID`, `VITE_USER_POOL_CLIENT_ID`) but must be filled manually.

