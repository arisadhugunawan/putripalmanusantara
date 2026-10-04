import { Injectable } from '@nestjs/common';
import {
  buildPaginationMeta,
  parseSort,
} from '../../common/dto/pagination-query.dto';
import { ApiException } from '../../common/exceptions/api.exception';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateInventoryLotDto } from './dto/create-inventory-lot.dto';
import type { InventoryLotQueryDto } from './dto/inventory-lot-query.dto';
import {
  toInventoryLot,
  type InventoryLotSummary,
} from './inventory-lots.mapper';

const SORT_FIELD_MAP: Record<string, string> = {
  created_at: 'createdAt',
  lot_number: 'lotNumber',
  status: 'status',
};

const PRODUCT_SELECT = { id: true, name: true } as const;
const RECEIVING_SELECT = { id: true, receivingNumber: true } as const;
const WAREHOUSE_SELECT = { id: true, name: true } as const;
const DETAIL_INCLUDE = {
  product: { select: PRODUCT_SELECT },
  receiving: { select: RECEIVING_SELECT },
  warehouse: { select: WAREHOUSE_SELECT },
} as const;

// A lot may only be created from a Receiving whose goods have physically arrived: `received`
// (goods at the dock), `inspecting`, or `completed`. A `draft` Receiving is only a plan and a
// `cancelled` one never happened.
const LOT_ELIGIBLE_RECEIVING_STATUSES = [
  'received',
  'inspecting',
  'completed',
] as const;

const MAX_LOT_NUMBER_RETRY_ATTEMPTS = 3;

type UniqueViolationTarget = 'lot_number' | 'ambiguous' | null;

