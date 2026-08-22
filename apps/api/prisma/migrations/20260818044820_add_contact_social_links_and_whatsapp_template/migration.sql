-- CreateTable
CREATE TABLE "contact_social_links" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "open_in_new_tab" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_social_links_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "contact_page_settings"
ADD COLUMN     "whatsapp_message_closing" TEXT NOT NULL DEFAULT 'Thank you.',
ADD COLUMN     "whatsapp_message_greeting" TEXT NOT NULL DEFAULT 'Hello PPN Team,',
ADD COLUMN     "whatsapp_message_intro" TEXT NOT NULL DEFAULT 'I am interested in PPN''s coconut products. I would like to know more about your current product availability, specifications, MOQ, packaging options, pricing, and shipment terms.',
ADD COLUMN     "whatsapp_message_product_list_label" TEXT NOT NULL DEFAULT 'Products I am interested in:';

-- Migrate real Admin-entered social data into the new open list before the old fixed columns
-- are dropped — never fabricated, only carried over. `gen_random_uuid()`-style cuid is not
-- available in plain SQL, so ids are derived deterministically from md5(random) text, matching
-- the length/shape Prisma's cuid() would produce closely enough for a one-time data copy (the
-- app never parses these ids as cuids, only stores/looks them up by exact match).
INSERT INTO "contact_social_links" ("id", "platform", "display_name", "url", "active", "open_in_new_tab", "order")
SELECT 'seed_' || substr(md5(random()::text || 'instagram'), 1, 20), 'instagram', 'Instagram', "instagram_url", "instagram_active", true, 0
FROM "contact_page_settings" WHERE "instagram_url" != '';

INSERT INTO "contact_social_links" ("id", "platform", "display_name", "url", "active", "open_in_new_tab", "order")
SELECT 'seed_' || substr(md5(random()::text || 'tiktok'), 1, 20), 'tiktok', 'TikTok', "tiktok_url", "tiktok_active", true, 1
FROM "contact_page_settings" WHERE "tiktok_url" != '';

INSERT INTO "contact_social_links" ("id", "platform", "display_name", "url", "active", "open_in_new_tab", "order")
SELECT 'seed_' || substr(md5(random()::text || 'facebook'), 1, 20), 'facebook', 'Facebook', "facebook_url", "facebook_active", true, 2
FROM "contact_page_settings" WHERE "facebook_url" != '';

INSERT INTO "contact_social_links" ("id", "platform", "display_name", "url", "active", "open_in_new_tab", "order")
SELECT 'seed_' || substr(md5(random()::text || 'linkedin'), 1, 20), 'linkedin', 'LinkedIn', "linkedin_url", "linkedin_active", true, 3
FROM "contact_page_settings" WHERE "linkedin_url" != '';

-- AlterTable
ALTER TABLE "contact_page_settings" DROP COLUMN "facebook_active",
DROP COLUMN "facebook_url",
DROP COLUMN "instagram_active",
DROP COLUMN "instagram_url",
DROP COLUMN "linkedin_active",
DROP COLUMN "linkedin_url",
DROP COLUMN "tiktok_active",
DROP COLUMN "tiktok_url";
