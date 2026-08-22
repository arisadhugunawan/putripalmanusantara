-- AlterTable
ALTER TABLE "about_company_profile" ADD COLUMN     "business_id_number" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "business_type" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "closing_cta_href" TEXT,
ADD COLUMN     "closing_cta_label" TEXT,
ADD COLUMN     "closing_description" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "closing_heading" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "closing_label" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "closing_visible" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "cta_href" TEXT,
ADD COLUMN     "cta_label" TEXT,
ADD COLUMN     "established_year" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "export_description" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "export_heading" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "export_label" TEXT NOT NULL DEFAULT 'Global Export Reach',
ADD COLUMN     "export_visible" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "eyebrow" TEXT NOT NULL DEFAULT 'Who We Are',
ADD COLUMN     "facts_heading" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "facts_label" TEXT NOT NULL DEFAULT 'Company Facts',
ADD COLUMN     "facts_visible" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "legal_heading" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "legal_label" TEXT NOT NULL DEFAULT 'Company Information',
ADD COLUMN     "legal_visible" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "registered_address" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "scope_description" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "scope_heading" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "scope_label" TEXT NOT NULL DEFAULT 'What We Do',
ADD COLUMN     "scope_visible" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "story_description" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "story_heading" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "story_image_id" TEXT,
ADD COLUMN     "story_label" TEXT NOT NULL DEFAULT 'About PPN',
ADD COLUMN     "story_secondary_description" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "story_visible" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "subheading" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "export_destinations" ADD COLUMN     "region" TEXT;

-- AlterTable
ALTER TABLE "what_we_do_items" ADD COLUMN     "product_id" TEXT;

-- CreateTable
CREATE TABLE "about_company_facts" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "icon" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "translations" JSONB,

    CONSTRAINT "about_company_facts_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "about_company_profile" ADD CONSTRAINT "about_company_profile_story_image_id_fkey" FOREIGN KEY ("story_image_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "what_we_do_items" ADD CONSTRAINT "what_we_do_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
