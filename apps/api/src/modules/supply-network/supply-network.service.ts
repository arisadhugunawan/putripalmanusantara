import { Injectable } from '@nestjs/common';
import { DEFAULT_LOCALE } from '@ppn/shared-types';
import {
  AiTranslationService,
  buildGenerateTranslationsResponse,
  computeTranslationStatus,
} from '../ai/ai-translation.service';
import { ApiException } from '../../common/exceptions/api.exception';
import { mergeTranslations } from '../../common/utils/i18n.util';
import { PrismaService } from '../../prisma/prisma.service';
import {
  toHomepageSupplyNetworkSection,
  toSupplyNetworkConnection,
  toSupplyNetworkCountry,
  toSupplyNetworkItem,
} from './supply-network.mapper';
import type {
  CreateSupplyNetworkConnectionDto,
  UpdateSupplyNetworkConnectionDto,
} from './dto/supply-network-connection.dto';
import type {
  CreateSupplyNetworkCountryDto,
  UpdateSupplyNetworkCountryDto,
} from './dto/supply-network-country.dto';
import type {
  CreateSupplyNetworkItemDto,
  UpdateSupplyNetworkItemDto,
} from './dto/supply-network-item.dto';
import type { UpdateHomepageSupplyNetworkSectionDto } from './dto/supply-network-section.dto';

const ITEM_TRANSLATABLE_FIELDS = [
  'label',
  'title',
  'shortTitle',
  'description',
] as const;
const COUNTRY_TRANSLATABLE_FIELDS = ['name', 'status'] as const;
const SECTION_TRANSLATABLE_FIELDS = [
  'eyebrow',
  'heading',
  'description',
  'centerLabel',
  'centerTitle',
  'centerDescription',
  'finalHeading',
  'finalDescription',
  'primaryCtaLabel',
  'secondaryCtaLabel',
] as const;

