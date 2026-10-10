-- Database Implementation Plan — Migration 10 (Shipment Foundation). Two brand-new tables
-- ("shipments", "shipment_items"), plus one additive extension to Migration 9's "containers"
-- table (adding the "shipment_id" nullable column + its FK — deliberately deferred at that
-- time because "shipments" didn't exist yet). This is the ONLY statement touching a
-- pre-existing table in this file, and it is purely additive: ADD COLUMN (nullable, no
-- default-required backfill) + ADD CONSTRAINT (a new FK, not a change to any existing
-- constraint) + a new index. No column is dropped, renamed, or retyped; no existing row is
-- touched (containers has 0 rows at migration time, confirmed beforehand). "sales_orders" and
-- "packing_orders" each only gain Prisma-side virtual relation arrays, which generate no SQL
-- of their own. Migration 9's own migration.sql file is not modified in any way — this is a
-- new, separate migration file. "admins" and "admin_activity_logs" are not referenced anywhere
-- in this file. The six pre-existing CMS tables containing "shipment" in their name
-- (shipment_loading_locations, shipment_container_types, shipment_schedule_steps,
-- shipment_documents, shipment_commitment_items, about_company_shipment_terms_section) are not
-- referenced anywhere below. Hand-written (not `prisma migrate dev`), same reason as
-- Migrations 1-9: this database has a pre-existing, already-documented false-positive drift on
-- `ai_knowledge_chunks`'s generated tsvector column that makes Prisma's shadow-database diff
-- tooling misbehave. This file touches nothing related to that table.

-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('draft', 'planned', 'loaded', 'in_transit', 'delivered', 'cancelled');

-- CreateTable
CREATE TABLE "shipments" (
    "id" TEXT NOT NULL,
    "shipment_number" TEXT NOT NULL,
    "sales_order_id" TEXT NOT NULL,
    "status" "ShipmentStatus" NOT NULL DEFAULT 'draft',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipment_items" (
    "id" TEXT NOT NULL,
    "shipment_id" TEXT NOT NULL,
    "packing_order_id" TEXT NOT NULL,
    "quantity" DECIMAL(14,2) NOT NULL,
    "unit" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipment_items_pkey" PRIMARY KEY ("id")
);

-- AlterTable: additive only — adds one new nullable column to the pre-existing "containers"
-- table from Migration 9. No existing column is changed; no row is touched (0 rows present).
ALTER TABLE "containers" ADD COLUMN "shipment_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "shipments_shipment_number_key" ON "shipments"("shipment_number");

-- CreateIndex
CREATE INDEX "shipments_sales_order_id_idx" ON "shipments"("sales_order_id");

-- CreateIndex
CREATE INDEX "shipments_status_idx" ON "shipments"("status");

-- CreateIndex
CREATE INDEX "shipments_created_at_idx" ON "shipments"("created_at");

-- CreateIndex
CREATE INDEX "shipment_items_shipment_id_idx" ON "shipment_items"("shipment_id");

-- CreateIndex
CREATE INDEX "shipment_items_packing_order_id_idx" ON "shipment_items"("packing_order_id");

-- CreateIndex
CREATE INDEX "containers_shipment_id_idx" ON "containers"("shipment_id");

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_sales_order_id_fkey" FOREIGN KEY ("sales_order_id") REFERENCES "sales_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment_items" ADD CONSTRAINT "shipment_items_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "shipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment_items" ADD CONSTRAINT "shipment_items_packing_order_id_fkey" FOREIGN KEY ("packing_order_id") REFERENCES "packing_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "containers" ADD CONSTRAINT "containers_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "shipments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
