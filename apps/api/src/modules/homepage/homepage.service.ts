import { Injectable } from '@nestjs/common';
import {
  DEFAULT_LOCALE,
  WORLD_COUNTRIES,
  type HomepageStatistic,
} from '@ppn/shared-types';
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
  CreateShippingPartnerDto,
  UpdateShippingPartnerDto,
} from './dto/shipping-partner.dto';
import type { UpdateShippingSectionDto } from './dto/shipping-section.dto';
import type {
  CreateExportDestinationDto,
  UpdateExportDestinationDto,
} from './dto/export-destination.dto';
import type { UpdateExportReachSectionDto } from './dto/export-reach-section.dto';
import type {
  CreateWhyChooseUsDto,
  UpdateWhyChooseUsDto,
} from './dto/why-choose-us.dto';
import { toAboutPreview } from './about-preview.mapper';
import { toDecorativeGraphic } from './decorative-graphic.mapper';
import { toExportDestination } from './export-destination.mapper';
import { toExportReachSection } from './export-reach-section.mapper';
import { toHeroSlide } from './hero-slide.mapper';
import { toHighlight } from './highlight.mapper';
import { toPartnerLogo } from './partner-logo.mapper';
import { toPartnersSection } from './partners-section.mapper';
import { toShippingPartner } from './shipping-partner.mapper';
import { toShippingSection } from './shipping-section.mapper';
import { toWhyChooseUs } from './why-choose-us.mapper';

