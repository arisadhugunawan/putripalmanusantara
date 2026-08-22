-- AlterTable
ALTER TABLE "factory_gallery" ADD COLUMN     "category" TEXT;

-- AlterTable
ALTER TABLE "factory_profile" ADD COLUMN     "eyebrow" TEXT NOT NULL DEFAULT 'Factory & Facilities';

-- CreateTable
CREATE TABLE "factory_videos" (
    "id" TEXT NOT NULL,
    "factory_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "tiktok_url" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "factory_videos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "factory_videos" ADD CONSTRAINT "factory_videos_factory_id_fkey" FOREIGN KEY ("factory_id") REFERENCES "factory_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
