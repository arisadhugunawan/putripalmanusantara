import { ForbiddenException, Injectable } from '@nestjs/common';
import type { CompanyUserModel as CompanyUser } from '../../generated/prisma/models';
import { PrismaService } from '../prisma/prisma.service';

/**
 * The single, canonical place that resolves "may this authenticated ExternalAccount act for
 * this Company" — never derived from a client-supplied `companyId` alone (body/query/param/
 * header), always validated against a live `CompanyUser` row at request time.
 *
 * One generic `ForbiddenException` covers every failure mode (unknown company, no membership,
 * inactive membership) deliberately — distinguishing them in the response would let a caller
 * probe which companyIds exist or who belongs to them.
 */
@Injectable()
export class CompanyContextService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveActiveMembership(
    externalAccountId: string,
    companyId: string,
  ): Promise<CompanyUser> {
    const membership = await this.prisma.companyUser.findUnique({
      where: {
        externalAccountId_companyId: { externalAccountId, companyId },
      },
    });

    if (!membership || membership.status !== 'active') {
      throw new ForbiddenException(
        'You do not have active access to this company.',
      );
    }

    return membership;
  }

  /**
   * Phase 17B: the one owner-only gate every member-management/profile-update endpoint needs.
   * Deliberately reuses `resolveActiveMembership()` rather than duplicating its query, and stays
   * a method on this same service rather than a new class — no separate authorization framework.
   */
  async resolveOwnerMembership(
    externalAccountId: string,
    companyId: string,
  ): Promise<CompanyUser> {
    const membership = await this.resolveActiveMembership(
      externalAccountId,
      companyId,
    );

    if (membership.role !== 'owner') {
      throw new ForbiddenException(
        'Only a company owner may perform this action.',
      );
    }

    return membership;
  }
}
