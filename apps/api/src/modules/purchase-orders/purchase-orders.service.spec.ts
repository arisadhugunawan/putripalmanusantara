import { Test } from '@nestjs/testing';
import { Prisma } from '../../../generated/prisma/client';
import { ApiException } from '../../common/exceptions/api.exception';
import { PrismaService } from '../../prisma/prisma.service';
import { PurchaseOrdersService } from './purchase-orders.service';

describe('PurchaseOrdersService', () => {
  let service: PurchaseOrdersService;
  let prisma: {
    purchaseOrder: {
      findMany: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    businessRelationship: { findFirst: jest.Mock };
    $transaction: jest.Mock;
  };
  let tx: {
    supplierQuotation: { findUnique: jest.Mock };
    purchaseOrder: { findFirst: jest.Mock; create: jest.Mock };
    product: { findMany: jest.Mock };
  };

  const supplierQuotationId = 'sqt-1';
  const supplierCompanyId = 'company-1';
  const purchaseOrderId = 'po-1';
  const productId = 'product-1';

  function storedSupplierQuotationItem(
    overrides: Record<string, unknown> = {},
  ) {
    return {
      id: 'sqti-1',
      supplierQuotationId,
      productId,
      productNameSnapshot: 'Stale Supplier Quotation Snapshot',
      quantity: new Prisma.Decimal(10),
      unit: 'ton',
      unitPrice: new Prisma.Decimal(25.5),
      discount: new Prisma.Decimal(5),
      subtotal: new Prisma.Decimal(250),
      specifications: null,
      notes: null,
      ...overrides,
    };
  }

  function storedSupplierQuotation(overrides: Record<string, unknown> = {}) {
    return {
      id: supplierQuotationId,
      supplierQuotationNumber: 'SQT-2026-000001',
      supplierRfqId: 'srfq-1',
      supplierCompanyId,
      status: 'selected',
      currency: 'USD',
      discount: null,
      shippingCost: null,
      items: [storedSupplierQuotationItem()],
      ...overrides,
    };
  }

  function storedPurchaseOrder(overrides: Record<string, unknown> = {}) {
    return {
      id: purchaseOrderId,
      purchaseOrderNumber: 'PO-2026-000001',
      purchaseRequestId: null,
      supplierQuotationId,
      supplierCompanyId,
      status: 'draft',
      orderDate: new Date('2026-01-01T00:00:00.000Z'),
      expectedDeliveryDate: null,
      currency: 'USD',
      subtotal: new Prisma.Decimal(250),
      discount: null,
      shippingCost: null,
      total: new Prisma.Decimal(250),
      notes: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      items: [],
      supplierQuotation: {
        id: supplierQuotationId,
        supplierQuotationNumber: 'SQT-2026-000001',
      },
      ...overrides,
    };
  }

  beforeEach(async () => {
    tx = {
      supplierQuotation: {
        findUnique: jest.fn().mockResolvedValue(storedSupplierQuotation()),
      },
      purchaseOrder: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
      },
      product: {
        findMany: jest
          .fn()
          .mockResolvedValue([
            { id: productId, name: 'Fresh Live Product Name' },
          ]),
      },
    };
    prisma = {
      purchaseOrder: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      businessRelationship: {
        findFirst: jest.fn().mockResolvedValue({ id: 'br-1' }),
      },
      $transaction: jest.fn((fn: (t: unknown) => unknown) => fn(tx)),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        PurchaseOrdersService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = moduleRef.get(PurchaseOrdersService);
  });

  function createArgs() {
    /* eslint-disable @typescript-eslint/no-unsafe-member-access -- jest.Mock's own `.calls` type is untyped by Jest's own types. */
    return tx.purchaseOrder.create.mock.calls[0][0] as {
      data: {
        supplierCompanyId: string;
        currency: string;
        status: string;
        subtotal: Prisma.Decimal;
        discount: Prisma.Decimal | null;
        shippingCost: Prisma.Decimal | null;
        total: Prisma.Decimal;
        expectedDeliveryDate: Date | null;
        notes: string | null;
        items: {
          create: {
            productId: string;
            productNameSnapshot: string;
            quantity: Prisma.Decimal;
            unit: string;
            unitPrice: Prisma.Decimal;
            discount: Prisma.Decimal | null;
            subtotal: Prisma.Decimal;
          }[];
        };
      };
    };
    /* eslint-enable @typescript-eslint/no-unsafe-member-access */
  }

  describe('findAll', () => {
    it('lists with no filters', async () => {
      const result = await service.findAll({
        page: 1,
        limit: 25,
        sort: '-created_at',
      });

      expect(prisma.purchaseOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
      expect(result.meta).toEqual(
        expect.objectContaining({ page: 1, limit: 25, total: 0 }),
      );
    });

    it('filters by status/supplierQuotationId/supplierCompanyId', async () => {
      await service.findAll({
        page: 1,
        limit: 25,
        sort: '-created_at',
        status: 'draft',
        supplierQuotationId,
        supplierCompanyId,
      });

      expect(prisma.purchaseOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'draft', supplierQuotationId, supplierCompanyId },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('returns the purchase order when found', async () => {
      prisma.purchaseOrder.findUnique.mockResolvedValue(storedPurchaseOrder());

      const result = await service.findOne(purchaseOrderId);

      expect(result.id).toBe(purchaseOrderId);
    });

    it('throws NOT_FOUND for a missing id', async () => {
      prisma.purchaseOrder.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toBeInstanceOf(
        ApiException,
      );
    });
  });

  describe('createFromSupplierQuotation', () => {
    it('creates a purchase order from a selected supplier quotation', async () => {
      tx.purchaseOrder.create.mockResolvedValue(storedPurchaseOrder());

      const result = await service.createFromSupplierQuotation(
        supplierQuotationId,
        {},
      );

      expect(result.id).toBe(purchaseOrderId);
      expect(createArgs().data.status).toBe('draft');
    });

    it.each([
      'draft',
      'received',
      'under_review',
      'rejected',
      'expired',
      'cancelled',
    ])('rejects a supplier quotation with status "%s"', async (status) => {
      tx.supplierQuotation.findUnique.mockResolvedValue(
        storedSupplierQuotation({ status }),
      );

      await expect(
        service.createFromSupplierQuotation(supplierQuotationId, {}),
      ).rejects.toBeInstanceOf(ApiException);
      expect(tx.purchaseOrder.create).not.toHaveBeenCalled();
    });

    it('throws NOT_FOUND when the supplier quotation does not exist', async () => {
      tx.supplierQuotation.findUnique.mockResolvedValue(null);

      await expect(
        service.createFromSupplierQuotation('missing', {}),
      ).rejects.toBeInstanceOf(ApiException);
    });

    it('rejects a supplier quotation with no items', async () => {
      tx.supplierQuotation.findUnique.mockResolvedValue(
        storedSupplierQuotation({ items: [] }),
      );

      await expect(
        service.createFromSupplierQuotation(supplierQuotationId, {}),
      ).rejects.toBeInstanceOf(ApiException);
      expect(tx.purchaseOrder.create).not.toHaveBeenCalled();
    });

    it('rejects creating a second purchase order from the same supplier quotation', async () => {
      tx.purchaseOrder.findFirst.mockResolvedValue({ id: 'existing-po' });

      await expect(
        service.createFromSupplierQuotation(supplierQuotationId, {}),
      ).rejects.toBeInstanceOf(ApiException);
      expect(tx.purchaseOrder.create).not.toHaveBeenCalled();
    });

    it('rejects when the supplier no longer has an active supplier relationship', async () => {
      prisma.businessRelationship.findFirst.mockResolvedValue(null);

      await expect(
        service.createFromSupplierQuotation(supplierQuotationId, {}),
      ).rejects.toBeInstanceOf(ApiException);
      expect(tx.purchaseOrder.create).not.toHaveBeenCalled();
    });

    it('derives supplierCompanyId and currency from the supplier quotation', async () => {
      tx.supplierQuotation.findUnique.mockResolvedValue(
        storedSupplierQuotation({ currency: 'IDR' }),
      );
      tx.purchaseOrder.create.mockResolvedValue(storedPurchaseOrder());

      await service.createFromSupplierQuotation(supplierQuotationId, {});

      expect(createArgs().data.supplierCompanyId).toBe(supplierCompanyId);
      expect(createArgs().data.currency).toBe('IDR');
    });

    it('accepts an optional expectedDeliveryDate, defaulting to null when omitted', async () => {
      tx.purchaseOrder.create.mockResolvedValue(storedPurchaseOrder());

      await service.createFromSupplierQuotation(supplierQuotationId, {
        expectedDeliveryDate: '2026-05-01T00:00:00.000Z',
      });

      expect(createArgs().data.expectedDeliveryDate?.toISOString()).toBe(
        '2026-05-01T00:00:00.000Z',
      );
    });

    it('copies productId/quantity/unit/unitPrice/discount from SupplierQuotationItem', async () => {
      tx.purchaseOrder.create.mockResolvedValue(storedPurchaseOrder());

      await service.createFromSupplierQuotation(supplierQuotationId, {});

      const item = createArgs().data.items.create[0];
      expect(item.productId).toBe(productId);
      expect(item.quantity.toString()).toBe('10');
      expect(item.unit).toBe('ton');
      expect(item.unitPrice.toString()).toBe('25.5');
      expect(item.discount?.toString()).toBe('5');
    });

    it('derives productNameSnapshot from the live Product, never from SupplierQuotationItem.productNameSnapshot', async () => {
      tx.purchaseOrder.create.mockResolvedValue(storedPurchaseOrder());

      await service.createFromSupplierQuotation(supplierQuotationId, {});

      expect(createArgs().data.items.create[0].productNameSnapshot).toBe(
        'Fresh Live Product Name',
      );
    });

    it('recalculates item subtotal, order subtotal and total with Decimal-safe arithmetic', async () => {
      tx.supplierQuotation.findUnique.mockResolvedValue(
        storedSupplierQuotation({
          discount: new Prisma.Decimal(10),
          shippingCost: new Prisma.Decimal(15),
        }),
      );
      tx.purchaseOrder.create.mockResolvedValue(storedPurchaseOrder());

      await service.createFromSupplierQuotation(supplierQuotationId, {});

      // item subtotal = 10 * 25.5 - 5 = 250
      expect(createArgs().data.items.create[0].subtotal.toString()).toBe('250');
      expect(createArgs().data.subtotal.toString()).toBe('250');
      // total = 250 - 10 + 15 = 255
      expect(createArgs().data.total.toString()).toBe('255');
    });

    it('rejects a negative total (discount exceeding subtotal + shipping) and creates nothing', async () => {
      tx.supplierQuotation.findUnique.mockResolvedValue(
        storedSupplierQuotation({ discount: new Prisma.Decimal(300) }),
      );

      await expect(
        service.createFromSupplierQuotation(supplierQuotationId, {}),
      ).rejects.toBeInstanceOf(ApiException);
      expect(tx.purchaseOrder.create).not.toHaveBeenCalled();
    });

    it('accepts a total of exactly zero', async () => {
      tx.supplierQuotation.findUnique.mockResolvedValue(
        storedSupplierQuotation({ discount: new Prisma.Decimal(250) }),
      );
      tx.purchaseOrder.create.mockResolvedValue(storedPurchaseOrder());

      await service.createFromSupplierQuotation(supplierQuotationId, {});

      expect(createArgs().data.total.toString()).toBe('0');
    });

    it('rejects a non-existent product and creates nothing', async () => {
      tx.product.findMany.mockResolvedValue([]);

      await expect(
        service.createFromSupplierQuotation(supplierQuotationId, {}),
      ).rejects.toBeInstanceOf(ApiException);
      expect(tx.purchaseOrder.create).not.toHaveBeenCalled();
    });

    it('retries on a purchase_order_number collision without failing', async () => {
      const collision = {
        code: 'P2002',
        meta: { target: ['purchase_order_number'] },
      };
      tx.purchaseOrder.create
        .mockRejectedValueOnce(collision)
        .mockResolvedValueOnce(
          storedPurchaseOrder({ purchaseOrderNumber: 'PO-2026-000002' }),
        );

      const result = await service.createFromSupplierQuotation(
        supplierQuotationId,
        {},
      );

      expect(tx.purchaseOrder.create).toHaveBeenCalledTimes(2);
      expect(result.purchaseOrderNumber).toBe('PO-2026-000002');
    });

    it('rejects immediately on a supplier_quotation_id unique collision, never retried', async () => {
      const collision = {
        code: 'P2002',
        meta: { target: ['supplier_quotation_id'] },
      };
      tx.purchaseOrder.create.mockRejectedValueOnce(collision);

      await expect(
        service.createFromSupplierQuotation(supplierQuotationId, {}),
      ).rejects.toBeInstanceOf(ApiException);
      expect(tx.purchaseOrder.create).toHaveBeenCalledTimes(1);
    });

    it('never surfaces a raw Prisma/Postgres error after exhausting retries', async () => {
      const ambiguous = {
        code: 'P2039',
        meta: { driverAdapterError: { cause: { originalCode: '23505' } } },
      };
      tx.purchaseOrder.create.mockRejectedValue(ambiguous);

      await expect(
        service.createFromSupplierQuotation(supplierQuotationId, {}),
      ).rejects.toBeInstanceOf(ApiException);
    });
  });

  describe('update — lifecycle', () => {
    it.each([
      ['draft', 'issued'],
      ['draft', 'cancelled'],
      ['issued', 'confirmed'],
      ['issued', 'cancelled'],
      ['confirmed', 'cancelled'],
    ])('allows the valid transition %s -> %s', async (from, to) => {
      prisma.purchaseOrder.findUnique.mockResolvedValue(
        storedPurchaseOrder({ status: from }),
      );
      prisma.purchaseOrder.update.mockResolvedValue(
        storedPurchaseOrder({ status: to }),
      );

      const result = await service.update(purchaseOrderId, {
        status: to as 'issued' | 'confirmed' | 'cancelled',
      });

      expect(result.status).toBe(to);
    });

    it.each([
      ['confirmed', 'partially_received'],
      ['confirmed', 'received'],
      ['partially_received', 'received'],
      ['received', 'closed'],
    ])(
      'rejects the receiving-dependent transition %s -> %s (not available in Phase 22)',
      async (from, to) => {
        prisma.purchaseOrder.findUnique.mockResolvedValue(
          storedPurchaseOrder({ status: from }),
        );

        await expect(
          service.update(purchaseOrderId, { status: to as never }),
        ).rejects.toBeInstanceOf(ApiException);
        expect(prisma.purchaseOrder.update).not.toHaveBeenCalled();
      },
    );

    it('cancelled is terminal', async () => {
      prisma.purchaseOrder.findUnique.mockResolvedValue(
        storedPurchaseOrder({ status: 'cancelled' }),
      );

      await expect(
        service.update(purchaseOrderId, { status: 'issued' }),
      ).rejects.toBeInstanceOf(ApiException);
    });
  });

  describe('update — field locking', () => {
    it('allows editing expectedDeliveryDate/notes while draft', async () => {
      prisma.purchaseOrder.findUnique.mockResolvedValue(
        storedPurchaseOrder({ status: 'draft' }),
      );
      prisma.purchaseOrder.update.mockResolvedValue(
        storedPurchaseOrder({ notes: 'Updated' }),
      );

      const result = await service.update(purchaseOrderId, {
        notes: 'Updated',
        expectedDeliveryDate: '2026-06-01T00:00:00.000Z',
      });

      expect(result.notes).toBe('Updated');
    });

    it('rejects editing expectedDeliveryDate once the order has left draft', async () => {
      prisma.purchaseOrder.findUnique.mockResolvedValue(
        storedPurchaseOrder({ status: 'issued' }),
      );

      await expect(
        service.update(purchaseOrderId, {
          expectedDeliveryDate: '2026-06-01T00:00:00.000Z',
        }),
      ).rejects.toBeInstanceOf(ApiException);
      expect(prisma.purchaseOrder.update).not.toHaveBeenCalled();
    });

    it('still allows editing notes once the order has left draft', async () => {
      prisma.purchaseOrder.findUnique.mockResolvedValue(
        storedPurchaseOrder({ status: 'issued' }),
      );
      prisma.purchaseOrder.update.mockResolvedValue(
        storedPurchaseOrder({ status: 'issued', notes: 'Follow up' }),
      );

      const result = await service.update(purchaseOrderId, {
        notes: 'Follow up',
      });

      expect(result.notes).toBe('Follow up');
    });

    it('never allows supplierQuotationId/supplierCompanyId/currency/items/subtotal/total to be touched (not part of UpdatePurchaseOrderDto)', async () => {
      prisma.purchaseOrder.findUnique.mockResolvedValue(
        storedPurchaseOrder({ status: 'draft' }),
      );
      prisma.purchaseOrder.update.mockResolvedValue(storedPurchaseOrder());

      await service.update(purchaseOrderId, {});

      /* eslint-disable @typescript-eslint/no-unsafe-member-access -- jest.Mock's own `.calls` type is untyped by Jest's own types. */
      const updateArgs = prisma.purchaseOrder.update.mock.calls[0][0] as {
        data: Record<string, unknown>;
      };
      /* eslint-enable @typescript-eslint/no-unsafe-member-access */
      expect(updateArgs.data).not.toHaveProperty('supplierQuotationId');
      expect(updateArgs.data).not.toHaveProperty('supplierCompanyId');
      expect(updateArgs.data).not.toHaveProperty('currency');
      expect(updateArgs.data).not.toHaveProperty('items');
      expect(updateArgs.data).not.toHaveProperty('subtotal');
      expect(updateArgs.data).not.toHaveProperty('total');
    });

    it('throws NOT_FOUND for a missing id', async () => {
      prisma.purchaseOrder.findUnique.mockResolvedValue(null);

      await expect(
        service.update('missing', { notes: 'x' }),
      ).rejects.toBeInstanceOf(ApiException);
    });
  });
});
