-- Database Implementation Plan — Migration 8 (Packing + Packaging Traceability Foundation).
-- Two brand-new tables. No PackedLot, no PackagingMaterial: packing output reuses the existing
-- InventoryLot table (a new row, same pattern Migration 7 used for production output), and
-- packaging is a transaction-time snapshot column (packing_items.packaging_type), not a new
-- master table. Existing tables touched at the column level: none — "production_batches",
-- "sales_orders", "warehouses", "inventory_lots", "inventories", and "products" each only gain
-- Prisma-side virtual relation arrays, which generate no SQL of their own; confirmed by their
-- total absence below beyond the new tables' own foreign keys pointing AT them. "admins" and
-- "facilities" are not referenced anywhere in this file. The InventoryMovementType enum gains
-- two additive values (packing_in/packing_out), same safe ADD VALUE pattern as Migration 7.
-- No Loading/Container/Shipment/Invoice/Payment/StockReservation/SalesAllocation/Delivery table
-- is created here (out of scope). Hand-written (not `prisma migrate dev`), same reason as
-- Migrations 1-7: this database has a pre-existing, already-documented false-positive drift on
-- `ai_knowledge_chunks`'s generated tsvector column that makes Prisma's shadow-database diff
-- tooling misbehave. This file touches nothing related to that table.

-- AlterEnum: additive only — appends two new values to the existing InventoryMovementType enum.
-- No existing value renamed or removed, no row touched (inventory_movements has 0 rows).
ALTER TYPE "InventoryMovementType" ADD VALUE 'packing_in';
ALTER TYPE "InventoryMovementType" ADD VALUE 'packing_out';

-- CreateEnum
CREATE TYPE "PackingOrderStatus" AS ENUM ('draft', 'planned', 'in_progress', 'completed', 'cancelled');

-- CreateTable
CREATE TABLE "packing_orders" (
    "id" TEXT NOT NULL,
    "packing_number" TEXT NOT NULL,
    "production_batch_id" TEXT NOT NULL,
    "sales_order_id" TEXT NOT NULL,
    "warehouse_id" TEXT,
    "status" "PackingOrderStatus" NOT NULL DEFAULT 'draft',
    "planned_start_at" TIMESTAMP(3),
    "planned_end_at" TIMESTAMP(3),
    "actual_start_at" TIMESTAMP(3),
    "actual_end_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "packing_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "packing_items" (
    "id" TEXT NOT NULL,
    "packing_order_id" TEXT NOT NULL,
    "inventory_lot_id" TEXT NOT NULL,
    "inventory_id" TEXT,
    "product_id" TEXT NOT NULL,
    "quantity" DECIMAL(14,2) NOT NULL,
    "unit" TEXT NOT NULL,
    "packaging_type" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "packing_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "packing_orders_packing_number_key" ON "packing_orders"("packing_number");

-- CreateIndex
CREATE INDEX "packing_orders_production_batch_id_idx" ON "packing_orders"("production_batch_id");

-- CreateIndex
CREATE INDEX "packing_orders_sales_order_id_idx" ON "packing_orders"("sales_order_id");

-- CreateIndex
CREATE INDEX "packing_orders_warehouse_id_idx" ON "packing_orders"("warehouse_id");

-- CreateIndex
CREATE INDEX "packing_orders_status_idx" ON "packing_orders"("status");

-- CreateIndex
CREATE INDEX "packing_orders_created_at_idx" ON "packing_orders"("created_at");

-- CreateIndex
CREATE INDEX "packing_items_packing_order_id_idx" ON "packing_items"("packing_order_id");

-- CreateIndex
CREATE INDEX "packing_items_inventory_lot_id_idx" ON "packing_items"("inventory_lot_id");

-- CreateIndex
CREATE INDEX "packing_items_inventory_id_idx" ON "packing_items"("inventory_id");

-- CreateIndex
CREATE INDEX "packing_items_product_id_idx" ON "packing_items"("product_id");

-- AddForeignKey
ALTER TABLE "packing_orders" ADD CONSTRAINT "packing_orders_production_batch_id_fkey" FOREIGN KEY ("production_batch_id") REFERENCES "production_batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packing_orders" ADD CONSTRAINT "packing_orders_sales_order_id_fkey" FOREIGN KEY ("sales_order_id") REFERENCES "sales_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packing_orders" ADD CONSTRAINT "packing_orders_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packing_items" ADD CONSTRAINT "packing_items_packing_order_id_fkey" FOREIGN KEY ("packing_order_id") REFERENCES "packing_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packing_items" ADD CONSTRAINT "packing_items_inventory_lot_id_fkey" FOREIGN KEY ("inventory_lot_id") REFERENCES "inventory_lots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packing_items" ADD CONSTRAINT "packing_items_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "inventories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packing_items" ADD CONSTRAINT "packing_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
