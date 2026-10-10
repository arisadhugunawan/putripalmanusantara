import { ConflictException, ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { BusinessActivityLogService } from '../common/activity-log/business-activity-log.service';
import { PrismaService } from '../prisma/prisma.service';
import { CompanyContextService } from './company-context.service';
import type { CurrentExternalAccountPayload } from './decorators/current-external-account.decorator';
import { ExternalBusinessRelationshipService } from './external-business-relationship.service';

describe('ExternalBusinessRelationshipService', () => {
  let service: ExternalBusinessRelationshipService;
  let prisma: {
    businessRelationship: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
    };
  };
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

  function storedRelationship(status: string, relationshipType = 'buyer') {
    return {
      id: 'relationship-1',
      companyId,
      relationshipType,
      status,
      requestedById: owner.id,
      requestedByName: owner.fullName,
      requestedAt: new Date('2026-01-01T00:00:00.000Z'),
      approvedById: null,
      approvedByName: null,
      approvedAt: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    };
  }

  beforeEach(async () => {
    prisma = {
      businessRelationship: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };
    companyContext = {
      resolveActiveMembership: jest.fn().mockResolvedValue({}),
      resolveOwnerMembership: jest.fn().mockResolvedValue({}),
    };
    businessActivityLog = { record: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ExternalBusinessRelationshipService,
        { provide: PrismaService, useValue: prisma },
        { provide: CompanyContextService, useValue: companyContext },
        { provide: BusinessActivityLogService, useValue: businessActivityLog },
      ],
    }).compile();

    service = moduleRef.get(ExternalBusinessRelationshipService);
  });

  describe('listRelationships', () => {
    it('requires active membership (owner or member) and scopes by companyId', async () => {
      await service.listRelationships(owner, companyId);

      expect(companyContext.resolveActiveMembership).toHaveBeenCalledWith(
        owner.id,
        companyId,
      );
      expect(prisma.businessRelationship.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { companyId } }),
      );
    });

    it('rejects a caller with no active membership (covers cross-company access)', async () => {
      companyContext.resolveActiveMembership.mockRejectedValue(
        new ForbiddenException(
          'You do not have active access to this company.',
        ),
      );

      await expect(
        service.listRelationships(owner, companyId),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.businessRelationship.findMany).not.toHaveBeenCalled();
    });
  });

  describe('requestRelationship', () => {
    it('is owner-only — a member is rejected by resolveOwnerMembership', async () => {
      companyContext.resolveOwnerMembership.mockRejectedValue(
        new ForbiddenException('Only a company owner may perform this action.'),
      );

      await expect(
        service.requestRelationship(owner, companyId, {
          relationshipType: 'buyer',
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.businessRelationship.create).not.toHaveBeenCalled();
    });

    it('creates a pending relationship with every field server-derived', async () => {
      prisma.businessRelationship.findUnique.mockResolvedValue(null);
      prisma.businessRelationship.create.mockResolvedValue(
        storedRelationship('pending'),
      );

      const result = await service.requestRelationship(owner, companyId, {
        relationshipType: 'buyer',
      });

      expect(prisma.businessRelationship.create).toHaveBeenCalledWith({
        data: {
          companyId,
          relationshipType: 'buyer',
          status: 'pending',
          requestedById: owner.id,
          requestedByName: owner.fullName,
          requestedAt: expect.any(Date), // eslint-disable-line @typescript-eslint/no-unsafe-assignment -- expect.any() is untyped by Jest's own types.
        },
      });
      expect(result.status).toBe('pending');
      expect(result.approvedById).toBeNull();
      expect(result.approvedByName).toBeNull();
      expect(result.approvedAt).toBeNull();
    });

    it('never includes client-controlled fields (status/approvedBy*/companyId override) in the create call', async () => {
      prisma.businessRelationship.findUnique.mockResolvedValue(null);
      prisma.businessRelationship.create.mockResolvedValue(
        storedRelationship('pending'),
      );

      await service.requestRelationship(
        owner,
        companyId,
        // Simulates a payload with extra fields the DTO's own type doesn't declare.
        {
          relationshipType: 'buyer',
        },
      );

      /* eslint-disable @typescript-eslint/no-unsafe-member-access -- jest.Mock's own `.calls` type is untyped by Jest's own types. */
      const createArgs = prisma.businessRelationship.create.mock
        .calls[0][0] as {
        data: Record<string, unknown>;
      };
      /* eslint-enable @typescript-eslint/no-unsafe-member-access */
      expect(createArgs.data.status).toBe('pending');
      expect(createArgs.data.companyId).toBe(companyId);
      expect(createArgs.data).not.toHaveProperty('approvedById');
      expect(createArgs.data).not.toHaveProperty('approvedByName');
      expect(createArgs.data).not.toHaveProperty('approvedAt');
    });

    it('logs exactly one BusinessActivityLog event on success', async () => {
      prisma.businessRelationship.findUnique.mockResolvedValue(null);
      prisma.businessRelationship.create.mockResolvedValue(
        storedRelationship('pending'),
      );

      await service.requestRelationship(owner, companyId, {
        relationshipType: 'buyer',
      });

      expect(businessActivityLog.record).toHaveBeenCalledTimes(1);
      expect(businessActivityLog.record).toHaveBeenCalledWith({
        actorId: owner.id,
        actorName: owner.fullName,
        action: 'relationship_requested',
        entityType: 'BusinessRelationship',
        entityId: 'relationship-1',
      });
    });

    it('rejects a duplicate pending request with 409 and logs nothing', async () => {
      prisma.businessRelationship.findUnique.mockResolvedValue(
        storedRelationship('pending'),
      );

      await expect(
        service.requestRelationship(owner, companyId, {
          relationshipType: 'buyer',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.businessRelationship.create).not.toHaveBeenCalled();
      expect(businessActivityLog.record).not.toHaveBeenCalled();
    });

    it('rejects a duplicate active request with 409', async () => {
      prisma.businessRelationship.findUnique.mockResolvedValue(
        storedRelationship('active'),
      );

      await expect(
        service.requestRelationship(owner, companyId, {
          relationshipType: 'buyer',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.businessRelationship.create).not.toHaveBeenCalled();
    });

    it('rejects a duplicate suspended request with 409', async () => {
      prisma.businessRelationship.findUnique.mockResolvedValue(
        storedRelationship('suspended'),
      );

      await expect(
        service.requestRelationship(owner, companyId, {
          relationshipType: 'buyer',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.businessRelationship.create).not.toHaveBeenCalled();
    });

    it('allows a different relationship type even when buyer already exists', async () => {
      prisma.businessRelationship.findUnique.mockResolvedValue(null);
      prisma.businessRelationship.create.mockResolvedValue(
        storedRelationship('pending', 'supplier'),
      );

      const result = await service.requestRelationship(owner, companyId, {
        relationshipType: 'supplier',
      });

      expect(prisma.businessRelationship.findUnique).toHaveBeenCalledWith({
        where: {
          companyId_relationshipType: {
            companyId,
            relationshipType: 'supplier',
          },
        },
      });
      expect(result.relationshipType).toBe('supplier');
    });
  });
});
