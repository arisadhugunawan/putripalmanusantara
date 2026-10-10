import type { InventoryModel as Inventory } from '../../../generated/prisma/models';

interface ProductSummaryRelation {
  id: string;
  name: string;
}

interface WarehouseSummaryRelation {
  id: string;
  name: string;
}

interface WarehouseLocationSummaryRelation {
  id: string;
  locationCode: string;
}

interface InventoryLotSummaryRelation {
  id: string;
  lotNumber: string;
}

type InventoryWithRelations = Inventory & {
  product?: ProductSummaryRelation | null;
  warehouse?: WarehouseSummaryRelation | null;
  warehouseLocation?: WarehouseLocationSummaryRelation | null;
  inventoryLot?: InventoryLotSummaryRelation | null;
};

export interface InventorySummary {
  id: string;
  warehouseId: string;
  warehouse: WarehouseSummaryRelation | null;
  warehouseLocationId: string;
  warehouseLocation: WarehouseLocationSummaryRelation | null;
  productId: string;
  product: ProductSummaryRelation | null;
  inventoryLotId: string;
  inventoryLot: InventoryLotSummaryRelation | null;
  quantity: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export function toInventory(
  inventory: InventoryWithRelations,
): InventorySummary {
  return {
    id: inventory.id,
    warehouseId: inventory.warehouseId,
    warehouse: inventory.warehouse ?? null,
    warehouseLocationId: inventory.warehouseLocationId,
    warehouseLocation: inventory.warehouseLocation ?? null,
    productId: inventory.productId,
    product: inventory.product ?? null,
    inventoryLotId: inventory.inventoryLotId,
    inventoryLot: inventory.inventoryLot ?? null,
    quantity: inventory.quantity.toString(),
    status: inventory.status,
    createdAt: inventory.createdAt.toISOString(),
    updatedAt: inventory.updatedAt.toISOString(),
  };
}
