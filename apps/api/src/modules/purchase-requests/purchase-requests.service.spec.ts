import { Test } from '@nestjs/testing';
import { ApiException } from '../../common/exceptions/api.exception';
import { PrismaService } from '../../prisma/prisma.service';
import { PurchaseRequestsService } from './purchase-requests.service';

describe('PurchaseRequestsService', () => {
  let service: PurchaseRequestsService;
  let prisma: {
    purchaseRequest: {
      findMany: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let tx: {
    product: { findMany: jest.Mock };
    purchaseRequest: { create: jest.Mock };
  };

  const purchaseRequestId = 'pr-1';
  const productId = 'product-1';

  function storedPurchaseRequest(overrides: Record<string, unknown> = {}) {
    return {
      id: purchaseRequestId,
      requestNumber: 'PR-2026-000001',
      status: 'draft',
      requestedById: null,
      requestedByName: null,
      requiredDate: null,
      notes: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      items: [],
      ...overrides,
    };
  }

  beforeEach(async () => {
    tx = {
      product: {
        findMany: jest
          .fn()
          .mockResolvedValue([{ id: productId, name: 'Copra' }]),
      },
      purchaseRequest: { create: jest.fn() },
    };
    prisma = {
      purchaseRequest: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn((fn: (t: unknown) => unknown) => fn(tx)),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        PurchaseRequestsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = moduleRef.get(PurchaseRequestsService);
  });

  const oneItem = [{ productId, quantity: 10, unit: 'ton' }];

  describe('findAll', () => {
    it('lists with no filters', async () => {
      const result = await service.findAll({
        page: 1,
        limit: 25,
        sort: '-created_at',
      });

      expect(prisma.purchaseRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
      expect(result.meta).toEqual(
        expect.objectContaining({ page: 1, limit: 25, total: 0 }),
      );
    });

    it('filters by status', async () => {
      await service.findAll({
        page: 1,
        limit: 25,
        sort: '-created_at',
        status: 'draft',
      });

      expect(prisma.purchaseRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: 'draft' } }),
      );
    });
  });

  describe('findOne', () => {
    it('returns the purchase request when found', async () => {
      prisma.purchaseRequest.findUnique.mockResolvedValue(
        storedPurchaseRequest(),
      );

      const result = await service.findOne(purchaseRequestId);

      expect(result.id).toBe(purchaseRequestId);
    });

    it('throws NOT_FOUND for a missing id', async () => {
      prisma.purchaseRequest.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toBeInstanceOf(
        ApiException,
      );
    });
  });

  describe('create', () => {
    it('creates a valid purchase request in draft status', async () => {
      tx.purchaseRequest.create.mockResolvedValue(storedPurchaseRequest());

      const result = await service.create({ items: oneItem });

      /* eslint-disable @typescript-eslint/no-unsafe-assignment -- expect.* matchers are untyped by Jest's own types. */
      expect(tx.purchaseRequest.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'draft' }),
        }),
      );
      /* eslint-enable @typescript-eslint/no-unsafe-assignment */
      expect(result.id).toBe(purchaseRequestId);
    });

    it('populates productNameSnapshot from the live Product master', async () => {
      tx.purchaseRequest.create.mockResolvedValue(storedPurchaseRequest());

      await service.create({ items: oneItem });

      /* eslint-disable @typescript-eslint/no-unsafe-member-access -- jest.Mock's own `.calls` type is untyped by Jest's own types. */
      const createArgs = tx.purchaseRequest.create.mock.calls[0][0] as {
        data: { items: { create: { productNameSnapshot: string }[] } };
      };
      /* eslint-enable @typescript-eslint/no-unsafe-member-access */
      expect(createArgs.data.items.create[0].productNameSnapshot).toBe('Copra');
    });

    it('creates multiple items', async () => {
      tx.product.findMany.mockResolvedValue([
        { id: 'product-1', name: 'Copra' },
        { id: 'product-2', name: 'Semi Husked Coconut' },
      ]);
      tx.purchaseRequest.create.mockResolvedValue(storedPurchaseRequest());

      await service.create({
        items: [
          { productId: 'product-1', quantity: 10, unit: 'ton' },
          { productId: 'product-2', quantity: 5, unit: 'ton' },
        ],
      });

      /* eslint-disable @typescript-eslint/no-unsafe-member-access -- jest.Mock's own `.calls` type is untyped by Jest's own types. */
      const createArgs = tx.purchaseRequest.create.mock.calls[0][0] as {
        data: { items: { create: unknown[] } };
      };
      /* eslint-enable @typescript-eslint/no-unsafe-member-access */
      expect(createArgs.data.items.create).toHaveLength(2);
    });

    it('rejects a non-existent product and creates nothing', async () => {
      tx.product.findMany.mockResolvedValue([]);

      await expect(
        service.create({
          items: [{ productId: 'missing', quantity: 1, unit: 'ton' }],
        }),
      ).rejects.toBeInstanceOf(ApiException);
      expect(tx.purchaseRequest.create).not.toHaveBeenCalled();
    });

    it('accepts optional requestedById/requestedByName/requiredDate/notes', async () => {
      tx.purchaseRequest.create.mockResolvedValue(storedPurchaseRequest());

      await service.create({
        items: oneItem,
        requestedById: 'admin-1',
        requestedByName: 'Jane Admin',
        requiredDate: '2026-05-01T00:00:00.000Z',
        notes: 'Urgent',
      });

      /* eslint-disable @typescript-eslint/no-unsafe-assignment -- expect.* matchers are untyped by Jest's own types. */
      expect(tx.purchaseRequest.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            requestedById: 'admin-1',
            requestedByName: 'Jane Admin',
            notes: 'Urgent',
          }),
        }),
      );
      /* eslint-enable @typescript-eslint/no-unsafe-assignment */
    });
  });

  describe('update', () => {
    it('updates notes/requiredDate', async () => {
      prisma.purchaseRequest.findUnique.mockResolvedValue(
        storedPurchaseRequest(),
      );
      prisma.purchaseRequest.update.mockResolvedValue(
        storedPurchaseRequest({ notes: 'Updated' }),
      );

      const result = await service.update(purchaseRequestId, {
        notes: 'Updated',
      });

      expect(result.notes).toBe('Updated');
    });

    it.each([
      ['draft', 'submitted'],
      ['draft', 'cancelled'],
      ['submitted', 'approved'],
      ['submitted', 'rejected'],
      ['submitted', 'cancelled'],
      ['approved', 'cancelled'],
    ])('allows the valid transition %s -> %s', async (from, to) => {
      prisma.purchaseRequest.findUnique.mockResolvedValue(
        storedPurchaseRequest({ status: from }),
      );
      prisma.purchaseRequest.update.mockResolvedValue(
        storedPurchaseRequest({ status: to }),
      );

      const result = await service.update(purchaseRequestId, {
        status: to as 'submitted' | 'approved' | 'rejected' | 'cancelled',
      });

      expect(result.status).toBe(to);
    });

    it.each([
      ['draft', 'approved'],
      ['submitted', 'draft'],
      ['approved', 'submitted'],
      ['rejected', 'submitted'],
      ['cancelled', 'submitted'],
    ])('rejects the invalid transition %s -> %s', async (from, to) => {
      prisma.purchaseRequest.findUnique.mockResolvedValue(
        storedPurchaseRequest({ status: from }),
      );

      await expect(
        service.update(purchaseRequestId, {
          status: to as 'submitted' | 'approved' | 'rejected' | 'cancelled',
        }),
      ).rejects.toBeInstanceOf(ApiException);
      expect(prisma.purchaseRequest.update).not.toHaveBeenCalled();
    });

    it('rejects setting status to converted directly (not part of UpdatePurchaseRequestDto)', async () => {
      prisma.purchaseRequest.findUnique.mockResolvedValue(
        storedPurchaseRequest({ status: 'approved' }),
      );

      await expect(
        service.update(purchaseRequestId, {
          status: 'converted' as never,
        }),
      ).rejects.toBeInstanceOf(ApiException);
      expect(prisma.purchaseRequest.update).not.toHaveBeenCalled();
    });

    it('rejects reopening a converted purchase request', async () => {
      prisma.purchaseRequest.findUnique.mockResolvedValue(
        storedPurchaseRequest({ status: 'converted' }),
      );

      await expect(
        service.update(purchaseRequestId, { status: 'cancelled' }),
      ).rejects.toBeInstanceOf(ApiException);
    });

    it('never allows items/requestNumber to be touched (not part of UpdatePurchaseRequestDto)', async () => {
      prisma.purchaseRequest.findUnique.mockResolvedValue(
        storedPurchaseRequest(),
      );
      prisma.purchaseRequest.update.mockResolvedValue(storedPurchaseRequest());

      await service.update(purchaseRequestId, {});

      /* eslint-disable @typescript-eslint/no-unsafe-member-access -- jest.Mock's own `.calls` type is untyped by Jest's own types. */
      const updateArgs = prisma.purchaseRequest.update.mock.calls[0][0] as {
        data: Record<string, unknown>;
      };
      /* eslint-enable @typescript-eslint/no-unsafe-member-access */
      expect(updateArgs.data).not.toHaveProperty('items');
      expect(updateArgs.data).not.toHaveProperty('requestNumber');
    });

    it('throws NOT_FOUND for a missing id', async () => {
      prisma.purchaseRequest.findUnique.mockResolvedValue(null);

      await expect(
        service.update('missing', { notes: 'x' }),
      ).rejects.toBeInstanceOf(ApiException);
    });
  });
});
