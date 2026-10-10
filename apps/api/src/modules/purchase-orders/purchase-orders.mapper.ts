import type {
  PurchaseOrderItemModel as PurchaseOrderItem,
  PurchaseOrderModel as PurchaseOrder,
} from '../../../generated/prisma/models';

interface ItemWithProduct extends PurchaseOrderItem {
  product?: { id: string; name: string } | null;
}

interface SupplierQuotationSummaryRelation {
  id: string;
  supplierQuotationNumber: string;
}

type PurchaseOrderWithRelations = PurchaseOrder & {
  supplierCompany?: { id: string; name: string } | null;
  supplierQuotation?: SupplierQuotationSummaryRelation | null;
  items?: ItemWithProduct[];
  _count?: { items: number };
};

export interface PurchaseOrderItemSummary {
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

export interface PurchaseOrderSummary {
  id: string;
  purchaseOrderNumber: string;
  purchaseRequestId: string | null;
  supplierQuotationId: string | null;
  supplierCompanyId: string;
  supplierCompany: { id: string; name: string } | null;
  status: string;
  orderDate: string;
  expectedDeliveryDate: string | null;
  currency: string;
  subtotal: string;
  discount: string | null;
  shippingCost: string | null;
  total: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  itemCount?: number;
  items?: PurchaseOrderItemSummary[];
  supplierQuotation?: SupplierQuotationSummaryRelation;
}

function toPurchaseOrderItem(item: ItemWithProduct): PurchaseOrderItemSummary {
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

export function toPurchaseOrder(
  purchaseOrder: PurchaseOrderWithRelations,
): PurchaseOrderSummary {
  return {
    id: purchaseOrder.id,
    purchaseOrderNumber: purchaseOrder.purchaseOrderNumber,
    purchaseRequestId: purchaseOrder.purchaseRequestId,
    supplierQuotationId: purchaseOrder.supplierQuotationId,
    supplierCompanyId: purchaseOrder.supplierCompanyId,
    supplierCompany: purchaseOrder.supplierCompany ?? null,
    status: purchaseOrder.status,
    orderDate: purchaseOrder.orderDate.toISOString(),
    expectedDeliveryDate: purchaseOrder.expectedDeliveryDate
      ? purchaseOrder.expectedDeliveryDate.toISOString()
      : null,
    currency: purchaseOrder.currency,
    subtotal: purchaseOrder.subtotal.toString(),
    discount: purchaseOrder.discount ? purchaseOrder.discount.toString() : null,
    shippingCost: purchaseOrder.shippingCost
      ? purchaseOrder.shippingCost.toString()
      : null,
    total: purchaseOrder.total.toString(),
    notes: purchaseOrder.notes,
    createdAt: purchaseOrder.createdAt.toISOString(),
    updatedAt: purchaseOrder.updatedAt.toISOString(),
    ...(purchaseOrder._count && { itemCount: purchaseOrder._count.items }),
    ...(purchaseOrder.items && {
      items: purchaseOrder.items.map(toPurchaseOrderItem),
    }),
    ...(purchaseOrder.supplierQuotation && {
      supplierQuotation: purchaseOrder.supplierQuotation,
    }),
  };
}
