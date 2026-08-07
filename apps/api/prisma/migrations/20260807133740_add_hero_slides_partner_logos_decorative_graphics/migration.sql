-- CreateEnum
CREATE TYPE "PartnerLogoCategory" AS ENUM ('government', 'certification', 'logistics', 'association', 'bank', 'other');

-- CreateEnum
CREATE TYPE "DecorativeGraphicVariant" AS ENUM ('leaf_outline', 'coconut_cross_section', 'ship_outline', 'compass', 'world_map_outline', 'palm_leaf', 'coconut_tree_silhouette');

-- CreateEnum
CREATE TYPE "DecorativeGraphicPlacement" AS ENUM ('hero_behind_content', 'top_left', 'top_right', 'bottom_left', 'bottom_right', 'center_background');

-- CreateTable
CREATE TABLE "hero_slides" (
    "id" TEXT NOT NULL,
    "desktop_image_id" TEXT,
    "mobile_image_id" TEXT,
    "heading" TEXT NOT NULL,
    "subheading" TEXT NOT NULL,
    "button_1_text" TEXT,
    "button_1_link" TEXT,
    "button_2_text" TEXT,
    "button_2_link" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "publish_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "translations" JSONB,

    CONSTRAINT "hero_slides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_logos" (
    "id" TEXT NOT NULL,
    "logo_id" TEXT NOT NULL,
    "partner_name" TEXT NOT NULL,
    "website_url" TEXT,
    "category" "PartnerLogoCategory" NOT NULL DEFAULT 'other',
    "order" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "translations" JSONB,

    CONSTRAINT "partner_logos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decorative_graphics" (
    "id" TEXT NOT NULL,
    "page" TEXT NOT NULL DEFAULT 'home',
    "variant" "DecorativeGraphicVariant" NOT NULL,
    "placement" "DecorativeGraphicPlacement" NOT NULL,
    "opacity" DOUBLE PRECISION NOT NULL DEFAULT 0.06,
    "scale" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "order" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "decorative_graphics_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "hero_slides" ADD CONSTRAINT "hero_slides_desktop_image_id_fkey" FOREIGN KEY ("desktop_image_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hero_slides" ADD CONSTRAINT "hero_slides_mobile_image_id_fkey" FOREIGN KEY ("mobile_image_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_logos" ADD CONSTRAINT "partner_logos_logo_id_fkey" FOREIGN KEY ("logo_id") REFERENCES "media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
