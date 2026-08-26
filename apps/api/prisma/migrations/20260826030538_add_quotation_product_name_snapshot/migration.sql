-- AlterTable: P2-2 — add a nullable `product_name_snapshot` column to `quotation_requests`,
-- a denormalized copy of Product.name captured at submission time (same idiom as
-- AdminActivityLog.actor_name). Purely additive: nullable with no default, no existing row is
-- modified, no data is deleted, no primary key changes, no existing FK/relation behavior
-- changes (product_id keeps its existing ON DELETE SET NULL).

ALTER TABLE "quotation_requests" ADD COLUMN     "product_name_snapshot" TEXT;