@Injectable()
export class SupplyNetworkService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly translationService: AiTranslationService,
  ) {}

  // ── Items ─────────────────────────────────────────────────────────────

  /** Admin-facing — unfiltered (includes inactive items so they can be re-activated). */
  async findAll(locale?: string) {
    const items = await this.prisma.supplyNetworkItem.findMany({
      include: { illustration: true },
      orderBy: { order: 'asc' },
    });
    return items.map((item) =>
      toSupplyNetworkItem(item, locale ?? DEFAULT_LOCALE),
    );
  }

  async create(dto: CreateSupplyNetworkItemDto) {
    const count = await this.prisma.supplyNetworkItem.count();
    const item = await this.prisma.supplyNetworkItem.create({
      data: {
        label: dto.label,
        title: dto.title,
        shortTitle: dto.short_title,
        description: dto.description,
        icon: dto.icon,
        illustrationId: dto.illustration_id,
        ctaLabel: dto.cta_label,
        ctaHref: dto.cta_href,
        position: dto.position,
        order: dto.order ?? count,
        active: dto.active,
        translations: dto.translations,
      },
      include: { illustration: true },
    });
    return toSupplyNetworkItem(item);
  }

  async update(id: string, dto: UpdateSupplyNetworkItemDto) {
    const existing = await this.assertExists(id);
    const item = await this.prisma.supplyNetworkItem.update({
      where: { id },
      data: {
        label: dto.label,
        title: dto.title,
        shortTitle: dto.short_title,
        description: dto.description,
        icon: dto.icon,
        illustrationId: dto.illustration_id,
        ctaLabel: dto.cta_label,
        ctaHref: dto.cta_href,
        position: dto.position,
        order: dto.order,
        active: dto.active,
        translations: mergeTranslations(
          existing.translations,
          dto.translations,
        ),
      },
      include: { illustration: true },
    });
    return toSupplyNetworkItem(item);
  }

  async getTranslationStatus(id: string) {
    const item = await this.assertExists(id);
    const sourceFields: Record<string, string | null> = {};
    for (const field of ITEM_TRANSLATABLE_FIELDS)
      sourceFields[field] = item[field];
    return computeTranslationStatus(sourceFields, item.translations);
  }

  async generateTranslations(id: string) {
    const item = await this.assertExists(id);
    const sourceFields: Record<string, string> = {};
    for (const field of ITEM_TRANSLATABLE_FIELDS) {
      const value = item[field];
      if (typeof value === 'string' && value.trim())
        sourceFields[field] = value;
    }
    const { available, translatedLocales, generated, mergedTranslations } =
      await this.translationService.generateAndMerge(
        sourceFields,
        item.translations,
      );
    if (mergedTranslations !== undefined) {
      await this.prisma.supplyNetworkItem.update({
        where: { id },
        data: { translations: mergedTranslations },
      });
    }
    return buildGenerateTranslationsResponse(
      available,
      translatedLocales,
      generated,
    );
  }

  async remove(id: string) {
    await this.assertExists(id);
    // Connections referencing this node are removed too (schema `onDelete: Cascade`), so a
    // deleted node never leaves a dangling connection behind for the visual to choke on.
    await this.prisma.supplyNetworkItem.delete({ where: { id } });
    return { deleted: true };
  }

  /** Clones every field except id/timestamps — new item is inactive by default so
   * duplicating for a quick variant never accidentally goes live on the Homepage. */
  async duplicate(id: string) {
    const source = await this.prisma.supplyNetworkItem.findUnique({
      where: { id },
    });
    if (!source)
      throw new ApiException(
        'NOT_FOUND',
        'Supply network item not found.',
        404,
      );

    const count = await this.prisma.supplyNetworkItem.count();
    const item = await this.prisma.supplyNetworkItem.create({
      data: {
        label: source.label,
        title: `${source.title} — Copy`,
        shortTitle: source.shortTitle,
        description: source.description,
        icon: source.icon,
        illustrationId: source.illustrationId,
        ctaLabel: source.ctaLabel,
        ctaHref: source.ctaHref,
        position: source.position,
        order: count,
        active: false,
        translations: source.translations as never,
      },
      include: { illustration: true },
    });
    return toSupplyNetworkItem(item);
  }

  /** Raw (untranslated) active rows, ordered — used by `HomepageService.buildSnapshotPayload()`
   * to embed into the published snapshot. Mirrors the `active: true` filter every other
   * snapshot-included list applies. */
  async findAllActiveRaw() {
    return this.prisma.supplyNetworkItem.findMany({
      where: { active: true },
      include: { illustration: true },
      orderBy: { order: 'asc' },
    });
  }

  private async assertExists(id: string) {
    const item = await this.prisma.supplyNetworkItem.findUnique({
      where: { id },
    });
    if (!item)
      throw new ApiException(
        'NOT_FOUND',
        'Supply network item not found.',
        404,
      );
    return item;
  }

  // ── Connections ("From Node → To Node") ─────────────────────────────────

  async findAllConnections() {
    const connections = await this.prisma.supplyNetworkConnection.findMany({
      orderBy: { order: 'asc' },
    });
    return connections.map(toSupplyNetworkConnection);
  }

  async createConnection(dto: CreateSupplyNetworkConnectionDto) {
    await this.assertExists(dto.from_node_id);
    await this.assertExists(dto.to_node_id);
    const count = await this.prisma.supplyNetworkConnection.count();
    const connection = await this.prisma.supplyNetworkConnection.create({
      data: {
        fromNodeId: dto.from_node_id,
        toNodeId: dto.to_node_id,
        order: dto.order ?? count,
      },
    });
    return toSupplyNetworkConnection(connection);
  }

  async updateConnection(id: string, dto: UpdateSupplyNetworkConnectionDto) {
    const existing = await this.prisma.supplyNetworkConnection.findUnique({
      where: { id },
    });
    if (!existing)
      throw new ApiException('NOT_FOUND', 'Connection not found.', 404);
    const connection = await this.prisma.supplyNetworkConnection.update({
      where: { id },
      data: { order: dto.order },
    });
    return toSupplyNetworkConnection(connection);
  }

  async removeConnection(id: string) {
    const existing = await this.prisma.supplyNetworkConnection.findUnique({
      where: { id },
    });
    if (!existing)
      throw new ApiException('NOT_FOUND', 'Connection not found.', 404);
    await this.prisma.supplyNetworkConnection.delete({ where: { id } });
    return { deleted: true };
  }

  /** Raw rows for the published snapshot — connections have no `active` flag of their own
   * (deleting a node cascades away its connections instead), so this is unfiltered. */
  async findAllConnectionsRaw() {
    return this.prisma.supplyNetworkConnection.findMany({
      orderBy: { order: 'asc' },
    });
  }

  // ── Countries (background "global trade" markers) ───────────────────────

  async findAllCountries(locale?: string) {
    const countries = await this.prisma.supplyNetworkCountry.findMany({
      orderBy: { order: 'asc' },
    });
    return countries.map((country) =>
      toSupplyNetworkCountry(country, locale ?? DEFAULT_LOCALE),
    );
  }

  async createCountry(dto: CreateSupplyNetworkCountryDto) {
    const count = await this.prisma.supplyNetworkCountry.count();
    const country = await this.prisma.supplyNetworkCountry.create({
      data: {
        name: dto.name,
        flagEmoji: dto.flag_emoji,
        status: dto.status,
        order: dto.order ?? count,
        active: dto.active,
        translations: dto.translations,
      },
    });
    return toSupplyNetworkCountry(country);
  }

  async updateCountry(id: string, dto: UpdateSupplyNetworkCountryDto) {
    const existing = await this.assertCountryExists(id);
    const country = await this.prisma.supplyNetworkCountry.update({
      where: { id },
      data: {
        name: dto.name,
        flagEmoji: dto.flag_emoji,
        status: dto.status,
        order: dto.order,
        active: dto.active,
        translations: mergeTranslations(
          existing.translations,
          dto.translations,
        ),
      },
    });
    return toSupplyNetworkCountry(country);
  }

  async getCountryTranslationStatus(id: string) {
    const country = await this.assertCountryExists(id);
    const sourceFields: Record<string, string | null> = {};
    for (const field of COUNTRY_TRANSLATABLE_FIELDS)
      sourceFields[field] = country[field];
    return computeTranslationStatus(sourceFields, country.translations);
  }

  async generateCountryTranslations(id: string) {
    const country = await this.assertCountryExists(id);
    const sourceFields: Record<string, string> = {};
    for (const field of COUNTRY_TRANSLATABLE_FIELDS) {
      const value = country[field];
      if (typeof value === 'string' && value.trim())
        sourceFields[field] = value;
    }
    const { available, translatedLocales, generated, mergedTranslations } =
      await this.translationService.generateAndMerge(
        sourceFields,
        country.translations,
      );
    if (mergedTranslations !== undefined) {
      await this.prisma.supplyNetworkCountry.update({
        where: { id },
        data: { translations: mergedTranslations },
      });
    }
    return buildGenerateTranslationsResponse(
      available,
      translatedLocales,
      generated,
    );
  }

  async removeCountry(id: string) {
    await this.assertCountryExists(id);
    await this.prisma.supplyNetworkCountry.delete({ where: { id } });
    return { deleted: true };
  }

  async findAllCountriesActiveRaw() {
    return this.prisma.supplyNetworkCountry.findMany({
      where: { active: true },
      orderBy: { order: 'asc' },
    });
  }

  private async assertCountryExists(id: string) {
    const country = await this.prisma.supplyNetworkCountry.findUnique({
      where: { id },
    });
    if (!country)
      throw new ApiException('NOT_FOUND', 'Country not found.', 404);
    return country;
  }

  // ── Section header + center node copy + closing CTA (singleton) ─────────

  // P1-6 — `upsert()` on the `singleton` marker (always `true`, `@unique`) closes the
  // findFirst()-then-create() TOCTOU race: two concurrent calls now resolve to the SAME
  // database-enforced row instead of racing to create two.
  async getOrCreateSection() {
    return this.prisma.homepageSupplyNetworkSection.upsert({
      where: { singleton: true },
      create: { singleton: true },
      update: {},
    });
  }

  async findSection(locale: string = DEFAULT_LOCALE) {
    const entry = await this.getOrCreateSection();
    return toHomepageSupplyNetworkSection(entry, locale);
  }

  async updateSection(dto: UpdateHomepageSupplyNetworkSectionDto) {
    const existing = await this.getOrCreateSection();
    const updated = await this.prisma.homepageSupplyNetworkSection.update({
      where: { id: existing.id },
      data: {
        eyebrow: dto.eyebrow,
        heading: dto.heading,
        description: dto.description,
        centerLabel: dto.center_label,
        centerTitle: dto.center_title,
        centerDescription: dto.center_description,
        finalHeading: dto.final_heading,
        finalDescription: dto.final_description,
        primaryCtaLabel: dto.primary_cta_label,
        primaryCtaHref: dto.primary_cta_href,
        secondaryCtaLabel: dto.secondary_cta_label,
        secondaryCtaHref: dto.secondary_cta_href,
        enableAnimation: dto.enable_animation,
        autoRotate: dto.auto_rotate,
        particleFlow: dto.particle_flow,
        hoverEffect: dto.hover_effect,
        effect3d: dto.effect_3d,
        translations: mergeTranslations(
          existing.translations,
          dto.translations,
        ),
      },
    });
    return toHomepageSupplyNetworkSection(updated);
  }

  async getSectionTranslationStatus() {
    const entry = await this.getOrCreateSection();
    const sourceFields: Record<string, string | null> = {};
    for (const field of SECTION_TRANSLATABLE_FIELDS)
      sourceFields[field] = entry[field];
    return computeTranslationStatus(sourceFields, entry.translations);
  }

  async generateSectionTranslations() {
    const entry = await this.getOrCreateSection();
    const sourceFields: Record<string, string> = {};
    for (const field of SECTION_TRANSLATABLE_FIELDS) {
      const value = entry[field];
      if (typeof value === 'string' && value.trim())
        sourceFields[field] = value;
    }
    const { available, translatedLocales, generated, mergedTranslations } =
      await this.translationService.generateAndMerge(
        sourceFields,
        entry.translations,
      );
    if (mergedTranslations !== undefined) {
      await this.prisma.homepageSupplyNetworkSection.update({
        where: { id: entry.id },
        data: { translations: mergedTranslations },
      });
    }
    return buildGenerateTranslationsResponse(
      available,
      translatedLocales,
      generated,
    );
  }
}
