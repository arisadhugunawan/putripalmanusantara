import type {
  ReceivingItemModel as ReceivingItem,
  ReceivingModel as Receiving,
  WeighbridgeTransactionModel as WeighbridgeTransaction,
} from '../../../generated/prisma/models';

interface ItemWithProduct extends ReceivingItem {
  product?: { id: string; name: string } | null;
}

interface PurchaseOrderSummaryRelation {
  id: string;
  purchaseOrderNumber: string;
}

type ReceivingWithRelations = Receiving & {
  warehouse?: { id: string; name: string } | null;
  purchaseOrder?: PurchaseOrderSummaryRelation | null;
  items?: ItemWithProduct[];
  weighbridgeTransactions?: WeighbridgeTransaction[];
  _count?: { items: number };
};

export interface ReceivingItemSummary {
  id: string;
  productId: string;
  product: { id: string; name: string } | null;
  purchaseOrderItemId: string | null;
  productNameSnapshot: string;
  quantityExpected: string | null;
  quantityReceived: string;
  unit: string;
  notes: string | null;
}

export interface WeighbridgeTransactionSummary {
  id: string;
  transactionNumber: string;
  vehicleId: string | null;
  weighInAt: string | null;
  weighOutAt: string | null;
  grossWeight: string | null;
  tareWeight: string | null;
  netWeight: string | null;
  unit: string;
  status: string;
  notes: string | null;
  createdAt: string;
}

// Explicit allow-list, same discipline as every other mapper in this CRM/Sales/Procurement
// track. `items`/`weighbridgeTransactions`/`purchaseOrder` are only present when the caller's
// Prisma query actually included them (detail responses); `itemCount` only when `_count` was
// requested (list responses).
export interface ReceivingSummary {
  id: string;
  receivingNumber: string;
  purchaseOrderId: string;
  warehouseId: string;
  warehouse: { id: string; name: string } | null;
  supplierCompanyId: string | null;
  status: string;
  receivedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  itemCount?: number;
  items?: ReceivingItemSummary[];
  weighbridgeTransactions?: WeighbridgeTransactionSummary[];
  purchaseOrder?: PurchaseOrderSummaryRelation;
}

function toReceivingItem(item: ItemWithProduct): ReceivingItemSummary {
  return {
    id: item.id,
    productId: item.productId,
    product: item.product ?? null,
    purchaseOrderItemId: item.purchaseOrderItemId,
    productNameSnapshot: item.productNameSnapshot,
    quantityExpected: item.quantityExpected
      ? item.quantityExpected.toString()
      : null,
    quantityReceived: item.quantityReceived.toString(),
    unit: item.unit,
    notes: item.notes,
  };
}

export function toWeighbridgeTransaction(
  tx: WeighbridgeTransaction,
): WeighbridgeTransactionSummary {
  return {
    id: tx.id,
    transactionNumber: tx.transactionNumber,
    vehicleId: tx.vehicleId,
    weighInAt: tx.weighInAt ? tx.weighInAt.toISOString() : null,
    weighOutAt: tx.weighOutAt ? tx.weighOutAt.toISOString() : null,
    grossWeight: tx.grossWeight ? tx.grossWeight.toString() : null,
    tareWeight: tx.tareWeight ? tx.tareWeight.toString() : null,
    netWeight: tx.netWeight ? tx.netWeight.toString() : null,
    unit: tx.unit,
    status: tx.status,
    notes: tx.notes,
    createdAt: tx.createdAt.toISOString(),
  };
}

export function toReceiving(
  receiving: ReceivingWithRelations,
): ReceivingSummary {
  return {
    id: receiving.id,
    receivingNumber: receiving.receivingNumber,
    purchaseOrderId: receiving.purchaseOrderId,
    warehouseId: receiving.warehouseId,
    warehouse: receiving.warehouse ?? null,
    supplierCompanyId: receiving.supplierCompanyId,
    status: receiving.status,
    receivedAt: receiving.receivedAt
      ? receiving.receivedAt.toISOString()
      : null,
    notes: receiving.notes,
    createdAt: receiving.createdAt.toISOString(),
    updatedAt: receiving.updatedAt.toISOString(),
    ...(receiving._count && { itemCount: receiving._count.items }),
    ...(receiving.items && { items: receiving.items.map(toReceivingItem) }),
    ...(receiving.weighbridgeTransactions && {
      weighbridgeTransactions: receiving.weighbridgeTransactions.map(
        toWeighbridgeTransaction,
      ),
    }),
    ...(receiving.purchaseOrder && { purchaseOrder: receiving.purchaseOrder }),
  };
}
