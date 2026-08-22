-- CreateEnum
CREATE TYPE "FooterOverlayType" AS ENUM ('dark_green', 'charcoal', 'black', 'green_gradient');

-- CreateTable
CREATE TABLE "footer_settings" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "show_cta" BOOLEAN NOT NULL DEFAULT true,
    "show_social" BOOLEAN NOT NULL DEFAULT true,
    "show_contact" BOOLEAN NOT NULL DEFAULT true,
    "show_navigation" BOOLEAN NOT NULL DEFAULT true,
    "company_name" TEXT NOT NULL DEFAULT 'CV. Putri Palma Nusantara',
    "tagline" TEXT NOT NULL DEFAULT 'Coconut Products for Global Markets',
    "description" TEXT NOT NULL DEFAULT 'Indonesian coconut products sourced, handled, and supplied for local and international markets.',
    "background_image_id" TEXT,
    "mobile_background_image_id" TEXT,
    "background_alt_text" TEXT,
    "overlay_type" "FooterOverlayType" NOT NULL DEFAULT 'dark_green',
    "overlay_opacity" INTEGER NOT NULL DEFAULT 70,
    "background_position" "PageHeaderPosition" NOT NULL DEFAULT 'center',
    "mobile_background_position" "PageHeaderPosition" NOT NULL DEFAULT 'center',
    "cta_headline" TEXT NOT NULL DEFAULT 'Ready to Source from Indonesia?',
    "cta_description" TEXT NOT NULL DEFAULT 'Talk to our team about product specifications, volume requirements, and shipment arrangements.',
    "cta_primary_text" TEXT NOT NULL DEFAULT 'Explore Products',
    "cta_secondary_text" TEXT NOT NULL DEFAULT 'Talk to PPN',
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "footer_settings_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "footer_settings" ADD CONSTRAINT "footer_settings_background_image_id_fkey" FOREIGN KEY ("background_image_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "footer_settings" ADD CONSTRAINT "footer_settings_mobile_background_image_id_fkey" FOREIGN KEY ("mobile_background_image_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
