import { ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { BusinessActivityLogService } from '../common/activity-log/business-activity-log.service';
import { PrismaService } from '../prisma/prisma.service';
import { CompanyContextService } from './company-context.service';
import type { CurrentExternalAccountPayload } from './decorators/current-external-account.decorator';
import { ExternalCompanyService } from './external-company.service';

describe('ExternalCompanyService', () => {
  let service: ExternalCompanyService;
  let prisma: { company: { findUniqueOrThrow: jest.Mock; update: jest.Mock } };
  let companyContext: {
    resolveActiveMembership: jest.Mock;
    resolveOwnerMembership: jest.Mock;
  };
  let businessActivityLog: { record: jest.Mock };

  const owner: CurrentExternalAccountPayload = {
    id: 'external-owner',
    email: 'owner@example.com',
    fullName: 'Owner Contact',
    phone: null,
    status: 'active',
    emailVerifiedAt: null,
    lastLoginAt: null,
  };
  const companyId = 'company-1';
  const storedCompany = {
    id: companyId,
    name: 'Buyer Co',
    legalName: 'Buyer Co Pte Ltd',
    country: 'Indonesia',
    address: 'Jl. Example 1',
    website: 'https://buyerco.example',
    status: 'active',
  };

  beforeEach(async () => {
    prisma = {
      company: {
        findUniqueOrThrow: jest.fn().mockResolvedValue(storedCompany),
        update: jest.fn().mockResolvedValue(storedCompany),
      },
    };
    companyContext = {
      resolveActiveMembership: jest.fn().mockResolvedValue({}),
      resolveOwnerMembership: jest.fn().mockResolvedValue({}),
    };
    businessActivityLog = { record: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ExternalCompanyService,
        { provide: PrismaService, useValue: prisma },
        { provide: CompanyContextService, useValue: companyContext },
        { provide: BusinessActivityLogService, useValue: businessActivityLog },
      ],
    }).compile();

    service = moduleRef.get(ExternalCompanyService);
  });

  describe('getProfile', () => {
    it('returns the profile for any active member', async () => {
      const result = await service.getProfile(owner, companyId);

      expect(companyContext.resolveActiveMembership).toHaveBeenCalledWith(
        owner.id,
        companyId,
      );
      expect(result).toEqual(
        expect.objectContaining({ id: companyId, name: 'Buyer Co' }),
      );
    });

    it('propagates the ForbiddenException for a non-member', async () => {
      companyContext.resolveActiveMembership.mockRejectedValue(
        new ForbiddenException(
          'You do not have active access to this company.',
        ),
      );

      await expect(service.getProfile(owner, companyId)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(prisma.company.findUniqueOrThrow).not.toHaveBeenCalled();
    });
  });

  describe('updateProfile', () => {
    it('requires an owner membership, not just any active member', async () => {
      companyContext.resolveOwnerMembership.mockRejectedValue(
        new ForbiddenException('Only a company owner may perform this action.'),
      );

      await expect(
        service.updateProfile(owner, companyId, { name: 'New Name' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.company.update).not.toHaveBeenCalled();
    });

    it('updates only the allowed fields and logs the event', async () => {
      await service.updateProfile(owner, companyId, {
        name: 'New Name',
        website: 'https://new.example',
      });

      expect(prisma.company.update).toHaveBeenCalledWith({
        where: { id: companyId },
        data: { name: 'New Name', website: 'https://new.example' },
      });
      expect(businessActivityLog.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'company_profile_updated' }),
      );
    });

    it('never forwards country or status even if present on the DTO object', async () => {
      // Simulates a client payload with fields the DTO's own type doesn't declare — built as a
      // loosely-typed object (not a literal assigned directly to the parameter) so this exercises
      // the service's runtime behavior rather than tripping TypeScript's excess-property check.
      const payloadWithExtraFields: Record<string, unknown> = {
        name: 'New Name',
        country: 'Different Country',
        status: 'active',
      };

      await service.updateProfile(owner, companyId, payloadWithExtraFields);

      /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access -- jest.Mock's own `.calls` type is untyped by Jest's own types. */
      const updateArgs = prisma.company.update.mock.calls[0][0];
      expect(updateArgs.data).not.toHaveProperty('country');
      expect(updateArgs.data).not.toHaveProperty('status');
      /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
    });
  });
});
