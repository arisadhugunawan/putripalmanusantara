import { Test } from '@nestjs/testing';
import { Prisma } from '../../../generated/prisma/client';
import { ApiException } from '../../common/exceptions/api.exception';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryService } from './inventory.service';

describe('InventoryService', () => {
  let service: InventoryService;
  let prisma: {
    inventory: { findMany: jest.Mock; count: jest.Mock; findUnique: jest.Mock };
    inventoryMovement: { count: jest.Mock };
    $transaction: jest.Mock;
  };
  let tx: {
    $queryRaw: jest.Mock;
    inventoryLot: { findUnique: jest.Mock };
    warehouse: { findUnique: jest.Mock };
    warehouseLocation: { findUnique: jest.Mock };
    inventory: {
      aggregate: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    inventoryMovement: { create: jest.Mock };
  };

  const lotId = 'lot-1';
  const warehouseId = 'wh-1';
  const locationId = 'loc-1';
  const productId = 'product-1';
  const inventoryId = 'inv-1';

  function storedLot(overrides: Record<string, unknown> = {}) {
    return {
      id: lotId,
      productId,
      quantity: new Prisma.Decimal(1000),
      unit: 'KG',
      status: 'quarantine',
      ...overrides,
    };
  }

  function storedWarehouse(overrides: Record<string, unknown> = {}) {
    return { id: warehouseId, status: 'active', ...overrides };
  }

  function storedLocation(overrides: Record<string, unknown> = {}) {
    return { id: locationId, warehouseId, status: 'active', ...overrides };
  }

  function storedInventory(overrides: Record<string, unknown> = {}) {
    return {
      id: inventoryId,
      warehouseId,
      warehouseLocationId: locationId,
      productId,
      inventoryLotId: lotId,
      quantity: new Prisma.Decimal(600),
      status: 'quarantine',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      ...overrides,
    };
  }

  beforeEach(async () => {
    tx = {
      $queryRaw: jest.fn().mockResolvedValue([{ id: lotId }]),
      inventoryLot: { findUnique: jest.fn().mockResolvedValue(storedLot()) },
      warehouse: { findUnique: jest.fn().mockResolvedValue(storedWarehouse()) },
      warehouseLocation: {
        findUnique: jest.fn().mockResolvedValue(storedLocation()),
      },
      inventory: {
        aggregate: jest.fn().mockResolvedValue({ _sum: { quantity: null } }),
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
        update: jest.fn(),
      },
      inventoryMovement: { create: jest.fn() },
    };
    prisma = {
      inventory: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        findUnique: jest.fn().mockResolvedValue(storedInventory()),
      },
      inventoryMovement: { count: jest.fn().mockResolvedValue(0) },
      $transaction: jest.fn((fn: (t: unknown) => unknown) => fn(tx)),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = moduleRef.get(InventoryService);
  });

  const baseDto = {
    warehouseId,
    warehouseLocationId: locationId,
    quantity: 600,
  };

  describe('findAll / findOne', () => {
    it('lists with no filters', async () => {
      const result = await service.findAll({
        page: 1,
        limit: 25,
        sort: '-created_at',
      });

      expect(prisma.inventory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
      expect(result.meta).toEqual(
        expect.objectContaining({ page: 1, limit: 25, total: 0 }),
      );
    });

    it('throws NOT_FOUND for a missing id', async () => {
      prisma.inventory.findUnique.mockResolvedValue(null);
      await expect(service.findOne('missing')).rejects.toBeInstanceOf(
        ApiException,
      );
    });
  });

  describe('createFromLot', () => {
    it('creates an Inventory row starting at quarantine when the lot is quarantine', async () => {
      tx.inventory.create.mockResolvedValue(storedInventory());

      const result = await service.createFromLot(lotId, baseDto);

      /* eslint-disable @typescript-eslint/no-unsafe-assignment -- expect.* matchers are untyped by Jest's own types. */
      expect(tx.inventory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'quarantine' }),
        }),
      );
      /* eslint-enable @typescript-eslint/no-unsafe-assignment */
      expect(result.id).toBe(inventoryId);
    });

    it('seeds the Inventory row as available when the lot has already released', async () => {
      tx.inventoryLot.findUnique.mockResolvedValue(
        storedLot({ status: 'available' }),
      );
      tx.inventory.create.mockResolvedValue(
        storedInventory({ status: 'available' }),
      );

      await service.createFromLot(lotId, baseDto);

      /* eslint-disable @typescript-eslint/no-unsafe-assignment -- expect.* matchers are untyped by Jest's own types. */
      expect(tx.inventory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'available' }),
        }),
      );
      /* eslint-enable @typescript-eslint/no-unsafe-assignment */
    });

    it('never seeds available ahead of the release gate — quarantine/hold both stay quarantine', async () => {
      tx.inventoryLot.findUnique.mockResolvedValue(
        storedLot({ status: 'hold' }),
      );
      tx.inventory.create.mockResolvedValue(storedInventory());

      await service.createFromLot(lotId, baseDto);

      /* eslint-disable @typescript-eslint/no-unsafe-assignment -- expect.* matchers are untyped by Jest's own types. */
      expect(tx.inventory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'quarantine' }),
        }),
      );
      /* eslint-enable @typescript-eslint/no-unsafe-assignment */
    });

    it('throws NOT_FOUND when the lot does not exist', async () => {
      tx.inventoryLot.findUnique.mockResolvedValue(null);

      await expect(
        service.createFromLot('missing', baseDto),
      ).rejects.toBeInstanceOf(ApiException);
      expect(tx.inventory.create).not.toHaveBeenCalled();
    });

    it('rejects a non-existent warehouse', async () => {
      tx.warehouse.findUnique.mockResolvedValue(null);

      await expect(
        service.createFromLot(lotId, baseDto),
      ).rejects.toBeInstanceOf(ApiException);
      expect(tx.inventory.create).not.toHaveBeenCalled();
    });

    it('rejects an inactive warehouse', async () => {
      tx.warehouse.findUnique.mockResolvedValue(
        storedWarehouse({ status: 'inactive' }),
      );

      await expect(
        service.createFromLot(lotId, baseDto),
      ).rejects.toBeInstanceOf(ApiException);
    });

    it('rejects a non-existent warehouse location', async () => {
      tx.warehouseLocation.findUnique.mockResolvedValue(null);

      await expect(
        service.createFromLot(lotId, baseDto),
      ).rejects.toBeInstanceOf(ApiException);
    });

    it('rejects an inactive warehouse location', async () => {
      tx.warehouseLocation.findUnique.mockResolvedValue(
        storedLocation({ status: 'inactive' }),
      );

      await expect(
        service.createFromLot(lotId, baseDto),
      ).rejects.toBeInstanceOf(ApiException);
    });

    it('rejects a warehouse location that does not belong to the selected warehouse', async () => {
      tx.warehouseLocation.findUnique.mockResolvedValue(
        storedLocation({ warehouseId: 'other-warehouse' }),
      );

      await expect(
        service.createFromLot(lotId, baseDto),
      ).rejects.toBeInstanceOf(ApiException);
    });

    it('allows splitting one lot across two different locations (600 + 400 = 1000)', async () => {
      tx.inventory.aggregate.mockResolvedValue({
        _sum: { quantity: new Prisma.Decimal(600) },
      });
      tx.inventory.create.mockResolvedValue(
        storedInventory({ quantity: new Prisma.Decimal(400) }),
      );

      const result = await service.createFromLot(lotId, {
        ...baseDto,
        quantity: 400,
      });

      expect(result.id).toBe(inventoryId);
    });

    it('rejects over-allocation beyond the remaining unplaced lot quantity', async () => {
      tx.inventory.aggregate.mockResolvedValue({
        _sum: { quantity: new Prisma.Decimal(700) },
      });

      await expect(
        service.createFromLot(lotId, { ...baseDto, quantity: 400 }),
      ).rejects.toBeInstanceOf(ApiException);
      expect(tx.inventory.create).not.toHaveBeenCalled();
    });

    it('increments an existing row for the exact same tuple rather than creating a duplicate', async () => {
      tx.inventory.findFirst.mockResolvedValue(storedInventory());
      tx.inventory.update.mockResolvedValue(
        storedInventory({ quantity: new Prisma.Decimal(1000) }),
      );

      const result = await service.createFromLot(lotId, baseDto);

      expect(tx.inventory.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: inventoryId },
          data: { quantity: { increment: new Prisma.Decimal(600) } },
        }),
      );
      expect(tx.inventory.create).not.toHaveBeenCalled();
      expect(result.id).toBe(inventoryId);
    });

    it('creates a receiving movement with the physically placed quantity', async () => {
      tx.inventory.create.mockResolvedValue(storedInventory());

      await service.createFromLot(lotId, baseDto);

      /* eslint-disable @typescript-eslint/no-unsafe-member-access -- jest.Mock's own `.calls` type is untyped by Jest's own types. */
      const movementArgs = tx.inventoryMovement.create.mock.calls[0][0] as {
        data: {
          movementType: string;
          quantity: Prisma.Decimal;
          inventoryLotId: string;
          referenceType: string;
          referenceId: string;
        };
      };
      /* eslint-enable @typescript-eslint/no-unsafe-member-access */
      expect(movementArgs.data.movementType).toBe('receiving');
      expect(movementArgs.data.quantity.toString()).toBe('600');
      expect(movementArgs.data.inventoryLotId).toBe(lotId);
      expect(movementArgs.data.referenceType).toBe('InventoryLot');
      expect(movementArgs.data.referenceId).toBe(lotId);
    });

    it('locks the InventoryLot (FOR UPDATE) before computing the existing placement sum', async () => {
      tx.inventory.create.mockResolvedValue(storedInventory());

      await service.createFromLot(lotId, baseDto);

      const lockOrder = tx.$queryRaw.mock.invocationCallOrder[0];
      const sumOrder = tx.inventory.aggregate.mock.invocationCallOrder[0];
      expect(lockOrder).toBeLessThan(sumOrder);
    });

    it('retries on a movement_number collision without failing', async () => {
      const collision = {
        code: 'P2002',
        meta: { target: ['movement_number'] },
      };
      tx.inventory.create
        .mockResolvedValueOnce(storedInventory())
        .mockResolvedValueOnce(storedInventory());
      tx.inventoryMovement.create
        .mockRejectedValueOnce(collision)
        .mockResolvedValueOnce(undefined);

      const result = await service.createFromLot(lotId, baseDto);

      expect(tx.inventoryMovement.create).toHaveBeenCalledTimes(2);
      expect(result.id).toBe(inventoryId);
    });

    it('never surfaces a raw Prisma/Postgres error after exhausting retries', async () => {
      const ambiguous = {
        code: 'P2039',
        meta: { driverAdapterError: { cause: { originalCode: '23505' } } },
      };
      tx.inventoryMovement.create.mockRejectedValue(ambiguous);
      tx.inventory.create.mockResolvedValue(storedInventory());

      await expect(
        service.createFromLot(lotId, baseDto),
      ).rejects.toBeInstanceOf(ApiException);
    });
  });
});
