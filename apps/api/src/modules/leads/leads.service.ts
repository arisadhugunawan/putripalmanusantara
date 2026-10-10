import { Injectable } from '@nestjs/common';
import {
  buildPaginationMeta,
  parseSort,
} from '../../common/dto/pagination-query.dto';
import { ApiException } from '../../common/exceptions/api.exception';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateLeadDto } from './dto/create-lead.dto';
import type { LeadQueryDto } from './dto/lead-query.dto';
import type { UpdateLeadDto } from './dto/update-lead.dto';
import { toLead, type LeadSummary } from './lead.mapper';

const SORT_FIELD_MAP: Record<string, string> = {
  created_at: 'createdAt',
  status: 'status',
  lead_number: 'leadNumber',
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

// A Lead "in progress" for a given Inquiry — the duplicate-active-lead rule (locked decision
// 1.3) blocks a new conversion while one of these exists, but allows one once every existing
// Lead from that Inquiry has reached a terminal state.
const ACTIVE_LEAD_STATUSES = ['new', 'contacted', 'qualified'] as const;
const ELIGIBLE_INQUIRY_STATUSES = ['new', 'contacted'] as const;

// Mirrors InquiriesService's MAX_INQUIRY_NUMBER_RETRY_ATTEMPTS — a local, analogous helper per
// this codebase's documented "duplicate per-service rather than extract a shared util"
// convention, not a copy-paste of the Inquiry generator (which is tightly coupled to
// `prisma.inquiry` and the `INQ-` prefix).
const MAX_LEAD_NUMBER_RETRY_ATTEMPTS = 3;

const DUPLICATE_ACTIVE_LEAD_MESSAGE =
  'This inquiry already has an active lead in progress.';
const CONCURRENT_CONVERSION_MESSAGE =
  'This inquiry was already converted by another request.';

type UniqueViolationTarget = 'lead_number' | 'ambiguous' | null;

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: LeadQueryDto): Promise<{
    items: LeadSummary[];
    meta: ReturnType<typeof buildPaginationMeta>;
  }> {
    const { field, direction } = parseSort(query.sort);
    const orderField = SORT_FIELD_MAP[field] ?? 'createdAt';
    const q = query.q?.trim();

    const where = {
      ...(query.status !== undefined && { status: query.status }),
      ...(query.companyId !== undefined && { companyId: query.companyId }),
      ...(query.ownerId !== undefined && { ownerId: query.ownerId }),
      ...(q && {
        OR: [
          { leadNumber: { contains: q, mode: 'insensitive' as const } },
          { ownerName: { contains: q, mode: 'insensitive' as const } },
          { company: { name: { contains: q, mode: 'insensitive' as const } } },
          {
            sourceInquiry: {
              companyName: { contains: q, mode: 'insensitive' as const },
            },
          },
          {
            sourceInquiry: {
              contactName: { contains: q, mode: 'insensitive' as const },
            },
          },
          {
            sourceInquiry: {
              email: { contains: q, mode: 'insensitive' as const },
            },
          },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        include: { company: { select: COMPANY_SELECT } },
        orderBy: { [orderField]: direction },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.lead.count({ where }),
    ]);

    return {
      items: items.map(toLead),
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  async findOne(id: string): Promise<LeadSummary> {
    return toLead(await this.getOrThrow(id));
  }

  /** Direct creation (Jalur A — phone call, WhatsApp, referral, trade fair, prospecting). Every
   * server-owned field is forced here, never accepted from the client: `status` always `new`,
   * `ownerId`/`ownerName` always `null` (owner is assigned later via PATCH, never at creation —
   * locked decision 1.5 applies to both creation paths), `sourceInquiryId`/
   * `sourceQuotationRequestId` always `null` (this path has no Inquiry to attribute to). */
  async create(dto: CreateLeadDto): Promise<LeadSummary> {
    if (dto.companyId) {
      await this.assertCompanyExists(dto.companyId);
    }

    return this.createWithRetry({
      companyId: dto.companyId ?? null,
      sourceInquiryId: null,
      sourceQuotationRequestId: null,
    });
  }

  /** Jalur B — the atomic Inquiry→Lead conversion (locked decision 1.13). Everything from
   * reading the Inquiry through the conditional status update happens inside one Prisma
   * interactive transaction, retried as a whole on a `leadNumber` collision — a failed attempt
   * (including the application-thrown `ApiException`s for an ineligible Inquiry or a
   * duplicate-active-lead) rolls back entirely, so there is never a state where the Lead exists
   * but the Inquiry wasn't actually converted, or vice versa. */
  async createFromInquiry(inquiryId: string): Promise<LeadSummary> {
    for (let attempt = 1; ; attempt++) {
      const leadNumber = await this.generateLeadNumber();
      try {
        const lead = await this.prisma.$transaction(async (tx) => {
          const inquiry = await tx.inquiry.findUnique({
            where: { id: inquiryId },
          });
          if (!inquiry) {
            throw new ApiException('NOT_FOUND', 'Inquiry not found.', 404);
          }
          if (
            !ELIGIBLE_INQUIRY_STATUSES.includes(
              inquiry.status as 'new' | 'contacted',
            )
          ) {
            throw new ApiException(
              'INVALID_STATE_TRANSITION',
              `Cannot convert an inquiry with status "${inquiry.status}" into a lead.`,
              409,
            );
          }

          const activeLead = await tx.lead.findFirst({
            where: {
              sourceInquiryId: inquiryId,
              status: { in: [...ACTIVE_LEAD_STATUSES] },
            },
            select: { id: true },
          });
          if (activeLead) {
            throw new ApiException(
              'CONFLICT',
              DUPLICATE_ACTIVE_LEAD_MESSAGE,
              409,
            );
          }

          const created = await tx.lead.create({
            data: {
              leadNumber,
              companyId: inquiry.companyId,
              sourceInquiryId: inquiry.id,
              sourceQuotationRequestId: inquiry.sourceQuotationRequestId,
              status: 'new',
              ownerId: null,
              ownerName: null,
            },
            include: {
              company: { select: COMPANY_SELECT },
              sourceInquiry: { select: SOURCE_INQUIRY_SELECT },
            },
          });

          // The final race guard (locked decision 1.13) — not the application-level checks
          // above, which only prevent the common case. Two concurrent conversions of the same
          // Inquiry can both pass the checks above; only one of their conditional updates here
          // will actually match a row, because the other has already flipped `status` away from
          // `new`/`contacted` by the time it runs.
          const { count } = await tx.inquiry.updateMany({
            where: {
              id: inquiryId,
              status: { in: [...ELIGIBLE_INQUIRY_STATUSES] },
            },
            data: { status: 'converted' },
          });
          if (count === 0) {
            throw new ApiException(
              'CONFLICT',
              CONCURRENT_CONVERSION_MESSAGE,
              409,
            );
          }

          return created;
        });

        return toLead(lead);
      } catch (error) {
        if (error instanceof ApiException) {
          throw error;
        }

        const target = this.classifyUniqueViolation(error);
        if (
          (target === 'lead_number' || target === 'ambiguous') &&
          attempt < MAX_LEAD_NUMBER_RETRY_ATTEMPTS
        ) {
          continue;
        }
        if (target !== null) {
          throw new ApiException(
            'CONFLICT',
            'Could not generate a unique lead number. Please try again.',
            409,
          );
        }

        throw error;
      }
    }
  }

  async update(id: string, dto: UpdateLeadDto): Promise<LeadSummary> {
    const existing = await this.getOrThrow(id);

    if (dto.companyId !== undefined) {
      await this.assertCompanyExists(dto.companyId);
    }
    if (dto.status !== undefined) {
      this.assertValidStatusTransition(existing.status, dto.status);
    }

    const updated = await this.prisma.lead.update({
      where: { id },
      include: {
        company: { select: COMPANY_SELECT },
        sourceInquiry: { select: SOURCE_INQUIRY_SELECT },
      },
      data: {
        ...(dto.companyId !== undefined && { companyId: dto.companyId }),
        ...(dto.ownerId !== undefined && { ownerId: dto.ownerId }),
        ...(dto.ownerName !== undefined && { ownerName: dto.ownerName }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
    });

    return toLead(updated);
  }

  private async getOrThrow(id: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: {
        company: { select: COMPANY_SELECT },
        sourceInquiry: { select: SOURCE_INQUIRY_SELECT },
      },
    });
    if (!lead) {
      throw new ApiException('NOT_FOUND', 'Lead not found.', 404);
    }
    return lead;
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

  /** `converted` is deliberately absent from every list here, and from `UpdateLeadDto`'s own
   * accepted values — Phase 18C must never produce that status itself; it belongs exclusively
   * to Phase 18D's future atomic Lead→Opportunity action. */
  private assertValidStatusTransition(
    currentStatus: string,
    nextStatus: string,
  ): void {
    const allowed: Record<string, string[]> = {
      new: ['contacted', 'lost'],
      contacted: ['qualified', 'unqualified', 'lost'],
      qualified: ['lost'],
      unqualified: [],
      lost: [],
      converted: [],
    };
    if (!allowed[currentStatus]?.includes(nextStatus)) {
      throw new ApiException(
        'INVALID_STATE_TRANSITION',
        `Cannot change lead status from "${currentStatus}" to "${nextStatus}".`,
        409,
      );
    }
  }

  /** `LED-YYYY-NNNNNN`, year-scoped sequence — same shape as
   * `InquiriesService.generateInquiryNumber()`, deliberately re-implemented locally rather than
   * shared, per this codebase's established per-service convention. */
  private async generateLeadNumber(): Promise<string> {
    const year = new Date().getUTCFullYear();
    const startOfYear = new Date(Date.UTC(year, 0, 1));
    const count = await this.prisma.lead.count({
      where: { createdAt: { gte: startOfYear } },
    });
    const sequence = (count + 1).toString().padStart(6, '0');
    return `LED-${year}-${sequence}`;
  }

  private async createWithRetry(data: {
    companyId: string | null;
    sourceInquiryId: null;
    sourceQuotationRequestId: null;
  }): Promise<LeadSummary> {
    for (let attempt = 1; ; attempt++) {
      const leadNumber = await this.generateLeadNumber();
      try {
        const lead = await this.prisma.lead.create({
          data: {
            ...data,
            leadNumber,
            status: 'new',
            ownerId: null,
            ownerName: null,
          },
          include: { company: { select: COMPANY_SELECT } },
        });
        return toLead(lead);
      } catch (error) {
        const target = this.classifyUniqueViolation(error);
        if (
          (target === 'lead_number' || target === 'ambiguous') &&
          attempt < MAX_LEAD_NUMBER_RETRY_ATTEMPTS
        ) {
          continue;
        }
        if (target !== null) {
          throw new ApiException(
            'CONFLICT',
            'Could not generate a unique lead number. Please try again.',
            409,
          );
        }
        throw error;
      }
    }
  }

  /** Same detection shape as `ProductsService`/`InquiriesService` — Prisma 7's driver-adapter
   * can surface a unique violation either as `P2002` (with `meta.target` naming the column) or
   * as the generic unmapped `P2039`, with the real Postgres SQLSTATE (`23505` =
   * `unique_violation`) at `meta.driverAdapterError.cause.originalCode`. Only `leadNumber` is a
   * live unique constraint here — unlike `InquiriesService`, there's no second column to
   * disambiguate against. */
  private classifyUniqueViolation(error: unknown): UniqueViolationTarget {
    const err = error as {
      code?: string;
      meta?: {
        target?: string[];
        driverAdapterError?: { cause?: { originalCode?: string } };
      };
    };

    if (err.code === 'P2002') {
      return err.meta?.target?.includes('lead_number') || !err.meta?.target
        ? 'lead_number'
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
