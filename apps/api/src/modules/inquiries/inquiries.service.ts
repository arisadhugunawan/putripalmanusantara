import { Injectable } from '@nestjs/common';
import {
  buildPaginationMeta,
  parseSort,
} from '../../common/dto/pagination-query.dto';
import { ApiException } from '../../common/exceptions/api.exception';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateInquiryDto } from './dto/create-inquiry.dto';
import type { InquiryQueryDto } from './dto/inquiry-query.dto';
import type { UpdateInquiryDto } from './dto/update-inquiry.dto';
import { toInquiry, type InquirySummary } from './inquiry.mapper';

const SORT_FIELD_MAP: Record<string, string> = {
  created_at: 'createdAt',
  status: 'status',
  inquiry_number: 'inquiryNumber',
};

const COMPANY_SELECT = { id: true, name: true } as const;

// Mirrors publish()/restoreSnapshot()'s MAX_SNAPSHOT_VERSION_RETRY_ATTEMPTS in
// products.service.ts — bounds the inquiryNumber retry loop so a systemic problem fails loudly
// instead of looping forever, while comfortably covering realistic concurrent-creation bursts.
const MAX_INQUIRY_NUMBER_RETRY_ATTEMPTS = 3;

const CONVERSION_CONFLICT_MESSAGE =
  'This quotation request has already been converted into an Inquiry.';

type UniqueViolationTarget =
  'inquiry_number' | 'source_quotation_request_id' | 'ambiguous' | null;

interface InquiryCreateData {
  companyName: string;
  companyId: string | null;
  contactName: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string | null;
  source: 'manual' | 'quotation_request';
  sourceQuotationRequestId: string | null;
}

