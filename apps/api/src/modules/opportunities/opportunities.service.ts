import { Injectable } from '@nestjs/common';
import {
  buildPaginationMeta,
  parseSort,
} from '../../common/dto/pagination-query.dto';
import { ApiException } from '../../common/exceptions/api.exception';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateOpportunityDto } from './dto/create-opportunity.dto';
import type { OpportunityQueryDto } from './dto/opportunity-query.dto';
import type { UpdateOpportunityDto } from './dto/update-opportunity.dto';
import { toOpportunity, type OpportunitySummary } from './opportunity.mapper';

const SORT_FIELD_MAP: Record<string, string> = {
  created_at: 'createdAt',
  opportunity_number: 'opportunityNumber',
  stage: 'stage',
  expected_close_date: 'expectedCloseDate',
  estimated_value: 'estimatedValue',
};

const COMPANY_SELECT = { id: true, name: true } as const;
const SOURCE_INQUIRY_SELECT = {
  id: true,
  inquiryNumber: true,
  contactName: true,
  email: true,
  phone: true,
  companyName: true,
} as const;
const LEAD_SELECT = {
  id: true,
  leadNumber: true,
  ownerId: true,
  ownerName: true,
  sourceInquiry: { select: SOURCE_INQUIRY_SELECT },
} as const;

// Only `qualified`/`converted` Leads may produce an Opportunity (locked decision 3). `converted`
// is explicitly NOT terminal here — it only means "this Lead has produced at least one
// Opportunity already," never "this Lead can never produce another" (locked decision 4/5).
const ELIGIBLE_LEAD_STATUSES = ['qualified', 'converted'] as const;

// Mirrors InquiriesService/LeadsService's own bound — a local, analogous helper per this
// codebase's documented "duplicate per-service rather than extract a shared util" convention.
const MAX_OPPORTUNITY_NUMBER_RETRY_ATTEMPTS = 3;

type UniqueViolationTarget = 'opportunity_number' | 'ambiguous' | null;

