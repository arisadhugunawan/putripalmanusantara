import type {
  SupplierRFQItemModel as SupplierRFQItem,
  SupplierRFQModel as SupplierRFQ,
} from '../../../generated/prisma/models';

interface ItemWithProduct extends SupplierRFQItem {
  product?: { id: string; name: string } | null;
}

interface PurchaseRequestSummaryRelation {
  id: string;
  requestNumber: string;
}

type SupplierRfqWithRelations = SupplierRFQ & {
  supplierCompany?: { id: string; name: string } | null;
  purchaseRequest?: PurchaseRequestSummaryRelation | null;
  items?: ItemWithProduct[];
  _count?: { items: number };
};

export interface SupplierRfqItemSummary {
  id: string;
  productId: string;
  product: { id: string; name: string } | null;
  productNameSnapshot: string | null;
  quantity: string;
  unit: string;
  specifications: string | null;
  notes: string | null;
}

export interface SupplierRfqSummary {
  id: string;
  supplierRfqNumber: string;
  purchaseRequestId: string;
  supplierCompanyId: string;
  supplierCompany: { id: string; name: string } | null;
  status: string;
  requestedAt: string | null;
  validUntil: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  itemCount?: number;
  items?: SupplierRfqItemSummary[];
  purchaseRequest?: PurchaseRequestSummaryRelation;
}

function toSupplierRfqItem(item: ItemWithProduct): SupplierRfqItemSummary {
  return {
    id: item.id,
    productId: item.productId,
    product: item.product ?? null,
    productNameSnapshot: item.productNameSnapshot,
    quantity: item.quantity.toString(),
    unit: item.unit,
    specifications: item.specifications,
    notes: item.notes,
  };
}

export function toSupplierRfq(
  supplierRfq: SupplierRfqWithRelations,
): SupplierRfqSummary {
  return {
    id: supplierRfq.id,
    supplierRfqNumber: supplierRfq.supplierRfqNumber,
    purchaseRequestId: supplierRfq.purchaseRequestId,
    supplierCompanyId: supplierRfq.supplierCompanyId,
    supplierCompany: supplierRfq.supplierCompany ?? null,
    status: supplierRfq.status,
    requestedAt: supplierRfq.requestedAt
      ? supplierRfq.requestedAt.toISOString()
      : null,
    validUntil: supplierRfq.validUntil
      ? supplierRfq.validUntil.toISOString()
      : null,
    notes: supplierRfq.notes,
    createdAt: supplierRfq.createdAt.toISOString(),
    updatedAt: supplierRfq.updatedAt.toISOString(),
    ...(supplierRfq._count && { itemCount: supplierRfq._count.items }),
    ...(supplierRfq.items && {
      items: supplierRfq.items.map(toSupplierRfqItem),
    }),
    ...(supplierRfq.purchaseRequest && {
      purchaseRequest: supplierRfq.purchaseRequest,
    }),
  };
}
