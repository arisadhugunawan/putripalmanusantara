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
import {
  toFooterSettings,
  type FooterSettingsWithRelations,
} from './footer.mapper';
import type { UpdateFooterSettingsDto } from './dto/footer.dto';

const ALLOWED_MIME_TYPES: Record<string, true> = {
  'image/jpeg': true,
  'image/png': true,
  'image/webp': true,
};
const MAX_BACKGROUND_BYTES = 2 * 1024 * 1024;
const MIN_WIDTH = 1600;
const MIN_HEIGHT = 500;

const INCLUDE = {
  backgroundImage: true,
  mobileBackgroundImage: true,
} as const;

/** The fields `update()` actually merges into `translations` (see the identical list mirrored
 * there) — the ground truth for what "Generate Translations" both reads from English and writes
 * back for every other locale. */
const TRANSLATABLE_FOOTER_FIELDS = [
  'tagline',
  'description',
  'ctaHeadline',
  'ctaDescription',
  'ctaPrimaryText',
  'ctaSecondaryText',
] as const;

@Injectable()
export class FooterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaService: MediaService,
    private readonly translationService: AiTranslationService,
  ) {}

  // P1-6 — `upsert()` on the `singleton` marker (always `true`, `@unique`) closes the
  // findFirst()-then-create() TOCTOU race: two concurrent calls now resolve to the SAME
  // database-enforced row instead of racing to create two.
  private async getOrCreate(): Promise<FooterSettingsWithRelations> {
    return this.prisma.footerSettings.upsert({
      where: { singleton: true },
      create: { singleton: true },
      update: {},
      include: INCLUDE,
    });
  }

  async find(locale?: string) {
    return toFooterSettings(await this.getOrCreate(), locale);
  }

  async update(dto: UpdateFooterSettingsDto) {
    const existing = await this.getOrCreate();
    const updated = await this.prisma.footerSettings.update({
      where: { id: existing.id },
      data: {
        enabled: dto.enabled,
        showCta: dto.show_cta,
        showSocial: dto.show_social,
        showContact: dto.show_contact,
        showNavigation: dto.show_navigation,
        companyName: dto.company_name,
        tagline: dto.tagline,
        description: dto.description,
        translations: mergeTranslations(
          existing.translations,
          dto.translations,
        ),
        backgroundImageId: dto.background_image_id,
        mobileBackgroundImageId: dto.mobile_background_image_id,
        backgroundAltText: dto.background_alt_text,
        overlayType: dto.overlay_type,
        overlayOpacity: dto.overlay_opacity,
        backgroundPosition: dto.background_position,
        mobileBackgroundPosition: dto.mobile_background_position,
        ctaHeadline: dto.cta_headline,
        ctaDescription: dto.cta_description,
        ctaPrimaryText: dto.cta_primary_text,
        ctaSecondaryText: dto.cta_secondary_text,
      },
      include: INCLUDE,
    });
    return toFooterSettings(updated);
  }

  /** Singleton — no id to key off, mirrors `update()`'s own `getOrCreate()` lookup. */
  async getTranslationStatus() {
    const footer = await this.getOrCreate();
    const sourceFields: Record<string, string | null> = {};
    for (const field of TRANSLATABLE_FOOTER_FIELDS) {
      sourceFields[field] = footer[field];
    }
    return computeTranslationStatus(sourceFields, footer.translations);
  }

  async generateTranslations() {
    const footer = await this.getOrCreate();
    const sourceFields: Record<string, string> = {};
    for (const field of TRANSLATABLE_FOOTER_FIELDS) {
      const value = footer[field];
      if (typeof value === 'string' && value.trim())
        sourceFields[field] = value;
    }

    const { available, translatedLocales, generated, mergedTranslations } =
      await this.translationService.generateAndMerge(
        sourceFields,
        footer.translations,
      );

    if (mergedTranslations !== undefined) {
      await this.prisma.footerSettings.update({
        where: { id: footer.id },
        data: { translations: mergedTranslations },
      });
    }

    return buildGenerateTranslationsResponse(
      available,
      translatedLocales,
      generated,
    );
  }

  /** Real backend validation (format/size/dimensions) for the Footer background upload — see
   * `PageHeaderService.uploadBackground()` for why this is a dedicated path rather than the
   * generic `POST /admin/media` (soft-warning-only) pipeline. Constraints here are the Footer's
   * own (1600×500 min, wider/shorter banner than the 1600×400 Inner Page Header uses). */
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
        'Maximum file size is 2 MB.',
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
        `Minimum resolution is ${MIN_WIDTH}×${MIN_HEIGHT} px.`,
        400,
      );
    }

    return this.mediaService.upload(file, altText);
  }
}
