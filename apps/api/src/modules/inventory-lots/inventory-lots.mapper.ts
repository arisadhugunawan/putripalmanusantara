import type { InventoryLotModel as InventoryLot } from '../../../generated/prisma/models';

interface ProductSummaryRelation {
  id: string;
  name: string;
}

interface ReceivingSummaryRelation {
  id: string;
  receivingNumber: string;
}

interface WarehouseSummaryRelation {
  id: string;
  name: string;
}

type InventoryLotWithRelations = InventoryLot & {
  product?: ProductSummaryRelation | null;
  receiving?: ReceivingSummaryRelation | null;
  warehouse?: WarehouseSummaryRelation | null;
};

// Explicit allow-list, same discipline as every other mapper in this codebase.
export interface InventoryLotSummary {
  id: string;
  lotNumber: string;
  productId: string;
  product: ProductSummaryRelation | null;
  receivingId: string | null;
  receiving: ReceivingSummaryRelation | null;
  receivingItemId: string | null;
  supplierCompanyId: string | null;
  warehouseId: string | null;
  warehouse: WarehouseSummaryRelation | null;
  quantity: string;
  unit: string;
  status: string;
  origin: string | null;
  createdAt: string;
  updatedAt: string;
}

export function toInventoryLot(
  lot: InventoryLotWithRelations,
): InventoryLotSummary {
  return {
    id: lot.id,
    lotNumber: lot.lotNumber,
    productId: lot.productId,
    product: lot.product ?? null,
    receivingId: lot.receivingId,
    receiving: lot.receiving ?? null,
    receivingItemId: lot.receivingItemId,
    supplierCompanyId: lot.supplierCompanyId,
    warehouseId: lot.warehouseId,
    warehouse: lot.warehouse ?? null,
    quantity: lot.quantity.toString(),
    unit: lot.unit,
    status: lot.status,
    origin: lot.origin,
    createdAt: lot.createdAt.toISOString(),
    updatedAt: lot.updatedAt.toISOString(),
  };
}
