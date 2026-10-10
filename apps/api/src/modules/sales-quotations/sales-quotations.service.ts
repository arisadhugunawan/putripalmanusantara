import { Injectable } from '@nestjs/common';
import {
  buildPaginationMeta,
  parseSort,
} from '../../common/dto/pagination-query.dto';
import { ApiException } from '../../common/exceptions/api.exception';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateQuotationDto } from './dto/create-quotation.dto';
import type { QuotationQueryDto } from './dto/quotation-query.dto';
import type { UpdateQuotationDto } from './dto/update-quotation.dto';
import {
  calculateItemSubtotal,
  calculateQuotationTotals,
} from './quotation-pricing';
import { toQuotation, type QuotationSummary } from './quotation.mapper';

const SORT_FIELD_MAP: Record<string, string> = {
  created_at: 'createdAt',
  quotation_number: 'quotationNumber',
  status: 'status',
  quotation_date: 'quotationDate',
  total: 'total',
};

const COMPANY_SELECT = { id: true, name: true } as const;
const PRODUCT_SELECT = { id: true, name: true } as const;
const RFQ_SELECT = { id: true, rfqNumber: true } as const;
const DETAIL_INCLUDE = {
  company: { select: COMPANY_SELECT },
  rfq: { select: RFQ_SELECT },
  items: { include: { product: { select: PRODUCT_SELECT } } },
} as const;

// Only `reviewing`/`quoted` RFQs may produce a Quotation (locked decision 3). `quoted` is
// explicitly NOT terminal here — it only means "this RFQ has produced at least one Quotation
// already," never "this RFQ can never produce another" (locked decision 4/18, mirroring
// OpportunitiesService's own `qualified`/`converted` precedent).
const ELIGIBLE_RFQ_STATUSES = ['reviewing', 'quoted'] as const;

// Mirrors Inquiry/Lead/Opportunity/RFQ's own bound — a local, analogous helper per this
// codebase's documented "duplicate per-service rather than extract a shared util" convention.
const MAX_QUOTATION_NUMBER_RETRY_ATTEMPTS = 3;

type UniqueViolationTarget = 'quotation_number' | 'ambiguous' | null;

