-- CreateEnum
CREATE TYPE "HeroButtonStyle" AS ENUM ('primary', 'secondary');

-- CreateEnum
CREATE TYPE "HeroTextAlignment" AS ENUM ('left', 'center', 'right');

-- AlterTable
ALTER TABLE "hero_slides" ADD COLUMN     "button_1_enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "button_1_style" "HeroButtonStyle" NOT NULL DEFAULT 'primary',
ADD COLUMN     "button_2_enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "button_2_style" "HeroButtonStyle" NOT NULL DEFAULT 'secondary',
ADD COLUMN     "description" TEXT,
ADD COLUMN     "eyebrow_text" TEXT,
ADD COLUMN     "overlay_opacity" INTEGER NOT NULL DEFAULT 35,
ADD COLUMN     "text_alignment" "HeroTextAlignment" NOT NULL DEFAULT 'center';
