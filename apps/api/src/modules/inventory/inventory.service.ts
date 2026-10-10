import { Injectable } from '@nestjs/common';
import {
  buildPaginationMeta,
  parseSort,
} from '../../common/dto/pagination-query.dto';
import { ApiException } from '../../common/exceptions/api.exception';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateInventoryDto } from './dto/create-inventory.dto';
import type { InventoryQueryDto } from './dto/inventory-query.dto';
import { toInventory, type InventorySummary } from './inventory.mapper';

const SORT_FIELD_MAP: Record<string, string> = {
  created_at: 'createdAt',
  status: 'status',
};

const PRODUCT_SELECT = { id: true, name: true } as const;
const WAREHOUSE_SELECT = { id: true, name: true } as const;
const LOCATION_SELECT = { id: true, locationCode: true } as const;
const LOT_SELECT = { id: true, lotNumber: true } as const;
const DETAIL_INCLUDE = {
  product: { select: PRODUCT_SELECT },
  warehouse: { select: WAREHOUSE_SELECT },
  warehouseLocation: { select: LOCATION_SELECT },
  inventoryLot: { select: LOT_SELECT },
} as const;

const MAX_MOVEMENT_NUMBER_RETRY_ATTEMPTS = 3;

type UniqueViolationTarget = 'movement_number' | 'ambiguous' | null;

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: InventoryQueryDto): Promise<{
    items: InventorySummary[];
    meta: ReturnType<typeof buildPaginationMeta>;
  }> {
    const { field, direction } = parseSort(query.sort);
    const orderField = SORT_FIELD_MAP[field] ?? 'createdAt';

    const where = {
      ...(query.status !== undefined && { status: query.status }),
      ...(query.productId !== undefined && { productId: query.productId }),
      ...(query.warehouseId !== undefined && {
        warehouseId: query.warehouseId,
      }),
      ...(query.warehouseLocationId !== undefined && {
        warehouseLocationId: query.warehouseLocationId,
      }),
      ...(query.inventoryLotId !== undefined && {
        inventoryLotId: query.inventoryLotId,
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.inventory.findMany({
        where,
        include: DETAIL_INCLUDE,
        orderBy: { [orderField]: direction },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.inventory.count({ where }),
    ]);

    return {
      items: items.map(toInventory),
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  async findOne(id: string): Promise<InventorySummary> {
    return toInventory(await this.getOrThrow(id));
  }

  /** Atomic InventoryLot→Inventory placement (locked decisions 9-14, 25-29, 32). One Prisma
   * interactive transaction:
   * - Lock the InventoryLot (`FOR UPDATE`) before computing the already-placed quantity sum —
   *   the same mechanism proven for every other sum-based cap in this codebase. Validates
   *   Warehouse/WarehouseLocation exist, are `active`, and that the location genuinely belongs
   *   to the selected warehouse.
   * - Reject if `requested > remaining` (locked decision 11) — `Σ Inventory.quantity` for this
   *   lot across every location must never exceed `InventoryLot.quantity`.
   * - Initial status: `quarantine` unless the lot has *already* successfully released to
   *   `available` (locked decision 27/28) — never any other value, and never set ahead of the
   *   release gate.
   * - If an `Inventory` row already exists for the exact `(warehouse, location, product, lot)`
   *   tuple, increments its `quantity` rather than inserting a duplicate (locked decision 12);
   *   the composite unique constraint remains the final DB-level backstop, translated to a
   *   clean conflict rather than a leaked raw Prisma error if it's ever actually hit.
   * - Creates exactly one `receiving`-type `InventoryMovement` representing the physical
   *   quantity just placed (locked decision 28/32) — never for Receiving/Lot/QC
   *   creation/release, only for this actual placement event. */
  async createFromLot(
    inventoryLotId: string,
    dto: CreateInventoryDto,
  ): Promise<InventorySummary> {
    for (let attempt = 1; ; attempt++) {
      const movementNumber = await this.generateMovementNumber();
      try {
        const inventory = await this.prisma.$transaction(async (tx) => {
          await tx.$queryRaw`SELECT id FROM inventory_lots WHERE id = ${inventoryLotId} FOR UPDATE`;

          const lot = await tx.inventoryLot.findUnique({
            where: { id: inventoryLotId },
          });
          if (!lot) {
            throw new ApiException(
              'NOT_FOUND',
              'Inventory lot not found.',
              404,
            );
          }

          const warehouse = await tx.warehouse.findUnique({
            where: { id: dto.warehouseId },
          });
          if (!warehouse) {
            throw new ApiException(
              'VALIDATION_ERROR',
              'The selected warehouse does not exist.',
              400,
              { fields: ['warehouseId'] },
            );
          }
          if (warehouse.status !== 'active') {
            throw new ApiException(
              'VALIDATION_ERROR',
              'The selected warehouse is not active.',
              400,
              { fields: ['warehouseId'] },
            );
          }

          const location = await tx.warehouseLocation.findUnique({
            where: { id: dto.warehouseLocationId },
          });
          if (!location) {
            throw new ApiException(
              'VALIDATION_ERROR',
              'The selected warehouse location does not exist.',
              400,
              { fields: ['warehouseLocationId'] },
            );
          }
          if (location.status !== 'active') {
            throw new ApiException(
              'VALIDATION_ERROR',
              'The selected warehouse location is not active.',
              400,
              { fields: ['warehouseLocationId'] },
            );
          }
          if (location.warehouseId !== dto.warehouseId) {
            throw new ApiException(
              'VALIDATION_ERROR',
              'The selected warehouse location does not belong to the selected warehouse.',
              400,
              { fields: ['warehouseLocationId'] },
            );
          }

          const existingPlacements = await tx.inventory.aggregate({
            where: { inventoryLotId },
            _sum: { quantity: true },
          });
          const alreadyPlaced =
            existingPlacements._sum.quantity ?? new Prisma.Decimal(0);
          const remaining = lot.quantity.sub(alreadyPlaced);
          const requested = new Prisma.Decimal(dto.quantity);
          if (requested.gt(remaining)) {
            throw new ApiException(
              'CONFLICT',
              `Requested inventory quantity (${requested.toString()}) exceeds the remaining unplaced quantity on this lot (${remaining.toString()} remaining).`,
              409,
            );
          }

          // Never ahead of the release gate (locked decision 27/28): only a lot that has
          // already released to `available` may seed a new placement as `available`.
          const initialStatus =
            lot.status === 'available' ? 'available' : 'quarantine';

          const existingRow = await tx.inventory.findFirst({
            where: {
              warehouseId: dto.warehouseId,
              warehouseLocationId: dto.warehouseLocationId,
              productId: lot.productId,
              inventoryLotId: lot.id,
            },
          });

          const inventoryRow = existingRow
            ? await tx.inventory.update({
                where: { id: existingRow.id },
                data: { quantity: { increment: requested } },
                include: DETAIL_INCLUDE,
              })
            : await tx.inventory.create({
                data: {
                  warehouseId: dto.warehouseId,
                  warehouseLocationId: dto.warehouseLocationId,
                  productId: lot.productId,
                  inventoryLotId: lot.id,
                  quantity: requested,
                  status: initialStatus,
                },
                include: DETAIL_INCLUDE,
              });

          await tx.inventoryMovement.create({
            data: {
              movementNumber,
              inventoryId: inventoryRow.id,
              inventoryLotId: lot.id,
              warehouseId: dto.warehouseId,
              warehouseLocationId: dto.warehouseLocationId,
              productId: lot.productId,
              movementType: 'receiving',
              quantity: requested,
              unit: lot.unit,
              referenceType: 'InventoryLot',
              referenceId: lot.id,
            },
          });

          return inventoryRow;
        });

        return toInventory(inventory);
      } catch (error) {
        if (error instanceof ApiException) {
          throw error;
        }

        const target = this.classifyUniqueViolation(error);
        if (
          (target === 'movement_number' || target === 'ambiguous') &&
          attempt < MAX_MOVEMENT_NUMBER_RETRY_ATTEMPTS
        ) {
          continue;
        }
        if (target !== null) {
          throw new ApiException(
            'CONFLICT',
            'Could not generate a unique movement number, or this exact placement already exists. Please try again.',
            409,
          );
        }

        throw error;
      }
    }
  }

  private async getOrThrow(id: string) {
    const inventory = await this.prisma.inventory.findUnique({
      where: { id },
      include: DETAIL_INCLUDE,
    });
    if (!inventory) {
      throw new ApiException('NOT_FOUND', 'Inventory record not found.', 404);
    }
    return inventory;
  }

  /** `IM-YYYY-NNNNNN` (locked decision 29/33), year-scoped sequence — same shape as every
   * prior phase's own generator. */
  private async generateMovementNumber(): Promise<string> {
    const year = new Date().getUTCFullYear();
    const startOfYear = new Date(Date.UTC(year, 0, 1));
    const count = await this.prisma.inventoryMovement.count({
      where: { createdAt: { gte: startOfYear } },
    });
    const sequence = (count + 1).toString().padStart(6, '0');
    return `IM-${year}-${sequence}`;
  }

  /** Same detection shape as every prior phase's service, extended with the Inventory
   * composite unique constraint as a defensive backstop (locked decision 12/29/34) — in
   * practice unreachable given the lot-level `FOR UPDATE` lock already serializes concurrent
   * placements against the same lot, but handled gracefully rather than assumed impossible. */
  private classifyUniqueViolation(error: unknown): UniqueViolationTarget {
    const err = error as {
      code?: string;
      meta?: {
        target?: string[];
        driverAdapterError?: { cause?: { originalCode?: string } };
      };
    };

    if (err.code === 'P2002') {
      if (
        err.meta?.target?.includes(
          'inventories_warehouse_location_product_lot_key',
        )
      ) {
        return 'ambiguous';
      }
      return err.meta?.target?.includes('movement_number') || !err.meta?.target
        ? 'movement_number'
        : null;
    }

    if (
      err.code === 'P2039' &&
      err.meta?.driverAdapterError?.cause?.originalCode === '23505'
    ) {
      return 'ambiguous';
    }

    return null;
  }
}
