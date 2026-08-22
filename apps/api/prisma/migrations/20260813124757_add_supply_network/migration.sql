-- CreateTable
CREATE TABLE "supply_network_items" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT '',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'farmers',
    "illustration_id" TEXT,
    "cta_label" TEXT,
    "cta_href" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "translations" JSONB,

    CONSTRAINT "supply_network_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "homepage_supply_network_section" (
    "id" TEXT NOT NULL,
    "eyebrow" TEXT NOT NULL DEFAULT 'OUR SUPPLY NETWORK',
    "heading" TEXT NOT NULL DEFAULT 'Reliable & Flexible Sourcing',
    "description" TEXT NOT NULL DEFAULT 'PPN builds a flexible sourcing network by working with farmers, collectors, suppliers, and long-term partners to support consistent coconut supply according to product specifications and required volume.',
    "final_heading" TEXT NOT NULL DEFAULT 'A Flexible Network Built for Reliable Supply',
    "final_description" TEXT NOT NULL DEFAULT 'PPN works with diverse sourcing partners to support product availability, specifications, and required volumes.',
    "primary_cta_label" TEXT NOT NULL DEFAULT 'Become a Supply Partner',
    "primary_cta_href" TEXT NOT NULL DEFAULT '/contact',
    "secondary_cta_label" TEXT NOT NULL DEFAULT '',
    "secondary_cta_href" TEXT NOT NULL DEFAULT '',
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "translations" JSONB,

    CONSTRAINT "homepage_supply_network_section_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "supply_network_items" ADD CONSTRAINT "supply_network_items_illustration_id_fkey" FOREIGN KEY ("illustration_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
