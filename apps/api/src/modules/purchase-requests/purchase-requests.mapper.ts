import type {
  PurchaseRequestItemModel as PurchaseRequestItem,
  PurchaseRequestModel as PurchaseRequest,
} from '../../../generated/prisma/models';

interface ItemWithProduct extends PurchaseRequestItem {
  product?: { id: string; name: string } | null;
}

type PurchaseRequestWithRelations = PurchaseRequest & {
  items?: ItemWithProduct[];
  _count?: { items: number };
};

export interface PurchaseRequestItemSummary {
  id: string;
  productId: string;
  product: { id: string; name: string } | null;
  productNameSnapshot: string | null;
  quantity: string;
  unit: string;
  requiredDate: string | null;
  specifications: string | null;
  notes: string | null;
}

// Explicit allow-list, same discipline as every other mapper in this CRM/Sales/Procurement
// track. `items` only present when the caller's Prisma query actually included them (detail
// responses); `itemCount` only when `_count` was requested (list responses).
export interface PurchaseRequestSummary {
  id: string;
  requestNumber: string;
  status: string;
  requestedById: string | null;
  requestedByName: string | null;
  requiredDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  itemCount?: number;
  items?: PurchaseRequestItemSummary[];
}

function toPurchaseRequestItem(
  item: ItemWithProduct,
): PurchaseRequestItemSummary {
  return {
    id: item.id,
    productId: item.productId,
    product: item.product ?? null,
    productNameSnapshot: item.productNameSnapshot,
    quantity: item.quantity.toString(),
    unit: item.unit,
    requiredDate: item.requiredDate ? item.requiredDate.toISOString() : null,
    specifications: item.specifications,
    notes: item.notes,
  };
}

export function toPurchaseRequest(
  purchaseRequest: PurchaseRequestWithRelations,
): PurchaseRequestSummary {
  return {
    id: purchaseRequest.id,
    requestNumber: purchaseRequest.requestNumber,
    status: purchaseRequest.status,
    requestedById: purchaseRequest.requestedById,
    requestedByName: purchaseRequest.requestedByName,
    requiredDate: purchaseRequest.requiredDate
      ? purchaseRequest.requiredDate.toISOString()
      : null,
    notes: purchaseRequest.notes,
    createdAt: purchaseRequest.createdAt.toISOString(),
    updatedAt: purchaseRequest.updatedAt.toISOString(),
    ...(purchaseRequest._count && { itemCount: purchaseRequest._count.items }),
    ...(purchaseRequest.items && {
      items: purchaseRequest.items.map(toPurchaseRequestItem),
    }),
  };
}
