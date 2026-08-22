-- NOTE: Prisma's diff engine spuriously generated a DROP of the AI knowledge base's GIN
-- full-text index here again (fourth occurrence this session — same false drift documented
-- in every prior migration: it misreads the `GENERATED ALWAYS AS (...) STORED` tsvector
-- column as a "default" to drop). Removed manually; this migration only adds the two new
-- Media columns and their index below.

-- AlterTable
ALTER TABLE "media" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "size_bytes" INTEGER;

-- CreateIndex
CREATE INDEX "media_deleted_at_idx" ON "media"("deleted_at");
