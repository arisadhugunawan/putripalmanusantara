-- AlterTable
ALTER TABLE "legal_certificate_documents" ADD COLUMN     "category_id" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "verified" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "legal_document_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "translations" JSONB,

    CONSTRAINT "legal_document_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "legal_document_categories_slug_key" ON "legal_document_categories"("slug");

-- AddForeignKey
ALTER TABLE "legal_certificate_documents" ADD CONSTRAINT "legal_certificate_documents_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "legal_document_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
