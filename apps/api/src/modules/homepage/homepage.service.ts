import { Injectable } from '@nestjs/common';
import { DEFAULT_LOCALE, type HomepageStatistic } from '@ppn/shared-types';
import { ApiException } from '../../common/exceptions/api.exception';
import { translate } from '../../common/utils/i18n.util';
import { PrismaService } from '../../prisma/prisma.service';
import type { UpdateAboutPreviewDto } from './dto/about-preview.dto';
import type {
  CreateDecorativeGraphicDto,
  UpdateDecorativeGraphicDto,
} from './dto/decorative-graphic.dto';
import type {
  CreateHeroSlideDto,
  UpdateHeroSlideDto,
} from './dto/hero-slide.dto';
import type {
  CreateHighlightDto,
  UpdateHighlightDto,
} from './dto/highlight.dto';
import type { ReplaceHomepageStatisticsDto } from './dto/homepage-statistic.dto';
import type {
  CreatePartnerLogoDto,
  UpdatePartnerLogoDto,
} from './dto/partner-logo.dto';
import type { UpdatePartnersSectionDto } from './dto/partners-section.dto';
import type {
  CreateWhyChooseUsDto,
  UpdateWhyChooseUsDto,
} from './dto/why-choose-us.dto';
import { toAboutPreview } from './about-preview.mapper';
import { toDecorativeGraphic } from './decorative-graphic.mapper';
import { toHeroSlide } from './hero-slide.mapper';
import { toHighlight } from './highlight.mapper';
import { toPartnerLogo } from './partner-logo.mapper';
import { toPartnersSection } from './partners-section.mapper';
import { toWhyChooseUs } from './why-choose-us.mapper';

const HERO_SLIDE_INCLUDE = { desktopImage: true, mobileImage: true } as const;
const PARTNER_LOGO_INCLUDE = { logo: true } as const;
const ABOUT_PREVIEW_INCLUDE = {
  videoMedia: true,
  videoThumbnail: true,
} as const;

@Injectable()
export class HomepageService {
  constructor(private readonly prisma: PrismaService) {}

  async findStatistics(
    locale: string = DEFAULT_LOCALE,
  ): Promise<HomepageStatistic[]> {
    const stats = await this.prisma.homepageStatistic.findMany({
      orderBy: { order: 'asc' },
    });
    // Explicit reshape (not a raw pass-through) — omits the raw `translations` blob from
    // the public response, matching the Product/Article/Facility mapper pattern.
    return stats.map((stat) => {
      const t = translate(stat, stat.translations, locale, ['label', 'value']);
      return {
        id: stat.id,
        label: t.label,
        value: t.value,
        icon: stat.icon,
        order: stat.order,
      };
    });
  }

  async replaceStatistics(dto: ReplaceHomepageStatisticsDto) {
    await this.prisma.$transaction([
      this.prisma.homepageStatistic.deleteMany({}),
      this.prisma.homepageStatistic.createMany({
        data: dto.statistics.map((stat, index) => ({
          label: stat.label,
          value: stat.value,
          icon: stat.icon,
          order: stat.order ?? index,
          translations: stat.translations,
        })),
      }),
    ]);
    return this.findStatistics();
  }

  // ── Hero Slides (Post-Launch) ──────────────────────────────────────────

  async findHeroSlides(locale?: string, publicOnly = false) {
    const slides = await this.prisma.heroSlide.findMany({
      where: publicOnly
        ? {
            enabled: true,
            OR: [{ publishDate: null }, { publishDate: { lte: new Date() } }],
          }
        : undefined,
      include: HERO_SLIDE_INCLUDE,
      orderBy: { order: 'asc' },
    });
    return slides.map((slide) => toHeroSlide(slide, locale));
  }

  async findHeroSlide(id: string) {
    const slide = await this.prisma.heroSlide.findUnique({
      where: { id },
      include: HERO_SLIDE_INCLUDE,
    });
    if (!slide)
      throw new ApiException('NOT_FOUND', 'Hero slide not found.', 404);
    return toHeroSlide(slide);
  }

