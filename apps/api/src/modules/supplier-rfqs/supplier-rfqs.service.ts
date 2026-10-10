import { Injectable } from '@nestjs/common';
import {
  buildPaginationMeta,
  parseSort,
} from '../../common/dto/pagination-query.dto';
import { ApiException } from '../../common/exceptions/api.exception';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateSupplierRfqDto } from './dto/create-supplier-rfq.dto';
import type { SupplierRfqQueryDto } from './dto/supplier-rfq-query.dto';
import type { UpdateSupplierRfqDto } from './dto/update-supplier-rfq.dto';
import { toSupplierRfq, type SupplierRfqSummary } from './supplier-rfqs.mapper';

const SORT_FIELD_MAP: Record<string, string> = {
  created_at: 'createdAt',
  supplier_rfq_number: 'supplierRfqNumber',
  status: 'status',
};

const SUPPLIER_COMPANY_SELECT = { id: true, name: true } as const;
const PRODUCT_SELECT = { id: true, name: true } as const;
const PURCHASE_REQUEST_SELECT = { id: true, requestNumber: true } as const;
const DETAIL_INCLUDE = {
  supplierCompany: { select: SUPPLIER_COMPANY_SELECT },
  purchaseRequest: { select: PURCHASE_REQUEST_SELECT },
  items: { include: { product: { select: PRODUCT_SELECT } } },
} as const;

// Only `approved`/`converted` PurchaseRequests may produce a SupplierRFQ (locked decision:
// "conversion harus dilakukan ketika PurchaseRequest approved"). `converted` is explicitly NOT
// terminal here — it only means "this PR has produced at least one SupplierRFQ already," never
// "this PR can never produce another" (one PR fans out into several SupplierRFQs, one per
// candidate supplier — same cardinality shape as Lead→Opportunity/RFQ→Quotation).
const ELIGIBLE_PURCHASE_REQUEST_STATUSES = ['approved', 'converted'] as const;

const MAX_SUPPLIER_RFQ_NUMBER_RETRY_ATTEMPTS = 3;

type UniqueViolationTarget = 'supplier_rfq_number' | 'ambiguous' | null;

