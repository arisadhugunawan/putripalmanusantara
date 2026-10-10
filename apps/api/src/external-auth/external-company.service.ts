import { Injectable } from '@nestjs/common';
import type { CompanyModel as Company } from '../../generated/prisma/models';
import { BusinessActivityLogService } from '../common/activity-log/business-activity-log.service';
import { PrismaService } from '../prisma/prisma.service';
import type { CurrentExternalAccountPayload } from './decorators/current-external-account.decorator';
import type { UpdateCompanyDto } from './dto/update-company.dto';
import { CompanyContextService } from './company-context.service';

export interface CompanyProfile {
  id: string;
  name: string;
  legalName: string | null;
  country: string;
  address: string | null;
  website: string | null;
  status: string;
}

function toProfile(company: Company): CompanyProfile {
  return {
    id: company.id,
    name: company.name,
    legalName: company.legalName,
    country: company.country,
    address: company.address,
    website: company.website,
    status: company.status,
  };
}

@Injectable()
export class ExternalCompanyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly companyContext: CompanyContextService,
    private readonly businessActivityLog: BusinessActivityLogService,
  ) {}

  /** Any active member (owner or member) may read the profile. */
  async getProfile(
    account: CurrentExternalAccountPayload,
    companyId: string,
  ): Promise<CompanyProfile> {
    await this.companyContext.resolveActiveMembership(account.id, companyId);
    const company = await this.prisma.company.findUniqueOrThrow({
      where: { id: companyId },
    });
    return toProfile(company);
  }

  /** Owner-only. `country` and `status` are never accepted — `UpdateCompanyDto` has no fields
   * for them, so there is nothing here that could set them even by mistake. */
  async updateProfile(
    account: CurrentExternalAccountPayload,
    companyId: string,
    dto: UpdateCompanyDto,
  ): Promise<CompanyProfile> {
    await this.companyContext.resolveOwnerMembership(account.id, companyId);

    const company = await this.prisma.company.update({
      where: { id: companyId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.legalName !== undefined && { legalName: dto.legalName }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.website !== undefined && { website: dto.website }),
      },
    });

    this.businessActivityLog.record({
      actorId: account.id,
      actorName: account.fullName,
      action: 'company_profile_updated',
      entityType: 'Company',
      entityId: company.id,
    });

    return toProfile(company);
  }
}
