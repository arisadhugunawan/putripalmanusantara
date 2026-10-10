-- Database Implementation Plan — Migration 13 (Communication Foundation). Three brand-new
-- tables ("conversations", "messages", "notifications"). The only pre-existing table
-- referenced is "companies" (one new FOREIGN KEY pointing INTO it from "conversations";
-- "companies" itself receives no column change — its Prisma-side "conversations" back-relation
-- array generates no SQL of its own). No row in any pre-existing table is touched, moved, or
-- backfilled. "messages.sender_type"/"sender_id" and "notifications.recipient_type"/
-- "recipient_id" are plain polymorphic columns with NO foreign key — by design, same as
-- "document_links.attached_to_type"/"attached_to_id" (Migration 11) and
-- "inventory_movements.reference_type"/"reference_id" (Migrations 6-8) — so there is no FK from
-- either of these columns to "admins" or "external_accounts", and neither of those tables is
-- referenced anywhere in this file. "admins" and "admin_activity_logs" are not referenced
-- either. Hand-written (not `prisma migrate dev`), same reason as Migrations 1-12: this
-- database has a pre-existing, already-documented false-positive drift on
-- `ai_knowledge_chunks`'s generated tsvector column that makes Prisma's shadow-database diff
-- tooling misbehave. This file touches nothing related to that table.

-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('open', 'closed', 'archived');

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "status" "ConversationStatus" NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "sender_type" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "recipient_type" TEXT NOT NULL,
    "recipient_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "conversations_company_id_idx" ON "conversations"("company_id");

-- CreateIndex
CREATE INDEX "conversations_status_idx" ON "conversations"("status");

-- CreateIndex
CREATE INDEX "messages_conversation_id_idx" ON "messages"("conversation_id");

-- CreateIndex
CREATE INDEX "messages_created_at_idx" ON "messages"("created_at");

-- CreateIndex
CREATE INDEX "messages_sender_type_sender_id_idx" ON "messages"("sender_type", "sender_id");

-- CreateIndex
CREATE INDEX "notifications_recipient_type_recipient_id_idx" ON "notifications"("recipient_type", "recipient_id");

-- CreateIndex
CREATE INDEX "notifications_read_at_idx" ON "notifications"("read_at");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
