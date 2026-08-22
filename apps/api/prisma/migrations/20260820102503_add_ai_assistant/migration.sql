-- CreateEnum
CREATE TYPE "AiSourceKey" AS ENUM ('home', 'about_company', 'products', 'facilities', 'moq_payment_terms', 'shipment_terms', 'faq', 'gallery', 'news', 'contact', 'legal_certificates');

-- CreateEnum
CREATE TYPE "AiSyncRunStatus" AS ENUM ('running', 'success', 'failed');

-- CreateEnum
CREATE TYPE "AiMessageRole" AS ENUM ('user', 'assistant');

-- CreateEnum
CREATE TYPE "AiAnalyticsEventType" AS ENUM ('chat_opened', 'question_submitted', 'quick_question_clicked', 'quotation_intent', 'whatsapp_clicked');

-- CreateTable
CREATE TABLE "ai_settings" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "assistant_name" TEXT NOT NULL DEFAULT 'PPN Assistant',
    "subtitle" TEXT NOT NULL DEFAULT 'Your Coconut Supply Assistant',
    "desktop_enabled" BOOLEAN NOT NULL DEFAULT true,
    "mobile_enabled" BOOLEAN NOT NULL DEFAULT true,
    "business_instructions" TEXT NOT NULL DEFAULT '',
    "include_home" BOOLEAN NOT NULL DEFAULT true,
    "include_about_company" BOOLEAN NOT NULL DEFAULT true,
    "include_products" BOOLEAN NOT NULL DEFAULT true,
    "include_facilities" BOOLEAN NOT NULL DEFAULT true,
    "include_moq_payment_terms" BOOLEAN NOT NULL DEFAULT true,
    "include_shipment_terms" BOOLEAN NOT NULL DEFAULT true,
    "include_faq" BOOLEAN NOT NULL DEFAULT true,
    "include_gallery" BOOLEAN NOT NULL DEFAULT true,
    "include_news" BOOLEAN NOT NULL DEFAULT true,
    "include_contact" BOOLEAN NOT NULL DEFAULT true,
    "include_legal_certificates" BOOLEAN NOT NULL DEFAULT true,
    "whatsapp_enabled" BOOLEAN NOT NULL DEFAULT true,
    "whatsapp_number" TEXT NOT NULL DEFAULT '+6282293807717',
    "whatsapp_display_name" TEXT NOT NULL DEFAULT 'PPN Team',
    "whatsapp_general_message" TEXT NOT NULL DEFAULT 'Hello PPN Team,

I am interested in your coconut products.

Product:
Quantity:
Destination:

I would like to request product information and quotation.

Thank you.',
    "whatsapp_product_message" TEXT NOT NULL DEFAULT 'Hello PPN Team,

I am interested in {product}.

I would like to know more about:
- Product specifications
- Packaging
- Availability
- Pricing
- Shipment options

Quantity:
Destination:

Thank you.',
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_knowledge_chunks" (
    "id" TEXT NOT NULL,
    "version" BIGINT NOT NULL,
    "source_key" "AiSourceKey" NOT NULL,
    "content_type" TEXT NOT NULL,
    "page" TEXT NOT NULL,
    "section" TEXT,
    "language" TEXT NOT NULL,
    "product_id" TEXT,
    "source_url" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_knowledge_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_sync_status" (
    "id" TEXT NOT NULL,
    "active_version" BIGINT,
    "last_synced_at" TIMESTAMP(3),
    "last_status" "AiSyncRunStatus" NOT NULL DEFAULT 'success',
    "last_error" TEXT,
    "total_sources" INTEGER NOT NULL DEFAULT 0,
    "indexed_count" INTEGER NOT NULL DEFAULT 0,
    "failed_count" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_sync_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_sync_logs" (
    "id" TEXT NOT NULL,
    "version" BIGINT NOT NULL,
    "status" "AiSyncRunStatus" NOT NULL,
    "trigger" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    "chunks_created" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,

    CONSTRAINT "ai_sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_quick_questions" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_quick_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_conversation_messages" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "role" "AiMessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "page_context" TEXT,
    "product_id" TEXT,
    "sources_used" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_conversation_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_analytics_events" (
    "id" TEXT NOT NULL,
    "event_type" "AiAnalyticsEventType" NOT NULL,
    "session_id" TEXT NOT NULL,
    "language" TEXT,
    "product_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_knowledge_chunks_version_language_idx" ON "ai_knowledge_chunks"("version", "language");

-- CreateIndex
CREATE INDEX "ai_knowledge_chunks_source_key_language_idx" ON "ai_knowledge_chunks"("source_key", "language");

-- CreateIndex
CREATE INDEX "ai_knowledge_chunks_product_id_idx" ON "ai_knowledge_chunks"("product_id");

-- CreateIndex
CREATE INDEX "ai_sync_logs_started_at_idx" ON "ai_sync_logs"("started_at");

-- CreateIndex
CREATE INDEX "ai_quick_questions_language_active_order_idx" ON "ai_quick_questions"("language", "active", "order");

-- CreateIndex
CREATE INDEX "ai_conversation_messages_session_id_created_at_idx" ON "ai_conversation_messages"("session_id", "created_at");

-- CreateIndex
CREATE INDEX "ai_analytics_events_event_type_created_at_idx" ON "ai_analytics_events"("event_type", "created_at");

-- Full-text search column for AiKnowledgeChunk retrieval — generated/stored, no extension
-- required (built-in `simple` text search config; see the model's doc comment in schema.prisma
-- for why pgvector was not used). Declared `Unsupported("tsvector")` in the Prisma schema so
-- future `prisma migrate dev` runs treat it as opaque and never try to manage/drop it.
ALTER TABLE "ai_knowledge_chunks"
  ADD COLUMN "search_vector" tsvector GENERATED ALWAYS AS (to_tsvector('simple', "content")) STORED;

CREATE INDEX "ai_knowledge_chunks_search_vector_idx" ON "ai_knowledge_chunks" USING GIN ("search_vector");
