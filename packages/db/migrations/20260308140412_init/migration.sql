-- CreateEnum
CREATE TYPE "draft_status" AS ENUM ('draft', 'submitted');

-- CreateEnum
CREATE TYPE "offer_status" AS ENUM ('active', 'sold', 'archived');

-- CreateTable
CREATE TABLE "offer_drafts" (
    "id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "current_step" INTEGER NOT NULL DEFAULT 1,
    "data" JSONB NOT NULL DEFAULT '{}',
    "status" "draft_status" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "offer_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ev_offers" (
    "id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "draft_id" UUID NOT NULL,
    "status" "offer_status" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "ev_offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ev_vehicles" (
    "id" UUID NOT NULL,
    "offer_id" UUID NOT NULL,
    "make" VARCHAR(100) NOT NULL,
    "model" VARCHAR(100) NOT NULL,
    "year" INTEGER NOT NULL,
    "mileage_km" INTEGER NOT NULL,
    "battery_capacity_kwh" DOUBLE PRECISION NOT NULL,
    "range_km" INTEGER NOT NULL,
    "vin" VARCHAR(17),
    "condition" VARCHAR(20) NOT NULL,
    "color" VARCHAR(50) NOT NULL,

    CONSTRAINT "ev_vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ev_pricing" (
    "id" UUID NOT NULL,
    "offer_id" UUID NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "negotiable" BOOLEAN NOT NULL DEFAULT false,
    "warranty_months" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ev_pricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ev_photos" (
    "id" UUID NOT NULL,
    "offer_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "caption" VARCHAR(200),

    CONSTRAINT "ev_photos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "offer_drafts_user_id_idx" ON "offer_drafts"("user_id");

-- CreateIndex
CREATE INDEX "offer_drafts_status_idx" ON "offer_drafts"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ev_offers_draft_id_key" ON "ev_offers"("draft_id");

-- CreateIndex
CREATE INDEX "ev_offers_user_id_idx" ON "ev_offers"("user_id");

-- CreateIndex
CREATE INDEX "ev_offers_status_idx" ON "ev_offers"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ev_vehicles_offer_id_key" ON "ev_vehicles"("offer_id");

-- CreateIndex
CREATE UNIQUE INDEX "ev_pricing_offer_id_key" ON "ev_pricing"("offer_id");

-- CreateIndex
CREATE INDEX "ev_photos_offer_id_idx" ON "ev_photos"("offer_id");

-- AddForeignKey
ALTER TABLE "ev_offers" ADD CONSTRAINT "ev_offers_draft_id_fkey" FOREIGN KEY ("draft_id") REFERENCES "offer_drafts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ev_vehicles" ADD CONSTRAINT "ev_vehicles_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "ev_offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ev_pricing" ADD CONSTRAINT "ev_pricing_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "ev_offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ev_photos" ADD CONSTRAINT "ev_photos_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "ev_offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