  async createHeroSlide(dto: CreateHeroSlideDto) {
    const slide = await this.prisma.heroSlide.create({
      data: {
        desktopImageId: dto.desktop_image_id,
        mobileImageId: dto.mobile_image_id,
        heading: dto.heading,
        subheading: dto.subheading,
        button1Text: dto.button_1_text,
        button1Link: dto.button_1_link,
        button2Text: dto.button_2_text,
        button2Link: dto.button_2_link,
        order: dto.order ?? 0,
        enabled: dto.enabled ?? true,
        publishDate: dto.publish_date,
        translations: dto.translations,
      },
      include: HERO_SLIDE_INCLUDE,
    });
    return toHeroSlide(slide);
  }

  async updateHeroSlide(id: string, dto: UpdateHeroSlideDto) {
    await this.assertHeroSlideExists(id);
    const slide = await this.prisma.heroSlide.update({
      where: { id },
      data: {
        desktopImageId: dto.desktop_image_id,
        mobileImageId: dto.mobile_image_id,
        heading: dto.heading,
        subheading: dto.subheading,
        button1Text: dto.button_1_text,
        button1Link: dto.button_1_link,
        button2Text: dto.button_2_text,
        button2Link: dto.button_2_link,
        order: dto.order,
        enabled: dto.enabled,
        publishDate: dto.publish_date,
        translations: dto.translations,
      },
      include: HERO_SLIDE_INCLUDE,
    });
    return toHeroSlide(slide);
  }

  async removeHeroSlide(id: string) {
    await this.assertHeroSlideExists(id);
    await this.prisma.heroSlide.delete({ where: { id } });
    return { deleted: true };
  }

  private async assertHeroSlideExists(id: string) {
    const slide = await this.prisma.heroSlide.findUnique({ where: { id } });
    if (!slide)
      throw new ApiException('NOT_FOUND', 'Hero slide not found.', 404);
  }

  // ── Partner Logos (Post-Launch) ────────────────────────────────────────

  async findPartnerLogos(locale?: string, publicOnly = false) {
    const logos = await this.prisma.partnerLogo.findMany({
      // "Featured" is a second, independent gate on top of "Active" — see the brief this
      // shipped with: a logo can be Active (kept, editable) without being Featured
      // (promoted to the Homepage carousel).
      where: publicOnly ? { enabled: true, featured: true } : undefined,
      include: PARTNER_LOGO_INCLUDE,
      orderBy: { order: 'asc' },
    });
    return logos.map((logo) => toPartnerLogo(logo, locale));
  }

  async createPartnerLogo(dto: CreatePartnerLogoDto) {
    const logo = await this.prisma.partnerLogo.create({
      data: {
        logoId: dto.logo_id,
        partnerName: dto.partner_name,
        description: dto.description,
        websiteUrl: dto.website_url,
        openInNewTab: dto.open_in_new_tab ?? true,
        altText: dto.alt_text,
        category: dto.category ?? 'Other',
        order: dto.order ?? 0,
        enabled: dto.enabled ?? true,
        featured: dto.featured ?? true,
        translations: dto.translations,
      },
      include: PARTNER_LOGO_INCLUDE,
    });
    return toPartnerLogo(logo);
  }

  async updatePartnerLogo(id: string, dto: UpdatePartnerLogoDto) {
    await this.assertPartnerLogoExists(id);
    const logo = await this.prisma.partnerLogo.update({
      where: { id },
      data: {
        logoId: dto.logo_id,
        partnerName: dto.partner_name,
        description: dto.description,
        websiteUrl: dto.website_url,
        openInNewTab: dto.open_in_new_tab,
        altText: dto.alt_text,
        category: dto.category,
        order: dto.order,
        enabled: dto.enabled,
        featured: dto.featured,
        translations: dto.translations,
      },
      include: PARTNER_LOGO_INCLUDE,
    });
    return toPartnerLogo(logo);
  }

  async removePartnerLogo(id: string) {
    await this.assertPartnerLogoExists(id);
    await this.prisma.partnerLogo.delete({ where: { id } });
    return { deleted: true };
  }

