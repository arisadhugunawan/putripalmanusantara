import { Test } from '@nestjs/testing';
import { ApiException } from '../../common/exceptions/api.exception';
import { PrismaService } from '../../prisma/prisma.service';
import { OpportunitiesService } from './opportunities.service';

describe('OpportunitiesService', () => {
  let service: OpportunitiesService;
  let prisma: {
    opportunity: {
      findMany: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    lead: { findUnique: jest.Mock; updateMany: jest.Mock };
    $transaction: jest.Mock;
  };

  const company = { id: 'company-1', name: 'Buyer Co' };
  const leadId = 'lead-1';
  const opportunityId = 'opportunity-1';

  function storedOpportunity(overrides: Record<string, unknown> = {}) {
    return {
      id: opportunityId,
      opportunityNumber: 'OPP-2026-000001',
      leadId,
      companyId: null,
      company: null,
      name: 'Semi Husked Coconut — Thailand',
      stage: 'prospecting',
      estimatedValue: null,
      currency: null,
      expectedCloseDate: null,
      ownerId: null,
      ownerName: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      ...overrides,
    };
  }

  function storedLead(overrides: Record<string, unknown> = {}) {
    return {
      id: leadId,
      leadNumber: 'LED-2026-000001',
      status: 'qualified',
      companyId: null,
      ownerId: null,
      ownerName: null,
      ...overrides,
    };
  }

  beforeEach(async () => {
    prisma = {
      opportunity: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      lead: {
        findUnique: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      $transaction: jest.fn((fn: (tx: unknown) => unknown) => fn(prisma)),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        OpportunitiesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = moduleRef.get(OpportunitiesService);
  });

  describe('findAll', () => {
    it('lists with no filters', async () => {
      const result = await service.findAll({
        page: 1,
        limit: 25,
        sort: '-created_at',
      });

      expect(prisma.opportunity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
      expect(result.meta).toEqual(
        expect.objectContaining({ page: 1, limit: 25, total: 0 }),
      );
    });

    it('filters by stage/companyId/leadId/ownerId', async () => {
      await service.findAll({
        page: 1,
        limit: 25,
        sort: '-created_at',
        stage: 'prospecting',
        companyId: company.id,
        leadId,
        ownerId: 'admin-1',
      });

      expect(prisma.opportunity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            stage: 'prospecting',
            companyId: company.id,
            leadId,
            ownerId: 'admin-1',
          },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('returns the opportunity when found', async () => {
      prisma.opportunity.findUnique.mockResolvedValue(storedOpportunity());

      const result = await service.findOne(opportunityId);

      expect(result.id).toBe(opportunityId);
    });

    it('throws NOT_FOUND for a missing id', async () => {
      prisma.opportunity.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toBeInstanceOf(
        ApiException,
      );
    });
  });

  describe('createFromLead', () => {
    it('throws NOT_FOUND when the lead does not exist', async () => {
      prisma.lead.findUnique.mockResolvedValue(null);

      await expect(
        service.createFromLead('missing-lead', { name: 'Deal' }),
      ).rejects.toBeInstanceOf(ApiException);
      expect(prisma.opportunity.create).not.toHaveBeenCalled();
    });

    it.each(['new', 'contacted', 'unqualified', 'lost'])(
      'rejects a lead with status "%s"',
      async (status) => {
        prisma.lead.findUnique.mockResolvedValue(storedLead({ status }));

        await expect(
          service.createFromLead(leadId, { name: 'Deal' }),
        ).rejects.toBeInstanceOf(ApiException);
        expect(prisma.opportunity.create).not.toHaveBeenCalled();
      },
    );

    it('converts a "qualified" lead and flips its status to converted', async () => {
      prisma.lead.findUnique.mockResolvedValue(
        storedLead({ status: 'qualified' }),
      );
      prisma.opportunity.create.mockResolvedValue(
        storedOpportunity({ name: 'Semi Husked Coconut — Thailand' }),
      );

      const result = await service.createFromLead(leadId, {
        name: 'Semi Husked Coconut — Thailand',
      });

      expect(result.name).toBe('Semi Husked Coconut — Thailand');
      expect(prisma.lead.updateMany).toHaveBeenCalledWith({
        where: { id: leadId, status: 'qualified' },
        data: { status: 'converted' },
      });
    });

    it('allows a second opportunity from an already-converted lead, without touching Lead.status', async () => {
      prisma.lead.findUnique.mockResolvedValue(
        storedLead({ status: 'converted' }),
      );
      prisma.opportunity.create.mockResolvedValue(
        storedOpportunity({ name: 'Copra — China' }),
      );

      const result = await service.createFromLead(leadId, {
        name: 'Copra — China',
      });

      expect(result.name).toBe('Copra — China');
      expect(prisma.lead.updateMany).not.toHaveBeenCalled();
    });

    it('allows a third opportunity from the same already-converted lead', async () => {
      prisma.lead.findUnique.mockResolvedValue(
        storedLead({ status: 'converted' }),
      );
      prisma.opportunity.create.mockResolvedValue(
        storedOpportunity({ name: 'Coconut Shell Charcoal — Vietnam' }),
      );

      const result = await service.createFromLead(leadId, {
        name: 'Coconut Shell Charcoal — Vietnam',
      });

      expect(result.name).toBe('Coconut Shell Charcoal — Vietnam');
      expect(prisma.lead.updateMany).not.toHaveBeenCalled();
    });

    it('propagates companyId, ownerId, and ownerName from the Lead', async () => {
      prisma.lead.findUnique.mockResolvedValue(
        storedLead({
          status: 'qualified',
          companyId: company.id,
          ownerId: 'admin-1',
          ownerName: 'Admin One',
        }),
      );
      prisma.opportunity.create.mockResolvedValue(
        storedOpportunity({
          companyId: company.id,
          ownerId: 'admin-1',
          ownerName: 'Admin One',
        }),
      );

      const result = await service.createFromLead(leadId, { name: 'Deal' });

      /* eslint-disable @typescript-eslint/no-unsafe-assignment -- expect.* matchers are untyped by Jest's own types. */
      expect(prisma.opportunity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            leadId,
            companyId: company.id,
            ownerId: 'admin-1',
            ownerName: 'Admin One',
            stage: 'prospecting',
          }),
        }),
      );
      /* eslint-enable @typescript-eslint/no-unsafe-assignment */
      expect(result.companyId).toBe(company.id);
      expect(result.ownerId).toBe('admin-1');
    });

    it('propagates a null companyId/ownerId/ownerName when the Lead has none', async () => {
      prisma.lead.findUnique.mockResolvedValue(
        storedLead({ status: 'qualified' }),
      );
      prisma.opportunity.create.mockResolvedValue(storedOpportunity());

      await service.createFromLead(leadId, { name: 'Deal' });

      /* eslint-disable @typescript-eslint/no-unsafe-assignment -- expect.* matchers are untyped by Jest's own types. */
      expect(prisma.opportunity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            companyId: null,
            ownerId: null,
            ownerName: null,
          }),
        }),
      );
      /* eslint-enable @typescript-eslint/no-unsafe-assignment */
    });

    it('sets initial stage to "prospecting"', async () => {
      prisma.lead.findUnique.mockResolvedValue(
        storedLead({ status: 'qualified' }),
      );
      prisma.opportunity.create.mockResolvedValue(storedOpportunity());

      const result = await service.createFromLead(leadId, { name: 'Deal' });

      expect(result.stage).toBe('prospecting');
    });

    it('accepts estimatedValue, currency, and expectedCloseDate', async () => {
      prisma.lead.findUnique.mockResolvedValue(
        storedLead({ status: 'qualified' }),
      );
      prisma.opportunity.create.mockResolvedValue(
        storedOpportunity({
          estimatedValue: '5000.00',
          currency: 'USD',
          expectedCloseDate: new Date('2026-06-01T00:00:00.000Z'),
        }),
      );

      await service.createFromLead(leadId, {
        name: 'Deal',
        estimatedValue: 5000,
        currency: 'USD',
        expectedCloseDate: '2026-06-01T00:00:00.000Z',
      });

      /* eslint-disable @typescript-eslint/no-unsafe-assignment -- expect.* matchers are untyped by Jest's own types. */
      expect(prisma.opportunity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            estimatedValue: 5000,
            currency: 'USD',
            expectedCloseDate: new Date('2026-06-01T00:00:00.000Z'),
          }),
        }),
      );
      /* eslint-enable @typescript-eslint/no-unsafe-assignment */
    });

    it('commits when the conditional update loses a race but the lead is already converted', async () => {
      prisma.lead.findUnique
        .mockResolvedValueOnce(storedLead({ status: 'qualified' }))
        .mockResolvedValueOnce({ status: 'converted' });
      prisma.lead.updateMany.mockResolvedValue({ count: 0 });
      prisma.opportunity.create.mockResolvedValue(storedOpportunity());

      const result = await service.createFromLead(leadId, { name: 'Deal' });

      expect(result).toBeDefined();
    });

    it('rolls back with a clean 409 when the conditional update fails and the lead is in an unexpected state', async () => {
      prisma.lead.findUnique
        .mockResolvedValueOnce(storedLead({ status: 'qualified' }))
        .mockResolvedValueOnce({ status: 'lost' });
      prisma.lead.updateMany.mockResolvedValue({ count: 0 });
      prisma.opportunity.create.mockResolvedValue(storedOpportunity());

      await expect(
        service.createFromLead(leadId, { name: 'Deal' }),
      ).rejects.toBeInstanceOf(ApiException);
    });

    it('retries on an opportunity_number collision without failing', async () => {
      prisma.lead.findUnique.mockResolvedValue(
        storedLead({ status: 'qualified' }),
      );
      const collision = {
        code: 'P2002',
        meta: { target: ['opportunity_number'] },
      };
      prisma.opportunity.create
        .mockRejectedValueOnce(collision)
        .mockResolvedValueOnce(
          storedOpportunity({ opportunityNumber: 'OPP-2026-000002' }),
        );

      const result = await service.createFromLead(leadId, { name: 'Deal' });

      expect(prisma.opportunity.create).toHaveBeenCalledTimes(2);
      expect(result.opportunityNumber).toBe('OPP-2026-000002');
    });

    it('never surfaces a raw Prisma/Postgres error after exhausting retries', async () => {
      prisma.lead.findUnique.mockResolvedValue(
        storedLead({ status: 'qualified' }),
      );
      const ambiguous = {
        code: 'P2039',
        meta: { driverAdapterError: { cause: { originalCode: '23505' } } },
      };
      prisma.opportunity.create.mockRejectedValue(ambiguous);

      await expect(
        service.createFromLead(leadId, { name: 'Deal' }),
      ).rejects.toBeInstanceOf(ApiException);
    });
  });

  describe('update', () => {
    it('updates editable fields', async () => {
      prisma.opportunity.findUnique.mockResolvedValue(storedOpportunity());
      prisma.opportunity.update.mockResolvedValue(
        storedOpportunity({ name: 'Updated Name' }),
      );

      const result = await service.update(opportunityId, {
        name: 'Updated Name',
      });

      expect(result.name).toBe('Updated Name');
    });

    it('allows a valid stage transition (prospecting -> qualification)', async () => {
      prisma.opportunity.findUnique.mockResolvedValue(
        storedOpportunity({ stage: 'prospecting' }),
      );
      prisma.opportunity.update.mockResolvedValue(
        storedOpportunity({ stage: 'qualification' }),
      );

      const result = await service.update(opportunityId, {
        stage: 'qualification',
      });

      expect(result.stage).toBe('qualification');
    });

    it.each([
      ['won', 'negotiation'],
      ['lost', 'negotiation'],
      ['negotiation', 'prospecting'],
    ])('rejects the invalid stage transition %s -> %s', async (from, to) => {
      prisma.opportunity.findUnique.mockResolvedValue(
        storedOpportunity({ stage: from }),
      );

      await expect(
        service.update(opportunityId, {
          stage: to as
            | 'prospecting'
            | 'qualification'
            | 'proposal'
            | 'negotiation'
            | 'won'
            | 'lost',
        }),
      ).rejects.toBeInstanceOf(ApiException);
      expect(prisma.opportunity.update).not.toHaveBeenCalled();
    });

    it('never allows leadId/companyId/opportunityNumber to be touched (not part of UpdateOpportunityDto)', async () => {
      prisma.opportunity.findUnique.mockResolvedValue(storedOpportunity());
      prisma.opportunity.update.mockResolvedValue(storedOpportunity());

      await service.update(opportunityId, {});

      /* eslint-disable @typescript-eslint/no-unsafe-member-access -- jest.Mock's own `.calls` type is untyped by Jest's own types. */
      const updateArgs = prisma.opportunity.update.mock.calls[0][0] as {
        data: Record<string, unknown>;
      };
      /* eslint-enable @typescript-eslint/no-unsafe-member-access */
      expect(updateArgs.data).not.toHaveProperty('leadId');
      expect(updateArgs.data).not.toHaveProperty('companyId');
      expect(updateArgs.data).not.toHaveProperty('opportunityNumber');
    });

    it('throws NOT_FOUND for a missing id', async () => {
      prisma.opportunity.findUnique.mockResolvedValue(null);

      await expect(
        service.update('missing', { name: 'x' }),
      ).rejects.toBeInstanceOf(ApiException);
    });
  });
});
