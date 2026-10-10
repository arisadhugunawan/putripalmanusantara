import { Test } from '@nestjs/testing';
import { Prisma } from '../../../generated/prisma/client';
import { ApiException } from '../../common/exceptions/api.exception';
import { PrismaService } from '../../prisma/prisma.service';
import { SalesQuotationsService } from './sales-quotations.service';

describe('SalesQuotationsService', () => {
  let service: SalesQuotationsService;
  let prisma: {
    quotation: {
      findMany: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let tx: {
    rFQ: { findUnique: jest.Mock; updateMany: jest.Mock };
    rFQItem: { findMany: jest.Mock };
    product: { findMany: jest.Mock };
    quotation: { create: jest.Mock; findFirst: jest.Mock; update: jest.Mock };
  };

  const company = { id: 'company-1', name: 'Buyer Co' };
  const rfqId = 'rfq-1';
  const quotationId = 'quotation-1';
  const productId = 'product-1';

  function storedRfq(overrides: Record<string, unknown> = {}) {
    return {
      id: rfqId,
      rfqNumber: 'RFQ-2026-000001',
      companyId: company.id,
      status: 'reviewing',
      ...overrides,
    };
  }

  function storedRfqItem(overrides: Record<string, unknown> = {}) {
    return {
      id: 'rfq-item-1',
      rfqId,
      productId,
      productNameSnapshot: null,
      quantity: new Prisma.Decimal(10),
      unit: 'ton',
      requestedDeliveryDate: null,
      specifications: null,
      notes: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      ...overrides,
    };
  }

  function storedQuotation(overrides: Record<string, unknown> = {}) {
    return {
      id: quotationId,
      quotationNumber: 'QT-2026-000001',
      rfqId,
      companyId: company.id,
      company,
      status: 'draft',
      quotationDate: new Date('2026-01-01T00:00:00.000Z'),
      validUntil: null,
      currency: 'USD',
      subtotal: new Prisma.Decimal(250),
      discount: null,
      shippingCost: null,
      total: new Prisma.Decimal(250),
      notes: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      items: [],
      rfq: { id: rfqId, rfqNumber: 'RFQ-2026-000001' },
      ...overrides,
    };
  }

  beforeEach(async () => {
    tx = {
      rFQ: {
        findUnique: jest.fn().mockResolvedValue(storedRfq()),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      rFQItem: {
        findMany: jest.fn().mockResolvedValue([storedRfqItem()]),
      },
      product: {
        findMany: jest
          .fn()
          .mockResolvedValue([{ id: productId, name: 'Copra' }]),
      },
      quotation: {
        create: jest.fn(),
        findFirst: jest.fn().mockResolvedValue(null),
        update: jest.fn(),
      },
    };
    prisma = {
      quotation: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn((fn: (t: unknown) => unknown) => fn(tx)),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        SalesQuotationsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = moduleRef.get(SalesQuotationsService);
  });

  const oneItem = [
    { productId, quantity: 10, unit: 'ton', unitPrice: 25.5, discount: 5 },
  ];
  const baseCreateDto = { items: oneItem, currency: 'USD' };

  describe('findAll', () => {
    it('lists with no filters', async () => {
      const result = await service.findAll({
        page: 1,
        limit: 25,
        sort: '-created_at',
      });

      expect(prisma.quotation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
      expect(result.meta).toEqual(
        expect.objectContaining({ page: 1, limit: 25, total: 0 }),
      );
    });

    it('filters by status/companyId/rfqId/currency', async () => {
      await service.findAll({
        page: 1,
        limit: 25,
        sort: '-created_at',
        status: 'draft',
        companyId: company.id,
        rfqId,
        currency: 'USD',
      });

      expect(prisma.quotation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            status: 'draft',
            companyId: company.id,
            rfqId,
            currency: 'USD',
          },
        }),
      );
    });

    it('searches by q across quotationNumber and company name', async () => {
      await service.findAll({
        page: 1,
        limit: 25,
        sort: '-created_at',
        q: 'QT-2026',
      });

      /* eslint-disable @typescript-eslint/no-unsafe-member-access -- jest.Mock's own `.calls` type is untyped by Jest's own types. */
      const args = prisma.quotation.findMany.mock.calls[0][0] as {
        where: { OR: unknown[] };
      };
      /* eslint-enable @typescript-eslint/no-unsafe-member-access */
      expect(args.where.OR).toHaveLength(2);
    });
  });

  describe('findOne', () => {
    it('returns the quotation when found', async () => {
      prisma.quotation.findUnique.mockResolvedValue(storedQuotation());

      const result = await service.findOne(quotationId);

      expect(result.id).toBe(quotationId);
    });

    it('throws NOT_FOUND for a missing id', async () => {
      prisma.quotation.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toBeInstanceOf(
        ApiException,
      );
    });
  });

  describe('createFromRfq', () => {
    it('throws NOT_FOUND when the RFQ does not exist', async () => {
      tx.rFQ.findUnique.mockResolvedValue(null);

      await expect(
        service.createFromRfq(rfqId, baseCreateDto),
      ).rejects.toBeInstanceOf(ApiException);
      expect(tx.quotation.create).not.toHaveBeenCalled();
    });

    it.each(['reviewing', 'quoted'])(
      'accepts an RFQ with status "%s"',
      async (status) => {
        tx.rFQ.findUnique.mockResolvedValue(storedRfq({ status }));
        tx.quotation.create.mockResolvedValue(storedQuotation());

        const result = await service.createFromRfq(rfqId, baseCreateDto);

        expect(result.id).toBe(quotationId);
      },
    );

    it.each(['draft', 'submitted', 'rejected', 'cancelled'])(
      'rejects an RFQ with status "%s"',
      async (status) => {
        tx.rFQ.findUnique.mockResolvedValue(storedRfq({ status }));

        await expect(
          service.createFromRfq(rfqId, baseCreateDto),
        ).rejects.toBeInstanceOf(ApiException);
        expect(tx.quotation.create).not.toHaveBeenCalled();
      },
    );

    it('derives companyId from the RFQ', async () => {
      tx.quotation.create.mockResolvedValue(storedQuotation());

      await service.createFromRfq(rfqId, baseCreateDto);

      /* eslint-disable @typescript-eslint/no-unsafe-assignment -- expect.* matchers are untyped by Jest's own types. */
      expect(tx.quotation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ companyId: company.id }),
        }),
      );
      /* eslint-enable @typescript-eslint/no-unsafe-assignment */
    });

    it('ignores any client-supplied companyId', async () => {
      tx.quotation.create.mockResolvedValue(storedQuotation());

      await service.createFromRfq(rfqId, {
        ...baseCreateDto,
        // Simulates a malicious/malformed payload — CreateQuotationDto has no `companyId`
        // field at all, so this can never reach the service through normal validation.
        companyId: 'attacker-supplied-company',
      } as never);

      /* eslint-disable @typescript-eslint/no-unsafe-assignment -- expect.* matchers are untyped by Jest's own types. */
      expect(tx.quotation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ companyId: company.id }),
        }),
      );
      /* eslint-enable @typescript-eslint/no-unsafe-assignment */
    });

    it('always starts the quotation as draft', async () => {
      tx.rFQ.findUnique.mockResolvedValue(storedRfq({ status: 'quoted' }));
      tx.quotation.create.mockResolvedValue(storedQuotation());

      await service.createFromRfq(rfqId, baseCreateDto);

      /* eslint-disable @typescript-eslint/no-unsafe-assignment -- expect.* matchers are untyped by Jest's own types. */
      expect(tx.quotation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'draft' }),
        }),
      );
      /* eslint-enable @typescript-eslint/no-unsafe-assignment */
    });

    it('flips RFQ status reviewing -> quoted on the first quotation', async () => {
      tx.rFQ.findUnique.mockResolvedValue(storedRfq({ status: 'reviewing' }));
      tx.quotation.create.mockResolvedValue(storedQuotation());

      await service.createFromRfq(rfqId, baseCreateDto);

      expect(tx.rFQ.updateMany).toHaveBeenCalledWith({
        where: { id: rfqId, status: 'reviewing' },
        data: { status: 'quoted' },
      });
    });

    it('does not touch RFQ status when it was already quoted', async () => {
      tx.rFQ.findUnique.mockResolvedValue(storedRfq({ status: 'quoted' }));
      tx.quotation.create.mockResolvedValue(storedQuotation());

      await service.createFromRfq(rfqId, baseCreateDto);

      expect(tx.rFQ.updateMany).not.toHaveBeenCalled();
    });

    it('commits as a legitimate revision when the conditional update race loses but the RFQ is now quoted', async () => {
      tx.rFQ.findUnique
        .mockResolvedValueOnce(storedRfq({ status: 'reviewing' }))
        .mockResolvedValueOnce({ status: 'quoted' });
      tx.rFQ.updateMany.mockResolvedValue({ count: 0 });
      tx.quotation.create.mockResolvedValue(storedQuotation());

      const result = await service.createFromRfq(rfqId, baseCreateDto);

      expect(result.id).toBe(quotationId);
      expect(tx.rFQ.findUnique).toHaveBeenCalledTimes(2);
    });

    it('rolls back with a clean 409 when the conditional update race loses and the RFQ is in an unexpected state', async () => {
      tx.rFQ.findUnique
        .mockResolvedValueOnce(storedRfq({ status: 'reviewing' }))
        .mockResolvedValueOnce({ status: 'cancelled' });
      tx.rFQ.updateMany.mockResolvedValue({ count: 0 });
      tx.quotation.create.mockResolvedValue(storedQuotation());

      await expect(
        service.createFromRfq(rfqId, baseCreateDto),
      ).rejects.toBeInstanceOf(ApiException);
    });

    it('allows a second and third quotation from the same RFQ (cardinality)', async () => {
      tx.rFQ.findUnique.mockResolvedValue(storedRfq({ status: 'quoted' }));
      tx.quotation.create
        .mockResolvedValueOnce(
          storedQuotation({ quotationNumber: 'QT-2026-000001' }),
        )
        .mockResolvedValueOnce(
          storedQuotation({ quotationNumber: 'QT-2026-000002' }),
        );

      const first = await service.createFromRfq(rfqId, baseCreateDto);
      const second = await service.createFromRfq(rfqId, baseCreateDto);

      expect(first.quotationNumber).toBe('QT-2026-000001');
      expect(second.quotationNumber).toBe('QT-2026-000002');
      expect(tx.rFQ.updateMany).not.toHaveBeenCalled();
    });

    it('rejects a non-existent product and creates nothing', async () => {
      tx.product.findMany.mockResolvedValue([]);

      await expect(
        service.createFromRfq(rfqId, {
          items: [
            { productId: 'missing', quantity: 1, unit: 'ton', unitPrice: 10 },
          ],
          currency: 'USD',
        }),
      ).rejects.toBeInstanceOf(ApiException);
      expect(tx.quotation.create).not.toHaveBeenCalled();
    });

    it('populates productNameSnapshot from the live Product master', async () => {
      tx.quotation.create.mockResolvedValue(storedQuotation());

      await service.createFromRfq(rfqId, baseCreateDto);

      /* eslint-disable @typescript-eslint/no-unsafe-member-access -- jest.Mock's own `.calls` type is untyped by Jest's own types. */
      const createArgs = tx.quotation.create.mock.calls[0][0] as {
        data: { items: { create: { productNameSnapshot: string }[] } };
      };
      /* eslint-enable @typescript-eslint/no-unsafe-member-access */
      expect(createArgs.data.items.create[0].productNameSnapshot).toBe('Copra');
    });

    it('creates multiple QuotationItems from multiple items', async () => {
      tx.rFQItem.findMany.mockResolvedValue([
        storedRfqItem({ productId: 'product-1' }),
        storedRfqItem({ id: 'rfq-item-2', productId: 'product-2' }),
      ]);
      tx.product.findMany.mockResolvedValue([
        { id: 'product-1', name: 'Copra' },
        { id: 'product-2', name: 'Semi Husked Coconut' },
      ]);
      tx.quotation.create.mockResolvedValue(storedQuotation());

      await service.createFromRfq(rfqId, {
        items: [
          { productId: 'product-1', quantity: 10, unit: 'ton', unitPrice: 20 },
          { productId: 'product-2', quantity: 5, unit: 'ton', unitPrice: 30 },
        ],
        currency: 'USD',
      });

      /* eslint-disable @typescript-eslint/no-unsafe-member-access -- jest.Mock's own `.calls` type is untyped by Jest's own types. */
      const createArgs = tx.quotation.create.mock.calls[0][0] as {
        data: { items: { create: unknown[] } };
      };
      /* eslint-enable @typescript-eslint/no-unsafe-member-access */
      expect(createArgs.data.items.create).toHaveLength(2);
    });

    it('calculates item subtotal, quotation subtotal and total with exact Decimal arithmetic', async () => {
      tx.quotation.create.mockResolvedValue(storedQuotation());

      await service.createFromRfq(rfqId, {
        items: [
          {
            productId,
            quantity: 10,
            unit: 'ton',
            unitPrice: 25.5,
            discount: 5,
          },
        ],
        currency: 'USD',
        discount: 10,
        shippingCost: 15,
      });

      /* eslint-disable @typescript-eslint/no-unsafe-member-access -- jest.Mock's own `.calls` type is untyped by Jest's own types. */
      const createArgs = tx.quotation.create.mock.calls[0][0] as {
        data: {
          subtotal: Prisma.Decimal;
          total: Prisma.Decimal;
          items: { create: { subtotal: Prisma.Decimal }[] };
        };
      };
      /* eslint-enable @typescript-eslint/no-unsafe-member-access */
      // item subtotal = 10 * 25.5 - 5 = 250
      expect(createArgs.data.items.create[0].subtotal.toString()).toBe('250');
      // quotation subtotal = 250 (only item)
      expect(createArgs.data.subtotal.toString()).toBe('250');
      // total = 250 - 10 + 15 = 255
      expect(createArgs.data.total.toString()).toBe('255');
    });

    it('treats a missing item discount/quotation discount/shippingCost as zero', async () => {
      tx.quotation.create.mockResolvedValue(storedQuotation());

      await service.createFromRfq(rfqId, {
        items: [{ productId, quantity: 4, unit: 'ton', unitPrice: 50 }],
        currency: 'USD',
      });

      /* eslint-disable @typescript-eslint/no-unsafe-member-access -- jest.Mock's own `.calls` type is untyped by Jest's own types. */
      const createArgs = tx.quotation.create.mock.calls[0][0] as {
        data: {
          subtotal: Prisma.Decimal;
          total: Prisma.Decimal;
          discount: unknown;
          shippingCost: unknown;
        };
      };
      /* eslint-enable @typescript-eslint/no-unsafe-member-access */
      expect(createArgs.data.subtotal.toString()).toBe('200');
      expect(createArgs.data.total.toString()).toBe('200');
      expect(createArgs.data.discount).toBeNull();
      expect(createArgs.data.shippingCost).toBeNull();
    });

    it('rejects an item whose discount exceeds quantity x unitPrice', async () => {
      await expect(
        service.createFromRfq(rfqId, {
          items: [
            {
              productId,
              quantity: 1,
              unit: 'ton',
              unitPrice: 10,
              discount: 50,
            },
          ],
          currency: 'USD',
        }),
      ).rejects.toBeInstanceOf(ApiException);
      expect(tx.quotation.create).not.toHaveBeenCalled();
    });

    it('rejects a quotation discount that exceeds subtotal plus shippingCost', async () => {
      await expect(
        service.createFromRfq(rfqId, {
          items: [{ productId, quantity: 1, unit: 'ton', unitPrice: 10 }],
          currency: 'USD',
          discount: 1000,
        }),
      ).rejects.toBeInstanceOf(ApiException);
      expect(tx.quotation.create).not.toHaveBeenCalled();
    });

    it('defaults quotationDate to now when omitted', async () => {
      tx.quotation.create.mockResolvedValue(storedQuotation());
      const before = Date.now();

      await service.createFromRfq(rfqId, baseCreateDto);

      /* eslint-disable @typescript-eslint/no-unsafe-member-access -- jest.Mock's own `.calls` type is untyped by Jest's own types. */
      const createArgs = tx.quotation.create.mock.calls[0][0] as {
        data: { quotationDate: Date };
      };
      /* eslint-enable @typescript-eslint/no-unsafe-member-access */
      expect(createArgs.data.quotationDate.getTime()).toBeGreaterThanOrEqual(
        before,
      );
    });

    it('uses the provided quotationDate when supplied', async () => {
      tx.quotation.create.mockResolvedValue(storedQuotation());

      await service.createFromRfq(rfqId, {
        ...baseCreateDto,
        quotationDate: '2026-03-01T00:00:00.000Z',
      });

      /* eslint-disable @typescript-eslint/no-unsafe-member-access -- jest.Mock's own `.calls` type is untyped by Jest's own types. */
      const createArgs = tx.quotation.create.mock.calls[0][0] as {
        data: { quotationDate: Date };
      };
      /* eslint-enable @typescript-eslint/no-unsafe-member-access */
      expect(createArgs.data.quotationDate.toISOString()).toBe(
        '2026-03-01T00:00:00.000Z',
      );
    });

    it('retries on a quotation_number collision without failing', async () => {
      const collision = {
        code: 'P2002',
        meta: { target: ['quotation_number'] },
      };
      tx.quotation.create
        .mockRejectedValueOnce(collision)
        .mockResolvedValueOnce(
          storedQuotation({ quotationNumber: 'QT-2026-000002' }),
        );

      const result = await service.createFromRfq(rfqId, baseCreateDto);

      expect(tx.quotation.create).toHaveBeenCalledTimes(2);
      expect(result.quotationNumber).toBe('QT-2026-000002');
    });

    it('never surfaces a raw Prisma/Postgres error after exhausting retries', async () => {
      const ambiguous = {
        code: 'P2039',
        meta: { driverAdapterError: { cause: { originalCode: '23505' } } },
      };
      tx.quotation.create.mockRejectedValue(ambiguous);

      await expect(
        service.createFromRfq(rfqId, baseCreateDto),
      ).rejects.toBeInstanceOf(ApiException);
    });
  });

  describe('createFromRfq — RFQ item propagation (correction)', () => {
    function itemCreateArgs() {
      /* eslint-disable @typescript-eslint/no-unsafe-member-access -- jest.Mock's own `.calls` type is untyped by Jest's own types. */
      const createArgs = tx.quotation.create.mock.calls[0][0] as {
        data: {
          items: {
            create: {
              productId: string;
              quantity: unknown;
              unit: string;
              specifications: string | null;
              notes: string | null;
              productNameSnapshot: string;
            }[];
          };
        };
      };
      /* eslint-enable @typescript-eslint/no-unsafe-member-access */
      return createArgs.data.items.create;
    }

    it('propagates RFQItem.productId to QuotationItem.productId', async () => {
      tx.rFQItem.findMany.mockResolvedValue([storedRfqItem()]);
      tx.quotation.create.mockResolvedValue(storedQuotation());

      await service.createFromRfq(rfqId, {
        items: [{ productId, unitPrice: 10 }],
        currency: 'USD',
      });

      expect(itemCreateArgs()[0].productId).toBe(productId);
    });

    it('defaults quantity from RFQItem.quantity when the request omits it', async () => {
      tx.rFQItem.findMany.mockResolvedValue([
        storedRfqItem({ quantity: new Prisma.Decimal(2800) }),
      ]);
      tx.quotation.create.mockResolvedValue(storedQuotation());

      await service.createFromRfq(rfqId, {
        items: [{ productId, unitPrice: 10 }],
        currency: 'USD',
      });

      expect(itemCreateArgs()[0].quantity).toBe(2800);
    });

    it('lets the request quantity override RFQItem.quantity', async () => {
      tx.rFQItem.findMany.mockResolvedValue([
        storedRfqItem({ quantity: new Prisma.Decimal(2800) }),
      ]);
      tx.quotation.create.mockResolvedValue(storedQuotation());

      await service.createFromRfq(rfqId, {
        items: [{ productId, quantity: 2500, unit: 'ton', unitPrice: 420 }],
        currency: 'USD',
      });

      expect(itemCreateArgs()[0].quantity).toBe(2500);
    });

    it('defaults unit from RFQItem.unit when the request omits it', async () => {
      tx.rFQItem.findMany.mockResolvedValue([storedRfqItem({ unit: 'TON' })]);
      tx.quotation.create.mockResolvedValue(storedQuotation());

      await service.createFromRfq(rfqId, {
        items: [{ productId, quantity: 10, unitPrice: 10 }],
        currency: 'USD',
      });

      expect(itemCreateArgs()[0].unit).toBe('TON');
    });

    it('lets the request unit override RFQItem.unit', async () => {
      tx.rFQItem.findMany.mockResolvedValue([storedRfqItem({ unit: 'TON' })]);
      tx.quotation.create.mockResolvedValue(storedQuotation());

      await service.createFromRfq(rfqId, {
        items: [{ productId, quantity: 2800000, unit: 'KG', unitPrice: 1 }],
        currency: 'USD',
      });

      expect(itemCreateArgs()[0].unit).toBe('KG');
    });

    it('defaults specifications from RFQItem.specifications when the request omits it', async () => {
      tx.rFQItem.findMany.mockResolvedValue([
        storedRfqItem({ specifications: 'Thailand Grade' }),
      ]);
      tx.quotation.create.mockResolvedValue(storedQuotation());

      await service.createFromRfq(rfqId, {
        items: [{ productId, quantity: 10, unit: 'ton', unitPrice: 10 }],
        currency: 'USD',
      });

      expect(itemCreateArgs()[0].specifications).toBe('Thailand Grade');
    });

    it('lets the request specifications override RFQItem.specifications', async () => {
      tx.rFQItem.findMany.mockResolvedValue([
        storedRfqItem({ specifications: 'Thailand Grade' }),
      ]);
      tx.quotation.create.mockResolvedValue(storedQuotation());

      await service.createFromRfq(rfqId, {
        items: [
          {
            productId,
            quantity: 10,
            unit: 'ton',
            unitPrice: 10,
            specifications: 'Vietnam Grade',
          },
        ],
        currency: 'USD',
      });

      expect(itemCreateArgs()[0].specifications).toBe('Vietnam Grade');
    });

    it('defaults notes from RFQItem.notes when the request omits it', async () => {
      tx.rFQItem.findMany.mockResolvedValue([
        storedRfqItem({ notes: 'Buyer prefers early shipment' }),
      ]);
      tx.quotation.create.mockResolvedValue(storedQuotation());

      await service.createFromRfq(rfqId, {
        items: [{ productId, quantity: 10, unit: 'ton', unitPrice: 10 }],
        currency: 'USD',
      });

      expect(itemCreateArgs()[0].notes).toBe('Buyer prefers early shipment');
    });

    it('lets the request notes override RFQItem.notes', async () => {
      tx.rFQItem.findMany.mockResolvedValue([
        storedRfqItem({ notes: 'Buyer prefers early shipment' }),
      ]);
      tx.quotation.create.mockResolvedValue(storedQuotation());

      await service.createFromRfq(rfqId, {
        items: [
          {
            productId,
            quantity: 10,
            unit: 'ton',
            unitPrice: 10,
            notes: 'Confirmed by phone',
          },
        ],
        currency: 'USD',
      });

      expect(itemCreateArgs()[0].notes).toBe('Confirmed by phone');
    });

    it('derives productNameSnapshot from the live Product, never from RFQItem.productNameSnapshot', async () => {
      tx.rFQItem.findMany.mockResolvedValue([
        storedRfqItem({ productNameSnapshot: 'Stale RFQ Snapshot Name' }),
      ]);
      tx.product.findMany.mockResolvedValue([
        { id: productId, name: 'Fresh Live Product Name' },
      ]);
      tx.quotation.create.mockResolvedValue(storedQuotation());

      await service.createFromRfq(rfqId, baseCreateDto);

      expect(itemCreateArgs()[0].productNameSnapshot).toBe(
        'Fresh Live Product Name',
      );
    });

    it('rejects a request productId that is not part of this RFQ', async () => {
      tx.rFQItem.findMany.mockResolvedValue([
        storedRfqItem({ productId: 'product-1' }),
      ]);

      await expect(
        service.createFromRfq(rfqId, {
          items: [
            {
              productId: 'product-unrelated',
              quantity: 1,
              unit: 'ton',
              unitPrice: 10,
            },
          ],
          currency: 'USD',
        }),
      ).rejects.toBeInstanceOf(ApiException);
      expect(tx.quotation.create).not.toHaveBeenCalled();
    });

    it('rejects an extra request item for a product not on the RFQ, even when other items match', async () => {
      tx.rFQItem.findMany.mockResolvedValue([
        storedRfqItem({ id: 'rfq-item-a', productId: 'product-a' }),
        storedRfqItem({ id: 'rfq-item-b', productId: 'product-b' }),
      ]);
      tx.product.findMany.mockResolvedValue([
        { id: 'product-a', name: 'Product A' },
        { id: 'product-b', name: 'Product B' },
      ]);

      await expect(
        service.createFromRfq(rfqId, {
          items: [
            { productId: 'product-a', quantity: 1, unit: 'ton', unitPrice: 10 },
            { productId: 'product-b', quantity: 1, unit: 'ton', unitPrice: 10 },
            { productId: 'product-c', quantity: 1, unit: 'ton', unitPrice: 10 },
          ],
          currency: 'USD',
        }),
      ).rejects.toBeInstanceOf(ApiException);
      expect(tx.quotation.create).not.toHaveBeenCalled();
    });

    it('rejects creating a quotation from an RFQ with no items', async () => {
      tx.rFQItem.findMany.mockResolvedValue([]);

      await expect(
        service.createFromRfq(rfqId, baseCreateDto),
      ).rejects.toBeInstanceOf(ApiException);
      expect(tx.quotation.create).not.toHaveBeenCalled();
    });

    it('rejects when RFQItem.unit is null and the request also omits unit', async () => {
      tx.rFQItem.findMany.mockResolvedValue([storedRfqItem({ unit: null })]);

      await expect(
        service.createFromRfq(rfqId, {
          items: [{ productId, quantity: 10, unitPrice: 10 }],
          currency: 'USD',
        }),
      ).rejects.toBeInstanceOf(ApiException);
      expect(tx.quotation.create).not.toHaveBeenCalled();
    });

    it('succeeds when RFQItem.unit is null but the request provides a unit', async () => {
      tx.rFQItem.findMany.mockResolvedValue([storedRfqItem({ unit: null })]);
      tx.quotation.create.mockResolvedValue(storedQuotation());

      await service.createFromRfq(rfqId, {
        items: [{ productId, quantity: 10, unit: 'ton', unitPrice: 10 }],
        currency: 'USD',
      });

      expect(itemCreateArgs()[0].unit).toBe('ton');
    });

    it('matches duplicate RFQItems for the same product one-to-one, without merging quantities', async () => {
      tx.rFQItem.findMany.mockResolvedValue([
        storedRfqItem({
          id: 'rfq-item-1',
          quantity: new Prisma.Decimal(100),
          specifications: 'Batch 1',
        }),
        storedRfqItem({
          id: 'rfq-item-2',
          quantity: new Prisma.Decimal(200),
          specifications: 'Batch 2',
        }),
      ]);
      tx.quotation.create.mockResolvedValue(storedQuotation());

      await service.createFromRfq(rfqId, {
        items: [
          { productId, unit: 'ton', unitPrice: 10 },
          { productId, unit: 'ton', unitPrice: 12 },
        ],
        currency: 'USD',
      });

      const items = itemCreateArgs();
      expect(items).toHaveLength(2);
      expect(items[0].quantity).toBe(100);
      expect(items[0].specifications).toBe('Batch 1');
      expect(items[1].quantity).toBe(200);
      expect(items[1].specifications).toBe('Batch 2');
    });

    it('rejects a third request item for a product that only has two RFQItem lines', async () => {
      tx.rFQItem.findMany.mockResolvedValue([
        storedRfqItem({ id: 'rfq-item-1' }),
        storedRfqItem({ id: 'rfq-item-2' }),
      ]);

      await expect(
        service.createFromRfq(rfqId, {
          items: [
            { productId, quantity: 1, unit: 'ton', unitPrice: 10 },
            { productId, quantity: 1, unit: 'ton', unitPrice: 10 },
            { productId, quantity: 1, unit: 'ton', unitPrice: 10 },
          ],
          currency: 'USD',
        }),
      ).rejects.toBeInstanceOf(ApiException);
      expect(tx.quotation.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('allows editing quotationDate/validUntil/currency/notes while draft', async () => {
      prisma.quotation.findUnique.mockResolvedValue(
        storedQuotation({ status: 'draft' }),
      );
      prisma.quotation.update.mockResolvedValue(
        storedQuotation({ notes: 'Updated' }),
      );

      const result = await service.update(quotationId, {
        notes: 'Updated',
        currency: 'IDR',
        validUntil: '2026-06-01T00:00:00.000Z',
      });

      expect(result.notes).toBe('Updated');
    });

    it('recalculates total when discount changes while draft', async () => {
      prisma.quotation.findUnique.mockResolvedValue(
        storedQuotation({
          status: 'draft',
          subtotal: new Prisma.Decimal(250),
          discount: null,
          shippingCost: null,
        }),
      );
      prisma.quotation.update.mockResolvedValue(storedQuotation());

      await service.update(quotationId, { discount: 50 });

      /* eslint-disable @typescript-eslint/no-unsafe-member-access -- jest.Mock's own `.calls` type is untyped by Jest's own types. */
      const updateArgs = prisma.quotation.update.mock.calls[0][0] as {
        data: { total: Prisma.Decimal };
      };
      /* eslint-enable @typescript-eslint/no-unsafe-member-access */
      expect(updateArgs.data.total.toString()).toBe('200');
    });

    it('recalculates total when shippingCost changes while draft', async () => {
      prisma.quotation.findUnique.mockResolvedValue(
        storedQuotation({
          status: 'draft',
          subtotal: new Prisma.Decimal(250),
          discount: null,
          shippingCost: null,
        }),
      );
      prisma.quotation.update.mockResolvedValue(storedQuotation());

      await service.update(quotationId, { shippingCost: 30 });

      /* eslint-disable @typescript-eslint/no-unsafe-member-access -- jest.Mock's own `.calls` type is untyped by Jest's own types. */
      const updateArgs = prisma.quotation.update.mock.calls[0][0] as {
        data: { total: Prisma.Decimal };
      };
      /* eslint-enable @typescript-eslint/no-unsafe-member-access */
      expect(updateArgs.data.total.toString()).toBe('280');
    });

    it('rejects a discount update that would make total negative', async () => {
      prisma.quotation.findUnique.mockResolvedValue(
        storedQuotation({
          status: 'draft',
          subtotal: new Prisma.Decimal(100),
          discount: null,
          shippingCost: null,
        }),
      );

      await expect(
        service.update(quotationId, { discount: 1000 }),
      ).rejects.toBeInstanceOf(ApiException);
      expect(prisma.quotation.update).not.toHaveBeenCalled();
    });

    it.each(['sent', 'accepted', 'rejected', 'expired', 'cancelled'])(
      'rejects editing locked pricing/validity fields once status is "%s"',
      async (status) => {
        prisma.quotation.findUnique.mockResolvedValue(
          storedQuotation({ status }),
        );

        await expect(
          service.update(quotationId, { currency: 'IDR' }),
        ).rejects.toBeInstanceOf(ApiException);
        expect(prisma.quotation.update).not.toHaveBeenCalled();
      },
    );

    it('still allows editing notes once status has left draft', async () => {
      prisma.quotation.findUnique.mockResolvedValue(
        storedQuotation({ status: 'sent' }),
      );
      prisma.quotation.update.mockResolvedValue(
        storedQuotation({ status: 'sent', notes: 'Follow up sent' }),
      );

      const result = await service.update(quotationId, {
        notes: 'Follow up sent',
      });

      expect(result.notes).toBe('Follow up sent');
    });

    it.each([
      ['draft', 'sent'],
      ['draft', 'cancelled'],
      ['sent', 'accepted'],
      ['sent', 'rejected'],
      ['sent', 'expired'],
      ['sent', 'cancelled'],
    ])('allows the valid transition %s -> %s', async (from, to) => {
      prisma.quotation.findUnique.mockResolvedValue(
        storedQuotation({ status: from }),
      );
      // `accepted` routes through the sibling-uniqueness transaction (tx.quotation.update);
      // every other transition goes through the plain prisma.quotation.update path — both are
      // set so either path resolves correctly regardless of which `to` value is under test.
      prisma.quotation.update.mockResolvedValue(
        storedQuotation({ status: to }),
      );
      tx.quotation.update.mockResolvedValue(storedQuotation({ status: to }));

      const result = await service.update(quotationId, {
        status: to as
          'sent' | 'accepted' | 'rejected' | 'expired' | 'cancelled',
      });

      expect(result.status).toBe(to);
    });

    it.each([
      ['draft', 'accepted'],
      ['draft', 'rejected'],
      ['draft', 'expired'],
      ['sent', 'sent'],
      ['accepted', 'sent'],
      ['rejected', 'sent'],
      ['expired', 'sent'],
      ['cancelled', 'sent'],
    ])('rejects the invalid transition %s -> %s', async (from, to) => {
      prisma.quotation.findUnique.mockResolvedValue(
        storedQuotation({ status: from }),
      );

      await expect(
        service.update(quotationId, {
          status: to as
            'sent' | 'accepted' | 'rejected' | 'expired' | 'cancelled',
        }),
      ).rejects.toBeInstanceOf(ApiException);
      expect(prisma.quotation.update).not.toHaveBeenCalled();
    });

    it('rejects reopening a terminal quotation', async () => {
      prisma.quotation.findUnique.mockResolvedValue(
        storedQuotation({ status: 'accepted' }),
      );

      await expect(
        service.update(quotationId, { status: 'sent' }),
      ).rejects.toBeInstanceOf(ApiException);
    });

    it('never allows rfqId/companyId/quotationNumber/items/subtotal to be touched (not part of UpdateQuotationDto)', async () => {
      prisma.quotation.findUnique.mockResolvedValue(
        storedQuotation({ status: 'draft' }),
      );
      prisma.quotation.update.mockResolvedValue(storedQuotation());

      await service.update(quotationId, {});

      /* eslint-disable @typescript-eslint/no-unsafe-member-access -- jest.Mock's own `.calls` type is untyped by Jest's own types. */
      const updateArgs = prisma.quotation.update.mock.calls[0][0] as {
        data: Record<string, unknown>;
      };
      /* eslint-enable @typescript-eslint/no-unsafe-member-access */
      expect(updateArgs.data).not.toHaveProperty('items');
      expect(updateArgs.data).not.toHaveProperty('rfqId');
      expect(updateArgs.data).not.toHaveProperty('companyId');
      expect(updateArgs.data).not.toHaveProperty('quotationNumber');
      expect(updateArgs.data).not.toHaveProperty('subtotal');
    });

    it('throws NOT_FOUND for a missing id', async () => {
      prisma.quotation.findUnique.mockResolvedValue(null);

      await expect(
        service.update('missing', { notes: 'x' }),
      ).rejects.toBeInstanceOf(ApiException);
    });
  });

  describe('update — accepted-quotation sibling uniqueness (Phase 21 correction)', () => {
    it('accepts the first quotation for an RFQ with no accepted sibling', async () => {
      prisma.quotation.findUnique.mockResolvedValue(
        storedQuotation({ status: 'sent' }),
      );
      tx.quotation.findFirst.mockResolvedValue(null);
      tx.quotation.update.mockResolvedValue(
        storedQuotation({ status: 'accepted' }),
      );

      const result = await service.update(quotationId, {
        status: 'accepted',
      });

      expect(result.status).toBe('accepted');
      expect(tx.quotation.findFirst).toHaveBeenCalledWith({
        where: { rfqId, status: 'accepted', id: { not: quotationId } },
        select: { id: true },
      });
    });

    it('rejects accepting a quotation when a sibling for the same RFQ is already accepted', async () => {
      prisma.quotation.findUnique.mockResolvedValue(
        storedQuotation({ status: 'sent' }),
      );
      tx.quotation.findFirst.mockResolvedValue({ id: 'other-quotation' });

      await expect(
        service.update(quotationId, { status: 'accepted' }),
      ).rejects.toBeInstanceOf(ApiException);
      expect(tx.quotation.update).not.toHaveBeenCalled();
    });

    it('does not block acceptance when siblings are rejected/expired/cancelled, not accepted', async () => {
      prisma.quotation.findUnique.mockResolvedValue(
        storedQuotation({ status: 'sent' }),
      );
      // The findFirst mock itself is scoped to status: 'accepted' — siblings in any other
      // status are never matched by that query, so this resolves null regardless of how many
      // rejected/expired/cancelled siblings exist.
      tx.quotation.findFirst.mockResolvedValue(null);
      tx.quotation.update.mockResolvedValue(
        storedQuotation({ status: 'accepted' }),
      );

      const result = await service.update(quotationId, {
        status: 'accepted',
      });

      expect(result.status).toBe('accepted');
    });

    it('does not run the sibling check for non-accepted transitions', async () => {
      prisma.quotation.findUnique.mockResolvedValue(
        storedQuotation({ status: 'sent' }),
      );
      prisma.quotation.update.mockResolvedValue(
        storedQuotation({ status: 'rejected' }),
      );

      await service.update(quotationId, { status: 'rejected' });

      expect(tx.quotation.findFirst).not.toHaveBeenCalled();
    });

    it('an already-accepted quotation remains terminal and cannot be reaccepted or reopened', async () => {
      prisma.quotation.findUnique.mockResolvedValue(
        storedQuotation({ status: 'accepted' }),
      );

      await expect(
        service.update(quotationId, { status: 'accepted' }),
      ).rejects.toBeInstanceOf(ApiException);
      await expect(
        service.update(quotationId, { status: 'sent' }),
      ).rejects.toBeInstanceOf(ApiException);
    });
  });
});
