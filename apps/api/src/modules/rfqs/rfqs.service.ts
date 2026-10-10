import { Injectable } from '@nestjs/common';
import {
  buildPaginationMeta,
  parseSort,
} from '../../common/dto/pagination-query.dto';
import { ApiException } from '../../common/exceptions/api.exception';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateRfqDto, CreateRfqItemDto } from './dto/create-rfq.dto';
import type { RfqQueryDto } from './dto/rfq-query.dto';
import type { UpdateRfqDto } from './dto/update-rfq.dto';
import { toRfq, type RfqSummary } from './rfq.mapper';

const SORT_FIELD_MAP: Record<string, string> = {
  created_at: 'createdAt',
  rfq_number: 'rfqNumber',
  status: 'status',
};

const COMPANY_SELECT = { id: true, name: true } as const;
const PRODUCT_SELECT = { id: true, name: true } as const;
const OPPORTUNITY_SELECT = {
  id: true,
  opportunityNumber: true,
  name: true,
} as const;
const DETAIL_INCLUDE = {
  company: { select: COMPANY_SELECT },
  opportunity: { select: OPPORTUNITY_SELECT },
  items: { include: { product: { select: PRODUCT_SELECT } } },
} as const;

// Opportunity.won means CRM negotiation succeeded (Phase 18D); `proposal`/`negotiation` are
// also eligible since an RFQ is often the mechanism that drives a serious negotiation forward.
// `prospecting`/`qualification` are too early for a formal price request; `lost` is terminal.
const ELIGIBLE_OPPORTUNITY_STAGES = ['proposal', 'negotiation', 'won'] as const;

// Mirrors Inquiry/Lead/Opportunity's own bound — a local, analogous helper per this codebase's
// documented "duplicate per-service rather than extract a shared util" convention.
const MAX_RFQ_NUMBER_RETRY_ATTEMPTS = 3;

type UniqueViolationTarget = 'rfq_number' | 'ambiguous' | null;

interface ResolvedCreateInput {
  companyId: string;
  opportunityId: string | null;
  items: CreateRfqItemDto[];
  requestedAt?: string;
  validUntil?: string;
  notes?: string;
}

