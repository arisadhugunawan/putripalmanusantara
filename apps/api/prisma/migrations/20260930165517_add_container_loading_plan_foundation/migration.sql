-- Database Implementation Plan — Migration 9 (Container + Loading Plan Foundation). Two
-- brand-new tables, following the previously-approved Gap Analysis's own locked FK plan
-- (LoadingPlan.containerId → Container: 1:1, required, Cascade), replacing an earlier,
-- materially-conflicting draft design that was not implemented. No "shipment_id" column is
-- created on "containers" in this migration — the Gap Analysis locks that FK as nullable, but
-- the "Shipment" table does not exist yet; creating it early or adding a dummy placeholder was
-- explicitly ruled out. The future Shipment migration will add "containers.shipment_id" as a
-- purely additive column + FK later, the same pattern already proven safe in this sequence by
-- "weighbridge_transactions.vehicle_id" (added as a plain column in Migration 6, converted to a
-- real FK in Migration 7). Zero existing tables are touched at the column level in this
-- migration — neither new table references any pre-existing table, so there is nothing for any
-- other table to gain a virtual relation array for, and no ALTER TABLE on a pre-existing table
-- appears anywhere in this file. The five pre-existing "shipment_*" CMS tables
-- (shipment_loading_locations, shipment_container_types, shipment_schedule_steps,
-- shipment_documents, shipment_commitment_items) are public marketing-content tables, confirmed
-- unrelated, and are not referenced anywhere below. "admins" and "admin_activity_logs" are not
-- referenced anywhere in this file either. Hand-written (not `prisma migrate dev`), same reason
-- as Migrations 1-8: this database has a pre-existing, already-documented false-positive drift
-- on `ai_knowledge_chunks`'s generated tsvector column that makes Prisma's shadow-database diff
-- tooling misbehave. This file touches nothing related to that table.

-- CreateEnum
CREATE TYPE "ContainerStatus" AS ENUM ('available', 'loading', 'loaded', 'cancelled');

-- CreateEnum
CREATE TYPE "LoadingPlanStatus" AS ENUM ('planned', 'in_progress', 'completed', 'cancelled');

-- CreateTable
CREATE TABLE "containers" (
    "id" TEXT NOT NULL,
    "container_number" TEXT NOT NULL,
    "container_type" TEXT NOT NULL,
    "status" "ContainerStatus" NOT NULL DEFAULT 'available',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "containers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loading_plans" (
    "id" TEXT NOT NULL,
    "container_id" TEXT NOT NULL,
    "status" "LoadingPlanStatus" NOT NULL DEFAULT 'planned',
    "planned_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loading_plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "containers_container_number_key" ON "containers"("container_number");

-- CreateIndex
CREATE INDEX "containers_status_idx" ON "containers"("status");

-- CreateIndex
CREATE UNIQUE INDEX "loading_plans_container_id_key" ON "loading_plans"("container_id");

-- CreateIndex
CREATE INDEX "loading_plans_status_idx" ON "loading_plans"("status");

-- AddForeignKey
ALTER TABLE "loading_plans" ADD CONSTRAINT "loading_plans_container_id_fkey" FOREIGN KEY ("container_id") REFERENCES "containers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
