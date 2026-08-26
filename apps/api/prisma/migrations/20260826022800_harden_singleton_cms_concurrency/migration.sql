-- AlterTable: P1-6 — add a `singleton` marker column (always TRUE, UNIQUE) to each
-- true global-singleton CMS table, so a second row is impossible at the database level.
-- Purely additive: NOT NULL with a DEFAULT means the existing single row in every one
-- of these 22 tables is populated automatically; no data is modified, no row is deleted,
-- no primary key changes, no existing FK is affected.

ALTER TABLE "about_company_facilities_faq_section" ADD COLUMN     "singleton" BOOLEAN NOT NULL DEFAULT true;
CREATE UNIQUE INDEX "about_company_facilities_faq_section_singleton_key" ON "about_company_facilities_faq_section"("singleton");

ALTER TABLE "about_company_facilities_section" ADD COLUMN     "singleton" BOOLEAN NOT NULL DEFAULT true;
CREATE UNIQUE INDEX "about_company_facilities_section_singleton_key" ON "about_company_facilities_section"("singleton");

ALTER TABLE "about_company_legal_section" ADD COLUMN     "singleton" BOOLEAN NOT NULL DEFAULT true;
CREATE UNIQUE INDEX "about_company_legal_section_singleton_key" ON "about_company_legal_section"("singleton");

ALTER TABLE "about_company_moq_payment_section" ADD COLUMN     "singleton" BOOLEAN NOT NULL DEFAULT true;
CREATE UNIQUE INDEX "about_company_moq_payment_section_singleton_key" ON "about_company_moq_payment_section"("singleton");

ALTER TABLE "about_company_profile" ADD COLUMN     "singleton" BOOLEAN NOT NULL DEFAULT true;
CREATE UNIQUE INDEX "about_company_profile_singleton_key" ON "about_company_profile"("singleton");

ALTER TABLE "about_company_settings" ADD COLUMN     "singleton" BOOLEAN NOT NULL DEFAULT true;
CREATE UNIQUE INDEX "about_company_settings_singleton_key" ON "about_company_settings"("singleton");

ALTER TABLE "about_company_shipment_terms_section" ADD COLUMN     "singleton" BOOLEAN NOT NULL DEFAULT true;
CREATE UNIQUE INDEX "about_company_shipment_terms_section_singleton_key" ON "about_company_shipment_terms_section"("singleton");

ALTER TABLE "about_company_team_section" ADD COLUMN     "singleton" BOOLEAN NOT NULL DEFAULT true;
CREATE UNIQUE INDEX "about_company_team_section_singleton_key" ON "about_company_team_section"("singleton");

ALTER TABLE "about_company_what_we_do_section" ADD COLUMN     "singleton" BOOLEAN NOT NULL DEFAULT true;
CREATE UNIQUE INDEX "about_company_what_we_do_section_singleton_key" ON "about_company_what_we_do_section"("singleton");

ALTER TABLE "ai_settings" ADD COLUMN     "singleton" BOOLEAN NOT NULL DEFAULT true;
CREATE UNIQUE INDEX "ai_settings_singleton_key" ON "ai_settings"("singleton");

ALTER TABLE "ai_sync_status" ADD COLUMN     "singleton" BOOLEAN NOT NULL DEFAULT true;
CREATE UNIQUE INDEX "ai_sync_status_singleton_key" ON "ai_sync_status"("singleton");

ALTER TABLE "contact_page_published_snapshot" ADD COLUMN     "singleton" BOOLEAN NOT NULL DEFAULT true;
CREATE UNIQUE INDEX "contact_page_published_snapshot_singleton_key" ON "contact_page_published_snapshot"("singleton");

ALTER TABLE "contact_page_settings" ADD COLUMN     "singleton" BOOLEAN NOT NULL DEFAULT true;
CREATE UNIQUE INDEX "contact_page_settings_singleton_key" ON "contact_page_settings"("singleton");

ALTER TABLE "factory_profile" ADD COLUMN     "singleton" BOOLEAN NOT NULL DEFAULT true;
CREATE UNIQUE INDEX "factory_profile_singleton_key" ON "factory_profile"("singleton");

ALTER TABLE "footer_settings" ADD COLUMN     "singleton" BOOLEAN NOT NULL DEFAULT true;
CREATE UNIQUE INDEX "footer_settings_singleton_key" ON "footer_settings"("singleton");

ALTER TABLE "homepage_about_preview" ADD COLUMN     "singleton" BOOLEAN NOT NULL DEFAULT true;
CREATE UNIQUE INDEX "homepage_about_preview_singleton_key" ON "homepage_about_preview"("singleton");

ALTER TABLE "homepage_export_reach" ADD COLUMN     "singleton" BOOLEAN NOT NULL DEFAULT true;
CREATE UNIQUE INDEX "homepage_export_reach_singleton_key" ON "homepage_export_reach"("singleton");

ALTER TABLE "homepage_partners_section" ADD COLUMN     "singleton" BOOLEAN NOT NULL DEFAULT true;
CREATE UNIQUE INDEX "homepage_partners_section_singleton_key" ON "homepage_partners_section"("singleton");

ALTER TABLE "homepage_process_section" ADD COLUMN     "singleton" BOOLEAN NOT NULL DEFAULT true;
CREATE UNIQUE INDEX "homepage_process_section_singleton_key" ON "homepage_process_section"("singleton");

ALTER TABLE "homepage_shipping_section" ADD COLUMN     "singleton" BOOLEAN NOT NULL DEFAULT true;
CREATE UNIQUE INDEX "homepage_shipping_section_singleton_key" ON "homepage_shipping_section"("singleton");

ALTER TABLE "homepage_supply_network_section" ADD COLUMN     "singleton" BOOLEAN NOT NULL DEFAULT true;
CREATE UNIQUE INDEX "homepage_supply_network_section_singleton_key" ON "homepage_supply_network_section"("singleton");

ALTER TABLE "site_branding" ADD COLUMN     "singleton" BOOLEAN NOT NULL DEFAULT true;
CREATE UNIQUE INDEX "site_branding_singleton_key" ON "site_branding"("singleton");
