import type { InventoryMovementModel as InventoryMovement } from '../../../generated/prisma/models';

interface ProductSummaryRelation {
  id: string;
  name: string;
}

interface WarehouseSummaryRelation {
  id: string;
  name: string;
}

type InventoryMovementWithRelations = InventoryMovement & {
  product?: ProductSummaryRelation | null;
  warehouse?: WarehouseSummaryRelation | null;
};

// Read-only — append-only ledger, no create/update/delete exposed through this module (locked
// decision 30/34). Explicit allow-list, same discipline as every other mapper.
export interface InventoryMovementSummary {
  id: string;
  movementNumber: string;
  inventoryId: string | null;
  inventoryLotId: string | null;
  warehouseId: string;
  warehouse: WarehouseSummaryRelation | null;
  warehouseLocationId: string | null;
  productId: string;
  product: ProductSummaryRelation | null;
  movementType: string;
  quantity: string;
  unit: string;
  referenceType: string | null;
  referenceId: string | null;
  notes: string | null;
  createdAt: string;
}

export function toInventoryMovement(
  movement: InventoryMovementWithRelations,
): InventoryMovementSummary {
  return {
    id: movement.id,
    movementNumber: movement.movementNumber,
    inventoryId: movement.inventoryId,
    inventoryLotId: movement.inventoryLotId,
    warehouseId: movement.warehouseId,
    warehouse: movement.warehouse ?? null,
    warehouseLocationId: movement.warehouseLocationId,
    productId: movement.productId,
    product: movement.product ?? null,
    movementType: movement.movementType,
    quantity: movement.quantity.toString(),
    unit: movement.unit,
    referenceType: movement.referenceType,
    referenceId: movement.referenceId,
    notes: movement.notes,
    createdAt: movement.createdAt.toISOString(),
  };
}
