import { Test } from '@nestjs/testing';
import { ApiException } from '../../common/exceptions/api.exception';
import { PrismaService } from '../../prisma/prisma.service';
import { QcService } from './qc.service';

describe('QcService', () => {
  let service: QcService;
  let prisma: {
    qCInspection: {
      findMany: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let tx: {
    inventoryLot: { findUnique: jest.Mock; updateMany: jest.Mock };
    qCInspection: {
      create: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    qCResult: { create: jest.Mock };
  };

  const lotId = 'lot-1';
  const inspectionId = 'qc-1';

  function storedLot(overrides: Record<string, unknown> = {}) {
    return { id: lotId, status: 'quarantine', ...overrides };
  }

  function storedInspection(overrides: Record<string, unknown> = {}) {
    return {
      id: inspectionId,
      inspectionNumber: 'QC-2026-000001',
      inventoryLotId: lotId,
      inspectionType: 'incoming',
      inspectorId: null,
      inspectorName: null,
      inspectedAt: new Date('2026-01-01T00:00:00.000Z'),
      status: 'pending',
      notes: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      results: [],
      ...overrides,
    };
  }

  beforeEach(async () => {
    tx = {
      inventoryLot: {
        findUnique: jest.fn().mockResolvedValue(storedLot()),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      qCInspection: {
        create: jest.fn(),
        findUnique: jest.fn().mockResolvedValue(storedInspection()),
        update: jest.fn().mockResolvedValue(storedInspection()),
      },
      qCResult: { create: jest.fn() },
    };
    prisma = {
      qCInspection: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        findUnique: jest.fn().mockResolvedValue(storedInspection()),
        update: jest.fn(),
      },
      $transaction: jest.fn((fn: (t: unknown) => unknown) => fn(tx)),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [QcService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(QcService);
  });

  describe('findAll / findOne', () => {
    it('lists with no filters', async () => {
      const result = await service.findAll({
        page: 1,
        limit: 25,
        sort: '-created_at',
      });

      expect(prisma.qCInspection.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
      expect(result.meta).toEqual(
        expect.objectContaining({ page: 1, limit: 25, total: 0 }),
      );
    });

    it('returns the inspection when found', async () => {
      const result = await service.findOne(inspectionId);
      expect(result.id).toBe(inspectionId);
    });

    it('throws NOT_FOUND for a missing id', async () => {
      prisma.qCInspection.findUnique.mockResolvedValue(null);
      await expect(service.findOne('missing')).rejects.toBeInstanceOf(
        ApiException,
      );
    });
  });

  describe('createFromInventoryLot', () => {
    it('creates a pending inspection, never a client-chosen status', async () => {
      tx.qCInspection.create.mockResolvedValue(storedInspection());

      await service.createFromInventoryLot(lotId, {
        inspectionType: 'incoming',
      });

      /* eslint-disable @typescript-eslint/no-unsafe-assignment -- expect.* matchers are untyped by Jest's own types. */
      expect(tx.qCInspection.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'pending' }),
        }),
      );
      /* eslint-enable @typescript-eslint/no-unsafe-assignment */
    });

    it.each(['incoming', 'release'])(
      'allows a "%s" inspection on a quarantine lot',
      async (inspectionType) => {
        tx.qCInspection.create.mockResolvedValue(storedInspection());

        const result = await service.createFromInventoryLot(lotId, {
          inspectionType: inspectionType as 'incoming' | 'release',
        });

        expect(result.id).toBe(inspectionId);
      },
    );

    it('rejects an "incoming" inspection on a non-quarantine lot', async () => {
      tx.inventoryLot.findUnique.mockResolvedValue(
        storedLot({ status: 'hold' }),
      );

      await expect(
        service.createFromInventoryLot(lotId, { inspectionType: 'incoming' }),
      ).rejects.toBeInstanceOf(ApiException);
      expect(tx.qCInspection.create).not.toHaveBeenCalled();
    });

    it('allows a "reinspection" on a hold lot', async () => {
      tx.inventoryLot.findUnique.mockResolvedValue(
        storedLot({ status: 'hold' }),
      );
      tx.qCInspection.create.mockResolvedValue(
        storedInspection({ inspectionType: 'reinspection' }),
      );

      const result = await service.createFromInventoryLot(lotId, {
        inspectionType: 'reinspection',
      });

      expect(result.id).toBe(inspectionId);
    });

    it('rejects a "reinspection" on a quarantine lot', async () => {
      await expect(
        service.createFromInventoryLot(lotId, {
          inspectionType: 'reinspection',
        }),
      ).rejects.toBeInstanceOf(ApiException);
      expect(tx.qCInspection.create).not.toHaveBeenCalled();
    });

    it('throws NOT_FOUND when the inventory lot does not exist', async () => {
      tx.inventoryLot.findUnique.mockResolvedValue(null);

      await expect(
        service.createFromInventoryLot('missing', {
          inspectionType: 'incoming',
        }),
      ).rejects.toBeInstanceOf(ApiException);
    });

    it('retries on an inspection_number collision without failing', async () => {
      const collision = {
        code: 'P2002',
        meta: { target: ['inspection_number'] },
      };
      tx.qCInspection.create
        .mockRejectedValueOnce(collision)
        .mockResolvedValueOnce(
          storedInspection({ inspectionNumber: 'QC-2026-000002' }),
        );

      const result = await service.createFromInventoryLot(lotId, {
        inspectionType: 'incoming',
      });

      expect(tx.qCInspection.create).toHaveBeenCalledTimes(2);
      expect(result.inspectionNumber).toBe('QC-2026-000002');
    });
  });

  describe('createResult — roll-up', () => {
    it('requires at least one result before any roll-up happens (new inspection stays pending)', async () => {
      const result = await service.findOne(inspectionId);
      expect(result.status).toBe('pending');
    });

    it.each([
      [['pass', 'pass'], 'passed'],
      [['pass', 'na'], 'passed'],
      [['na', 'na'], 'passed'],
      [['pass', 'fail'], 'failed'],
      [['fail', 'fail'], 'failed'],
    ])('rolls up %p to "%s"', async (results, expectedStatus) => {
      let existingResults: { result: string }[] = [];
      tx.qCInspection.findUnique.mockImplementation(() =>
        Promise.resolve(storedInspection({ results: existingResults })),
      );
      tx.qCInspection.update.mockImplementation(
        (args: { data: { status: string } }) =>
          Promise.resolve(storedInspection({ status: args.data.status })),
      );

      let lastResult: { status: string } | undefined;
      for (const r of results as ('pass' | 'fail' | 'na')[]) {
        lastResult = await service.createResult(inspectionId, {
          parameter: 'Moisture',
          result: r,
        });
        existingResults = [...existingResults, { result: r }];
      }

      expect(lastResult?.status).toBe(expectedStatus);
    });

    it('rejects adding a result to a released inspection', async () => {
      tx.qCInspection.findUnique.mockResolvedValue(
        storedInspection({ status: 'released' }),
      );

      await expect(
        service.createResult(inspectionId, {
          parameter: 'Moisture',
          result: 'pass',
        }),
      ).rejects.toBeInstanceOf(ApiException);
      expect(tx.qCResult.create).not.toHaveBeenCalled();
    });

    it('rejects adding a result to a cancelled inspection', async () => {
      tx.qCInspection.findUnique.mockResolvedValue(
        storedInspection({ status: 'cancelled' }),
      );

      await expect(
        service.createResult(inspectionId, {
          parameter: 'Moisture',
          result: 'pass',
        }),
      ).rejects.toBeInstanceOf(ApiException);
      expect(tx.qCResult.create).not.toHaveBeenCalled();
    });

    it('throws NOT_FOUND when the inspection does not exist', async () => {
      tx.qCInspection.findUnique.mockResolvedValue(null);

      await expect(
        service.createResult('missing', {
          parameter: 'Moisture',
          result: 'pass',
        }),
      ).rejects.toBeInstanceOf(ApiException);
    });
  });

  describe('createResult — lot side effects', () => {
    it('moves an incoming-failed lot from quarantine to hold', async () => {
      tx.qCInspection.findUnique.mockResolvedValue(
        storedInspection({ inspectionType: 'incoming', results: [] }),
      );

      await service.createResult(inspectionId, {
        parameter: 'Moisture',
        result: 'fail',
      });

      expect(tx.inventoryLot.updateMany).toHaveBeenCalledWith({
        where: { id: lotId, status: 'quarantine' },
        data: { status: 'hold' },
      });
    });

    it('moves a reinspection-failed lot from quarantine to hold', async () => {
      tx.qCInspection.findUnique.mockResolvedValue(
        storedInspection({ inspectionType: 'reinspection', results: [] }),
      );

      await service.createResult(inspectionId, {
        parameter: 'Moisture',
        result: 'fail',
      });

      expect(tx.inventoryLot.updateMany).toHaveBeenCalledWith({
        where: { id: lotId, status: 'quarantine' },
        data: { status: 'hold' },
      });
    });

    it('does not touch the lot when a release-type inspection fails (not named in the locked rule)', async () => {
      tx.qCInspection.findUnique.mockResolvedValue(
        storedInspection({ inspectionType: 'release', results: [] }),
      );

      await service.createResult(inspectionId, {
        parameter: 'Moisture',
        result: 'fail',
      });

      expect(tx.inventoryLot.updateMany).not.toHaveBeenCalled();
    });

    it('moves a reinspection-passed lot from hold back to quarantine', async () => {
      tx.qCInspection.findUnique.mockResolvedValue(
        storedInspection({ inspectionType: 'reinspection', results: [] }),
      );

      await service.createResult(inspectionId, {
        parameter: 'Moisture',
        result: 'pass',
      });

      expect(tx.inventoryLot.updateMany).toHaveBeenCalledWith({
        where: { id: lotId, status: 'hold' },
        data: { status: 'quarantine' },
      });
    });

    it('does not touch the lot when an incoming inspection passes (lot already quarantine, no change needed)', async () => {
      tx.qCInspection.findUnique.mockResolvedValue(
        storedInspection({ inspectionType: 'incoming', results: [] }),
      );

      await service.createResult(inspectionId, {
        parameter: 'Moisture',
        result: 'pass',
      });

      expect(tx.inventoryLot.updateMany).not.toHaveBeenCalled();
    });

    it('a passed inspection never releases the lot automatically — only /release does', async () => {
      tx.qCInspection.findUnique.mockResolvedValue(
        storedInspection({ inspectionType: 'incoming', results: [] }),
      );

      await service.createResult(inspectionId, {
        parameter: 'Moisture',
        result: 'pass',
      });

      // No call anywhere sets status: 'available' — the only updateMany target status this
      // service ever uses is 'hold' (on failure) or 'quarantine' (on reinspection pass).
      /* eslint-disable @typescript-eslint/no-unsafe-assignment -- expect.* matchers are untyped by Jest's own types. */
      expect(tx.inventoryLot.updateMany).not.toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'available' }),
        }),
      );
      /* eslint-enable @typescript-eslint/no-unsafe-assignment */
    });
  });

  describe('update', () => {
    it('allows cancelling a failed inspection', async () => {
      prisma.qCInspection.findUnique.mockResolvedValue(
        storedInspection({ status: 'failed' }),
      );
      prisma.qCInspection.update.mockResolvedValue(
        storedInspection({ status: 'cancelled' }),
      );

      const result = await service.update(inspectionId, {
        status: 'cancelled',
      });

      expect(result.status).toBe('cancelled');
    });

    it.each(['pending', 'in_progress', 'passed', 'released', 'cancelled'])(
      'rejects cancelling an inspection with status "%s"',
      async (status) => {
        prisma.qCInspection.findUnique.mockResolvedValue(
          storedInspection({ status }),
        );

        await expect(
          service.update(inspectionId, { status: 'cancelled' }),
        ).rejects.toBeInstanceOf(ApiException);
        expect(prisma.qCInspection.update).not.toHaveBeenCalled();
      },
    );

    it('released inspection is terminal', async () => {
      prisma.qCInspection.findUnique.mockResolvedValue(
        storedInspection({ status: 'released' }),
      );

      await expect(
        service.update(inspectionId, { status: 'cancelled' }),
      ).rejects.toBeInstanceOf(ApiException);
    });

    it('throws NOT_FOUND for a missing id', async () => {
      prisma.qCInspection.findUnique.mockResolvedValue(null);

      await expect(
        service.update('missing', { status: 'cancelled' }),
      ).rejects.toBeInstanceOf(ApiException);
    });
  });
});
