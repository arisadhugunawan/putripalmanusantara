import { Injectable } from '@nestjs/common';
import { imageSize } from 'image-size';
import {
  AiTranslationService,
  buildGenerateTranslationsResponse,
  computeTranslationStatus,
} from '../ai/ai-translation.service';
import { ApiException } from '../../common/exceptions/api.exception';
import { mergeTranslations } from '../../common/utils/i18n.util';
import { MediaService } from '../../media/media.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '../../../generated/prisma/client';
import {
  resolvePageHeader,
  toPageHeader,
  type PageHeaderWithRelations,
} from './page-header.mapper';
import type { UpdatePageHeaderDto } from './dto/page-header.dto';

export const GLOBAL_DEFAULT_PAGE_HEADER_KEY = 'global-default';

/** Every real page this system manages — see `packages/shared-types/src/page-header.ts` for
 * why Contact/News-Detail are deliberately excluded. */
export const PAGE_HEADER_KEYS = [
  'about-company',
  'products',
  'product-detail',
  'facilities',
  'gallery',
  'news',
] as const;

const ALLOWED_MIME_TYPES: Record<string, true> = {
  'image/jpeg': true,
  'image/png': true,
  'image/webp': true,
};
const MAX_BACKGROUND_BYTES = 2 * 1024 * 1024;
const MIN_WIDTH = 1600;
const MIN_HEIGHT = 400;

const INCLUDE = {
  backgroundImage: true,
  mobileBackgroundImage: true,
} as const;

/** The fields `update()` actually merges into `translations` — ground truth for what
 * "Generate Translations" reads from English and writes back for every other locale. */
const TRANSLATABLE_PAGE_HEADER_FIELDS = ['customTitle', 'subtitle'] as const;

