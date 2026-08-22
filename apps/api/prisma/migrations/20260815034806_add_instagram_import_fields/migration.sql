-- AlterTable
ALTER TABLE "articles" ADD COLUMN     "instagram_imported_at" TIMESTAMP(3),
ADD COLUMN     "instagram_post_id" TEXT;

-- CreateIndex
CREATE INDEX "articles_instagram_url_idx" ON "articles"("instagram_url");
