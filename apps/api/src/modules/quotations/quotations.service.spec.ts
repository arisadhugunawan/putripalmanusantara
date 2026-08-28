import { Test } from '@nestjs/testing';
import { ApiException } from '../../common/exceptions/api.exception';
import { EmailService } from '../../email/email.service';
import { PrismaService } from '../../prisma/prisma.service';
import { QuotationsService } from './quotations.service';
import type { CreateQuotationRequestDto } from './dto/quotation.dto';

describe('QuotationsService', () => {
  let service: QuotationsService;
  let prisma: {
    quotationRequest: { create: jest.Mock };
    product: { findUnique: jest.Mock };
  };
  let email: { sendAdminNotification: jest.Mock };

  const baseDto: CreateQuotationRequestDto = {
    name: 'Jane Buyer',
    company: 'Acme Import Co',
    country: 'United States',
    email: 'jane@acme-import.example',
    message: 'Interested in a quotation for coconut shell charcoal.',
    source_page: 'products/coconut-shell-charcoal',
  };

  beforeEach(async () => {
    prisma = {
      quotationRequest: { create: jest.fn() },
      product: { findUnique: jest.fn() },
    };
    email = { sendAdminNotification: jest.fn().mockResolvedValue(undefined) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        QuotationsService,
        { provide: PrismaService, useValue: prisma },
        { provide: EmailService, useValue: email },
      ],
    }).compile();

    service = moduleRef.get(QuotationsService);
  });

  // FR-QUOTE-03 / docs/05-api.md §6 — a filled honeypot field must never touch the database
  // or send an email, but the caller gets back a response shaped exactly like a real success
  // (same fields, same implied 201) so an automated submitter can't fingerprint the trap by a
  // different status/error code.
  it('returns a success-shaped result for a filled honeypot field without persisting anything', async () => {
    const result = await service.createQuotationRequest({
      ...baseDto,
      website: 'https://spammer.example',
    });

    expect(typeof result.id).toBe('string');
    expect(result.id.length).toBeGreaterThan(0);
    expect(result.status).toBe('new');
    expect(prisma.quotationRequest.create).not.toHaveBeenCalled();
    expect(email.sendAdminNotification).not.toHaveBeenCalled();
  });

  it('rejects a product_id that does not exist', async () => {
    prisma.product.findUnique.mockResolvedValue(null);

    await expect(
      service.createQuotationRequest({
        ...baseDto,
        product_id: 'nonexistent-id',
      }),
    ).rejects.toBeInstanceOf(ApiException);

    expect(prisma.quotationRequest.create).not.toHaveBeenCalled();
  });

  // P2-2/A — a quotation submitted with a valid product_id must store both the live FK and a
  // denormalized copy of the product's name, so the quotation's product identity survives even
  // after the Product row is later deleted (productId → SET NULL on delete).
  it('stores productId and a productNameSnapshot when a valid product_id is submitted', async () => {
    prisma.product.findUnique.mockResolvedValue({
      id: 'product-1',
      name: 'Coconut Shell Charcoal',
    });
    prisma.quotationRequest.create.mockResolvedValue({
      id: 'quotation-1',
      status: 'new',
    });

    await service.createQuotationRequest({
      ...baseDto,
      product_id: 'product-1',
    });

    expect(prisma.quotationRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- expect.objectContaining() is untyped by Jest's own types.
        data: expect.objectContaining({
          productId: 'product-1',
          productNameSnapshot: 'Coconut Shell Charcoal',
        }),
      }),
    );
  });

  // P2-2/B — a quotation submitted without a product_id must never fabricate a snapshot.
  it('leaves productId and productNameSnapshot undefined when no product_id is submitted', async () => {
    prisma.quotationRequest.create.mockResolvedValue({
      id: 'quotation-1',
      status: 'new',
    });

    await service.createQuotationRequest(baseDto);

    expect(prisma.product.findUnique).not.toHaveBeenCalled();
    const [call] = prisma.quotationRequest.create.mock.calls[0] as [
      { data: { productId: unknown; productNameSnapshot: unknown } },
    ];
    expect(call.data.productId).toBeUndefined();
    expect(call.data.productNameSnapshot).toBeUndefined();
  });

  // FR-QUOTE-04 — a legitimate submission must be persisted and trigger an admin notification.
  it('persists a valid submission and notifies the admin', async () => {
    prisma.quotationRequest.create.mockResolvedValue({
      id: 'quotation-1',
      status: 'new',
    });

    const result = await service.createQuotationRequest(baseDto);

    expect(prisma.quotationRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- expect.objectContaining() is untyped by Jest's own types.
        data: expect.objectContaining({
          type: 'quotation',
          name: baseDto.name,
          company: baseDto.company,
          email: baseDto.email,
        }),
      }),
    );
    expect(email.sendAdminNotification).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ id: 'quotation-1', status: 'new' });
  });

  // Regression guard for the HTML-injection fix in buildNotificationHtml — a malicious
  // field value must not be able to inject tags into the admin notification email.
  it('escapes HTML special characters before embedding them in the notification email', async () => {
    prisma.quotationRequest.create.mockResolvedValue({
      id: 'quotation-2',
      status: 'new',
    });

    await service.createQuotationRequest({
      ...baseDto,
      company: '<script>alert(1)</script>',
    });

    const [, html] = email.sendAdminNotification.mock.calls[0] as [
      string,
      string,
    ];
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});
