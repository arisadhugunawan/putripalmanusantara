import { Injectable } from '@nestjs/common';
import {
  buildPaginationMeta,
  parseSort,
} from '../../common/dto/pagination-query.dto';
import { ApiException } from '../../common/exceptions/api.exception';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import type { PurchaseOrderQueryDto } from './dto/purchase-order-query.dto';
import type { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import {
  toPurchaseOrder,
  type PurchaseOrderSummary,
} from './purchase-orders.mapper';

const SORT_FIELD_MAP: Record<string, string> = {
  created_at: 'createdAt',
  purchase_order_number: 'purchaseOrderNumber',
  status: 'status',
  order_date: 'orderDate',
  total: 'total',
};

const SUPPLIER_COMPANY_SELECT = { id: true, name: true } as const;
const PRODUCT_SELECT = { id: true, name: true } as const;
const SUPPLIER_QUOTATION_SELECT = {
  id: true,
  supplierQuotationNumber: true,
} as const;
const DETAIL_INCLUDE = {
  supplierCompany: { select: SUPPLIER_COMPANY_SELECT },
  supplierQuotation: { select: SUPPLIER_QUOTATION_SELECT },
  items: { include: { product: { select: PRODUCT_SELECT } } },
} as const;

const MAX_PURCHASE_ORDER_NUMBER_RETRY_ATTEMPTS = 3;

type UniqueViolationTarget =
  'purchase_order_number' | 'supplier_quotation_id' | 'ambiguous' | null;

@Injectable()
export class PurchaseOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PurchaseOrderQueryDto): Promise<{
    items: PurchaseOrderSummary[];
    meta: ReturnType<typeof buildPaginationMeta>;
  }> {
    const { field, direction } = parseSort(query.sort);
    const orderField = SORT_FIELD_MAP[field] ?? 'createdAt';
    const q = query.q?.trim();

    const where = {
      ...(query.status !== undefined && { status: query.status }),
      ...(query.supplierQuotationId !== undefined && {
        supplierQuotationId: query.supplierQuotationId,
      }),
      ...(query.supplierCompanyId !== undefined && {
        supplierCompanyId: query.supplierCompanyId,
      }),
      ...(q && {
        OR: [
          {
            purchaseOrderNumber: { contains: q, mode: 'insensitive' as const },
          },
          {
            supplierCompany: {
              name: { contains: q, mode: 'insensitive' as const },
            },
          },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where,
        include: {
          supplierCompany: { select: SUPPLIER_COMPANY_SELECT },
          _count: { select: { items: true } },
        },
        orderBy: { [orderField]: direction },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);

    return {
      items: items.map(toPurchaseOrder),
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  async findOne(id: string): Promise<PurchaseOrderSummary> {
    return toPurchaseOrder(await this.getOrThrow(id));
  }

  /** Atomic SupplierQuotation→PurchaseOrder conversion. One Prisma interactive transaction:
   * - Read the SupplierQuotation with its items, validate `status === 'selected'` exactly —
   *   every other status is rejected. Unlike every other "from-X" conversion in this codebase,
   *   there is no "already has a child" eligible-status variant here: `selected` is terminal
   *   (never revisited), and the one-PO-per-quotation invariant is a separate, dedicated check
   *   (and ultimately the database's own unique constraint), not an eligibility question.
   * - Friendly pre-check for an existing PurchaseOrder against this SupplierQuotation — the
   *   real, final guard is `PurchaseOrder.supplierQuotationId @unique` (no migration needed,
   *   it already exists); this pre-check only produces a clean, early 409 in the common case.
   * - Re-validates the supplier's active relationship (may have lapsed since selection).
   * - Copies every SupplierQuotationItem into a PurchaseOrderItem — `productId`/`quantity`/
   *   `unit`/`unitPrice`/`discount`/`specifications`/`notes` copied verbatim, no client
   *   override input exists for this endpoint. `productNameSnapshot` is the one exception,
   *   always re-derived from the live Product. Unlike SalesOrder (which preserves the
   *   Quotation's own item subtotal verbatim), every item subtotal and the order subtotal/
   *   total are *recalculated* here from the copied quantity/unitPrice/discount — per the
   *   locked decision not to blindly trust the SupplierQuotation's stored totals. */
  async createFromSupplierQuotation(
    supplierQuotationId: string,
    dto: CreatePurchaseOrderDto,
  ): Promise<PurchaseOrderSummary> {
    for (let attempt = 1; ; attempt++) {
      const purchaseOrderNumber = await this.generatePurchaseOrderNumber();
      try {
        const purchaseOrder = await this.prisma.$transaction(async (tx) => {
          const supplierQuotation = await tx.supplierQuotation.findUnique({
            where: { id: supplierQuotationId },
            include: { items: true },
          });
          if (!supplierQuotation) {
            throw new ApiException(
              'NOT_FOUND',
              'Supplier quotation not found.',
              404,
            );
          }
          if (supplierQuotation.status !== 'selected') {
            throw new ApiException(
              'INVALID_STATE_TRANSITION',
              `Cannot create a purchase order from a supplier quotation with status "${supplierQuotation.status}".`,
              409,
            );
          }
          if (supplierQuotation.items.length === 0) {
            throw new ApiException(
              'VALIDATION_ERROR',
              'This supplier quotation has no items and cannot create a purchase order.',
              400,
            );
          }

          const existingPurchaseOrder = await tx.purchaseOrder.findFirst({
            where: { supplierQuotationId },
            select: { id: true },
          });
          if (existingPurchaseOrder) {
            throw new ApiException(
              'CONFLICT',
              'This supplier quotation already has a purchase order.',
              409,
            );
          }

          await this.assertActiveSupplier(supplierQuotation.supplierCompanyId);

          const products = await tx.product.findMany({
            where: {
              id: {
                in: supplierQuotation.items.map((item) => item.productId),
              },
            },
            select: { id: true, name: true },
          });
          const productById = new Map(
            products.map((product) => [product.id, product]),
          );

          const itemsData = supplierQuotation.items.map((item) => {
            const product = productById.get(item.productId);
            if (!product) {
              throw new ApiException(
                'VALIDATION_ERROR',
                `Product "${item.productId}" does not exist.`,
                400,
              );
            }

            // Recalculated, never blindly copied from SupplierQuotationItem.subtotal (locked
            // decision 20).
            const subtotal = item.quantity
              .mul(item.unitPrice)
              .sub(item.discount ?? new Prisma.Decimal(0));

            return {
              productId: item.productId,
              // Always the live Product master at creation time.
              productNameSnapshot: product.name,
              quantity: item.quantity,
              unit: item.unit,
              unitPrice: item.unitPrice,
              discount: item.discount,
              subtotal,
            };
          });

          const subtotal = itemsData.reduce(
            (sum, item) => sum.add(item.subtotal),
            new Prisma.Decimal(0),
          );
          const total = subtotal
            .sub(supplierQuotation.discount ?? new Prisma.Decimal(0))
            .add(supplierQuotation.shippingCost ?? new Prisma.Decimal(0));
          // Defensive: a purchase order can never carry a negative total.
          if (total.isNegative()) {
            throw new ApiException(
              'VALIDATION_ERROR',
              'The supplier quotation discount exceeds its subtotal plus shipping cost, so a purchase order cannot be created from it.',
              400,
            );
          }

          return tx.purchaseOrder.create({
            data: {
              purchaseOrderNumber,
              purchaseRequestId: null,
              supplierQuotationId: supplierQuotation.id,
              // Always derived from the SupplierQuotation server-side.
              supplierCompanyId: supplierQuotation.supplierCompanyId,
              status: 'draft',
              orderDate: new Date(),
              expectedDeliveryDate: dto.expectedDeliveryDate
                ? new Date(dto.expectedDeliveryDate)
                : null,
              currency: supplierQuotation.currency,
              subtotal,
              discount: supplierQuotation.discount,
              shippingCost: supplierQuotation.shippingCost,
              total,
              notes: dto.notes ?? null,
              items: {
                create: itemsData.map((item) => ({
                  productId: item.productId,
                  productNameSnapshot: item.productNameSnapshot,
                  quantity: item.quantity,
                  unit: item.unit,
                  unitPrice: item.unitPrice,
                  discount: item.discount,
                  subtotal: item.subtotal,
                })),
              },
            },
            include: DETAIL_INCLUDE,
          });
        });

        return toPurchaseOrder(purchaseOrder);
      } catch (error) {
        if (error instanceof ApiException) {
          throw error;
        }

        const target = this.classifyUniqueViolation(error);
        if (
          target === 'purchase_order_number' &&
          attempt < MAX_PURCHASE_ORDER_NUMBER_RETRY_ATTEMPTS
        ) {
          continue;
        }
        if (target === 'supplier_quotation_id') {
          throw new ApiException(
            'CONFLICT',
            'This supplier quotation already has a purchase order.',
            409,
          );
        }
        if (target === 'ambiguous') {
          if (attempt < MAX_PURCHASE_ORDER_NUMBER_RETRY_ATTEMPTS) {
            continue;
          }
          throw new ApiException(
            'CONFLICT',
            'Could not generate a unique purchase order number. Please try again.',
            409,
          );
        }

        throw error;
      }
    }
  }

  /** `requestedDeliveryDate`-style field locking, mirroring every other Phase 21/22
   * draft-vs-non-draft discipline: while `draft`, `expectedDeliveryDate`/`notes` remain
   * editable along with a valid transition; once the order has left `draft`,
   * `expectedDeliveryDate` is locked, only `notes` and a valid transition remain editable.
   * `partially_received`/`received`/`closed` are never reachable (locked decision 21) — the
   * generic "not in allowed list" rejection covers this, no special-casing needed. */
  async update(
    id: string,
    dto: UpdatePurchaseOrderDto,
  ): Promise<PurchaseOrderSummary> {
    const existing = await this.getOrThrow(id);

    if (dto.status !== undefined) {
      this.assertValidStatusTransition(existing.status, dto.status);
    }

    if (existing.status !== 'draft' && dto.expectedDeliveryDate !== undefined) {
      throw new ApiException(
        'VALIDATION_ERROR',
        'Cannot edit expectedDeliveryDate once the purchase order has left draft status.',
        400,
        { fields: ['expectedDeliveryDate'] },
      );
    }

    const updated = await this.prisma.purchaseOrder.update({
      where: { id },
      include: DETAIL_INCLUDE,
      data: {
        ...(dto.expectedDeliveryDate !== undefined && {
          expectedDeliveryDate: new Date(dto.expectedDeliveryDate),
        }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
    });

    return toPurchaseOrder(updated);
  }

  private async getOrThrow(id: string) {
    const purchaseOrder = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: DETAIL_INCLUDE,
    });
    if (!purchaseOrder) {
      throw new ApiException('NOT_FOUND', 'Purchase order not found.', 404);
    }
    return purchaseOrder;
  }

  /** Only `draft→{issued,cancelled}`, `issued→{confirmed,cancelled}`,
   * `confirmed→{cancelled}` are reachable in Phase 22 (locked decision 21) — `confirmed →
   * partially_received`/`received`, every `partially_received` transition, and `received →
   * closed` all require real Receiving data that does not exist in this phase's application
   * layer, so they are simply absent from every list below rather than faked. */
  private assertValidStatusTransition(
    currentStatus: string,
    nextStatus: string,
  ): void {
    const allowed: Record<string, string[]> = {
      draft: ['issued', 'cancelled'],
      issued: ['confirmed', 'cancelled'],
      confirmed: ['cancelled'],
      partially_received: [],
      received: [],
      cancelled: [],
      closed: [],
    };
    if (!allowed[currentStatus]?.includes(nextStatus)) {
      throw new ApiException(
        'INVALID_STATE_TRANSITION',
        `Cannot change purchase order status from "${currentStatus}" to "${nextStatus}".`,
        409,
      );
    }
  }

  /** `PO-YYYY-NNNNNN`, year-scoped sequence — same shape as every prior phase's own
   * generator. */
  private async generatePurchaseOrderNumber(): Promise<string> {
    const year = new Date().getUTCFullYear();
    const startOfYear = new Date(Date.UTC(year, 0, 1));
    const count = await this.prisma.purchaseOrder.count({
      where: { createdAt: { gte: startOfYear } },
    });
    const sequence = (count + 1).toString().padStart(6, '0');
    return `PO-${year}-${sequence}`;
  }

  /** Application-layer supplier validation — duplicated identically from
   * SupplierRfqsService/SupplierQuotationsService rather than extracted into a shared module,
   * per this codebase's documented per-service convention. */
  private async assertActiveSupplier(supplierCompanyId: string): Promise<void> {
    const relationship = await this.prisma.businessRelationship.findFirst({
      where: {
        companyId: supplierCompanyId,
        relationshipType: 'supplier',
        status: 'active',
      },
      select: { id: true },
    });
    if (!relationship) {
      throw new ApiException(
        'VALIDATION_ERROR',
        'The selected company does not have an active supplier relationship.',
        400,
        { fields: ['supplierCompanyId'] },
      );
    }
  }

  /** Same detection shape as every prior phase's service, extended with a second live unique
   * constraint: `PurchaseOrder.supplierQuotationId` (the database-enforced one-PO-per-
   * SupplierQuotation guard). A `purchase_order_number` collision is retried; a
   * `supplier_quotation_id` collision is a genuine duplicate and is never retried. */
  private classifyUniqueViolation(error: unknown): UniqueViolationTarget {
    const err = error as {
      code?: string;
      meta?: {
        target?: string[];
        driverAdapterError?: { cause?: { originalCode?: string } };
      };
    };

    if (err.code === 'P2002') {
      if (err.meta?.target?.includes('supplier_quotation_id')) {
        return 'supplier_quotation_id';
      }
      return err.meta?.target?.includes('purchase_order_number') ||
        !err.meta?.target
        ? 'purchase_order_number'
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
