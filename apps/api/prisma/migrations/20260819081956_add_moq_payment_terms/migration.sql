-- CreateTable
CREATE TABLE "about_company_moq_payment_section" (
    "id" TEXT NOT NULL,
    "eyebrow" TEXT NOT NULL DEFAULT 'ORDERING & PAYMENT TERMS',
    "heading" TEXT NOT NULL DEFAULT 'Minimum Order & Payment Terms',
    "introduction" TEXT NOT NULL DEFAULT 'PPN supports regular and large-volume coconut product procurement for both local and international buyers. We provide clear and flexible transaction processes based on product type, order volume, specifications, and mutual agreement.',
    "supply_capacity_title" TEXT NOT NULL DEFAULT 'Supply Capacity',
    "supply_capacity_description" TEXT NOT NULL DEFAULT 'Supported by our supplier network and operational facilities in Palu, PPN is capable of handling large-volume orders and recurring supply requirements according to agreed capacity and delivery schedules.',
    "commitment_title" TEXT NOT NULL DEFAULT 'Transparent terms. Flexible coordination. Long-term partnerships.',
    "commitment_description" TEXT NOT NULL DEFAULT 'We prioritize transparency, process efficiency, and flexibility in every transaction to build sustainable and long-term business relationships with our buyers and partners.',
    "cta_title" TEXT NOT NULL DEFAULT 'Discuss Your Requirements',
    "cta_description" TEXT NOT NULL DEFAULT 'For volume requirements, product specifications, pricing, and payment terms, please contact the PPN team for a tailored quotation based on your needs.',
    "cta_button_label" TEXT NOT NULL DEFAULT 'Contact PPN',
    "cta_button_href" TEXT NOT NULL DEFAULT '/contact#request-quotation',
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "translations" JSONB,

    CONSTRAINT "about_company_moq_payment_section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moq_payment_quick_cards" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL DEFAULT '',
    "icon" TEXT NOT NULL DEFAULT 'container',
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "translations" JSONB,

    CONSTRAINT "moq_payment_quick_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moq_payment_business_terms" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "translations" JSONB,

    CONSTRAINT "moq_payment_business_terms_pkey" PRIMARY KEY ("id")
);
