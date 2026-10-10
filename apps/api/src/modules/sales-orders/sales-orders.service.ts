import { Injectable } from '@nestjs/common';
import {
  buildPaginationMeta,
  parseSort,
} from '../../common/dto/pagination-query.dto';
import { ApiException } from '../../common/exceptions/api.exception';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateSalesOrderDto } from './dto/create-sales-order.dto';
import type { SalesOrderQueryDto } from './dto/sales-order-query.dto';
import type { UpdateSalesOrderDto } from './dto/update-sales-order.dto';
import { toSalesOrder, type SalesOrderSummary } from './sales-orders.mapper';

const SORT_FIELD_MAP: Record<string, string> = {
  created_at: 'createdAt',
  sales_order_number: 'salesOrderNumber',
  status: 'status',
  order_date: 'orderDate',
  total: 'total',
};

const COMPANY_SELECT = { id: true, name: true } as const;
const PRODUCT_SELECT = { id: true, name: true } as const;
const QUOTATION_SELECT = { id: true, quotationNumber: true } as const;
const DETAIL_INCLUDE = {
  company: { select: COMPANY_SELECT },
  quotation: { select: QUOTATION_SELECT },
  items: { include: { product: { select: PRODUCT_SELECT } } },
} as const;

// Mirrors Inquiry/Lead/Opportunity/RFQ/Quotation's own bound — a local, analogous helper per
// this codebase's documented "duplicate per-service rather than extract a shared util"
// convention.
const MAX_SALES_ORDER_NUMBER_RETRY_ATTEMPTS = 3;

type UniqueViolationTarget = 'sales_order_number' | 'ambiguous' | null;

