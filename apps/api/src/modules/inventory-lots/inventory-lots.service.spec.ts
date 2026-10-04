import { Test } from '@nestjs/testing';
import { Prisma } from '../../../generated/prisma/client';
import { ApiException } from '../../common/exceptions/api.exception';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryLotsService } from './inventory-lots.service';

describe('InventoryLotsService', () => {
  let service: InventoryLotsService;
  let prisma: {
    inventoryLot: {
      findMany: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let tx: {
    $queryRaw: jest.Mock;
    receivingItem: { findUnique: jest.Mock };
    receiving: { findUnique: jest.Mock };
    inventoryLot: {
      aggregate: jest.Mock;
      create: jest.Mock;
      findUnique: jest.Mock;
      findUniqueOrThrow: jest.Mock;
      updateMany: jest.Mock;
    };
    qCInspection: { findFirst: jest.Mock; update: jest.Mock };
    inventory: { updateMany: jest.Mock };
  };

  const receivingItemId = 'rcvi-1';
  const receivingId = 'rcv-1';
  const lotId = 'lot-1';
  const productId = 'product-1';
  const warehouseId = 'wh-1';

  function storedReceivingItem(overrides: Record<string, unknown> = {}) {
    return {
      id: receivingItemId,
      receivingId,
      productId,
      purchaseOrderItemId: 'poi-1',
      quantityReceived: new Prisma.Decimal(1000),
      unit: 'KG',
      receiving: { supplierCompanyId: 'company-1', warehouseId },
      ...overrides,
    };
  }

  function storedInventoryLot(overrides: Record<string, unknown> = {}) {
    return {
      id: lotId,
      lotNumber: 'LOT-2026-000001',
      productId,
      receivingId,
      receivingItemId,
      supplierCompanyId: 'company-1',
      warehouseId,
      quantity: new Prisma.Decimal(400),
      unit: 'KG',
      status: 'quarantine',
      origin: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      ...overrides,
    };
  }

  beforeEach(async () => {
    tx = {
      $queryRaw: jest.fn().mockResolvedValue([{ id: receivingItemId }]),
      receivingItem: {
        findUnique: jest.fn().mockResolvedValue(storedReceivingItem()),
      },
      receiving: {
        findUnique: jest.fn().mockResolvedValue({ status: 'received' }),
      },
      inventoryLot: {
        aggregate: jest.fn().mockResolvedValue({ _sum: { quantity: null } }),
        create: jest.fn(),
        findUnique: jest.fn().mockResolvedValue(storedInventoryLot()),
        findUniqueOrThrow: jest
          .fn()
          .mockResolvedValue(storedInventoryLot({ status: 'available' })),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      qCInspection: {
        findFirst: jest
          .fn()
          .mockResolvedValue({ id: 'qc-1', status: 'passed' }),
        update: jest.fn(),
      },
      inventory: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
    };
    prisma = {
      inventoryLot: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        findUnique: jest.fn().mockResolvedValue(storedInventoryLot()),
        update: jest.fn(),
      },
      $transaction: jest.fn((fn: (t: unknown) => unknown) => fn(tx)),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        InventoryLotsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = moduleRef.get(InventoryLotsService);
  });

  describe('findAll / findOne', () => {
    it('lists with no filters', async () => {
      const result = await service.findAll({
        page: 1,
        limit: 25,
        sort: '-created_at',
      });

      expect(prisma.inventoryLot.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
      expect(result.meta).toEqual(
        expect.objectContaining({ page: 1, limit: 25, total: 0 }),
      );
    });

    it('returns the lot when found', async () => {
      const result = await service.findOne(lotId);
      expect(result.id).toBe(lotId);
    });

    it('throws NOT_FOUND for a missing id', async () => {
      prisma.inventoryLot.findUnique.mockResolvedValue(null);
      await expect(service.findOne('missing')).rejects.toBeInstanceOf(
        ApiException,
      );
    });
  });

  describe('createFromReceivingItem', () => {
    it('creates a lot starting at quarantine', async () => {
      tx.inventoryLot.create.mockResolvedValue(storedInventoryLot());

      const result = await service.createFromReceivingItem(receivingItemId, {
        quantity: 400,
      });

      /* eslint-disable @typescript-eslint/no-unsafe-assignment -- expect.* matchers are untyped by Jest's own types. */
      expect(tx.inventoryLot.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'quarantine' }),
        }),
      );
      /* eslint-enable @typescript-eslint/no-unsafe-assignment */
      expect(result.id).toBe(lotId);
    });

    it('derives productId/receivingId/warehouseId/supplierCompanyId/unit server-side', async () => {
      tx.inventoryLot.create.mockResolvedValue(storedInventoryLot());

      await service.createFromReceivingItem(receivingItemId, {
        quantity: 400,
        // Simulates a malicious payload — CreateInventoryLotDto has no such fields at all.
        productId: 'attacker-product',
        warehouseId: 'attacker-warehouse',
      } as never);

      /* eslint-disable @typescript-eslint/no-unsafe-assignment -- expect.* matchers are untyped by Jest's own types. */
      expect(tx.inventoryLot.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            productId,
            receivingId,
            warehouseId,
            supplierCompanyId: 'company-1',
            unit: 'KG',
          }),
        }),
      );
      /* eslint-enable @typescript-eslint/no-unsafe-assignment */
    });

    it('throws NOT_FOUND when the receiving item does not exist', async () => {
      tx.receivingItem.findUnique.mockResolvedValue(null);

      await expect(
        service.createFromReceivingItem('missing', { quantity: 100 }),
      ).rejects.toBeInstanceOf(ApiException);
      expect(tx.inventoryLot.create).not.toHaveBeenCalled();
    });

    it('rejects a receiving item with no purchaseOrderItemId', async () => {
      tx.receivingItem.findUnique.mockResolvedValue(
        storedReceivingItem({ purchaseOrderItemId: null }),
      );

      await expect(
        service.createFromReceivingItem(receivingItemId, { quantity: 100 }),
      ).rejects.toBeInstanceOf(ApiException);
      expect(tx.inventoryLot.create).not.toHaveBeenCalled();
    });

    it('rejects a receiving item with zero received quantity', async () => {
      tx.receivingItem.findUnique.mockResolvedValue(
        storedReceivingItem({ quantityReceived: new Prisma.Decimal(0) }),
      );

      await expect(
        service.createFromReceivingItem(receivingItemId, { quantity: 100 }),
      ).rejects.toBeInstanceOf(ApiException);
      expect(tx.inventoryLot.create).not.toHaveBeenCalled();
    });

    it('allows splitting one receiving item across multiple lots (400 + 600 = 1000)', async () => {
      tx.inventoryLot.aggregate.mockResolvedValue({
        _sum: { quantity: new Prisma.Decimal(400) },
      });
      tx.inventoryLot.create.mockResolvedValue(
        storedInventoryLot({ quantity: new Prisma.Decimal(600) }),
      );

      const result = await service.createFromReceivingItem(receivingItemId, {
        quantity: 600,
      });

      expect(result.id).toBe(lotId);
    });

    it('rejects over-allocation beyond the remaining receiving-item quantity', async () => {
      tx.inventoryLot.aggregate.mockResolvedValue({
        _sum: { quantity: new Prisma.Decimal(700) },
      });

      await expect(
        service.createFromReceivingItem(receivingItemId, { quantity: 400 }),
      ).rejects.toBeInstanceOf(ApiException);
      expect(tx.inventoryLot.create).not.toHaveBeenCalled();
    });

    it('locks the parent ReceivingItem (FOR UPDATE) before computing the existing lot sum', async () => {
      tx.inventoryLot.create.mockResolvedValue(storedInventoryLot());

      await service.createFromReceivingItem(receivingItemId, {
        quantity: 400,
      });

      const lockOrder = tx.$queryRaw.mock.invocationCallOrder[0];
      const sumOrder = tx.inventoryLot.aggregate.mock.invocationCallOrder[0];
      expect(lockOrder).toBeLessThan(sumOrder);
    });

    it('retries on a lot_number collision without failing', async () => {
      const collision = { code: 'P2002', meta: { target: ['lot_number'] } };
      tx.inventoryLot.create
        .mockRejectedValueOnce(collision)
        .mockResolvedValueOnce(
          storedInventoryLot({ lotNumber: 'LOT-2026-000002' }),
        );

      const result = await service.createFromReceivingItem(receivingItemId, {
        quantity: 400,
      });

      expect(tx.inventoryLot.create).toHaveBeenCalledTimes(2);
      expect(result.lotNumber).toBe('LOT-2026-000002');
    });
  });

  describe('createFromReceivingItem — receiving status eligibility', () => {
    it.each(['received', 'inspecting', 'completed'])(
      'allows a lot from a receiving with status "%s"',
      async (status) => {
        tx.receiving.findUnique.mockResolvedValue({ status });
        tx.inventoryLot.create.mockResolvedValue(storedInventoryLot());

        const result = await service.createFromReceivingItem(receivingItemId, {
          quantity: 400,
        });

        expect(result.id).toBe(lotId);
        expect(tx.inventoryLot.create).toHaveBeenCalledTimes(1);
      },
    );

    it.each(['draft', 'cancelled'])(
      'rejects a lot from a receiving with status "%s" with a 409 and creates nothing',
      async (status) => {
        tx.receiving.findUnique.mockResolvedValue({ status });

        await expect(
          service.createFromReceivingItem(receivingItemId, { quantity: 400 }),
        ).rejects.toMatchObject({ status: 409 });
        expect(tx.inventoryLot.create).not.toHaveBeenCalled();
      },
    );

    it('rejects when the parent receiving row no longer exists', async () => {
      tx.receiving.findUnique.mockResolvedValue(null);

      await expect(
        service.createFromReceivingItem(receivingItemId, { quantity: 400 }),
      ).rejects.toMatchObject({ status: 409 });
      expect(tx.inventoryLot.create).not.toHaveBeenCalled();
    });
  });

  describe('createFromReceivingItem — locking against receiving cancellation', () => {
    function lockCalls() {
      return (tx.$queryRaw.mock.calls as unknown[][]).map((call) => ({
        sql: (call[0] as string[]).join('?'),
        id: call[1] as string,
      }));
    }

    it('locks the receiving item (FOR UPDATE) first, then share-locks the parent receiving, in that order and by the right ids', async () => {
      tx.inventoryLot.create.mockResolvedValue(storedInventoryLot());

      await service.createFromReceivingItem(receivingItemId, { quantity: 400 });

      const calls = lockCalls();
      expect(calls).toHaveLength(2);
      expect(calls[0].sql).toContain('receiving_items');
      expect(calls[0].sql).toContain('FOR UPDATE');
      expect(calls[0].id).toBe(receivingItemId);
      expect(calls[1].sql).toContain('FROM receivings');
      expect(calls[1].sql).toContain('FOR SHARE');
      expect(calls[1].id).toBe(receivingId);
    });

    it('reads the receiving status only AFTER the receiving share-lock, so a cancellation committed first is always seen', async () => {
      tx.inventoryLot.create.mockResolvedValue(storedInventoryLot());

      await service.createFromReceivingItem(receivingItemId, { quantity: 400 });

      const shareLockOrder = tx.$queryRaw.mock.invocationCallOrder[1];
      const statusReadOrder =
        tx.receiving.findUnique.mock.invocationCallOrder[0];
      const createOrder = tx.inventoryLot.create.mock.invocationCallOrder[0];
      expect(shareLockOrder).toBeLessThan(statusReadOrder);
      expect(statusReadOrder).toBeLessThan(createOrder);
    });

    it('a receiving cancelled by a concurrent request before the share-lock was granted blocks lot creation', async () => {
      // The in-transaction status read (post-lock) sees the committed cancellation.
      tx.receiving.findUnique.mockResolvedValue({ status: 'cancelled' });

      await expect(
        service.createFromReceivingItem(receivingItemId, { quantity: 400 }),
      ).rejects.toMatchObject({ status: 409 });
      expect(tx.inventoryLot.create).not.toHaveBeenCalled();
    });

    it("reads the receiving status by the receiving item's own receivingId", async () => {
      tx.inventoryLot.create.mockResolvedValue(storedInventoryLot());

      await service.createFromReceivingItem(receivingItemId, { quantity: 400 });

      expect(tx.receiving.findUnique).toHaveBeenCalledWith({
        where: { id: receivingId },
        select: { status: true },
      });
    });
  });

  describe('release', () => {
    it('releases a quarantine lot with a passed inspection', async () => {
      const result = await service.release(lotId);

      expect(tx.inventoryLot.updateMany).toHaveBeenCalledWith({
        where: { id: lotId, status: 'quarantine' },
        data: { status: 'available' },
      });
      expect(tx.qCInspection.update).toHaveBeenCalledWith({
        where: { id: 'qc-1' },
        data: { status: 'released' },
      });
      expect(result.status).toBe('available');
    });

    it('moves every quarantine Inventory placement of the lot to available', async () => {
      await service.release(lotId);

      expect(tx.inventory.updateMany).toHaveBeenCalledWith({
        where: { inventoryLotId: lotId, status: 'quarantine' },
        data: { status: 'available' },
      });
    });

    it('only targets Inventory rows still in quarantine (never reopens hold/blocked/depleted)', async () => {
      await service.release(lotId);

      /* eslint-disable @typescript-eslint/no-unsafe-member-access -- jest.Mock's own `.calls` type is untyped by Jest's own types. */
      const args = tx.inventory.updateMany.mock.calls[0][0] as {
        where: { status: string };
      };
      /* eslint-enable @typescript-eslint/no-unsafe-member-access */
      expect(args.where.status).toBe('quarantine');
    });

    it('succeeds when the lot has no Inventory placements yet', async () => {
      tx.inventory.updateMany.mockResolvedValue({ count: 0 });

      const result = await service.release(lotId);

      expect(result.status).toBe('available');
    });

    it('updates Inventory only after the lot lock and the lot status change (lot -> inventory order)', async () => {
      await service.release(lotId);

      const lockOrder = tx.$queryRaw.mock.invocationCallOrder[0];
      const lotUpdateOrder =
        tx.inventoryLot.updateMany.mock.invocationCallOrder[0];
      const inventoryOrder =
        tx.inventory.updateMany.mock.invocationCallOrder[0];
      expect(lockOrder).toBeLessThan(lotUpdateOrder);
      expect(lotUpdateOrder).toBeLessThan(inventoryOrder);
    });

    it('does not touch Inventory when release is rejected (no passed inspection)', async () => {
      tx.qCInspection.findFirst.mockResolvedValue(null);

      await expect(service.release(lotId)).rejects.toBeInstanceOf(ApiException);
      expect(tx.inventory.updateMany).not.toHaveBeenCalled();
    });

    it('does not touch Inventory when the conditional lot update loses the race', async () => {
      tx.inventoryLot.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.release(lotId)).rejects.toBeInstanceOf(ApiException);
      expect(tx.inventory.updateMany).not.toHaveBeenCalled();
    });

    it('rejects release without a passed inspection', async () => {
      tx.qCInspection.findFirst.mockResolvedValue(null);

      await expect(service.release(lotId)).rejects.toBeInstanceOf(ApiException);
      expect(tx.inventoryLot.updateMany).not.toHaveBeenCalled();
    });

    it.each(['hold', 'rejected', 'available', 'consumed', 'closed'])(
      'rejects release for a lot with status "%s"',
      async (status) => {
        tx.inventoryLot.findUnique.mockResolvedValue(
          storedInventoryLot({ status }),
        );

        await expect(service.release(lotId)).rejects.toBeInstanceOf(
          ApiException,
        );
        expect(tx.inventoryLot.updateMany).not.toHaveBeenCalled();
      },
    );

    it('throws NOT_FOUND when the lot does not exist', async () => {
      tx.inventoryLot.findUnique.mockResolvedValue(null);

      await expect(service.release('missing')).rejects.toBeInstanceOf(
        ApiException,
      );
    });

    it('locks the lot (FOR UPDATE) before checking eligibility', async () => {
      await service.release(lotId);

      const lockOrder = tx.$queryRaw.mock.invocationCallOrder[0];
      const findOrder = tx.inventoryLot.findUnique.mock.invocationCallOrder[0];
      expect(lockOrder).toBeLessThan(findOrder);
    });

    it('rolls back with a clean conflict if the conditional update matches zero rows (race already lost)', async () => {
      tx.inventoryLot.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.release(lotId)).rejects.toBeInstanceOf(ApiException);
    });
  });

  describe('reject', () => {
    it.each(['quarantine', 'hold'])(
      'rejects a lot from status "%s"',
      async (status) => {
        prisma.inventoryLot.findUnique.mockResolvedValue(
          storedInventoryLot({ status }),
        );
        prisma.inventoryLot.update.mockResolvedValue(
          storedInventoryLot({ status: 'rejected' }),
        );

        const result = await service.reject(lotId);

        expect(result.status).toBe('rejected');
      },
    );

    it("leaves the lot's Inventory placements untouched (rejected-lot mapping is a separate business rule)", async () => {
      prisma.inventoryLot.update.mockResolvedValue(
        storedInventoryLot({ status: 'rejected' }),
      );

      await service.reject(lotId);

      expect(tx.inventory.updateMany).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it.each(['available', 'consumed', 'closed', 'rejected'])(
      'rejects the reject action itself for a lot already in status "%s"',
      async (status) => {
        prisma.inventoryLot.findUnique.mockResolvedValue(
          storedInventoryLot({ status }),
        );

        await expect(service.reject(lotId)).rejects.toBeInstanceOf(
          ApiException,
        );
        expect(prisma.inventoryLot.update).not.toHaveBeenCalled();
      },
    );
  });
});
