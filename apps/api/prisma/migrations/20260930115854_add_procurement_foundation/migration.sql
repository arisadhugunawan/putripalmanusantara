-- Database Implementation Plan — Migration 5 (Procurement Foundation: PurchaseRequest,
-- PurchaseRequestItem, SupplierRFQ, SupplierRFQItem, SupplierQuotation, SupplierQuotationItem,
-- PurchaseOrder, PurchaseOrderItem). Eight brand-new tables. Existing tables touched: none at
-- the column level — "companies" and "products" each only gain Prisma-side virtual relation
-- arrays, which generate no SQL of their own; confirmed by their total absence below beyond the
-- new tables' own foreign keys pointing AT them. "sales_orders" is untouched entirely — no FK
-- from Sales to Procurement is created in this migration, per the brief's explicit §32. No
-- statement in this file references "admins" or "admin_activity_logs" in any way. Hand-written
-- (not `prisma migrate dev`), same reason as Migrations 1-4: this database has a pre-existing,
-- already-documented false-positive drift on `ai_knowledge_chunks`'s generated tsvector column
-- that makes Prisma's shadow-database diff tooling misbehave. This file touches nothing related
-- to that table. No Receiving/Inventory/Weighbridge/QC table is created here (deferred).

-- CreateEnum
CREATE TYPE "PurchaseRequestStatus" AS ENUM ('draft', 'submitted', 'approved', 'rejected', 'cancelled', 'converted');

-- CreateEnum
CREATE TYPE "SupplierRFQStatus" AS ENUM ('draft', 'sent', 'reviewing', 'quoted', 'rejected', 'cancelled');

-- CreateEnum
CREATE TYPE "SupplierQuotationStatus" AS ENUM ('draft', 'received', 'under_review', 'selected', 'rejected', 'expired', 'cancelled');

-- CreateEnum
CREATE TYPE "PurchaseOrderStatus" AS ENUM ('draft', 'issued', 'confirmed', 'partially_received', 'received', 'cancelled', 'closed');

