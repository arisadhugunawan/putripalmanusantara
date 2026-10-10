import { Test } from '@nestjs/testing';
import { Prisma } from '../../../generated/prisma/client';
import { ApiException } from '../../common/exceptions/api.exception';
import { PrismaService } from '../../prisma/prisma.service';
import { SupplierRfqsService } from './supplier-rfqs.service';

describe('SupplierRfqsService', () => {
  let service: SupplierRfqsService;
  let prisma: {
    supplierRFQ: {
      findMany: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    company: { findUnique: jest.Mock };
    businessRelationship: { findFirst: jest.Mock };
    $transaction: jest.Mock;
  };
  let tx: {
    purchaseRequest: {
      findUnique: jest.Mock;
      updateMany: jest.Mock;
    };
    product: { findMany: jest.Mock };
    supplierRFQ: { create: jest.Mock };
  };

  const purchaseRequestId = 'pr-1';
  const supplierRfqId = 'srfq-1';
  const supplierCompanyId = 'company-1';
  const productId = 'product-1';

  function storedPurchaseRequest(overrides: Record<string, unknown> = {}) {
    return {
      id: purchaseRequestId,
      status: 'approved',
      items: [
        {
          id: 'pri-1',
          productId,
          quantity: new Prisma.Decimal(10),
          unit: 'ton',
          specifications: null,
          notes: null,
        },
      ],
      ...overrides,
    };
  }

  function storedSupplierRfq(overrides: Record<string, unknown> = {}) {
    return {
      id: supplierRfqId,
      supplierRfqNumber: 'SRFQ-2026-000001',
      purchaseRequestId,
      supplierCompanyId,
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

  beforeEach(async () => {
    tx = {
      purchaseRequest: {
        findUnique: jest.fn().mockResolvedValue(storedPurchaseRequest()),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      product: {
        findMany: jest
          .fn()
          .mockResolvedValue([{ id: productId, name: 'Copra' }]),
      },
      supplierRFQ: { create: jest.fn() },
    };
    prisma = {
      supplierRFQ: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      company: {
        findUnique: jest.fn().mockResolvedValue({ id: supplierCompanyId }),
      },
      businessRelationship: {
        findFirst: jest.fn().mockResolvedValue({ id: 'br-1' }),
      },
      $transaction: jest.fn((fn: (t: unknown) => unknown) => fn(tx)),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        SupplierRfqsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = moduleRef.get(SupplierRfqsService);
  });

  describe('findAll', () => {
    it('lists with no filters', async () => {
      const result = await service.findAll({
        page: 1,
        limit: 25,
        sort: '-created_at',
      });

      expect(prisma.supplierRFQ.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
      expect(result.meta).toEqual(
        expect.objectContaining({ page: 1, limit: 25, total: 0 }),
      );
    });

    it('filters by status/purchaseRequestId/supplierCompanyId', async () => {
      await service.findAll({
        page: 1,
        limit: 25,
        sort: '-created_at',
        status: 'draft',
        purchaseRequestId,
        supplierCompanyId,
      });

      expect(prisma.supplierRFQ.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'draft', purchaseRequestId, supplierCompanyId },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('returns the supplier RFQ when found', async () => {
      prisma.supplierRFQ.findUnique.mockResolvedValue(storedSupplierRfq());

      const result = await service.findOne(supplierRfqId);

      expect(result.id).toBe(supplierRfqId);
    });

    it('throws NOT_FOUND for a missing id', async () => {
      prisma.supplierRFQ.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toBeInstanceOf(
        ApiException,
      );
    });
  });

  describe('createFromPurchaseRequest', () => {
    it('creates a supplier RFQ from an approved purchase request', async () => {
      tx.supplierRFQ.create.mockResolvedValue(storedSupplierRfq());

      const result = await service.createFromPurchaseRequest(
        purchaseRequestId,
        { supplierCompanyId },
      );

      expect(result.id).toBe(supplierRfqId);
    });

    it.each(['draft', 'submitted', 'rejected', 'cancelled'])(
      'rejects a purchase request with status "%s"',
      async (status) => {
        tx.purchaseRequest.findUnique.mockResolvedValue(
          storedPurchaseRequest({ status }),
        );

        await expect(
          service.createFromPurchaseRequest(purchaseRequestId, {
            supplierCompanyId,
          }),
        ).rejects.toBeInstanceOf(ApiException);
        expect(tx.supplierRFQ.create).not.toHaveBeenCalled();
      },
    );

    it('throws NOT_FOUND when the purchase request does not exist', async () => {
      tx.purchaseRequest.findUnique.mockResolvedValue(null);

      await expect(
        service.createFromPurchaseRequest('missing', { supplierCompanyId }),
      ).rejects.toBeInstanceOf(ApiException);
      expect(tx.supplierRFQ.create).not.toHaveBeenCalled();
    });

    it('rejects a purchase request with no items', async () => {
      tx.purchaseRequest.findUnique.mockResolvedValue(
        storedPurchaseRequest({ items: [] }),
      );

      await expect(
        service.createFromPurchaseRequest(purchaseRequestId, {
          supplierCompanyId,
        }),
      ).rejects.toBeInstanceOf(ApiException);
      expect(tx.supplierRFQ.create).not.toHaveBeenCalled();
    });

    it('rejects a supplier company with no active supplier relationship', async () => {
      prisma.businessRelationship.findFirst.mockResolvedValue(null);

      await expect(
        service.createFromPurchaseRequest(purchaseRequestId, {
          supplierCompanyId,
        }),
      ).rejects.toBeInstanceOf(ApiException);
      expect(tx.supplierRFQ.create).not.toHaveBeenCalled();
    });

    it('rejects a non-existent supplier company', async () => {
      prisma.company.findUnique.mockResolvedValue(null);

      await expect(
        service.createFromPurchaseRequest(purchaseRequestId, {
          supplierCompanyId: 'missing',
        }),
      ).rejects.toBeInstanceOf(ApiException);
      expect(tx.supplierRFQ.create).not.toHaveBeenCalled();
    });

    it('copies productId/quantity/unit/specifications/notes from PurchaseRequestItem', async () => {
      tx.purchaseRequest.findUnique.mockResolvedValue(
        storedPurchaseRequest({
          items: [
            {
              id: 'pri-1',
              productId,
              quantity: new Prisma.Decimal(42),
              unit: 'KG',
              specifications: 'Grade A',
              notes: 'Handle with care',
            },
          ],
        }),
      );
      tx.supplierRFQ.create.mockResolvedValue(storedSupplierRfq());

      await service.createFromPurchaseRequest(purchaseRequestId, {
        supplierCompanyId,
      });

      /* eslint-disable @typescript-eslint/no-unsafe-member-access -- jest.Mock's own `.calls` type is untyped by Jest's own types. */
      const createArgs = tx.supplierRFQ.create.mock.calls[0][0] as {
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
      const item = createArgs.data.items.create[0];
      expect(item.productId).toBe(productId);
      expect((item.quantity as Prisma.Decimal).toString()).toBe('42');
      expect(item.unit).toBe('KG');
      expect(item.specifications).toBe('Grade A');
      expect(item.notes).toBe('Handle with care');
      expect(item.productNameSnapshot).toBe('Copra');
    });

    it('flips PurchaseRequest status approved -> converted on the first supplier RFQ', async () => {
      tx.supplierRFQ.create.mockResolvedValue(storedSupplierRfq());

      await service.createFromPurchaseRequest(purchaseRequestId, {
        supplierCompanyId,
      });

      expect(tx.purchaseRequest.updateMany).toHaveBeenCalledWith({
        where: { id: purchaseRequestId, status: 'approved' },
        data: { status: 'converted' },
      });
    });

    it('does not touch PurchaseRequest status when it was already converted', async () => {
      tx.purchaseRequest.findUnique.mockResolvedValue(
        storedPurchaseRequest({ status: 'converted' }),
      );
      tx.supplierRFQ.create.mockResolvedValue(storedSupplierRfq());

      await service.createFromPurchaseRequest(purchaseRequestId, {
        supplierCompanyId,
      });

      expect(tx.purchaseRequest.updateMany).not.toHaveBeenCalled();
    });

    it('allows a second and third supplier RFQ from the same purchase request (cardinality)', async () => {
      tx.purchaseRequest.findUnique.mockResolvedValue(
        storedPurchaseRequest({ status: 'converted' }),
      );
      tx.supplierRFQ.create
        .mockResolvedValueOnce(
          storedSupplierRfq({ supplierRfqNumber: 'SRFQ-2026-000001' }),
        )
        .mockResolvedValueOnce(
          storedSupplierRfq({ supplierRfqNumber: 'SRFQ-2026-000002' }),
        );

      const first = await service.createFromPurchaseRequest(purchaseRequestId, {
        supplierCompanyId,
      });
      const second = await service.createFromPurchaseRequest(
        purchaseRequestId,
        { supplierCompanyId: 'company-2' },
      );

      expect(first.supplierRfqNumber).toBe('SRFQ-2026-000001');
      expect(second.supplierRfqNumber).toBe('SRFQ-2026-000002');
      expect(tx.purchaseRequest.updateMany).not.toHaveBeenCalled();
    });

    it('commits as a legitimate additional RFQ when the conditional update race loses but the PR is now converted', async () => {
      tx.purchaseRequest.findUnique
        .mockResolvedValueOnce(storedPurchaseRequest({ status: 'approved' }))
        .mockResolvedValueOnce({ status: 'converted' });
      tx.purchaseRequest.updateMany.mockResolvedValue({ count: 0 });
      tx.supplierRFQ.create.mockResolvedValue(storedSupplierRfq());

      const result = await service.createFromPurchaseRequest(
        purchaseRequestId,
        { supplierCompanyId },
      );

      expect(result.id).toBe(supplierRfqId);
    });

    it('rolls back with a clean 409 when the conditional update race loses and the PR is in an unexpected state', async () => {
      tx.purchaseRequest.findUnique
        .mockResolvedValueOnce(storedPurchaseRequest({ status: 'approved' }))
        .mockResolvedValueOnce({ status: 'cancelled' });
      tx.purchaseRequest.updateMany.mockResolvedValue({ count: 0 });
      tx.supplierRFQ.create.mockResolvedValue(storedSupplierRfq());

      await expect(
        service.createFromPurchaseRequest(purchaseRequestId, {
          supplierCompanyId,
        }),
      ).rejects.toBeInstanceOf(ApiException);
    });

    it('retries on a supplier_rfq_number collision without failing', async () => {
      const collision = {
        code: 'P2002',
        meta: { target: ['supplier_rfq_number'] },
      };
      tx.supplierRFQ.create
        .mockRejectedValueOnce(collision)
        .mockResolvedValueOnce(
          storedSupplierRfq({ supplierRfqNumber: 'SRFQ-2026-000002' }),
        );

      const result = await service.createFromPurchaseRequest(
        purchaseRequestId,
        { supplierCompanyId },
      );

      expect(tx.supplierRFQ.create).toHaveBeenCalledTimes(2);
      expect(result.supplierRfqNumber).toBe('SRFQ-2026-000002');
    });

    it('never surfaces a raw Prisma/Postgres error after exhausting retries', async () => {
      const ambiguous = {
        code: 'P2039',
        meta: { driverAdapterError: { cause: { originalCode: '23505' } } },
      };
      tx.supplierRFQ.create.mockRejectedValue(ambiguous);

      await expect(
        service.createFromPurchaseRequest(purchaseRequestId, {
          supplierCompanyId,
        }),
      ).rejects.toBeInstanceOf(ApiException);
    });
  });

  describe('update', () => {
    it('updates notes/requestedAt/validUntil', async () => {
      prisma.supplierRFQ.findUnique.mockResolvedValue(storedSupplierRfq());
      prisma.supplierRFQ.update.mockResolvedValue(
        storedSupplierRfq({ notes: 'Updated' }),
      );

      const result = await service.update(supplierRfqId, {
        notes: 'Updated',
      });

      expect(result.notes).toBe('Updated');
    });

    it.each([
      ['draft', 'sent'],
      ['draft', 'cancelled'],
      ['sent', 'reviewing'],
      ['sent', 'cancelled'],
      ['reviewing', 'rejected'],
      ['reviewing', 'cancelled'],
      ['quoted', 'reviewing'],
      ['quoted', 'rejected'],
      ['quoted', 'cancelled'],
    ])('allows the valid transition %s -> %s', async (from, to) => {
      prisma.supplierRFQ.findUnique.mockResolvedValue(
        storedSupplierRfq({ status: from }),
      );
      prisma.supplierRFQ.update.mockResolvedValue(
        storedSupplierRfq({ status: to }),
      );

      const result = await service.update(supplierRfqId, {
        status: to as 'sent' | 'reviewing' | 'rejected' | 'cancelled',
      });

      expect(result.status).toBe(to);
    });

    it.each([
      ['draft', 'reviewing'],
      ['sent', 'rejected'],
      ['rejected', 'sent'],
      ['cancelled', 'sent'],
    ])('rejects the invalid transition %s -> %s', async (from, to) => {
      prisma.supplierRFQ.findUnique.mockResolvedValue(
        storedSupplierRfq({ status: from }),
      );

      await expect(
        service.update(supplierRfqId, {
          status: to as 'sent' | 'reviewing' | 'rejected' | 'cancelled',
        }),
      ).rejects.toBeInstanceOf(ApiException);
      expect(prisma.supplierRFQ.update).not.toHaveBeenCalled();
    });

    it('rejects setting status to quoted directly (not part of UpdateSupplierRfqDto)', async () => {
      prisma.supplierRFQ.findUnique.mockResolvedValue(
        storedSupplierRfq({ status: 'reviewing' }),
      );

      await expect(
        service.update(supplierRfqId, { status: 'quoted' as never }),
      ).rejects.toBeInstanceOf(ApiException);
      expect(prisma.supplierRFQ.update).not.toHaveBeenCalled();
    });

    it('throws NOT_FOUND for a missing id', async () => {
      prisma.supplierRFQ.findUnique.mockResolvedValue(null);

      await expect(
        service.update('missing', { notes: 'x' }),
      ).rejects.toBeInstanceOf(ApiException);
    });
  });
});
