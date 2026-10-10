import type {
  QuotationItemModel as QuotationItem,
  QuotationModel as Quotation,
} from '../../../generated/prisma/models';

interface ItemWithProduct extends QuotationItem {
  product?: { id: string; name: string } | null;
}

interface RfqSummaryRelation {
  id: string;
  rfqNumber: string;
}

type QuotationWithRelations = Quotation & {
  company?: { id: string; name: string } | null;
  rfq?: RfqSummaryRelation | null;
  items?: ItemWithProduct[];
  _count?: { items: number };
};

export interface QuotationItemSummary {
  id: string;
  productId: string;
  product: { id: string; name: string } | null;
  productNameSnapshot: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  discount: string | null;
  subtotal: string;
  specifications: string | null;
  notes: string | null;
}

// Explicit allow-list, same discipline as RfqSummary/OpportunitySummary. `items`/`rfq` are only
// present when the caller's Prisma query actually included them (detail responses); `itemCount`
// only when `_count` was requested (list responses). `rfq` is embedded only as its own bare
// identity — never recursively loaded into RFQ→Opportunity→Lead→Inquiry (locked decision 24).
export interface QuotationSummary {
  id: string;
  quotationNumber: string;
  rfqId: string;
  companyId: string;
  company: { id: string; name: string } | null;
  status: string;
  quotationDate: string;
  validUntil: string | null;
  currency: string;
  subtotal: string;
  discount: string | null;
  shippingCost: string | null;
  total: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  itemCount?: number;
  items?: QuotationItemSummary[];
  rfq?: RfqSummaryRelation;
}

function toQuotationItem(item: ItemWithProduct): QuotationItemSummary {
  return {
    id: item.id,
    productId: item.productId,
    product: item.product ?? null,
    productNameSnapshot: item.productNameSnapshot,
    quantity: item.quantity.toString(),
    unit: item.unit,
    unitPrice: item.unitPrice.toString(),
    discount: item.discount ? item.discount.toString() : null,
    subtotal: item.subtotal.toString(),
    specifications: item.specifications,
    notes: item.notes,
  };
}

export function toQuotation(
  quotation: QuotationWithRelations,
): QuotationSummary {
  return {
    id: quotation.id,
    quotationNumber: quotation.quotationNumber,
    rfqId: quotation.rfqId,
    companyId: quotation.companyId,
    company: quotation.company ?? null,
    status: quotation.status,
    quotationDate: quotation.quotationDate.toISOString(),
    validUntil: quotation.validUntil
      ? quotation.validUntil.toISOString()
      : null,
    currency: quotation.currency,
    subtotal: quotation.subtotal.toString(),
    discount: quotation.discount ? quotation.discount.toString() : null,
    shippingCost: quotation.shippingCost
      ? quotation.shippingCost.toString()
      : null,
    total: quotation.total.toString(),
    notes: quotation.notes,
    createdAt: quotation.createdAt.toISOString(),
    updatedAt: quotation.updatedAt.toISOString(),
    ...(quotation._count && { itemCount: quotation._count.items }),
    ...(quotation.items && { items: quotation.items.map(toQuotationItem) }),
    ...(quotation.rfq && { rfq: quotation.rfq }),
  };
}
