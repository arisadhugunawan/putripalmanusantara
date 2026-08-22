-- CreateEnum
CREATE TYPE "ArticleContentSource" AS ENUM ('website', 'instagram', 'both');

-- AlterTable
ALTER TABLE "articles" ADD COLUMN     "canonical_url" TEXT,
ADD COLUMN     "category_id" TEXT,
ADD COLUMN     "content_source" "ArticleContentSource" NOT NULL DEFAULT 'website',
ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "focus_keyword" TEXT,
ADD COLUMN     "instagram_caption" TEXT,
ADD COLUMN     "instagram_date" TIMESTAMP(3),
ADD COLUMN     "instagram_url" TEXT,
ADD COLUMN     "instagram_username" TEXT,
ADD COLUMN     "og_image_id" TEXT,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "article_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "translations" JSONB,

    CONSTRAINT "article_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_gallery" (
    "id" TEXT NOT NULL,
    "article_id" TEXT NOT NULL,
    "media_id" TEXT NOT NULL,
    "caption" TEXT,
    "alt_text" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_gallery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "article_categories_slug_key" ON "article_categories"("slug");

-- CreateIndex
CREATE INDEX "articles_category_id_idx" ON "articles"("category_id");

-- CreateIndex
CREATE INDEX "articles_featured_idx" ON "articles"("featured");

-- AddForeignKey
ALTER TABLE "article_gallery" ADD CONSTRAINT "article_gallery_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_gallery" ADD CONSTRAINT "article_gallery_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "article_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_og_image_id_fkey" FOREIGN KEY ("og_image_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
