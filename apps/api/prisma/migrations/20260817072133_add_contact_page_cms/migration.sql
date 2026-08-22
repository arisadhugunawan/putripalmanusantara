-- CreateEnum
CREATE TYPE "ContactLocationType" AS ENUM ('head_office', 'operational', 'business');

-- CreateTable
CREATE TABLE "contact_page_settings" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL DEFAULT '',
    "whatsapp_number" TEXT NOT NULL DEFAULT '',
    "business_hours_open_days" TEXT[] DEFAULT ARRAY['mon', 'tue', 'wed', 'thu', 'fri', 'sat']::TEXT[],
    "business_hours_open_time" TEXT NOT NULL DEFAULT '08:00',
    "business_hours_close_time" TEXT NOT NULL DEFAULT '17:00',
    "business_hours_utc_offset" INTEGER NOT NULL DEFAULT 7,
    "hero_eyebrow" TEXT NOT NULL DEFAULT 'Contact PPN',
    "hero_heading" TEXT NOT NULL DEFAULT 'Connect With Our Team',
    "hero_description" TEXT NOT NULL DEFAULT 'Whether you are an international buyer looking for reliable coconut products or a local supplier interested in working with PPN, our team is ready to connect with you.',
    "hero_image_id" TEXT,
    "hero_overlay_opacity" INTEGER NOT NULL DEFAULT 55,
    "instagram_url" TEXT NOT NULL DEFAULT '',
    "instagram_active" BOOLEAN NOT NULL DEFAULT false,
    "tiktok_url" TEXT NOT NULL DEFAULT '',
    "tiktok_active" BOOLEAN NOT NULL DEFAULT false,
    "facebook_url" TEXT NOT NULL DEFAULT '',
    "facebook_active" BOOLEAN NOT NULL DEFAULT false,
    "linkedin_url" TEXT NOT NULL DEFAULT '',
    "linkedin_active" BOOLEAN NOT NULL DEFAULT false,
    "main_map_location_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_page_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_locations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location_type" "ContactLocationType" NOT NULL DEFAULT 'operational',
    "label" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL,
    "google_maps_url" TEXT NOT NULL DEFAULT '',
    "phone" TEXT,
    "email" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_page_published_snapshot" (
    "id" TEXT NOT NULL,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "data" JSONB,
    "published_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_page_published_snapshot_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "contact_page_settings" ADD CONSTRAINT "contact_page_settings_hero_image_id_fkey" FOREIGN KEY ("hero_image_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_page_settings" ADD CONSTRAINT "contact_page_settings_main_map_location_id_fkey" FOREIGN KEY ("main_map_location_id") REFERENCES "contact_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
