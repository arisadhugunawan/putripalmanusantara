import { Test } from '@nestjs/testing';
import { ApiException } from '../../common/exceptions/api.exception';
import { PrismaService } from '../../prisma/prisma.service';
import { RfqsService } from './rfqs.service';

describe('RfqsService', () => {
  let service: RfqsService;
  let prisma: {
    rFQ: {
      findMany: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    opportunity: { findUnique: jest.Mock };
    company: { findUnique: jest.Mock };
    product: { findMany: jest.Mock };
    $transaction: jest.Mock;
  };
  let tx: { rFQ: { create: jest.Mock }; product: { findMany: jest.Mock } };

  const company = { id: 'company-1', name: 'Buyer Co' };
  const opportunityId = 'opportunity-1';
  const rfqId = 'rfq-1';
  const productId = 'product-1';

  function storedRfq(overrides: Record<string, unknown> = {}) {
    return {
      id: rfqId,
      rfqNumber: 'RFQ-2026-000001',
      opportunityId: null,
      companyId: company.id,
      company,
      status: 'draft',
      requestedAt: null,
      validUntil: null,
      notes: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      items: [],
      ...overrides,
    };
  }

  function storedOpportunity(overrides: Record<string, unknown> = {}) {
    return {
      id: opportunityId,
      stage: 'proposal',
      companyId: company.id,
      ...overrides,
    };
  }

  beforeEach(async () => {
    tx = {
      rFQ: { create: jest.fn() },
      product: {
        findMany: jest
          .fn()
          .mockResolvedValue([{ id: productId, name: 'Copra' }]),
      },
    };
    prisma = {
      rFQ: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      opportunity: { findUnique: jest.fn() },
      company: { findUnique: jest.fn() },
      product: { findMany: jest.fn() },
      $transaction: jest.fn((fn: (t: unknown) => unknown) => fn(tx)),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [RfqsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(RfqsService);
  });

  const oneItem = [{ productId, quantity: 10 }];

  describe('findAll', () => {
    it('lists with no filters', async () => {
      const result = await service.findAll({
        page: 1,
        limit: 25,
        sort: '-created_at',
      });

      expect(prisma.rFQ.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
      expect(result.meta).toEqual(
        expect.objectContaining({ page: 1, limit: 25, total: 0 }),
      );
    });

    it('filters by status/companyId/opportunityId', async () => {
      await service.findAll({
        page: 1,
        limit: 25,
        sort: '-created_at',
        status: 'draft',
        companyId: company.id,
        opportunityId,
      });

      expect(prisma.rFQ.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'draft', companyId: company.id, opportunityId },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('returns the RFQ when found', async () => {
      prisma.rFQ.findUnique.mockResolvedValue(storedRfq());

      const result = await service.findOne(rfqId);

      expect(result.id).toBe(rfqId);
    });

    it('throws NOT_FOUND for a missing id', async () => {
      prisma.rFQ.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toBeInstanceOf(
        ApiException,
      );
    });
  });

  describe('createStandalone', () => {
    it('requires companyId', async () => {
      await expect(
        service.createStandalone({ items: oneItem }),
      ).rejects.toBeInstanceOf(ApiException);
    });

    it('rejects a missing company', async () => {
      prisma.company.findUnique.mockResolvedValue(null);

      await expect(
        service.createStandalone({ companyId: 'missing', items: oneItem }),
      ).rejects.toBeInstanceOf(ApiException);
      expect(tx.rFQ.create).not.toHaveBeenCalled();
    });

    it('creates a valid RFQ with opportunityId null', async () => {
      prisma.company.findUnique.mockResolvedValue(company);
      tx.rFQ.create.mockResolvedValue(storedRfq());

      const result = await service.createStandalone({
        companyId: company.id,
        items: oneItem,
      });

      /* eslint-disable @typescript-eslint/no-unsafe-assignment -- expect.* matchers are untyped by Jest's own types. */
      expect(tx.rFQ.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            companyId: company.id,
            opportunityId: null,
            status: 'draft',
          }),
        }),
      );
      /* eslint-enable @typescript-eslint/no-unsafe-assignment */
      expect(result.opportunityId).toBeNull();
    });

    it('creates multiple items', async () => {
      prisma.company.findUnique.mockResolvedValue(company);
      tx.product.findMany.mockResolvedValue([
        { id: 'product-1', name: 'Copra' },
        { id: 'product-2', name: 'Semi Husked Coconut' },
      ]);
      tx.rFQ.create.mockResolvedValue(storedRfq());

      await service.createStandalone({
        companyId: company.id,
        items: [
          { productId: 'product-1', quantity: 10 },
          { productId: 'product-2', quantity: 5 },
        ],
      });

      /* eslint-disable @typescript-eslint/no-unsafe-member-access -- jest.Mock's own `.calls` type is untyped by Jest's own types. */
      const createArgs = tx.rFQ.create.mock.calls[0][0] as {
        data: { items: { create: unknown[] } };
      };
      /* eslint-enable @typescript-eslint/no-unsafe-member-access */
      expect(createArgs.data.items.create).toHaveLength(2);
    });

    it('rejects a non-existent product and creates nothing', async () => {
      prisma.company.findUnique.mockResolvedValue(company);
      tx.product.findMany.mockResolvedValue([]);

      await expect(
        service.createStandalone({
          companyId: company.id,
          items: [{ productId: 'missing-product', quantity: 1 }],
        }),
      ).rejects.toBeInstanceOf(ApiException);
      expect(tx.rFQ.create).not.toHaveBeenCalled();
    });

    it('populates productNameSnapshot from the live Product master', async () => {
      prisma.company.findUnique.mockResolvedValue(company);
      tx.rFQ.create.mockResolvedValue(storedRfq());

      await service.createStandalone({ companyId: company.id, items: oneItem });

      /* eslint-disable @typescript-eslint/no-unsafe-member-access -- jest.Mock's own `.calls` type is untyped by Jest's own types. */
      const createArgs = tx.rFQ.create.mock.calls[0][0] as {
        data: { items: { create: { productNameSnapshot: string }[] } };
      };
      /* eslint-enable @typescript-eslint/no-unsafe-member-access */
      expect(createArgs.data.items.create[0].productNameSnapshot).toBe('Copra');
    });

    it('allows a duplicate product id within the same RFQ', async () => {
      prisma.company.findUnique.mockResolvedValue(company);
      tx.rFQ.create.mockResolvedValue(storedRfq());

      await service.createStandalone({
        companyId: company.id,
        items: [
          { productId, quantity: 5 },
          { productId, quantity: 7 },
        ],
      });

      /* eslint-disable @typescript-eslint/no-unsafe-member-access -- jest.Mock's own `.calls` type is untyped by Jest's own types. */
      const createArgs = tx.rFQ.create.mock.calls[0][0] as {
        data: { items: { create: unknown[] } };
      };
      /* eslint-enable @typescript-eslint/no-unsafe-member-access */
      expect(createArgs.data.items.create).toHaveLength(2);
    });
  });

  describe('createFromOpportunity', () => {
    it('throws NOT_FOUND when the opportunity does not exist', async () => {
      prisma.opportunity.findUnique.mockResolvedValue(null);

      await expect(
        service.createFromOpportunity('missing', { items: oneItem }),
      ).rejects.toBeInstanceOf(ApiException);
      expect(tx.rFQ.create).not.toHaveBeenCalled();
    });

    it.each(['proposal', 'negotiation', 'won'])(
      'accepts an opportunity with stage "%s"',
      async (stage) => {
        prisma.opportunity.findUnique.mockResolvedValue(
          storedOpportunity({ stage }),
        );
        tx.rFQ.create.mockResolvedValue(
          storedRfq({ opportunityId, companyId: company.id }),
        );

        const result = await service.createFromOpportunity(opportunityId, {
          items: oneItem,
        });

        expect(result.opportunityId).toBe(opportunityId);
      },
    );

    it.each(['prospecting', 'qualification', 'lost'])(
      'rejects an opportunity with stage "%s"',
      async (stage) => {
        prisma.opportunity.findUnique.mockResolvedValue(
          storedOpportunity({ stage }),
        );

        await expect(
          service.createFromOpportunity(opportunityId, { items: oneItem }),
        ).rejects.toBeInstanceOf(ApiException);
        expect(tx.rFQ.create).not.toHaveBeenCalled();
      },
    );

    it('rejects an opportunity with no company', async () => {
      prisma.opportunity.findUnique.mockResolvedValue(
        storedOpportunity({ companyId: null }),
      );

      await expect(
        service.createFromOpportunity(opportunityId, { items: oneItem }),
      ).rejects.toBeInstanceOf(ApiException);
      expect(tx.rFQ.create).not.toHaveBeenCalled();
    });

    it('derives companyId from the Opportunity, ignoring any client-supplied companyId', async () => {
      prisma.opportunity.findUnique.mockResolvedValue(
        storedOpportunity({ companyId: company.id }),
      );
      tx.rFQ.create.mockResolvedValue(
        storedRfq({ opportunityId, companyId: company.id }),
      );

      await service.createFromOpportunity(opportunityId, {
        items: oneItem,
        // Simulates a client payload that tries to override the company — `companyId` is a
        // valid field on `CreateRfqDto` (used by the standalone path), but this path must
        // never read it.
        companyId: 'attacker-supplied-company',
      });

      /* eslint-disable @typescript-eslint/no-unsafe-assignment -- expect.* matchers are untyped by Jest's own types. */
      expect(tx.rFQ.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ companyId: company.id }),
        }),
      );
      /* eslint-enable @typescript-eslint/no-unsafe-assignment */
      expect(prisma.company.findUnique).not.toHaveBeenCalled();
    });

    it('sets opportunityId to the opportunity id', async () => {
      prisma.opportunity.findUnique.mockResolvedValue(storedOpportunity());
      tx.rFQ.create.mockResolvedValue(
        storedRfq({ opportunityId, companyId: company.id }),
      );

      await service.createFromOpportunity(opportunityId, { items: oneItem });

      /* eslint-disable @typescript-eslint/no-unsafe-assignment -- expect.* matchers are untyped by Jest's own types. */
      expect(tx.rFQ.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ opportunityId }),
        }),
      );
      /* eslint-enable @typescript-eslint/no-unsafe-assignment */
    });

    it('never touches Opportunity.stage', async () => {
      prisma.opportunity.findUnique.mockResolvedValue(storedOpportunity());
      tx.rFQ.create.mockResolvedValue(storedRfq({ opportunityId }));

      await service.createFromOpportunity(opportunityId, { items: oneItem });

      // The mocked prisma object has no `opportunity.update`/`updateMany` method defined at
      // all — if the service attempted to call one, this test's own mock setup would throw
      // a TypeError, proving no such call was ever made.
      expect(prisma.opportunity.findUnique).toHaveBeenCalledTimes(1);
    });

    it('allows a second and third RFQ from the same Opportunity (cardinality)', async () => {
      prisma.opportunity.findUnique.mockResolvedValue(storedOpportunity());
      tx.rFQ.create
        .mockResolvedValueOnce(
          storedRfq({ opportunityId, rfqNumber: 'RFQ-2026-000001' }),
        )
        .mockResolvedValueOnce(
          storedRfq({ opportunityId, rfqNumber: 'RFQ-2026-000002' }),
        );

      const first = await service.createFromOpportunity(opportunityId, {
        items: oneItem,
      });
      const second = await service.createFromOpportunity(opportunityId, {
        items: oneItem,
      });

      expect(first.rfqNumber).toBe('RFQ-2026-000001');
      expect(second.rfqNumber).toBe('RFQ-2026-000002');
    });

    it('retries on an rfq_number collision without failing', async () => {
      prisma.opportunity.findUnique.mockResolvedValue(storedOpportunity());
      const collision = { code: 'P2002', meta: { target: ['rfq_number'] } };
      tx.rFQ.create
        .mockRejectedValueOnce(collision)
        .mockResolvedValueOnce(storedRfq({ rfqNumber: 'RFQ-2026-000002' }));

      const result = await service.createFromOpportunity(opportunityId, {
        items: oneItem,
      });

      expect(tx.rFQ.create).toHaveBeenCalledTimes(2);
      expect(result.rfqNumber).toBe('RFQ-2026-000002');
    });

    it('never surfaces a raw Prisma/Postgres error after exhausting retries', async () => {
      prisma.opportunity.findUnique.mockResolvedValue(storedOpportunity());
      const ambiguous = {
        code: 'P2039',
        meta: { driverAdapterError: { cause: { originalCode: '23505' } } },
      };
      tx.rFQ.create.mockRejectedValue(ambiguous);

      await expect(
        service.createFromOpportunity(opportunityId, { items: oneItem }),
      ).rejects.toBeInstanceOf(ApiException);
    });
  });

  describe('update', () => {
    it('updates notes/requestedAt/validUntil', async () => {
      prisma.rFQ.findUnique.mockResolvedValue(storedRfq());
      prisma.rFQ.update.mockResolvedValue(storedRfq({ notes: 'Updated' }));

      const result = await service.update(rfqId, { notes: 'Updated' });

      expect(result.notes).toBe('Updated');
    });

    it('allows a valid status transition (draft -> submitted)', async () => {
      prisma.rFQ.findUnique.mockResolvedValue(storedRfq({ status: 'draft' }));
      prisma.rFQ.update.mockResolvedValue(storedRfq({ status: 'submitted' }));

      const result = await service.update(rfqId, { status: 'submitted' });

      expect(result.status).toBe('submitted');
    });

    it.each([
      ['draft', 'reviewing'],
      ['draft', 'rejected'],
      ['submitted', 'draft'],
      ['reviewing', 'submitted'],
      ['rejected', 'submitted'],
      ['cancelled', 'submitted'],
    ])('rejects the invalid transition %s -> %s', async (from, to) => {
      prisma.rFQ.findUnique.mockResolvedValue(storedRfq({ status: from }));

      await expect(
        service.update(rfqId, {
          status: to as 'submitted' | 'reviewing' | 'rejected' | 'cancelled',
        }),
      ).rejects.toBeInstanceOf(ApiException);
      expect(prisma.rFQ.update).not.toHaveBeenCalled();
    });

    it('rejects a terminal RFQ from reopening', async () => {
      prisma.rFQ.findUnique.mockResolvedValue(storedRfq({ status: 'quoted' }));

      await expect(
        service.update(rfqId, { status: 'submitted' }),
      ).rejects.toBeInstanceOf(ApiException);
    });

    it('never allows items/rfqNumber/opportunityId/companyId to be touched (not part of UpdateRfqDto)', async () => {
      prisma.rFQ.findUnique.mockResolvedValue(storedRfq());
      prisma.rFQ.update.mockResolvedValue(storedRfq());

      await service.update(rfqId, {});

      /* eslint-disable @typescript-eslint/no-unsafe-member-access -- jest.Mock's own `.calls` type is untyped by Jest's own types. */
      const updateArgs = prisma.rFQ.update.mock.calls[0][0] as {
        data: Record<string, unknown>;
      };
      /* eslint-enable @typescript-eslint/no-unsafe-member-access */
      expect(updateArgs.data).not.toHaveProperty('items');
      expect(updateArgs.data).not.toHaveProperty('rfqNumber');
      expect(updateArgs.data).not.toHaveProperty('opportunityId');
      expect(updateArgs.data).not.toHaveProperty('companyId');
    });

    it('throws NOT_FOUND for a missing id', async () => {
      prisma.rFQ.findUnique.mockResolvedValue(null);

      await expect(
        service.update('missing', { notes: 'x' }),
      ).rejects.toBeInstanceOf(ApiException);
    });
  });
});
