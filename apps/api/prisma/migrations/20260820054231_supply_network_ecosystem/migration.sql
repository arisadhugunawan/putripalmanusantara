-- AlterTable
ALTER TABLE "homepage_supply_network_section" ADD COLUMN     "auto_rotate" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "center_description" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "center_label" TEXT NOT NULL DEFAULT 'PPN',
ADD COLUMN     "center_title" TEXT NOT NULL DEFAULT 'Reliable Coconut Supply',
ADD COLUMN     "effect_3d" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "enable_animation" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "hover_effect" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "particle_flow" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "supply_network_items" ADD COLUMN     "position" TEXT NOT NULL DEFAULT 'top',
ADD COLUMN     "short_title" TEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE "supply_network_connections" (
    "id" TEXT NOT NULL,
    "from_node_id" TEXT NOT NULL,
    "to_node_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supply_network_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supply_network_countries" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "flag_emoji" TEXT NOT NULL DEFAULT '🌍',
    "status" TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "translations" JSONB,

    CONSTRAINT "supply_network_countries_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "supply_network_connections" ADD CONSTRAINT "supply_network_connections_from_node_id_fkey" FOREIGN KEY ("from_node_id") REFERENCES "supply_network_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supply_network_connections" ADD CONSTRAINT "supply_network_connections_to_node_id_fkey" FOREIGN KEY ("to_node_id") REFERENCES "supply_network_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
