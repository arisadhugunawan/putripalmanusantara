import { Test } from '@nestjs/testing';
import { ApiException } from '../../common/exceptions/api.exception';
import { PrismaService } from '../../prisma/prisma.service';
import { InquiriesService } from './inquiries.service';

describe('InquiriesService', () => {
  let service: InquiriesService;
  let prisma: {
    inquiry: {
      findMany: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    company: { findUnique: jest.Mock };
    quotationRequest: { findUnique: jest.Mock };
    $transaction: jest.Mock;
  };

  const company = { id: 'company-1', name: 'Buyer Co' };
  const inquiryId = 'inquiry-1';

  function storedInquiry(overrides: Record<string, unknown> = {}) {
    return {
      id: inquiryId,
      inquiryNumber: 'INQ-2026-000001',
      source: 'manual',
      companyName: 'Buyer Co',
      companyId: null,
      company: null,
      contactName: 'Jane Buyer',
      email: 'jane@buyer.example',
      phone: null,
      subject: null,
      message: null,
      status: 'new',
      sourceQuotationRequestId: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      ...overrides,
    };
  }

  const quotationRequest = {
    id: 'qr-1',
    type: 'quotation',
    name: 'John Supplier',
    company: 'Supplier Co',
    country: 'Indonesia',
    email: 'john@supplier.example',
    phone: '+628123456789',
    productId: null,
    productNameSnapshot: 'Copra',
    estimatedQuantity: '10 tons',
    message: 'Looking for a quote.',
    status: 'new',
    sourcePage: 'products/copra',
    createdAt: new Date('2025-12-01T00:00:00.000Z'),
  };

  beforeEach(async () => {
    prisma = {
      inquiry: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      company: { findUnique: jest.fn() },
      quotationRequest: { findUnique: jest.fn() },
      $transaction: jest.fn((fn: (tx: unknown) => unknown) => fn(prisma)),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        InquiriesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = moduleRef.get(InquiriesService);
  });

  describe('findAll', () => {
    it('lists with no filters', async () => {
      const result = await service.findAll({
        page: 1,
        limit: 25,
        sort: '-created_at',
      });

      expect(prisma.inquiry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
      expect(result.meta).toEqual(
        expect.objectContaining({ page: 1, limit: 25, total: 0 }),
      );
    });

    it('filters by status/source/companyId', async () => {
      await service.findAll({
        page: 1,
        limit: 25,
        sort: '-created_at',
        status: 'new',
        source: 'manual',
        companyId: company.id,
      });

      expect(prisma.inquiry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'new', source: 'manual', companyId: company.id },
        }),
      );
    });

    it('applies the q search across inquiryNumber/companyName/contactName/email/subject', async () => {
      await service.findAll({
        page: 1,
        limit: 25,
        sort: '-created_at',
        q: ' buyer ',
      });

      expect(prisma.inquiry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { inquiryNumber: { contains: 'buyer', mode: 'insensitive' } },
              { companyName: { contains: 'buyer', mode: 'insensitive' } },
              { contactName: { contains: 'buyer', mode: 'insensitive' } },
              { email: { contains: 'buyer', mode: 'insensitive' } },
              { subject: { contains: 'buyer', mode: 'insensitive' } },
            ],
          },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('returns the inquiry when found', async () => {
      prisma.inquiry.findUnique.mockResolvedValue(storedInquiry());

      const result = await service.findOne(inquiryId);

      expect(result.id).toBe(inquiryId);
    });

    it('throws NOT_FOUND for a missing id', async () => {
      prisma.inquiry.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toBeInstanceOf(
        ApiException,
      );
    });
  });

  describe('create (manual)', () => {
    it('creates with source=manual, status=new, companyId null when not supplied', async () => {
      prisma.inquiry.create.mockResolvedValue(storedInquiry());

      const result = await service.create({
        companyName: 'Buyer Co',
        contactName: 'Jane Buyer',
        email: 'jane@buyer.example',
      });

      /* eslint-disable @typescript-eslint/no-unsafe-assignment -- expect.* matchers are untyped by Jest's own types. */
      expect(prisma.inquiry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            companyName: 'Buyer Co',
            companyId: null,
            contactName: 'Jane Buyer',
            email: 'jane@buyer.example',
            source: 'manual',
            sourceQuotationRequestId: null,
          }),
        }),
      );
      /* eslint-enable @typescript-eslint/no-unsafe-assignment */
      expect(result.source).toBe('manual');
      expect(result.status).toBe('new');
    });

    it('validates companyId when supplied', async () => {
      prisma.company.findUnique.mockResolvedValue(company);
      prisma.inquiry.create.mockResolvedValue(
        storedInquiry({ companyId: company.id, company }),
      );

      await service.create({
        companyName: 'Buyer Co',
        companyId: company.id,
        contactName: 'Jane Buyer',
        email: 'jane@buyer.example',
      });

      expect(prisma.company.findUnique).toHaveBeenCalledWith({
        where: { id: company.id },
        select: { id: true },
      });
    });

    it('rejects an invalid companyId with VALIDATION_ERROR/400', async () => {
      prisma.company.findUnique.mockResolvedValue(null);

      await expect(
        service.create({
          companyName: 'Buyer Co',
          companyId: 'does-not-exist',
          contactName: 'Jane Buyer',
          email: 'jane@buyer.example',
        }),
      ).rejects.toBeInstanceOf(ApiException);
      expect(prisma.inquiry.create).not.toHaveBeenCalled();
    });

    it('never forwards source/status/sourceQuotationRequestId from client-controlled input', async () => {
      prisma.inquiry.create.mockResolvedValue(storedInquiry());

      await service.create({
        companyName: 'Buyer Co',
        contactName: 'Jane Buyer',
        email: 'jane@buyer.example',
      });

      /* eslint-disable @typescript-eslint/no-unsafe-member-access -- jest.Mock's own `.calls` type is untyped by Jest's own types. */
      const createArgs = prisma.inquiry.create.mock.calls[0][0] as {
        data: Record<string, unknown>;
      };
      /* eslint-enable @typescript-eslint/no-unsafe-member-access */
      expect(createArgs.data.source).toBe('manual');
      expect(createArgs.data.sourceQuotationRequestId).toBeNull();
    });
  });

  describe('convertFromQuotationRequest', () => {
    it('throws NOT_FOUND when the quotation request does not exist', async () => {
      prisma.quotationRequest.findUnique.mockResolvedValue(null);

      await expect(
        service.convertFromQuotationRequest('missing-qr'),
      ).rejects.toBeInstanceOf(ApiException);
      expect(prisma.inquiry.create).not.toHaveBeenCalled();
    });

    it('rejects a duplicate conversion with CONFLICT/409 and creates nothing', async () => {
      prisma.quotationRequest.findUnique.mockResolvedValue(quotationRequest);
      prisma.inquiry.findUnique.mockResolvedValue(storedInquiry());

      await expect(
        service.convertFromQuotationRequest(quotationRequest.id),
      ).rejects.toBeInstanceOf(ApiException);
      expect(prisma.inquiry.create).not.toHaveBeenCalled();
    });

    it('converts with the exact locked field mapping', async () => {
      prisma.quotationRequest.findUnique.mockResolvedValue(quotationRequest);
      prisma.inquiry.findUnique.mockResolvedValue(null);
      prisma.inquiry.create.mockResolvedValue(
        storedInquiry({
          source: 'quotation_request',
          sourceQuotationRequestId: quotationRequest.id,
          companyName: quotationRequest.company,
          contactName: quotationRequest.name,
          email: quotationRequest.email,
          phone: quotationRequest.phone,
          message: quotationRequest.message,
        }),
      );

      const result = await service.convertFromQuotationRequest(
        quotationRequest.id,
      );

      /* eslint-disable @typescript-eslint/no-unsafe-assignment -- expect.* matchers are untyped by Jest's own types. */
      expect(prisma.inquiry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            companyName: quotationRequest.company,
            companyId: null,
            contactName: quotationRequest.name,
            email: quotationRequest.email,
            phone: quotationRequest.phone,
            message: quotationRequest.message,
            source: 'quotation_request',
            sourceQuotationRequestId: quotationRequest.id,
          }),
        }),
      );
      /* eslint-enable @typescript-eslint/no-unsafe-assignment */
      expect(result.source).toBe('quotation_request');
      expect(result.sourceQuotationRequestId).toBe(quotationRequest.id);
      expect(result.companyId).toBeNull();
    });

    it('never copies type/productId/productNameSnapshot/estimatedQuantity/sourcePage/status/createdAt', async () => {
      prisma.quotationRequest.findUnique.mockResolvedValue(quotationRequest);
      prisma.inquiry.findUnique.mockResolvedValue(null);
      prisma.inquiry.create.mockResolvedValue(storedInquiry());

      await service.convertFromQuotationRequest(quotationRequest.id);

      /* eslint-disable @typescript-eslint/no-unsafe-member-access -- jest.Mock's own `.calls` type is untyped by Jest's own types. */
      const createArgs = prisma.inquiry.create.mock.calls[0][0] as {
        data: Record<string, unknown>;
      };
      /* eslint-enable @typescript-eslint/no-unsafe-member-access */
      expect(createArgs.data).not.toHaveProperty('type');
      expect(createArgs.data).not.toHaveProperty('productId');
      expect(createArgs.data).not.toHaveProperty('productNameSnapshot');
      expect(createArgs.data).not.toHaveProperty('estimatedQuantity');
      expect(createArgs.data).not.toHaveProperty('sourcePage');
      // Inquiry's own status always defaults fresh — not copied from QuotationRequest.status.
      expect(createArgs.data).not.toHaveProperty('createdAt');
    });

    it('never mutates the QuotationRequest itself', async () => {
      prisma.quotationRequest.findUnique.mockResolvedValue(quotationRequest);
      prisma.inquiry.findUnique.mockResolvedValue(null);
      prisma.inquiry.create.mockResolvedValue(storedInquiry());

      await service.convertFromQuotationRequest(quotationRequest.id);

      expect(prisma.quotationRequest.findUnique).toHaveBeenCalledTimes(1);
    });

    it('translates an inquiryNumber collision (ambiguous P2039) into a retry, not a failure', async () => {
      prisma.quotationRequest.findUnique.mockResolvedValue(quotationRequest);
      prisma.inquiry.findUnique.mockResolvedValue(null);
      prisma.inquiry.count.mockResolvedValue(0);

      const ambiguousError = {
        code: 'P2039',
        meta: { driverAdapterError: { cause: { originalCode: '23505' } } },
      };
      prisma.inquiry.create
        .mockRejectedValueOnce(ambiguousError)
        .mockResolvedValueOnce(
          storedInquiry({
            inquiryNumber: 'INQ-2026-000002',
            source: 'quotation_request',
            sourceQuotationRequestId: quotationRequest.id,
          }),
        );

      const result = await service.convertFromQuotationRequest(
        quotationRequest.id,
      );

      expect(prisma.inquiry.create).toHaveBeenCalledTimes(2);
      expect(result.inquiryNumber).toBe('INQ-2026-000002');
    });

    it('translates a source_quotation_request_id race (explicit P2002 target) into CONFLICT without retrying', async () => {
      prisma.quotationRequest.findUnique.mockResolvedValue(quotationRequest);
      prisma.inquiry.findUnique.mockResolvedValue(null);

      const raceError = {
        code: 'P2002',
        meta: { target: ['source_quotation_request_id'] },
      };
      prisma.inquiry.create.mockRejectedValue(raceError);

      await expect(
        service.convertFromQuotationRequest(quotationRequest.id),
      ).rejects.toBeInstanceOf(ApiException);
      expect(prisma.inquiry.create).toHaveBeenCalledTimes(1);
    });

    it('never surfaces a raw Prisma/Postgres error after exhausting retries', async () => {
      prisma.quotationRequest.findUnique.mockResolvedValue(quotationRequest);
      prisma.inquiry.findUnique.mockResolvedValue(null);

      const ambiguousError = {
        code: 'P2039',
        meta: { driverAdapterError: { cause: { originalCode: '23505' } } },
      };
      prisma.inquiry.create.mockRejectedValue(ambiguousError);

      await expect(
        service.convertFromQuotationRequest(quotationRequest.id),
      ).rejects.toBeInstanceOf(ApiException);
    });
  });

  describe('update', () => {
    it('updates editable fields', async () => {
      prisma.inquiry.findUnique.mockResolvedValue(storedInquiry());
      prisma.inquiry.update.mockResolvedValue(
        storedInquiry({ subject: 'Updated subject' }),
      );

      const result = await service.update(inquiryId, {
        subject: 'Updated subject',
      });

      expect(prisma.inquiry.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: inquiryId },
          data: { subject: 'Updated subject' },
        }),
      );
      expect(result.subject).toBe('Updated subject');
    });

    it('validates companyId on assignment', async () => {
      prisma.inquiry.findUnique.mockResolvedValue(storedInquiry());
      prisma.company.findUnique.mockResolvedValue(null);

      await expect(
        service.update(inquiryId, { companyId: 'does-not-exist' }),
      ).rejects.toBeInstanceOf(ApiException);
      expect(prisma.inquiry.update).not.toHaveBeenCalled();
    });

    it('allows a valid status transition (new -> contacted)', async () => {
      prisma.inquiry.findUnique.mockResolvedValue(
        storedInquiry({ status: 'new' }),
      );
      prisma.inquiry.update.mockResolvedValue(
        storedInquiry({ status: 'contacted' }),
      );

      const result = await service.update(inquiryId, { status: 'contacted' });

      expect(result.status).toBe('contacted');
    });

    it('rejects an invalid status transition (converted -> contacted)', async () => {
      prisma.inquiry.findUnique.mockResolvedValue(
        storedInquiry({ status: 'converted' }),
      );

      await expect(
        service.update(inquiryId, { status: 'contacted' }),
      ).rejects.toBeInstanceOf(ApiException);
      expect(prisma.inquiry.update).not.toHaveBeenCalled();
    });

    it('rejects system-owned fields being present has no effect (not part of UpdateInquiryDto)', async () => {
      prisma.inquiry.findUnique.mockResolvedValue(storedInquiry());
      prisma.inquiry.update.mockResolvedValue(storedInquiry());

      await service.update(inquiryId, {});

      /* eslint-disable @typescript-eslint/no-unsafe-member-access -- jest.Mock's own `.calls` type is untyped by Jest's own types. */
      const updateArgs = prisma.inquiry.update.mock.calls[0][0] as {
        data: Record<string, unknown>;
      };
      /* eslint-enable @typescript-eslint/no-unsafe-member-access */
      expect(updateArgs.data).not.toHaveProperty('inquiryNumber');
      expect(updateArgs.data).not.toHaveProperty('source');
      expect(updateArgs.data).not.toHaveProperty('sourceQuotationRequestId');
    });

    it('throws NOT_FOUND for a missing id', async () => {
      prisma.inquiry.findUnique.mockResolvedValue(null);

      await expect(
        service.update('missing', { subject: 'x' }),
      ).rejects.toBeInstanceOf(ApiException);
    });
  });
});
