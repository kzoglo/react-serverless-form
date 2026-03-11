# Database Workflows (`packages/db`)

This package contains Prisma schema, migrations, and seed logic for the project.

## How environment selection works

Prisma does not use separate named "dev/prod profiles" here.  
It uses the database URL from:

- `packages/db/prisma.config.ts` -> `datasource.url = process.env.DATABASE_URL`

So the target database is whichever `DATABASE_URL` is currently set:

- local Postgres in dev (`packages/db/.env`)
- Aurora (or another remote DB) in deployed environments

## Scripts

From `packages/db/package.json`:

- `db:migrate:dev` -> `prisma migrate dev`
- `db:migrate:deploy` -> `prisma migrate deploy`
- `db:seed` -> `prisma db seed`
- `db:generate` -> `prisma generate`
- `db:push` -> `prisma db push` (dev only)

## Prisma Client (`prisma generate`)

`prisma generate` reads your schema and **generates the Prisma Client** (TypeScript/JS code) that your app imports to run queries. It does not touch the database.

Run it:

- After `pnpm install` (or when pulling the repo)
- After changing `schema.prisma`
- Before running the app or seed if the client is missing or stale

From the repo root: `pnpm db:generate`. The generated output lives under `packages/db/generated/` (see schema `output` / Prisma 7 config).

## `migrate dev` vs `migrate deploy`

### `prisma migrate dev`

Use for local development.

- Compares `schema.prisma` with migration history
- Creates new migration files when schema changes
- Applies migrations to the target database
- Developer/interactive workflow

### `prisma migrate deploy`

Use for CI/CD or production deployment.

- Applies existing migration files only
- Does not create new migrations
- Non-interactive and safer for production

## Seed behavior

Seed is configured in `prisma.config.ts`:

- `migrations.seed = "tsx seed.ts"`

It is not run on app startup. Run it explicitly:

```bash
pnpm db:seed
```

## Prisma Client singleton (`packages/db/src/client.ts`)

We use a **process-wide PrismaClient singleton** so that hot reloads and repeated imports do not open extra DB connections:

```ts
// packages/db/src/client.ts
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/client/client.js";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const adapter = new PrismaPg({
    connectionString,
    pool: { max: 1 },
    connectionTimeoutMillis: 30_000,
  });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

- **`globalThis`** is the standard JavaScript global object (Node, browser, workers).  
- We cast it to `{ prisma: PrismaClient | undefined }` so TypeScript knows about the `prisma` property.  
- On first import we create the client; on subsequent imports (and hot reloads in dev) we reuse `globalForPrisma.prisma` instead of creating a new connection pool.

In Lambda, each warm execution environment will still have at most **one** PrismaClient instance because we also keep `pool: { max: 1 }` on the adapter.

## Typical workflows

### Local dev

```bash
pnpm db:generate
pnpm db:migrate:dev
pnpm db:seed
```

### Production / deployed stage

```bash
# Set DATABASE_URL to production DB first
pnpm db:migrate:deploy
```

