import { Injectable } from '@nestjs/common';
import {
  buildPaginationMeta,
  parseSort,
} from '../../common/dto/pagination-query.dto';
import {
  ApiException,
  SpamValidationException,
} from '../../common/exceptions/api.exception';
import { EmailService } from '../../email/email.service';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  CreateContactDto,
  CreateQuotationRequestDto,
  QuotationQueryDto,
  UpdateQuotationStatusDto,
} from './dto/quotation.dto';
import { toQuotationRequest } from './quotation.mapper';

const SORT_FIELD_MAP: Record<string, string> = {
  created_at: 'createdAt',
  status: 'status',
};

/** docs/05-api.md §6 — honeypot must stay empty; a filled value flags the request as spam. */
function assertNotSpam(website: string | undefined) {
  if (website && website.trim().length > 0) {
    throw new SpamValidationException();
  }
}

@Injectable()
export class QuotationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

  async createQuotationRequest(dto: CreateQuotationRequestDto) {
    assertNotSpam(dto.website);

    if (dto.product_id) {
      const product = await this.prisma.product.findUnique({
        where: { id: dto.product_id },
      });
      if (!product) {
        throw new ApiException(
          'VALIDATION_ERROR',
          'The selected product does not exist.',
          400,
          {
            fields: ['product_id'],
          },
        );
      }
    }

    const entry = await this.prisma.quotationRequest.create({
      data: {
        type: 'quotation',
        name: dto.name,
        company: dto.company,
        country: dto.country,
        email: dto.email,
        phone: dto.phone,
        productId: dto.product_id,
        estimatedQuantity: dto.estimated_quantity,
        message: dto.message,
        sourcePage: dto.source_page,
      },
    });

    await this.email.sendAdminNotification(
      `New Quotation Request from ${dto.company}`,
      this.buildNotificationHtml(dto),
    );

    return { id: entry.id, status: entry.status };
  }

  async createContact(dto: CreateContactDto) {
    assertNotSpam(dto.website);

    const entry = await this.prisma.quotationRequest.create({
      data: {
        type: 'general_contact',
        name: dto.name,
        company: dto.company,
        country: dto.country,
        email: dto.email,
        message: dto.message,
        sourcePage: dto.source_page ?? 'contact',
      },
    });

    await this.email.sendAdminNotification(
      `New Contact Message from ${dto.company}`,
      this.buildNotificationHtml(dto),
    );

    return { id: entry.id, status: entry.status };
  }

  async findAllForAdmin(query: QuotationQueryDto) {
    const { field, direction } = parseSort(query.sort);
    const orderField = SORT_FIELD_MAP[field] ?? 'createdAt';

    const where = query.status ? { status: query.status } : {};
    const [items, total] = await Promise.all([
      this.prisma.quotationRequest.findMany({
        where,
        include: { product: true },
        orderBy: { [orderField]: direction },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.quotationRequest.count({ where }),
    ]);

    return {
      items: items.map(toQuotationRequest),
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  async findOneForAdmin(id: string) {
    const entry = await this.prisma.quotationRequest.findUnique({
      where: { id },
      include: { product: true },
    });
    if (!entry)
      throw new ApiException('NOT_FOUND', 'Submission not found.', 404);
    return toQuotationRequest(entry);
  }

  async updateStatus(id: string, dto: UpdateQuotationStatusDto) {
    const exists = await this.prisma.quotationRequest.findUnique({
      where: { id },
    });
    if (!exists)
      throw new ApiException('NOT_FOUND', 'Submission not found.', 404);

    const entry = await this.prisma.quotationRequest.update({
      where: { id },
      data: { status: dto.status },
      include: { product: true },
    });
    return toQuotationRequest(entry);
  }

  private buildNotificationHtml(dto: {
    name: string;
    company: string;
    country: string;
    email: string;
    message: string;
  }): string {
    // User-supplied values must be escaped — this HTML is rendered directly in the
    // admin's email client, so an unescaped field would be an HTML/script injection vector.
    const esc = (value: string) =>
      value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    return `
      <p><strong>Name:</strong> ${esc(dto.name)}</p>
      <p><strong>Company:</strong> ${esc(dto.company)}</p>
      <p><strong>Country:</strong> ${esc(dto.country)}</p>
      <p><strong>Email:</strong> ${esc(dto.email)}</p>
      <p><strong>Message:</strong></p>
      <p>${esc(dto.message)}</p>
    `;
  }
}
