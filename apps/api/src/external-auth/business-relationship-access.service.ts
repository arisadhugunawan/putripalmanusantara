import { ForbiddenException, Injectable } from '@nestjs/common';
import type { BusinessRelationshipType } from '../../generated/prisma/enums';
import type { BusinessRelationshipModel as BusinessRelationship } from '../../generated/prisma/models';
import { PrismaService } from '../prisma/prisma.service';
import { CompanyContextService } from './company-context.service';

/**
 * Gates access to operational, relationship-scoped domains (Sales for `buyer`, Procurement for
 * `supplier`, and so on) — distinct from `CompanyContextService`, which only answers "is this
 * person an active member of this company" (sufficient for account/company self-management, per
 * the explicit instruction NOT to require an active relationship for those). This service always
 * checks membership first, then the specific relationship type the requested domain needs.
 */
@Injectable()
export class BusinessRelationshipAccessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly companyContext: CompanyContextService,
  ) {}

  async assertActiveRelationship(
    externalAccountId: string,
    companyId: string,
    relationshipType: BusinessRelationshipType,
  ): Promise<BusinessRelationship> {
    await this.companyContext.resolveActiveMembership(
      externalAccountId,
      companyId,
    );

    const relationship = await this.prisma.businessRelationship.findUnique({
      where: { companyId_relationshipType: { companyId, relationshipType } },
    });

    if (!relationship || relationship.status !== 'active') {
      throw new ForbiddenException(
        `This company does not have an active ${relationshipType} relationship with PPN.`,
      );
    }

    return relationship;
  }
}
