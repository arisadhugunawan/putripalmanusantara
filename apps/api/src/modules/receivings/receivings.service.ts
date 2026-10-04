import { Injectable } from '@nestjs/common';
import {
  buildPaginationMeta,
  parseSort,
} from '../../common/dto/pagination-query.dto';
import { ApiException } from '../../common/exceptions/api.exception';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateReceivingDto } from './dto/create-receiving.dto';
import type { CreateWeighbridgeTransactionDto } from './dto/create-weighbridge-transaction.dto';
import type { ReceivingQueryDto } from './dto/receiving-query.dto';
import type { UpdateReceivingDto } from './dto/update-receiving.dto';
import {
  toReceiving,
  toWeighbridgeTransaction,
  type ReceivingSummary,
  type WeighbridgeTransactionSummary,
} from './receivings.mapper';

const SORT_FIELD_MAP: Record<string, string> = {
  created_at: 'createdAt',
  receiving_number: 'receivingNumber',
  status: 'status',
  received_at: 'receivedAt',
};

const WAREHOUSE_SELECT = { id: true, name: true } as const;
const PRODUCT_SELECT = { id: true, name: true } as const;
const PURCHASE_ORDER_SELECT = { id: true, purchaseOrderNumber: true } as const;
const DETAIL_INCLUDE = {
  warehouse: { select: WAREHOUSE_SELECT },
  purchaseOrder: { select: PURCHASE_ORDER_SELECT },
  items: { include: { product: { select: PRODUCT_SELECT } } },
  weighbridgeTransactions: true,
} as const;

// Only `confirmed`/`partially_received` Purchase Orders may receive a Receiving (locked
// decision 1). Phase 23 does NOT flip `PurchaseOrder.status` itself — see the service's own
// `createFromPurchaseOrder` doc comment for why `partially_received` is listed here as
// eligible even though nothing in this codebase yet sets it.
const ELIGIBLE_PURCHASE_ORDER_STATUSES = [
  'confirmed',
  'partially_received',
] as const;

// Receiving statuses whose `quantityReceived` counts against a PurchaseOrderItem's capacity.
// A `draft` receiving is not yet a physical receipt, and a `cancelled` one never will be, so
// neither consumes capacity. The capacity is therefore re-checked at the `draft -> received`
// transition (see `update()`), the moment a draft actually starts counting.
const CAPACITY_EXCLUDED_RECEIVING_STATUSES = ['draft', 'cancelled'] as const;

const MAX_NUMBER_RETRY_ATTEMPTS = 3;

type ReceivingUniqueViolationTarget = 'receiving_number' | 'ambiguous' | null;
type WeighbridgeUniqueViolationTarget =
  'transaction_number' | 'ambiguous' | null;

