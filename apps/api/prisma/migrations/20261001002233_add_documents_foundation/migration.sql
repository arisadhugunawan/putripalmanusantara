-- Database Implementation Plan — Migration 11 (Documents Foundation). Three brand-new tables
-- ("document_types", "documents", "document_links"). The only pre-existing table referenced is
-- "media" (one new FOREIGN KEY pointing INTO it from "documents"; "media" itself receives no
-- column change — its Prisma-side "documents" back-relation array generates no SQL of its own).
-- No row in "media" is touched, moved, or backfilled. None of the six pre-existing CMS
-- document-shaped tables (legal_certificate_documents, legal_document_categories,
-- factory_documents, shipment_documents, product_downloads, about_company_shipment_terms_section)
-- are referenced anywhere in this file. "admins" and "admin_activity_logs" are not referenced
-- either. "document_links" has no foreign key for its polymorphic target (attached_to_type /
-- attached_to_id) — by design, same as "inventory_movements.reference_type"/"reference_id" in
-- Migrations 6-8. Hand-written (not `prisma migrate dev`), same reason as Migrations 1-10: this
-- database has a pre-existing, already-documented false-positive drift on
-- `ai_knowledge_chunks`'s generated tsvector column that makes Prisma's shadow-database diff
-- tooling misbehave. This file touches nothing related to that table.

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('draft', 'issued', 'active', 'expired', 'archived', 'cancelled');

-- CreateTable
CREATE TABLE "document_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "document_number" TEXT,
    "file_id" TEXT NOT NULL,
    "type_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "DocumentStatus" NOT NULL DEFAULT 'draft',
    "issued_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_links" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "attached_to_type" TEXT NOT NULL,
    "attached_to_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "document_types_slug_key" ON "document_types"("slug");

-- CreateIndex
CREATE INDEX "document_types_active_idx" ON "document_types"("active");

-- CreateIndex
CREATE UNIQUE INDEX "documents_document_number_key" ON "documents"("document_number");

-- CreateIndex
CREATE INDEX "documents_file_id_idx" ON "documents"("file_id");

-- CreateIndex
CREATE INDEX "documents_type_id_idx" ON "documents"("type_id");

-- CreateIndex
CREATE INDEX "documents_status_idx" ON "documents"("status");

-- CreateIndex
CREATE INDEX "document_links_document_id_idx" ON "document_links"("document_id");

-- CreateIndex
CREATE INDEX "document_links_attached_to_type_attached_to_id_idx" ON "document_links"("attached_to_type", "attached_to_id");

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "document_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_links" ADD CONSTRAINT "document_links_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
