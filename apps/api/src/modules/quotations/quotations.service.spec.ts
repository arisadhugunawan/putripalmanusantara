import { Test } from '@nestjs/testing';
import {
  ApiException,
  SpamValidationException,
} from '../../common/exceptions/api.exception';
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

  // FR-QUOTE-03 / docs/05-api.md §6 — a filled honeypot field must reject the submission
  // before it ever touches the database or sends an email.
  it('rejects submissions with a filled honeypot field', async () => {
    await expect(
      service.createQuotationRequest({
        ...baseDto,
        website: 'https://spammer.example',
      }),
    ).rejects.toBeInstanceOf(SpamValidationException);

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
