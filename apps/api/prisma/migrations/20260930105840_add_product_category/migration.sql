-- Database Implementation Plan — Migration 1 (Product Category extension).
-- Purely additive: a new nullable `category_id` on the existing `products` table (the existing
-- `category` TEXT column is untouched — no rename, no drop, no data touched), and a new
-- `product_categories` table, same shape as the existing `legal_document_categories` table.
-- No existing row in `products` is modified by this migration; `category_id` starts NULL for
-- every one of them. Hand-written (not `prisma migrate dev`) because this database has a
-- pre-existing, already-documented false-positive drift on `ai_knowledge_chunks`'s generated
-- tsvector column (see the migration.sql comments in 20260821165057_add_product_published_snapshot
-- and 20260821143256_add_missing_performance_indexes) that makes Prisma's shadow-database diff
-- tooling misbehave; this file only contains the two statements below, nothing else.

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "category_id" TEXT;

-- CreateTable
CREATE TABLE "product_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "translations" JSONB,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_categories_slug_key" ON "product_categories"("slug");

-- CreateIndex
CREATE INDEX "products_category_id_idx" ON "products"("category_id");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "product_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
