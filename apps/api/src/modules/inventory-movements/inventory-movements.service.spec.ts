import { Test } from '@nestjs/testing';
import { Prisma } from '../../../generated/prisma/client';
import { ApiException } from '../../common/exceptions/api.exception';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryMovementsService } from './inventory-movements.service';

describe('InventoryMovementsService', () => {
  let service: InventoryMovementsService;
  let prisma: {
    inventoryMovement: {
      findMany: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
    };
  };

  const movementId = 'im-1';

  function storedMovement(overrides: Record<string, unknown> = {}) {
    return {
      id: movementId,
      movementNumber: 'IM-2026-000001',
      inventoryId: 'inv-1',
      inventoryLotId: 'lot-1',
      warehouseId: 'wh-1',
      warehouseLocationId: 'loc-1',
      productId: 'product-1',
      movementType: 'receiving',
      quantity: new Prisma.Decimal(600),
      unit: 'KG',
      referenceType: 'InventoryLot',
      referenceId: 'lot-1',
      notes: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      ...overrides,
    };
  }

  beforeEach(async () => {
    prisma = {
      inventoryMovement: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        findUnique: jest.fn().mockResolvedValue(storedMovement()),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        InventoryMovementsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = moduleRef.get(InventoryMovementsService);
  });

  describe('findAll', () => {
    it('lists with no filters', async () => {
      const result = await service.findAll({
        page: 1,
        limit: 25,
        sort: '-created_at',
      });

      expect(prisma.inventoryMovement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
      expect(result.meta).toEqual(
        expect.objectContaining({ page: 1, limit: 25, total: 0 }),
      );
    });

    it('filters by movementType/inventoryLotId/warehouseId/productId/inventoryId', async () => {
      await service.findAll({
        page: 1,
        limit: 25,
        sort: '-created_at',
        movementType: 'receiving',
        inventoryLotId: 'lot-1',
        warehouseId: 'wh-1',
        productId: 'product-1',
        inventoryId: 'inv-1',
      });

      expect(prisma.inventoryMovement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            movementType: 'receiving',
            inventoryId: 'inv-1',
            inventoryLotId: 'lot-1',
            warehouseId: 'wh-1',
            productId: 'product-1',
          },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('returns the movement when found', async () => {
      const result = await service.findOne(movementId);
      expect(result.id).toBe(movementId);
    });

    it('throws NOT_FOUND for a missing id', async () => {
      prisma.inventoryMovement.findUnique.mockResolvedValue(null);
      await expect(service.findOne('missing')).rejects.toBeInstanceOf(
        ApiException,
      );
    });
  });
});