@Injectable()
export class OpportunitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: OpportunityQueryDto): Promise<{
    items: OpportunitySummary[];
    meta: ReturnType<typeof buildPaginationMeta>;
  }> {
    const { field, direction } = parseSort(query.sort);
    const orderField = SORT_FIELD_MAP[field] ?? 'createdAt';
    const q = query.q?.trim();

    const where = {
      ...(query.stage !== undefined && { stage: query.stage }),
      ...(query.companyId !== undefined && { companyId: query.companyId }),
      ...(query.leadId !== undefined && { leadId: query.leadId }),
      ...(query.ownerId !== undefined && { ownerId: query.ownerId }),
      ...(q && {
        OR: [
          { opportunityNumber: { contains: q, mode: 'insensitive' as const } },
          { name: { contains: q, mode: 'insensitive' as const } },
          { ownerName: { contains: q, mode: 'insensitive' as const } },
          { company: { name: { contains: q, mode: 'insensitive' as const } } },
          {
            lead: { leadNumber: { contains: q, mode: 'insensitive' as const } },
          },
          {
            lead: {
              sourceInquiry: {
                companyName: { contains: q, mode: 'insensitive' as const },
              },
            },
          },
          {
            lead: {
              sourceInquiry: {
                contactName: { contains: q, mode: 'insensitive' as const },
              },
            },
          },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.opportunity.findMany({
        where,
        include: { company: { select: COMPANY_SELECT } },
        orderBy: { [orderField]: direction },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.opportunity.count({ where }),
    ]);

    return {
      items: items.map(toOpportunity),
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  async findOne(id: string): Promise<OpportunitySummary> {
    return toOpportunity(await this.getOrThrow(id));
  }

  /** Atomic Lead→Opportunity conversion (locked decision 5). Two distinct paths, both inside
   * one Prisma interactive transaction:
   * - Lead is `qualified`: create the Opportunity, then conditionally flip
   *   `Lead.status: qualified → converted`. If the conditional update matches zero rows, a
   *   concurrent request already won that exact flip — re-read the Lead; if it's now
   *   `converted`, this is still a legitimate second Opportunity and the transaction commits;
   *   any other observed status is a genuine, unexpected conflict and rolls back.
   * - Lead is already `converted`: this Lead has already produced at least one Opportunity —
   *   per locked decision 4, that is NOT terminal. Create the Opportunity and commit; Lead's
   *   status is not touched at all. */
  async createFromLead(
    leadId: string,
    dto: CreateOpportunityDto,
  ): Promise<OpportunitySummary> {
    for (let attempt = 1; ; attempt++) {
      const opportunityNumber = await this.generateOpportunityNumber();
      try {
        const opportunity = await this.prisma.$transaction(async (tx) => {
          const lead = await tx.lead.findUnique({ where: { id: leadId } });
          if (!lead) {
            throw new ApiException('NOT_FOUND', 'Lead not found.', 404);
          }
          if (
            !ELIGIBLE_LEAD_STATUSES.includes(
              lead.status as 'qualified' | 'converted',
            )
          ) {
            throw new ApiException(
              'INVALID_STATE_TRANSITION',
              `Cannot create an opportunity from a lead with status "${lead.status}".`,
              409,
            );
          }

          const created = await tx.opportunity.create({
            data: {
              opportunityNumber,
              leadId: lead.id,
              companyId: lead.companyId,
              name: dto.name,
              stage: 'prospecting',
              estimatedValue: dto.estimatedValue ?? null,
              currency: dto.currency ?? null,
              expectedCloseDate: dto.expectedCloseDate
                ? new Date(dto.expectedCloseDate)
                : null,
              ownerId: lead.ownerId,
              ownerName: lead.ownerName,
            },
            include: {
              company: { select: COMPANY_SELECT },
              lead: { select: LEAD_SELECT },
            },
          });

          if (lead.status === 'qualified') {
            const { count } = await tx.lead.updateMany({
              where: { id: leadId, status: 'qualified' },
              data: { status: 'converted' },
            });
            if (count === 0) {
              const fresh = await tx.lead.findUnique({
                where: { id: leadId },
                select: { status: true },
              });
              if (fresh?.status !== 'converted') {
                throw new ApiException(
                  'CONFLICT',
                  'This lead is no longer eligible to create an opportunity.',
                  409,
                );
              }
              // Another concurrent, legitimate conversion already made this exact flip —
              // this Opportunity is still valid; fall through and commit.
            }
          }
          // Lead was already `converted` at the top of this function — not touched again.

          return created;
        });

        return toOpportunity(opportunity);
      } catch (error) {
        if (error instanceof ApiException) {
          throw error;
        }

        const target = this.classifyUniqueViolation(error);
        if (
          (target === 'opportunity_number' || target === 'ambiguous') &&
          attempt < MAX_OPPORTUNITY_NUMBER_RETRY_ATTEMPTS
        ) {
          continue;
        }
        if (target !== null) {
          throw new ApiException(
            'CONFLICT',
            'Could not generate a unique opportunity number. Please try again.',
            409,
          );
        }

        throw error;
      }
    }
  }

  async update(
    id: string,
    dto: UpdateOpportunityDto,
  ): Promise<OpportunitySummary> {
    const existing = await this.getOrThrow(id);

    if (dto.stage !== undefined) {
      this.assertValidStageTransition(existing.stage, dto.stage);
    }

    const updated = await this.prisma.opportunity.update({
      where: { id },
      include: {
        company: { select: COMPANY_SELECT },
        lead: { select: LEAD_SELECT },
      },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.stage !== undefined && { stage: dto.stage }),
        ...(dto.estimatedValue !== undefined && {
          estimatedValue: dto.estimatedValue,
        }),
        ...(dto.currency !== undefined && { currency: dto.currency }),
        ...(dto.expectedCloseDate !== undefined && {
          expectedCloseDate: new Date(dto.expectedCloseDate),
        }),
        ...(dto.ownerId !== undefined && { ownerId: dto.ownerId }),
        ...(dto.ownerName !== undefined && { ownerName: dto.ownerName }),
      },
    });

    return toOpportunity(updated);
  }

  private async getOrThrow(id: string) {
    const opportunity = await this.prisma.opportunity.findUnique({
      where: { id },
      include: {
        company: { select: COMPANY_SELECT },
        lead: { select: LEAD_SELECT },
      },
    });
    if (!opportunity) {
      throw new ApiException('NOT_FOUND', 'Opportunity not found.', 404);
    }
    return opportunity;
  }

  /** No backward transitions, `won`/`lost` terminal — a `lost` Opportunity is never reopened;
   * a genuinely new sales opportunity gets a fresh row via `createFromLead` instead (locked
   * decision 12). */
  private assertValidStageTransition(
    currentStage: string,
    nextStage: string,
  ): void {
    const allowed: Record<string, string[]> = {
      prospecting: ['qualification', 'lost'],
      qualification: ['proposal', 'lost'],
      proposal: ['negotiation', 'lost'],
      negotiation: ['won', 'lost'],
      won: [],
      lost: [],
    };
    if (!allowed[currentStage]?.includes(nextStage)) {
      throw new ApiException(
        'INVALID_STATE_TRANSITION',
        `Cannot change opportunity stage from "${currentStage}" to "${nextStage}".`,
        409,
      );
    }
  }

  /** `OPP-YYYY-NNNNNN`, year-scoped sequence — same shape as `InquiriesService`/
   * `LeadsService`'s own generators, deliberately re-implemented locally per this codebase's
   * established per-service convention rather than a shared abstraction. */
  private async generateOpportunityNumber(): Promise<string> {
    const year = new Date().getUTCFullYear();
    const startOfYear = new Date(Date.UTC(year, 0, 1));
    const count = await this.prisma.opportunity.count({
      where: { createdAt: { gte: startOfYear } },
    });
    const sequence = (count + 1).toString().padStart(6, '0');
    return `OPP-${year}-${sequence}`;
  }

  /** Same detection shape as `InquiriesService`/`LeadsService` — Prisma 7's driver-adapter can
   * surface a unique violation either as `P2002` (with `meta.target` naming the column) or as
   * the generic unmapped `P2039`, with the real Postgres SQLSTATE (`23505` = `unique_violation`)
   * at `meta.driverAdapterError.cause.originalCode`. Only `opportunityNumber` is a live unique
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
      return err.meta?.target?.includes('opportunity_number') ||
        !err.meta?.target
        ? 'opportunity_number'
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
