import { Injectable } from '@nestjs/common';
import {
  buildPaginationMeta,
  parseSort,
} from '../../common/dto/pagination-query.dto';
import { ApiException } from '../../common/exceptions/api.exception';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateQcInspectionDto } from './dto/create-qc-inspection.dto';
import type { CreateQcResultDto } from './dto/create-qc-result.dto';
import type { QcInspectionQueryDto } from './dto/qc-inspection-query.dto';
import type { UpdateQcInspectionDto } from './dto/update-qc-inspection.dto';
import { toQcInspection, type QcInspectionSummary } from './qc.mapper';

const SORT_FIELD_MAP: Record<string, string> = {
  created_at: 'createdAt',
  inspection_number: 'inspectionNumber',
  status: 'status',
  inspected_at: 'inspectedAt',
};

const INVENTORY_LOT_SELECT = { id: true, lotNumber: true } as const;
const DETAIL_INCLUDE = {
  inventoryLot: { select: INVENTORY_LOT_SELECT },
  results: true,
} as const;

// `incoming`/`release` both operate on a `quarantine` lot; `reinspection` is allowed only for
// a `hold` lot (locked decision 14).
const ELIGIBLE_LOT_STATUS_BY_TYPE: Record<string, string> = {
  incoming: 'quarantine',
  release: 'quarantine',
  reinspection: 'hold',
};

const MAX_INSPECTION_NUMBER_RETRY_ATTEMPTS = 3;

type UniqueViolationTarget = 'inspection_number' | 'ambiguous' | null;

