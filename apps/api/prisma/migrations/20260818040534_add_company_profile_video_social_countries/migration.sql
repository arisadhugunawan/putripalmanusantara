-- AlterTable
ALTER TABLE "about_company_profile" ADD COLUMN     "social_label" TEXT NOT NULL DEFAULT 'Connect With PPN',
ADD COLUMN     "social_visible" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "youtube_video_url" TEXT;

-- AlterTable
ALTER TABLE "export_destinations" ADD COLUMN     "show_in_company_profile" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "about_company_social_links" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "open_in_new_tab" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "about_company_social_links_pkey" PRIMARY KEY ("id")
);
