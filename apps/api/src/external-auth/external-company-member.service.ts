import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { CompanyUserModel as CompanyUser } from '../../generated/prisma/models';
import { BusinessActivityLogService } from '../common/activity-log/business-activity-log.service';
import { PrismaService } from '../prisma/prisma.service';
import { CompanyContextService } from './company-context.service';
import type { CurrentExternalAccountPayload } from './decorators/current-external-account.decorator';
import type { AddCompanyMemberDto } from './dto/add-company-member.dto';
import type { UpdateCompanyMemberDto } from './dto/update-company-member.dto';

export interface CompanyMemberSummary {
  id: string;
  externalAccountId: string;
  role: string;
  status: string;
}

function toSummary(member: CompanyUser): CompanyMemberSummary {
  return {
    id: member.id,
    externalAccountId: member.externalAccountId,
    role: member.role,
    status: member.status,
  };
}

// Returned by `addMember` for both the unknown-email case and the already-a-member case —
// identical shape either way, so a caller probing for which emails have accounts (or which are
// already members) learns nothing from the response. Mirrors the login-enumeration-safety
// pattern ExternalAuthService already uses for unknown-email vs wrong-password.
export interface AddCompanyMemberResult {
  status: 'invited';
}

@Injectable()
export class ExternalCompanyMemberService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly companyContext: CompanyContextService,
    private readonly businessActivityLog: BusinessActivityLogService,
  ) {}

  /** Any active member (owner or member) may list the roster. */
  async listMembers(
    account: CurrentExternalAccountPayload,
    companyId: string,
  ): Promise<CompanyMemberSummary[]> {
    await this.companyContext.resolveActiveMembership(account.id, companyId);

    const members = await this.prisma.companyUser.findMany({
      where: { companyId },
      orderBy: { createdAt: 'asc' },
    });

    return members.map(toSummary);
  }

  /** Owner-only. Always creates role=member, status=pending — the DTO has no fields that could
   * let a caller choose otherwise. An already-existing membership is folded into the same
   * generic response as "no such account" (see `AddCompanyMemberResult`) rather than a distinct
   * 409 — the owner can already see the real membership state via `listMembers`, but the global
   * question "does this email have any account at all" must stay unanswerable either way. */
  async addMember(
    account: CurrentExternalAccountPayload,
    companyId: string,
    dto: AddCompanyMemberDto,
  ): Promise<AddCompanyMemberResult> {
    await this.companyContext.resolveOwnerMembership(account.id, companyId);

    const target = await this.prisma.externalAccount.findUnique({
      where: { email: dto.email },
    });
    if (!target) {
      return { status: 'invited' };
    }

    const existing = await this.prisma.companyUser.findUnique({
      where: {
        externalAccountId_companyId: {
          externalAccountId: target.id,
          companyId,
        },
      },
    });
    if (existing) {
      return { status: 'invited' };
    }

    const member = await this.prisma.companyUser.create({
      data: {
        externalAccountId: target.id,
        companyId,
        role: 'member',
        status: 'pending',
      },
    });

    this.businessActivityLog.record({
      actorId: account.id,
      actorName: account.fullName,
      action: 'member_invited',
      entityType: 'CompanyUser',
      entityId: member.id,
    });

    return { status: 'invited' };
  }

  /** Owner-only. A single PATCH covers both the approve/suspend state machine (`status`) and
   * role change (`role`); each is validated and applied independently so neither can smuggle a
   * change into the other. */
  async updateMember(
    account: CurrentExternalAccountPayload,
    companyId: string,
    companyUserId: string,
    dto: UpdateCompanyMemberDto,
  ): Promise<CompanyMemberSummary> {
    if (dto.status === undefined && dto.role === undefined) {
      throw new BadRequestException(
        'Provide at least one of "status" or "role" to update.',
      );
    }

    await this.companyContext.resolveOwnerMembership(account.id, companyId);
    const target = await this.findMemberInCompany(companyId, companyUserId);

    const data: { status?: 'active' | 'suspended'; role?: 'owner' | 'member' } =
      {};
    const events: string[] = [];

    if (dto.status !== undefined) {
      if (target.status === 'pending' && dto.status === 'active') {
        data.status = 'active';
        events.push('member_approved');
      } else if (target.status === 'active' && dto.status === 'suspended') {
        if (target.role === 'owner') {
          await this.assertNotLastActiveOwner(companyId, target.id);
        }
        data.status = 'suspended';
        events.push('member_suspended');
      } else {
        // Covers active→active, suspended→active, and every other combination not explicitly
        // allowed above — state transitions stay explicit, per the locked rules.
        throw new BadRequestException(
          `Cannot change member status from "${target.status}" to "${dto.status}".`,
        );
      }
    }

    if (dto.role !== undefined) {
      if (dto.role === target.role) {
        throw new BadRequestException(
          `Member already has the role "${dto.role}".`,
        );
      }
      if (target.role === 'owner' && dto.role === 'member') {
        await this.assertNotLastActiveOwner(companyId, target.id);
      }
      data.role = dto.role;
      events.push('member_role_changed');
    }

    const updated = await this.prisma.companyUser.update({
      where: { id: target.id },
      data,
    });

    for (const action of events) {
      this.businessActivityLog.record({
        actorId: account.id,
        actorName: account.fullName,
        action,
        entityType: 'CompanyUser',
        entityId: updated.id,
      });
    }

    return toSummary(updated);
  }

  /** Owner-only. Hard delete — Phase 17A confirmed no FK points into CompanyUser. */
  async removeMember(
    account: CurrentExternalAccountPayload,
    companyId: string,
    companyUserId: string,
  ): Promise<{ removed: true }> {
    await this.companyContext.resolveOwnerMembership(account.id, companyId);
    const target = await this.findMemberInCompany(companyId, companyUserId);

    if (target.role === 'owner') {
      await this.assertNotLastActiveOwner(companyId, target.id);
    }

    await this.prisma.companyUser.delete({ where: { id: target.id } });

    this.businessActivityLog.record({
      actorId: account.id,
      actorName: account.fullName,
      action: 'member_removed',
      entityType: 'CompanyUser',
      entityId: target.id,
    });

    return { removed: true };
  }

  /** Scopes the lookup by (id AND companyId) in one query — never by id alone — so a
   * companyUserId that belongs to a different company can never be targeted through this
   * company's endpoints, even though it's a globally-unique id. */
  private async findMemberInCompany(
    companyId: string,
    companyUserId: string,
  ): Promise<CompanyUser> {
    const member = await this.prisma.companyUser.findFirst({
      where: { id: companyUserId, companyId },
    });
    if (!member) {
      throw new NotFoundException('Member not found in this company.');
    }
    return member;
  }

  /** Postgres can't express "a company always has ≥1 active owner" as a constraint, so this is
   * a service-layer invariant — checked before every suspend/demote/remove that would affect an
   * active owner. */
  private async assertNotLastActiveOwner(
    companyId: string,
    excludingCompanyUserId: string,
  ): Promise<void> {
    const otherActiveOwners = await this.prisma.companyUser.count({
      where: {
        companyId,
        role: 'owner',
        status: 'active',
        id: { not: excludingCompanyUserId },
      },
    });

    if (otherActiveOwners === 0) {
      throw new ConflictException(
        'A company must always have at least one active owner.',
      );
    }
  }
}
