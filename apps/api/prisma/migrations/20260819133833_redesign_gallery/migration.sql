/*
  Warnings:

  - You are about to drop the column `category` on the `gallery_items` table. All the data in the column will be lost.
  - Added the required column `category_id` to the `gallery_items` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "GalleryMediaType" AS ENUM ('image', 'video', 'youtube', 'tiktok');

-- DropForeignKey
ALTER TABLE "gallery_items" DROP CONSTRAINT "gallery_items_media_id_fkey";

-- DropIndex
DROP INDEX "gallery_items_category_idx";

-- AlterTable
ALTER TABLE "gallery_items" DROP COLUMN "category",
ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "alt_text" TEXT,
ADD COLUMN     "captured_at" TIMESTAMP(3),
ADD COLUMN     "category_id" TEXT NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "external_url" TEXT,
ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "media_type" "GalleryMediaType" NOT NULL DEFAULT 'image',
ADD COLUMN     "short_description" TEXT,
ADD COLUMN     "title" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "media_id" DROP NOT NULL;

-- DropEnum
DROP TYPE "GalleryCategory";

-- CreateTable
CREATE TABLE "gallery_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "translations" JSONB,

    CONSTRAINT "gallery_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "gallery_categories_slug_key" ON "gallery_categories"("slug");

-- CreateIndex
CREATE INDEX "gallery_items_category_id_idx" ON "gallery_items"("category_id");

-- AddForeignKey
ALTER TABLE "gallery_items" ADD CONSTRAINT "gallery_items_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gallery_items" ADD CONSTRAINT "gallery_items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "gallery_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
