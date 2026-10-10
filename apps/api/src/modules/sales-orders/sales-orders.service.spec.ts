import { Test } from '@nestjs/testing';
import { Prisma } from '../../../generated/prisma/client';
import { ApiException } from '../../common/exceptions/api.exception';
import { PrismaService } from '../../prisma/prisma.service';
import { SalesOrdersService } from './sales-orders.service';

describe('SalesOrdersService', () => {
  let service: SalesOrdersService;
  let prisma: {
    salesOrder: {
      findMany: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let tx: {
    quotation: { findUnique: jest.Mock };
    salesOrder: { findFirst: jest.Mock; create: jest.Mock };
    product: { findMany: jest.Mock };
  };

  const company = { id: 'company-1', name: 'Buyer Co' };
  const quotationId = 'quotation-1';
  const salesOrderId = 'sales-order-1';
  const productId = 'product-1';

  function storedQuotationItem(overrides: Record<string, unknown> = {}) {
    return {
      id: 'quotation-item-1',
      quotationId,
      productId,
      productNameSnapshot: 'Stale Quotation Snapshot',
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

  function storedQuotation(overrides: Record<string, unknown> = {}) {
    return {
      id: quotationId,
      quotationNumber: 'QT-2026-000001',
      rfqId: 'rfq-1',
      companyId: company.id,
      status: 'accepted',
      currency: 'USD',
      discount: null,
      shippingCost: null,
      items: [storedQuotationItem()],
      ...overrides,
    };
  }

  function storedSalesOrder(overrides: Record<string, unknown> = {}) {
    return {
      id: salesOrderId,
      salesOrderNumber: 'SO-2026-000001',
      quotationId,
      companyId: company.id,
      company,
      status: 'draft',
      orderDate: new Date('2026-01-01T00:00:00.000Z'),
      requestedDeliveryDate: null,
      currency: 'USD',
      subtotal: new Prisma.Decimal(250),
      discount: null,
      shippingCost: null,
      total: new Prisma.Decimal(250),
      notes: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      items: [],
      quotation: { id: quotationId, quotationNumber: 'QT-2026-000001' },
      ...overrides,
    };
  }

  beforeEach(async () => {
    tx = {
      quotation: {
        findUnique: jest.fn().mockResolvedValue(storedQuotation()),
      },
      salesOrder: {
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
      salesOrder: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn((fn: (t: unknown) => unknown) => fn(tx)),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        SalesOrdersService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = moduleRef.get(SalesOrdersService);
  });

  function createArgs() {
    /* eslint-disable @typescript-eslint/no-unsafe-member-access -- jest.Mock's own `.calls` type is untyped by Jest's own types. */
    return tx.salesOrder.create.mock.calls[0][0] as {
      data: {
        companyId: string;
        currency: string;
        status: string;
        subtotal: Prisma.Decimal;
        discount: Prisma.Decimal | null;
        shippingCost: Prisma.Decimal | null;
        total: Prisma.Decimal;
        requestedDeliveryDate: Date | null;
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
            specifications: string | null;
            notes: string | null;
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

      expect(prisma.salesOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
      expect(result.meta).toEqual(
        expect.objectContaining({ page: 1, limit: 25, total: 0 }),
      );
    });

    it('filters by status/companyId/quotationId/currency', async () => {
      await service.findAll({
        page: 1,
        limit: 25,
        sort: '-created_at',
        status: 'draft',
        companyId: company.id,
        quotationId,
        currency: 'USD',
      });

      expect(prisma.salesOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            status: 'draft',
            companyId: company.id,
            quotationId,
            currency: 'USD',
          },
        }),
      );
    });

    it('searches by q across salesOrderNumber and company name', async () => {
      await service.findAll({
        page: 1,
        limit: 25,
        sort: '-created_at',
        q: 'SO-2026',
      });

      /* eslint-disable @typescript-eslint/no-unsafe-member-access -- jest.Mock's own `.calls` type is untyped by Jest's own types. */
      const args = prisma.salesOrder.findMany.mock.calls[0][0] as {
        where: { OR: unknown[] };
      };
      /* eslint-enable @typescript-eslint/no-unsafe-member-access */
      expect(args.where.OR).toHaveLength(2);
    });
  });

  describe('findOne', () => {
    it('returns the sales order when found', async () => {
      prisma.salesOrder.findUnique.mockResolvedValue(storedSalesOrder());

      const result = await service.findOne(salesOrderId);

      expect(result.id).toBe(salesOrderId);
    });

    it('throws NOT_FOUND for a missing id', async () => {
      prisma.salesOrder.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toBeInstanceOf(
        ApiException,
      );
    });
  });

  describe('createFromQuotation', () => {
    it('creates a sales order from an accepted quotation', async () => {
      tx.salesOrder.create.mockResolvedValue(storedSalesOrder());

      const result = await service.createFromQuotation(quotationId, {});

      expect(result.id).toBe(salesOrderId);
    });

    it.each(['draft', 'sent', 'rejected', 'expired', 'cancelled'])(
      'rejects a quotation with status "%s"',
      async (status) => {
        tx.quotation.findUnique.mockResolvedValue(storedQuotation({ status }));

        await expect(
          service.createFromQuotation(quotationId, {}),
        ).rejects.toBeInstanceOf(ApiException);
        expect(tx.salesOrder.create).not.toHaveBeenCalled();
      },
    );

    it('throws NOT_FOUND when the quotation does not exist', async () => {
      tx.quotation.findUnique.mockResolvedValue(null);

      await expect(
        service.createFromQuotation('missing', {}),
      ).rejects.toBeInstanceOf(ApiException);
      expect(tx.salesOrder.create).not.toHaveBeenCalled();
    });

    it('derives companyId from the quotation', async () => {
      tx.salesOrder.create.mockResolvedValue(storedSalesOrder());

      await service.createFromQuotation(quotationId, {});

      expect(createArgs().data.companyId).toBe(company.id);
    });

    it('derives currency from the quotation', async () => {
      tx.quotation.findUnique.mockResolvedValue(
        storedQuotation({ currency: 'IDR' }),
      );
      tx.salesOrder.create.mockResolvedValue(storedSalesOrder());

      await service.createFromQuotation(quotationId, {});

      expect(createArgs().data.currency).toBe('IDR');
    });

    it('accepts an optional requestedDeliveryDate', async () => {
      tx.salesOrder.create.mockResolvedValue(storedSalesOrder());

      await service.createFromQuotation(quotationId, {
        requestedDeliveryDate: '2026-05-01T00:00:00.000Z',
      });

      expect(createArgs().data.requestedDeliveryDate?.toISOString()).toBe(
        '2026-05-01T00:00:00.000Z',
      );
    });

    it('stores null requestedDeliveryDate when omitted', async () => {
      tx.salesOrder.create.mockResolvedValue(storedSalesOrder());

      await service.createFromQuotation(quotationId, {});

      expect(createArgs().data.requestedDeliveryDate).toBeNull();
    });

    it('accepts optional notes', async () => {
      tx.salesOrder.create.mockResolvedValue(storedSalesOrder());

      await service.createFromQuotation(quotationId, { notes: 'Rush order' });

      expect(createArgs().data.notes).toBe('Rush order');
    });

    it('starts the sales order as draft', async () => {
      tx.salesOrder.create.mockResolvedValue(storedSalesOrder());

      await service.createFromQuotation(quotationId, {});

      expect(createArgs().data.status).toBe('draft');
    });

    it('never touches Quotation.status', async () => {
      tx.salesOrder.create.mockResolvedValue(storedSalesOrder());

      await service.createFromQuotation(quotationId, {});

      // tx has no quotation.update/updateMany defined at all — if the service attempted to
      // call one, this test's own mock setup would throw a TypeError, proving no such call
      // was ever made.
      expect(tx.quotation.findUnique).toHaveBeenCalledTimes(1);
    });

    describe('item propagation', () => {
      it('copies every quotation item', async () => {
        tx.quotation.findUnique.mockResolvedValue(
          storedQuotation({
            items: [
              storedQuotationItem({ id: 'qi-1', productId: 'product-1' }),
              storedQuotationItem({ id: 'qi-2', productId: 'product-2' }),
            ],
          }),
        );
        tx.product.findMany.mockResolvedValue([
          { id: 'product-1', name: 'Product One' },
          { id: 'product-2', name: 'Product Two' },
        ]);
        tx.salesOrder.create.mockResolvedValue(storedSalesOrder());

        await service.createFromQuotation(quotationId, {});

        expect(createArgs().data.items.create).toHaveLength(2);
      });

      it('copies productId from the QuotationItem', async () => {
        tx.salesOrder.create.mockResolvedValue(storedSalesOrder());

        await service.createFromQuotation(quotationId, {});

        expect(createArgs().data.items.create[0].productId).toBe(productId);
      });

      it('derives productNameSnapshot from the live Product, never from QuotationItem.productNameSnapshot', async () => {
        tx.quotation.findUnique.mockResolvedValue(
          storedQuotation({
            items: [
              storedQuotationItem({
                productNameSnapshot: 'Stale Quotation Snapshot',
              }),
            ],
          }),
        );
        tx.product.findMany.mockResolvedValue([
          { id: productId, name: 'Fresh Live Product Name' },
        ]);
        tx.salesOrder.create.mockResolvedValue(storedSalesOrder());

        await service.createFromQuotation(quotationId, {});

        expect(createArgs().data.items.create[0].productNameSnapshot).toBe(
          'Fresh Live Product Name',
        );
      });

      it('copies quantity exactly from the QuotationItem, with no override input available', async () => {
        tx.quotation.findUnique.mockResolvedValue(
          storedQuotation({
            items: [
              storedQuotationItem({
                quantity: new Prisma.Decimal(2800),
                unitPrice: new Prisma.Decimal(1),
                discount: new Prisma.Decimal(0),
                subtotal: new Prisma.Decimal(2800),
              }),
            ],
          }),
        );
        tx.salesOrder.create.mockResolvedValue(storedSalesOrder());

        await service.createFromQuotation(quotationId, {});

        expect(createArgs().data.items.create[0].quantity.toString()).toBe(
          '2800',
        );
      });

      it('copies unit from the QuotationItem', async () => {
        tx.quotation.findUnique.mockResolvedValue(
          storedQuotation({ items: [storedQuotationItem({ unit: 'KG' })] }),
        );
        tx.salesOrder.create.mockResolvedValue(storedSalesOrder());

        await service.createFromQuotation(quotationId, {});

        expect(createArgs().data.items.create[0].unit).toBe('KG');
      });

      it('copies unitPrice from the QuotationItem', async () => {
        tx.salesOrder.create.mockResolvedValue(storedSalesOrder());

        await service.createFromQuotation(quotationId, {});

        expect(createArgs().data.items.create[0].unitPrice.toString()).toBe(
          '25.5',
        );
      });

      it('copies item discount from the QuotationItem', async () => {
        tx.salesOrder.create.mockResolvedValue(storedSalesOrder());

        await service.createFromQuotation(quotationId, {});

        expect(createArgs().data.items.create[0].discount?.toString()).toBe(
          '5',
        );
      });

      it('preserves the accepted quotation item subtotal exactly', async () => {
        tx.salesOrder.create.mockResolvedValue(storedSalesOrder());

        await service.createFromQuotation(quotationId, {});

        expect(createArgs().data.items.create[0].subtotal.toString()).toBe(
          '250',
        );
      });

      it('copies specifications from the QuotationItem', async () => {
        tx.quotation.findUnique.mockResolvedValue(
          storedQuotation({
            items: [storedQuotationItem({ specifications: 'Thailand Grade' })],
          }),
        );
        tx.salesOrder.create.mockResolvedValue(storedSalesOrder());

        await service.createFromQuotation(quotationId, {});

        expect(createArgs().data.items.create[0].specifications).toBe(
          'Thailand Grade',
        );
      });

      it('copies notes from the QuotationItem', async () => {
        tx.quotation.findUnique.mockResolvedValue(
          storedQuotation({
            items: [storedQuotationItem({ notes: 'Handle with care' })],
          }),
        );
        tx.salesOrder.create.mockResolvedValue(storedSalesOrder());

        await service.createFromQuotation(quotationId, {});

        expect(createArgs().data.items.create[0].notes).toBe(
          'Handle with care',
        );
      });

      it('rejects a quotation item whose stored subtotal is internally inconsistent', async () => {
        tx.quotation.findUnique.mockResolvedValue(
          storedQuotation({
            items: [
              storedQuotationItem({ subtotal: new Prisma.Decimal(99999) }),
            ],
          }),
        );

        await expect(
          service.createFromQuotation(quotationId, {}),
        ).rejects.toBeInstanceOf(ApiException);
        expect(tx.salesOrder.create).not.toHaveBeenCalled();
      });

      it('rejects a quotation with no items', async () => {
        tx.quotation.findUnique.mockResolvedValue(
          storedQuotation({ items: [] }),
        );

        await expect(
          service.createFromQuotation(quotationId, {}),
        ).rejects.toBeInstanceOf(ApiException);
        expect(tx.salesOrder.create).not.toHaveBeenCalled();
      });
    });

    describe('commercial totals', () => {
      it('copies order discount from the quotation', async () => {
        tx.quotation.findUnique.mockResolvedValue(
          storedQuotation({ discount: new Prisma.Decimal(10) }),
        );
        tx.salesOrder.create.mockResolvedValue(storedSalesOrder());

        await service.createFromQuotation(quotationId, {});

        expect(createArgs().data.discount?.toString()).toBe('10');
      });

      it('copies shippingCost from the quotation', async () => {
        tx.quotation.findUnique.mockResolvedValue(
          storedQuotation({ shippingCost: new Prisma.Decimal(15) }),
        );
        tx.salesOrder.create.mockResolvedValue(storedSalesOrder());

        await service.createFromQuotation(quotationId, {});

        expect(createArgs().data.shippingCost?.toString()).toBe('15');
      });

      it('server-calculates subtotal as the sum of item subtotals', async () => {
        tx.quotation.findUnique.mockResolvedValue(
          storedQuotation({
            items: [
              storedQuotationItem({
                id: 'qi-1',
                productId: 'product-1',
                unitPrice: new Prisma.Decimal(10),
                discount: new Prisma.Decimal(0),
                subtotal: new Prisma.Decimal(100),
              }),
              storedQuotationItem({
                id: 'qi-2',
                productId: 'product-2',
                unitPrice: new Prisma.Decimal(15),
                discount: new Prisma.Decimal(0),
                subtotal: new Prisma.Decimal(150),
              }),
            ],
          }),
        );
        tx.product.findMany.mockResolvedValue([
          { id: 'product-1', name: 'Product One' },
          { id: 'product-2', name: 'Product Two' },
        ]);
        tx.salesOrder.create.mockResolvedValue(storedSalesOrder());

        await service.createFromQuotation(quotationId, {});

        expect(createArgs().data.subtotal.toString()).toBe('250');
      });

      it('server-calculates total as subtotal minus discount plus shippingCost', async () => {
        tx.quotation.findUnique.mockResolvedValue(
          storedQuotation({
            discount: new Prisma.Decimal(20),
            shippingCost: new Prisma.Decimal(30),
          }),
        );
        tx.salesOrder.create.mockResolvedValue(storedSalesOrder());

        await service.createFromQuotation(quotationId, {});

        // subtotal 250 - 20 + 30 = 260
        expect(createArgs().data.total.toString()).toBe('260');
      });

      it('ignores any client-supplied totals (CreateSalesOrderDto has no such fields)', async () => {
        tx.salesOrder.create.mockResolvedValue(storedSalesOrder());

        await service.createFromQuotation(quotationId, {
          // Simulates a malicious/malformed payload.
          subtotal: 999999,
          total: 999999,
        } as never);

        expect(createArgs().data.subtotal.toString()).toBe('250');
        expect(createArgs().data.total.toString()).toBe('250');
      });
    });

    describe('duplicate sales order', () => {
      it('rejects creating a second sales order from the same quotation', async () => {
        tx.salesOrder.findFirst.mockResolvedValue({ id: 'existing-so' });

        await expect(
          service.createFromQuotation(quotationId, {}),
        ).rejects.toBeInstanceOf(ApiException);
        expect(tx.salesOrder.create).not.toHaveBeenCalled();
      });

      it('checks for a duplicate scoped to this quotationId', async () => {
        tx.salesOrder.create.mockResolvedValue(storedSalesOrder());

        await service.createFromQuotation(quotationId, {});

        expect(tx.salesOrder.findFirst).toHaveBeenCalledWith({
          where: { quotationId },
          select: { id: true },
        });
      });
    });

    describe('product validation', () => {
      it('rejects when a referenced product no longer exists', async () => {
        tx.product.findMany.mockResolvedValue([]);

        await expect(
          service.createFromQuotation(quotationId, {}),
        ).rejects.toBeInstanceOf(ApiException);
        expect(tx.salesOrder.create).not.toHaveBeenCalled();
      });
    });

    describe('number generation', () => {
      it('retries on a sales_order_number collision without failing', async () => {
        const collision = {
          code: 'P2002',
          meta: { target: ['sales_order_number'] },
        };
        tx.salesOrder.create
          .mockRejectedValueOnce(collision)
          .mockResolvedValueOnce(
            storedSalesOrder({ salesOrderNumber: 'SO-2026-000002' }),
          );

        const result = await service.createFromQuotation(quotationId, {});

        expect(tx.salesOrder.create).toHaveBeenCalledTimes(2);
        expect(result.salesOrderNumber).toBe('SO-2026-000002');
      });

      it('never surfaces a raw Prisma/Postgres error after exhausting retries', async () => {
        const ambiguous = {
          code: 'P2039',
          meta: { driverAdapterError: { cause: { originalCode: '23505' } } },
        };
        tx.salesOrder.create.mockRejectedValue(ambiguous);

        await expect(
          service.createFromQuotation(quotationId, {}),
        ).rejects.toBeInstanceOf(ApiException);
      });
    });
  });

  describe('update — lifecycle', () => {
    it.each([
      ['draft', 'confirmed'],
      ['draft', 'cancelled'],
      ['confirmed', 'processing'],
      ['confirmed', 'cancelled'],
      ['processing', 'fulfilled'],
      ['processing', 'cancelled'],
    ])('allows the valid transition %s -> %s', async (from, to) => {
      prisma.salesOrder.findUnique.mockResolvedValue(
        storedSalesOrder({ status: from }),
      );
      prisma.salesOrder.update.mockResolvedValue(
        storedSalesOrder({ status: to }),
      );

      const result = await service.update(salesOrderId, {
        status: to as 'confirmed' | 'processing' | 'fulfilled' | 'cancelled',
      });

      expect(result.status).toBe(to);
    });

    it.each([
      ['draft', 'processing'],
      ['draft', 'fulfilled'],
      ['confirmed', 'fulfilled'],
      ['fulfilled', 'confirmed'],
      ['cancelled', 'confirmed'],
    ])('rejects the invalid transition %s -> %s', async (from, to) => {
      prisma.salesOrder.findUnique.mockResolvedValue(
        storedSalesOrder({ status: from }),
      );

      await expect(
        service.update(salesOrderId, {
          status: to as 'confirmed' | 'processing' | 'fulfilled' | 'cancelled',
        }),
      ).rejects.toBeInstanceOf(ApiException);
      expect(prisma.salesOrder.update).not.toHaveBeenCalled();
    });

    it('rejects transitioning into partially_fulfilled', async () => {
      prisma.salesOrder.findUnique.mockResolvedValue(
        storedSalesOrder({ status: 'processing' }),
      );

      await expect(
        service.update(salesOrderId, {
          status: 'partially_fulfilled' as never,
        }),
      ).rejects.toBeInstanceOf(ApiException);
      expect(prisma.salesOrder.update).not.toHaveBeenCalled();
    });

    it('fulfilled is terminal', async () => {
      prisma.salesOrder.findUnique.mockResolvedValue(
        storedSalesOrder({ status: 'fulfilled' }),
      );

      await expect(
        service.update(salesOrderId, { status: 'confirmed' }),
      ).rejects.toBeInstanceOf(ApiException);
    });

    it('cancelled is terminal', async () => {
      prisma.salesOrder.findUnique.mockResolvedValue(
        storedSalesOrder({ status: 'cancelled' }),
      );

      await expect(
        service.update(salesOrderId, { status: 'confirmed' }),
      ).rejects.toBeInstanceOf(ApiException);
    });
  });

  describe('update — field locking', () => {
    it('allows editing requestedDeliveryDate/notes while draft', async () => {
      prisma.salesOrder.findUnique.mockResolvedValue(
        storedSalesOrder({ status: 'draft' }),
      );
      prisma.salesOrder.update.mockResolvedValue(
        storedSalesOrder({ notes: 'Updated' }),
      );

      const result = await service.update(salesOrderId, {
        notes: 'Updated',
        requestedDeliveryDate: '2026-06-01T00:00:00.000Z',
      });

      expect(result.notes).toBe('Updated');
    });

    it('rejects editing requestedDeliveryDate once the order has left draft', async () => {
      prisma.salesOrder.findUnique.mockResolvedValue(
        storedSalesOrder({ status: 'confirmed' }),
      );

      await expect(
        service.update(salesOrderId, {
          requestedDeliveryDate: '2026-06-01T00:00:00.000Z',
        }),
      ).rejects.toBeInstanceOf(ApiException);
      expect(prisma.salesOrder.update).not.toHaveBeenCalled();
    });

    it('still allows editing notes once the order has left draft', async () => {
      prisma.salesOrder.findUnique.mockResolvedValue(
        storedSalesOrder({ status: 'confirmed' }),
      );
      prisma.salesOrder.update.mockResolvedValue(
        storedSalesOrder({ status: 'confirmed', notes: 'Follow up' }),
      );

      const result = await service.update(salesOrderId, {
        notes: 'Follow up',
      });

      expect(result.notes).toBe('Follow up');
    });

    it('never allows quotationId/companyId/currency/items/subtotal/total to be touched (not part of UpdateSalesOrderDto)', async () => {
      prisma.salesOrder.findUnique.mockResolvedValue(
        storedSalesOrder({ status: 'draft' }),
      );
      prisma.salesOrder.update.mockResolvedValue(storedSalesOrder());

      await service.update(salesOrderId, {});

      /* eslint-disable @typescript-eslint/no-unsafe-member-access -- jest.Mock's own `.calls` type is untyped by Jest's own types. */
      const updateArgs = prisma.salesOrder.update.mock.calls[0][0] as {
        data: Record<string, unknown>;
      };
      /* eslint-enable @typescript-eslint/no-unsafe-member-access */
      expect(updateArgs.data).not.toHaveProperty('quotationId');
      expect(updateArgs.data).not.toHaveProperty('companyId');
      expect(updateArgs.data).not.toHaveProperty('currency');
      expect(updateArgs.data).not.toHaveProperty('items');
      expect(updateArgs.data).not.toHaveProperty('subtotal');
      expect(updateArgs.data).not.toHaveProperty('total');
    });

    it('throws NOT_FOUND for a missing id', async () => {
      prisma.salesOrder.findUnique.mockResolvedValue(null);

      await expect(
        service.update('missing', { notes: 'x' }),
      ).rejects.toBeInstanceOf(ApiException);
    });
  });
});
