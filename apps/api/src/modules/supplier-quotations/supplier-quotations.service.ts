import { Injectable } from '@nestjs/common';
import {
  buildPaginationMeta,
  parseSort,
} from '../../common/dto/pagination-query.dto';
import { ApiException } from '../../common/exceptions/api.exception';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateSupplierQuotationDto } from './dto/create-supplier-quotation.dto';
import type { SupplierQuotationQueryDto } from './dto/supplier-quotation-query.dto';
import type { UpdateSupplierQuotationDto } from './dto/update-supplier-quotation.dto';
import {
  toSupplierQuotation,
  type SupplierQuotationSummary,
} from './supplier-quotations.mapper';

const SORT_FIELD_MAP: Record<string, string> = {
  created_at: 'createdAt',
  supplier_quotation_number: 'supplierQuotationNumber',
  status: 'status',
};

const SUPPLIER_COMPANY_SELECT = { id: true, name: true } as const;
const PRODUCT_SELECT = { id: true, name: true } as const;
const SUPPLIER_RFQ_SELECT = { id: true, supplierRfqNumber: true } as const;
const DETAIL_INCLUDE = {
  supplierCompany: { select: SUPPLIER_COMPANY_SELECT },
  supplierRfq: { select: SUPPLIER_RFQ_SELECT },
  items: { include: { product: { select: PRODUCT_SELECT } } },
} as const;

// Only `reviewing`/`quoted` SupplierRFQs may produce a SupplierQuotation — same shape as
// RFQ→Quotation eligibility. `quoted` is NOT terminal: a SupplierRFQ that already has one
// SupplierQuotation may still receive more (one per responding supplier, or revisions).
const ELIGIBLE_SUPPLIER_RFQ_STATUSES = ['reviewing', 'quoted'] as const;

const MAX_SUPPLIER_QUOTATION_NUMBER_RETRY_ATTEMPTS = 3;

type UniqueViolationTarget = 'supplier_quotation_number' | 'ambiguous' | null;

