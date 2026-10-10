import { ConflictException, Injectable } from '@nestjs/common';
import { BusinessActivityLogService } from '../common/activity-log/business-activity-log.service';
import { PrismaService } from '../prisma/prisma.service';
import { CompanyContextService } from './company-context.service';
import type { CurrentExternalAccountPayload } from './decorators/current-external-account.decorator';
import type { CreateBusinessRelationshipDto } from './dto/create-business-relationship.dto';
import {
  toSummary,
  type ExternalBusinessRelationshipSummary,
} from './external-business-relationship.mapper';

@Injectable()
export class ExternalBusinessRelationshipService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly companyContext: CompanyContextService,
    private readonly businessActivityLog: BusinessActivityLogService,
  ) {}

  /** Any active member (owner or member) may list — matches Phase 17B's `listMembers`
   * precedent: reads are open to active membership, not owner-restricted. */
  async listRelationships(
    account: CurrentExternalAccountPayload,
    companyId: string,
  ): Promise<ExternalBusinessRelationshipSummary[]> {
    await this.companyContext.resolveActiveMembership(account.id, companyId);

    const relationships = await this.prisma.businessRelationship.findMany({
      where: { companyId },
      orderBy: { createdAt: 'asc' },
    });

    return relationships.map(toSummary);
  }

  /** Owner-only. A row existing in ANY status for (companyId, relationshipType) blocks a new
   * request — checked explicitly here before `create()`; the `@@unique` constraint remains the
   * final safety net, never the first line of defense. */
  async requestRelationship(
    account: CurrentExternalAccountPayload,
    companyId: string,
    dto: CreateBusinessRelationshipDto,
  ): Promise<ExternalBusinessRelationshipSummary> {
    await this.companyContext.resolveOwnerMembership(account.id, companyId);

    const existing = await this.prisma.businessRelationship.findUnique({
      where: {
        companyId_relationshipType: {
          companyId,
          relationshipType: dto.relationshipType,
        },
      },
    });
    if (existing) {
      throw new ConflictException(
        `This company already has a "${dto.relationshipType}" relationship request (status: ${existing.status}).`,
      );
    }

    const relationship = await this.prisma.businessRelationship.create({
      data: {
        companyId,
        relationshipType: dto.relationshipType,
        status: 'pending',
        requestedById: account.id,
        requestedByName: account.fullName,
        requestedAt: new Date(),
      },
    });

    this.businessActivityLog.record({
      actorId: account.id,
      actorName: account.fullName,
      action: 'relationship_requested',
      entityType: 'BusinessRelationship',
      entityId: relationship.id,
    });

    return toSummary(relationship);
  }
}