@Injectable()
export class SalesOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: SalesOrderQueryDto): Promise<{
    items: SalesOrderSummary[];
    meta: ReturnType<typeof buildPaginationMeta>;
  }> {
    const { field, direction } = parseSort(query.sort);
    const orderField = SORT_FIELD_MAP[field] ?? 'createdAt';
    const q = query.q?.trim();

    const where = {
      ...(query.status !== undefined && { status: query.status }),
      ...(query.companyId !== undefined && { companyId: query.companyId }),
      ...(query.quotationId !== undefined && {
        quotationId: query.quotationId,
      }),
      ...(query.currency !== undefined && { currency: query.currency }),
      ...(q && {
        OR: [
          {
            salesOrderNumber: { contains: q, mode: 'insensitive' as const },
          },
          { company: { name: { contains: q, mode: 'insensitive' as const } } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.salesOrder.findMany({
        where,
        include: {
          company: { select: COMPANY_SELECT },
          _count: { select: { items: true } },
        },
        orderBy: { [orderField]: direction },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.salesOrder.count({ where }),
    ]);

    return {
      items: items.map(toSalesOrder),
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  async findOne(id: string): Promise<SalesOrderSummary> {
    return toSalesOrder(await this.getOrThrow(id));
  }

  /** Atomic Quotation→SalesOrder conversion (Phase 21 locked decisions). One Prisma
   * interactive transaction:
   * - Read the Quotation with its items; validate `status === 'accepted'` — every other status
   *   is rejected (locked decision 4).
   * - Check for an existing SalesOrder against this Quotation; reject if one already exists
   *   (locked decision 5) — a best-effort guard, not database-enforced (no unique constraint
   *   on `quotationId`); see Known Limitations.
   * - Copy every commercial field verbatim from the Quotation/QuotationItems — company,
   *   currency, product, quantity, unit, unitPrice, discount, subtotal, order discount,
   *   shippingCost — never recalculated, never client-overridable (locked decisions 7/8/13-24,
   *   the "commercial snapshot invariant"). `productNameSnapshot` is the one exception: it is
   *   re-derived from the live Product master, exactly like every other snapshot in this CRM
   *   chain, never copied from the Quotation's own snapshot.
   * - Defensively verifies each QuotationItem's stored `subtotal` is internally consistent
   *   with its own quantity/unitPrice/discount before trusting it (locked decision 20) —
   *   should never fail given Phase 20's own validation, but never silently propagates a
   *   corrupt commercial value if it somehow did.
   * - Does not touch `Quotation.status` at all (locked decision 28) — it remains `accepted`. */
  async createFromQuotation(
    quotationId: string,
    dto: CreateSalesOrderDto,
  ): Promise<SalesOrderSummary> {
    for (let attempt = 1; ; attempt++) {
      const salesOrderNumber = await this.generateSalesOrderNumber();
      try {
        const salesOrder = await this.prisma.$transaction(async (tx) => {
          const quotation = await tx.quotation.findUnique({
            where: { id: quotationId },
            include: { items: true },
          });
          if (!quotation) {
            throw new ApiException('NOT_FOUND', 'Quotation not found.', 404);
          }
          if (quotation.status !== 'accepted') {
            throw new ApiException(
              'INVALID_STATE_TRANSITION',
              `Cannot create a sales order from a quotation with status "${quotation.status}".`,
              409,
            );
          }
          if (quotation.items.length === 0) {
            throw new ApiException(
              'VALIDATION_ERROR',
              'This quotation has no items and cannot create a sales order.',
              400,
            );
          }

          // Best-effort duplicate guard — see Known Limitations: without a unique constraint
          // on `SalesOrder.quotationId` (no migration in this phase), two exactly-concurrent
          // requests against the same quotation are not fully race-proof.
          const existingSalesOrder = await tx.salesOrder.findFirst({
            where: { quotationId },
            select: { id: true },
          });
          if (existingSalesOrder) {
            throw new ApiException(
              'CONFLICT',
              'This quotation already has a sales order.',
              409,
            );
          }

          const products = await tx.product.findMany({
            where: {
              id: { in: quotation.items.map((item) => item.productId) },
            },
            select: { id: true, name: true },
          });
          const productById = new Map(
            products.map((product) => [product.id, product]),
          );

          const itemsData = quotation.items.map((item) => {
            const product = productById.get(item.productId);
            if (!product) {
              throw new ApiException(
                'VALIDATION_ERROR',
                `Product "${item.productId}" does not exist.`,
                400,
              );
            }

            const expectedSubtotal = item.quantity
              .mul(item.unitPrice)
              .sub(item.discount ?? new Prisma.Decimal(0));
            if (!expectedSubtotal.equals(item.subtotal)) {
              throw new ApiException(
                'VALIDATION_ERROR',
                `Quotation item subtotal is inconsistent for product "${item.productId}".`,
                400,
              );
            }

            return {
              productId: item.productId,
              // Always the live Product master at creation time — never the Quotation's own
              // snapshot (locked decision 15).
              productNameSnapshot: product.name,
              quantity: item.quantity,
              unit: item.unit,
              unitPrice: item.unitPrice,
              discount: item.discount,
              subtotal: item.subtotal,
              specifications: item.specifications,
              notes: item.notes,
            };
          });

          const subtotal = itemsData.reduce(
            (sum, item) => sum.add(item.subtotal),
            new Prisma.Decimal(0),
          );
          const total = subtotal
            .sub(quotation.discount ?? new Prisma.Decimal(0))
            .add(quotation.shippingCost ?? new Prisma.Decimal(0));

          const created = await tx.salesOrder.create({
            data: {
              salesOrderNumber,
              quotationId: quotation.id,
              // Always derived from the Quotation server-side — never accepted from the client
              // (locked decision 7).
              companyId: quotation.companyId,
              status: 'draft',
              orderDate: new Date(),
              requestedDeliveryDate: dto.requestedDeliveryDate
                ? new Date(dto.requestedDeliveryDate)
                : null,
              // Always derived from the Quotation server-side — never accepted from the client
              // (locked decision 8).
              currency: quotation.currency,
              subtotal,
              discount: quotation.discount,
              shippingCost: quotation.shippingCost,
              total,
              notes: dto.notes ?? null,
              items: { create: itemsData },
            },
            include: DETAIL_INCLUDE,
          });

          return created;
        });

        return toSalesOrder(salesOrder);
      } catch (error) {
        if (error instanceof ApiException) {
          throw error;
        }

        const target = this.classifyUniqueViolation(error);
        if (
          (target === 'sales_order_number' || target === 'ambiguous') &&
          attempt < MAX_SALES_ORDER_NUMBER_RETRY_ATTEMPTS
        ) {
          continue;
        }
        if (target !== null) {
          throw new ApiException(
            'CONFLICT',
            'Could not generate a unique sales order number. Please try again.',
            409,
          );
        }

        throw error;
      }
    }
  }

  /** Draft-vs-non-draft field locking, mirroring SalesQuotationsService's own discipline
   * (locked decision 32). While `draft`, `requestedDeliveryDate`/`notes` remain editable along
   * with a valid lifecycle transition. Once the status has left `draft`, `requestedDeliveryDate`
   * is locked; only `notes` and a valid transition remain editable. The commercial snapshot
   * (company/currency/items/pricing) is never editable through this route at any status. */
  async update(
    id: string,
    dto: UpdateSalesOrderDto,
  ): Promise<SalesOrderSummary> {
    const existing = await this.getOrThrow(id);

    if (dto.status !== undefined) {
      this.assertValidStatusTransition(existing.status, dto.status);
    }

    if (
      existing.status !== 'draft' &&
      dto.requestedDeliveryDate !== undefined
    ) {
      throw new ApiException(
        'VALIDATION_ERROR',
        'Cannot edit requestedDeliveryDate once the sales order has left draft status.',
        400,
        { fields: ['requestedDeliveryDate'] },
      );
    }

    const updated = await this.prisma.salesOrder.update({
      where: { id },
      include: DETAIL_INCLUDE,
      data: {
        ...(dto.requestedDeliveryDate !== undefined && {
          requestedDeliveryDate: new Date(dto.requestedDeliveryDate),
        }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
    });

    return toSalesOrder(updated);
  }

  private async getOrThrow(id: string) {
    const salesOrder = await this.prisma.salesOrder.findUnique({
      where: { id },
      include: DETAIL_INCLUDE,
    });
    if (!salesOrder) {
      throw new ApiException('NOT_FOUND', 'Sales order not found.', 404);
    }
    return salesOrder;
  }

  /** `draft` is deliberately absent from every target list — nothing transitions back into it.
   * `partially_fulfilled` is deliberately absent too: the enum value exists in the schema, but
   * no fulfillment-tracking data exists yet to justify entering it (locked decision 30) — this
   * is why it's omitted here rather than special-cased, the generic "not in the allowed list"
   * rejection already covers it. No reopening a terminal status. */
  private assertValidStatusTransition(
    currentStatus: string,
    nextStatus: string,
  ): void {
    const allowed: Record<string, string[]> = {
      draft: ['confirmed', 'cancelled'],
      confirmed: ['processing', 'cancelled'],
      processing: ['fulfilled', 'cancelled'],
      partially_fulfilled: [],
      fulfilled: [],
      cancelled: [],
    };
    if (!allowed[currentStatus]?.includes(nextStatus)) {
      throw new ApiException(
        'INVALID_STATE_TRANSITION',
        `Cannot change sales order status from "${currentStatus}" to "${nextStatus}".`,
        409,
      );
    }
  }

  /** `SO-YYYY-NNNNNN`, year-scoped sequence — same shape as every prior CRM/Sales phase's own
   * generator, deliberately re-implemented locally rather than a shared abstraction, per this
   * codebase's established per-service convention. */
  private async generateSalesOrderNumber(): Promise<string> {
    const year = new Date().getUTCFullYear();
    const startOfYear = new Date(Date.UTC(year, 0, 1));
    const count = await this.prisma.salesOrder.count({
      where: { createdAt: { gte: startOfYear } },
    });
    const sequence = (count + 1).toString().padStart(6, '0');
    return `SO-${year}-${sequence}`;
  }

  /** Same detection shape as every prior CRM/Sales phase's service — Prisma 7's driver-adapter
   * can surface a unique violation either as `P2002` (with `meta.target` naming the column) or
   * as the generic unmapped `P2039`, with the real Postgres SQLSTATE (`23505` =
   * `unique_violation`) at `meta.driverAdapterError.cause.originalCode`. Only
   * `sales_order_number` is a live unique constraint here. */
  private classifyUniqueViolation(error: unknown): UniqueViolationTarget {
    const err = error as {
      code?: string;
      meta?: {
        target?: string[];
        driverAdapterError?: { cause?: { originalCode?: string } };
      };
    };

    if (err.code === 'P2002') {
      return err.meta?.target?.includes('sales_order_number') ||
        !err.meta?.target
        ? 'sales_order_number'
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