@Injectable()
export class RfqsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: RfqQueryDto): Promise<{
    items: RfqSummary[];
    meta: ReturnType<typeof buildPaginationMeta>;
  }> {
    const { field, direction } = parseSort(query.sort);
    const orderField = SORT_FIELD_MAP[field] ?? 'createdAt';
    const q = query.q?.trim();

    const where = {
      ...(query.status !== undefined && { status: query.status }),
      ...(query.companyId !== undefined && { companyId: query.companyId }),
      ...(query.opportunityId !== undefined && {
        opportunityId: query.opportunityId,
      }),
      ...(q && {
        OR: [
          { rfqNumber: { contains: q, mode: 'insensitive' as const } },
          { company: { name: { contains: q, mode: 'insensitive' as const } } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.rFQ.findMany({
        where,
        include: {
          company: { select: COMPANY_SELECT },
          _count: { select: { items: true } },
        },
        orderBy: { [orderField]: direction },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.rFQ.count({ where }),
    ]);

    return {
      items: items.map(toRfq),
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  async findOne(id: string): Promise<RfqSummary> {
    return toRfq(await this.getOrThrow(id));
  }

  /** Standalone creation (locked decision 2). `companyId` is required here (checked explicitly,
   * never left to a raw DB NOT NULL error) and `opportunityId` is always `null`. */
  async createStandalone(dto: CreateRfqDto): Promise<RfqSummary> {
    if (!dto.companyId) {
      throw new ApiException(
        'VALIDATION_ERROR',
        'companyId is required.',
        400,
        {
          fields: ['companyId'],
        },
      );
    }
    await this.assertCompanyExists(dto.companyId);

    return this.createWithRetry({
      companyId: dto.companyId,
      opportunityId: null,
      items: dto.items,
      requestedAt: dto.requestedAt,
      validUntil: dto.validUntil,
      notes: dto.notes,
    });
  }

  /** From-Opportunity creation (locked decision 2). `companyId` is always derived server-side
   * from the Opportunity — any `companyId` on the request body is never read here, so it can
   * never override the derived value. Does not touch `Opportunity.stage` at all — no stage
   * value is defined in terms of "has an RFQ," unlike `LeadStatus.converted`. */
  async createFromOpportunity(
    opportunityId: string,
    dto: CreateRfqDto,
  ): Promise<RfqSummary> {
    const opportunity = await this.prisma.opportunity.findUnique({
      where: { id: opportunityId },
    });
    if (!opportunity) {
      throw new ApiException('NOT_FOUND', 'Opportunity not found.', 404);
    }
    if (
      !ELIGIBLE_OPPORTUNITY_STAGES.includes(
        opportunity.stage as 'proposal' | 'negotiation' | 'won',
      )
    ) {
      throw new ApiException(
        'INVALID_STATE_TRANSITION',
        `Cannot create an RFQ from an opportunity with stage "${opportunity.stage}".`,
        409,
      );
    }
    if (!opportunity.companyId) {
      throw new ApiException(
        'CONFLICT',
        'This opportunity has no company assigned and cannot create an RFQ.',
        409,
      );
    }

    return this.createWithRetry({
      companyId: opportunity.companyId,
      opportunityId: opportunity.id,
      items: dto.items,
      requestedAt: dto.requestedAt,
      validUntil: dto.validUntil,
      notes: dto.notes,
    });
  }

  async update(id: string, dto: UpdateRfqDto): Promise<RfqSummary> {
    const existing = await this.getOrThrow(id);

    if (dto.status !== undefined) {
      this.assertValidStatusTransition(existing.status, dto.status);
    }

    const updated = await this.prisma.rFQ.update({
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

    return toRfq(updated);
  }

  private async getOrThrow(id: string) {
    const rfq = await this.prisma.rFQ.findUnique({
      where: { id },
      include: DETAIL_INCLUDE,
    });
    if (!rfq) {
      throw new ApiException('NOT_FOUND', 'RFQ not found.', 404);
    }
    return rfq;
  }

  private async assertCompanyExists(companyId: string): Promise<void> {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true },
    });
    if (!company) {
      throw new ApiException(
        'VALIDATION_ERROR',
        'The selected company does not exist.',
        400,
        { fields: ['companyId'] },
      );
    }
  }

  /** `quoted` is deliberately absent — reserved for the future Quotation phase, never settable
   * through this PATCH (locked decision 5). No backward transitions, no reopening a terminal
   * status. */
  private assertValidStatusTransition(
    currentStatus: string,
    nextStatus: string,
  ): void {
    const allowed: Record<string, string[]> = {
      draft: ['submitted', 'cancelled'],
      submitted: ['reviewing', 'cancelled'],
      reviewing: ['rejected', 'cancelled'],
      quoted: [],
      rejected: [],
      cancelled: [],
    };
    if (!allowed[currentStatus]?.includes(nextStatus)) {
      throw new ApiException(
        'INVALID_STATE_TRANSITION',
        `Cannot change RFQ status from "${currentStatus}" to "${nextStatus}".`,
        409,
      );
    }
  }

  /** `RFQ-YYYY-NNNNNN`, year-scoped sequence — same shape as `InquiriesService`/
   * `LeadsService`/`OpportunitiesService`'s own generators, deliberately re-implemented locally
   * rather than a shared abstraction, per this codebase's established per-service convention. */
  private async generateRfqNumber(): Promise<string> {
    const year = new Date().getUTCFullYear();
    const startOfYear = new Date(Date.UTC(year, 0, 1));
    const count = await this.prisma.rFQ.count({
      where: { createdAt: { gte: startOfYear } },
    });
    const sequence = (count + 1).toString().padStart(6, '0');
    return `RFQ-${year}-${sequence}`;
  }

  /** Validates every item's Product inside the same transaction as the create (never trusting
   * a client-supplied product name), then creates the RFQ and all RFQItems as one nested
   * Prisma write — atomic by construction: if any item fails validation, nothing is created at
   * all; there is no partial RFQ. No conditional-update race exists here (unlike Inquiry→Lead/
   * Lead→Opportunity) because this never touches Opportunity state — the transaction exists
   * only for the RFQ+items atomicity, not for any concurrency guard. */
  private async createWithRetry(
    input: ResolvedCreateInput,
  ): Promise<RfqSummary> {
    for (let attempt = 1; ; attempt++) {
      const rfqNumber = await this.generateRfqNumber();
      try {
        const rfq = await this.prisma.$transaction(async (tx) => {
          const products = await tx.product.findMany({
            where: { id: { in: input.items.map((item) => item.productId) } },
            select: { id: true, name: true },
          });
          const productNameById = new Map(
            products.map((product) => [product.id, product.name]),
          );

          for (const item of input.items) {
            if (!productNameById.has(item.productId)) {
              throw new ApiException(
                'VALIDATION_ERROR',
                `Product "${item.productId}" does not exist.`,
                400,
                { fields: ['items'] },
              );
            }
          }

          return tx.rFQ.create({
            data: {
              rfqNumber,
              companyId: input.companyId,
              opportunityId: input.opportunityId,
              status: 'draft',
              requestedAt: input.requestedAt
                ? new Date(input.requestedAt)
                : null,
              validUntil: input.validUntil ? new Date(input.validUntil) : null,
              notes: input.notes ?? null,
              items: {
                create: input.items.map((item) => ({
                  productId: item.productId,
                  // Always the live Product master at creation time — never a client-supplied
                  // name (locked decision 8).
                  productNameSnapshot: productNameById.get(item.productId),
                  quantity: item.quantity,
                  unit: item.unit ?? null,
                  requestedDeliveryDate: item.requestedDeliveryDate
                    ? new Date(item.requestedDeliveryDate)
                    : null,
                  specifications: item.specifications ?? null,
                  notes: item.notes ?? null,
                })),
              },
            },
            include: DETAIL_INCLUDE,
          });
        });

        return toRfq(rfq);
      } catch (error) {
        if (error instanceof ApiException) {
          throw error;
        }

        const target = this.classifyUniqueViolation(error);
        if (
          (target === 'rfq_number' || target === 'ambiguous') &&
          attempt < MAX_RFQ_NUMBER_RETRY_ATTEMPTS
        ) {
          continue;
        }
        if (target !== null) {
          throw new ApiException(
            'CONFLICT',
            'Could not generate a unique RFQ number. Please try again.',
            409,
          );
        }

        throw error;
      }
    }
  }

  /** Same detection shape as `InquiriesService`/`LeadsService`/`OpportunitiesService` —
   * Prisma 7's driver-adapter can surface a unique violation either as `P2002` (with
   * `meta.target` naming the column) or as the generic unmapped `P2039`, with the real Postgres
   * SQLSTATE (`23505` = `unique_violation`) at `meta.driverAdapterError.cause.originalCode`.
   * Only `rfqNumber` is a live unique constraint here. */
  private classifyUniqueViolation(error: unknown): UniqueViolationTarget {
    const err = error as {
      code?: string;
      meta?: {
        target?: string[];
        driverAdapterError?: { cause?: { originalCode?: string } };
      };
    };

    if (err.code === 'P2002') {
      return err.meta?.target?.includes('rfq_number') || !err.meta?.target
        ? 'rfq_number'
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
