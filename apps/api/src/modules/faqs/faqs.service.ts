import { Injectable } from '@nestjs/common';
import { DEFAULT_LOCALE, type Faq } from '@ppn/shared-types';
import { ApiException } from '../../common/exceptions/api.exception';
import { mergeTranslations, translate } from '../../common/utils/i18n.util';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateFaqDto, UpdateFaqDto } from './dto/faq.dto';

@Injectable()
export class FaqsService {
  constructor(private readonly prisma: PrismaService) {}

  async findPublished(locale: string = DEFAULT_LOCALE): Promise<Faq[]> {
    const faqs = await this.prisma.faq.findMany({
      where: { status: 'published' },
      orderBy: { order: 'asc' },
    });
    // Explicit reshape — omits the raw `translations` blob from the public response.
    return faqs.map((faq) => {
      const t = translate(faq, faq.translations, locale, [
        'question',
        'answer',
      ]);
      return {
        id: faq.id,
        question: t.question,
        answer: t.answer,
        order: faq.order,
        status: faq.status,
      };
    });
  }

  findAllForAdmin() {
    return this.prisma.faq.findMany({ orderBy: { order: 'asc' } });
  }

  create(dto: CreateFaqDto) {
    return this.prisma.faq.create({
      data: {
        question: dto.question,
        answer: dto.answer,
        order: dto.order ?? 0,
        status: dto.status ?? 'draft',
        translations: dto.translations,
      },
    });
  }

  async update(id: string, dto: UpdateFaqDto) {
    const existing = await this.assertExists(id);
    return this.prisma.faq.update({
      where: { id },
      data: {
        question: dto.question,
        answer: dto.answer,
        order: dto.order,
        status: dto.status,
        translations: mergeTranslations(
          existing.translations,
          dto.translations,
        ),
      },
    });
  }

  async remove(id: string) {
    await this.assertExists(id);
    await this.prisma.faq.delete({ where: { id } });
    return { deleted: true };
  }

  private async assertExists(id: string) {
    const faq = await this.prisma.faq.findUnique({ where: { id } });
    if (!faq) throw new ApiException('NOT_FOUND', 'FAQ not found.', 404);
    return faq;
  }
}
