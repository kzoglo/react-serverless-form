# EV Offer - Electric Vehicle Sell Offer Platform

A full-stack serverless application for creating and managing electric vehicle sell offers. Built with React, Hono, Prisma, and deployed on AWS using SST v3.

## Architecture

```
Frontend (Vite + React)     Backend (Hono on Lambda)     Database (Aurora Serverless v2)
┌──────────────────┐       ┌──────────────────────┐     ┌─────────────────────────┐
│  Multi-step Form │──────>│  API Gateway (HTTP)  │────>│  PostgreSQL             │
│  React Hook Form │       │  Lambda Function     │     │  Auto-pause (0 ACU min) │
│  Zod Validation  │       │  Hono + zod-openapi  │     │  Prisma ORM             │
│  Cognito Auth    │       │  Cognito JWT Verify  │     │                         │
│  TanStack Query  │       │  OpenAPI/Swagger     │     │  Tables:                │
└──────────────────┘       └──────────────────────┘     │  - offer_drafts (JSONB) │
S3 + CloudFront                                         │  - ev_offers            │
                                                        │  - ev_vehicles          │
                                                        │  - ev_pricing           │
                                                        │  - ev_photos            │
                                                        └─────────────────────────┘
```

## Infrastructure Relationship Graph

### Deployed stage (`sst deploy`)

```mermaid
flowchart LR
  User[Browser]
  FE[React SPA on S3 + CloudFront]
  Auth[Cognito User Pool + App Client]
  Api[API Gateway HTTP API]
  Fn[Lambda (Hono app)]
  Db[(Aurora Serverless v2)]
  Vpc[VPC]
  Nat[NAT EC2 t4g.nano]
  CM[Cloud Map namespace]
  R53[(Route 53 private zone: sst)]

  User --> FE
  User --> Api
  FE --> Auth
  FE --> Api
  Api --> Fn
  Fn --> Db
  Fn --> Auth
  Fn --> Vpc
  Db --> Vpc
  Nat --> Vpc
  CM --> R53
  CM -.service discovery records.-> Vpc
```

### Local development (`sst dev`)

```mermaid
flowchart LR
  Dev[Developer machine]
  Vite[Vite dev server (frontend)]
  LocalFn[Local Lambda handler process]
  LocalPg[(Local PostgreSQL)]

  Api[API Gateway HTTP API on AWS]
  Auth[Cognito on AWS]
  Vpc[VPC + NAT on AWS]
  CM[Cloud Map namespace]
  R53[(Route 53 private zone: sst)]

  Dev --> Vite
  Vite --> Auth
  Vite --> Api
  Api -.SST live bridge.-> LocalFn
  LocalFn --> LocalPg
  Vpc --> CM
  CM --> R53
```

In `sst dev`, Cognito/API/VPC resources are still real AWS resources, but your handler code runs locally. Because `infra/database.ts` defines `dev.host = "localhost"`, the handler uses local Postgres instead of Aurora in this mode.

## Tech Stack

| Layer          | Technology                                    |
| -------------- | --------------------------------------------- |
| Frontend       | React 19, Vite, Tailwind CSS, React Hook Form |
| Validation     | Zod (shared FE + BE)                          |
| Backend        | Hono, @hono/zod-openapi, AWS Lambda           |
| Database       | Aurora Serverless v2 (PostgreSQL), Prisma ORM  |
| Auth           | AWS Cognito, jose (JWT verification)          |
| Infrastructure | SST v3 (Ion), TypeScript                      |
| API Docs       | OpenAPI 3.1 auto-generated, Swagger UI        |
| Package Mgr    | pnpm workspaces                               |

## Monorepo Structure

