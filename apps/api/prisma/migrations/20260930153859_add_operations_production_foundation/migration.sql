-- Database Implementation Plan — Migration 7 (Vehicle + Production + Batch Traceability
-- Foundation). Five brand-new tables. Existing tables touched at the column level: only
-- "weighbridge_transactions" (a FOREIGN KEY constraint is ADDED on its pre-existing, unchanged
-- "vehicle_id" column — the column's type and nullability are untouched; verified beforehand
-- that 0 of 0 existing rows have a non-null vehicle_id, so this is a pure additive constraint
-- with nothing to violate) and the "inventory_movement_type" enum (two new values appended via
-- ADD VALUE — additive, no existing row or value touched). "products" and "warehouses" each
-- only gain Prisma-side virtual relation arrays, which generate no SQL of their own. "admins",
-- "admin_activity_logs", and "facilities" are not referenced anywhere in this file. No
-- ProductionOutput table is created — output traceability is represented via new InventoryLot
-- rows plus InventoryMovement rows using the two new enum values, both already-existing tables
-- from Migration 6, unmodified beyond the enum extension. No Packing/Loading/Container/
-- Shipment/Invoice/Payment/StockReservation/SalesAllocation table is created here (out of
-- scope). Hand-written (not `prisma migrate dev`), same reason as Migrations 1-6: this database
-- has a pre-existing, already-documented false-positive drift on `ai_knowledge_chunks`'s
-- generated tsvector column that makes Prisma's shadow-database diff tooling misbehave. This
-- file touches nothing related to that table.

-- AlterEnum: additive only — appends two new values to the existing InventoryMovementType enum
-- created in Migration 6. No existing value renamed or removed, no row touched (inventory_movements
-- has 0 rows).
ALTER TYPE "InventoryMovementType" ADD VALUE 'production_in';
ALTER TYPE "InventoryMovementType" ADD VALUE 'production_out';

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('active', 'inactive', 'maintenance');

