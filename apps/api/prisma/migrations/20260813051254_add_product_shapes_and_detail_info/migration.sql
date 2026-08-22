-- AlterEnum
ALTER TYPE "ProductSpecificationGroup" ADD VALUE 'detail_info';

-- CreateTable
CREATE TABLE "product_shapes" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "media_id" TEXT,
    "sizes" TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL DEFAULT 0,
    "translations" JSONB,

    CONSTRAINT "product_shapes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "product_shapes" ADD CONSTRAINT "product_shapes_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_shapes" ADD CONSTRAINT "product_shapes_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