@Injectable()
export class SupplierRfqsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: SupplierRfqQueryDto): Promise<{
    items: SupplierRfqSummary[];
    meta: ReturnType<typeof buildPaginationMeta>;
  }> {
    const { field, direction } = parseSort(query.sort);
    const orderField = SORT_FIELD_MAP[field] ?? 'createdAt';
    const q = query.q?.trim();

    const where = {
      ...(query.status !== undefined && { status: query.status }),
      ...(query.purchaseRequestId !== undefined && {
        purchaseRequestId: query.purchaseRequestId,
      }),
      ...(query.supplierCompanyId !== undefined && {
        supplierCompanyId: query.supplierCompanyId,
      }),
      ...(q && {
        OR: [
          {
            supplierRfqNumber: { contains: q, mode: 'insensitive' as const },
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
      this.prisma.supplierRFQ.findMany({
        where,
        include: {
          supplierCompany: { select: SUPPLIER_COMPANY_SELECT },
          _count: { select: { items: true } },
        },
        orderBy: { [orderField]: direction },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.supplierRFQ.count({ where }),
    ]);

    return {
      items: items.map(toSupplierRfq),
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  async findOne(id: string): Promise<SupplierRfqSummary> {
    return toSupplierRfq(await this.getOrThrow(id));
  }

  /** Atomic PurchaseRequest→SupplierRFQ conversion. One Prisma interactive transaction:
   * - Read the PurchaseRequest, validate eligibility.
   * - Validate the supplier: `supplierCompanyId` must resolve to a `Company` with an active
   *   `BusinessRelationship(relationshipType='supplier', status='active')` — never trusted
   *   from the client merely because the Company id exists.
   * - Copy every PurchaseRequestItem into a new SupplierRFQItem verbatim (productId/quantity/
   *   unit/specifications/notes) — no client override input exists for this endpoint at all;
   *   `productNameSnapshot` is the one exception, always re-derived from the live Product.
   * - If the PurchaseRequest was `approved`: conditionally flip
   *   `PurchaseRequest.status: approved → converted`. If the conditional update matches zero
   *   rows, a concurrent conversion already won that exact flip — re-read the PurchaseRequest;
   *   if it's now `converted`, this is still a legitimate additional SupplierRFQ and the
   *   transaction commits; any other observed status is a genuine, unexpected conflict and
   *   rolls back with a clean 409.
   * - If the PurchaseRequest was already `converted`: this PR has already produced at least
   *   one SupplierRFQ — not terminal. Create the SupplierRFQ and commit; PR's status is not
   *   touched again. No duplicate-prevention of any kind — one PR fanning into several
   *   SupplierRFQs (one per candidate supplier) is the intended shape. */
  async createFromPurchaseRequest(
    purchaseRequestId: string,
    dto: CreateSupplierRfqDto,
  ): Promise<SupplierRfqSummary> {
    for (let attempt = 1; ; attempt++) {
      const supplierRfqNumber = await this.generateSupplierRfqNumber();
      try {
        const supplierRfq = await this.prisma.$transaction(async (tx) => {
          const purchaseRequest = await tx.purchaseRequest.findUnique({
            where: { id: purchaseRequestId },
            include: { items: true },
          });
          if (!purchaseRequest) {
            throw new ApiException(
              'NOT_FOUND',
              'Purchase request not found.',
              404,
            );
          }
          if (
            !ELIGIBLE_PURCHASE_REQUEST_STATUSES.includes(
              purchaseRequest.status as 'approved' | 'converted',
            )
          ) {
            throw new ApiException(
              'INVALID_STATE_TRANSITION',
              `Cannot create a supplier RFQ from a purchase request with status "${purchaseRequest.status}".`,
              409,
            );
          }
          if (purchaseRequest.items.length === 0) {
            throw new ApiException(
              'VALIDATION_ERROR',
              'This purchase request has no items and cannot create a supplier RFQ.',
              400,
            );
          }

          await this.assertActiveSupplier(dto.supplierCompanyId);

          const products = await tx.product.findMany({
            where: {
              id: {
                in: purchaseRequest.items.map((item) => item.productId),
              },
            },
            select: { id: true, name: true },
          });
          const productById = new Map(
            products.map((product) => [product.id, product]),
          );

          const itemsData = purchaseRequest.items.map((item) => {
            const product = productById.get(item.productId);
            if (!product) {
              throw new ApiException(
                'VALIDATION_ERROR',
                `Product "${item.productId}" does not exist.`,
                400,
              );
            }
            return {
              productId: item.productId,
              // Always the live Product master at creation time — never the PurchaseRequest's
              // own (possibly null) snapshot.
              productNameSnapshot: product.name,
              quantity: item.quantity,
              unit: item.unit,
              specifications: item.specifications,
              notes: item.notes,
            };
          });

          const created = await tx.supplierRFQ.create({
            data: {
              supplierRfqNumber,
              purchaseRequestId: purchaseRequest.id,
              supplierCompanyId: dto.supplierCompanyId,
              status: 'draft',
              requestedAt: dto.requestedAt ? new Date(dto.requestedAt) : null,
              validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
              notes: dto.notes ?? null,
              items: { create: itemsData },
            },
            include: DETAIL_INCLUDE,
          });

          if (purchaseRequest.status === 'approved') {
            const { count } = await tx.purchaseRequest.updateMany({
              where: { id: purchaseRequestId, status: 'approved' },
              data: { status: 'converted' },
            });
            if (count === 0) {
              const fresh = await tx.purchaseRequest.findUnique({
                where: { id: purchaseRequestId },
                select: { status: true },
              });
              if (fresh?.status !== 'converted') {
                throw new ApiException(
                  'CONFLICT',
                  'This purchase request is no longer eligible to create a supplier RFQ.',
                  409,
                );
              }
              // Another concurrent, legitimate conversion already made this exact flip — this
              // SupplierRFQ is still valid; fall through and commit.
            }
          }
          // PurchaseRequest was already `converted` at the top of this function — not touched
          // again.

          return created;
        });

        return toSupplierRfq(supplierRfq);
      } catch (error) {
        if (error instanceof ApiException) {
          throw error;
        }

        const target = this.classifyUniqueViolation(error);
        if (
          (target === 'supplier_rfq_number' || target === 'ambiguous') &&
          attempt < MAX_SUPPLIER_RFQ_NUMBER_RETRY_ATTEMPTS
        ) {
          continue;
        }
        if (target !== null) {
          throw new ApiException(
            'CONFLICT',
            'Could not generate a unique supplier RFQ number. Please try again.',
            409,
          );
        }

        throw error;
      }
    }
  }

  async update(
    id: string,
    dto: UpdateSupplierRfqDto,
  ): Promise<SupplierRfqSummary> {
    const existing = await this.getOrThrow(id);

    if (dto.status !== undefined) {
      this.assertValidStatusTransition(existing.status, dto.status);
    }

    const updated = await this.prisma.supplierRFQ.update({
      where: { id },
      include: DETAIL_INCLUDE,
      data: {
        ...(dto.requestedAt !== undefined && {
          requestedAt: new Date(dto.requestedAt),
        }),
        ...(dto.validUntil !== undefined && {
          validUntil: new Date(dto.validUntil),
        }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
    });

    return toSupplierRfq(updated);
  }

  private async getOrThrow(id: string) {
    const supplierRfq = await this.prisma.supplierRFQ.findUnique({
      where: { id },
      include: DETAIL_INCLUDE,
    });
    if (!supplierRfq) {
      throw new ApiException('NOT_FOUND', 'Supplier RFQ not found.', 404);
    }
    return supplierRfq;
  }

  /** `quoted` is set only as the side-effect of a SupplierQuotation being created
   * (SupplierQuotationsService) — absent from `reviewing`'s own target list (and from
   * `UpdateSupplierRfqDto`'s `@IsIn`) so it is never directly settable through this PATCH. It
   * remains a valid FROM state (`quoted → reviewing/rejected/cancelled`), since more
   * SupplierQuotations may still arrive after the first one. No reopening a terminal status. */
  private assertValidStatusTransition(
    currentStatus: string,
    nextStatus: string,
  ): void {
    const allowed: Record<string, string[]> = {
      draft: ['sent', 'cancelled'],
      sent: ['reviewing', 'cancelled'],
      reviewing: ['rejected', 'cancelled'],
      quoted: ['reviewing', 'rejected', 'cancelled'],
      rejected: [],
      cancelled: [],
    };
    if (!allowed[currentStatus]?.includes(nextStatus)) {
      throw new ApiException(
        'INVALID_STATE_TRANSITION',
        `Cannot change supplier RFQ status from "${currentStatus}" to "${nextStatus}".`,
        409,
      );
    }
  }

  /** `SRFQ-YYYY-NNNNNN`, year-scoped sequence — same shape as every prior phase's own
   * generator. */
  private async generateSupplierRfqNumber(): Promise<string> {
    const year = new Date().getUTCFullYear();
    const startOfYear = new Date(Date.UTC(year, 0, 1));
    const count = await this.prisma.supplierRFQ.count({
      where: { createdAt: { gte: startOfYear } },
    });
    const sequence = (count + 1).toString().padStart(6, '0');
    return `SRFQ-${year}-${sequence}`;
  }

  /** Application-layer supplier validation (locked decision — no Supplier model, no new FK).
   * Reads via `this.prisma` rather than the enclosing transaction's `tx` — this is read-only
   * and never needs to see the transaction's own uncommitted writes, same reasoning as
   * RfqsService's `assertCompanyExists`. Duplicated identically in
   * SupplierQuotationsService/PurchaseOrdersService rather than extracted into a shared
   * module, per this codebase's documented per-service convention. */
  private async assertActiveSupplier(supplierCompanyId: string): Promise<void> {
    const company = await this.prisma.company.findUnique({
      where: { id: supplierCompanyId },
      select: { id: true },
    });
    if (!company) {
      throw new ApiException(
        'VALIDATION_ERROR',
        'The selected supplier company does not exist.',
        400,
        { fields: ['supplierCompanyId'] },
      );
    }

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
      return err.meta?.target?.includes('supplier_rfq_number') ||
        !err.meta?.target
        ? 'supplier_rfq_number'
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
