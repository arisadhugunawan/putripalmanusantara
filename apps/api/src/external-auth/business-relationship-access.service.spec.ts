import { ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessRelationshipAccessService } from './business-relationship-access.service';
import { CompanyContextService } from './company-context.service';

describe('BusinessRelationshipAccessService', () => {
  let service: BusinessRelationshipAccessService;
  let prisma: { businessRelationship: { findUnique: jest.Mock } };
  let companyContext: { resolveActiveMembership: jest.Mock };

  const externalAccountId = 'external-1';
  const companyId = 'company-1';

  beforeEach(async () => {
    prisma = { businessRelationship: { findUnique: jest.fn() } };
    companyContext = {
      resolveActiveMembership: jest.fn().mockResolvedValue({}),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        BusinessRelationshipAccessService,
        { provide: PrismaService, useValue: prisma },
        { provide: CompanyContextService, useValue: companyContext },
      ],
    }).compile();

    service = moduleRef.get(BusinessRelationshipAccessService);
  });

  it('returns the relationship when it exists and is active for the requested type', async () => {
    const relationship = {
      id: 'relationship-1',
      companyId,
      relationshipType: 'buyer',
      status: 'active',
    };
    prisma.businessRelationship.findUnique.mockResolvedValue(relationship);

    const result = await service.assertActiveRelationship(
      externalAccountId,
      companyId,
      'buyer',
    );

    expect(companyContext.resolveActiveMembership).toHaveBeenCalledWith(
      externalAccountId,
      companyId,
    );
    expect(result).toBe(relationship);
  });

  it('rejects when the company has a pending relationship of the requested type', async () => {
    prisma.businessRelationship.findUnique.mockResolvedValue({
      id: 'relationship-1',
      companyId,
      relationshipType: 'buyer',
      status: 'pending',
    });

    await expect(
      service.assertActiveRelationship(externalAccountId, companyId, 'buyer'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects when the company has a suspended relationship of the requested type', async () => {
    prisma.businessRelationship.findUnique.mockResolvedValue({
      id: 'relationship-1',
      companyId,
      relationshipType: 'supplier',
      status: 'suspended',
    });

    await expect(
      service.assertActiveRelationship(
        externalAccountId,
        companyId,
        'supplier',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects when the company has no relationship of the requested type at all', async () => {
    prisma.businessRelationship.findUnique.mockResolvedValue(null);

    await expect(
      service.assertActiveRelationship(
        externalAccountId,
        companyId,
        'supplier',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.businessRelationship.findUnique).toHaveBeenCalledWith({
      where: {
        companyId_relationshipType: { companyId, relationshipType: 'supplier' },
      },
    });
  });

  it('rejects before checking the relationship when there is no active company membership', async () => {
    companyContext.resolveActiveMembership.mockRejectedValue(
      new ForbiddenException('You do not have active access to this company.'),
    );

    await expect(
      service.assertActiveRelationship(externalAccountId, companyId, 'buyer'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.businessRelationship.findUnique).not.toHaveBeenCalled();
  });
});
