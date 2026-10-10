-- Database Implementation Plan — Migration 14 (Audit & Analytics Foundation). One brand-new
-- table ("business_activity_logs"). No pre-existing table is referenced, altered, or touched in
-- any way — "admin_activity_logs" (1,156 real rows), "admins", and "external_accounts" are not
-- referenced anywhere in this file. This table has zero foreign keys: "actor_id"/"actor_name"
-- are plain columns (same pattern as "admin_activity_logs.actor_id"/"actor_name" against
-- "admins"), and "entity_type"/"entity_id" are plain columns (same polymorphic-reference idiom
-- as "admin_activity_logs.entity_type"/"entity_id", "document_links.attached_to_type"/
-- "attached_to_id", and "inventory_movements.reference_type"/"reference_id"). Hand-written (not
-- `prisma migrate dev`), same reason as Migrations 1-13: this database has a pre-existing,
-- already-documented false-positive drift on `ai_knowledge_chunks`'s generated tsvector column
-- that makes Prisma's shadow-database diff tooling misbehave. This file touches nothing related
-- to that table.

-- CreateTable
CREATE TABLE "business_activity_logs" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "actor_name" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "business_activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "business_activity_logs_created_at_idx" ON "business_activity_logs"("created_at");

-- CreateIndex
CREATE INDEX "business_activity_logs_actor_id_idx" ON "business_activity_logs"("actor_id");

-- CreateIndex
CREATE INDEX "business_activity_logs_action_idx" ON "business_activity_logs"("action");

-- CreateIndex
CREATE INDEX "business_activity_logs_entity_type_entity_id_idx" ON "business_activity_logs"("entity_type", "entity_id");