@Injectable()
export class SalesQuotationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QuotationQueryDto): Promise<{
    items: QuotationSummary[];
    meta: ReturnType<typeof buildPaginationMeta>;
  }> {
    const { field, direction } = parseSort(query.sort);
    const orderField = SORT_FIELD_MAP[field] ?? 'createdAt';
    const q = query.q?.trim();

    const where = {
      ...(query.status !== undefined && { status: query.status }),
      ...(query.companyId !== undefined && { companyId: query.companyId }),
      ...(query.rfqId !== undefined && { rfqId: query.rfqId }),
      ...(query.currency !== undefined && { currency: query.currency }),
      ...(q && {
        OR: [
          {
            quotationNumber: { contains: q, mode: 'insensitive' as const },
          },
          { company: { name: { contains: q, mode: 'insensitive' as const } } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.quotation.findMany({
        where,
        include: {
          company: { select: COMPANY_SELECT },
          _count: { select: { items: true } },
        },
        orderBy: { [orderField]: direction },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.quotation.count({ where }),
    ]);

    return {
      items: items.map(toQuotation),
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  async findOne(id: string): Promise<QuotationSummary> {
    return toQuotation(await this.getOrThrow(id));
  }

  /** Atomic RFQ→Quotation conversion (locked decision 4; item sourcing corrected per the Phase
   * 20 correction). One Prisma interactive transaction:
   * - Read the RFQ and validate eligibility.
   * - Read the RFQ's own `RFQItem` rows — they are the source of truth for which products may
   *   appear on the Quotation at all (correction §3/§6/§15/§16): a request item's `productId`
   *   is only ever used to find its matching `RFQItem`, never to admit an arbitrary product.
   *   An RFQ with no items can never produce a Quotation.
   * - Match each request item against an `RFQItem` of the same `productId`, consuming RFQItems
   *   in order so a product that appears more than once on the RFQ is matched one-to-one against
   *   distinct request items rather than silently merged (correction §7). `quantity`/`unit`/
   *   `specifications`/`notes` default from the matched RFQItem and the admin may override;
   *   `unit` still can't resolve to empty (RFQItem.unit may be null) — the request must supply
   *   one in that case (correction §4/§9). `productId`/`unitPrice`/`discount` are never sourced
   *   from the RFQItem (correction §3/§12/§13).
   * - Validate every referenced Product (guaranteed to exist by RFQItem's own FK, checked
   *   defensively anyway) and calculate Decimal-safe pricing, then create the Quotation +
   *   QuotationItems as one nested write.
   * - RFQ was `reviewing`: conditionally flip `RFQ.status: reviewing → quoted`. If the
   *   conditional update matches zero rows, a concurrent request already won that exact flip —
   *   re-read the RFQ; if it's now `quoted`, this is still a legitimate revision and the
   *   transaction commits; any other observed status is a genuine, unexpected conflict and
   *   rolls back with a clean 409.
   * - RFQ was already `quoted`: this RFQ has already produced at least one Quotation — per
   *   locked decision 18, that is NOT terminal. Create the Quotation and commit; RFQ's status
   *   is not touched at all. The Quotation itself always starts `draft` regardless of which
   *   path was taken — never auto-`sent`/`accepted` (locked decision 18). */
  async createFromRfq(
    rfqId: string,
    dto: CreateQuotationDto,
  ): Promise<QuotationSummary> {
    for (let attempt = 1; ; attempt++) {
      const quotationNumber = await this.generateQuotationNumber();
      try {
        const quotation = await this.prisma.$transaction(async (tx) => {
          const rfq = await tx.rFQ.findUnique({ where: { id: rfqId } });
          if (!rfq) {
            throw new ApiException('NOT_FOUND', 'RFQ not found.', 404);
          }
          if (
            !ELIGIBLE_RFQ_STATUSES.includes(
              rfq.status as 'reviewing' | 'quoted',
            )
          ) {
            throw new ApiException(
              'INVALID_STATE_TRANSITION',
              `Cannot create a quotation from an RFQ with status "${rfq.status}".`,
              409,
            );
          }

          const rfqItems = await tx.rFQItem.findMany({
            where: { rfqId },
            orderBy: { id: 'asc' },
          });
          if (rfqItems.length === 0) {
            throw new ApiException(
              'VALIDATION_ERROR',
              'This RFQ has no items and cannot create a quotation.',
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
                `Product "${item.productId}" is not part of this RFQ and cannot be added as a quotation item.`,
                400,
                { fields: ['items'] },
              );
            }
            const index = consumedCount.get(item.productId) ?? 0;
            const rfqItem = group[index];
            if (!rfqItem) {
              throw new ApiException(
                'VALIDATION_ERROR',
                `Too many quotation items were supplied for product "${item.productId}" — only ${group.length} RFQ item(s) exist for this product.`,
                400,
                { fields: ['items'] },
              );
            }
            consumedCount.set(item.productId, index + 1);

            const unit = item.unit ?? rfqItem.unit ?? undefined;
            if (!unit) {
              throw new ApiException(
                'VALIDATION_ERROR',
                `A unit is required for product "${item.productId}" — the matching RFQ item has no default unit.`,
                400,
                { fields: ['items'] },
              );
            }

            return {
              item,
              quantity: item.quantity ?? rfqItem.quantity.toNumber(),
              unit,
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

          // Server calculates every item subtotal and the quotation subtotal/total — client-
          // supplied values for these are never authoritative (locked decision 14).
          const itemCalculations = matchedItems.map((matched) => {
            // Guaranteed to exist — RFQItem.productId has a Restrict FK to Product — checked
            // defensively anyway so a raw Prisma/Postgres error can never leak.
            const product = productById.get(matched.item.productId);
            if (!product) {
              throw new ApiException(
                'VALIDATION_ERROR',
                `Product "${matched.item.productId}" does not exist.`,
                400,
                { fields: ['items'] },
              );
            }

            const subtotal = calculateItemSubtotal(
              matched.quantity,
              matched.item.unitPrice,
              matched.item.discount,
            );
            if (subtotal.isNegative()) {
              throw new ApiException(
                'VALIDATION_ERROR',
                `Item discount cannot exceed quantity × unit price for product "${matched.item.productId}".`,
                400,
                { fields: ['items'] },
              );
            }
            return { ...matched, productNameSnapshot: product.name, subtotal };
          });

          const { subtotal, total } = calculateQuotationTotals(
            itemCalculations.map((calc) => calc.subtotal),
            dto.discount,
            dto.shippingCost,
          );
          if (total.isNegative()) {
            throw new ApiException(
              'VALIDATION_ERROR',
              'Discount cannot exceed subtotal plus shipping cost.',
              400,
              { fields: ['discount', 'shippingCost'] },
            );
          }

          const created = await tx.quotation.create({
            data: {
              quotationNumber,
              rfqId: rfq.id,
              // Always derived from the RFQ server-side — never accepted from the client
              // (locked decision 10).
              companyId: rfq.companyId,
              status: 'draft',
              quotationDate: dto.quotationDate
                ? new Date(dto.quotationDate)
                : new Date(),
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
                  // Always the live Product master at creation time — never trusted from the
                  // RFQItem's own (possibly null) snapshot (locked decision 12).
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

          if (rfq.status === 'reviewing') {
            const { count } = await tx.rFQ.updateMany({
              where: { id: rfqId, status: 'reviewing' },
              data: { status: 'quoted' },
            });
            if (count === 0) {
              const fresh = await tx.rFQ.findUnique({
                where: { id: rfqId },
                select: { status: true },
              });
              if (fresh?.status !== 'quoted') {
                throw new ApiException(
                  'CONFLICT',
                  'This RFQ is no longer eligible to create a quotation.',
                  409,
                );
              }
              // Another concurrent, legitimate transition already made this exact flip — this
              // Quotation is still a valid revision; fall through and commit.
            }
          }
          // RFQ was already `quoted` at the top of this function — not touched again.

          return created;
        });

        return toQuotation(quotation);
      } catch (error) {
        if (error instanceof ApiException) {
          throw error;
        }

        const target = this.classifyUniqueViolation(error);
        if (
          (target === 'quotation_number' || target === 'ambiguous') &&
          attempt < MAX_QUOTATION_NUMBER_RETRY_ATTEMPTS
        ) {
          continue;
        }
        if (target !== null) {
          throw new ApiException(
            'CONFLICT',
            'Could not generate a unique quotation number. Please try again.',
            409,
          );
        }

        throw error;
      }
    }
  }

  /** Draft-vs-non-draft field locking (locked decision 19). While `draft`, pricing/validity
   * fields remain editable and `total` is recalculated server-side whenever `discount`/
   * `shippingCost` change — client-supplied totals are never authoritative (locked decision
   * 14). Once the status has left `draft`, those fields are locked; only `notes` and a valid
   * lifecycle transition remain editable. */
  async update(id: string, dto: UpdateQuotationDto): Promise<QuotationSummary> {
    const existing = await this.getOrThrow(id);

    if (dto.status !== undefined) {
      this.assertValidStatusTransition(existing.status, dto.status);
    }

    const lockedFields: Array<keyof UpdateQuotationDto> = [
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
          `Cannot edit ${touchedLockedFields.join(', ')} once the quotation has left draft status.`,
          400,
          { fields: touchedLockedFields },
        );
      }
    }

    let total: Prisma.Decimal | undefined;
    if (dto.discount !== undefined || dto.shippingCost !== undefined) {
      const discount =
        dto.discount !== undefined ? dto.discount : (existing.discount ?? 0);
      const shippingCost =
        dto.shippingCost !== undefined
          ? dto.shippingCost
          : (existing.shippingCost ?? 0);
      total = existing.subtotal
        .sub(new Prisma.Decimal(discount))
        .add(new Prisma.Decimal(shippingCost));
      if (total.isNegative()) {
        throw new ApiException(
          'VALIDATION_ERROR',
          'Discount cannot exceed subtotal plus shipping cost.',
          400,
          { fields: ['discount', 'shippingCost'] },
        );
      }
    }

    const data = {
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
    };

    // Accepted-quotation sibling uniqueness (Phase 21 correction §6): only one Quotation per
    // RFQ may be `accepted` at a time. Checked inside the same transaction as the write so the
    // check and the write observe a consistent view, though this is a best-effort guard, not a
    // database-enforced one — see Phase 21's Known Limitations for why two exactly-concurrent
    // accept requests for different siblings of the same RFQ aren't fully race-proof without a
    // schema-level partial unique constraint (explicitly out of scope — no migration).
    if (dto.status === 'accepted') {
      const updated = await this.prisma.$transaction(async (tx) => {
        const sibling = await tx.quotation.findFirst({
          where: { rfqId: existing.rfqId, status: 'accepted', id: { not: id } },
          select: { id: true },
        });
        if (sibling) {
          throw new ApiException(
            'CONFLICT',
            'Another quotation for this RFQ is already accepted.',
            409,
          );
        }
        return tx.quotation.update({
          where: { id },
          include: DETAIL_INCLUDE,
          data,
        });
      });

      return toQuotation(updated);
    }

    const updated = await this.prisma.quotation.update({
      where: { id },
      include: DETAIL_INCLUDE,
      data,
    });

    return toQuotation(updated);
  }

  private async getOrThrow(id: string) {
    const quotation = await this.prisma.quotation.findUnique({
      where: { id },
      include: DETAIL_INCLUDE,
    });
    if (!quotation) {
      throw new ApiException('NOT_FOUND', 'Quotation not found.', 404);
    }
    return quotation;
  }

  /** `draft` is deliberately absent from every target list — nothing transitions back into it;
   * a revision is a brand-new Quotation row instead (locked decision 20). No reopening a
   * terminal status. */
  private assertValidStatusTransition(
    currentStatus: string,
    nextStatus: string,
  ): void {
    const allowed: Record<string, string[]> = {
      draft: ['sent', 'cancelled'],
      sent: ['accepted', 'rejected', 'expired', 'cancelled'],
      accepted: [],
      rejected: [],
      expired: [],
      cancelled: [],
    };
    if (!allowed[currentStatus]?.includes(nextStatus)) {
      throw new ApiException(
        'INVALID_STATE_TRANSITION',
        `Cannot change quotation status from "${currentStatus}" to "${nextStatus}".`,
        409,
      );
    }
  }

  /** `QT-YYYY-NNNNNN`, year-scoped sequence — same shape as every prior CRM phase's own
   * generator, deliberately re-implemented locally rather than a shared abstraction, per this
   * codebase's established per-service convention. */
  private async generateQuotationNumber(): Promise<string> {
    const year = new Date().getUTCFullYear();
    const startOfYear = new Date(Date.UTC(year, 0, 1));
    const count = await this.prisma.quotation.count({
      where: { createdAt: { gte: startOfYear } },
    });
    const sequence = (count + 1).toString().padStart(6, '0');
    return `QT-${year}-${sequence}`;
  }

  /** Same detection shape as every prior CRM phase's service — Prisma 7's driver-adapter can
   * surface a unique violation either as `P2002` (with `meta.target` naming the column) or as
   * the generic unmapped `P2039`, with the real Postgres SQLSTATE (`23505` = `unique_violation`)
   * at `meta.driverAdapterError.cause.originalCode`. Only `quotationNumber` is a live unique
   * constraint here. */
  private classifyUniqueViolation(error: unknown): UniqueViolationTarget {
    const err = error as {
      code?: string;
      meta?: {
        target?: string[];
        driverAdapterError?: { cause?: { originalCode?: string } };
      };
    };

    if (err.code === 'P2002') {
      return err.meta?.target?.includes('quotation_number') || !err.meta?.target
        ? 'quotation_number'
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
