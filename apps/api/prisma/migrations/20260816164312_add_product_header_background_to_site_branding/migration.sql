-- AlterTable
ALTER TABLE "site_branding" ADD COLUMN     "product_header_background_id" TEXT;

-- AddForeignKey
ALTER TABLE "site_branding" ADD CONSTRAINT "site_branding_product_header_background_id_fkey" FOREIGN KEY ("product_header_background_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