@Injectable()
export class InquiriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: InquiryQueryDto): Promise<{
    items: InquirySummary[];
    meta: ReturnType<typeof buildPaginationMeta>;
  }> {
    const { field, direction } = parseSort(query.sort);
    const orderField = SORT_FIELD_MAP[field] ?? 'createdAt';
    const q = query.q?.trim();

    const where = {
      ...(query.status !== undefined && { status: query.status }),
      ...(query.source !== undefined && { source: query.source }),
      ...(query.companyId !== undefined && { companyId: query.companyId }),
      ...(q && {
        OR: [
          { inquiryNumber: { contains: q, mode: 'insensitive' as const } },
          { companyName: { contains: q, mode: 'insensitive' as const } },
          { contactName: { contains: q, mode: 'insensitive' as const } },
          { email: { contains: q, mode: 'insensitive' as const } },
          { subject: { contains: q, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.inquiry.findMany({
        where,
        include: { company: { select: COMPANY_SELECT } },
        orderBy: { [orderField]: direction },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.inquiry.count({ where }),
    ]);

    return {
      items: items.map(toInquiry),
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  async findOne(id: string): Promise<InquirySummary> {
    return toInquiry(await this.getOrThrow(id));
  }

  async create(dto: CreateInquiryDto): Promise<InquirySummary> {
    if (dto.companyId) {
      await this.assertCompanyExists(dto.companyId);
    }

    return this.createWithRetry(
      {
        companyName: dto.companyName,
        companyId: dto.companyId ?? null,
        contactName: dto.contactName,
        email: dto.email,
        phone: dto.phone ?? null,
        subject: dto.subject ?? null,
        message: dto.message ?? null,
        source: 'manual',
        sourceQuotationRequestId: null,
      },
      { isConversion: false },
    );
  }

  /** Reads the given QuotationRequest only — never updates, deletes, or otherwise mutates it.
   * `companyId` is always null on creation here (no automatic company matching, per the locked
   * decision); product/estimatedQuantity/sourcePage/status/createdAt are deliberately not
   * copied — product context remains reachable later via `sourceQuotationRequestId`. */
  async convertFromQuotationRequest(
    quotationRequestId: string,
  ): Promise<InquirySummary> {
    const quotationRequest = await this.prisma.quotationRequest.findUnique({
      where: { id: quotationRequestId },
    });
    if (!quotationRequest) {
      throw new ApiException('NOT_FOUND', 'Quotation request not found.', 404);
    }

    const existing = await this.prisma.inquiry.findUnique({
      where: { sourceQuotationRequestId: quotationRequestId },
    });
    if (existing) {
      throw new ApiException('CONFLICT', CONVERSION_CONFLICT_MESSAGE, 409);
    }

    return this.createWithRetry(
      {
        companyName: quotationRequest.company,
        companyId: null,
        contactName: quotationRequest.name,
        email: quotationRequest.email,
        phone: quotationRequest.phone,
        subject: null,
        message: quotationRequest.message,
        source: 'quotation_request',
        sourceQuotationRequestId: quotationRequest.id,
      },
      { isConversion: true },
    );
  }

  async update(id: string, dto: UpdateInquiryDto): Promise<InquirySummary> {
    const existing = await this.getOrThrow(id);

    if (dto.companyId !== undefined) {
      await this.assertCompanyExists(dto.companyId);
    }
    if (dto.status !== undefined) {
      this.assertValidStatusTransition(existing.status, dto.status);
    }

    const updated = await this.prisma.inquiry.update({
      where: { id },
      include: { company: { select: COMPANY_SELECT } },
      data: {
        ...(dto.companyName !== undefined && { companyName: dto.companyName }),
        ...(dto.companyId !== undefined && { companyId: dto.companyId }),
        ...(dto.contactName !== undefined && { contactName: dto.contactName }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.subject !== undefined && { subject: dto.subject }),
        ...(dto.message !== undefined && { message: dto.message }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
    });

    return toInquiry(updated);
  }

  private async getOrThrow(id: string) {
    const inquiry = await this.prisma.inquiry.findUnique({
      where: { id },
      include: { company: { select: COMPANY_SELECT } },
    });
    if (!inquiry) {
      throw new ApiException('NOT_FOUND', 'Inquiry not found.', 404);
    }
    return inquiry;
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

  /** `new` and `contacted` are the only non-terminal statuses; `converted`/`closed` have no
   * outgoing transition in this phase (Phase 18B creates no Lead, so `converted` is reachable
   * but not yet meaningfully exited). `new → converted` is allowed for forward-compatibility,
   * per the locked decision, even though no code path sets it that way today. */
  private assertValidStatusTransition(
    currentStatus: string,
    nextStatus: string,
  ): void {
    const allowed: Record<string, string[]> = {
      new: ['contacted', 'closed', 'converted'],
      contacted: ['converted', 'closed'],
      converted: [],
      closed: [],
    };
    if (!allowed[currentStatus]?.includes(nextStatus)) {
      throw new ApiException(
        'INVALID_STATE_TRANSITION',
        `Cannot change inquiry status from "${currentStatus}" to "${nextStatus}".`,
        409,
      );
    }
  }

  /** `INQ-YYYY-NNNNNN`, year-scoped sequence. The count-based guess is never the sole
   * mechanism — `createWithRetry` below catches a collision on `inquiryNumber` and retries with
   * a freshly recomputed count, mirroring `ProductsService.publish()`'s version-retry pattern. */
  private async generateInquiryNumber(): Promise<string> {
    const year = new Date().getUTCFullYear();
    const startOfYear = new Date(Date.UTC(year, 0, 1));
    const count = await this.prisma.inquiry.count({
      where: { createdAt: { gte: startOfYear } },
    });
    const sequence = (count + 1).toString().padStart(6, '0');
    return `INQ-${year}-${sequence}`;
  }

  /** Two unique constraints can be live on the same `create()` call here: `inquiryNumber`
   * (freshly generated per attempt, retry-safe) and `sourceQuotationRequestId` (fixed for a
   * given conversion, never retry-safe — retrying with a new inquiryNumber would just hit the
   * same conflict again). `classifyUniqueViolation` distinguishes them when Prisma's error
   * carries `meta.target`; when it doesn't (the driver-adapter's generic `P2039` fallback), the
   * safest reading depends on context — see the comment below. Never lets a raw Prisma/Postgres
   * error reach the client either way. */
  private async createWithRetry(
    data: InquiryCreateData,
    options: { isConversion: boolean },
  ): Promise<InquirySummary> {
    for (let attempt = 1; ; attempt++) {
      const inquiryNumber = await this.generateInquiryNumber();
      try {
        // Conversion specifically runs inside a transaction — not because a single `create()`
        // needs extra atomicity on its own, but so the duplicate-protecting shape here matches
        // the pattern Phase 18C's Lead-creation step will need to extend (create Lead + update
        // Inquiry.status together). Manual creation has no second write to coordinate, so it
        // skips the ceremony. Either way, the `@@unique` constraint — not the transaction — is
        // what actually closes the race; see `classifyUniqueViolation` below.
        const inquiry = options.isConversion
          ? await this.prisma.$transaction((tx) =>
              tx.inquiry.create({
                data: { ...data, inquiryNumber },
                include: { company: { select: COMPANY_SELECT } },
              }),
            )
          : await this.prisma.inquiry.create({
              data: { ...data, inquiryNumber },
              include: { company: { select: COMPANY_SELECT } },
            });
        return toInquiry(inquiry);
      } catch (error) {
        const target = this.classifyUniqueViolation(error);

        if (target === 'source_quotation_request_id') {
          throw new ApiException('CONFLICT', CONVERSION_CONFLICT_MESSAGE, 409);
        }

        if (
          (target === 'inquiry_number' || target === 'ambiguous') &&
          attempt < MAX_INQUIRY_NUMBER_RETRY_ATTEMPTS
        ) {
          continue;
        }

        if (target !== null) {
          // Retries exhausted on a genuine unique-constraint violation whose exact column
          // couldn't be determined (the ambiguous driver-adapter fallback) — a conversion that
          // keeps failing identically across retries (the generated inquiryNumber changes every
          // attempt; `sourceQuotationRequestId` does not) is almost certainly the latter, so
          // report it that way for a conversion; otherwise report the generic exhausted-retries
          // case. Either way, never surface the raw error.
          throw new ApiException(
            'CONFLICT',
            options.isConversion
              ? CONVERSION_CONFLICT_MESSAGE
              : 'Could not generate a unique inquiry number. Please try again.',
            409,
          );
        }

        throw error;
      }
    }
  }

  /** Same detection shape as `ProductsService.isProductSlugConflict()`/
   * `isProductSnapshotVersionConflict()` — Prisma 7's driver-adapter can surface a unique
   * violation either as `P2002` (with `meta.target` naming the column) or as the generic
   * unmapped `P2039`, with the real Postgres SQLSTATE (`23505` = `unique_violation`) at
   * `meta.driverAdapterError.cause.originalCode`. */
  private classifyUniqueViolation(error: unknown): UniqueViolationTarget {
    const err = error as {
      code?: string;
      meta?: {
        target?: string[];
        driverAdapterError?: { cause?: { originalCode?: string } };
      };
    };

    if (err.code === 'P2002') {
      if (err.meta?.target?.includes('inquiry_number')) return 'inquiry_number';
      if (err.meta?.target?.includes('source_quotation_request_id')) {
        return 'source_quotation_request_id';
      }
      return err.meta?.target ? null : 'ambiguous';
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