  private async assertPartnerLogoExists(id: string) {
    const logo = await this.prisma.partnerLogo.findUnique({ where: { id } });
    if (!logo)
      throw new ApiException('NOT_FOUND', 'Partner logo not found.', 404);
  }

  // ── Decorative Graphics (Post-Launch) ──────────────────────────────────

  async findDecorativeGraphics(page?: string, publicOnly = false) {
    const graphics = await this.prisma.decorativeGraphic.findMany({
      where: {
        ...(publicOnly ? { enabled: true } : {}),
        ...(page ? { page } : {}),
      },
      orderBy: { order: 'asc' },
    });
    return graphics.map((graphic) => toDecorativeGraphic(graphic));
  }

  async createDecorativeGraphic(dto: CreateDecorativeGraphicDto) {
    const graphic = await this.prisma.decorativeGraphic.create({
      data: {
        page: dto.page ?? 'home',
        variant: dto.variant as never,
        placement: dto.placement as never,
        opacity: dto.opacity ?? 0.06,
        scale: dto.scale ?? 1,
        order: dto.order ?? 0,
        enabled: dto.enabled ?? true,
      },
    });
    return toDecorativeGraphic(graphic);
  }

  async updateDecorativeGraphic(id: string, dto: UpdateDecorativeGraphicDto) {
    await this.assertDecorativeGraphicExists(id);
    const graphic = await this.prisma.decorativeGraphic.update({
      where: { id },
      data: {
        page: dto.page,
        variant: dto.variant as never,
        placement: dto.placement as never,
        opacity: dto.opacity,
        scale: dto.scale,
        order: dto.order,
        enabled: dto.enabled,
      },
    });
    return toDecorativeGraphic(graphic);
  }

  async removeDecorativeGraphic(id: string) {
    await this.assertDecorativeGraphicExists(id);
    await this.prisma.decorativeGraphic.delete({ where: { id } });
    return { deleted: true };
  }

  private async assertDecorativeGraphicExists(id: string) {
    const graphic = await this.prisma.decorativeGraphic.findUnique({
      where: { id },
    });
    if (!graphic)
      throw new ApiException('NOT_FOUND', 'Decorative graphic not found.', 404);
  }

  // ── About Preview (Post-Launch, singleton) ─────────────────────────────

  private async getOrCreateAboutPreview() {
    const existing = await this.prisma.homepageAboutPreview.findFirst({
      include: ABOUT_PREVIEW_INCLUDE,
    });
    if (existing) return existing;
    return this.prisma.homepageAboutPreview.create({
      data: {},
      include: ABOUT_PREVIEW_INCLUDE,
    });
  }

  async findAboutPreview(locale: string = DEFAULT_LOCALE) {
    const entry = await this.getOrCreateAboutPreview();
    return toAboutPreview(entry, locale);
  }

  async updateAboutPreview(dto: UpdateAboutPreviewDto) {
    const existing = await this.getOrCreateAboutPreview();
    const updated = await this.prisma.homepageAboutPreview.update({
      where: { id: existing.id },
      data: {
        label: dto.label,
        heading: dto.heading,
        paragraph1: dto.paragraph_1,
        paragraph2: dto.paragraph_2,
        paragraph3: dto.paragraph_3,
        ctaText: dto.cta_text,
        ctaLink: dto.cta_link,
        videoSource: dto.video_source as never,
        videoUrl: dto.video_url,
        videoMediaId: dto.video_media_id,
        videoThumbnailId: dto.video_thumbnail_id,
        enabled: dto.enabled,
        translations: dto.translations,
      },
      include: ABOUT_PREVIEW_INCLUDE,
    });
    return toAboutPreview(updated);
  }

  // ── Highlights (Post-Launch) ────────────────────────────────────────────

  async findHighlights(locale?: string, publicOnly = false) {
    const highlights = await this.prisma.homepageHighlight.findMany({
      where: publicOnly ? { enabled: true } : undefined,
      orderBy: { order: 'asc' },
    });
    return highlights.map((highlight) => toHighlight(highlight, locale));
  }

