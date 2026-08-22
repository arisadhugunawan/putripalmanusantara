-- CreateTable
CREATE TABLE "site_branding" (
    "id" TEXT NOT NULL,
    "header_logo_id" TEXT,
    "header_logo_enabled" BOOLEAN NOT NULL DEFAULT true,
    "header_logo_alt" TEXT,
    "footer_logo_id" TEXT,
    "footer_logo_enabled" BOOLEAN NOT NULL DEFAULT true,
    "footer_logo_alt" TEXT,
    "mobile_logo_id" TEXT,
    "use_mobile_logo" BOOLEAN NOT NULL DEFAULT false,
    "mobile_logo_alt" TEXT,
    "favicon_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "site_branding_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "site_branding" ADD CONSTRAINT "site_branding_header_logo_id_fkey" FOREIGN KEY ("header_logo_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_branding" ADD CONSTRAINT "site_branding_footer_logo_id_fkey" FOREIGN KEY ("footer_logo_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_branding" ADD CONSTRAINT "site_branding_mobile_logo_id_fkey" FOREIGN KEY ("mobile_logo_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_branding" ADD CONSTRAINT "site_branding_favicon_id_fkey" FOREIGN KEY ("favicon_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