@Injectable()
export class SupplierQuotationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: SupplierQuotationQueryDto): Promise<{
    items: SupplierQuotationSummary[];
    meta: ReturnType<typeof buildPaginationMeta>;
  }> {
    const { field, direction } = parseSort(query.sort);
    const orderField = SORT_FIELD_MAP[field] ?? 'createdAt';
    const q = query.q?.trim();

    const where = {
      ...(query.status !== undefined && { status: query.status }),
      ...(query.supplierRfqId !== undefined && {
        supplierRfqId: query.supplierRfqId,
      }),
      ...(query.supplierCompanyId !== undefined && {
        supplierCompanyId: query.supplierCompanyId,
      }),
      ...(q && {
        OR: [
          {
            supplierQuotationNumber: {
              contains: q,
              mode: 'insensitive' as const,
            },
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
      this.prisma.supplierQuotation.findMany({
        where,
        include: {
          supplierCompany: { select: SUPPLIER_COMPANY_SELECT },
          _count: { select: { items: true } },
        },
        orderBy: { [orderField]: direction },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.supplierQuotation.count({ where }),
    ]);

    return {
      items: items.map(toSupplierQuotation),
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  async findOne(id: string): Promise<SupplierQuotationSummary> {
    return toSupplierQuotation(await this.getOrThrow(id));
  }

  /** Atomic SupplierRFQ→SupplierQuotation creation. One Prisma interactive transaction:
   * - Read the SupplierRFQ with its items, validate eligibility, re-validate the supplier
   *   (an active `supplier` relationship may have lapsed since the SupplierRFQ was created).
   * - Match each request item against a `SupplierRFQItem` of the same `productId` (identical
   *   matching/consumption discipline as RFQItem→QuotationItem — a product may legitimately
   *   appear more than once on the SupplierRFQ, matched one-to-one against distinct request
   *   items, never merged). `quantity`/`unit`/`specifications`/`notes` default from the
   *   matched SupplierRFQItem; `productId`/`unitPrice`/`discount` are never sourced from it.
   * - Creates the SupplierQuotation starting at `draft` — NOT `received`. The SupplierRFQ's
   *   own `reviewing → quoted` flip happens later, when this SupplierQuotation is explicitly
   *   transitioned to `received` via `update()`, not at creation time (see `update()`'s own
   *   comment for why this differs from every other "from-X" creation in this codebase). */
  async createFromSupplierRfq(
    supplierRfqId: string,
    dto: CreateSupplierQuotationDto,
  ): Promise<SupplierQuotationSummary> {
    for (let attempt = 1; ; attempt++) {
      const supplierQuotationNumber =
        await this.generateSupplierQuotationNumber();
      try {
        const supplierQuotation = await this.prisma.$transaction(async (tx) => {
          const supplierRfq = await tx.supplierRFQ.findUnique({
            where: { id: supplierRfqId },
          });
          if (!supplierRfq) {
            throw new ApiException('NOT_FOUND', 'Supplier RFQ not found.', 404);
          }
          if (
            !ELIGIBLE_SUPPLIER_RFQ_STATUSES.includes(
              supplierRfq.status as 'reviewing' | 'quoted',
            )
          ) {
            throw new ApiException(
              'INVALID_STATE_TRANSITION',
              `Cannot create a supplier quotation from a supplier RFQ with status "${supplierRfq.status}".`,
              409,
            );
          }

          await this.assertActiveSupplier(supplierRfq.supplierCompanyId);

          const rfqItems = await tx.supplierRFQItem.findMany({
            where: { supplierRfqId },
            orderBy: { id: 'asc' },
          });
          if (rfqItems.length === 0) {
            throw new ApiException(
              'VALIDATION_ERROR',
              'This supplier RFQ has no items and cannot create a supplier quotation.',
              400,
              { fields: ['items'] },
            );
          }

          type RfqItemRow = (typeof rfqItems)[number];
          const rfqItemsByProduct = new Map<string, RfqItemRow[]>();
          for (const rfqItem of rfqItems) {
            const group = rfqItemsByProduct.get(rfqItem.productId) ?? [];
            group.push(rfqItem);
            rfqItemsByProduct.set(rfqItem.productId, group);
          }
          const consumedCount = new Map<string, number>();

          const matchedItems = dto.items.map((item) => {
            const group = rfqItemsByProduct.get(item.productId);
            if (!group) {
              throw new ApiException(
                'VALIDATION_ERROR',
                `Product "${item.productId}" is not part of this supplier RFQ and cannot be added as a quotation item.`,
                400,
                { fields: ['items'] },
              );
            }
            const index = consumedCount.get(item.productId) ?? 0;
            const rfqItem = group[index];
            if (!rfqItem) {
              throw new ApiException(
                'VALIDATION_ERROR',
                `Too many quotation items were supplied for product "${item.productId}" — only ${group.length} supplier RFQ item(s) exist for this product.`,
                400,
                { fields: ['items'] },
              );
            }
            consumedCount.set(item.productId, index + 1);

            return {
              item,
              quantity: item.quantity ?? rfqItem.quantity.toNumber(),
              unit: item.unit ?? rfqItem.unit,
              specifications:
                item.specifications ?? rfqItem.specifications ?? null,
              notes: item.notes ?? rfqItem.notes ?? null,
            };
          });

          const products = await tx.product.findMany({
            where: {
              id: {
                in: [...new Set(matchedItems.map((m) => m.item.productId))],
              },
            },
            select: { id: true, name: true },
          });
          const productById = new Map(
            products.map((product) => [product.id, product]),
          );

          const itemCalculations = matchedItems.map((matched) => {
            const product = productById.get(matched.item.productId);
            if (!product) {
              throw new ApiException(
                'VALIDATION_ERROR',
                `Product "${matched.item.productId}" does not exist.`,
                400,
                { fields: ['items'] },
              );
            }

            const subtotal = new Prisma.Decimal(matched.quantity)
              .mul(new Prisma.Decimal(matched.item.unitPrice))
              .sub(new Prisma.Decimal(matched.item.discount ?? 0));
            if (subtotal.isNegative()) {
              throw new ApiException(
                'VALIDATION_ERROR',
                `Item discount cannot exceed quantity × unit price for product "${matched.item.productId}".`,
                400,
                { fields: ['items'] },
              );
            }
            return {
              ...matched,
              productNameSnapshot: product.name,
              subtotal,
            };
          });

          const subtotal = itemCalculations.reduce(
            (sum, calc) => sum.add(calc.subtotal),
            new Prisma.Decimal(0),
          );
          const total = subtotal
            .sub(new Prisma.Decimal(dto.discount ?? 0))
            .add(new Prisma.Decimal(dto.shippingCost ?? 0));
          if (total.isNegative()) {
            throw new ApiException(
              'VALIDATION_ERROR',
              'Discount cannot exceed subtotal plus shipping cost.',
              400,
              { fields: ['discount', 'shippingCost'] },
            );
          }

          return tx.supplierQuotation.create({
            data: {
              supplierQuotationNumber,
              supplierRfqId: supplierRfq.id,
              // Always derived from the SupplierRFQ server-side — never accepted from the
              // client.
              supplierCompanyId: supplierRfq.supplierCompanyId,
              status: 'draft',
              quotationDate: dto.quotationDate
                ? new Date(dto.quotationDate)
                : null,
              validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
              currency: dto.currency,
              subtotal,
              discount: dto.discount ?? null,
              shippingCost: dto.shippingCost ?? null,
              total,
              notes: dto.notes ?? null,
              items: {
                create: itemCalculations.map((calc) => ({
                  productId: calc.item.productId,
                  productNameSnapshot: calc.productNameSnapshot,
                  quantity: calc.quantity,
                  unit: calc.unit,
                  unitPrice: calc.item.unitPrice,
                  discount: calc.item.discount ?? null,
                  subtotal: calc.subtotal,
                  specifications: calc.specifications,
                  notes: calc.notes,
                })),
              },
            },
            include: DETAIL_INCLUDE,
          });
        });

        return toSupplierQuotation(supplierQuotation);
      } catch (error) {
        if (error instanceof ApiException) {
          throw error;
        }

        const target = this.classifyUniqueViolation(error);
        if (
          (target === 'supplier_quotation_number' || target === 'ambiguous') &&
          attempt < MAX_SUPPLIER_QUOTATION_NUMBER_RETRY_ATTEMPTS
        ) {
          continue;
        }
        if (target !== null) {
          throw new ApiException(
            'CONFLICT',
            'Could not generate a unique supplier quotation number. Please try again.',
            409,
          );
        }

        throw error;
      }
    }
  }

  /** Every update — whatever it changes — runs in one transaction that serializes on the
   * SupplierQuotation row and decides everything from state read AFTER that lock; the
   * pre-transaction read is used only for the 404 and for the (immutable) parent SupplierRFQ
   * id. Lock order is always parent SupplierRFQ -> SupplierQuotation (the parent lock is taken
   * only for the two transitions that touch the RFQ), so no two paths can lock them in
   * opposite orders. Inside the lock:
   * - The lifecycle transition is validated against the fresh status.
   * - The commercial lock (`quotationDate`/`validUntil`/`currency`/`discount`/`shippingCost`
   *   editable only while `draft`) is evaluated against the fresh status, so an edit can never
   *   land on a quotation that a concurrent request just moved out of `draft`.
   * - `total = subtotal − discount + shippingCost` is recomputed from the fresh row whenever
   *   discount/shippingCost change, and always on `draft → received` as a defensive check.
   * - The write is a conditional `updateMany({ id, status: <the status just validated> })`; a
   *   `count` of 0 is a clean 409, never a silent overwrite.
   *
   * Two transitions carry extra, parent-level rules:
   * - `draft → received`: this is the moment the SupplierRFQ's own `reviewing → quoted` flip
   *   happens (conditional update, count=0 recheck, identical discipline to every other
   *   parent-flip in this codebase — just triggered here by a later transition instead of by
   *   creation, per the locked decision that `quoted` means "≥1 SupplierQuotation received,"
   *   not "≥1 SupplierQuotation created").
   * - `under_review → selected`: the max-one-selected-per-SupplierRFQ invariant (locked
   *   decision) — checked under a real Postgres `FOR UPDATE` on the parent SupplierRFQ row, so
   *   concurrent selection attempts against different siblings genuinely serialize rather
   *   than racing past a plain pre-check (a `findFirst` never blocks a concurrent writer). No
   *   schema change, no unique constraint; this is the one narrowly-scoped use of raw SQL,
   *   because Prisma Client has no first-class row-locking API. */
  async update(
    id: string,
    dto: UpdateSupplierQuotationDto,
  ): Promise<SupplierQuotationSummary> {
    const initial = await this.getOrThrow(id);

    const updated = await this.prisma.$transaction(async (tx) => {
      if (dto.status === 'received' || dto.status === 'selected') {
        await tx.$queryRaw`SELECT id FROM supplier_rfqs WHERE id = ${initial.supplierRfqId} FOR UPDATE`;
      }
      await tx.$queryRaw`SELECT id FROM supplier_quotations WHERE id = ${id} FOR UPDATE`;

      const existing = await tx.supplierQuotation.findUnique({
        where: { id },
      });
      if (!existing) {
        throw new ApiException(
          'NOT_FOUND',
          'Supplier quotation not found.',
          404,
        );
      }

      if (dto.status !== undefined) {
        this.assertValidStatusTransition(existing.status, dto.status);
      }

      // Commercial fields are only editable while the quotation is still `draft` — same rule
      // as SalesQuotations. Once it has left `draft` only `notes` and a valid lifecycle
      // transition remain editable, so a `selected` quotation can never change under the PO
      // built from it.
      const lockedFields: Array<keyof UpdateSupplierQuotationDto> = [
        'quotationDate',
        'validUntil',
        'currency',
        'discount',
        'shippingCost',
      ];
      if (existing.status !== 'draft') {
        const touchedLockedFields = lockedFields.filter(
          (field) => dto[field] !== undefined,
        );
        if (touchedLockedFields.length > 0) {
          throw new ApiException(
            'VALIDATION_ERROR',
            `Cannot edit ${touchedLockedFields.join(', ')} once the supplier quotation has left draft status.`,
            400,
            { fields: touchedLockedFields },
          );
        }
      }

      // `total` is always server-calculated from the stored subtotal, never client-supplied.
      let total: Prisma.Decimal | undefined;
      if (
        dto.discount !== undefined ||
        dto.shippingCost !== undefined ||
        dto.status === 'received'
      ) {
        const discount = new Prisma.Decimal(
          dto.discount !== undefined ? dto.discount : (existing.discount ?? 0),
        );
        const shippingCost = new Prisma.Decimal(
          dto.shippingCost !== undefined
            ? dto.shippingCost
            : (existing.shippingCost ?? 0),
        );
        total = existing.subtotal.sub(discount).add(shippingCost);
        if (total.isNegative()) {
          throw new ApiException(
            'VALIDATION_ERROR',
            'Discount cannot exceed subtotal plus shipping cost.',
            400,
            { fields: ['discount', 'shippingCost'] },
          );
        }
      }

      if (dto.status === 'selected') {
        const sibling = await tx.supplierQuotation.findFirst({
          where: {
            supplierRfqId: existing.supplierRfqId,
            status: 'selected',
            id: { not: id },
          },
          select: { id: true },
        });
        if (sibling) {
          throw new ApiException(
            'CONFLICT',
            'Another supplier quotation for this supplier RFQ is already selected.',
            409,
          );
        }
      }

      const { count } = await tx.supplierQuotation.updateMany({
        where: { id, status: existing.status },
        data: {
          ...(dto.quotationDate !== undefined && {
            quotationDate: new Date(dto.quotationDate),
          }),
          ...(dto.validUntil !== undefined && {
            validUntil: new Date(dto.validUntil),
          }),
          ...(dto.currency !== undefined && { currency: dto.currency }),
          ...(dto.discount !== undefined && { discount: dto.discount }),
          ...(dto.shippingCost !== undefined && {
            shippingCost: dto.shippingCost,
          }),
          ...(total !== undefined && { total }),
          ...(dto.notes !== undefined && { notes: dto.notes }),
          ...(dto.status !== undefined && { status: dto.status }),
        },
      });
      if (count === 0) {
        throw new ApiException(
          'CONFLICT',
          'This supplier quotation was changed by another request. Please reload and try again.',
          409,
        );
      }

      if (dto.status === 'received') {
        const flipped = await tx.supplierRFQ.updateMany({
          where: { id: existing.supplierRfqId, status: 'reviewing' },
          data: { status: 'quoted' },
        });
        if (flipped.count === 0) {
          const fresh = await tx.supplierRFQ.findUnique({
            where: { id: existing.supplierRfqId },
            select: { status: true },
          });
          if (fresh?.status !== 'quoted') {
            throw new ApiException(
              'CONFLICT',
              'This supplier RFQ is no longer eligible to receive a supplier quotation.',
              409,
            );
          }
          // Another concurrent, legitimate flip already happened — still a valid state; fall
          // through and commit.
        }
      }

      return tx.supplierQuotation.findUniqueOrThrow({
        where: { id },
        include: DETAIL_INCLUDE,
      });
    });

    return toSupplierQuotation(updated);
  }

  private async getOrThrow(id: string) {
    const supplierQuotation = await this.prisma.supplierQuotation.findUnique({
      where: { id },
      include: DETAIL_INCLUDE,
    });
    if (!supplierQuotation) {
      throw new ApiException('NOT_FOUND', 'Supplier quotation not found.', 404);
    }
    return supplierQuotation;
  }

  /** `draft` is absent from every target list — creation always starts there and nothing
   * transitions back into it. No reopening a terminal status. */
  private assertValidStatusTransition(
    currentStatus: string,
    nextStatus: string,
  ): void {
    const allowed: Record<string, string[]> = {
      draft: ['received', 'cancelled'],
      received: ['under_review', 'cancelled'],
      under_review: ['selected', 'rejected', 'expired', 'cancelled'],
      selected: [],
      rejected: [],
      expired: [],
      cancelled: [],
    };
    if (!allowed[currentStatus]?.includes(nextStatus)) {
      throw new ApiException(
        'INVALID_STATE_TRANSITION',
        `Cannot change supplier quotation status from "${currentStatus}" to "${nextStatus}".`,
        409,
      );
    }
  }

  /** `SQT-YYYY-NNNNNN`, year-scoped sequence — same shape as every prior phase's own
   * generator. */
  private async generateSupplierQuotationNumber(): Promise<string> {
    const year = new Date().getUTCFullYear();
    const startOfYear = new Date(Date.UTC(year, 0, 1));
    const count = await this.prisma.supplierQuotation.count({
      where: { createdAt: { gte: startOfYear } },
    });
    const sequence = (count + 1).toString().padStart(6, '0');
    return `SQT-${year}-${sequence}`;
  }

  /** Application-layer supplier validation — duplicated identically from
   * SupplierRfqsService/PurchaseOrdersService rather than extracted into a shared module, per
   * this codebase's documented per-service convention. */
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

  private classifyUniqueViolation(error: unknown): UniqueViolationTarget {
    const err = error as {
      code?: string;
      meta?: {
        target?: string[];
        driverAdapterError?: { cause?: { originalCode?: string } };
      };
    };

    if (err.code === 'P2002') {
      return err.meta?.target?.includes('supplier_quotation_number') ||
        !err.meta?.target
        ? 'supplier_quotation_number'
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