@Injectable()
export class InventoryLotsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: InventoryLotQueryDto): Promise<{
    items: InventoryLotSummary[];
    meta: ReturnType<typeof buildPaginationMeta>;
  }> {
    const { field, direction } = parseSort(query.sort);
    const orderField = SORT_FIELD_MAP[field] ?? 'createdAt';
    const q = query.q?.trim();

    const where = {
      ...(query.status !== undefined && { status: query.status }),
      ...(query.productId !== undefined && { productId: query.productId }),
      ...(query.receivingId !== undefined && {
        receivingId: query.receivingId,
      }),
      ...(query.receivingItemId !== undefined && {
        receivingItemId: query.receivingItemId,
      }),
      ...(query.warehouseId !== undefined && {
        warehouseId: query.warehouseId,
      }),
      ...(q && { lotNumber: { contains: q, mode: 'insensitive' as const } }),
    };

    const [items, total] = await Promise.all([
      this.prisma.inventoryLot.findMany({
        where,
        include: DETAIL_INCLUDE,
        orderBy: { [orderField]: direction },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.inventoryLot.count({ where }),
    ]);

    return {
      items: items.map(toInventoryLot),
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  async findOne(id: string): Promise<InventoryLotSummary> {
    return toInventoryLot(await this.getOrThrow(id));
  }

  /** Atomic ReceivingItem→InventoryLot creation (locked decisions 1-8). One Prisma
   * interactive transaction:
   * - Read the ReceivingItem with its Receiving/PurchaseOrderItem context, validate it exists
   *   and genuinely belongs to a Receiving with a `purchaseOrderItemId` (no orphan lots — the
   *   schema makes `purchaseOrderItemId` nullable, but Phase 23 already requires it be set at
   *   Receiving-item creation time, so this check is a defensive re-confirmation, not a new
   *   rule).
   * - Reject unless the parent Receiving is `received`/`inspecting`/`completed` — a `draft`
   *   or `cancelled` Receiving never represents goods that physically arrived.
   * - Lock the ReceivingItem row (`FOR UPDATE`) before computing the already-allocated lot
   *   quantity — the same mechanism Phase 23 proved for over-receiving prevention, needed here
   *   because two concurrent lot-creation requests against the same ReceivingItem would
   *   otherwise both pass a plain capacity check before either committed.
   * - Reject if `requested > remaining` (locked decision 3/4) — `Σ InventoryLot.quantity` for
   *   this ReceivingItem must never exceed `ReceivingItem.quantityReceived`.
   * - The new lot always starts `quarantine` (locked decision 8) — the client cannot choose
   *   any other initial status; `productId`/`unit`/`receivingId`/`warehouseId`/
   *   `supplierCompanyId` are all derived server-side, never accepted from the client (locked
   *   decision 1/5). */
  async createFromReceivingItem(
    receivingItemId: string,
    dto: CreateInventoryLotDto,
  ): Promise<InventoryLotSummary> {
    for (let attempt = 1; ; attempt++) {
      const lotNumber = await this.generateLotNumber();
      try {
        const lot = await this.prisma.$transaction(async (tx) => {
          await tx.$queryRaw`SELECT id FROM receiving_items WHERE id = ${receivingItemId} FOR UPDATE`;

          const receivingItem = await tx.receivingItem.findUnique({
            where: { id: receivingItemId },
            include: { receiving: true },
          });
          if (!receivingItem) {
            throw new ApiException(
              'NOT_FOUND',
              'Receiving item not found.',
              404,
            );
          }
          // Share-lock the parent Receiving and read its status only AFTER the lock, so a
          // concurrent `ReceivingsService.update` (which takes `FOR UPDATE` on the same row
          // before cancelling) can never cancel the Receiving between this eligibility check
          // and the lot insert: whichever transaction gets the row first decides, and the other
          // sees the committed result. Lock order here is receiving item -> receiving; the
          // Receiving lifecycle path never locks receiving items, so the two cannot deadlock.
          await tx.$queryRaw`SELECT id FROM receivings WHERE id = ${receivingItem.receivingId} FOR SHARE`;
          const receiving = await tx.receiving.findUnique({
            where: { id: receivingItem.receivingId },
            select: { status: true },
          });
          if (
            !receiving ||
            !LOT_ELIGIBLE_RECEIVING_STATUSES.includes(
              receiving.status as 'received' | 'inspecting' | 'completed',
            )
          ) {
            throw new ApiException(
              'INVALID_STATE_TRANSITION',
              `Cannot create an inventory lot from a receiving with status "${receiving?.status ?? 'unknown'}".`,
              409,
            );
          }
          if (!receivingItem.purchaseOrderItemId) {
            throw new ApiException(
              'VALIDATION_ERROR',
              'This receiving item has no purchase order item and cannot create an inventory lot.',
              400,
            );
          }
          if (receivingItem.quantityReceived.lte(0)) {
            throw new ApiException(
              'VALIDATION_ERROR',
              'This receiving item has no received quantity and cannot create an inventory lot.',
              400,
            );
          }

          const existingLots = await tx.inventoryLot.aggregate({
            where: { receivingItemId },
            _sum: { quantity: true },
          });
          const alreadyAllocated =
            existingLots._sum.quantity ?? new Prisma.Decimal(0);
          const remaining =
            receivingItem.quantityReceived.sub(alreadyAllocated);
          const requested = new Prisma.Decimal(dto.quantity);
          if (requested.gt(remaining)) {
            throw new ApiException(
              'CONFLICT',
              `Requested lot quantity (${requested.toString()}) exceeds the remaining unallocated quantity on this receiving item (${remaining.toString()} remaining).`,
              409,
            );
          }

          return tx.inventoryLot.create({
            data: {
              lotNumber,
              productId: receivingItem.productId,
              receivingId: receivingItem.receivingId,
              receivingItemId: receivingItem.id,
              supplierCompanyId: receivingItem.receiving.supplierCompanyId,
              warehouseId: receivingItem.receiving.warehouseId,
              quantity: requested,
              unit: receivingItem.unit,
              status: 'quarantine',
              origin: dto.origin ?? null,
            },
            include: DETAIL_INCLUDE,
          });
        });

        return toInventoryLot(lot);
      } catch (error) {
        if (error instanceof ApiException) {
          throw error;
        }

        const target = this.classifyUniqueViolation(error);
        if (
          (target === 'lot_number' || target === 'ambiguous') &&
          attempt < MAX_LOT_NUMBER_RETRY_ATTEMPTS
        ) {
          continue;
        }
        if (target !== null) {
          throw new ApiException(
            'CONFLICT',
            'Could not generate a unique lot number. Please try again.',
            409,
          );
        }

        throw error;
      }
    }
  }

  /** Explicit release action (locked decision 8/21/22). Transactional, with a real row lock on
   * the InventoryLot plus a conditional update as a second layer of protection — so only one
   * of several concurrent release attempts against the same lot can ever succeed; the rest
   * observe the already-committed result and fail cleanly. Requires an existing `passed`
   * QCInspection for this lot (any inspection type — see the Known Limitations note in the
   * final report for why this reading doesn't require specifically a `release`-typed
   * inspection). On success, the matched inspection's own status becomes `released` and every
   * `quarantine` Inventory placement of this lot becomes `available`, all in the same
   * transaction. `reject()` deliberately leaves a lot's placements untouched (they stay
   * `quarantine`, i.e. never available) — how a rejected lot should map onto `InventoryStatus`
   * is a separate, unresolved business rule. */
  async release(id: string): Promise<InventoryLotSummary> {
    const lot = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM inventory_lots WHERE id = ${id} FOR UPDATE`;

      const existing = await tx.inventoryLot.findUnique({ where: { id } });
      if (!existing) {
        throw new ApiException('NOT_FOUND', 'Inventory lot not found.', 404);
      }
      if (existing.status !== 'quarantine') {
        throw new ApiException(
          'INVALID_STATE_TRANSITION',
          `Cannot release an inventory lot with status "${existing.status}".`,
          409,
        );
      }

      const passedInspection = await tx.qCInspection.findFirst({
        where: { inventoryLotId: id, status: 'passed' },
      });
      if (!passedInspection) {
        throw new ApiException(
          'VALIDATION_ERROR',
          'This inventory lot has no passed QC inspection and cannot be released.',
          400,
        );
      }

      const { count } = await tx.inventoryLot.updateMany({
        where: { id, status: 'quarantine' },
        data: { status: 'available' },
      });
      if (count === 0) {
        throw new ApiException(
          'CONFLICT',
          'This inventory lot is no longer eligible for release.',
          409,
        );
      }

      await tx.qCInspection.update({
        where: { id: passedInspection.id },
        data: { status: 'released' },
      });

      // The lot's own placements follow the lot: every Inventory row of this lot still
      // `quarantine` becomes `available`. Lock order is lot (held above) -> its Inventory rows,
      // the same order `InventoryService.createFromLot` uses, so the two cannot deadlock.
      await tx.inventory.updateMany({
        where: { inventoryLotId: id, status: 'quarantine' },
        data: { status: 'available' },
      });

      return tx.inventoryLot.findUniqueOrThrow({
        where: { id },
        include: DETAIL_INCLUDE,
      });
    });

    return toInventoryLot(lot);
  }

  /** Explicit administrative rejection (locked decision lifecycle — `quarantine`/`hold` →
   * `rejected`). Not automatic on QC failure (that goes to `hold` — see QcService); this is a
   * separate, deliberate action for permanent rejection. */
  async reject(id: string): Promise<InventoryLotSummary> {
    const existing = await this.getOrThrow(id);
    if (!['quarantine', 'hold'].includes(existing.status)) {
      throw new ApiException(
        'INVALID_STATE_TRANSITION',
        `Cannot reject an inventory lot with status "${existing.status}".`,
        409,
      );
    }

    const updated = await this.prisma.inventoryLot.update({
      where: { id },
      include: DETAIL_INCLUDE,
      data: { status: 'rejected' },
    });

    return toInventoryLot(updated);
  }

  private async getOrThrow(id: string) {
    const lot = await this.prisma.inventoryLot.findUnique({
      where: { id },
      include: DETAIL_INCLUDE,
    });
    if (!lot) {
      throw new ApiException('NOT_FOUND', 'Inventory lot not found.', 404);
    }
    return lot;
  }

  /** `LOT-YYYY-NNNNNN` (locked decision 6), year-scoped sequence — same shape as every prior
   * phase's own generator. */
  private async generateLotNumber(): Promise<string> {
    const year = new Date().getUTCFullYear();
    const startOfYear = new Date(Date.UTC(year, 0, 1));
    const count = await this.prisma.inventoryLot.count({
      where: { createdAt: { gte: startOfYear } },
    });
    const sequence = (count + 1).toString().padStart(6, '0');
    return `LOT-${year}-${sequence}`;
  }

  private classifyUniqueViolation(error: unknown): UniqueViolationTarget {
    const err = error as {
      code?: string;
      meta?: {
        target?: string[];
        driverAdapterError?: { cause?: { originalCode?: string } };
      };
    };

    if (err.code === 'P2002') {
      return err.meta?.target?.includes('lot_number') || !err.meta?.target
        ? 'lot_number'
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