  async createHighlight(dto: CreateHighlightDto) {
    const highlight = await this.prisma.homepageHighlight.create({
      data: {
        icon: (dto.icon as never) ?? 'quality',
        title: dto.title,
        description: dto.description,
        order: dto.order ?? 0,
        enabled: dto.enabled ?? true,
        translations: dto.translations,
      },
    });
    return toHighlight(highlight);
  }

  async updateHighlight(id: string, dto: UpdateHighlightDto) {
    await this.assertHighlightExists(id);
    const highlight = await this.prisma.homepageHighlight.update({
      where: { id },
      data: {
        icon: dto.icon as never,
        title: dto.title,
        description: dto.description,
        order: dto.order,
        enabled: dto.enabled,
        translations: dto.translations,
      },
    });
    return toHighlight(highlight);
  }

  async removeHighlight(id: string) {
    await this.assertHighlightExists(id);
    await this.prisma.homepageHighlight.delete({ where: { id } });
    return { deleted: true };
  }

  private async assertHighlightExists(id: string) {
    const highlight = await this.prisma.homepageHighlight.findUnique({
      where: { id },
    });
    if (!highlight)
      throw new ApiException('NOT_FOUND', 'Highlight not found.', 404);
  }

  // ── Partners Section (Post-Launch, singleton) ──────────────────────────

  private async getOrCreatePartnersSection() {
    const existing = await this.prisma.homepagePartnersSection.findFirst();
    if (existing) return existing;
    return this.prisma.homepagePartnersSection.create({ data: {} });
  }

  async findPartnersSection(locale: string = DEFAULT_LOCALE) {
    const entry = await this.getOrCreatePartnersSection();
    return toPartnersSection(entry, locale);
  }

  async updatePartnersSection(dto: UpdatePartnersSectionDto) {
    const existing = await this.getOrCreatePartnersSection();
    const updated = await this.prisma.homepagePartnersSection.update({
      where: { id: existing.id },
      data: {
        title: dto.title,
        subtitle: dto.subtitle,
        marqueeDurationSeconds: dto.marquee_duration_seconds,
        enabled: dto.enabled,
        translations: dto.translations,
      },
    });
    return toPartnersSection(updated);
  }

  // ── Why Choose Us (Post-Launch) ─────────────────────────────────────────

  async findWhyChooseUs(locale?: string, publicOnly = false) {
    const items = await this.prisma.homepageWhyChooseUs.findMany({
      // Same independent-gate pattern as PartnerLogo — "Active" keeps the record on file,
      // "Featured" is what actually publishes it to the Homepage.
      where: publicOnly ? { enabled: true, featured: true } : undefined,
      orderBy: { order: 'asc' },
    });
    return items.map((item) => toWhyChooseUs(item, locale));
  }

  async createWhyChooseUs(dto: CreateWhyChooseUsDto) {
    const item = await this.prisma.homepageWhyChooseUs.create({
      data: {
        icon: (dto.icon as never) ?? 'quality',
        title: dto.title,
        order: dto.order ?? 0,
        enabled: dto.enabled ?? true,
        featured: dto.featured ?? true,
        translations: dto.translations,
      },
    });
    return toWhyChooseUs(item);
  }

  async updateWhyChooseUs(id: string, dto: UpdateWhyChooseUsDto) {
    await this.assertWhyChooseUsExists(id);
    const item = await this.prisma.homepageWhyChooseUs.update({
      where: { id },
      data: {
        icon: dto.icon as never,
        title: dto.title,
        order: dto.order,
        enabled: dto.enabled,
        featured: dto.featured,
        translations: dto.translations,
      },
    });
    return toWhyChooseUs(item);
  }

  async removeWhyChooseUs(id: string) {
    await this.assertWhyChooseUsExists(id);
    await this.prisma.homepageWhyChooseUs.delete({ where: { id } });
    return { deleted: true };
  }

  private async assertWhyChooseUsExists(id: string) {
    const item = await this.prisma.homepageWhyChooseUs.findUnique({
      where: { id },
    });
    if (!item)
      throw new ApiException('NOT_FOUND', 'Why Choose Us item not found.', 404);
  }
}
