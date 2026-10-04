import { Test } from '@nestjs/testing';
import { Prisma } from '../../../generated/prisma/client';
import { ApiException } from '../../common/exceptions/api.exception';
import { PrismaService } from '../../prisma/prisma.service';
import { ReceivingsService } from './receivings.service';

describe('ReceivingsService', () => {
  let service: ReceivingsService;
  let prisma: {
    receiving: {
      findMany: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
    };
    vehicle: { findUnique: jest.Mock };
    weighbridgeTransaction: { create: jest.Mock; count: jest.Mock };
    $transaction: jest.Mock;
  };
  let tx: {
    purchaseOrder: { findUnique: jest.Mock };
    warehouse: { findUnique: jest.Mock };
    purchaseOrderItem: { findMany: jest.Mock };
    receivingItem: { groupBy: jest.Mock };
    product: { findMany: jest.Mock };
    receiving: {
      create: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
      findUniqueOrThrow: jest.Mock;
      updateMany: jest.Mock;
    };
    inventoryLot: { count: jest.Mock };
    $queryRaw: jest.Mock;
  };

  const purchaseOrderId = 'po-1';
  const warehouseId = 'wh-1';
  const receivingId = 'rcv-1';
  const poItemId = 'poi-1';
  const productId = 'product-1';
  const vehicleId = 'vehicle-1';

  function storedPurchaseOrder(overrides: Record<string, unknown> = {}) {
    return {
      id: purchaseOrderId,
      supplierCompanyId: 'company-1',
      status: 'confirmed',
      ...overrides,
    };
  }

  function storedWarehouse(overrides: Record<string, unknown> = {}) {
    return { id: warehouseId, status: 'active', ...overrides };
  }

  function storedPurchaseOrderItem(overrides: Record<string, unknown> = {}) {
    return {
      id: poItemId,
      purchaseOrderId,
      productId,
      quantity: new Prisma.Decimal(1000),
      unit: 'KG',
      ...overrides,
    };
  }

  function storedReceiving(overrides: Record<string, unknown> = {}) {
    return {
      id: receivingId,
      receivingNumber: 'GRN-2026-000001',
      purchaseOrderId,
      warehouseId,
      supplierCompanyId: 'company-1',
      status: 'draft',
      receivedAt: null,
      notes: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      items: [],
      weighbridgeTransactions: [],
      ...overrides,
    };
  }

  beforeEach(async () => {
    tx = {
      purchaseOrder: {
        findUnique: jest.fn().mockResolvedValue(storedPurchaseOrder()),
      },
      warehouse: {
        findUnique: jest.fn().mockResolvedValue(storedWarehouse()),
      },
      purchaseOrderItem: {
        findMany: jest.fn().mockResolvedValue([storedPurchaseOrderItem()]),
      },
      receivingItem: {
        groupBy: jest.fn().mockResolvedValue([]),
      },
      product: {
        findMany: jest
          .fn()
          .mockResolvedValue([{ id: productId, name: 'Copra' }]),
      },
      receiving: {
        create: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn().mockResolvedValue({ status: 'draft' }),
        findUniqueOrThrow: jest.fn().mockResolvedValue(storedReceiving()),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      inventoryLot: { count: jest.fn().mockResolvedValue(0) },
      $queryRaw: jest.fn().mockResolvedValue([{ id: poItemId }]),
    };
    prisma = {
      receiving: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        findUnique: jest.fn().mockResolvedValue({ id: receivingId }),
      },
      vehicle: {
        findUnique: jest.fn().mockResolvedValue({ id: vehicleId }),
      },
      weighbridgeTransaction: {
        create: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
      },
      $transaction: jest.fn((fn: (t: unknown) => unknown) => fn(tx)),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ReceivingsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = moduleRef.get(ReceivingsService);
  });

  const oneItem = [{ purchaseOrderItemId: poItemId, quantityReceived: 400 }];
  const baseCreateDto = { warehouseId, items: oneItem };

  function createArgs() {
    /* eslint-disable @typescript-eslint/no-unsafe-member-access -- jest.Mock's own `.calls` type is untyped by Jest's own types. */
    return tx.receiving.create.mock.calls[0][0] as {
      data: {
        purchaseOrderId: string;
        warehouseId: string;
        supplierCompanyId: string;
        status: string;
        notes: string | null;
        items: {
          create: {
            purchaseOrderItemId: string;
            productId: string;
            productNameSnapshot: string;
            quantityExpected: Prisma.Decimal;
            quantityReceived: Prisma.Decimal;
            unit: string;
            notes: string | null;
          }[];
        };
      };
    };
    /* eslint-enable @typescript-eslint/no-unsafe-member-access */
  }

  /** Each `$queryRaw` tagged-template call as `{ table, id }`, in call order. */
  function lockCalls() {
    return (tx.$queryRaw.mock.calls as unknown[][]).map((call) => ({
      table: /FROM (\w+)/.exec((call[0] as string[]).join('?'))?.[1],
      id: call[1] as string,
    }));
  }

  describe('findAll', () => {
    it('lists with no filters', async () => {
      const result = await service.findAll({
        page: 1,
        limit: 25,
        sort: '-created_at',
      });

      expect(prisma.receiving.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
      expect(result.meta).toEqual(
        expect.objectContaining({ page: 1, limit: 25, total: 0 }),
      );
    });

    it('filters by status/purchaseOrderId/warehouseId', async () => {
      await service.findAll({
        page: 1,
        limit: 25,
        sort: '-created_at',
        status: 'draft',
        purchaseOrderId,
        warehouseId,
      });

      expect(prisma.receiving.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'draft', purchaseOrderId, warehouseId },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('returns the receiving when found', async () => {
      prisma.receiving.findUnique.mockResolvedValue(storedReceiving());

      const result = await service.findOne(receivingId);

      expect(result.id).toBe(receivingId);
    });

    it('throws NOT_FOUND for a missing id', async () => {
      prisma.receiving.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toBeInstanceOf(
        ApiException,
      );
    });
  });

  describe('createFromPurchaseOrder — PO eligibility', () => {
    it.each(['confirmed', 'partially_received'])(
      'accepts a purchase order with status "%s"',
      async (status) => {
        tx.purchaseOrder.findUnique.mockResolvedValue(
          storedPurchaseOrder({ status }),
        );
        tx.receiving.create.mockResolvedValue(storedReceiving());

        const result = await service.createFromPurchaseOrder(
          purchaseOrderId,
          baseCreateDto,
        );

        expect(result.id).toBe(receivingId);
      },
    );

    it.each(['draft', 'issued', 'received', 'cancelled', 'closed'])(
      'rejects a purchase order with status "%s"',
      async (status) => {
        tx.purchaseOrder.findUnique.mockResolvedValue(
          storedPurchaseOrder({ status }),
        );

        await expect(
          service.createFromPurchaseOrder(purchaseOrderId, baseCreateDto),
        ).rejects.toBeInstanceOf(ApiException);
        expect(tx.receiving.create).not.toHaveBeenCalled();
      },
    );

    it('throws NOT_FOUND when the purchase order does not exist', async () => {
      tx.purchaseOrder.findUnique.mockResolvedValue(null);

      await expect(
        service.createFromPurchaseOrder('missing', baseCreateDto),
      ).rejects.toBeInstanceOf(ApiException);
      expect(tx.receiving.create).not.toHaveBeenCalled();
    });
  });

  describe('createFromPurchaseOrder — warehouse validation', () => {
    it('rejects a non-existent warehouse', async () => {
      tx.warehouse.findUnique.mockResolvedValue(null);

      await expect(
        service.createFromPurchaseOrder(purchaseOrderId, baseCreateDto),
      ).rejects.toBeInstanceOf(ApiException);
      expect(tx.receiving.create).not.toHaveBeenCalled();
    });

    it('rejects an inactive warehouse', async () => {
      tx.warehouse.findUnique.mockResolvedValue(
        storedWarehouse({ status: 'inactive' }),
      );

      await expect(
        service.createFromPurchaseOrder(purchaseOrderId, baseCreateDto),
      ).rejects.toBeInstanceOf(ApiException);
      expect(tx.receiving.create).not.toHaveBeenCalled();
    });

    it('derives supplierCompanyId from the purchase order', async () => {
      tx.receiving.create.mockResolvedValue(storedReceiving());

      await service.createFromPurchaseOrder(purchaseOrderId, baseCreateDto);

      expect(createArgs().data.supplierCompanyId).toBe('company-1');
    });
  });

  describe('createFromPurchaseOrder — item resolution', () => {
    it('rejects a purchaseOrderItemId not belonging to this purchase order', async () => {
      tx.purchaseOrderItem.findMany.mockResolvedValue([]);

      await expect(
        service.createFromPurchaseOrder(purchaseOrderId, baseCreateDto),
      ).rejects.toBeInstanceOf(ApiException);
      expect(tx.receiving.create).not.toHaveBeenCalled();
    });

    it('rejects a duplicate purchaseOrderItemId within the same receiving', async () => {
      await expect(
        service.createFromPurchaseOrder(purchaseOrderId, {
          warehouseId,
          items: [
            { purchaseOrderItemId: poItemId, quantityReceived: 100 },
            { purchaseOrderItemId: poItemId, quantityReceived: 200 },
          ],
        }),
      ).rejects.toBeInstanceOf(ApiException);
      expect(tx.receiving.create).not.toHaveBeenCalled();
    });

    it('derives productId/productNameSnapshot/unit/quantityExpected from the live PurchaseOrderItem/Product — client cannot override them', async () => {
      tx.receiving.create.mockResolvedValue(storedReceiving());

      await service.createFromPurchaseOrder(purchaseOrderId, {
        warehouseId,
        // Simulates a malicious/malformed payload — CreateReceivingItemDto has no productId/
        // productNameSnapshot/unit/quantityExpected field at all.
        items: [
          {
            purchaseOrderItemId: poItemId,
            quantityReceived: 400,
            productId: 'attacker-product',
          },
        ],
      } as never);

      const item = createArgs().data.items.create[0];
      expect(item.productId).toBe(productId);
      expect(item.productNameSnapshot).toBe('Copra');
      expect(item.unit).toBe('KG');
      expect(item.quantityExpected.toString()).toBe('1000');
    });

    it('rejects when the resolved product no longer exists', async () => {
      tx.product.findMany.mockResolvedValue([]);

      await expect(
        service.createFromPurchaseOrder(purchaseOrderId, baseCreateDto),
      ).rejects.toBeInstanceOf(ApiException);
      expect(tx.receiving.create).not.toHaveBeenCalled();
    });

    it('creates multiple ReceivingItems from multiple purchase order items', async () => {
      tx.purchaseOrderItem.findMany.mockResolvedValue([
        storedPurchaseOrderItem({ id: 'poi-1', productId: 'product-1' }),
        storedPurchaseOrderItem({ id: 'poi-2', productId: 'product-2' }),
      ]);
      tx.product.findMany.mockResolvedValue([
        { id: 'product-1', name: 'Copra' },
        { id: 'product-2', name: 'Semi Husked Coconut' },
      ]);
      tx.receiving.create.mockResolvedValue(storedReceiving());

      await service.createFromPurchaseOrder(purchaseOrderId, {
        warehouseId,
        items: [
          { purchaseOrderItemId: 'poi-1', quantityReceived: 100 },
          { purchaseOrderItemId: 'poi-2', quantityReceived: 200 },
        ],
      });

      expect(createArgs().data.items.create).toHaveLength(2);
    });
  });

  describe('createFromPurchaseOrder — quantity safety', () => {
    it('allows an exact full receiving (requested == remaining)', async () => {
      tx.receiving.create.mockResolvedValue(storedReceiving());

      await service.createFromPurchaseOrder(purchaseOrderId, {
        warehouseId,
        items: [{ purchaseOrderItemId: poItemId, quantityReceived: 1000 }],
      });

      expect(
        createArgs().data.items.create[0].quantityReceived.toString(),
      ).toBe('1000');
    });

    it('supports partial receiving — accounts for quantity already received in a prior Receiving', async () => {
      tx.receivingItem.groupBy.mockResolvedValue([
        {
          purchaseOrderItemId: poItemId,
          _sum: { quantityReceived: new Prisma.Decimal(650) },
        },
      ]);
      tx.receiving.create.mockResolvedValue(storedReceiving());

      // 1000 total, 650 already received (400 + 250 across two prior Receivings) — 350 left.
      await service.createFromPurchaseOrder(purchaseOrderId, {
        warehouseId,
        items: [{ purchaseOrderItemId: poItemId, quantityReceived: 350 }],
      });

      expect(
        createArgs().data.items.create[0].quantityReceived.toString(),
      ).toBe('350');
    });

    it('rejects over-receiving beyond the remaining quantity', async () => {
      tx.receivingItem.groupBy.mockResolvedValue([
        {
          purchaseOrderItemId: poItemId,
          _sum: { quantityReceived: new Prisma.Decimal(700) },
        },
      ]);

      // 1000 total, 700 already received — only 300 left; requesting 400 must be rejected.
      await expect(
        service.createFromPurchaseOrder(purchaseOrderId, {
          warehouseId,
          items: [{ purchaseOrderItemId: poItemId, quantityReceived: 400 }],
        }),
      ).rejects.toBeInstanceOf(ApiException);
      expect(tx.receiving.create).not.toHaveBeenCalled();
    });

    it('allows the same purchaseOrderItemId to be received again in a separate Receiving (cardinality)', async () => {
      tx.receivingItem.groupBy.mockResolvedValue([
        {
          purchaseOrderItemId: poItemId,
          _sum: { quantityReceived: new Prisma.Decimal(400) },
        },
      ]);
      tx.receiving.create.mockResolvedValue(
        storedReceiving({ receivingNumber: 'GRN-2026-000002' }),
      );

      const result = await service.createFromPurchaseOrder(purchaseOrderId, {
        warehouseId,
        items: [{ purchaseOrderItemId: poItemId, quantityReceived: 350 }],
      });

      expect(result.id).toBe(receivingId);
    });
  });

  describe('createFromPurchaseOrder — draft/cancelled receivings do not consume capacity', () => {
    it('excludes draft and cancelled receivings from the already-received sum', async () => {
      tx.receiving.create.mockResolvedValue(storedReceiving());

      await service.createFromPurchaseOrder(purchaseOrderId, baseCreateDto);

      /* eslint-disable @typescript-eslint/no-unsafe-assignment -- expect.* matchers are untyped by Jest's own types. */
      expect(tx.receivingItem.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            receiving: { status: { notIn: ['draft', 'cancelled'] } },
          }),
        }),
      );
      /* eslint-enable @typescript-eslint/no-unsafe-assignment */
    });

    it('allows a full-quantity receiving when the only other receiving for the item is a cancelled/draft one (excluded from the sum)', async () => {
      // The sum query already excludes them, so the DB returns no rows for this item.
      tx.receivingItem.groupBy.mockResolvedValue([]);
      tx.receiving.create.mockResolvedValue(storedReceiving());

      await service.createFromPurchaseOrder(purchaseOrderId, {
        warehouseId,
        items: [{ purchaseOrderItemId: poItemId, quantityReceived: 1000 }],
      });

      expect(tx.receiving.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('createFromPurchaseOrder — concurrency lock', () => {
    it('locks every referenced PurchaseOrderItem (FOR UPDATE) before computing the already-received sum', async () => {
      tx.receiving.create.mockResolvedValue(storedReceiving());

      await service.createFromPurchaseOrder(purchaseOrderId, baseCreateDto);

      expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
      const lockCallOrder = tx.$queryRaw.mock.invocationCallOrder[0];
      const sumCallOrder = tx.receivingItem.groupBy.mock.invocationCallOrder[0];
      expect(lockCallOrder).toBeLessThan(sumCallOrder);
    });

    it('locks multiple referenced PurchaseOrderItems in sorted order (deadlock avoidance)', async () => {
      tx.purchaseOrderItem.findMany.mockResolvedValue([
        storedPurchaseOrderItem({ id: 'poi-b', productId: 'product-1' }),
        storedPurchaseOrderItem({ id: 'poi-a', productId: 'product-1' }),
      ]);
      tx.receiving.create.mockResolvedValue(storedReceiving());

      await service.createFromPurchaseOrder(purchaseOrderId, {
        warehouseId,
        items: [
          { purchaseOrderItemId: 'poi-b', quantityReceived: 10 },
          { purchaseOrderItemId: 'poi-a', quantityReceived: 10 },
        ],
      });

      expect(lockCalls()).toEqual([
        { table: 'purchase_order_items', id: 'poi-a' },
        { table: 'purchase_order_items', id: 'poi-b' },
      ]);
    });
  });

  describe('createFromPurchaseOrder — number generation', () => {
    it('retries on a receiving_number collision without failing', async () => {
      const collision = {
        code: 'P2002',
        meta: { target: ['receiving_number'] },
      };
      tx.receiving.create
        .mockRejectedValueOnce(collision)
        .mockResolvedValueOnce(
          storedReceiving({ receivingNumber: 'GRN-2026-000002' }),
        );

      const result = await service.createFromPurchaseOrder(
        purchaseOrderId,
        baseCreateDto,
      );

      expect(tx.receiving.create).toHaveBeenCalledTimes(2);
      expect(result.receivingNumber).toBe('GRN-2026-000002');
    });

    it('never surfaces a raw Prisma/Postgres error after exhausting retries', async () => {
      const ambiguous = {
        code: 'P2039',
        meta: { driverAdapterError: { cause: { originalCode: '23505' } } },
      };
      tx.receiving.create.mockRejectedValue(ambiguous);

      await expect(
        service.createFromPurchaseOrder(purchaseOrderId, baseCreateDto),
      ).rejects.toBeInstanceOf(ApiException);
    });
  });

  describe('createFromPurchaseOrder — out of scope by construction (InventoryLot/Inventory/QC)', () => {
    it('never creates an InventoryLot, Inventory row, or QCInspection as a side effect of Receiving creation', async () => {
      tx.receiving.create.mockResolvedValue(storedReceiving());

      // The mocked `tx` object in this suite defines no `inventoryLot`/`inventory`/
      // `qcInspection` property at all — if the service ever attempted to call
      // `tx.inventoryLot.create(...)` (or the Inventory/QC equivalents), this test's own mock
      // setup would throw a TypeError, proving no such call exists in Phase 23's scope.
      const result = await service.createFromPurchaseOrder(
        purchaseOrderId,
        baseCreateDto,
      );

      expect(result.id).toBe(receivingId);
    });
  });

  // --- update(): every write is one transaction, decided from state read AFTER the lock.
  function receivingItemRow(
    id: string,
    purchaseOrderItemId: string,
    quantity: number,
  ) {
    return {
      id,
      purchaseOrderItemId,
      quantityReceived: new Prisma.Decimal(quantity),
    };
  }

  /** Arranges the pre-transaction read (404 + the immutable item list) and the fresh status the
   * service reads after taking the row lock. Pass a different `freshStatus` to simulate a
   * concurrent request having changed the Receiving in between. */
  function givenReceiving(
    status: string,
    items: ReturnType<typeof receivingItemRow>[] = [],
    freshStatus: string = status,
  ) {
    prisma.receiving.findUnique.mockResolvedValue(
      storedReceiving({ status, items }),
    );
    tx.receiving.findUnique.mockResolvedValue({ status: freshStatus });
  }

  function writeArgs() {
    /* eslint-disable @typescript-eslint/no-unsafe-member-access -- jest.Mock's own `.calls` type is untyped by Jest's own types. */
    return tx.receiving.updateMany.mock.calls[0][0] as {
      where: { id: string; status: string };
      data: { status?: string; notes?: string; receivedAt?: Date };
    };
    /* eslint-enable @typescript-eslint/no-unsafe-member-access */
  }

  type Status = 'received' | 'inspecting' | 'completed' | 'cancelled';
  const validTransitions: [string, Status][] = [
    ['draft', 'received'],
    ['draft', 'cancelled'],
    ['received', 'inspecting'],
    ['received', 'cancelled'],
    ['inspecting', 'completed'],
    ['inspecting', 'cancelled'],
  ];

  describe('update — lifecycle validated against the locked, fresh status', () => {
    it.each(validTransitions)(
      'allows %s -> %s and writes conditionally on the validated status',
      async (from, to) => {
        givenReceiving(from);

        await service.update(receivingId, { status: to });

        expect(writeArgs().where).toEqual({ id: receivingId, status: from });
        expect(writeArgs().data.status).toBe(to);
      },
    );

    it.each([
      ['draft', 'inspecting'],
      ['draft', 'completed'],
      ['received', 'completed'],
      ['completed', 'cancelled'],
      ['completed', 'received'],
      ['cancelled', 'received'],
      ['cancelled', 'inspecting'],
    ] as [string, Status][])(
      'rejects the invalid transition %s -> %s without writing',
      async (from, to) => {
        givenReceiving(from);

        await expect(
          service.update(receivingId, { status: to }),
        ).rejects.toBeInstanceOf(ApiException);
        expect(tx.receiving.updateMany).not.toHaveBeenCalled();
      },
    );

    it.each(validTransitions)(
      'returns 409 when the conditional write matches no row (%s -> %s)',
      async (from, to) => {
        givenReceiving(from);
        tx.receiving.updateMany.mockResolvedValue({ count: 0 });

        await expect(
          service.update(receivingId, { status: to }),
        ).rejects.toMatchObject({ status: 409 });
      },
    );

    it('sets receivedAt automatically on received and never on other transitions', async () => {
      givenReceiving('draft');
      await service.update(receivingId, { status: 'received' });
      expect(writeArgs().data.receivedAt).toBeInstanceOf(Date);

      tx.receiving.updateMany.mockClear();
      givenReceiving('received');
      await service.update(receivingId, { status: 'inspecting' });
      expect(writeArgs().data.receivedAt).toBeUndefined();
    });

    it('a notes-only update writes conditionally on the current status and takes no PurchaseOrderItem lock', async () => {
      givenReceiving('inspecting');

      await service.update(receivingId, { notes: 'Updated' });

      expect(writeArgs()).toEqual({
        where: { id: receivingId, status: 'inspecting' },
        data: { notes: 'Updated' },
      });
      expect(lockCalls()).toEqual([{ table: 'receivings', id: receivingId }]);
    });

    it('throws NOT_FOUND for a missing id without opening a transaction', async () => {
      prisma.receiving.findUnique.mockResolvedValue(null);

      await expect(
        service.update('missing', { notes: 'x' }),
      ).rejects.toBeInstanceOf(ApiException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('throws 404 when the row disappears between the pre-read and the lock', async () => {
      givenReceiving('draft');
      tx.receiving.findUnique.mockResolvedValue(null);

      await expect(
        service.update(receivingId, { notes: 'x' }),
      ).rejects.toMatchObject({ status: 404 });
      expect(tx.receiving.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('update — cancellation races', () => {
    it('cancellation vs inspecting: a transition valid against the pre-read is rejected when the fresh state is already cancelled', async () => {
      // Pre-read: received. A concurrent request cancelled it before our lock was granted.
      givenReceiving('received', [], 'cancelled');

      await expect(
        service.update(receivingId, { status: 'inspecting' }),
      ).rejects.toBeInstanceOf(ApiException);
      expect(tx.receiving.updateMany).not.toHaveBeenCalled();
    });

    it('cancellation vs draft -> received: a draft cancelled concurrently never becomes received (and its capacity is never claimed)', async () => {
      givenReceiving(
        'draft',
        [receivingItemRow('rcvi-1', poItemId, 600)],
        'cancelled',
      );

      await expect(
        service.update(receivingId, { status: 'received' }),
      ).rejects.toBeInstanceOf(ApiException);
      expect(tx.receiving.updateMany).not.toHaveBeenCalled();
    });

    it('inspecting vs cancellation: whichever wrote first wins — a lost conditional write is a 409, not an overwrite', async () => {
      givenReceiving('received');
      tx.receiving.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.update(receivingId, { status: 'inspecting' }),
      ).rejects.toMatchObject({ status: 409 });
    });

    it('takes the Receiving row lock first and reads the fresh status only afterwards', async () => {
      givenReceiving('received');

      await service.update(receivingId, { status: 'inspecting' });

      const lockOrder = tx.$queryRaw.mock.invocationCallOrder[0];
      const readOrder = tx.receiving.findUnique.mock.invocationCallOrder[0];
      const writeOrder = tx.receiving.updateMany.mock.invocationCallOrder[0];
      expect(lockOrder).toBeLessThan(readOrder);
      expect(readOrder).toBeLessThan(writeOrder);
    });
  });

  describe('update — cancellation of a receiving that already has inventory lots', () => {
    it('rejects cancelling a receiving that already has one lot, with a 409 and no write', async () => {
      givenReceiving('received');
      tx.inventoryLot.count.mockResolvedValue(1);

      await expect(
        service.update(receivingId, { status: 'cancelled' }),
      ).rejects.toMatchObject({ status: 409 });
      expect(tx.receiving.updateMany).not.toHaveBeenCalled();
    });

    it.each(['draft', 'received', 'inspecting'])(
      'rejects cancelling a %s receiving that has several lots',
      async (status) => {
        givenReceiving(status);
        tx.inventoryLot.count.mockResolvedValue(3);

        await expect(
          service.update(receivingId, { status: 'cancelled' }),
        ).rejects.toMatchObject({ status: 409 });
        expect(tx.receiving.updateMany).not.toHaveBeenCalled();
      },
    );

    it('allows cancelling a receiving with no lots, counting lots by this receiving id', async () => {
      givenReceiving('received');
      tx.inventoryLot.count.mockResolvedValue(0);

      await service.update(receivingId, { status: 'cancelled' });

      expect(tx.inventoryLot.count).toHaveBeenCalledWith({
        where: { receivingId },
      });
      expect(writeArgs().data.status).toBe('cancelled');
    });

    it('counts the lots only after the Receiving row lock, so a concurrent lot creation cannot slip in', async () => {
      givenReceiving('received');

      await service.update(receivingId, { status: 'cancelled' });

      const lockOrder = tx.$queryRaw.mock.invocationCallOrder[0];
      const countOrder = tx.inventoryLot.count.mock.invocationCallOrder[0];
      expect(lockOrder).toBeLessThan(countOrder);
    });

    it('never touches any lot: the only write in the transaction is the receiving conditional update', async () => {
      givenReceiving('received');

      await service.update(receivingId, { status: 'cancelled' });

      expect(tx.receiving.updateMany).toHaveBeenCalledTimes(1);
      expect(Object.keys(tx.inventoryLot)).toEqual(['count']);
    });

    it('does not look at lots for transitions other than cancelled', async () => {
      givenReceiving('received');

      await service.update(receivingId, { status: 'inspecting' });

      expect(tx.inventoryLot.count).not.toHaveBeenCalled();
    });
  });

  describe('update — draft to received capacity re-check', () => {
    it('succeeds when the quantity fits the remaining capacity exactly, in a transaction', async () => {
      givenReceiving('draft', [receivingItemRow('rcvi-1', poItemId, 400)]);
      tx.receivingItem.groupBy.mockResolvedValue([
        {
          purchaseOrderItemId: poItemId,
          _sum: { quantityReceived: new Prisma.Decimal(600) },
        },
      ]);

      await service.update(receivingId, { status: 'received' });

      // 1000 total, 600 already counted, this receiving's own 400 fits exactly.
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(writeArgs().where).toEqual({ id: receivingId, status: 'draft' });
    });

    it('rejects with a 409 when two drafts would together exceed the PO item quantity, and does not write', async () => {
      givenReceiving('draft', [receivingItemRow('rcvi-1', poItemId, 500)]);
      tx.receivingItem.groupBy.mockResolvedValue([
        {
          purchaseOrderItemId: poItemId,
          _sum: { quantityReceived: new Prisma.Decimal(700) },
        },
      ]);

      // 1000 total, 700 already counted (a sibling draft became received first); 500 > 300.
      await expect(
        service.update(receivingId, { status: 'received' }),
      ).rejects.toMatchObject({ status: 409 });
      expect(tx.receiving.updateMany).not.toHaveBeenCalled();
    });

    it('excludes draft and cancelled receivings from the sum it checks against', async () => {
      givenReceiving('draft', [receivingItemRow('rcvi-1', poItemId, 100)]);

      await service.update(receivingId, { status: 'received' });

      /* eslint-disable @typescript-eslint/no-unsafe-assignment -- expect.* matchers are untyped by Jest's own types. */
      expect(tx.receivingItem.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            receiving: { status: { notIn: ['draft', 'cancelled'] } },
          }),
        }),
      );
      /* eslint-enable @typescript-eslint/no-unsafe-assignment */
    });

    it('locks the referenced PurchaseOrderItems in sorted id order, then the Receiving row, all before summing', async () => {
      givenReceiving('draft', [
        receivingItemRow('rcvi-b', 'poi-b', 10),
        receivingItemRow('rcvi-a', 'poi-a', 10),
      ]);
      tx.purchaseOrderItem.findMany.mockResolvedValue([
        storedPurchaseOrderItem({ id: 'poi-a' }),
        storedPurchaseOrderItem({ id: 'poi-b' }),
      ]);

      await service.update(receivingId, { status: 'received' });

      expect(lockCalls()).toEqual([
        { table: 'purchase_order_items', id: 'poi-a' },
        { table: 'purchase_order_items', id: 'poi-b' },
        { table: 'receivings', id: receivingId },
      ]);
      const lastLockOrder = tx.$queryRaw.mock.invocationCallOrder[2];
      const sumOrder = tx.receivingItem.groupBy.mock.invocationCallOrder[0];
      expect(lastLockOrder).toBeLessThan(sumOrder);
    });

    it('locks each PurchaseOrderItem once even when two items reference the same one', async () => {
      givenReceiving('draft', [
        receivingItemRow('rcvi-1', poItemId, 10),
        receivingItemRow('rcvi-2', poItemId, 10),
      ]);

      await service.update(receivingId, { status: 'received' });

      expect(
        lockCalls().filter((call) => call.table === 'purchase_order_items'),
      ).toEqual([{ table: 'purchase_order_items', id: poItemId }]);
    });

    it('does not take PurchaseOrderItem locks or sum capacity for transitions other than received', async () => {
      givenReceiving('received', [receivingItemRow('rcvi-1', poItemId, 10)]);

      await service.update(receivingId, { status: 'inspecting' });

      expect(lockCalls()).toEqual([{ table: 'receivings', id: receivingId }]);
      expect(tx.receivingItem.groupBy).not.toHaveBeenCalled();
    });

    it('rejects when a concurrent change already moved the receiving out of draft (never double-counts itself)', async () => {
      givenReceiving(
        'draft',
        [receivingItemRow('rcvi-1', poItemId, 100)],
        'received',
      );

      await expect(
        service.update(receivingId, { status: 'received' }),
      ).rejects.toBeInstanceOf(ApiException);
      expect(tx.receivingItem.groupBy).not.toHaveBeenCalled();
      expect(tx.receiving.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('createWeighbridgeTransaction', () => {
    const baseWeighbridgeDto = { unit: 'KG' };

    it('creates a weighbridge transaction with no gross/tare (net stays null)', async () => {
      prisma.weighbridgeTransaction.create.mockResolvedValue({
        id: 'wb-1',
        transactionNumber: 'WB-2026-000001',
        vehicleId: null,
        weighInAt: null,
        weighOutAt: null,
        grossWeight: null,
        tareWeight: null,
        netWeight: null,
        unit: 'KG',
        status: 'open',
        notes: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      });

      const result = await service.createWeighbridgeTransaction(
        receivingId,
        baseWeighbridgeDto,
      );

      expect(result.netWeight).toBeNull();
    });

    it('throws NOT_FOUND when the receiving does not exist', async () => {
      prisma.receiving.findUnique.mockResolvedValue(null);

      await expect(
        service.createWeighbridgeTransaction('missing', baseWeighbridgeDto),
      ).rejects.toBeInstanceOf(ApiException);
    });

    it('validates vehicleId against the existing Vehicle model', async () => {
      prisma.vehicle.findUnique.mockResolvedValue(null);

      await expect(
        service.createWeighbridgeTransaction(receivingId, {
          ...baseWeighbridgeDto,
          vehicleId: 'missing-vehicle',
        }),
      ).rejects.toBeInstanceOf(ApiException);
      expect(prisma.weighbridgeTransaction.create).not.toHaveBeenCalled();
    });

    it('accepts a valid vehicleId', async () => {
      prisma.weighbridgeTransaction.create.mockResolvedValue({
        id: 'wb-1',
        transactionNumber: 'WB-2026-000001',
        vehicleId,
        weighInAt: null,
        weighOutAt: null,
        grossWeight: null,
        tareWeight: null,
        netWeight: null,
        unit: 'KG',
        status: 'open',
        notes: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      });

      const result = await service.createWeighbridgeTransaction(receivingId, {
        ...baseWeighbridgeDto,
        vehicleId,
      });

      expect(result.vehicleId).toBe(vehicleId);
    });

    it('calculates netWeight as gross minus tare, Decimal-safe', async () => {
      prisma.weighbridgeTransaction.create.mockResolvedValue({
        id: 'wb-1',
        transactionNumber: 'WB-2026-000001',
        vehicleId: null,
        weighInAt: null,
        weighOutAt: null,
        grossWeight: new Prisma.Decimal(5000),
        tareWeight: new Prisma.Decimal(2000),
        netWeight: new Prisma.Decimal(3000),
        unit: 'KG',
        status: 'open',
        notes: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      });

      await service.createWeighbridgeTransaction(receivingId, {
        ...baseWeighbridgeDto,
        grossWeight: 5000,
        tareWeight: 2000,
      });

      /* eslint-disable @typescript-eslint/no-unsafe-member-access -- jest.Mock's own `.calls` type is untyped by Jest's own types. */
      const createArgsWb = prisma.weighbridgeTransaction.create.mock
        .calls[0][0] as { data: { netWeight: Prisma.Decimal } };
      /* eslint-enable @typescript-eslint/no-unsafe-member-access */
      expect(createArgsWb.data.netWeight.toString()).toBe('3000');
    });

    it('rejects gross weight less than tare weight', async () => {
      await expect(
        service.createWeighbridgeTransaction(receivingId, {
          ...baseWeighbridgeDto,
          grossWeight: 1000,
          tareWeight: 2000,
        }),
      ).rejects.toBeInstanceOf(ApiException);
      expect(prisma.weighbridgeTransaction.create).not.toHaveBeenCalled();
    });

    it('retries on a transaction_number collision without failing', async () => {
      const collision = {
        code: 'P2002',
        meta: { target: ['transaction_number'] },
      };
      prisma.weighbridgeTransaction.create
        .mockRejectedValueOnce(collision)
        .mockResolvedValueOnce({
          id: 'wb-1',
          transactionNumber: 'WB-2026-000002',
          vehicleId: null,
          weighInAt: null,
          weighOutAt: null,
          grossWeight: null,
          tareWeight: null,
          netWeight: null,
          unit: 'KG',
          status: 'open',
          notes: null,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
        });

      const result = await service.createWeighbridgeTransaction(
        receivingId,
        baseWeighbridgeDto,
      );

      expect(prisma.weighbridgeTransaction.create).toHaveBeenCalledTimes(2);
      expect(result.transactionNumber).toBe('WB-2026-000002');
    });
  });
});
