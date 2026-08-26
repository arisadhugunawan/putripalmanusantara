import type { QuotationRequest as SharedQuotationRequest } from '@ppn/shared-types';
import type {
  ProductModel as Product,
  QuotationRequestModel as QuotationRequest,
} from '../../../generated/prisma/models';

type QuotationWithProduct = QuotationRequest & { product: Product | null };

export function toQuotationRequest(
  entry: QuotationWithProduct,
): SharedQuotationRequest {
  return {
    id: entry.id,
    type: entry.type,
    name: entry.name,
    company: entry.company,
    country: entry.country,
    email: entry.email,
    phone: entry.phone,
    product_id: entry.productId,
    // P2-2 — falls back to the denormalized snapshot when the live Product is gone
    // (productId → SET NULL on delete), so historical quotations keep showing what product
    // they were about instead of silently losing that identity.
    product_name: entry.product?.name ?? entry.productNameSnapshot ?? null,
    estimated_quantity: entry.estimatedQuantity,
    message: entry.message,
    status: entry.status,
    source_page: entry.sourcePage,
    created_at: entry.createdAt.toISOString(),
  };
}
