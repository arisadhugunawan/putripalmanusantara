import { Injectable } from '@nestjs/common';
import { DEFAULT_LOCALE } from '@ppn/shared-types';
import { ApiException } from '../../common/exceptions/api.exception';
import { PrismaService } from '../../prisma/prisma.service';
import {
  toHomepageProcessSection,
  toProductionStep,
} from './production-step.mapper';
import type {
  CreateProductionStepDto,
  UpdateProductionStepDto,
} from './dto/production-step.dto';
import type { UpdateHomepageProcessSectionDto } from './dto/production-section.dto';

@Injectable()
export class ProductionStepsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Stages ────────────────────────────────────────────────────────────

  /** Admin-facing — unfiltered (includes inactive stages so they can be re-activated). */
  async findAll(locale?: string) {
    const steps = await this.prisma.productionStep.findMany({
      include: { illustration: true },
      orderBy: { order: 'asc' },
    });
    return steps.map((step) =>
      toProductionStep(step, locale ?? DEFAULT_LOCALE),
    );
  }

  async create(dto: CreateProductionStepDto) {
    const count = await this.prisma.productionStep.count();
    const step = await this.prisma.productionStep.create({
      data: {
        label: dto.label,
        title: dto.title,
        description: dto.description,
        icon: dto.icon,
        illustrationId: dto.illustration_id,
        ctaLabel: dto.cta_label,
        ctaHref: dto.cta_href,
        order: dto.order ?? count,
        active: dto.active,
        translations: dto.translations,
      },
      include: { illustration: true },
    });
    return toProductionStep(step);
  }

  async update(id: string, dto: UpdateProductionStepDto) {
    await this.assertExists(id);
    const step = await this.prisma.productionStep.update({
      where: { id },
      data: {
        label: dto.label,
        title: dto.title,
        description: dto.description,
        icon: dto.icon,
        illustrationId: dto.illustration_id,
        ctaLabel: dto.cta_label,
        ctaHref: dto.cta_href,
        order: dto.order,
        active: dto.active,
        translations: dto.translations,
      },
      include: { illustration: true },
    });
    return toProductionStep(step);
  }

  async remove(id: string) {
    await this.assertExists(id);
    await this.prisma.productionStep.delete({ where: { id } });
    return { deleted: true };
  }

  /** Clones every field except id/timestamps — new stage is inactive by default so
   * duplicating for a quick variant never accidentally goes live on the Homepage. */
  async duplicate(id: string) {
    const source = await this.prisma.productionStep.findUnique({
      where: { id },
    });
    if (!source)
      throw new ApiException('NOT_FOUND', 'Process stage not found.', 404);

    const count = await this.prisma.productionStep.count();
    const step = await this.prisma.productionStep.create({
      data: {
        label: source.label,
        title: `${source.title} — Copy`,
        description: source.description,
        icon: source.icon,
        illustrationId: source.illustrationId,
        ctaLabel: source.ctaLabel,
        ctaHref: source.ctaHref,
        order: count,
        active: false,
        translations: source.translations as never,
      },
      include: { illustration: true },
    });
    return toProductionStep(step);
  }

  /** Raw (untranslated) active rows, ordered — used by `HomepageService.buildSnapshotPayload()`
   * to embed into the published snapshot. Mirrors the `active: true` filter every other
   * snapshot-included list applies (e.g. TeamMember/WhatWeDoItem in the About Company module). */
  async findAllActiveRaw() {
    return this.prisma.productionStep.findMany({
      where: { active: true },
      include: { illustration: true },
      orderBy: { order: 'asc' },
    });
  }

  private async assertExists(id: string) {
    const step = await this.prisma.productionStep.findUnique({ where: { id } });
    if (!step)
      throw new ApiException('NOT_FOUND', 'Process stage not found.', 404);
  }

  // ── Section header + closing CTA (singleton) ────────────────────────────

  async getOrCreateSection() {
    const existing = await this.prisma.homepageProcessSection.findFirst();
    if (existing) return existing;
    return this.prisma.homepageProcessSection.create({ data: {} });
  }

  async findSection(locale: string = DEFAULT_LOCALE) {
    const entry = await this.getOrCreateSection();
    return toHomepageProcessSection(entry, locale);
  }

  async updateSection(dto: UpdateHomepageProcessSectionDto) {
    const existing = await this.getOrCreateSection();
    const updated = await this.prisma.homepageProcessSection.update({
      where: { id: existing.id },
      data: {
        eyebrow: dto.eyebrow,
        heading: dto.heading,
        description: dto.description,
        finalHeading: dto.final_heading,
        finalDescription: dto.final_description,
        primaryCtaLabel: dto.primary_cta_label,
        primaryCtaHref: dto.primary_cta_href,
        secondaryCtaLabel: dto.secondary_cta_label,
        secondaryCtaHref: dto.secondary_cta_href,
        translations: dto.translations,
      },
    });
    return toHomepageProcessSection(updated);
  }
}
