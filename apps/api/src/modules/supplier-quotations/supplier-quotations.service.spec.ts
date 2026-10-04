import { Test } from '@nestjs/testing';
import { Prisma } from '../../../generated/prisma/client';
import { ApiException } from '../../common/exceptions/api.exception';
import { PrismaService } from '../../prisma/prisma.service';
import { SupplierQuotationsService } from './supplier-quotations.service';

describe('SupplierQuotationsService', () => {
  let service: SupplierQuotationsService;
  let prisma: {
    supplierQuotation: {
      findMany: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
    };
    businessRelationship: { findFirst: jest.Mock };
    $transaction: jest.Mock;
  };
  let tx: {
    supplierRFQ: { findUnique: jest.Mock; updateMany: jest.Mock };
    supplierRFQItem: { findMany: jest.Mock };
    product: { findMany: jest.Mock };
    supplierQuotation: {
      create: jest.Mock;
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      findUniqueOrThrow: jest.Mock;
      updateMany: jest.Mock;
    };
    $queryRaw: jest.Mock;
  };

  const supplierRfqId = 'srfq-1';
  const supplierCompanyId = 'company-1';
  const supplierQuotationId = 'sqt-1';
  const productId = 'product-1';

  function storedSupplierRfq(overrides: Record<string, unknown> = {}) {
    return {
      id: supplierRfqId,
      supplierCompanyId,
      status: 'reviewing',
      ...overrides,
    };
  }

  function storedSupplierRfqItem(overrides: Record<string, unknown> = {}) {
    return {
      id: 'srfqi-1',
      supplierRfqId,
      productId,
      productNameSnapshot: null,
      quantity: new Prisma.Decimal(10),
      unit: 'ton',
      specifications: null,
      notes: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      ...overrides,
    };
  }

  function storedSupplierQuotation(overrides: Record<string, unknown> = {}) {
    return {
      id: supplierQuotationId,
      supplierQuotationNumber: 'SQT-2026-000001',
      supplierRfqId,
      supplierCompanyId,
      status: 'draft',
      quotationDate: null,
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
      ...overrides,
    };
  }

  beforeEach(async () => {
    tx = {
      supplierRFQ: {
        findUnique: jest.fn().mockResolvedValue(storedSupplierRfq()),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      supplierRFQItem: {
        findMany: jest.fn().mockResolvedValue([storedSupplierRfqItem()]),
      },
      product: {
        findMany: jest
          .fn()
          .mockResolvedValue([{ id: productId, name: 'Copra' }]),
      },
      supplierQuotation: {
        create: jest.fn(),
        findFirst: jest.fn().mockResolvedValue(null),
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      $queryRaw: jest.fn().mockResolvedValue([{ id: supplierRfqId }]),
    };
    prisma = {
      supplierQuotation: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        findUnique: jest.fn(),
      },
      businessRelationship: {
        findFirst: jest.fn().mockResolvedValue({ id: 'br-1' }),
      },
      $transaction: jest.fn((fn: (t: unknown) => unknown) => fn(tx)),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        SupplierQuotationsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = moduleRef.get(SupplierQuotationsService);
  });

  const oneItem = [{ productId, unitPrice: 25.5, discount: 5 }];
  const baseCreateDto = { items: oneItem, currency: 'USD' };

  function itemCreateArgs() {
    /* eslint-disable @typescript-eslint/no-unsafe-member-access -- jest.Mock's own `.calls` type is untyped by Jest's own types. */
    const createArgs = tx.supplierQuotation.create.mock.calls[0][0] as {
      data: {
        items: {
          create: {
            productId: string;
            productNameSnapshot: string;
            quantity: unknown;
            unit: string;
            specifications: string | null;
            notes: string | null;
          }[];
        };
      };
    };
    /* eslint-enable @typescript-eslint/no-unsafe-member-access */
    return createArgs.data.items.create;
  }

  describe('findAll', () => {
    it('lists with no filters', async () => {
      const result = await service.findAll({
        page: 1,
        limit: 25,
        sort: '-created_at',
      });

      expect(prisma.supplierQuotation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
      expect(result.meta).toEqual(
        expect.objectContaining({ page: 1, limit: 25, total: 0 }),
      );
    });

    it('filters by status/supplierRfqId/supplierCompanyId', async () => {
      await service.findAll({
        page: 1,
        limit: 25,
        sort: '-created_at',
        status: 'draft',
        supplierRfqId,
        supplierCompanyId,
      });

      expect(prisma.supplierQuotation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'draft', supplierRfqId, supplierCompanyId },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('returns the supplier quotation when found', async () => {
      prisma.supplierQuotation.findUnique.mockResolvedValue(
        storedSupplierQuotation(),
      );

      const result = await service.findOne(supplierQuotationId);

      expect(result.id).toBe(supplierQuotationId);
    });

    it('throws NOT_FOUND for a missing id', async () => {
      prisma.supplierQuotation.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toBeInstanceOf(
        ApiException,
      );
    });
  });

  describe('createFromSupplierRfq', () => {
    it('creates a supplier quotation starting at draft', async () => {
      tx.supplierQuotation.create.mockResolvedValue(storedSupplierQuotation());

      const result = await service.createFromSupplierRfq(
        supplierRfqId,
        baseCreateDto,
      );

      /* eslint-disable @typescript-eslint/no-unsafe-assignment -- expect.* matchers are untyped by Jest's own types. */
      expect(tx.supplierQuotation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'draft' }),
        }),
      );
      /* eslint-enable @typescript-eslint/no-unsafe-assignment */
      expect(result.id).toBe(supplierQuotationId);
    });

    it.each(['draft', 'sent', 'rejected', 'cancelled'])(
      'rejects a supplier RFQ with status "%s"',
      async (status) => {
        tx.supplierRFQ.findUnique.mockResolvedValue(
          storedSupplierRfq({ status }),
        );

        await expect(
          service.createFromSupplierRfq(supplierRfqId, baseCreateDto),
        ).rejects.toBeInstanceOf(ApiException);
        expect(tx.supplierQuotation.create).not.toHaveBeenCalled();
      },
    );

    it('throws NOT_FOUND when the supplier RFQ does not exist', async () => {
      tx.supplierRFQ.findUnique.mockResolvedValue(null);

      await expect(
        service.createFromSupplierRfq('missing', baseCreateDto),
      ).rejects.toBeInstanceOf(ApiException);
    });

    it('derives supplierCompanyId from the SupplierRFQ', async () => {
      tx.supplierQuotation.create.mockResolvedValue(storedSupplierQuotation());

      await service.createFromSupplierRfq(supplierRfqId, baseCreateDto);

      /* eslint-disable @typescript-eslint/no-unsafe-assignment -- expect.* matchers are untyped by Jest's own types. */
      expect(tx.supplierQuotation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ supplierCompanyId }),
        }),
      );
      /* eslint-enable @typescript-eslint/no-unsafe-assignment */
    });

    it('rejects when the supplier no longer has an active supplier relationship', async () => {
      prisma.businessRelationship.findFirst.mockResolvedValue(null);

      await expect(
        service.createFromSupplierRfq(supplierRfqId, baseCreateDto),
      ).rejects.toBeInstanceOf(ApiException);
      expect(tx.supplierQuotation.create).not.toHaveBeenCalled();
    });

    it('rejects a supplier RFQ with no items', async () => {
      tx.supplierRFQItem.findMany.mockResolvedValue([]);

      await expect(
        service.createFromSupplierRfq(supplierRfqId, baseCreateDto),
      ).rejects.toBeInstanceOf(ApiException);
      expect(tx.supplierQuotation.create).not.toHaveBeenCalled();
    });

    it('defaults quantity/unit from the matched SupplierRFQItem when omitted', async () => {
      tx.supplierRFQItem.findMany.mockResolvedValue([
        storedSupplierRfqItem({
          quantity: new Prisma.Decimal(2800),
          unit: 'TON',
        }),
      ]);
      tx.supplierQuotation.create.mockResolvedValue(storedSupplierQuotation());

      await service.createFromSupplierRfq(supplierRfqId, baseCreateDto);

      expect(itemCreateArgs()[0].quantity).toBe(2800);
      expect(itemCreateArgs()[0].unit).toBe('TON');
    });

    it('lets the request override quantity/unit', async () => {
      tx.supplierRFQItem.findMany.mockResolvedValue([
        storedSupplierRfqItem({
          quantity: new Prisma.Decimal(2800),
          unit: 'TON',
        }),
      ]);
      tx.supplierQuotation.create.mockResolvedValue(storedSupplierQuotation());

      await service.createFromSupplierRfq(supplierRfqId, {
        items: [{ productId, quantity: 2500, unit: 'KG', unitPrice: 10 }],
        currency: 'USD',
      });

      expect(itemCreateArgs()[0].quantity).toBe(2500);
      expect(itemCreateArgs()[0].unit).toBe('KG');
    });

    it('defaults specifications/notes from the matched SupplierRFQItem', async () => {
      tx.supplierRFQItem.findMany.mockResolvedValue([
        storedSupplierRfqItem({
          specifications: 'Grade A',
          notes: 'Original note',
        }),
      ]);
      tx.supplierQuotation.create.mockResolvedValue(storedSupplierQuotation());

      await service.createFromSupplierRfq(supplierRfqId, baseCreateDto);

      expect(itemCreateArgs()[0].specifications).toBe('Grade A');
      expect(itemCreateArgs()[0].notes).toBe('Original note');
    });

    it('rejects a request productId that is not part of the supplier RFQ', async () => {
      await expect(
        service.createFromSupplierRfq(supplierRfqId, {
          items: [{ productId: 'unrelated', unitPrice: 10 }],
          currency: 'USD',
        }),
      ).rejects.toBeInstanceOf(ApiException);
      expect(tx.supplierQuotation.create).not.toHaveBeenCalled();
    });

    it('derives productNameSnapshot from the live Product master', async () => {
      tx.supplierQuotation.create.mockResolvedValue(storedSupplierQuotation());

      await service.createFromSupplierRfq(supplierRfqId, baseCreateDto);

      expect(itemCreateArgs()[0].productNameSnapshot).toBe('Copra');
    });

    it('calculates item subtotal, quotation subtotal and total with exact Decimal arithmetic', async () => {
      tx.supplierQuotation.create.mockResolvedValue(storedSupplierQuotation());

      await service.createFromSupplierRfq(supplierRfqId, {
        items: [{ productId, unitPrice: 25.5, discount: 5 }],
        currency: 'USD',
        discount: 10,
        shippingCost: 15,
      });

      /* eslint-disable @typescript-eslint/no-unsafe-member-access -- jest.Mock's own `.calls` type is untyped by Jest's own types. */
      const createArgs = tx.supplierQuotation.create.mock.calls[0][0] as {
        data: {
          subtotal: Prisma.Decimal;
          total: Prisma.Decimal;
          items: { create: { subtotal: Prisma.Decimal }[] };
        };
      };
      /* eslint-enable @typescript-eslint/no-unsafe-member-access */
      // item subtotal = 10 (default quantity from SupplierRFQItem) * 25.5 - 5 = 250
      expect(createArgs.data.items.create[0].subtotal.toString()).toBe('250');
      expect(createArgs.data.subtotal.toString()).toBe('250');
      // total = 250 - 10 + 15 = 255
      expect(createArgs.data.total.toString()).toBe('255');
    });

    it('rejects an item whose discount exceeds quantity x unitPrice', async () => {
      await expect(
        service.createFromSupplierRfq(supplierRfqId, {
          items: [{ productId, unitPrice: 1, discount: 500 }],
          currency: 'USD',
        }),
      ).rejects.toBeInstanceOf(ApiException);
      expect(tx.supplierQuotation.create).not.toHaveBeenCalled();
    });

    it('retries on a supplier_quotation_number collision without failing', async () => {
      const collision = {
        code: 'P2002',
        meta: { target: ['supplier_quotation_number'] },
      };
      tx.supplierQuotation.create
        .mockRejectedValueOnce(collision)
        .mockResolvedValueOnce(
          storedSupplierQuotation({
            supplierQuotationNumber: 'SQT-2026-000002',
          }),
        );

      const result = await service.createFromSupplierRfq(
        supplierRfqId,
        baseCreateDto,
      );

      expect(tx.supplierQuotation.create).toHaveBeenCalledTimes(2);
      expect(result.supplierQuotationNumber).toBe('SQT-2026-000002');
    });

    it('never surfaces a raw Prisma/Postgres error after exhausting retries', async () => {
      const ambiguous = {
        code: 'P2039',
        meta: { driverAdapterError: { cause: { originalCode: '23505' } } },
      };
      tx.supplierQuotation.create.mockRejectedValue(ambiguous);

      await expect(
        service.createFromSupplierRfq(supplierRfqId, baseCreateDto),
      ).rejects.toBeInstanceOf(ApiException);
    });
  });

  // --- update(): every write runs in one transaction, decided from state read AFTER the lock.
  /** Arranges both reads the service performs: the pre-transaction read (404 + parent RFQ id)
   * and the fresh in-transaction read taken after the row lock. Pass `fresh` to simulate a
   * concurrent request having changed the row in between. */
  function givenQuotation(
    overrides: Record<string, unknown> = {},
    fresh: Record<string, unknown> = overrides,
  ) {
    prisma.supplierQuotation.findUnique.mockResolvedValue(
      storedSupplierQuotation(overrides),
    );
    tx.supplierQuotation.findUnique.mockResolvedValue(
      storedSupplierQuotation(fresh),
    );
    tx.supplierQuotation.findUniqueOrThrow.mockResolvedValue(
      storedSupplierQuotation(fresh),
    );
  }

  /** The `{ where, data }` of the single conditional write. */
  function writeArgs() {
    /* eslint-disable @typescript-eslint/no-unsafe-member-access -- jest.Mock's own `.calls` type is untyped by Jest's own types. */
    return tx.supplierQuotation.updateMany.mock.calls[0][0] as {
      where: { id: string; status: string };
      data: Record<string, unknown> & { total?: Prisma.Decimal };
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

  describe('update — received transition flips SupplierRFQ to quoted', () => {
    it('flips SupplierRFQ status reviewing -> quoted on the first received quotation', async () => {
      givenQuotation({ status: 'draft' });
      tx.supplierQuotation.findUniqueOrThrow.mockResolvedValue(
        storedSupplierQuotation({ status: 'received' }),
      );

      const result = await service.update(supplierQuotationId, {
        status: 'received',
      });

      expect(result.status).toBe('received');
      expect(tx.supplierRFQ.updateMany).toHaveBeenCalledWith({
        where: { id: supplierRfqId, status: 'reviewing' },
        data: { status: 'quoted' },
      });
    });

    it('commits as legitimate when the conditional flip race loses but the SupplierRFQ is now quoted', async () => {
      givenQuotation({ status: 'draft' });
      tx.supplierRFQ.updateMany.mockResolvedValue({ count: 0 });
      tx.supplierRFQ.findUnique.mockResolvedValue({ status: 'quoted' });

      await expect(
        service.update(supplierQuotationId, { status: 'received' }),
      ).resolves.toBeDefined();
    });

    it('rolls back with a clean 409 when the conditional flip race loses unexpectedly', async () => {
      givenQuotation({ status: 'draft' });
      tx.supplierRFQ.updateMany.mockResolvedValue({ count: 0 });
      tx.supplierRFQ.findUnique.mockResolvedValue({ status: 'cancelled' });

      await expect(
        service.update(supplierQuotationId, { status: 'received' }),
      ).rejects.toMatchObject({ status: 409 });
    });

    it('does not flip the SupplierRFQ when the quotation write itself is rejected', async () => {
      givenQuotation({ status: 'draft' });
      tx.supplierQuotation.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.update(supplierQuotationId, { status: 'received' }),
      ).rejects.toMatchObject({ status: 409 });
      expect(tx.supplierRFQ.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('update — selection invariant', () => {
    it('allows the first selection for a supplier RFQ with no selected sibling', async () => {
      givenQuotation({ status: 'under_review' });
      tx.supplierQuotation.findUniqueOrThrow.mockResolvedValue(
        storedSupplierQuotation({ status: 'selected' }),
      );

      const result = await service.update(supplierQuotationId, {
        status: 'selected',
      });

      expect(result.status).toBe('selected');
      expect(tx.supplierQuotation.findFirst).toHaveBeenCalledWith({
        where: {
          supplierRfqId,
          status: 'selected',
          id: { not: supplierQuotationId },
        },
        select: { id: true },
      });
    });

    it('rejects selecting a quotation when a sibling is already selected', async () => {
      givenQuotation({ status: 'under_review' });
      tx.supplierQuotation.findFirst.mockResolvedValue({ id: 'other-sqt' });

      await expect(
        service.update(supplierQuotationId, { status: 'selected' }),
      ).rejects.toMatchObject({ status: 409 });
      expect(tx.supplierQuotation.updateMany).not.toHaveBeenCalled();
    });

    it('does not silently touch sibling quotations when one becomes selected', async () => {
      givenQuotation({ status: 'under_review' });

      await service.update(supplierQuotationId, { status: 'selected' });

      // Exactly one conditional write, scoped to this quotation's own id.
      expect(tx.supplierQuotation.updateMany).toHaveBeenCalledTimes(1);
      expect(writeArgs().where.id).toBe(supplierQuotationId);
    });

    it('rejects reopening a selected quotation', async () => {
      givenQuotation({ status: 'selected' });

      await expect(
        service.update(supplierQuotationId, { status: 'under_review' }),
      ).rejects.toBeInstanceOf(ApiException);
      expect(tx.supplierQuotation.updateMany).not.toHaveBeenCalled();
    });

    it('locks parent RFQ then quotation (by id, in that order) before the sibling check', async () => {
      givenQuotation({ status: 'under_review' });

      await service.update(supplierQuotationId, { status: 'selected' });

      expect(lockCalls()).toEqual([
        { table: 'supplier_rfqs', id: supplierRfqId },
        { table: 'supplier_quotations', id: supplierQuotationId },
      ]);
      const lastLockOrder = tx.$queryRaw.mock.invocationCallOrder[1];
      const siblingCheckOrder =
        tx.supplierQuotation.findFirst.mock.invocationCallOrder[0];
      expect(lastLockOrder).toBeLessThan(siblingCheckOrder);
    });

    it('locks parent RFQ then quotation for received as well (same order on every parent-touching path)', async () => {
      givenQuotation({ status: 'draft' });

      await service.update(supplierQuotationId, { status: 'received' });

      expect(lockCalls()).toEqual([
        { table: 'supplier_rfqs', id: supplierRfqId },
        { table: 'supplier_quotations', id: supplierQuotationId },
      ]);
    });

    it('locks only the quotation row (never the parent RFQ) for transitions and edits that do not touch the RFQ', async () => {
      givenQuotation({ status: 'under_review' });

      await service.update(supplierQuotationId, { status: 'rejected' });

      expect(lockCalls()).toEqual([
        { table: 'supplier_quotations', id: supplierQuotationId },
      ]);
    });

    it('reads the quotation again only after the quotation lock', async () => {
      givenQuotation({ status: 'draft' });

      await service.update(supplierQuotationId, { notes: 'x' });

      const lockOrder = tx.$queryRaw.mock.invocationCallOrder[0];
      const readOrder =
        tx.supplierQuotation.findUnique.mock.invocationCallOrder[0];
      expect(lockOrder).toBeLessThan(readOrder);
    });
  });

  describe('update — lifecycle is validated against the locked, fresh status', () => {
    it.each([
      ['draft', 'received'],
      ['draft', 'cancelled'],
      ['received', 'under_review'],
      ['received', 'cancelled'],
      ['under_review', 'selected'],
      ['under_review', 'rejected'],
      ['under_review', 'expired'],
      ['under_review', 'cancelled'],
    ])(
      'allows %s -> %s and writes conditionally on the validated status',
      async (from, to) => {
        givenQuotation({ status: from });

        await service.update(supplierQuotationId, {
          status: to as 'received',
        });

        expect(writeArgs().where).toEqual({
          id: supplierQuotationId,
          status: from,
        });
        expect(writeArgs().data.status).toBe(to);
      },
    );

    it.each([
      ['draft', 'under_review'],
      ['draft', 'selected'],
      ['received', 'selected'],
      ['selected', 'under_review'],
      ['selected', 'cancelled'],
      ['rejected', 'under_review'],
      ['expired', 'received'],
      ['cancelled', 'received'],
    ])('rejects the invalid transition %s -> %s', async (from, to) => {
      givenQuotation({ status: from });

      await expect(
        service.update(supplierQuotationId, { status: to as 'received' }),
      ).rejects.toBeInstanceOf(ApiException);
      expect(tx.supplierQuotation.updateMany).not.toHaveBeenCalled();
    });

    it.each([
      ['draft', 'received'],
      ['draft', 'cancelled'],
      ['received', 'under_review'],
      ['received', 'cancelled'],
      ['under_review', 'selected'],
      ['under_review', 'rejected'],
      ['under_review', 'expired'],
      ['under_review', 'cancelled'],
    ])(
      'returns 409 and changes nothing when the conditional write matches no row (%s -> %s)',
      async (from, to) => {
        givenQuotation({ status: from });
        tx.supplierQuotation.updateMany.mockResolvedValue({ count: 0 });

        await expect(
          service.update(supplierQuotationId, { status: to as 'received' }),
        ).rejects.toMatchObject({ status: 409 });
        expect(tx.supplierRFQ.updateMany).not.toHaveBeenCalled();
      },
    );

    it('rejects a transition that was valid against the pre-read but not against the fresh state (concurrent change)', async () => {
      // Pre-read: draft. A concurrent request cancelled it before our lock was granted.
      givenQuotation({ status: 'draft' }, { status: 'cancelled' });

      await expect(
        service.update(supplierQuotationId, { status: 'received' }),
      ).rejects.toMatchObject({ status: 409 });
      expect(tx.supplierQuotation.updateMany).not.toHaveBeenCalled();
      expect(tx.supplierRFQ.updateMany).not.toHaveBeenCalled();
    });

    it('throws NOT_FOUND for a missing id', async () => {
      prisma.supplierQuotation.findUnique.mockResolvedValue(null);

      await expect(
        service.update('missing', { notes: 'x' }),
      ).rejects.toBeInstanceOf(ApiException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('throws NOT_FOUND when the row disappears between the pre-read and the lock', async () => {
      givenQuotation({ status: 'draft' });
      tx.supplierQuotation.findUnique.mockResolvedValue(null);

      await expect(
        service.update(supplierQuotationId, { notes: 'x' }),
      ).rejects.toMatchObject({ status: 404 });
      expect(tx.supplierQuotation.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('update — commercial field lock and total recalculation', () => {
    it('recalculates total = subtotal - discount + shippingCost while draft', async () => {
      givenQuotation({ status: 'draft' });

      await service.update(supplierQuotationId, {
        discount: 20,
        shippingCost: 5.5,
      });

      // subtotal 250 - 20 + 5.5
      expect(writeArgs().data.total?.toString()).toBe('235.5');
    });

    it('uses the stored value for whichever of discount/shippingCost is not in the request', async () => {
      givenQuotation({
        status: 'draft',
        discount: new Prisma.Decimal(10),
        shippingCost: new Prisma.Decimal(4),
      });

      await service.update(supplierQuotationId, { discount: 30 });

      // subtotal 250 - 30 + stored shipping 4
      expect(writeArgs().data.total?.toString()).toBe('224');
    });

    it('computes the total from the FRESH row, not the pre-read, when a concurrent edit landed first', async () => {
      // Pre-read has no shipping; a concurrent request set shipping 40 before our lock.
      givenQuotation(
        { status: 'draft' },
        { status: 'draft', shippingCost: new Prisma.Decimal(40) },
      );

      await service.update(supplierQuotationId, { discount: 10 });

      // subtotal 250 - 10 + fresh shipping 40 (a pre-read-based total would be 240).
      expect(writeArgs().data.total?.toString()).toBe('280');
    });

    it('does not write total for a notes-only edit or a non-received transition', async () => {
      givenQuotation({ status: 'draft' });
      await service.update(supplierQuotationId, { notes: 'x' });
      expect(writeArgs().data.total).toBeUndefined();

      tx.supplierQuotation.updateMany.mockClear();
      givenQuotation({ status: 'draft' });
      await service.update(supplierQuotationId, { status: 'cancelled' });
      expect(writeArgs().data.total).toBeUndefined();
    });

    it('status-only draft -> received recomputes a stale stored total from the stored subtotal/discount/shipping', async () => {
      givenQuotation({
        status: 'draft',
        total: new Prisma.Decimal(999),
        discount: new Prisma.Decimal(10),
        shippingCost: new Prisma.Decimal(4),
      });

      await service.update(supplierQuotationId, { status: 'received' });

      // subtotal 250 - 10 + 4, regardless of the stale stored 999.
      expect(writeArgs().data.total?.toString()).toBe('244');
    });

    it('status-only draft -> received rejects a stored state whose recomputed total is negative', async () => {
      givenQuotation({
        status: 'draft',
        discount: new Prisma.Decimal(300),
      });

      await expect(
        service.update(supplierQuotationId, { status: 'received' }),
      ).rejects.toMatchObject({ status: 400 });
      expect(tx.supplierQuotation.updateMany).not.toHaveBeenCalled();
      expect(tx.supplierRFQ.updateMany).not.toHaveBeenCalled();
    });

    it('rejects a discount that makes the total negative, without writing', async () => {
      givenQuotation({ status: 'draft' });

      await expect(
        service.update(supplierQuotationId, { discount: 300 }),
      ).rejects.toBeInstanceOf(ApiException);
      expect(tx.supplierQuotation.updateMany).not.toHaveBeenCalled();
    });

    it('accepts a discount that brings the total to exactly zero', async () => {
      givenQuotation({ status: 'draft' });

      await service.update(supplierQuotationId, { discount: 250 });

      expect(writeArgs().data.total?.toString()).toBe('0');
    });

    it('applies the recalculated total on a draft -> received transition that carries a discount', async () => {
      givenQuotation({ status: 'draft' });

      await service.update(supplierQuotationId, {
        status: 'received',
        discount: 50,
      });

      expect(writeArgs().data.total?.toString()).toBe('200');
    });

    it.each([
      'received',
      'under_review',
      'selected',
      'rejected',
      'expired',
      'cancelled',
    ])(
      'rejects editing every commercial field once the quotation is %s',
      async (status) => {
        for (const dto of [
          { discount: 1 },
          { shippingCost: 1 },
          { currency: 'EUR' },
          { quotationDate: '2026-01-01' },
          { validUntil: '2026-12-31' },
        ]) {
          givenQuotation({ status });
          await expect(
            service.update(supplierQuotationId, dto),
          ).rejects.toMatchObject({ status: 400 });
        }
        expect(tx.supplierQuotation.updateMany).not.toHaveBeenCalled();
      },
    );

    it('rejects a commercial edit when a concurrent request moved the quotation out of draft after the pre-read (the lock-versus-edit race)', async () => {
      // Pre-read: still draft. Fresh, post-lock state: already received.
      givenQuotation({ status: 'draft' }, { status: 'received' });

      await expect(
        service.update(supplierQuotationId, { discount: 5 }),
      ).rejects.toMatchObject({ status: 400 });
      expect(tx.supplierQuotation.updateMany).not.toHaveBeenCalled();
    });

    it('still allows notes to be edited after the quotation has left draft', async () => {
      givenQuotation({ status: 'selected' });

      await service.update(supplierQuotationId, { notes: 'Updated' });

      expect(writeArgs().data.notes).toBe('Updated');
      expect(writeArgs().where.status).toBe('selected');
    });

    it('updates notes/currency/validUntil/dates while draft', async () => {
      givenQuotation({ status: 'draft' });

      await service.update(supplierQuotationId, {
        notes: 'N',
        currency: 'EUR',
        validUntil: '2026-12-31',
      });

      expect(writeArgs().data.notes).toBe('N');
      expect(writeArgs().data.currency).toBe('EUR');
      expect(writeArgs().data.validUntil).toBeInstanceOf(Date);
    });
  });
});