@Injectable()
export class ReceivingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ReceivingQueryDto): Promise<{
    items: ReceivingSummary[];
    meta: ReturnType<typeof buildPaginationMeta>;
  }> {
    const { field, direction } = parseSort(query.sort);
    const orderField = SORT_FIELD_MAP[field] ?? 'createdAt';
    const q = query.q?.trim();

    const where = {
      ...(query.status !== undefined && { status: query.status }),
      ...(query.purchaseOrderId !== undefined && {
        purchaseOrderId: query.purchaseOrderId,
      }),
      ...(query.warehouseId !== undefined && {
        warehouseId: query.warehouseId,
      }),
      ...(q && {
        receivingNumber: { contains: q, mode: 'insensitive' as const },
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.receiving.findMany({
        where,
        include: {
          warehouse: { select: WAREHOUSE_SELECT },
          _count: { select: { items: true } },
        },
        orderBy: { [orderField]: direction },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.receiving.count({ where }),
    ]);

    return {
      items: items.map(toReceiving),
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  async findOne(id: string): Promise<ReceivingSummary> {
    return toReceiving(await this.getOrThrow(id));
  }

  /** Atomic PurchaseOrder→Receiving creation (locked decisions 1-10, 25-26). One Prisma
   * interactive transaction:
   * - Read the PurchaseOrder, validate eligibility (`confirmed`/`partially_received`). Phase
   *   23 never flips `PurchaseOrder.status` itself — that would be the "Procurement redesign"
   *   locked decision 23 explicitly excludes; `partially_received` is listed as eligible for
   *   future-readiness once a later phase adds that transition, not because this phase can
   *   reach it.
   * - Validate the Warehouse exists and is `active`.
   * - Reject a request that references the same `purchaseOrderItemId` more than once within
   *   this one Receiving document (locked decision 10) — the same item id across *different*
   *   Receiving documents remains fully allowed.
   * - Lock every referenced `PurchaseOrderItem` row, in a fixed sorted-by-id order, via a real
   *   Postgres `FOR UPDATE` — the same mechanism the Phase 22 targeted fix used for
   *   SupplierQuotation selection, needed here because two concurrent Receivings against the
   *   same PO item would otherwise both pass a plain capacity check before either committed.
   *   Sorted order prevents a lock-ordering deadlock between two Receivings that reference
   *   overlapping PO items.
   * - Validate each referenced item actually belongs to this PurchaseOrder, compute
   *   `remaining = PurchaseOrderItem.quantity − Σ already-received` (only Receivings that are
   *   not `draft`/`cancelled` count — a draft is not yet a physical receipt and a cancelled
   *   one never will be), and reject with a clean 409 if the requested `quantityReceived`
   *   would exceed it (locked decision 2) — over-receiving is disallowed,
   *   `remainingToReceive` is never cached. Because drafts do not consume capacity, the same
   *   check is repeated when a draft becomes `received` (see `update()`).
   * - `productId`/`productNameSnapshot`/`unit`/`quantityExpected` are always derived from the
   *   resolved PurchaseOrderItem/live Product — the client never supplies them, which makes
   *   the "product must match the PO item" invariant (locked decision 4) true by construction
   *   rather than something that needs its own runtime check. */
  async createFromPurchaseOrder(
    purchaseOrderId: string,
    dto: CreateReceivingDto,
  ): Promise<ReceivingSummary> {
    for (let attempt = 1; ; attempt++) {
      const receivingNumber = await this.generateReceivingNumber();
      try {
        const receiving = await this.prisma.$transaction(async (tx) => {
          const purchaseOrder = await tx.purchaseOrder.findUnique({
            where: { id: purchaseOrderId },
          });
          if (!purchaseOrder) {
            throw new ApiException(
              'NOT_FOUND',
              'Purchase order not found.',
              404,
            );
          }
          if (
            !ELIGIBLE_PURCHASE_ORDER_STATUSES.includes(
              purchaseOrder.status as 'confirmed' | 'partially_received',
            )
          ) {
            throw new ApiException(
              'INVALID_STATE_TRANSITION',
              `Cannot create a receiving from a purchase order with status "${purchaseOrder.status}".`,
              409,
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

          const seenPurchaseOrderItemIds = new Set<string>();
          for (const item of dto.items) {
            if (seenPurchaseOrderItemIds.has(item.purchaseOrderItemId)) {
              throw new ApiException(
                'VALIDATION_ERROR',
                `Purchase order item "${item.purchaseOrderItemId}" appears more than once in this receiving.`,
                400,
                { fields: ['items'] },
              );
            }
            seenPurchaseOrderItemIds.add(item.purchaseOrderItemId);
          }

          const sortedPoItemIds = [...seenPurchaseOrderItemIds].sort();
          for (const poItemId of sortedPoItemIds) {
            await tx.$queryRaw`SELECT id FROM purchase_order_items WHERE id = ${poItemId} FOR UPDATE`;
          }

          const purchaseOrderItems = await tx.purchaseOrderItem.findMany({
            where: { id: { in: sortedPoItemIds }, purchaseOrderId },
          });
          const purchaseOrderItemById = new Map(
            purchaseOrderItems.map((item) => [item.id, item]),
          );

          for (const item of dto.items) {
            if (!purchaseOrderItemById.has(item.purchaseOrderItemId)) {
              throw new ApiException(
                'VALIDATION_ERROR',
                `Purchase order item "${item.purchaseOrderItemId}" is not part of this purchase order.`,
                400,
                { fields: ['items'] },
              );
            }
          }

          const existingSums = await tx.receivingItem.groupBy({
            by: ['purchaseOrderItemId'],
            where: {
              purchaseOrderItemId: { in: sortedPoItemIds },
              receiving: {
                status: { notIn: [...CAPACITY_EXCLUDED_RECEIVING_STATUSES] },
              },
            },
            _sum: { quantityReceived: true },
          });
          const alreadyReceivedByPoItemId = new Map(
            existingSums
              .filter((sum) => sum.purchaseOrderItemId !== null)
              .map((sum) => [
                sum.purchaseOrderItemId as string,
                sum._sum.quantityReceived ?? new Prisma.Decimal(0),
              ]),
          );

          const products = await tx.product.findMany({
            where: {
              id: { in: purchaseOrderItems.map((item) => item.productId) },
            },
            select: { id: true, name: true },
          });
          const productById = new Map(
            products.map((product) => [product.id, product]),
          );

          const itemsData = dto.items.map((item) => {
            const poItem = purchaseOrderItemById.get(item.purchaseOrderItemId)!;
            const product = productById.get(poItem.productId);
            if (!product) {
              throw new ApiException(
                'VALIDATION_ERROR',
                `Product "${poItem.productId}" does not exist.`,
                400,
              );
            }

            const alreadyReceived =
              alreadyReceivedByPoItemId.get(item.purchaseOrderItemId) ??
              new Prisma.Decimal(0);
            const remaining = poItem.quantity.sub(alreadyReceived);
            const requested = new Prisma.Decimal(item.quantityReceived);
            if (requested.gt(remaining)) {
              throw new ApiException(
                'CONFLICT',
                `Receiving quantity for product "${poItem.productId}" (${requested.toString()}) exceeds the remaining quantity on the purchase order (${remaining.toString()} remaining).`,
                409,
              );
            }

            return {
              purchaseOrderItemId: poItem.id,
              productId: poItem.productId,
              // Always the live Product master — never trusted from the client (locked
              // decision 4/9).
              productNameSnapshot: product.name,
              quantityExpected: poItem.quantity,
              quantityReceived: requested,
              unit: poItem.unit,
              notes: item.notes ?? null,
            };
          });

          return tx.receiving.create({
            data: {
              receivingNumber,
              purchaseOrderId: purchaseOrder.id,
              warehouseId: dto.warehouseId,
              // Always derived from the PurchaseOrder server-side — never accepted from the
              // client (locked decision 8).
              supplierCompanyId: purchaseOrder.supplierCompanyId,
              status: 'draft',
              notes: dto.notes ?? null,
              items: { create: itemsData },
            },
            include: DETAIL_INCLUDE,
          });
        });

        return toReceiving(receiving);
      } catch (error) {
        if (error instanceof ApiException) {
          throw error;
        }

        const target = this.classifyReceivingUniqueViolation(error);
        if (
          (target === 'receiving_number' || target === 'ambiguous') &&
          attempt < MAX_NUMBER_RETRY_ATTEMPTS
        ) {
          continue;
        }
        if (target !== null) {
          throw new ApiException(
            'CONFLICT',
            'Could not generate a unique receiving number. Please try again.',
            409,
          );
        }

        throw error;
      }
    }
  }

  /** `receivedAt` is set server-side, automatically, the moment `status` becomes `received` —
   * never client-supplied (locked decision 6). `completed`/`cancelled` are terminal; no
   * reopening through this route.
   *
   * Every update — whatever it changes — runs in one transaction that serializes on the
   * Receiving row and decides everything from state read AFTER that lock, never from the
   * pre-transaction read (which is used only for the 404 and for the immutable item list):
   * - Lock order is always PurchaseOrderItems (sorted id, only for `draft -> received`) ->
   *   the Receiving row. `ReceivingsService.createFromPurchaseOrder` and
   *   `InventoryLotsService.createFromReceivingItem` follow compatible orders.
   * - The lifecycle transition is validated against the locked, fresh status.
   * - The write is a conditional `updateMany({ id, status: <the status just validated> })`; a
   *   `count` of 0 is a clean 409, never a silent overwrite of a concurrent decision.
   *
   * `draft -> received` is the moment a Receiving starts consuming PurchaseOrderItem capacity
   * (drafts and cancelled receivings do not), so that transition re-checks it under the
   * PurchaseOrderItem locks: sum every other non-`draft`/non-`cancelled` Receiving and reject
   * with a 409 if this Receiving's own quantity would push the total past the
   * PurchaseOrderItem quantity. That is what stops two draft Receivings from each claiming the
   * full remaining capacity and then both becoming `received`.
   *
   * `-> cancelled` is rejected with a 409 when the Receiving already has one or more
   * InventoryLots (their physical goods exist); no lot is ever changed automatically. Lot
   * creation share-locks the same Receiving row, so a lot cannot appear between this check and
   * the write. */
  async update(id: string, dto: UpdateReceivingDto): Promise<ReceivingSummary> {
    const initial = await this.getOrThrow(id);

    // Receiving items are fixed after creation (no item route exists), so the PO item ids to
    // lock can be taken from this pre-transaction read.
    const poItemIds =
      dto.status === 'received'
        ? [
            ...new Set(
              initial.items
                .map((item) => item.purchaseOrderItemId)
                .filter((itemId): itemId is string => itemId !== null),
            ),
          ].sort()
        : [];

    const updated = await this.prisma.$transaction(async (tx) => {
      for (const poItemId of poItemIds) {
        await tx.$queryRaw`SELECT id FROM purchase_order_items WHERE id = ${poItemId} FOR UPDATE`;
      }
      await tx.$queryRaw`SELECT id FROM receivings WHERE id = ${id} FOR UPDATE`;

      const current = await tx.receiving.findUnique({
        where: { id },
        select: { status: true },
      });
      if (!current) {
        throw new ApiException('NOT_FOUND', 'Receiving not found.', 404);
      }

      if (dto.status !== undefined) {
        this.assertValidStatusTransition(current.status, dto.status);
      }

      if (dto.status === 'received') {
        const purchaseOrderItems = await tx.purchaseOrderItem.findMany({
          where: { id: { in: poItemIds } },
        });
        const purchaseOrderItemById = new Map(
          purchaseOrderItems.map((item) => [item.id, item]),
        );
        const existingSums = await tx.receivingItem.groupBy({
          by: ['purchaseOrderItemId'],
          where: {
            purchaseOrderItemId: { in: poItemIds },
            receiving: {
              status: { notIn: [...CAPACITY_EXCLUDED_RECEIVING_STATUSES] },
            },
          },
          _sum: { quantityReceived: true },
        });
        const alreadyReceivedByPoItemId = new Map(
          existingSums
            .filter((sum) => sum.purchaseOrderItemId !== null)
            .map((sum) => [
              sum.purchaseOrderItemId as string,
              sum._sum.quantityReceived ?? new Prisma.Decimal(0),
            ]),
        );

        for (const item of initial.items) {
          if (!item.purchaseOrderItemId) {
            continue;
          }
          const poItem = purchaseOrderItemById.get(item.purchaseOrderItemId);
          if (!poItem) {
            continue;
          }
          const alreadyReceived =
            alreadyReceivedByPoItemId.get(item.purchaseOrderItemId) ??
            new Prisma.Decimal(0);
          const remaining = poItem.quantity.sub(alreadyReceived);
          if (item.quantityReceived.gt(remaining)) {
            throw new ApiException(
              'CONFLICT',
              `Receiving quantity for product "${poItem.productId}" (${item.quantityReceived.toString()}) exceeds the remaining quantity on the purchase order (${remaining.toString()} remaining).`,
              409,
            );
          }
        }
      }

      if (dto.status === 'cancelled') {
        const lotCount = await tx.inventoryLot.count({
          where: { receivingId: id },
        });
        if (lotCount > 0) {
          throw new ApiException(
            'CONFLICT',
            'Cannot cancel a receiving that already has inventory lots.',
            409,
          );
        }
      }

      const { count } = await tx.receiving.updateMany({
        where: { id, status: current.status },
        data: {
          ...(dto.notes !== undefined && { notes: dto.notes }),
          ...(dto.status !== undefined && { status: dto.status }),
          ...(dto.status === 'received' && { receivedAt: new Date() }),
        },
      });
      if (count === 0) {
        throw new ApiException(
          'CONFLICT',
          'This receiving was changed by another request. Please reload and try again.',
          409,
        );
      }

      return tx.receiving.findUniqueOrThrow({
        where: { id },
        include: DETAIL_INCLUDE,
      });
    });

    return toReceiving(updated);
  }

  /** Weighbridge is entirely optional (locked decision 11) — this is a standalone creation
   * call, not part of the Receiving creation transaction, and nothing about Receiving
   * creation/completion depends on it existing. `vehicleId`, if supplied, is validated against
   * the existing `Vehicle` model — no new model, no new FK (locked decision 11). `netWeight`
   * is always server-calculated when both `grossWeight`/`tareWeight` are present, Decimal-
   * safe, never trusted from the client (locked decision 12). */
  async createWeighbridgeTransaction(
    receivingId: string,
    dto: CreateWeighbridgeTransactionDto,
  ): Promise<WeighbridgeTransactionSummary> {
    const receiving = await this.prisma.receiving.findUnique({
      where: { id: receivingId },
      select: { id: true },
    });
    if (!receiving) {
      throw new ApiException('NOT_FOUND', 'Receiving not found.', 404);
    }

    if (dto.vehicleId !== undefined) {
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: dto.vehicleId },
        select: { id: true },
      });
      if (!vehicle) {
        throw new ApiException(
          'VALIDATION_ERROR',
          'The selected vehicle does not exist.',
          400,
          { fields: ['vehicleId'] },
        );
      }
    }

    let netWeight: Prisma.Decimal | null = null;
    if (dto.grossWeight !== undefined && dto.tareWeight !== undefined) {
      const gross = new Prisma.Decimal(dto.grossWeight);
      const tare = new Prisma.Decimal(dto.tareWeight);
      if (gross.lt(tare)) {
        throw new ApiException(
          'VALIDATION_ERROR',
          'Gross weight cannot be less than tare weight.',
          400,
          { fields: ['grossWeight', 'tareWeight'] },
        );
      }
      netWeight = gross.sub(tare);
    }

    for (let attempt = 1; ; attempt++) {
      const transactionNumber = await this.generateTransactionNumber();
      try {
        const created = await this.prisma.weighbridgeTransaction.create({
          data: {
            transactionNumber,
            receivingId,
            vehicleId: dto.vehicleId ?? null,
            weighInAt: dto.weighInAt ? new Date(dto.weighInAt) : null,
            weighOutAt: dto.weighOutAt ? new Date(dto.weighOutAt) : null,
            grossWeight: dto.grossWeight ?? null,
            tareWeight: dto.tareWeight ?? null,
            netWeight,
            unit: dto.unit,
            notes: dto.notes ?? null,
          },
        });

        return toWeighbridgeTransaction(created);
      } catch (error) {
        const target = this.classifyWeighbridgeUniqueViolation(error);
        if (
          (target === 'transaction_number' || target === 'ambiguous') &&
          attempt < MAX_NUMBER_RETRY_ATTEMPTS
        ) {
          continue;
        }
        if (target !== null) {
          throw new ApiException(
            'CONFLICT',
            'Could not generate a unique weighbridge transaction number. Please try again.',
            409,
          );
        }

        throw error;
      }
    }
  }

  private async getOrThrow(id: string) {
    const receiving = await this.prisma.receiving.findUnique({
      where: { id },
      include: DETAIL_INCLUDE,
    });
    if (!receiving) {
      throw new ApiException('NOT_FOUND', 'Receiving not found.', 404);
    }
    return receiving;
  }

  /** `draft` is absent from every target list — creation always starts there and nothing
   * transitions back into it. `completed`/`cancelled` are both terminal (locked decision 6 —
   * "Completed tidak dapat dibatalkan melalui normal lifecycle API v1"). */
  private assertValidStatusTransition(
    currentStatus: string,
    nextStatus: string,
  ): void {
    const allowed: Record<string, string[]> = {
      draft: ['received', 'cancelled'],
      received: ['inspecting', 'cancelled'],
      inspecting: ['completed', 'cancelled'],
      completed: [],
      cancelled: [],
    };
    if (!allowed[currentStatus]?.includes(nextStatus)) {
      throw new ApiException(
        'INVALID_STATE_TRANSITION',
        `Cannot change receiving status from "${currentStatus}" to "${nextStatus}".`,
        409,
      );
    }
  }

  /** `GRN-YYYY-NNNNNN` (locked decision 7), year-scoped sequence — same shape as every prior
   * phase's own generator. */
  private async generateReceivingNumber(): Promise<string> {
    const year = new Date().getUTCFullYear();
    const startOfYear = new Date(Date.UTC(year, 0, 1));
    const count = await this.prisma.receiving.count({
      where: { createdAt: { gte: startOfYear } },
    });
    const sequence = (count + 1).toString().padStart(6, '0');
    return `GRN-${year}-${sequence}`;
  }

  /** `WB-YYYY-NNNNNN` — no number format was locked for WeighbridgeTransaction specifically;
   * this follows the same established `PREFIX-YYYY-NNNNNN` shape every other number in this
   * codebase uses, flagged in the final report as a reasonable, reversible implementation
   * detail rather than a business-rule invention. */
  private async generateTransactionNumber(): Promise<string> {
    const year = new Date().getUTCFullYear();
    const startOfYear = new Date(Date.UTC(year, 0, 1));
    const count = await this.prisma.weighbridgeTransaction.count({
      where: { createdAt: { gte: startOfYear } },
    });
    const sequence = (count + 1).toString().padStart(6, '0');
    return `WB-${year}-${sequence}`;
  }

  private classifyReceivingUniqueViolation(
    error: unknown,
  ): ReceivingUniqueViolationTarget {
    const err = error as {
      code?: string;
      meta?: {
        target?: string[];
        driverAdapterError?: { cause?: { originalCode?: string } };
      };
    };

    if (err.code === 'P2002') {
      return err.meta?.target?.includes('receiving_number') || !err.meta?.target
        ? 'receiving_number'
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

  private classifyWeighbridgeUniqueViolation(
    error: unknown,
  ): WeighbridgeUniqueViolationTarget {
    const err = error as {
      code?: string;
      meta?: {
        target?: string[];
        driverAdapterError?: { cause?: { originalCode?: string } };
      };
    };

    if (err.code === 'P2002') {
      return err.meta?.target?.includes('transaction_number') ||
        !err.meta?.target
        ? 'transaction_number'
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
