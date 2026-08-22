-- CreateEnum
CREATE TYPE "ProductMediaSection" AS ENUM ('gallery', 'spec_lab');

-- AlterTable
ALTER TABLE "product_gallery" ADD COLUMN     "caption" TEXT,
ADD COLUMN     "section" "ProductMediaSection" NOT NULL DEFAULT 'gallery';
