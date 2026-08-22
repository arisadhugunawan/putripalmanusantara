-- AlterTable
ALTER TABLE "facilities" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "facility_type" TEXT,
ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "status" TEXT;

-- AlterTable
ALTER TABLE "facility_gallery" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "alt_text" TEXT,
ADD COLUMN     "caption" TEXT,
ADD COLUMN     "category" TEXT,
ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "title" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "about_company_facilities_section" (
    "id" TEXT NOT NULL,
    "eyebrow" TEXT NOT NULL DEFAULT 'Built for Scale',
    "heading" TEXT NOT NULL DEFAULT 'Our Facilities',
    "description" TEXT NOT NULL DEFAULT '',
    "auto_rotate" BOOLEAN NOT NULL DEFAULT true,
    "rotate_interval_seconds" INTEGER NOT NULL DEFAULT 6,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "translations" JSONB,

    CONSTRAINT "about_company_facilities_section_pkey" PRIMARY KEY ("id")
);
