-- CreateTable
CREATE TABLE "about_company_facilities_faq_section" (
    "id" TEXT NOT NULL,
    "eyebrow" TEXT NOT NULL DEFAULT 'FAQ',
    "heading" TEXT NOT NULL DEFAULT 'Frequently Asked Questions',
    "description" TEXT NOT NULL DEFAULT 'We answer the key questions buyers ask before working with PPN.',
    "accordion_mode" TEXT NOT NULL DEFAULT 'single',
    "cta_title" TEXT NOT NULL DEFAULT 'Still have questions?',
    "cta_description" TEXT NOT NULL DEFAULT 'Need product specifications, volume information, or quotation?',
    "cta_primary_label" TEXT NOT NULL DEFAULT 'Contact PPN',
    "cta_primary_href" TEXT NOT NULL DEFAULT '/contact',
    "cta_secondary_label" TEXT NOT NULL DEFAULT 'WhatsApp PPN',
    "cta_secondary_href" TEXT NOT NULL DEFAULT '',
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "translations" JSONB,

    CONSTRAINT "about_company_facilities_faq_section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facilities_faq_items" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT '',
    "icon" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "highlight_text" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "translations" JSONB,

    CONSTRAINT "facilities_faq_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facilities_faq_product_tags" (
    "id" TEXT NOT NULL,
    "faq_item_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "translations" JSONB,

    CONSTRAINT "facilities_faq_product_tags_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "facilities_faq_product_tags" ADD CONSTRAINT "facilities_faq_product_tags_faq_item_id_fkey" FOREIGN KEY ("faq_item_id") REFERENCES "facilities_faq_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
