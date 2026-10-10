import { Test } from '@nestjs/testing';
import { ApiException } from '../../common/exceptions/api.exception';
import type { CurrentAdminPayload } from '../../common/decorators/current-admin.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminBusinessRelationshipsService } from './admin-business-relationships.service';

describe('AdminBusinessRelationshipsService', () => {
  let service: AdminBusinessRelationshipsService;
  let prisma: {
    businessRelationship: {
      findMany: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  const superAdmin: CurrentAdminPayload = {
    id: 'admin-1',
    name: 'Super Admin',
    email: 'admin@ppn.example',
    role: 'super_admin',
  };
  const company = { id: 'company-1', name: 'Buyer Co' };
  const relationshipId = 'relationship-1';

  function storedRelationship(
    status: string,
    overrides: Record<string, unknown> = {},
  ) {
    return {
      id: relationshipId,
      companyId: company.id,
      company,
      relationshipType: 'buyer',
      status,
      requestedById: 'external-1',
      requestedByName: 'Requester',
      requestedAt: new Date('2026-01-01T00:00:00.000Z'),
      approvedById: null,
      approvedByName: null,
      approvedAt: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      ...overrides,
    };
  }

  beforeEach(async () => {
    prisma = {
      businessRelationship: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AdminBusinessRelationshipsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = moduleRef.get(AdminBusinessRelationshipsService);
  });

  describe('list', () => {
    it('lists with no filters and returns pagination meta', async () => {
      const result = await service.list({ page: 1, limit: 25 });

      expect(prisma.businessRelationship.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
      expect(result.meta).toEqual(
        expect.objectContaining({ page: 1, limit: 25, total: 0 }),
      );
    });

    it('filters by status', async () => {
      await service.list({ page: 1, limit: 25, status: 'pending' });

      expect(prisma.businessRelationship.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: 'pending' } }),
      );
    });

    it('filters by relationshipType', async () => {
      await service.list({ page: 1, limit: 25, relationshipType: 'supplier' });

      expect(prisma.businessRelationship.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { relationshipType: 'supplier' } }),
      );
    });

    it('filters by companyId', async () => {
      await service.list({ page: 1, limit: 25, companyId: company.id });

      expect(prisma.businessRelationship.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { companyId: company.id } }),
      );
    });
  });

  describe('findOne', () => {
    it('returns the full detail shape', async () => {
      prisma.businessRelationship.findUnique.mockResolvedValue(
        storedRelationship('pending'),
      );

      const result = await service.findOne(relationshipId);

      expect(result).toEqual(
        expect.objectContaining({
          id: relationshipId,
          company,
          relationshipType: 'buyer',
          status: 'pending',
          requestedById: 'external-1',
        }),
      );
    });

    it('throws a safe NOT_FOUND for a missing id', async () => {
      prisma.businessRelationship.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing-id')).rejects.toBeInstanceOf(
        ApiException,
      );
    });
  });

  describe('approve', () => {
    it('transitions pending -> active and sets approvedBy*/approvedAt', async () => {
      prisma.businessRelationship.findUnique.mockResolvedValue(
        storedRelationship('pending'),
      );
      prisma.businessRelationship.update.mockResolvedValue(
        storedRelationship('active', {
          approvedById: superAdmin.id,
          approvedByName: superAdmin.name,
          approvedAt: new Date('2026-02-01T00:00:00.000Z'),
        }),
      );

      const result = await service.approve(superAdmin, relationshipId);

      /* eslint-disable @typescript-eslint/no-unsafe-assignment -- expect.* matchers are untyped by Jest's own types. */
      expect(prisma.businessRelationship.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: relationshipId },
          data: expect.objectContaining({
            status: 'active',
            approvedById: superAdmin.id,
            approvedByName: superAdmin.name,
          }),
        }),
      );
      /* eslint-enable @typescript-eslint/no-unsafe-assignment */
      expect(result.status).toBe('active');
      expect(result.approvedById).toBe(superAdmin.id);
    });

    it('preserves requestedBy* fields unchanged on approval', async () => {
      prisma.businessRelationship.findUnique.mockResolvedValue(
        storedRelationship('pending'),
      );
      prisma.businessRelationship.update.mockResolvedValue(
        storedRelationship('active'),
      );

      await service.approve(superAdmin, relationshipId);

      /* eslint-disable @typescript-eslint/no-unsafe-member-access -- jest.Mock's own `.calls` type is untyped by Jest's own types. */
      const updateArgs = prisma.businessRelationship.update.mock
        .calls[0][0] as {
        data: Record<string, unknown>;
      };
      /* eslint-enable @typescript-eslint/no-unsafe-member-access */
      expect(updateArgs.data).not.toHaveProperty('requestedById');
      expect(updateArgs.data).not.toHaveProperty('requestedByName');
      expect(updateArgs.data).not.toHaveProperty('requestedAt');
    });

    it('does not overwrite an existing approvedAt/approvedById/approvedByName', async () => {
      const originalApprovedAt = new Date('2026-01-05T00:00:00.000Z');
      prisma.businessRelationship.findUnique.mockResolvedValue(
        storedRelationship('pending', {
          approvedById: 'admin-original',
          approvedByName: 'Original Approver',
          approvedAt: originalApprovedAt,
        }),
      );
      prisma.businessRelationship.update.mockResolvedValue(
        storedRelationship('active'),
      );

      await service.approve(superAdmin, relationshipId);

      /* eslint-disable @typescript-eslint/no-unsafe-assignment -- expect.* matchers are untyped by Jest's own types. */
      expect(prisma.businessRelationship.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            approvedById: 'admin-original',
            approvedByName: 'Original Approver',
            approvedAt: originalApprovedAt,
          }),
        }),
      );
      /* eslint-enable @typescript-eslint/no-unsafe-assignment */
    });

    it('rejects approving an already-active relationship', async () => {
      prisma.businessRelationship.findUnique.mockResolvedValue(
        storedRelationship('active'),
      );

      await expect(
        service.approve(superAdmin, relationshipId),
      ).rejects.toBeInstanceOf(ApiException);
      expect(prisma.businessRelationship.update).not.toHaveBeenCalled();
    });

    it('rejects approving a suspended relationship', async () => {
      prisma.businessRelationship.findUnique.mockResolvedValue(
        storedRelationship('suspended'),
      );

      await expect(
        service.approve(superAdmin, relationshipId),
      ).rejects.toBeInstanceOf(ApiException);
      expect(prisma.businessRelationship.update).not.toHaveBeenCalled();
    });
  });

  describe('reject', () => {
    it('deletes a pending relationship', async () => {
      prisma.businessRelationship.findUnique.mockResolvedValue(
        storedRelationship('pending'),
      );

      const result = await service.reject(relationshipId);

      expect(prisma.businessRelationship.delete).toHaveBeenCalledWith({
        where: { id: relationshipId },
      });
      expect(result).toEqual({ id: relationshipId, deleted: true });
    });

    it('rejects deleting an active relationship', async () => {
      prisma.businessRelationship.findUnique.mockResolvedValue(
        storedRelationship('active'),
      );

      await expect(service.reject(relationshipId)).rejects.toBeInstanceOf(
        ApiException,
      );
      expect(prisma.businessRelationship.delete).not.toHaveBeenCalled();
    });

    it('rejects deleting a suspended relationship', async () => {
      prisma.businessRelationship.findUnique.mockResolvedValue(
        storedRelationship('suspended'),
      );

      await expect(service.reject(relationshipId)).rejects.toBeInstanceOf(
        ApiException,
      );
      expect(prisma.businessRelationship.delete).not.toHaveBeenCalled();
    });
  });

  describe('suspend', () => {
    it('transitions active -> suspended without touching approvedAt', async () => {
      prisma.businessRelationship.findUnique.mockResolvedValue(
        storedRelationship('active', {
          approvedById: 'admin-original',
          approvedByName: 'Original Approver',
          approvedAt: new Date('2026-01-05T00:00:00.000Z'),
        }),
      );
      prisma.businessRelationship.update.mockResolvedValue(
        storedRelationship('suspended'),
      );

      await service.suspend(relationshipId);

      expect(prisma.businessRelationship.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: relationshipId },
          data: { status: 'suspended' },
        }),
      );
    });

    it('rejects suspending a pending relationship', async () => {
      prisma.businessRelationship.findUnique.mockResolvedValue(
        storedRelationship('pending'),
      );

      await expect(service.suspend(relationshipId)).rejects.toBeInstanceOf(
        ApiException,
      );
      expect(prisma.businessRelationship.update).not.toHaveBeenCalled();
    });

    it('rejects suspending an already-suspended relationship', async () => {
      prisma.businessRelationship.findUnique.mockResolvedValue(
        storedRelationship('suspended'),
      );

      await expect(service.suspend(relationshipId)).rejects.toBeInstanceOf(
        ApiException,
      );
      expect(prisma.businessRelationship.update).not.toHaveBeenCalled();
    });
  });

  describe('reactivate', () => {
    it('transitions suspended -> active without touching approvedAt', async () => {
      prisma.businessRelationship.findUnique.mockResolvedValue(
        storedRelationship('suspended', {
          approvedById: 'admin-original',
          approvedByName: 'Original Approver',
          approvedAt: new Date('2026-01-05T00:00:00.000Z'),
        }),
      );
      prisma.businessRelationship.update.mockResolvedValue(
        storedRelationship('active'),
      );

      await service.reactivate(relationshipId);

      expect(prisma.businessRelationship.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: relationshipId },
          data: { status: 'active' },
        }),
      );
    });

    it('rejects reactivating a pending relationship', async () => {
      prisma.businessRelationship.findUnique.mockResolvedValue(
        storedRelationship('pending'),
      );

      await expect(service.reactivate(relationshipId)).rejects.toBeInstanceOf(
        ApiException,
      );
      expect(prisma.businessRelationship.update).not.toHaveBeenCalled();
    });

    it('rejects reactivating an already-active relationship', async () => {
      prisma.businessRelationship.findUnique.mockResolvedValue(
        storedRelationship('active'),
      );

      await expect(service.reactivate(relationshipId)).rejects.toBeInstanceOf(
        ApiException,
      );
      expect(prisma.businessRelationship.update).not.toHaveBeenCalled();
    });
  });
});
