-- Add the stable `slug` identifier for the fixed 10-facility master list.
-- Existing rows (pre-redesign, admin-created) are backfilled by name so their id/cover
-- image/gallery photos carry over unchanged; `seedFacilities()` creates the remaining rows.
ALTER TABLE "facilities" ADD COLUMN "slug" TEXT;

UPDATE "facilities" SET "slug" = 'forklift-material-handling' WHERE "name" = 'Forklift' AND "slug" IS NULL;
UPDATE "facilities" SET "slug" = 'weighbridge-20-40ft' WHERE "name" = 'Weighbridge' AND "slug" IS NULL;
UPDATE "facilities" SET "slug" = 'quality-control-area' WHERE "name" = 'Quality Control' AND "slug" IS NULL;
UPDATE "facilities" SET "slug" = 'truck-container-access' WHERE "name" = 'Container Stuffing' AND "slug" IS NULL;
UPDATE "facilities" SET "slug" = 'large-capacity-warehouse' WHERE "name" = 'Warehouse' AND "slug" IS NULL;
UPDATE "facilities" SET "slug" = 'loading-unloading-area' WHERE "name" = 'Loading Area' AND "slug" IS NULL;

-- Any row that still has no slug (unrecognized legacy name) gets a slugified fallback derived
-- from its own name, so the NOT NULL/unique constraints below can never fail on unknown data.
UPDATE "facilities"
SET "slug" = lower(regexp_replace(regexp_replace("name", '[^a-zA-Z0-9]+', '-', 'g'), '(^-|-$)', '', 'g')) || '-' || substring(md5(random()::text), 1, 6)
WHERE "slug" IS NULL;

ALTER TABLE "facilities" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "facilities_slug_key" ON "facilities"("slug");