@Injectable()
export class PageHeaderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaService: MediaService,
    private readonly translationService: AiTranslationService,
  ) {}

  private async findRow(
    pageKey: string,
  ): Promise<PageHeaderWithRelations | null> {
    return this.prisma.pageHeader.findUnique({
      where: { pageKey },
      include: INCLUDE,
    });
  }

  // P1-6 — `upsert()` on the existing `pageKey` unique constraint closes the
  // findUnique()-then-create() TOCTOU race: two concurrent first-touch requests for the same
  // key (e.g. two admins opening "Page Header Management" before any row has ever been
  // created) now resolve to the SAME database-enforced row instead of racing to create two,
  // which would otherwise surface as an unhandled P2002 to the second caller.
  private async getOrCreateRow(
    pageKey: string,
  ): Promise<PageHeaderWithRelations> {
    return this.prisma.pageHeader.upsert({
      where: { pageKey },
      create: { pageKey },
      update: {},
      include: INCLUDE,
    });
  }

  /** Admin — "Page Header Management" list: one row per managed page key + Global Default. */
  async findAllForAdmin() {
    const rows = await Promise.all(
      [...PAGE_HEADER_KEYS, GLOBAL_DEFAULT_PAGE_HEADER_KEY].map((key) =>
        this.getOrCreateRow(key),
      ),
    );
    return rows.map(toPageHeader);
  }

  async findOneForAdmin(pageKey: string) {
    const row = await this.getOrCreateRow(pageKey);
    return toPageHeader(row);
  }

  async update(pageKey: string, dto: UpdatePageHeaderDto) {
    const existing = await this.getOrCreateRow(pageKey);
    const updated = await this.prisma.pageHeader.update({
      where: { pageKey },
      data: {
        isActive: dto.is_active,
        backgroundImageId: dto.background_image_id,
        mobileBackgroundImageId: dto.mobile_background_image_id,
        altText: dto.alt_text,
        // Global Default has no meaningful per-page title — silently ignored for that row
        // rather than rejected, so the same form component can be reused for both.
        customTitle:
          pageKey === GLOBAL_DEFAULT_PAGE_HEADER_KEY
            ? undefined
            : dto.custom_title,
        subtitle: dto.subtitle,
        translations: mergeTranslations(
          existing.translations,
          dto.translations,
        ),
        overlayEnabled: dto.overlay_enabled,
        overlayType: dto.overlay_type,
        overlayOpacity: dto.overlay_opacity,
        backgroundPosition: dto.background_position,
        mobileBackgroundPosition: dto.mobile_background_position,
        heightPreset: dto.height_preset,
        titleColor: dto.title_color,
        subtitleColor: dto.subtitle_color,
        breadcrumbColor: dto.breadcrumb_color,
        showBreadcrumb: dto.show_breadcrumb,
      },
      include: INCLUDE,
    });
    return toPageHeader(updated);
  }

  /** Keyed singleton — one row per `pageKey`, mirrors `update()`'s own `getOrCreateRow()`
   * lookup. Coexists with `reset()` (which clears `translations` to null) without any special
   * handling — an empty/absent `translations` just reports every locale as not_translated. */
  async getTranslationStatus(pageKey: string) {
    const row = await this.getOrCreateRow(pageKey);
    const sourceFields: Record<string, string | null> = {};
    for (const field of TRANSLATABLE_PAGE_HEADER_FIELDS) {
      sourceFields[field] = row[field];
    }
    return computeTranslationStatus(sourceFields, row.translations);
  }

  async generateTranslations(pageKey: string) {
    const row = await this.getOrCreateRow(pageKey);
    const sourceFields: Record<string, string> = {};
    for (const field of TRANSLATABLE_PAGE_HEADER_FIELDS) {
      const value = row[field];
      if (typeof value === 'string' && value.trim())
        sourceFields[field] = value;
    }

    const { available, translatedLocales, generated, mergedTranslations } =
      await this.translationService.generateAndMerge(
        sourceFields,
        row.translations,
      );

    if (mergedTranslations !== undefined) {
      await this.prisma.pageHeader.update({
        where: { pageKey },
        data: { translations: mergedTranslations },
      });
    }

    return buildGenerateTranslationsResponse(
      available,
      translatedLocales,
      generated,
    );
  }

  /** "Reset" — clears every design field on this page's row back to null (inherit from Global
   * Default), without touching any other page's configuration. `translations` is cleared too —
   * it only ever holds overrides for `customTitle`/`subtitle`, so leaving it behind would
   * resurrect a translated title/subtitle the admin just asked to remove. */
  async reset(pageKey: string) {
    await this.getOrCreateRow(pageKey);
    const updated = await this.prisma.pageHeader.update({
      where: { pageKey },
      data: {
        backgroundImageId: null,
        mobileBackgroundImageId: null,
        altText: null,
        customTitle: null,
        subtitle: null,
        translations: Prisma.JsonNull,
        overlayEnabled: null,
        overlayType: null,
        overlayOpacity: null,
        backgroundPosition: null,
        mobileBackgroundPosition: null,
        heightPreset: null,
        titleColor: null,
        subtitleColor: null,
        breadcrumbColor: null,
        showBreadcrumb: null,
      },
      include: INCLUDE,
    });
    return toPageHeader(updated);
  }

  /** Public read — fully resolved through the 3-tier chain, ready to render as-is. */
  async resolve(pageKey: string, locale?: string) {
    const [page, global] = await Promise.all([
      this.findRow(pageKey),
      this.findRow(GLOBAL_DEFAULT_PAGE_HEADER_KEY),
    ]);
    const effectivePage = page?.isActive ? page : null;
    return resolvePageHeader(effectivePage, global, locale);
  }

  /**
   * Strict, real backend validation (format/size/dimensions) for the Inner Page Header
   * background upload field specifically — deliberately a separate path from the generic
   * `POST /admin/media` used everywhere else in the admin, which only ever issues a soft,
   * dismissible resolution warning (see `MediaUploadField.tsx`). A header background that's
   * too small or too heavy has no such "still usable" middle ground — it visibly breaks the
   * banner — so this one hard-rejects before the file is ever stored.
   */
  async uploadBackground(
    file: { buffer: Buffer; originalName: string; mimeType: string },
    altText: string,
  ) {
    if (!ALLOWED_MIME_TYPES[file.mimeType]) {
      throw new ApiException(
        'UNSUPPORTED_IMAGE_FORMAT',
        'Unsupported image format. Allowed: JPG, JPEG, PNG, WEBP.',
        400,
      );
    }
    if (file.buffer.byteLength > MAX_BACKGROUND_BYTES) {
      throw new ApiException(
        'IMAGE_TOO_LARGE',
        'Image exceeds the maximum file size of 2 MB.',
        400,
      );
    }

    let width: number | undefined;
    let height: number | undefined;
    try {
      const dimensions = imageSize(file.buffer);
      width = dimensions.width;
      height = dimensions.height;
    } catch {
      throw new ApiException(
        'CORRUPTED_IMAGE',
        'This image file appears to be corrupted or unreadable.',
        400,
      );
    }
    if (!width || !height) {
      throw new ApiException(
        'CORRUPTED_IMAGE',
        'This image file appears to be corrupted or unreadable.',
        400,
      );
    }
    if (width < MIN_WIDTH || height < MIN_HEIGHT) {
      throw new ApiException(
        'IMAGE_TOO_SMALL',
        `Image resolution is too small. Minimum: ${MIN_WIDTH}×${MIN_HEIGHT} px.`,
        400,
      );
    }

    return this.mediaService.upload(file, altText);
  }
}
