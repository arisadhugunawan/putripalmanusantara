-- CreateEnum
CREATE TYPE "ProductSpecificationGroup" AS ENUM ('specification', 'export_info');

-- AlterTable
ALTER TABLE "product_specifications" ADD COLUMN     "group" "ProductSpecificationGroup" NOT NULL DEFAULT 'specification';