```
├── .cursor/rules/          # Cursor AI coding rules
├── infra/                  # SST infrastructure (VPC, Aurora, Cognito, API, Web)
├── packages/
│   ├── core/               # Shared Zod schemas + TypeScript types
│   ├── db/                 # Prisma schema, migrations, client
│   ├── frontend/           # Vite + React SPA
│   └── functions/          # Hono API (Lambda handlers)
├── sst.config.ts           # SST entry point
└── pnpm-workspace.yaml     # Workspace config
```

## Environment variables

- **Backend / Prisma**
  - `DATABASE_URL` (used in `packages/db` and Lambda):
    - Local dev example: defined in `packages/db/.env.example`.
    - In SST stages, this is injected from `infra/database.ts` via the `Aurora` resource.
- **Backend auth**
  - `COGNITO_USER_POOL_ID`:
    - Used by `packages/functions/src/middleware/auth.ts` to verify JWTs.
    - In SST stages, this is injected from `infra/auth.ts` (`userPool.id`) in `infra/api.ts`.
- **Frontend (Vite)**
  - `VITE_API_URL`: Base URL of the API (e.g. `http://localhost:3001` in dev, your API Gateway URL in a stage).
  - `VITE_USER_POOL_ID`: Cognito User Pool ID.
  - `VITE_USER_POOL_CLIENT_ID`: Cognito User Pool client ID.

Copy `packages/db/.env.example` to `packages/db/.env` for local DB work, and `packages/frontend/.env.example` to `packages/frontend/.env` for the SPA. Fill in values after the first `sst dev`/deploy when Cognito and the API endpoint are created.

## Prerequisites

- Node.js >= 20
- pnpm >= 9
- AWS CLI configured with credentials
- Docker (optional, for local PostgreSQL)

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Generate Prisma client

```bash
pnpm db:generate
```

### 3. Local development with SST

SST v3 dev mode deploys real AWS resources and connects them to your local code:

```bash
pnpm dev
```

This starts the SST multiplexer which:
- Deploys VPC, Aurora, Cognito, API Gateway to AWS
- Runs your Lambda functions locally with live reload
- Starts the Vite dev server for the frontend

### 4. Connect to Aurora locally

To access the VPC-protected Aurora database from your local machine:

```bash
# Install the tunnel (one-time)
npx sst tunnel install

# The tunnel starts automatically with `sst dev`
```

### 5. Run database migrations

```bash
# With sst tunnel running:
pnpm db:migrate:dev
```

### 6. Seed the database (optional)

```bash
pnpm db:seed
```

## Local Development with Docker PostgreSQL

For a faster feedback loop, you can run PostgreSQL locally instead of connecting to Aurora:

```bash
# Start local PostgreSQL (or run: pnpm db:postgres)
pnpm db:postgres

# SST automatically detects the dev config in infra/database.ts
# and connects to localhost:5432 instead of Aurora
```

## VPC, Lambda, DB, and bastion (how they connect)

- **Lambda and Aurora in AWS**  
  The API Lambda is attached to the VPC (`infra/api.ts`). When deployed, it runs **inside** the VPC and talks to Aurora over **private IPs** in the same VPC. No bastion is involved in that path.

- **Bastion**  
  The bastion is only for **you** (your laptop) to reach Aurora from outside AWS. Example: run migrations or Prisma Studio against the real Aurora in the VPC. Flow: your machine → SSH/tunnel to bastion (in the VPC) → connect to Aurora’s private endpoint. Lambda never uses the bastion.

- **Local Postgres in dev**  
  With `dev: { host: "localhost", ... }` in `infra/database.ts`, SST does **not** deploy Aurora and injects `DATABASE_URL=localhost:5432`. In `sst dev`, your Lambda handler code runs **locally** on your machine, so “localhost” is your Docker Postgres. No bastion and no Aurora needed for that flow.

- **Single AZ**  
  This repo uses `az: 1` in the VPC so there is one NAT instance (lower always-on cost). Aurora can run in that single AZ for dev; production would typically use more AZs for HA.

### Why NAT/VPC are still in AWS when using local Lambda + local DB

