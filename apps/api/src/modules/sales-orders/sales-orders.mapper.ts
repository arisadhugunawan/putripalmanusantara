import type {
  SalesOrderItemModel as SalesOrderItem,
  SalesOrderModel as SalesOrder,
} from '../../../generated/prisma/models';

interface ItemWithProduct extends SalesOrderItem {
  product?: { id: string; name: string } | null;
}

interface QuotationSummaryRelation {
  id: string;
  quotationNumber: string;
}

type SalesOrderWithRelations = SalesOrder & {
  company?: { id: string; name: string } | null;
  quotation?: QuotationSummaryRelation | null;
  items?: ItemWithProduct[];
  _count?: { items: number };
};

export interface SalesOrderItemSummary {
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

// Explicit allow-list, same discipline as every other mapper in this CRM/Sales track. `items`/
// `quotation` are only present when the caller's Prisma query actually included them (detail
// responses); `itemCount` only when `_count` was requested (list responses). `quotation` is
// embedded only as its own bare identity — never recursively loaded into
// Quotation→RFQ→Opportunity→Lead→Inquiry.
export interface SalesOrderSummary {
  id: string;
  salesOrderNumber: string;
  quotationId: string | null;
  companyId: string;
  company: { id: string; name: string } | null;
  status: string;
  orderDate: string;
  requestedDeliveryDate: string | null;
  currency: string;
  subtotal: string;
  discount: string | null;
  shippingCost: string | null;
  total: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  itemCount?: number;
  items?: SalesOrderItemSummary[];
  quotation?: QuotationSummaryRelation;
}

function toSalesOrderItem(item: ItemWithProduct): SalesOrderItemSummary {
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

export function toSalesOrder(
  salesOrder: SalesOrderWithRelations,
): SalesOrderSummary {
  return {
    id: salesOrder.id,
    salesOrderNumber: salesOrder.salesOrderNumber,
    quotationId: salesOrder.quotationId,
    companyId: salesOrder.companyId,
    company: salesOrder.company ?? null,
    status: salesOrder.status,
    orderDate: salesOrder.orderDate.toISOString(),
    requestedDeliveryDate: salesOrder.requestedDeliveryDate
      ? salesOrder.requestedDeliveryDate.toISOString()
      : null,
    currency: salesOrder.currency,
    subtotal: salesOrder.subtotal.toString(),
    discount: salesOrder.discount ? salesOrder.discount.toString() : null,
    shippingCost: salesOrder.shippingCost
      ? salesOrder.shippingCost.toString()
      : null,
    total: salesOrder.total.toString(),
    notes: salesOrder.notes,
    createdAt: salesOrder.createdAt.toISOString(),
    updatedAt: salesOrder.updatedAt.toISOString(),
    ...(salesOrder._count && { itemCount: salesOrder._count.items }),
    ...(salesOrder.items && {
      items: salesOrder.items.map(toSalesOrderItem),
    }),
    ...(salesOrder.quotation && { quotation: salesOrder.quotation }),
  };
}
