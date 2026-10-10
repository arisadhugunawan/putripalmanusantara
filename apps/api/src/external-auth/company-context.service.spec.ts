import { ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { CompanyContextService } from './company-context.service';

describe('CompanyContextService', () => {
  let service: CompanyContextService;
  let prisma: { companyUser: { findUnique: jest.Mock } };

  const externalAccountId = 'external-1';
  const companyId = 'company-1';

  beforeEach(async () => {
    prisma = { companyUser: { findUnique: jest.fn() } };

    const moduleRef = await Test.createTestingModule({
      providers: [
        CompanyContextService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = moduleRef.get(CompanyContextService);
  });

  it('returns the membership when it exists and is active', async () => {
    const membership = {
      id: 'membership-1',
      externalAccountId,
      companyId,
      status: 'active',
      role: 'member',
    };
    prisma.companyUser.findUnique.mockResolvedValue(membership);

    const result = await service.resolveActiveMembership(
      externalAccountId,
      companyId,
    );

    expect(prisma.companyUser.findUnique).toHaveBeenCalledWith({
      where: { externalAccountId_companyId: { externalAccountId, companyId } },
    });
    expect(result).toBe(membership);
  });

  it('rejects when no membership row exists for this company', async () => {
    prisma.companyUser.findUnique.mockResolvedValue(null);

    await expect(
      service.resolveActiveMembership(externalAccountId, 'unknown-company'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects when the membership exists but is suspended', async () => {
    prisma.companyUser.findUnique.mockResolvedValue({
      id: 'membership-1',
      externalAccountId,
      companyId,
      status: 'suspended',
      role: 'member',
    });

    await expect(
      service.resolveActiveMembership(externalAccountId, companyId),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects when the account belongs to a different company than requested', async () => {
    prisma.companyUser.findUnique.mockResolvedValue(null);

    await expect(
      service.resolveActiveMembership(
        externalAccountId,
        'someone-elses-company',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.companyUser.findUnique).toHaveBeenCalledWith({
      where: {
        externalAccountId_companyId: {
          externalAccountId,
          companyId: 'someone-elses-company',
        },
      },
    });
  });

  describe('resolveOwnerMembership', () => {
    it('returns the membership when it is active and role=owner', async () => {
      const membership = {
        id: 'membership-1',
        externalAccountId,
        companyId,
        status: 'active',
        role: 'owner',
      };
      prisma.companyUser.findUnique.mockResolvedValue(membership);

      const result = await service.resolveOwnerMembership(
        externalAccountId,
        companyId,
      );

      expect(result).toBe(membership);
    });

    it('rejects an active member who is not an owner', async () => {
      prisma.companyUser.findUnique.mockResolvedValue({
        id: 'membership-1',
        externalAccountId,
        companyId,
        status: 'active',
        role: 'member',
      });

      await expect(
        service.resolveOwnerMembership(externalAccountId, companyId),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejects when there is no active membership at all', async () => {
      prisma.companyUser.findUnique.mockResolvedValue(null);

      await expect(
        service.resolveOwnerMembership(externalAccountId, companyId),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });
});
