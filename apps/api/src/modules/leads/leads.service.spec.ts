import { Test } from '@nestjs/testing';
import { ApiException } from '../../common/exceptions/api.exception';
import { PrismaService } from '../../prisma/prisma.service';
import { LeadsService } from './leads.service';

describe('LeadsService', () => {
  let service: LeadsService;
  let prisma: {
    lead: {
      findMany: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    inquiry: { findUnique: jest.Mock; updateMany: jest.Mock };
    company: { findUnique: jest.Mock };
    $transaction: jest.Mock;
  };

  const company = { id: 'company-1', name: 'Buyer Co' };
  const leadId = 'lead-1';
  const inquiryId = 'inquiry-1';

  function storedLead(overrides: Record<string, unknown> = {}) {
    return {
      id: leadId,
      leadNumber: 'LED-2026-000001',
      companyId: null,
      company: null,
      sourceInquiryId: null,
      sourceQuotationRequestId: null,
      status: 'new',
      ownerId: null,
      ownerName: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      ...overrides,
    };
  }

  function storedInquiry(overrides: Record<string, unknown> = {}) {
    return {
      id: inquiryId,
      inquiryNumber: 'INQ-2026-000001',
      status: 'new',
      companyId: null,
      companyName: 'Buyer Co',
      contactName: 'Jane Buyer',
      email: 'jane@buyer.example',
      phone: null,
      sourceQuotationRequestId: null,
      ...overrides,
    };
  }

  beforeEach(async () => {
    prisma = {
      lead: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        findUnique: jest.fn(),
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
        update: jest.fn(),
      },
      inquiry: {
        findUnique: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      company: { findUnique: jest.fn() },
      $transaction: jest.fn((fn: (tx: unknown) => unknown) => fn(prisma)),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [LeadsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(LeadsService);
  });

  describe('findAll', () => {
    it('lists with no filters', async () => {
      const result = await service.findAll({
        page: 1,
        limit: 25,
        sort: '-created_at',
      });

      expect(prisma.lead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
      expect(result.meta).toEqual(
        expect.objectContaining({ page: 1, limit: 25, total: 0 }),
      );
    });

    it('filters by status/companyId/ownerId', async () => {
      await service.findAll({
        page: 1,
        limit: 25,
        sort: '-created_at',
        status: 'new',
        companyId: company.id,
        ownerId: 'admin-1',
      });

      expect(prisma.lead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'new', companyId: company.id, ownerId: 'admin-1' },
        }),
      );
    });

    it('applies the q search across Lead and related Company/Inquiry fields', async () => {
      await service.findAll({
        page: 1,
        limit: 25,
        sort: '-created_at',
        q: 'buyer',
      });

      /* eslint-disable @typescript-eslint/no-unsafe-member-access -- jest.Mock's own `.calls` type is untyped by Jest's own types. */
      const callArgs = prisma.lead.findMany.mock.calls[0][0] as {
        where: { OR: unknown[] };
      };
      /* eslint-enable @typescript-eslint/no-unsafe-member-access */
      expect(callArgs.where.OR).toHaveLength(6);
    });
  });

  describe('findOne', () => {
    it('returns the lead when found', async () => {
      prisma.lead.findUnique.mockResolvedValue(storedLead());

      const result = await service.findOne(leadId);

      expect(result.id).toBe(leadId);
    });

    it('throws NOT_FOUND for a missing id', async () => {
      prisma.lead.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toBeInstanceOf(
        ApiException,
      );
    });
  });

  describe('create (direct)', () => {
    it('creates with status=new, owner null, source null', async () => {
      prisma.lead.create.mockResolvedValue(storedLead());

      const result = await service.create({});

      /* eslint-disable @typescript-eslint/no-unsafe-assignment -- expect.* matchers are untyped by Jest's own types. */
      expect(prisma.lead.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            companyId: null,
            sourceInquiryId: null,
            sourceQuotationRequestId: null,
            status: 'new',
            ownerId: null,
            ownerName: null,
          }),
        }),
      );
      /* eslint-enable @typescript-eslint/no-unsafe-assignment */
      expect(result.status).toBe('new');
      expect(result.ownerId).toBeNull();
      expect(result.sourceInquiryId).toBeNull();
    });

    it('validates companyId when supplied', async () => {
      prisma.company.findUnique.mockResolvedValue(null);

      await expect(
        service.create({ companyId: 'does-not-exist' }),
      ).rejects.toBeInstanceOf(ApiException);
      expect(prisma.lead.create).not.toHaveBeenCalled();
    });
  });

  describe('createFromInquiry', () => {
    it('throws NOT_FOUND when the inquiry does not exist', async () => {
      prisma.inquiry.findUnique.mockResolvedValue(null);

      await expect(
        service.createFromInquiry('missing-inquiry'),
      ).rejects.toBeInstanceOf(ApiException);
      expect(prisma.lead.create).not.toHaveBeenCalled();
    });

    it('converts a "new" inquiry successfully', async () => {
      prisma.inquiry.findUnique.mockResolvedValue(
        storedInquiry({ status: 'new' }),
      );
      prisma.lead.findFirst.mockResolvedValue(null);
      prisma.lead.create.mockResolvedValue(
        storedLead({ sourceInquiryId: inquiryId, status: 'new' }),
      );

      const result = await service.createFromInquiry(inquiryId);

      expect(result.sourceInquiryId).toBe(inquiryId);
      expect(result.status).toBe('new');
      expect(prisma.inquiry.updateMany).toHaveBeenCalledWith({
        where: { id: inquiryId, status: { in: ['new', 'contacted'] } },
        data: { status: 'converted' },
      });
    });

    it('converts a "contacted" inquiry successfully', async () => {
      prisma.inquiry.findUnique.mockResolvedValue(
        storedInquiry({ status: 'contacted' }),
      );
      prisma.lead.findFirst.mockResolvedValue(null);
      prisma.lead.create.mockResolvedValue(
        storedLead({ sourceInquiryId: inquiryId }),
      );

      await expect(service.createFromInquiry(inquiryId)).resolves.toBeDefined();
    });

    it('rejects a closed inquiry', async () => {
      prisma.inquiry.findUnique.mockResolvedValue(
        storedInquiry({ status: 'closed' }),
      );

      await expect(service.createFromInquiry(inquiryId)).rejects.toBeInstanceOf(
        ApiException,
      );
      expect(prisma.lead.create).not.toHaveBeenCalled();
    });

    it('rejects an already-converted inquiry', async () => {
      prisma.inquiry.findUnique.mockResolvedValue(
        storedInquiry({ status: 'converted' }),
      );

      await expect(service.createFromInquiry(inquiryId)).rejects.toBeInstanceOf(
        ApiException,
      );
      expect(prisma.lead.create).not.toHaveBeenCalled();
    });

    it('propagates companyId, sourceInquiryId, and sourceQuotationRequestId', async () => {
      prisma.inquiry.findUnique.mockResolvedValue(
        storedInquiry({
          status: 'new',
          companyId: company.id,
          sourceQuotationRequestId: 'qr-1',
        }),
      );
      prisma.lead.findFirst.mockResolvedValue(null);
      prisma.lead.create.mockResolvedValue(
        storedLead({
          companyId: company.id,
          sourceInquiryId: inquiryId,
          sourceQuotationRequestId: 'qr-1',
        }),
      );

      await service.createFromInquiry(inquiryId);

      /* eslint-disable @typescript-eslint/no-unsafe-assignment -- expect.* matchers are untyped by Jest's own types. */
      expect(prisma.lead.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            companyId: company.id,
            sourceInquiryId: inquiryId,
            sourceQuotationRequestId: 'qr-1',
            status: 'new',
            ownerId: null,
            ownerName: null,
          }),
        }),
      );
      /* eslint-enable @typescript-eslint/no-unsafe-assignment */
    });

    it('sets companyId to null when the inquiry has no company', async () => {
      prisma.inquiry.findUnique.mockResolvedValue(
        storedInquiry({ status: 'new', companyId: null }),
      );
      prisma.lead.findFirst.mockResolvedValue(null);
      prisma.lead.create.mockResolvedValue(storedLead());

      await service.createFromInquiry(inquiryId);

      /* eslint-disable @typescript-eslint/no-unsafe-assignment -- expect.* matchers are untyped by Jest's own types. */
      expect(prisma.lead.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ companyId: null }),
        }),
      );
      /* eslint-enable @typescript-eslint/no-unsafe-assignment */
    });

    describe('duplicate active lead', () => {
      it.each(['new', 'contacted', 'qualified'])(
        'rejects with 409 when an existing lead is "%s"',
        async (activeStatus) => {
          prisma.inquiry.findUnique.mockResolvedValue(
            storedInquiry({ status: 'new' }),
          );
          prisma.lead.findFirst.mockResolvedValue(
            storedLead({ status: activeStatus }),
          );

          await expect(
            service.createFromInquiry(inquiryId),
          ).rejects.toBeInstanceOf(ApiException);
          expect(prisma.lead.create).not.toHaveBeenCalled();
        },
      );
    });

    describe('re-engagement after a terminal lead', () => {
      it.each(['lost', 'unqualified', 'converted'])(
        'allows a new lead when the only existing lead is "%s"',
        async () => {
          prisma.inquiry.findUnique.mockResolvedValue(
            storedInquiry({ status: 'new' }),
          );
          // findFirst is scoped to ACTIVE_LEAD_STATUSES only — a terminal-status lead never
          // matches that filter, so the service sees no active lead at all.
          prisma.lead.findFirst.mockResolvedValue(null);
          prisma.lead.create.mockResolvedValue(
            storedLead({ sourceInquiryId: inquiryId, status: 'new' }),
          );

          const result = await service.createFromInquiry(inquiryId);

          expect(result.status).toBe('new');
        },
      );
    });

    it('rejects via 409 and rolls back when the conditional Inquiry update matches zero rows (concurrent conversion)', async () => {
      prisma.inquiry.findUnique.mockResolvedValue(
        storedInquiry({ status: 'new' }),
      );
      prisma.lead.findFirst.mockResolvedValue(null);
      prisma.lead.create.mockResolvedValue(
        storedLead({ sourceInquiryId: inquiryId }),
      );
      prisma.inquiry.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.createFromInquiry(inquiryId)).rejects.toBeInstanceOf(
        ApiException,
      );
    });

    it('never sets Lead.status to "converted"', async () => {
      prisma.inquiry.findUnique.mockResolvedValue(
        storedInquiry({ status: 'new' }),
      );
      prisma.lead.findFirst.mockResolvedValue(null);
      prisma.lead.create.mockResolvedValue(storedLead());

      await service.createFromInquiry(inquiryId);

      /* eslint-disable @typescript-eslint/no-unsafe-member-access -- jest.Mock's own `.calls` type is untyped by Jest's own types. */
      const createArgs = prisma.lead.create.mock.calls[0][0] as {
        data: Record<string, unknown>;
      };
      /* eslint-enable @typescript-eslint/no-unsafe-member-access */
      expect(createArgs.data.status).toBe('new');
    });

    it('retries on a lead_number collision without failing', async () => {
      prisma.inquiry.findUnique.mockResolvedValue(
        storedInquiry({ status: 'new' }),
      );
      prisma.lead.findFirst.mockResolvedValue(null);
      const collision = { code: 'P2002', meta: { target: ['lead_number'] } };
      prisma.lead.create.mockRejectedValueOnce(collision).mockResolvedValueOnce(
        storedLead({
          leadNumber: 'LED-2026-000002',
          sourceInquiryId: inquiryId,
        }),
      );

      const result = await service.createFromInquiry(inquiryId);

      expect(prisma.lead.create).toHaveBeenCalledTimes(2);
      expect(result.leadNumber).toBe('LED-2026-000002');
    });

    it('never surfaces a raw Prisma/Postgres error after exhausting retries', async () => {
      prisma.inquiry.findUnique.mockResolvedValue(
        storedInquiry({ status: 'new' }),
      );
      prisma.lead.findFirst.mockResolvedValue(null);
      const ambiguous = {
        code: 'P2039',
        meta: { driverAdapterError: { cause: { originalCode: '23505' } } },
      };
      prisma.lead.create.mockRejectedValue(ambiguous);

      await expect(service.createFromInquiry(inquiryId)).rejects.toBeInstanceOf(
        ApiException,
      );
    });
  });

  describe('update', () => {
    it('updates owner fields', async () => {
      prisma.lead.findUnique.mockResolvedValue(storedLead());
      prisma.lead.update.mockResolvedValue(
        storedLead({ ownerId: 'admin-1', ownerName: 'Admin One' }),
      );

      const result = await service.update(leadId, {
        ownerId: 'admin-1',
        ownerName: 'Admin One',
      });

      expect(result.ownerId).toBe('admin-1');
      expect(result.ownerName).toBe('Admin One');
    });

    it('validates companyId on assignment', async () => {
      prisma.lead.findUnique.mockResolvedValue(storedLead());
      prisma.company.findUnique.mockResolvedValue(null);

      await expect(
        service.update(leadId, { companyId: 'does-not-exist' }),
      ).rejects.toBeInstanceOf(ApiException);
      expect(prisma.lead.update).not.toHaveBeenCalled();
    });

    it('allows a valid status transition (new -> contacted)', async () => {
      prisma.lead.findUnique.mockResolvedValue(storedLead({ status: 'new' }));
      prisma.lead.update.mockResolvedValue(storedLead({ status: 'contacted' }));

      const result = await service.update(leadId, { status: 'contacted' });

      expect(result.status).toBe('contacted');
    });

    it.each([
      ['converted', 'contacted'],
      ['lost', 'contacted'],
      ['unqualified', 'qualified'],
    ])('rejects the invalid transition %s -> %s', async (from, to) => {
      prisma.lead.findUnique.mockResolvedValue(storedLead({ status: from }));

      await expect(
        service.update(leadId, {
          status: to as
            'new' | 'contacted' | 'qualified' | 'unqualified' | 'lost',
        }),
      ).rejects.toBeInstanceOf(ApiException);
      expect(prisma.lead.update).not.toHaveBeenCalled();
    });

    it('throws NOT_FOUND for a missing id', async () => {
      prisma.lead.findUnique.mockResolvedValue(null);

      await expect(
        service.update('missing', { ownerId: 'admin-1' }),
      ).rejects.toBeInstanceOf(ApiException);
    });

    it('never allows source lineage or system-owned fields to be touched (not part of UpdateLeadDto)', async () => {
      prisma.lead.findUnique.mockResolvedValue(storedLead());
      prisma.lead.update.mockResolvedValue(storedLead());

      await service.update(leadId, {});

      /* eslint-disable @typescript-eslint/no-unsafe-member-access -- jest.Mock's own `.calls` type is untyped by Jest's own types. */
      const updateArgs = prisma.lead.update.mock.calls[0][0] as {
        data: Record<string, unknown>;
      };
      /* eslint-enable @typescript-eslint/no-unsafe-member-access */
      expect(updateArgs.data).not.toHaveProperty('leadNumber');
      expect(updateArgs.data).not.toHaveProperty('sourceInquiryId');
      expect(updateArgs.data).not.toHaveProperty('sourceQuotationRequestId');
    });
  });
});
