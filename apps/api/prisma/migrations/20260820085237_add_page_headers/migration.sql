-- CreateEnum
CREATE TYPE "PageHeaderOverlayType" AS ENUM ('dark', 'light', 'green', 'gradient');

-- CreateEnum
CREATE TYPE "PageHeaderPosition" AS ENUM ('center', 'center_top', 'center_bottom', 'left', 'right');

-- CreateEnum
CREATE TYPE "PageHeaderHeightPreset" AS ENUM ('compact', 'standard', 'tall');

-- CreateTable
CREATE TABLE "page_headers" (
    "id" TEXT NOT NULL,
    "page_key" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "background_image_id" TEXT,
    "mobile_background_image_id" TEXT,
    "alt_text" TEXT,
    "custom_title" TEXT,
    "subtitle" TEXT,
    "overlay_enabled" BOOLEAN,
    "overlay_type" "PageHeaderOverlayType",
    "overlay_opacity" INTEGER,
    "background_position" "PageHeaderPosition",
    "mobile_background_position" "PageHeaderPosition",
    "height_preset" "PageHeaderHeightPreset",
    "title_color" TEXT,
    "subtitle_color" TEXT,
    "breadcrumb_color" TEXT,
    "show_breadcrumb" BOOLEAN,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_headers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "page_headers_page_key_key" ON "page_headers"("page_key");

-- AddForeignKey
ALTER TABLE "page_headers" ADD CONSTRAINT "page_headers_background_image_id_fkey" FOREIGN KEY ("background_image_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_headers" ADD CONSTRAINT "page_headers_mobile_background_image_id_fkey" FOREIGN KEY ("mobile_background_image_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
