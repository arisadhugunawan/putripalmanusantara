import { Injectable } from '@nestjs/common';
import type {
  Media as SharedMedia,
  ProductionStep as SharedStep,
} from '@ppn/shared-types';
import { ApiException } from '../../common/exceptions/api.exception';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  CreateProductionStepDto,
  UpdateProductionStepDto,
} from './dto/production-step.dto';

function toMedia(media: {
  id: string;
  fileUrl: string;
  fileType: string;
  altText: string;
  width: number | null;
  height: number | null;
  uploadedAt: Date;
}): SharedMedia {
  return {
    id: media.id,
    file_url: media.fileUrl,
    file_type: media.fileType as SharedMedia['file_type'],
    alt_text: media.altText,
    width: media.width,
    height: media.height,
    uploaded_at: media.uploadedAt.toISOString(),
  };
}

@Injectable()
export class ProductionStepsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<SharedStep[]> {
    const steps = await this.prisma.productionStep.findMany({
      include: { illustration: true },
      orderBy: { order: 'asc' },
    });
    return steps.map((step) => ({
      id: step.id,
      title: step.title,
      description: step.description,
      illustration: step.illustration ? toMedia(step.illustration) : null,
      order: step.order,
    }));
  }

  async create(dto: CreateProductionStepDto) {
    return this.prisma.productionStep.create({
      data: {
        title: dto.title,
        description: dto.description,
        illustrationId: dto.illustration_id,
        order: dto.order ?? 0,
      },
    });
  }

  async update(id: string, dto: UpdateProductionStepDto) {
    await this.assertExists(id);
    return this.prisma.productionStep.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        illustrationId: dto.illustration_id,
        order: dto.order,
      },
    });
  }

  async remove(id: string) {
    await this.assertExists(id);
    await this.prisma.productionStep.delete({ where: { id } });
    return { deleted: true };
  }

  private async assertExists(id: string) {
    const step = await this.prisma.productionStep.findUnique({ where: { id } });
    if (!step)
      throw new ApiException('NOT_FOUND', 'Production step not found.', 404);
  }
}
