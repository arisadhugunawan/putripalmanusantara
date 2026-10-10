-- Database Implementation Plan — Migration 6 (Receiving + Weighbridge + QC + Warehouse/
-- Inventory Foundation). Ten brand-new tables. Existing tables touched: none at the column
-- level — "companies", "products", and "purchase_orders"/"purchase_order_items" each only gain
-- Prisma-side virtual relation arrays, which generate no SQL of their own; confirmed by their
-- total absence below beyond the new tables' own foreign keys pointing AT them. "admins" and
-- "admin_activity_logs" are not referenced anywhere in this file. "facilities" is not touched
-- or referenced — Warehouse is a deliberately separate operational entity, per the brief.
-- No Vehicle table is created (flagged future domain; WeighbridgeTransaction.vehicle_id is a
-- plain nullable column, not a foreign key). No Production/Heating/Packing/Loading/Container/
-- Shipment/Invoice/Payment/StockReservation table is created here (out of scope for this
-- migration). Hand-written (not `prisma migrate dev`), same reason as Migrations 1-5: this
-- database has a pre-existing, already-documented false-positive drift on
-- `ai_knowledge_chunks`'s generated tsvector column that makes Prisma's shadow-database diff
-- tooling misbehave. This file touches nothing related to that table.

-- CreateEnum
CREATE TYPE "WarehouseStatus" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "WarehouseLocationStatus" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "ReceivingStatus" AS ENUM ('draft', 'received', 'inspecting', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "WeighbridgeStatus" AS ENUM ('open', 'weigh_in', 'weigh_out', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "InventoryLotStatus" AS ENUM ('quarantine', 'available', 'hold', 'rejected', 'consumed', 'closed');

-- CreateEnum
CREATE TYPE "QCInspectionType" AS ENUM ('incoming', 'release', 'reinspection');

-- CreateEnum
CREATE TYPE "QCInspectionStatus" AS ENUM ('pending', 'in_progress', 'passed', 'failed', 'released', 'cancelled');

-- CreateEnum
CREATE TYPE "QCResultStatus" AS ENUM ('pass', 'fail', 'na');

-- CreateEnum
CREATE TYPE "InventoryStatus" AS ENUM ('quarantine', 'available', 'hold', 'blocked', 'depleted');

-- CreateEnum
CREATE TYPE "InventoryMovementType" AS ENUM ('receiving', 'transfer_in', 'transfer_out', 'adjustment_in', 'adjustment_out');

-- CreateTable
CREATE TABLE "warehouses" (
    "id" TEXT NOT NULL,
    "warehouse_number" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "address" TEXT,
    "status" "WarehouseStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouse_locations" (
    "id" TEXT NOT NULL,
    "warehouse_id" TEXT NOT NULL,
    "location_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location_type" TEXT,
    "status" "WarehouseLocationStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "warehouse_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receivings" (
    "id" TEXT NOT NULL,
    "receiving_number" TEXT NOT NULL,
    "purchase_order_id" TEXT NOT NULL,
    "warehouse_id" TEXT NOT NULL,
    "status" "ReceivingStatus" NOT NULL DEFAULT 'draft',
    "received_at" TIMESTAMP(3),
    "supplier_company_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "receivings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receiving_items" (
    "id" TEXT NOT NULL,
    "receiving_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "purchase_order_item_id" TEXT,
    "product_name_snapshot" TEXT NOT NULL,
    "quantity_expected" DECIMAL(14,2),
    "quantity_received" DECIMAL(14,2) NOT NULL,
    "unit" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "receiving_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weighbridge_transactions" (
    "id" TEXT NOT NULL,
    "transaction_number" TEXT NOT NULL,
    "receiving_id" TEXT,
    "vehicle_id" TEXT,
    "weigh_in_at" TIMESTAMP(3),
    "weigh_out_at" TIMESTAMP(3),
    "gross_weight" DECIMAL(14,2),
    "tare_weight" DECIMAL(14,2),
    "net_weight" DECIMAL(14,2),
    "unit" TEXT NOT NULL,
    "status" "WeighbridgeStatus" NOT NULL DEFAULT 'open',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weighbridge_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_lots" (
    "id" TEXT NOT NULL,
    "lot_number" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "receiving_id" TEXT,
    "receiving_item_id" TEXT,
    "supplier_company_id" TEXT,
    "warehouse_id" TEXT,
    "quantity" DECIMAL(14,2) NOT NULL,
    "unit" TEXT NOT NULL,
    "status" "InventoryLotStatus" NOT NULL DEFAULT 'quarantine',
    "origin" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_lots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qc_inspections" (
    "id" TEXT NOT NULL,
    "inspection_number" TEXT NOT NULL,
    "inventory_lot_id" TEXT NOT NULL,
    "inspection_type" "QCInspectionType" NOT NULL,
    "inspector_id" TEXT,
    "inspector_name" TEXT,
    "inspected_at" TIMESTAMP(3) NOT NULL,
    "status" "QCInspectionStatus" NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "qc_inspections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qc_results" (
    "id" TEXT NOT NULL,
    "qc_inspection_id" TEXT NOT NULL,
    "parameter" TEXT NOT NULL,
    "specification" TEXT,
    "actual_value" TEXT,
    "unit" TEXT,
    "result" "QCResultStatus" NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "qc_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventories" (
    "id" TEXT NOT NULL,
    "warehouse_id" TEXT NOT NULL,
    "warehouse_location_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "inventory_lot_id" TEXT NOT NULL,
    "quantity" DECIMAL(14,2) NOT NULL,
    "status" "InventoryStatus" NOT NULL DEFAULT 'quarantine',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_movements" (
    "id" TEXT NOT NULL,
    "movement_number" TEXT NOT NULL,
    "inventory_id" TEXT,
    "inventory_lot_id" TEXT,
    "warehouse_id" TEXT NOT NULL,
    "warehouse_location_id" TEXT,
    "product_id" TEXT NOT NULL,
    "movement_type" "InventoryMovementType" NOT NULL,
    "quantity" DECIMAL(14,2) NOT NULL,
    "unit" TEXT NOT NULL,
    "reference_type" TEXT,
    "reference_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_movements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "warehouses_warehouse_number_key" ON "warehouses"("warehouse_number");

-- CreateIndex
CREATE INDEX "warehouses_status_idx" ON "warehouses"("status");

-- CreateIndex
CREATE INDEX "warehouse_locations_warehouse_id_idx" ON "warehouse_locations"("warehouse_id");

-- CreateIndex
CREATE INDEX "warehouse_locations_status_idx" ON "warehouse_locations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "warehouse_locations_warehouse_id_location_code_key" ON "warehouse_locations"("warehouse_id", "location_code");

-- CreateIndex
CREATE UNIQUE INDEX "receivings_receiving_number_key" ON "receivings"("receiving_number");

-- CreateIndex
CREATE INDEX "receivings_purchase_order_id_idx" ON "receivings"("purchase_order_id");

-- CreateIndex
CREATE INDEX "receivings_warehouse_id_idx" ON "receivings"("warehouse_id");

-- CreateIndex
CREATE INDEX "receivings_status_idx" ON "receivings"("status");

-- CreateIndex
CREATE INDEX "receivings_received_at_idx" ON "receivings"("received_at");

-- CreateIndex
CREATE INDEX "receiving_items_receiving_id_idx" ON "receiving_items"("receiving_id");

-- CreateIndex
CREATE INDEX "receiving_items_purchase_order_item_id_idx" ON "receiving_items"("purchase_order_item_id");

-- CreateIndex
CREATE INDEX "receiving_items_product_id_idx" ON "receiving_items"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "weighbridge_transactions_transaction_number_key" ON "weighbridge_transactions"("transaction_number");

-- CreateIndex
CREATE INDEX "weighbridge_transactions_receiving_id_idx" ON "weighbridge_transactions"("receiving_id");

-- CreateIndex
CREATE INDEX "weighbridge_transactions_status_idx" ON "weighbridge_transactions"("status");

-- CreateIndex
CREATE INDEX "weighbridge_transactions_created_at_idx" ON "weighbridge_transactions"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_lots_lot_number_key" ON "inventory_lots"("lot_number");

-- CreateIndex
CREATE INDEX "inventory_lots_product_id_idx" ON "inventory_lots"("product_id");

-- CreateIndex
CREATE INDEX "inventory_lots_receiving_id_idx" ON "inventory_lots"("receiving_id");

-- CreateIndex
CREATE INDEX "inventory_lots_receiving_item_id_idx" ON "inventory_lots"("receiving_item_id");

-- CreateIndex
CREATE INDEX "inventory_lots_warehouse_id_idx" ON "inventory_lots"("warehouse_id");

-- CreateIndex
CREATE INDEX "inventory_lots_status_idx" ON "inventory_lots"("status");

-- CreateIndex
CREATE UNIQUE INDEX "qc_inspections_inspection_number_key" ON "qc_inspections"("inspection_number");

-- CreateIndex
CREATE INDEX "qc_inspections_inventory_lot_id_idx" ON "qc_inspections"("inventory_lot_id");

-- CreateIndex
CREATE INDEX "qc_inspections_status_idx" ON "qc_inspections"("status");

-- CreateIndex
CREATE INDEX "qc_inspections_inspected_at_idx" ON "qc_inspections"("inspected_at");

-- CreateIndex
CREATE INDEX "qc_results_qc_inspection_id_idx" ON "qc_results"("qc_inspection_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventories_warehouse_location_product_lot_key" ON "inventories"("warehouse_id", "warehouse_location_id", "product_id", "inventory_lot_id");

-- CreateIndex
CREATE INDEX "inventories_warehouse_id_idx" ON "inventories"("warehouse_id");

-- CreateIndex
CREATE INDEX "inventories_warehouse_location_id_idx" ON "inventories"("warehouse_location_id");

-- CreateIndex
CREATE INDEX "inventories_product_id_idx" ON "inventories"("product_id");

-- CreateIndex
CREATE INDEX "inventories_inventory_lot_id_idx" ON "inventories"("inventory_lot_id");

-- CreateIndex
CREATE INDEX "inventories_status_idx" ON "inventories"("status");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_movements_movement_number_key" ON "inventory_movements"("movement_number");

-- CreateIndex
CREATE INDEX "inventory_movements_inventory_id_idx" ON "inventory_movements"("inventory_id");

-- CreateIndex
CREATE INDEX "inventory_movements_inventory_lot_id_idx" ON "inventory_movements"("inventory_lot_id");

-- CreateIndex
CREATE INDEX "inventory_movements_warehouse_id_idx" ON "inventory_movements"("warehouse_id");

-- CreateIndex
CREATE INDEX "inventory_movements_product_id_idx" ON "inventory_movements"("product_id");

-- CreateIndex
CREATE INDEX "inventory_movements_movement_type_idx" ON "inventory_movements"("movement_type");

-- CreateIndex
CREATE INDEX "inventory_movements_created_at_idx" ON "inventory_movements"("created_at");

-- AddForeignKey
ALTER TABLE "warehouse_locations" ADD CONSTRAINT "warehouse_locations_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receivings" ADD CONSTRAINT "receivings_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receivings" ADD CONSTRAINT "receivings_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receivings" ADD CONSTRAINT "receivings_supplier_company_id_fkey" FOREIGN KEY ("supplier_company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receiving_items" ADD CONSTRAINT "receiving_items_receiving_id_fkey" FOREIGN KEY ("receiving_id") REFERENCES "receivings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receiving_items" ADD CONSTRAINT "receiving_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receiving_items" ADD CONSTRAINT "receiving_items_purchase_order_item_id_fkey" FOREIGN KEY ("purchase_order_item_id") REFERENCES "purchase_order_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weighbridge_transactions" ADD CONSTRAINT "weighbridge_transactions_receiving_id_fkey" FOREIGN KEY ("receiving_id") REFERENCES "receivings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_lots" ADD CONSTRAINT "inventory_lots_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_lots" ADD CONSTRAINT "inventory_lots_receiving_id_fkey" FOREIGN KEY ("receiving_id") REFERENCES "receivings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_lots" ADD CONSTRAINT "inventory_lots_receiving_item_id_fkey" FOREIGN KEY ("receiving_item_id") REFERENCES "receiving_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_lots" ADD CONSTRAINT "inventory_lots_supplier_company_id_fkey" FOREIGN KEY ("supplier_company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_lots" ADD CONSTRAINT "inventory_lots_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_inspections" ADD CONSTRAINT "qc_inspections_inventory_lot_id_fkey" FOREIGN KEY ("inventory_lot_id") REFERENCES "inventory_lots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_results" ADD CONSTRAINT "qc_results_qc_inspection_id_fkey" FOREIGN KEY ("qc_inspection_id") REFERENCES "qc_inspections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventories" ADD CONSTRAINT "inventories_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventories" ADD CONSTRAINT "inventories_warehouse_location_id_fkey" FOREIGN KEY ("warehouse_location_id") REFERENCES "warehouse_locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventories" ADD CONSTRAINT "inventories_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventories" ADD CONSTRAINT "inventories_inventory_lot_id_fkey" FOREIGN KEY ("inventory_lot_id") REFERENCES "inventory_lots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "inventories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_inventory_lot_id_fkey" FOREIGN KEY ("inventory_lot_id") REFERENCES "inventory_lots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_warehouse_location_id_fkey" FOREIGN KEY ("warehouse_location_id") REFERENCES "warehouse_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
