-- CreateEnum
CREATE TYPE "ExportStatus" AS ENUM ('active_destination', 'previous_destination', 'potential_market', 'inactive');

-- CreateTable
CREATE TABLE "export_destinations" (
    "id" TEXT NOT NULL,
    "country_code" TEXT NOT NULL,
    "country_code_alpha3" TEXT NOT NULL,
    "country_name" TEXT NOT NULL,
    "export_status" "ExportStatus" NOT NULL DEFAULT 'active_destination',
    "description" TEXT,
    "export_volume" TEXT,
    "export_frequency" TEXT,
    "destination_port" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "translations" JSONB,

    CONSTRAINT "export_destinations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "homepage_export_reach" (
    "id" TEXT NOT NULL,
    "heading" TEXT NOT NULL DEFAULT 'Global Export Reach',
    "subtitle" TEXT NOT NULL DEFAULT 'Connecting Indonesian coconut products with buyers across international markets.',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "translations" JSONB,

    CONSTRAINT "homepage_export_reach_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ExportDestinationProducts" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ExportDestinationProducts_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "export_destinations_country_code_key" ON "export_destinations"("country_code");

-- CreateIndex
CREATE INDEX "export_destinations_enabled_export_status_idx" ON "export_destinations"("enabled", "export_status");

-- CreateIndex
CREATE INDEX "_ExportDestinationProducts_B_index" ON "_ExportDestinationProducts"("B");

-- AddForeignKey
ALTER TABLE "_ExportDestinationProducts" ADD CONSTRAINT "_ExportDestinationProducts_A_fkey" FOREIGN KEY ("A") REFERENCES "export_destinations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ExportDestinationProducts" ADD CONSTRAINT "_ExportDestinationProducts_B_fkey" FOREIGN KEY ("B") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
