import { Injectable } from '@nestjs/common';
import { ApiException } from '../../common/exceptions/api.exception';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateFaqDto, UpdateFaqDto } from './dto/faq.dto';

@Injectable()
export class FaqsService {
  constructor(private readonly prisma: PrismaService) {}

  findPublished() {
    return this.prisma.faq.findMany({
      where: { status: 'published' },
      orderBy: { order: 'asc' },
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
      },
    });
  }

  async update(id: string, dto: UpdateFaqDto) {
    await this.assertExists(id);
    return this.prisma.faq.update({
      where: { id },
      data: {
        question: dto.question,
        answer: dto.answer,
        order: dto.order,
        status: dto.status,
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
  }
}
