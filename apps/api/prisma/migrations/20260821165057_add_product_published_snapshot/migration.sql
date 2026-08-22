-- NOTE: Prisma's diff engine spuriously generated a DROP of the AI knowledge base's GIN
-- full-text index here again (third occurrence this session — same false drift documented in
-- the Phase 1 security migration and the admin_activity_logs migration: it misreads the
-- `GENERATED ALWAYS AS (...) STORED` tsvector column as a "default" to drop). Removed manually;
-- this migration only adds the Product publish-snapshot table and column below.

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "last_published_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "product_published_snapshots" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "published_by_id" TEXT NOT NULL,
    "published_by_name" TEXT NOT NULL,
    "published_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_published_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_published_snapshots_product_id_published_at_idx" ON "product_published_snapshots"("product_id", "published_at");

-- CreateIndex
CREATE UNIQUE INDEX "product_published_snapshots_product_id_version_key" ON "product_published_snapshots"("product_id", "version");

-- AddForeignKey
ALTER TABLE "product_published_snapshots" ADD CONSTRAINT "product_published_snapshots_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
