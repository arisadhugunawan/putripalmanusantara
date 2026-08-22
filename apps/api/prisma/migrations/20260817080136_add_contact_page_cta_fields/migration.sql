-- AlterTable
ALTER TABLE "contact_page_settings" ADD COLUMN     "buyer_cta_button_text" TEXT NOT NULL DEFAULT 'Explore Our Products',
ADD COLUMN     "buyer_cta_description" TEXT NOT NULL DEFAULT 'Explore PPN''s coconut products and connect with our export team for specifications, availability, and shipment requirements.',
ADD COLUMN     "buyer_cta_heading" TEXT NOT NULL DEFAULT 'Looking for Reliable Indonesian Coconut Supply?',
ADD COLUMN     "hero_cta_primary_text" TEXT NOT NULL DEFAULT 'Talk to PPN',
ADD COLUMN     "hero_cta_secondary_text" TEXT NOT NULL DEFAULT 'View Our Locations',
ADD COLUMN     "supplier_cta_button_text" TEXT NOT NULL DEFAULT 'Talk to Our Supply Team',
ADD COLUMN     "supplier_cta_description" TEXT NOT NULL DEFAULT 'We welcome farmers, collectors, suppliers, and long-term supply partners interested in building reliable coconut supply partnerships with PPN.',
ADD COLUMN     "supplier_cta_heading" TEXT NOT NULL DEFAULT 'Looking to Supply PPN?',
ADD COLUMN     "supplier_cta_whatsapp_message" TEXT NOT NULL DEFAULT 'Hello PPN Team,

I am interested in becoming a supplier / supply partner. I would like to know more about PPN''s current coconut sourcing requirements, specifications, required volume, and supply process.

Thank you.';