-- CreateEnum
CREATE TYPE "ProductionOrderStatus" AS ENUM ('draft', 'planned', 'in_progress', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "ProductionBatchStatus" AS ENUM ('planned', 'in_progress', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "HeatingStatus" AS ENUM ('planned', 'in_progress', 'completed', 'cancelled');

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "vehicle_number" TEXT NOT NULL,
    "license_plate" TEXT NOT NULL,
    "vehicle_type" TEXT NOT NULL,
    "ownership_type" TEXT,
    "capacity" DECIMAL(14,2),
    "unit" TEXT,
    "status" "VehicleStatus" NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_orders" (
    "id" TEXT NOT NULL,
    "production_number" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "warehouse_id" TEXT,
    "planned_quantity" DECIMAL(14,2) NOT NULL,
    "unit" TEXT NOT NULL,
    "status" "ProductionOrderStatus" NOT NULL DEFAULT 'draft',
    "planned_start_at" TIMESTAMP(3),
    "planned_end_at" TIMESTAMP(3),
    "actual_start_at" TIMESTAMP(3),
    "actual_end_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "production_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_batches" (
    "id" TEXT NOT NULL,
    "batch_number" TEXT NOT NULL,
    "production_order_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "warehouse_id" TEXT,
    "planned_quantity" DECIMAL(14,2),
    "actual_quantity" DECIMAL(14,2),
    "unit" TEXT NOT NULL,
    "status" "ProductionBatchStatus" NOT NULL DEFAULT 'planned',
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "production_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_inputs" (
    "id" TEXT NOT NULL,
    "production_batch_id" TEXT NOT NULL,
    "inventory_lot_id" TEXT NOT NULL,
    "inventory_id" TEXT,
    "product_id" TEXT NOT NULL,
    "quantity" DECIMAL(14,2) NOT NULL,
    "unit" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "production_inputs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "heating_batches" (
    "id" TEXT NOT NULL,
    "heating_number" TEXT NOT NULL,
    "production_batch_id" TEXT NOT NULL,
    "status" "HeatingStatus" NOT NULL DEFAULT 'planned',
    "input_quantity" DECIMAL(14,2),
    "output_quantity" DECIMAL(14,2),
    "unit" TEXT,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "heating_batches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_vehicle_number_key" ON "vehicles"("vehicle_number");

-- CreateIndex
CREATE INDEX "vehicles_status_idx" ON "vehicles"("status");

-- CreateIndex
CREATE UNIQUE INDEX "production_orders_production_number_key" ON "production_orders"("production_number");

-- CreateIndex
CREATE INDEX "production_orders_product_id_idx" ON "production_orders"("product_id");

-- CreateIndex
CREATE INDEX "production_orders_warehouse_id_idx" ON "production_orders"("warehouse_id");

-- CreateIndex
CREATE INDEX "production_orders_status_idx" ON "production_orders"("status");

-- CreateIndex
CREATE INDEX "production_orders_created_at_idx" ON "production_orders"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "production_batches_batch_number_key" ON "production_batches"("batch_number");

-- CreateIndex
CREATE INDEX "production_batches_production_order_id_idx" ON "production_batches"("production_order_id");

-- CreateIndex
CREATE INDEX "production_batches_product_id_idx" ON "production_batches"("product_id");

-- CreateIndex
CREATE INDEX "production_batches_warehouse_id_idx" ON "production_batches"("warehouse_id");

-- CreateIndex
CREATE INDEX "production_batches_status_idx" ON "production_batches"("status");

-- CreateIndex
CREATE INDEX "production_batches_created_at_idx" ON "production_batches"("created_at");

-- CreateIndex
CREATE INDEX "production_inputs_production_batch_id_idx" ON "production_inputs"("production_batch_id");

-- CreateIndex
CREATE INDEX "production_inputs_inventory_lot_id_idx" ON "production_inputs"("inventory_lot_id");

-- CreateIndex
CREATE INDEX "production_inputs_inventory_id_idx" ON "production_inputs"("inventory_id");

-- CreateIndex
CREATE INDEX "production_inputs_product_id_idx" ON "production_inputs"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "heating_batches_heating_number_key" ON "heating_batches"("heating_number");

-- CreateIndex
CREATE INDEX "heating_batches_production_batch_id_idx" ON "heating_batches"("production_batch_id");

-- CreateIndex
CREATE INDEX "heating_batches_status_idx" ON "heating_batches"("status");

-- CreateIndex
CREATE INDEX "heating_batches_created_at_idx" ON "heating_batches"("created_at");

-- CreateIndex
CREATE INDEX "weighbridge_transactions_vehicle_id_idx" ON "weighbridge_transactions"("vehicle_id");

-- AddForeignKey
ALTER TABLE "weighbridge_transactions" ADD CONSTRAINT "weighbridge_transactions_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_orders" ADD CONSTRAINT "production_orders_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_orders" ADD CONSTRAINT "production_orders_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_batches" ADD CONSTRAINT "production_batches_production_order_id_fkey" FOREIGN KEY ("production_order_id") REFERENCES "production_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_batches" ADD CONSTRAINT "production_batches_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_batches" ADD CONSTRAINT "production_batches_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_inputs" ADD CONSTRAINT "production_inputs_production_batch_id_fkey" FOREIGN KEY ("production_batch_id") REFERENCES "production_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_inputs" ADD CONSTRAINT "production_inputs_inventory_lot_id_fkey" FOREIGN KEY ("inventory_lot_id") REFERENCES "inventory_lots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_inputs" ADD CONSTRAINT "production_inputs_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "inventories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_inputs" ADD CONSTRAINT "production_inputs_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "heating_batches" ADD CONSTRAINT "heating_batches_production_batch_id_fkey" FOREIGN KEY ("production_batch_id") REFERENCES "production_batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