When you run `sst dev`, SST still **deploys the full stack** in AWS: VPC, NAT, API Gateway, Cognito, the Lambda *definition* (with VPC attachment), and optionally Aurora. What runs **locally** is only your Lambda *handler code* (SST proxies API Gateway requests to your machine) and your frontend (Vite). So the infra is real AWS; only execution (and DB target) are overridden.

- **Why Lambda is in a VPC**  
  When the DB is Aurora in AWS, it lives in private subnets. Lambda must be in the same VPC (in private subnets) to reach it. The infra is defined that way for production (and for when you use Aurora in dev).

- **Why the VPC has a NAT**  
  Lambdas in private subnets have no direct internet access. To call the internet (e.g. external APIs, or runtime bootstrap), they need a NAT. So NAT is for “Lambda in VPC → internet.” (Bastion is for “your laptop → VPC.”)

- **Why you still pay for NAT in dev with local DB**  
  SST does not have a “no-VPC” dev mode. It deploys the same stack (including VPC + NAT) and only overrides where the handler runs and which `DATABASE_URL` is injected. So with local Lambda + local Postgres, that Lambda never uses the VPC or NAT at runtime — but the VPC and NAT are still created in AWS. You are paying for a NAT that this particular dev setup does not use; that’s a limitation of how SST dev works (real infra, local execution + optional local DB).

### NAT instance size, spot, and abuse risks

- **Nano instance**  
  SST’s `nat: "ec2"` already uses **t4g.nano** by default (~\$3–6/month per instance). That’s the smallest option and is enough for light dev traffic. No need to change anything for “cheapest” NAT.  
  **Important**: `nat: "ec2"` means “EC2 instance acting as NAT”, **not** the AWS managed NAT Gateway (~\$32+/month). You are paying t4g.nano EC2 prices here, not NAT Gateway prices.

- **Spot instances for NAT**  
  Using spot for the NAT instance is **not recommended**. Spot can be reclaimed with short notice; when the NAT is gone, Lambdas in the VPC lose all outbound internet (and your stack is broken until a new NAT is up). SST’s VPC component does not offer a “use spot for NAT” option; NAT is meant to be stable. Stick with on-demand for NAT.

- **Risks of running constantly (external abuse)**  
  The API Gateway URL is public. In this app, **only** these routes are unauthenticated: `GET /health`, `GET /doc`, `GET /swagger`. All `/drafts` and `/offers` require a Cognito JWT. So an attacker cannot access your data, but they **can** hit the public endpoints in a loop (DoS) and drive **Lambda invocations + API Gateway request** costs. Mitigations: (1) Set an **AWS Budget** with email alerts (e.g. \$5–10) so you notice spikes. (2) Avoid sharing the API URL; use it only from your frontend or tools. (3) Optionally add rate limiting or require auth for `/doc` and `/swagger` in production. There is no “someone steals your data via the API” risk as long as Cognito stays on the protected routes; the only real risk is request-volume abuse on the few public endpoints.

### Rate limiting (app-level)

The API uses **hono-rate-limiter** middleware: **200 requests per 15 minutes per IP** (keyed by `X-Forwarded-For` or `X-Real-IP` from API Gateway). Responses include `RateLimit-*` headers; over-limit calls get **429 Too Many Requests**.

