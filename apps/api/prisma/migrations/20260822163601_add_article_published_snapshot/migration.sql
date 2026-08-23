-- NOTE: Prisma's diff engine spuriously generated a DROP of the AI knowledge base's GIN
-- full-text index here again (fourth occurrence — same false drift documented in the Phase 1
-- security migration, the admin_activity_logs migration, and the Product publish-snapshot
-- migration: it misreads the `GENERATED ALWAYS AS (...) STORED` tsvector column as a "default"
-- to drop). Removed manually; this migration only adds the Article publish-snapshot table and
-- column below.

-- AlterTable
ALTER TABLE "articles" ADD COLUMN     "last_published_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "article_published_snapshots" (
    "id" TEXT NOT NULL,
    "article_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "published_by_id" TEXT NOT NULL,
    "published_by_name" TEXT NOT NULL,
    "published_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_published_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "article_published_snapshots_article_id_published_at_idx" ON "article_published_snapshots"("article_id", "published_at");

-- CreateIndex
CREATE UNIQUE INDEX "article_published_snapshots_article_id_version_key" ON "article_published_snapshots"("article_id", "version");

-- AddForeignKey
ALTER TABLE "article_published_snapshots" ADD CONSTRAINT "article_published_snapshots_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
