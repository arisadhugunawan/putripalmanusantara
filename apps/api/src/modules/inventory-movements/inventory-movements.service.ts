import { Injectable } from '@nestjs/common';
import { buildPaginationMeta } from '../../common/dto/pagination-query.dto';
import { ApiException } from '../../common/exceptions/api.exception';
import { PrismaService } from '../../prisma/prisma.service';
import type { InventoryMovementQueryDto } from './dto/inventory-movement-query.dto';
import {
  toInventoryMovement,
  type InventoryMovementSummary,
} from './inventory-movements.mapper';

const PRODUCT_SELECT = { id: true, name: true } as const;
const WAREHOUSE_SELECT = { id: true, name: true } as const;
const DETAIL_INCLUDE = {
  product: { select: PRODUCT_SELECT },
  warehouse: { select: WAREHOUSE_SELECT },
} as const;

// Read-only service — InventoryMovement is an append-only ledger (locked decision 30/34).
// Creation happens only as a side effect of `InventoryService.createFromLot`, never through a
// route this module exposes; no `create`/`update`/`delete` method exists here at all.
@Injectable()
export class InventoryMovementsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: InventoryMovementQueryDto): Promise<{
    items: InventoryMovementSummary[];
    meta: ReturnType<typeof buildPaginationMeta>;
  }> {
    const where = {
      ...(query.movementType !== undefined && {
        movementType: query.movementType,
      }),
      ...(query.inventoryId !== undefined && {
        inventoryId: query.inventoryId,
      }),
      ...(query.inventoryLotId !== undefined && {
        inventoryLotId: query.inventoryLotId,
      }),
      ...(query.warehouseId !== undefined && {
        warehouseId: query.warehouseId,
      }),
      ...(query.productId !== undefined && { productId: query.productId }),
    };

    const [items, total] = await Promise.all([
      this.prisma.inventoryMovement.findMany({
        where,
        include: DETAIL_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.inventoryMovement.count({ where }),
    ]);

    return {
      items: items.map(toInventoryMovement),
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  async findOne(id: string): Promise<InventoryMovementSummary> {
    const movement = await this.prisma.inventoryMovement.findUnique({
      where: { id },
      include: DETAIL_INCLUDE,
    });
    if (!movement) {
      throw new ApiException('NOT_FOUND', 'Inventory movement not found.', 404);
    }
    return toInventoryMovement(movement);
  }
}
