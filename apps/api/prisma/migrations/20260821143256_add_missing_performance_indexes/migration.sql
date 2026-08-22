-- Purely additive: new indexes on foreign keys / commonly-filtered-or-sorted columns that
-- previously had none (audit: LegalCertificateDocument and FactoryGalleryImage had zero
-- @@index of any kind, GalleryItem.active/Product.order/Media.uploadedAt were unindexed).
--
-- NOTE: `prisma migrate dev --create-only` also proposed `DROP INDEX
-- "ai_knowledge_chunks_search_vector_idx"` and `ALTER TABLE "ai_knowledge_chunks" ALTER COLUMN
-- "search_vector" DROP DEFAULT` here — spurious drift, not a real change. `search_vector` is a
-- `GENERATED ALWAYS AS (...) STORED` tsvector column (see the `add_ai_assistant` migration),
-- declared `Unsupported("tsvector")` in schema.prisma specifically so Prisma treats it as
-- opaque, but its diff engine still occasionally misreads a GENERATED column's expression as a
-- DEFAULT mismatch. Applying that would have dropped the AI knowledge base's full-text search
-- GIN index for no reason — removed by hand before this migration was ever deployed.

-- CreateIndex
CREATE INDEX "factory_gallery_factory_id_idx" ON "factory_gallery"("factory_id");

-- CreateIndex
CREATE INDEX "factory_gallery_active_idx" ON "factory_gallery"("active");

-- CreateIndex
CREATE INDEX "gallery_items_active_idx" ON "gallery_items"("active");

-- CreateIndex
CREATE INDEX "legal_certificate_documents_category_id_idx" ON "legal_certificate_documents"("category_id");

-- CreateIndex
CREATE INDEX "legal_certificate_documents_active_idx" ON "legal_certificate_documents"("active");

-- CreateIndex
CREATE INDEX "media_uploaded_at_idx" ON "media"("uploaded_at");

-- CreateIndex
CREATE INDEX "products_order_idx" ON "products"("order");
