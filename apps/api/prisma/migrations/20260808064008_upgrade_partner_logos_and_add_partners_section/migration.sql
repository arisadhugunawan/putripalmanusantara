/*
  Warnings:

  - The `category` column on the `partner_logos` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `updated_at` to the `partner_logos` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "partner_logos" ADD COLUMN     "alt_text" TEXT,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "open_in_new_tab" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
DROP COLUMN "category",
ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'Other';

-- DropEnum
DROP TYPE "PartnerLogoCategory";

-- CreateTable
CREATE TABLE "homepage_partners_section" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'TRUSTED INSTITUTIONS & PARTNERS',
    "subtitle" TEXT NOT NULL DEFAULT 'Supporting our commitment to quality, compliance, and reliable international trade.',
    "marquee_duration_seconds" INTEGER NOT NULL DEFAULT 40,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "translations" JSONB,

    CONSTRAINT "homepage_partners_section_pkey" PRIMARY KEY ("id")
);
