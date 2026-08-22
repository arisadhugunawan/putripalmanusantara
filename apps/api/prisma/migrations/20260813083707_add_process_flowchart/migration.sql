-- AlterTable
ALTER TABLE "production_steps" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "cta_href" TEXT,
ADD COLUMN     "cta_label" TEXT,
ADD COLUMN     "icon" TEXT NOT NULL DEFAULT 'sourcing',
ADD COLUMN     "label" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "homepage_process_section" (
    "id" TEXT NOT NULL,
    "eyebrow" TEXT NOT NULL DEFAULT 'OUR SUPPLY & EXPORT PROCESS',
    "heading" TEXT NOT NULL DEFAULT 'From Local Sourcing to Global Delivery',
    "description" TEXT NOT NULL DEFAULT 'A structured process designed to maintain quality, efficiency, and reliability from product sourcing to final shipment.',
    "final_heading" TEXT NOT NULL DEFAULT 'Ready for your next shipment?',
    "final_description" TEXT NOT NULL DEFAULT 'We are ready to discuss your product requirements and export needs.',
    "primary_cta_label" TEXT NOT NULL DEFAULT 'Explore Our Products',
    "primary_cta_href" TEXT NOT NULL DEFAULT '/products',
    "secondary_cta_label" TEXT NOT NULL DEFAULT 'Contact PPN',
    "secondary_cta_href" TEXT NOT NULL DEFAULT '/contact',
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "homepage_process_section_pkey" PRIMARY KEY ("id")
);