-- CreateTable
CREATE TABLE "purchase_requests" (
    "id" TEXT NOT NULL,
    "request_number" TEXT NOT NULL,
    "status" "PurchaseRequestStatus" NOT NULL DEFAULT 'draft',
    "requested_by_id" TEXT,
    "requested_by_name" TEXT,
    "required_date" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_request_items" (
    "id" TEXT NOT NULL,
    "purchase_request_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "product_name_snapshot" TEXT,
    "quantity" DECIMAL(14,2) NOT NULL,
    "unit" TEXT NOT NULL,
    "required_date" TIMESTAMP(3),
    "specifications" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_request_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_rfqs" (
    "id" TEXT NOT NULL,
    "supplier_rfq_number" TEXT NOT NULL,
    "purchase_request_id" TEXT NOT NULL,
    "supplier_company_id" TEXT NOT NULL,
    "status" "SupplierRFQStatus" NOT NULL DEFAULT 'draft',
    "requested_at" TIMESTAMP(3),
    "valid_until" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_rfqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_rfq_items" (
    "id" TEXT NOT NULL,
    "supplier_rfq_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "product_name_snapshot" TEXT,
    "quantity" DECIMAL(14,2) NOT NULL,
    "unit" TEXT NOT NULL,
    "specifications" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_rfq_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_quotations" (
    "id" TEXT NOT NULL,
    "supplier_quotation_number" TEXT NOT NULL,
    "supplier_rfq_id" TEXT NOT NULL,
    "supplier_company_id" TEXT NOT NULL,
    "status" "SupplierQuotationStatus" NOT NULL DEFAULT 'draft',
    "quotation_date" TIMESTAMP(3),
    "valid_until" TIMESTAMP(3),
    "currency" TEXT NOT NULL,
    "subtotal" DECIMAL(14,2) NOT NULL,
    "discount" DECIMAL(14,2),
    "shipping_cost" DECIMAL(14,2),
    "total" DECIMAL(14,2) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_quotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_quotation_items" (
    "id" TEXT NOT NULL,
    "supplier_quotation_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "product_name_snapshot" TEXT NOT NULL,
    "quantity" DECIMAL(14,2) NOT NULL,
    "unit" TEXT NOT NULL,
    "unit_price" DECIMAL(14,2) NOT NULL,
    "discount" DECIMAL(14,2),
    "subtotal" DECIMAL(14,2) NOT NULL,
    "specifications" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_quotation_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" TEXT NOT NULL,
    "purchase_order_number" TEXT NOT NULL,
    "purchase_request_id" TEXT,
    "supplier_quotation_id" TEXT,
    "supplier_company_id" TEXT NOT NULL,
    "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'draft',
    "order_date" TIMESTAMP(3) NOT NULL,
    "expected_delivery_date" TIMESTAMP(3),
    "currency" TEXT NOT NULL,
    "subtotal" DECIMAL(14,2) NOT NULL,
    "discount" DECIMAL(14,2),
    "shipping_cost" DECIMAL(14,2),
    "total" DECIMAL(14,2) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_order_items" (
    "id" TEXT NOT NULL,
    "purchase_order_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "product_name_snapshot" TEXT NOT NULL,
    "quantity" DECIMAL(14,2) NOT NULL,
    "unit" TEXT NOT NULL,
    "unit_price" DECIMAL(14,2) NOT NULL,
    "discount" DECIMAL(14,2),
    "subtotal" DECIMAL(14,2) NOT NULL,
    "specifications" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "purchase_requests_request_number_key" ON "purchase_requests"("request_number");

-- CreateIndex
CREATE INDEX "purchase_requests_status_idx" ON "purchase_requests"("status");

-- CreateIndex
CREATE INDEX "purchase_requests_requested_by_id_idx" ON "purchase_requests"("requested_by_id");

-- CreateIndex
CREATE INDEX "purchase_requests_created_at_idx" ON "purchase_requests"("created_at");

-- CreateIndex
CREATE INDEX "purchase_request_items_purchase_request_id_idx" ON "purchase_request_items"("purchase_request_id");

-- CreateIndex
CREATE INDEX "purchase_request_items_product_id_idx" ON "purchase_request_items"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_rfqs_supplier_rfq_number_key" ON "supplier_rfqs"("supplier_rfq_number");

-- CreateIndex
CREATE INDEX "supplier_rfqs_purchase_request_id_idx" ON "supplier_rfqs"("purchase_request_id");

-- CreateIndex
CREATE INDEX "supplier_rfqs_supplier_company_id_idx" ON "supplier_rfqs"("supplier_company_id");

-- CreateIndex
CREATE INDEX "supplier_rfqs_status_idx" ON "supplier_rfqs"("status");

-- CreateIndex
CREATE INDEX "supplier_rfqs_created_at_idx" ON "supplier_rfqs"("created_at");

-- CreateIndex
CREATE INDEX "supplier_rfq_items_supplier_rfq_id_idx" ON "supplier_rfq_items"("supplier_rfq_id");

-- CreateIndex
CREATE INDEX "supplier_rfq_items_product_id_idx" ON "supplier_rfq_items"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_quotations_supplier_quotation_number_key" ON "supplier_quotations"("supplier_quotation_number");

-- CreateIndex
CREATE INDEX "supplier_quotations_supplier_rfq_id_idx" ON "supplier_quotations"("supplier_rfq_id");

-- CreateIndex
CREATE INDEX "supplier_quotations_supplier_company_id_idx" ON "supplier_quotations"("supplier_company_id");

-- CreateIndex
CREATE INDEX "supplier_quotations_status_idx" ON "supplier_quotations"("status");

-- CreateIndex
CREATE INDEX "supplier_quotations_created_at_idx" ON "supplier_quotations"("created_at");

-- CreateIndex
CREATE INDEX "supplier_quotation_items_supplier_quotation_id_idx" ON "supplier_quotation_items"("supplier_quotation_id");

-- CreateIndex
CREATE INDEX "supplier_quotation_items_product_id_idx" ON "supplier_quotation_items"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_purchase_order_number_key" ON "purchase_orders"("purchase_order_number");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_supplier_quotation_id_key" ON "purchase_orders"("supplier_quotation_id");

-- CreateIndex
CREATE INDEX "purchase_orders_purchase_request_id_idx" ON "purchase_orders"("purchase_request_id");

-- CreateIndex
CREATE INDEX "purchase_orders_supplier_quotation_id_idx" ON "purchase_orders"("supplier_quotation_id");

-- CreateIndex
CREATE INDEX "purchase_orders_supplier_company_id_idx" ON "purchase_orders"("supplier_company_id");

-- CreateIndex
CREATE INDEX "purchase_orders_status_idx" ON "purchase_orders"("status");

-- CreateIndex
CREATE INDEX "purchase_orders_created_at_idx" ON "purchase_orders"("created_at");

-- CreateIndex
CREATE INDEX "purchase_order_items_purchase_order_id_idx" ON "purchase_order_items"("purchase_order_id");

-- CreateIndex
CREATE INDEX "purchase_order_items_product_id_idx" ON "purchase_order_items"("product_id");

-- AddForeignKey
ALTER TABLE "purchase_request_items" ADD CONSTRAINT "purchase_request_items_purchase_request_id_fkey" FOREIGN KEY ("purchase_request_id") REFERENCES "purchase_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_request_items" ADD CONSTRAINT "purchase_request_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_rfqs" ADD CONSTRAINT "supplier_rfqs_purchase_request_id_fkey" FOREIGN KEY ("purchase_request_id") REFERENCES "purchase_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_rfqs" ADD CONSTRAINT "supplier_rfqs_supplier_company_id_fkey" FOREIGN KEY ("supplier_company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_rfq_items" ADD CONSTRAINT "supplier_rfq_items_supplier_rfq_id_fkey" FOREIGN KEY ("supplier_rfq_id") REFERENCES "supplier_rfqs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_rfq_items" ADD CONSTRAINT "supplier_rfq_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_quotations" ADD CONSTRAINT "supplier_quotations_supplier_rfq_id_fkey" FOREIGN KEY ("supplier_rfq_id") REFERENCES "supplier_rfqs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_quotations" ADD CONSTRAINT "supplier_quotations_supplier_company_id_fkey" FOREIGN KEY ("supplier_company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_quotation_items" ADD CONSTRAINT "supplier_quotation_items_supplier_quotation_id_fkey" FOREIGN KEY ("supplier_quotation_id") REFERENCES "supplier_quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_quotation_items" ADD CONSTRAINT "supplier_quotation_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_purchase_request_id_fkey" FOREIGN KEY ("purchase_request_id") REFERENCES "purchase_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_quotation_id_fkey" FOREIGN KEY ("supplier_quotation_id") REFERENCES "supplier_quotations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_company_id_fkey" FOREIGN KEY ("supplier_company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
