-- AlterTable
ALTER TABLE "what_we_do_items" ADD COLUMN     "key_points" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "about_company_what_we_do_section" (
    "id" TEXT NOT NULL,
    "eyebrow" TEXT NOT NULL DEFAULT 'What We Supply',
    "heading" TEXT NOT NULL DEFAULT 'Coconut Products for Global Markets',
    "description" TEXT NOT NULL DEFAULT 'From fresh coconuts to processed coconut-derived products, PPN supports international buyers with flexible sourcing, quality-focused handling, and export-oriented supply.',
    "who_heading" TEXT NOT NULL DEFAULT 'Serving Buyers Across the Coconut Value Chain',
    "who_description" TEXT NOT NULL DEFAULT 'PPN works with businesses across the coconut supply chain, from international importers and manufacturers to distributors and industrial users.',
    "buyer_cta_heading" TEXT NOT NULL DEFAULT 'Looking for Coconut Products?',
    "buyer_cta_description" TEXT NOT NULL DEFAULT 'Talk to the PPN team about product specifications, availability, packaging, volume requirements, and export destinations.',
    "buyer_cta_button_text" TEXT NOT NULL DEFAULT 'Explore Our Products',
    "supplier_cta_heading" TEXT NOT NULL DEFAULT 'Want to Supply PPN?',
    "supplier_cta_description" TEXT NOT NULL DEFAULT 'We work with farmers, collectors, suppliers and long-term sourcing partners across Indonesia.',
    "supplier_cta_button_text" TEXT NOT NULL DEFAULT 'Our Supply Network',
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "translations" JSONB,

    CONSTRAINT "about_company_what_we_do_section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "who_we_supply_items" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "icon" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "translations" JSONB,

    CONSTRAINT "who_we_supply_items_pkey" PRIMARY KEY ("id")
);
