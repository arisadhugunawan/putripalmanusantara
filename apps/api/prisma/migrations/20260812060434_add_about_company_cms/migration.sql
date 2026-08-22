-- CreateEnum
CREATE TYPE "LegalDocumentType" AS ENUM ('certificate', 'legal_document', 'business_license', 'registration_document', 'export_certificate', 'quality_certificate', 'other');

-- CreateTable
CREATE TABLE "about_company_section_config" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "about_company_section_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "about_company_published_snapshot" (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "published_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "about_company_published_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "about_company_profile" (
    "id" TEXT NOT NULL,
    "headline" TEXT NOT NULL DEFAULT 'CV. Putri Palma Nusantara',
    "short_description" TEXT NOT NULL DEFAULT '',
    "main_description" TEXT NOT NULL DEFAULT '',
    "vision" TEXT NOT NULL DEFAULT '',
    "mission" TEXT NOT NULL DEFAULT '',
    "company_overview" TEXT NOT NULL DEFAULT '',
    "main_image_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "translations" JSONB,

    CONSTRAINT "about_company_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "about_company_gallery" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "media_id" TEXT NOT NULL,
    "caption" TEXT,
    "alt_text" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "about_company_gallery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_members" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "biography" TEXT NOT NULL DEFAULT '',
    "photo_id" TEXT,
    "social_link" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "translations" JSONB,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "what_we_do_items" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "short_description" TEXT NOT NULL DEFAULT '',
    "detailed_description" TEXT NOT NULL DEFAULT '',
    "media_id" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "translations" JSONB,

    CONSTRAINT "what_we_do_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_certificate_documents" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "document_type" "LegalDocumentType" NOT NULL DEFAULT 'other',
    "document_number" TEXT,
    "issuing_organization" TEXT,
    "issue_date" TIMESTAMP(3),
    "expiry_date" TIMESTAMP(3),
    "description" TEXT,
    "file_id" TEXT,
    "preview_image_id" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "translations" JSONB,

    CONSTRAINT "legal_certificate_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "factory_profile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Factory',
    "short_description" TEXT NOT NULL DEFAULT '',
    "detailed_description" TEXT NOT NULL DEFAULT '',
    "location" TEXT,
    "operational_info" TEXT,
    "capacity" TEXT,
    "additional_notes" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "translations" JSONB,

    CONSTRAINT "factory_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "factory_gallery" (
    "id" TEXT NOT NULL,
    "factory_id" TEXT NOT NULL,
    "media_id" TEXT NOT NULL,
    "title" TEXT,
    "caption" TEXT,
    "alt_text" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "factory_gallery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "factory_documents" (
    "id" TEXT NOT NULL,
    "factory_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "file_id" TEXT,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "factory_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "about_company_settings" (
    "id" TEXT NOT NULL,
    "page_title" TEXT NOT NULL DEFAULT 'About Us',
    "page_subtitle" TEXT NOT NULL DEFAULT '',
    "seo_title" TEXT,
    "seo_description" TEXT,
    "og_image_id" TEXT,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "about_company_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "about_company_section_config_key_key" ON "about_company_section_config"("key");

-- CreateIndex
CREATE INDEX "about_company_published_snapshot_published_at_idx" ON "about_company_published_snapshot"("published_at");

-- AddForeignKey
ALTER TABLE "about_company_profile" ADD CONSTRAINT "about_company_profile_main_image_id_fkey" FOREIGN KEY ("main_image_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "about_company_gallery" ADD CONSTRAINT "about_company_gallery_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "about_company_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "about_company_gallery" ADD CONSTRAINT "about_company_gallery_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_photo_id_fkey" FOREIGN KEY ("photo_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "what_we_do_items" ADD CONSTRAINT "what_we_do_items_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_certificate_documents" ADD CONSTRAINT "legal_certificate_documents_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_certificate_documents" ADD CONSTRAINT "legal_certificate_documents_preview_image_id_fkey" FOREIGN KEY ("preview_image_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory_gallery" ADD CONSTRAINT "factory_gallery_factory_id_fkey" FOREIGN KEY ("factory_id") REFERENCES "factory_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory_gallery" ADD CONSTRAINT "factory_gallery_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory_documents" ADD CONSTRAINT "factory_documents_factory_id_fkey" FOREIGN KEY ("factory_id") REFERENCES "factory_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory_documents" ADD CONSTRAINT "factory_documents_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "about_company_settings" ADD CONSTRAINT "about_company_settings_og_image_id_fkey" FOREIGN KEY ("og_image_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