@Injectable()
export class QcService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QcInspectionQueryDto): Promise<{
    items: QcInspectionSummary[];
    meta: ReturnType<typeof buildPaginationMeta>;
  }> {
    const { field, direction } = parseSort(query.sort);
    const orderField = SORT_FIELD_MAP[field] ?? 'createdAt';
    const q = query.q?.trim();

    const where = {
      ...(query.status !== undefined && { status: query.status }),
      ...(query.inspectionType !== undefined && {
        inspectionType: query.inspectionType,
      }),
      ...(query.inventoryLotId !== undefined && {
        inventoryLotId: query.inventoryLotId,
      }),
      ...(q && {
        inspectionNumber: { contains: q, mode: 'insensitive' as const },
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.qCInspection.findMany({
        where,
        include: { inventoryLot: { select: INVENTORY_LOT_SELECT } },
        orderBy: { [orderField]: direction },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.qCInspection.count({ where }),
    ]);

    return {
      items: items.map(toQcInspection),
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  async findOne(id: string): Promise<QcInspectionSummary> {
    return toQcInspection(await this.getOrThrow(id));
  }

  /** QCInspection can only target an InventoryLot, never Product/Receiving/ReceivingItem/
   * Inventory directly (locked decision 15). Eligibility depends on the inspection type
   * (locked decision 14) — `incoming`/`release` require `quarantine`, `reinspection` requires
   * `hold`. Starts at `pending` always; the client never chooses the initial status. */
  async createFromInventoryLot(
    inventoryLotId: string,
    dto: CreateQcInspectionDto,
  ): Promise<QcInspectionSummary> {
    for (let attempt = 1; ; attempt++) {
      const inspectionNumber = await this.generateInspectionNumber();
      try {
        const inspection = await this.prisma.$transaction(async (tx) => {
          const lot = await tx.inventoryLot.findUnique({
            where: { id: inventoryLotId },
          });
          if (!lot) {
            throw new ApiException(
              'NOT_FOUND',
              'Inventory lot not found.',
              404,
            );
          }

          const requiredStatus =
            ELIGIBLE_LOT_STATUS_BY_TYPE[dto.inspectionType];
          if (lot.status !== requiredStatus) {
            throw new ApiException(
              'INVALID_STATE_TRANSITION',
              `Cannot create a "${dto.inspectionType}" inspection for a lot with status "${lot.status}" (requires "${requiredStatus}").`,
              409,
            );
          }

          return tx.qCInspection.create({
            data: {
              inspectionNumber,
              inventoryLotId: lot.id,
              inspectionType: dto.inspectionType,
              inspectorId: dto.inspectorId ?? null,
              inspectorName: dto.inspectorName ?? null,
              inspectedAt: dto.inspectedAt
                ? new Date(dto.inspectedAt)
                : new Date(),
              status: 'pending',
              notes: dto.notes ?? null,
            },
            include: DETAIL_INCLUDE,
          });
        });

        return toQcInspection(inspection);
      } catch (error) {
        if (error instanceof ApiException) {
          throw error;
        }

        const target = this.classifyUniqueViolation(error);
        if (
          (target === 'inspection_number' || target === 'ambiguous') &&
          attempt < MAX_INSPECTION_NUMBER_RETRY_ATTEMPTS
        ) {
          continue;
        }
        if (target !== null) {
          throw new ApiException(
            'CONFLICT',
            'Could not generate a unique inspection number. Please try again.',
            409,
          );
        }

        throw error;
      }
    }
  }

  /** Adds one QCResult and recomputes the inspection's own status from the full accumulated
   * set of results (locked decision 19/20) — the client never sets `passed`/`failed`
   * directly. Allowed while the inspection is `pending`/`in_progress`/`passed`/`failed`
   * (recomputable up until release/cancellation); rejected once `released`/`cancelled`
   * (locked decision 18). The very first result also advances `pending → in_progress`.
   *
   * Roll-up: any `fail` → `failed`; otherwise, with ≥1 result and every result `pass`/`na` →
   * `passed` (locked decision 20).
   *
   * Side effects on the parent InventoryLot, both as conditional updates (idempotent, never
   * throwing if the lot is already in the target state for an unrelated reason):
   * - `incoming`/`reinspection` rolling up to `failed` → lot `quarantine → hold` (locked
   *   decision 20/22). A `release`-type inspection failing does **not** trigger this — locked
   *   decision 20 names only `incoming`/`reinspection`, and this reading does not extend the
   *   rule to a third type that wasn't mentioned.
   * - `reinspection` rolling up to `passed` → lot `hold → quarantine` (making it release-
   *   eligible again — only `quarantine` lots can be released, per locked decision 8/21). */
  async createResult(
    inspectionId: string,
    dto: CreateQcResultDto,
  ): Promise<QcInspectionSummary> {
    const inspection = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.qCInspection.findUnique({
        where: { id: inspectionId },
        include: { results: true },
      });
      if (!existing) {
        throw new ApiException('NOT_FOUND', 'QC inspection not found.', 404);
      }
      if (existing.status === 'released' || existing.status === 'cancelled') {
        throw new ApiException(
          'INVALID_STATE_TRANSITION',
          `Cannot add a result to a QC inspection with status "${existing.status}".`,
          409,
        );
      }

      await tx.qCResult.create({
        data: {
          qcInspectionId: inspectionId,
          parameter: dto.parameter,
          specification: dto.specification ?? null,
          actualValue: dto.actualValue ?? null,
          unit: dto.unit ?? null,
          result: dto.result,
          notes: dto.notes ?? null,
        },
      });

      const allResults = [...existing.results.map((r) => r.result), dto.result];
      const rollup = allResults.includes('fail') ? 'failed' : 'passed';

      const updated = await tx.qCInspection.update({
        where: { id: inspectionId },
        data: { status: rollup },
        include: DETAIL_INCLUDE,
      });

      if (
        rollup === 'failed' &&
        (existing.inspectionType === 'incoming' ||
          existing.inspectionType === 'reinspection')
      ) {
        await tx.inventoryLot.updateMany({
          where: { id: existing.inventoryLotId, status: 'quarantine' },
          data: { status: 'hold' },
        });
      }

      if (rollup === 'passed' && existing.inspectionType === 'reinspection') {
        await tx.inventoryLot.updateMany({
          where: { id: existing.inventoryLotId, status: 'hold' },
          data: { status: 'quarantine' },
        });
      }

      return updated;
    });

    return toQcInspection(inspection);
  }

  /** The only client-PATCHable transition in v1: explicit cancellation of a `failed`
   * inspection (locked decision 16/18). */
  async update(
    id: string,
    dto: UpdateQcInspectionDto,
  ): Promise<QcInspectionSummary> {
    const existing = await this.getOrThrow(id);
    if (existing.status !== 'failed') {
      throw new ApiException(
        'INVALID_STATE_TRANSITION',
        `Cannot change QC inspection status from "${existing.status}" to "${dto.status}".`,
        409,
      );
    }

    const updated = await this.prisma.qCInspection.update({
      where: { id },
      include: DETAIL_INCLUDE,
      data: { status: dto.status },
    });

    return toQcInspection(updated);
  }

  private async getOrThrow(id: string) {
    const inspection = await this.prisma.qCInspection.findUnique({
      where: { id },
      include: DETAIL_INCLUDE,
    });
    if (!inspection) {
      throw new ApiException('NOT_FOUND', 'QC inspection not found.', 404);
    }
    return inspection;
  }

  /** `QC-YYYY-NNNNNN` (locked decision 15/17), year-scoped sequence — same shape as every
   * prior phase's own generator. */
  private async generateInspectionNumber(): Promise<string> {
    const year = new Date().getUTCFullYear();
    const startOfYear = new Date(Date.UTC(year, 0, 1));
    const count = await this.prisma.qCInspection.count({
      where: { createdAt: { gte: startOfYear } },
    });
    const sequence = (count + 1).toString().padStart(6, '0');
    return `QC-${year}-${sequence}`;
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
      return err.meta?.target?.includes('inspection_number') ||
        !err.meta?.target
        ? 'inspection_number'
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
