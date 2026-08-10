-- CreateEnum
CREATE TYPE "ShippingRelationshipType" AS ENUM ('shipping_partner', 'shipping_line', 'carrier', 'logistics_partner', 'freight_network', 'service_provider', 'other');

-- CreateTable
CREATE TABLE "shipping_partners" (
    "id" TEXT NOT NULL,
    "logo_id" TEXT NOT NULL,
    "partner_name" TEXT NOT NULL,
    "relationship_type" "ShippingRelationshipType" NOT NULL DEFAULT 'shipping_partner',
    "description" TEXT,
    "website_url" TEXT,
    "open_in_new_tab" BOOLEAN NOT NULL DEFAULT true,
    "alt_text" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "translations" JSONB,

    CONSTRAINT "shipping_partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "homepage_shipping_section" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'GLOBAL SHIPPING PARTNER',
    "subtitle" TEXT NOT NULL DEFAULT 'Connecting our export operations with reliable shipping and logistics networks for international delivery.',
    "marquee_duration_seconds" INTEGER NOT NULL DEFAULT 50,
    "show_partner_name" BOOLEAN NOT NULL DEFAULT true,
    "show_relationship_type" BOOLEAN NOT NULL DEFAULT true,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "translations" JSONB,

    CONSTRAINT "homepage_shipping_section_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "shipping_partners" ADD CONSTRAINT "shipping_partners_logo_id_fkey" FOREIGN KEY ("logo_id") REFERENCES "media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
