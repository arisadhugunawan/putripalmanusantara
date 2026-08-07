-- CreateEnum
CREATE TYPE "HomepageVideoSource" AS ENUM ('none', 'youtube', 'vimeo', 'upload');

-- CreateEnum
CREATE TYPE "HomepageHighlightIcon" AS ENUM ('quality', 'sustainability', 'partnership', 'service', 'globe', 'award');

-- AlterEnum
ALTER TYPE "DecorativeGraphicVariant" ADD VALUE 'container_outline';

-- CreateTable
CREATE TABLE "homepage_about_preview" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT 'About CV. Putri Palma Nusantara',
    "heading" TEXT NOT NULL DEFAULT 'Premium Indonesian Coconut Exporter',
    "paragraph1" TEXT NOT NULL DEFAULT '',
    "paragraph2" TEXT NOT NULL DEFAULT '',
    "paragraph3" TEXT NOT NULL DEFAULT '',
    "cta_text" TEXT NOT NULL DEFAULT 'Get to Know Us',
    "cta_link" TEXT NOT NULL DEFAULT '/about',
    "video_source" "HomepageVideoSource" NOT NULL DEFAULT 'none',
    "video_url" TEXT,
    "video_media_id" TEXT,
    "video_thumbnail_id" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "translations" JSONB,

    CONSTRAINT "homepage_about_preview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "homepage_highlights" (
    "id" TEXT NOT NULL,
    "icon" "HomepageHighlightIcon" NOT NULL DEFAULT 'quality',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "translations" JSONB,

    CONSTRAINT "homepage_highlights_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "homepage_about_preview" ADD CONSTRAINT "homepage_about_preview_video_media_id_fkey" FOREIGN KEY ("video_media_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homepage_about_preview" ADD CONSTRAINT "homepage_about_preview_video_thumbnail_id_fkey" FOREIGN KEY ("video_thumbnail_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
