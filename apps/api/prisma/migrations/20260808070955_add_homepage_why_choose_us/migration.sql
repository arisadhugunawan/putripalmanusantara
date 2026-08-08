-- CreateEnum
CREATE TYPE "HomepageWhyChooseUsIcon" AS ENUM ('quality', 'supply', 'export_ready', 'consistency', 'sustainability', 'service', 'pricing', 'delivery');

-- CreateTable
CREATE TABLE "homepage_why_choose_us" (
    "id" TEXT NOT NULL,
    "icon" "HomepageWhyChooseUsIcon" NOT NULL DEFAULT 'quality',
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT true,
    "translations" JSONB,

    CONSTRAINT "homepage_why_choose_us_pkey" PRIMARY KEY ("id")
);
