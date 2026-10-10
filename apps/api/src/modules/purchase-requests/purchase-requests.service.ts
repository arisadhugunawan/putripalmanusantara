import { Injectable } from '@nestjs/common';
import {
  buildPaginationMeta,
  parseSort,
} from '../../common/dto/pagination-query.dto';
import { ApiException } from '../../common/exceptions/api.exception';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreatePurchaseRequestDto } from './dto/create-purchase-request.dto';
import type { PurchaseRequestQueryDto } from './dto/purchase-request-query.dto';
import type { UpdatePurchaseRequestDto } from './dto/update-purchase-request.dto';
import {
  toPurchaseRequest,
  type PurchaseRequestSummary,
} from './purchase-requests.mapper';

const SORT_FIELD_MAP: Record<string, string> = {
  created_at: 'createdAt',
  request_number: 'requestNumber',
  status: 'status',
};

const PRODUCT_SELECT = { id: true, name: true } as const;
const DETAIL_INCLUDE = {
  items: { include: { product: { select: PRODUCT_SELECT } } },
} as const;

const MAX_REQUEST_NUMBER_RETRY_ATTEMPTS = 3;

type UniqueViolationTarget = 'request_number' | 'ambiguous' | null;

@Injectable()
export class PurchaseRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PurchaseRequestQueryDto): Promise<{
    items: PurchaseRequestSummary[];
    meta: ReturnType<typeof buildPaginationMeta>;
  }> {
    const { field, direction } = parseSort(query.sort);
    const orderField = SORT_FIELD_MAP[field] ?? 'createdAt';
    const q = query.q?.trim();

    const where = {
      ...(query.status !== undefined && { status: query.status }),
      ...(q && {
        requestNumber: { contains: q, mode: 'insensitive' as const },
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.purchaseRequest.findMany({
        where,
        include: { _count: { select: { items: true } } },
        orderBy: { [orderField]: direction },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.purchaseRequest.count({ where }),
    ]);

    return {
      items: items.map(toPurchaseRequest),
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  async findOne(id: string): Promise<PurchaseRequestSummary> {
    return toPurchaseRequest(await this.getOrThrow(id));
  }

  /** Standalone creation — PurchaseRequest is the top of the Procurement chain, with no parent
   * to derive from (same shape as RfqsService.createStandalone). Validates every referenced
   * Product inside the same transaction as the create, then creates the PurchaseRequest and
   * all PurchaseRequestItems as one nested Prisma write — atomic by construction. */
  async create(dto: CreatePurchaseRequestDto): Promise<PurchaseRequestSummary> {
    for (let attempt = 1; ; attempt++) {
      const requestNumber = await this.generateRequestNumber();
      try {
        const purchaseRequest = await this.prisma.$transaction(async (tx) => {
          const products = await tx.product.findMany({
            where: { id: { in: dto.items.map((item) => item.productId) } },
            select: { id: true, name: true },
          });
          const productNameById = new Map(
            products.map((product) => [product.id, product.name]),
          );

          for (const item of dto.items) {
            if (!productNameById.has(item.productId)) {
              throw new ApiException(
                'VALIDATION_ERROR',
                `Product "${item.productId}" does not exist.`,
                400,
                { fields: ['items'] },
              );
            }
          }

          return tx.purchaseRequest.create({
            data: {
              requestNumber,
              status: 'draft',
              requestedById: dto.requestedById ?? null,
              requestedByName: dto.requestedByName ?? null,
              requiredDate: dto.requiredDate
                ? new Date(dto.requiredDate)
                : null,
              notes: dto.notes ?? null,
              items: {
                create: dto.items.map((item) => ({
                  productId: item.productId,
                  // Always the live Product master at creation time — never a client-supplied
                  // name.
                  productNameSnapshot: productNameById.get(item.productId),
                  quantity: item.quantity,
                  unit: item.unit,
                  requiredDate: item.requiredDate
                    ? new Date(item.requiredDate)
                    : null,
                  specifications: item.specifications ?? null,
                  notes: item.notes ?? null,
                })),
              },
            },
            include: DETAIL_INCLUDE,
          });
        });

        return toPurchaseRequest(purchaseRequest);
      } catch (error) {
        if (error instanceof ApiException) {
          throw error;
        }

        const target = this.classifyUniqueViolation(error);
        if (
          (target === 'request_number' || target === 'ambiguous') &&
          attempt < MAX_REQUEST_NUMBER_RETRY_ATTEMPTS
        ) {
          continue;
        }
        if (target !== null) {
          throw new ApiException(
            'CONFLICT',
            'Could not generate a unique purchase request number. Please try again.',
            409,
          );
        }

        throw error;
      }
    }
  }

  async update(
    id: string,
    dto: UpdatePurchaseRequestDto,
  ): Promise<PurchaseRequestSummary> {
    const existing = await this.getOrThrow(id);

    if (dto.status !== undefined) {
      this.assertValidStatusTransition(existing.status, dto.status);
    }

    const updated = await this.prisma.purchaseRequest.update({
      where: { id },
      include: DETAIL_INCLUDE,
      data: {
        ...(dto.requiredDate !== undefined && {
          requiredDate: new Date(dto.requiredDate),
        }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
    });

    return toPurchaseRequest(updated);
  }

  private async getOrThrow(id: string) {
    const purchaseRequest = await this.prisma.purchaseRequest.findUnique({
      where: { id },
      include: DETAIL_INCLUDE,
    });
    if (!purchaseRequest) {
      throw new ApiException('NOT_FOUND', 'Purchase request not found.', 404);
    }
    return purchaseRequest;
  }

  /** `converted` is deliberately absent from every target list — it is only ever set as the
   * side-effect of a successful SupplierRFQ creation (SupplierRfqsService), never directly
   * settable through this PATCH. No reopening a terminal status. */
  private assertValidStatusTransition(
    currentStatus: string,
    nextStatus: string,
  ): void {
    const allowed: Record<string, string[]> = {
      draft: ['submitted', 'cancelled'],
      submitted: ['approved', 'rejected', 'cancelled'],
      approved: ['cancelled'],
      converted: [],
      rejected: [],
      cancelled: [],
    };
    if (!allowed[currentStatus]?.includes(nextStatus)) {
      throw new ApiException(
        'INVALID_STATE_TRANSITION',
        `Cannot change purchase request status from "${currentStatus}" to "${nextStatus}".`,
        409,
      );
    }
  }

  /** `PR-YYYY-NNNNNN`, year-scoped sequence — same shape as every prior CRM/Sales/Procurement
   * phase's own generator, deliberately re-implemented locally rather than a shared
   * abstraction, per this codebase's established per-service convention. */
  private async generateRequestNumber(): Promise<string> {
    const year = new Date().getUTCFullYear();
    const startOfYear = new Date(Date.UTC(year, 0, 1));
    const count = await this.prisma.purchaseRequest.count({
      where: { createdAt: { gte: startOfYear } },
    });
    const sequence = (count + 1).toString().padStart(6, '0');
    return `PR-${year}-${sequence}`;
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
      return err.meta?.target?.includes('request_number') || !err.meta?.target
        ? 'request_number'
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
