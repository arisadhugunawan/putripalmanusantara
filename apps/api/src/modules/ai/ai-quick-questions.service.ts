import { Injectable } from '@nestjs/common';
import type { AiQuickQuestion } from '@ppn/shared-types';
import { ApiException } from '../../common/exceptions/api.exception';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  CreateAiQuickQuestionDto,
  UpdateAiQuickQuestionDto,
} from './dto/ai-quick-question.dto';
import type { AiQuickQuestionModel } from '../../../generated/prisma/models';

function toShared(entry: AiQuickQuestionModel): AiQuickQuestion {
  return {
    id: entry.id,
    label: entry.label,
    question: entry.question,
    language: entry.language,
    active: entry.active,
    order: entry.order,
    updated_at: entry.updatedAt.toISOString(),
  };
}

@Injectable()
export class AiQuickQuestionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllForAdmin(): Promise<AiQuickQuestion[]> {
    const rows = await this.prisma.aiQuickQuestion.findMany({
      orderBy: [{ language: 'asc' }, { order: 'asc' }],
    });
    return rows.map(toShared);
  }

  async findPublic(language: string): Promise<AiQuickQuestion[]> {
    const rows = await this.prisma.aiQuickQuestion.findMany({
      where: { language, active: true },
      orderBy: { order: 'asc' },
    });
    return rows.map(toShared);
  }

  async create(dto: CreateAiQuickQuestionDto) {
    const maxOrder = await this.prisma.aiQuickQuestion.aggregate({
      where: { language: dto.language },
      _max: { order: true },
    });
    const created = await this.prisma.aiQuickQuestion.create({
      data: { ...dto, order: (maxOrder._max.order ?? 0) + 1 },
    });
    return toShared(created);
  }

  async update(id: string, dto: UpdateAiQuickQuestionDto) {
    await this.assertExists(id);
    const updated = await this.prisma.aiQuickQuestion.update({
      where: { id },
      data: dto,
    });
    return toShared(updated);
  }

  async remove(id: string) {
    await this.assertExists(id);
    await this.prisma.aiQuickQuestion.delete({ where: { id } });
    return { deleted: true };
  }

  async reorder(orderedIds: string[]) {
    // P0.4-D2 — a stale/deleted id (e.g. picked in one tab while removed in another) previously
    // fell straight through to Prisma and threw an unhandled P2025, surfacing as a raw 500
    // instead of a clean 404. Batches one existence check for every id rather than validating
    // inside the loop below, mirroring `assertExists()`'s single-purpose style.
    const existing = await this.prisma.aiQuickQuestion.findMany({
      where: { id: { in: orderedIds } },
      select: { id: true },
    });
    if (existing.length !== new Set(orderedIds).size) {
      const foundIds = new Set(existing.map((q) => q.id));
      const missing = orderedIds.filter((id) => !foundIds.has(id));
      throw new ApiException(
        'NOT_FOUND',
        `Quick question(s) not found: ${missing.join(', ')}`,
        404,
      );
    }

    await this.prisma.$transaction(
      orderedIds.map((id, index) =>
        this.prisma.aiQuickQuestion.update({
          where: { id },
          data: { order: index },
        }),
      ),
    );
    return this.findAllForAdmin();
  }

  private async assertExists(id: string) {
    const existing = await this.prisma.aiQuickQuestion.findUnique({
      where: { id },
    });
    if (!existing)
      throw new ApiException('NOT_FOUND', 'Quick question not found.', 404);
  }
}
