import { Injectable } from '@nestjs/common';
import { buildPaginationMeta } from '../../common/dto/pagination-query.dto';
import { ApiException } from '../../common/exceptions/api.exception';
import type { CurrentAdminPayload } from '../../common/decorators/current-admin.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import type { AdminBusinessRelationshipQueryDto } from './dto/admin-business-relationship-query.dto';
import {
  toDetail,
  toSummary,
  type AdminBusinessRelationshipDetail,
  type AdminBusinessRelationshipSummary,
} from './business-relationship.mapper';

const COMPANY_SELECT = { id: true, name: true } as const;

@Injectable()
export class AdminBusinessRelationshipsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Admin inspects every company's relationships — no `CompanyContextService` tenancy check
   * here, unlike the external side; only the explicit, optional query filters apply. */
  async list(query: AdminBusinessRelationshipQueryDto): Promise<{
    items: AdminBusinessRelationshipSummary[];
    meta: ReturnType<typeof buildPaginationMeta>;
  }> {
    const where = {
      ...(query.status !== undefined && { status: query.status }),
      ...(query.relationshipType !== undefined && {
        relationshipType: query.relationshipType,
      }),
      ...(query.companyId !== undefined && { companyId: query.companyId }),
    };

    const [items, total] = await Promise.all([
      this.prisma.businessRelationship.findMany({
        where,
        include: { company: { select: COMPANY_SELECT } },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.businessRelationship.count({ where }),
    ]);

    return {
      items: items.map(toSummary),
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  async findOne(id: string): Promise<AdminBusinessRelationshipDetail> {
    return toDetail(await this.getOrThrow(id));
  }

  /** `pending → active`. `approvedAt`/`approvedById`/`approvedByName` represent the FIRST
   * approval only — never overwritten on a later call (unreachable under the locked lifecycle
   * since a row only ever sees `approve` once, but guarded defensively regardless). */
  async approve(
    admin: CurrentAdminPayload,
    id: string,
  ): Promise<AdminBusinessRelationshipDetail> {
    const relationship = await this.getOrThrow(id);
    this.assertTransition(relationship.status, 'pending', 'approve');

    const updated = await this.prisma.businessRelationship.update({
      where: { id },
      include: { company: { select: COMPANY_SELECT } },
      data: {
        status: 'active',
        approvedById: relationship.approvedById ?? admin.id,
        approvedByName: relationship.approvedByName ?? admin.name,
        approvedAt: relationship.approvedAt ?? new Date(),
      },
    });

    return toDetail(updated);
  }

  /** `pending → (row deleted)`. Frees the `(companyId, relationshipType)` unique slot
   * immediately — a future request for the same type is a plain `create`, nothing special. The
   * global `ActivityLogInterceptor` reads `entityId` from the route's `:id` param (not from a
   * post-mutation DB read), so it still captures the right id even though the row is gone by
   * the time the interceptor's `tap` callback runs. */
  async reject(id: string): Promise<{ id: string; deleted: true }> {
    const relationship = await this.getOrThrow(id);
    this.assertTransition(relationship.status, 'pending', 'reject');

    await this.prisma.businessRelationship.delete({ where: { id } });
    return { id, deleted: true };
  }

  /** `active → suspended`. Never touches `approvedAt`/`approvedById`/`approvedByName`. */
  async suspend(id: string): Promise<AdminBusinessRelationshipDetail> {
    const relationship = await this.getOrThrow(id);
    this.assertTransition(relationship.status, 'active', 'suspend');

    const updated = await this.prisma.businessRelationship.update({
      where: { id },
      include: { company: { select: COMPANY_SELECT } },
      data: { status: 'suspended' },
    });

    return toDetail(updated);
  }

  /** `suspended → active`. Same as suspend — `approvedAt`/`approvedById`/`approvedByName`
   * still represent the original approval and are left untouched; there are deliberately no
   * `reactivatedBy*`/`reactivatedAt` fields — that event lives only in `AdminActivityLog`. */
  async reactivate(id: string): Promise<AdminBusinessRelationshipDetail> {
    const relationship = await this.getOrThrow(id);
    this.assertTransition(relationship.status, 'suspended', 'reactivate');

    const updated = await this.prisma.businessRelationship.update({
      where: { id },
      include: { company: { select: COMPANY_SELECT } },
      data: { status: 'active' },
    });

    return toDetail(updated);
  }

  private async getOrThrow(id: string) {
    const relationship = await this.prisma.businessRelationship.findUnique({
      where: { id },
      include: { company: { select: COMPANY_SELECT } },
    });
    if (!relationship) {
      throw new ApiException(
        'NOT_FOUND',
        'Business relationship not found.',
        404,
      );
    }
    return relationship;
  }

  /** Every transition requires the row to currently be in exactly one required status — any
   * other current status is rejected explicitly, never silently no-op'd. */
  private assertTransition(
    currentStatus: string,
    requiredStatus: string,
    action: string,
  ): void {
    if (currentStatus !== requiredStatus) {
      throw new ApiException(
        'INVALID_STATE_TRANSITION',
        `Cannot ${action} a business relationship with status "${currentStatus}".`,
        409,
      );
    }
  }
}
