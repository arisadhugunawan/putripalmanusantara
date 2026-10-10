import type {
  RFQItemModel as RFQItem,
  RFQModel as RFQ,
} from '../../../generated/prisma/models';

interface ItemWithProduct extends RFQItem {
  product?: { id: string; name: string } | null;
}

interface OpportunitySummaryRelation {
  id: string;
  opportunityNumber: string;
  name: string;
}

type RfqWithRelations = RFQ & {
  company?: { id: string; name: string } | null;
  opportunity?: OpportunitySummaryRelation | null;
  items?: ItemWithProduct[];
  _count?: { items: number };
};

export interface RfqItemSummary {
  id: string;
  productId: string;
  product: { id: string; name: string } | null;
  productNameSnapshot: string | null;
  quantity: string;
  unit: string | null;
  requestedDeliveryDate: string | null;
  specifications: string | null;
  notes: string | null;
}

// Explicit allow-list, same discipline as every other mapper in this CRM track. `items`/
// `opportunity` are only present when the caller's Prisma query actually included them (detail
// responses); `itemCount` only when `_count` was requested (list responses). Opportunity is
// embedded only as its own bare identity — never recursed into its Lead/Inquiry chain.
export interface RfqSummary {
  id: string;
  rfqNumber: string;
  opportunityId: string | null;
  companyId: string;
  company: { id: string; name: string } | null;
  status: string;
  requestedAt: string | null;
  validUntil: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  itemCount?: number;
  items?: RfqItemSummary[];
  opportunity?: OpportunitySummaryRelation;
}

function toRfqItem(item: ItemWithProduct): RfqItemSummary {
  return {
    id: item.id,
    productId: item.productId,
    product: item.product ?? null,
    productNameSnapshot: item.productNameSnapshot,
    // Decimal → string, same convention as Opportunity.estimatedValue — avoids any
    // floating-point rounding of a quantity value.
    quantity: item.quantity.toString(),
    unit: item.unit,
    requestedDeliveryDate: item.requestedDeliveryDate
      ? item.requestedDeliveryDate.toISOString()
      : null,
    specifications: item.specifications,
    notes: item.notes,
  };
}

export function toRfq(rfq: RfqWithRelations): RfqSummary {
  return {
    id: rfq.id,
    rfqNumber: rfq.rfqNumber,
    opportunityId: rfq.opportunityId,
    companyId: rfq.companyId,
    company: rfq.company ?? null,
    status: rfq.status,
    requestedAt: rfq.requestedAt ? rfq.requestedAt.toISOString() : null,
    validUntil: rfq.validUntil ? rfq.validUntil.toISOString() : null,
    notes: rfq.notes,
    createdAt: rfq.createdAt.toISOString(),
    updatedAt: rfq.updatedAt.toISOString(),
    ...(rfq._count && { itemCount: rfq._count.items }),
    ...(rfq.items && { items: rfq.items.map(toRfqItem) }),
    ...(rfq.opportunity && { opportunity: rfq.opportunity }),
  };
}
