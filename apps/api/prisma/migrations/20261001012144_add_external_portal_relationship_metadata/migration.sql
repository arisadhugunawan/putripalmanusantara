-- Database Implementation Plan — Migration 15 (External Portal / Business Network Foundation —
-- relationship metadata). Closes two confirmed gaps from the Migration 15 preflight: (1)
-- "inquiries" had no structural link to "companies" (only a free-text company_name), and (2)
-- "business_relationships" had an approval trail but no symmetric request trail. Both changes
-- are purely additive: two nullable columns + one FK + one index on "inquiries", and three
-- nullable columns (no FK) on "business_relationships". No existing column is altered, renamed,
-- or dropped; no row in either table is touched. "requested_by_id"/"requested_by_name" are
-- plain columns with NO foreign key to "external_accounts" or "admins" — same convention as the
-- already-existing "approved_by_id"/"approved_by_name" on the same table. "admins",
-- "admin_activity_logs", and "external_accounts" are not referenced anywhere in this file.
-- Hand-written (not `prisma migrate dev`), same reason as Migrations 1-14: this database has a
-- pre-existing, already-documented false-positive drift on `ai_knowledge_chunks`'s generated
-- tsvector column that makes Prisma's shadow-database diff tooling misbehave. This file touches
-- nothing related to that table.

-- AlterTable: additive only — adds one nullable column to "inquiries". Existing rows get NULL,
-- which is valid (no NOT NULL, no default required).
ALTER TABLE "inquiries" ADD COLUMN "company_id" TEXT;

-- AlterTable: additive only — adds three nullable columns to "business_relationships". Existing
-- rows get NULL for all three, which is valid.
ALTER TABLE "business_relationships" ADD COLUMN "requested_by_id" TEXT;
ALTER TABLE "business_relationships" ADD COLUMN "requested_by_name" TEXT;
ALTER TABLE "business_relationships" ADD COLUMN "requested_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "inquiries_company_id_idx" ON "inquiries"("company_id");

-- AddForeignKey
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