- **Current store:** in-memory (default). With Lambda, each instance has its own memory, so the effective limit is per-instance, not global. Fine for dev and light use.
- **Production / multi-instance:** for a strict global limit across all Lambda invocations, use a shared store (e.g. **Redis** via [Upstash](https://upstash.com) or **DynamoDB**). See [hono-rate-limiter stores](https://honohub.dev/docs/rate-limiter/stores) and pass a `store` option into `rateLimiter()` in `packages/functions/src/app.ts`.

## API Documentation

When running locally, the Swagger UI is available at:

```
http://localhost:<port>/swagger
```

The raw OpenAPI JSON spec is at:

```
http://localhost:<port>/doc
```

## Deployment

### Deploy to a stage

```bash
# Deploy to dev
npx sst deploy --stage dev

# Deploy to production
npx sst deploy --stage production
```

### Run production migrations

```bash
# Set DATABASE_URL to the production Aurora connection string
pnpm db:migrate:deploy
```

### Remove a stage

```bash
npx sst remove --stage dev
```

## Cost Optimization

This project is optimized for hobby/development use. API Gateway is set up in [`infra/api.ts`](infra/api.ts) via `sst.aws.ApiGatewayV2` and `api.route()`.

### With free tier (12 months)

| Resource             | Idle Cost        | Notes                              |
| -------------------- | ---------------- | ---------------------------------- |
| Aurora Serverless v2 | ~$0.10/GB/month  | Auto-pauses to 0 ACU after 5 min  |
| Lambda               | $0               | Free tier: 1M requests/month       |
| API Gateway (HTTP)   | $0               | Free tier: 1M requests/month       |
| S3 + CloudFront      | ~$0.01/month     | Static SPA hosting                 |
| Cognito              | $0               | Free tier: 50K MAU                 |
| NAT (EC2 t4g.nano)   | ~$3–6/month      | Always on (see `nat: "ec2"` in vpc.ts) |
| Route 53 (private)   | ~$0.50/month     | SST-created; see below                |
| **Total (idle)**     | **~$4.50–7.50/month** | Aurora storage + NAT + Route 53   |

### Without free tier (pay-as-you-go)

| Resource             | Cost (approx)          | Notes                                      |
| -------------------- | ---------------------- | ------------------------------------------ |
| Aurora Serverless v2 | ~$0.10/GB/month paused | Storage only when idle                     |
| Aurora (when active) | ~$0.12/ACU/hour        | 0.5 ACU × 720 hr ≈ $43/mo if never pauses |
| Lambda               | $0.20/1M req + GB-sec  | 1M × 512MB×200ms ≈ $2                     |
| API Gateway (HTTP)   | $1.00/1M requests      |                                            |
| S3 + CloudFront      | ~$0.50–1/month         | Light static traffic                       |
| Cognito              | $0.0055/MAU            | 1K MAU ≈ $5.50                             |
| NAT (EC2 t4g.nano)   | ~$3–6/month            | Always on                                  |
| Route 53 (private)   | ~$0.50/month           | SST-created; see below                     |
| **Total (idle)**     | **~$5.50–9.50/month**  | Aurora storage + NAT + Route 53 + minimal   |
| **Total (100K req/mo)** | **~$5.50–9.50/month** | Above + Lambda + API Gateway               |

### Route 53 private hosted zone (SST-created)

SST v3 creates a **private** Route 53 hosted zone (named `sst`) in your AWS account when you deploy resources inside a VPC. You do not define it in your infra code; it is created by SST’s platform under the hood.

- **What it does**  
  SST uses **AWS Cloud Map** for service discovery. Cloud Map creates this private hosted zone and associates it with your VPC. Resources in the VPC (e.g. Lambda, Aurora) use it for **internal DNS resolution** so they can discover and reach each other by name. It is not used for public domains or browser traffic.

- **Why it’s needed**  
  With Lambda and Aurora in the same VPC, SST/Cloud Map needs a way for services to resolve each other’s endpoints inside the VPC. The private hosted zone holds the DNS records that Cloud Map manages for that.

- **Cost**  
  AWS charges about **$0.50/month** per private hosted zone (plus a very small per-query fee; negligible for typical dev traffic). This appears in the console as “Amazon Route 53” and is separate from any domain you might register.

- **Removal**  
  Running `sst remove --stage <stage>` tears down the stack and deletes this zone, so the Route 53 charge stops for that stage.

Aurora auto-pause is configured with:
- Minimum: 0 ACU (pauses when idle)
- Maximum: 4 ACU
- Pause after: 5 minutes of no connections
- Resume time: ~15 seconds on first connection

### Aurora Serverless v2: How costs are calculated

Aurora Serverless v2 has three cost components (prices below are for **Aurora Standard** in US East N. Virginia; [actual prices vary by region](https://aws.amazon.com/rds/aurora/pricing/)):

| Component | Unit | Rate (Aurora Standard) | Notes |
| --------- | ---- | ---------------------- | ----- |
| **ACU (compute)** | Per ACU-hour, billed per second | ~$0.12/ACU-hour | 1 ACU ≈ 2 GiB memory + CPU + networking. Min 0.5 ACU when running; 0 ACU when paused = no compute charge. |
| **Storage** | Per GB-month | ~$0.10/GB-month | One copy of data (replicated across 3 AZs for durability; you pay for one). |
| **I/O** | Per 1M requests | ~$0.20/1M I/O ops | Both read and write I/O operations. |

**Example (idle/paused):** 10 GB storage × $0.10 = **$1/month**. No ACU or I/O when paused.

**Example (active, light use):** 0.5 ACU for 2 hours/day × 30 days ≈ 30 ACU-hours × $0.12 ≈ **$3.60** compute. Add storage and I/O.

**Aurora I/O-Optimized** – Higher ACU (~$0.156/ACU-hour) and storage (~$0.225/GB-month), but **$0 for I/O**. Use when I/O spend exceeds ~25% of total database cost; can save up to ~40%. This project uses Aurora Standard (default).

## Key Design Decisions

- **No RDS Proxy**: Saves ~$20/month. Prisma singleton with `connection_limit=1` is sufficient for low-traffic hobby use.
- **Prisma client engine**: No Rust binary, smaller Lambda bundles, faster cold starts.
- **Hono over raw handlers**: Provides routing, middleware, CORS, and OpenAPI generation for free.
- **Draft as JSONB**: Autosaved form data is stored as a single JSON field for flexibility. Normalized only on final submit.
- **Shared Zod schemas**: Single source of truth for validation on both frontend and backend.

## Lambda & API Gateway: How It Works

### Setup in `infra/api.ts`

- `new sst.aws.ApiGatewayV2("Api", {...})` creates the HTTP API.
- `api.route("$default", { handler: "...", memory: "512 MB", ... })` wires the **default route** to a single Lambda. The `memory`, `timeout`, `environment`, `vpc`, `link` options are all **Lambda function settings** for that route.
- This project also sets `concurrency.reserved` on the route’s Lambda to cap peak parallel executions (see `infra/api.ts`). In the single-Lambda setup, this cap applies to **all** API paths.

### What `$default` means

`$default` is the **catch-all route** in API Gateway v2. It matches every method and path that doesn’t have a more specific route. Right now, all requests go to the same Lambda handler; you could add more specific routes (e.g. `GET /health` → different Lambda or EC2) if needed.

### Two routing layers

1. **API Gateway layer** – `$default` → one Lambda. API Gateway doesn’t know about `/health`, `/drafts`, `/offers`; it just forwards everything to that function.
2. **Hono layer** (inside Lambda) – In `packages/functions/src/app.ts`, the Hono app routes by path:
   - `/health` → healthApp
   - `/drafts` → draftsApp
   - `/offers` → offersApp
   - `/` → docsApp

So from the client’s perspective nothing changes; routing happens inside the Lambda.

### Single Lambda vs multiple Lambdas

| Approach | How it works | When to use |
| -------- | ------------ | ----------- |
| **Single Lambda** (this project) | One deployment, Hono routes by path inside. Every request invokes the same Lambda; each request is a separate invocation. | Hobby, low-traffic, simpler ops. |
| **Multiple Lambdas** | One API Gateway route per Lambda (e.g. `GET /drafts` → Lambda A, `POST /offers` → Lambda B). | When you need per-path isolation, sizing, or independent deploys. |
| **Mixed** | Some routes to Lambda, others to EC2 or other backends via API Gateway HTTP integrations. | Migrating or mixing serverless with existing servers. |

### Concurrency: single vs multiple Lambdas

- **Account limit** – Your account has a max concurrent Lambda executions (often 1000). Each invocation uses one slot.

- **Single Lambda** – All paths share one concurrency pool. If you set reserved concurrency to 20, a burst on `/health` and `/drafts` together can exhaust it; **all paths** throttle when that limit is hit. One noisy path can starve others.

- **Multiple Lambdas** – You split reserved concurrency per function (e.g. drafts = 50, offers = 50, health = 10). Each path has its own pool; one overloaded path doesn’t affect the rest. You give more capacity to critical paths and less to noisy ones.

### Cold starts, reserved concurrency, and provisioned concurrency

- **Cold start**: When Lambda needs to spin up a new execution environment (new container). This can add latency on the first request handled by that new instance. Warm instances reuse the environment and are faster.

- **Reserved concurrency** (what this repo sets): A **hard cap** on the maximum number of concurrent executions for a function. It helps control load and protects your downstream resources (like Aurora), but it **does not** eliminate cold starts. If traffic exceeds the cap, Lambda throttles and API Gateway returns 429s.

- **Provisioned concurrency**: Keeps a specific number of Lambda instances **warm and ready**, which reduces cold starts for that many concurrent requests. It **costs extra** (you pay for the provisioned capacity even when idle). In SST v3, provisioned concurrency requires function versioning.

In a **single-Lambda** design, provisioned concurrency would warm the one “router” Lambda that serves all routes. In a **multi-Lambda** design, you can apply provisioned concurrency only to the few critical endpoints that need consistent low latency.

### When to use which

- **Hobby / low-traffic** – One Lambda is usually enough. Simpler to build and operate.
- **Production** – Often still one Lambda. Split into multiple Lambdas when you need:
  - **Isolation** – One noisy endpoint shouldn’t affect others.
  - **Per-path sizing** – Different memory/timeout per endpoint.
  - **Independent deploys** – Separate teams owning different services.
  - **Blast radius** – Limit impact of a bad deployment to one Lambda.

## Before first push (security)

Run these from the repo root before publishing to GitHub:

1. **Tracked env / key material** — Ensure no real secrets are committed: `git ls-files` should not list `.env` (except documented `*.env.example` patterns you intend to ship), private keys, or credential bundles. Quick filters: `git ls-files | rg -i '\.env$|\.pem$|id_rsa|credentials|\.pfx$'` and `git ls-files | rg '^\.env\.'` — both should be empty unless you explicitly version a non-example env file (avoid).
2. **Skim docs** — Re-read this README and any other high-churn markdown for pasted tokens; placeholders like `your-api-key` are fine.
3. **Infra + packages spot-check** — `infra/database.ts` uses `password: "password"` only under SST’s **`dev`** block for local Postgres (Docker-style default), not production Aurora credentials. Lambda and Amplify use env / `import.meta.env` at runtime; keep real values in gitignored `.env` files. Example URLs live in `packages/db/.env.example` by design.
4. **High-signal grep (optional repeat)** — `git grep -nE 'AKIA[0-9A-Z]{16}|sk_live_|BEGIN [A-Z ]*PRIVATE KEY|ghp_[A-Za-z0-9]{36}' -- infra packages` — expect no matches for AWS access keys, Stripe live keys, PEM blocks, or GitHub PATs.
5. **Stronger tooling (optional)** — Run [git-secrets](https://github.com/awslabs/git-secrets) or [gitleaks](https://github.com/gitleaks/gitleaks) locally; enable GitHub **secret scanning** on the repository after the first push.

If a secret was ever committed, `.gitignore` alone does not remove it from history—fix with history rewrite (e.g. `git filter-repo`) **before** pushing, or assume the secret is compromised.