const HERO_SLIDE_INCLUDE = { desktopImage: true, mobileImage: true } as const;
const PARTNER_LOGO_INCLUDE = { logo: true } as const;
const SHIPPING_PARTNER_INCLUDE = { logo: true } as const;
const ABOUT_PREVIEW_INCLUDE = {
  videoMedia: true,
  videoThumbnail: true,
} as const;
const EXPORT_DESTINATION_INCLUDE = {
  products: { select: { id: true, slug: true, name: true } },
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
        eyebrowText: dto.eyebrow_text,
        heading: dto.heading,
        subheading: dto.subheading,
        description: dto.description,
        button1Text: dto.button_1_text,
        button1Link: dto.button_1_link,
        button1Enabled: dto.button_1_enabled ?? true,
        button1Style: (dto.button_1_style as never) ?? 'primary',
        button2Text: dto.button_2_text,
        button2Link: dto.button_2_link,
        button2Enabled: dto.button_2_enabled ?? true,
        button2Style: (dto.button_2_style as never) ?? 'secondary',
        textAlignment: (dto.text_alignment as never) ?? 'center',
        overlayOpacity: dto.overlay_opacity ?? 35,
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
        eyebrowText: dto.eyebrow_text,
        heading: dto.heading,
        subheading: dto.subheading,
        description: dto.description,
        button1Text: dto.button_1_text,
        button1Link: dto.button_1_link,
        button1Enabled: dto.button_1_enabled,
        button1Style: dto.button_1_style as never,
        button2Text: dto.button_2_text,
        button2Link: dto.button_2_link,
        button2Enabled: dto.button_2_enabled,
        button2Style: dto.button_2_style as never,
        textAlignment: dto.text_alignment as never,
        overlayOpacity: dto.overlay_opacity,
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

  /** Clones every field except id/timestamps — new slide is inactive by default so
   * duplicating for a quick variant never accidentally goes live on the Homepage. */
  async duplicateHeroSlide(id: string) {
    const source = await this.prisma.heroSlide.findUnique({ where: { id } });
    if (!source)
      throw new ApiException('NOT_FOUND', 'Hero slide not found.', 404);

    const count = await this.prisma.heroSlide.count();
    const slide = await this.prisma.heroSlide.create({
      data: {
        desktopImageId: source.desktopImageId,
        mobileImageId: source.mobileImageId,
        eyebrowText: source.eyebrowText,
        heading: `${source.heading} — Copy`,
        subheading: source.subheading,
        description: source.description,
        button1Text: source.button1Text,
        button1Link: source.button1Link,
        button1Enabled: source.button1Enabled,
        button1Style: source.button1Style,
        button2Text: source.button2Text,
        button2Link: source.button2Link,
        button2Enabled: source.button2Enabled,
        button2Style: source.button2Style,
        textAlignment: source.textAlignment,
        overlayOpacity: source.overlayOpacity,
        order: count,
        enabled: false,
        publishDate: source.publishDate,
        translations: source.translations as never,
      },
      include: HERO_SLIDE_INCLUDE,
    });
    return toHeroSlide(slide);
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

  /** Clones every field except id/timestamps — new record is inactive and not featured by
   * default so duplicating for a quick variant never accidentally goes live. */
  async duplicatePartnerLogo(id: string) {
    const source = await this.prisma.partnerLogo.findUnique({ where: { id } });
    if (!source)
      throw new ApiException('NOT_FOUND', 'Partner logo not found.', 404);

    const count = await this.prisma.partnerLogo.count();
    const logo = await this.prisma.partnerLogo.create({
      data: {
        logoId: source.logoId,
        partnerName: `${source.partnerName} — Copy`,
        description: source.description,
        websiteUrl: source.websiteUrl,
        openInNewTab: source.openInNewTab,
        altText: source.altText,
        category: source.category,
        order: count,
        enabled: false,
        featured: false,
        translations: source.translations as never,
      },
      include: PARTNER_LOGO_INCLUDE,
    });
    return toPartnerLogo(logo);
  }

  private async assertPartnerLogoExists(id: string) {
    const logo = await this.prisma.partnerLogo.findUnique({ where: { id } });
    if (!logo)
      throw new ApiException('NOT_FOUND', 'Partner logo not found.', 404);
  }

  // ── Shipping Partners (Post-Launch) ────────────────────────────────────

  async findShippingPartners(locale?: string, publicOnly = false) {
    const partners = await this.prisma.shippingPartner.findMany({
      // Same independent enabled+featured gate as PartnerLogo — Active keeps the record on
      // file/editable, Featured is what actually publishes it to the Homepage carousel.
      where: publicOnly ? { enabled: true, featured: true } : undefined,
      include: SHIPPING_PARTNER_INCLUDE,
      orderBy: { order: 'asc' },
    });
    return partners.map((partner) => toShippingPartner(partner, locale));
  }

  async createShippingPartner(dto: CreateShippingPartnerDto) {
    const partner = await this.prisma.shippingPartner.create({
      data: {
        logoId: dto.logo_id,
        partnerName: dto.partner_name,
        relationshipType: dto.relationship_type as never,
        description: dto.description,
        websiteUrl: dto.website_url,
        openInNewTab: dto.open_in_new_tab ?? true,
        altText: dto.alt_text,
        order: dto.order ?? 0,
        enabled: dto.enabled ?? true,
        featured: dto.featured ?? true,
        translations: dto.translations,
      },
      include: SHIPPING_PARTNER_INCLUDE,
    });
    return toShippingPartner(partner);
  }

  async updateShippingPartner(id: string, dto: UpdateShippingPartnerDto) {
    await this.assertShippingPartnerExists(id);
    const partner = await this.prisma.shippingPartner.update({
      where: { id },
      data: {
        logoId: dto.logo_id,
        partnerName: dto.partner_name,
        relationshipType: dto.relationship_type as never,
        description: dto.description,
        websiteUrl: dto.website_url,
        openInNewTab: dto.open_in_new_tab,
        altText: dto.alt_text,
        order: dto.order,
        enabled: dto.enabled,
        featured: dto.featured,
        translations: dto.translations,
      },
      include: SHIPPING_PARTNER_INCLUDE,
    });
    return toShippingPartner(partner);
  }

  async removeShippingPartner(id: string) {
    await this.assertShippingPartnerExists(id);
    await this.prisma.shippingPartner.delete({ where: { id } });
    return { deleted: true };
  }

  /** Clones every field except id/timestamps — new record is inactive and not featured by
   * default so duplicating for a quick variant never accidentally goes live. */
  async duplicateShippingPartner(id: string) {
    const source = await this.prisma.shippingPartner.findUnique({
      where: { id },
    });
    if (!source)
      throw new ApiException('NOT_FOUND', 'Shipping partner not found.', 404);

    const count = await this.prisma.shippingPartner.count();
    const partner = await this.prisma.shippingPartner.create({
      data: {
        logoId: source.logoId,
        partnerName: `${source.partnerName} — Copy`,
        relationshipType: source.relationshipType,
        description: source.description,
        websiteUrl: source.websiteUrl,
        openInNewTab: source.openInNewTab,
        altText: source.altText,
        order: count,
        enabled: false,
        featured: false,
        translations: source.translations as never,
      },
      include: SHIPPING_PARTNER_INCLUDE,
    });
    return toShippingPartner(partner);
  }

  private async assertShippingPartnerExists(id: string) {
    const partner = await this.prisma.shippingPartner.findUnique({
      where: { id },
    });
    if (!partner)
      throw new ApiException('NOT_FOUND', 'Shipping partner not found.', 404);
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

  // ── Shipping Section (Post-Launch, singleton) ──────────────────────────

  private async getOrCreateShippingSection() {
    const existing = await this.prisma.homepageShippingSection.findFirst();
    if (existing) return existing;
    return this.prisma.homepageShippingSection.create({ data: {} });
  }

  async findShippingSection(locale: string = DEFAULT_LOCALE) {
    const entry = await this.getOrCreateShippingSection();
    return toShippingSection(entry, locale);
  }

  async updateShippingSection(dto: UpdateShippingSectionDto) {
    const existing = await this.getOrCreateShippingSection();
    const updated = await this.prisma.homepageShippingSection.update({
      where: { id: existing.id },
      data: {
        title: dto.title,
        subtitle: dto.subtitle,
        marqueeDurationSeconds: dto.marquee_duration_seconds,
        showPartnerName: dto.show_partner_name,
        showRelationshipType: dto.show_relationship_type,
        enabled: dto.enabled,
        translations: dto.translations,
      },
    });
    return toShippingSection(updated);
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

  // ── Export Destinations / Global Export Reach (Post-Launch) ─────────────

  async findExportDestinations(locale?: string, publicOnly = false) {
    const destinations = await this.prisma.exportDestination.findMany({
      // Only a real, currently-active export relationship is ever shown to visitors —
      // "previous"/"potential"/"inactive" stay Admin-only bookkeeping (see brief: never
      // imply a market relationship that isn't current).
      where: publicOnly
        ? { enabled: true, exportStatus: 'active_destination' }
        : undefined,
      include: EXPORT_DESTINATION_INCLUDE,
      orderBy: { order: 'asc' },
    });
    return destinations.map((d) => toExportDestination(d, locale));
  }

  async createExportDestination(dto: CreateExportDestinationDto) {
    const countryMeta = this.resolveCountryMeta(dto.country_code);
    const destination = await this.prisma.exportDestination.create({
      data: {
        countryCode: countryMeta.alpha2,
        countryCodeAlpha3: countryMeta.alpha3,
        countryName: countryMeta.name,
        exportStatus: (dto.export_status as never) ?? 'active_destination',
        description: dto.description,
        exportVolume: dto.export_volume,
        exportFrequency: dto.export_frequency,
        destinationPort: dto.destination_port,
        products: dto.product_ids
          ? { connect: dto.product_ids.map((id) => ({ id })) }
          : undefined,
        order: dto.order ?? 0,
        enabled: dto.enabled ?? true,
        featured: dto.featured ?? false,
        translations: dto.translations,
      },
      include: EXPORT_DESTINATION_INCLUDE,
    });
    return toExportDestination(destination);
  }

  async updateExportDestination(id: string, dto: UpdateExportDestinationDto) {
    await this.assertExportDestinationExists(id);
    const countryMeta = dto.country_code
      ? this.resolveCountryMeta(dto.country_code)
      : undefined;
    const destination = await this.prisma.exportDestination.update({
      where: { id },
      data: {
        countryCode: countryMeta?.alpha2,
        countryCodeAlpha3: countryMeta?.alpha3,
        countryName: countryMeta?.name,
        exportStatus: dto.export_status as never,
        description: dto.description,
        exportVolume: dto.export_volume,
        exportFrequency: dto.export_frequency,
        destinationPort: dto.destination_port,
        products: dto.product_ids
          ? { set: dto.product_ids.map((id) => ({ id })) }
          : undefined,
        order: dto.order,
        enabled: dto.enabled,
        featured: dto.featured,
        translations: dto.translations,
      },
      include: EXPORT_DESTINATION_INCLUDE,
    });
    return toExportDestination(destination);
  }

  async removeExportDestination(id: string) {
    await this.assertExportDestinationExists(id);
    await this.prisma.exportDestination.delete({ where: { id } });
    return { deleted: true };
  }

  private resolveCountryMeta(alpha2: string) {
    const meta = WORLD_COUNTRIES.find((c) => c.alpha2 === alpha2);
    if (!meta)
      throw new ApiException('INVALID_COUNTRY', 'Unknown country code.', 400);
    return meta;
  }

  private async assertExportDestinationExists(id: string) {
    const destination = await this.prisma.exportDestination.findUnique({
      where: { id },
    });
    if (!destination)
      throw new ApiException('NOT_FOUND', 'Export destination not found.', 404);
  }

  private async getOrCreateExportReachSection() {
    const existing = await this.prisma.homepageExportReach.findFirst();
    if (existing) return existing;
    return this.prisma.homepageExportReach.create({ data: {} });
  }

  async findExportReachSection(locale: string = DEFAULT_LOCALE) {
    const entry = await this.getOrCreateExportReachSection();
    return toExportReachSection(entry, locale);
  }

  async updateExportReachSection(dto: UpdateExportReachSectionDto) {
    const existing = await this.getOrCreateExportReachSection();
    const updated = await this.prisma.homepageExportReach.update({
      where: { id: existing.id },
      data: {
        heading: dto.heading,
        subtitle: dto.subtitle,
        enabled: dto.enabled,
        translations: dto.translations,
      },
    });
    return toExportReachSection(updated);
  }
}
