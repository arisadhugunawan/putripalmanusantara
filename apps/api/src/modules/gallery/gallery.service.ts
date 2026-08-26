import { Injectable } from '@nestjs/common';
import { DEFAULT_LOCALE } from '@ppn/shared-types';
import {
  AiTranslationService,
  buildGenerateTranslationsResponse,
  computeTranslationStatus,
} from '../ai/ai-translation.service';
import { buildPaginationMeta } from '../../common/dto/pagination-query.dto';
import { ApiException } from '../../common/exceptions/api.exception';
import { mergeTranslations } from '../../common/utils/i18n.util';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  CreateGalleryCategoryDto,
  UpdateGalleryCategoryDto,
} from './dto/gallery-category.dto';
import type {
  CreateGalleryItemDto,
  UpdateGalleryItemDto,
} from './dto/gallery-item.dto';
import type { GalleryQueryDto } from './dto/gallery-query.dto';
import { toGalleryCategory } from './gallery-category.mapper';
import { toGalleryItem } from './gallery-item.mapper';

const YOUTUBE_URL_PATTERN =
  /^https?:\/\/(www\.|m\.|music\.)?(youtube\.com\/|youtu\.be\/)/i;
const TIKTOK_URL_PATTERN = /^https?:\/\/(www\.|vt\.|vm\.)?tiktok\.com\//i;

const ITEM_INCLUDE = { media: true, category: true } as const;

/** Bounds the slug-conflict retry loop in `createCategory()` (P2-1) — protects against an
 * infinite loop if something is systematically wrong, while comfortably covering realistic
 * concurrent-request bursts against the same category name. */
const MAX_SLUG_RETRY_ATTEMPTS = 5;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180);
}

/** Validates `external_url` against the right platform pattern for `media_type`. Done here
 * rather than via stacked `@ValidateIf`/`@Matches` decorators on the DTO, since class-validator
 * skips a property's validation entirely (not just one group) when any one of several stacked
 * `@ValidateIf` conditions on that property is false — two mutually-exclusive conditional
 * groups can't coexist on the same field. */
function assertValidExternalUrl(
  mediaType: string | undefined,
  externalUrl: string | undefined,
) {
  if (mediaType === 'youtube' && !YOUTUBE_URL_PATTERN.test(externalUrl ?? '')) {
    throw new ApiException('INVALID_URL', 'URL YouTube tidak valid.', 400);
  }
  if (mediaType === 'tiktok' && !TIKTOK_URL_PATTERN.test(externalUrl ?? '')) {
    throw new ApiException('INVALID_URL', 'URL TikTok tidak valid.', 400);
  }
}

@Injectable()
export class GalleryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly translationService: AiTranslationService,
  ) {}

  // ── Categories ────────────────────────────────────────────────────────

  async findAllCategories(locale?: string, activeOnly = false) {
    const categories = await this.prisma.galleryCategory.findMany({
      where: activeOnly ? { active: true } : undefined,
      orderBy: { order: 'asc' },
    });
    return categories.map((category) =>
      toGalleryCategory(category, locale ?? DEFAULT_LOCALE),
    );
  }

  async createCategory(dto: CreateGalleryCategoryDto) {
    const count = await this.prisma.galleryCategory.count();
    const base = dto.slug ? slugify(dto.slug) : slugify(dto.name);
    let slug = await this.uniqueCategorySlug(base);
    for (let attempt = 0; ; attempt++) {
      try {
        const category = await this.prisma.galleryCategory.create({
          data: {
            name: dto.name,
            slug,
            order: dto.order ?? count,
            active: dto.active ?? true,
            translations: dto.translations,
          },
        });
        return toGalleryCategory(category);
      } catch (error) {
        // P2-1 — closes the TOCTOU race between `uniqueCategorySlug()`'s read-loop above and
        // this write: if another request claimed `slug` in between, re-resolve (a fresh DB
        // read, so it naturally skips whatever is now taken) and retry, preserving the
        // existing "always succeeds with the next available suffix" behavior rather than
        // surfacing a new rejection to the caller.
        if (
          attempt < MAX_SLUG_RETRY_ATTEMPTS &&
          this.isGalleryCategorySlugConflict(error)
        ) {
          slug = await this.uniqueCategorySlug(base);
          continue;
        }
        throw error;
      }
    }
  }

  async updateCategory(id: string, dto: UpdateGalleryCategoryDto) {
    const existing = await this.assertCategoryExists(id);
    const category = await this.prisma.galleryCategory.update({
      where: { id },
      data: {
        name: dto.name,
        order: dto.order,
        active: dto.active,
        translations: mergeTranslations(
          existing.translations,
          dto.translations,
        ),
      },
    });
    return toGalleryCategory(category);
  }

  async getCategoryTranslationStatus(id: string) {
    const category = await this.assertCategoryExists(id);
    return computeTranslationStatus(
      { name: category.name },
      category.translations,
    );
  }

  async generateCategoryTranslations(id: string) {
    const category = await this.assertCategoryExists(id);
    const sourceFields: Record<string, string> = {};
    if (category.name?.trim()) sourceFields.name = category.name;
    const { available, translatedLocales, generated, mergedTranslations } =
      await this.translationService.generateAndMerge(
        sourceFields,
        category.translations,
      );
    if (mergedTranslations !== undefined) {
      await this.prisma.galleryCategory.update({
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

  async removeCategory(id: string) {
    await this.assertCategoryExists(id);
    const itemCount = await this.prisma.galleryItem.count({
      where: { categoryId: id },
    });
    if (itemCount > 0) {
      throw new ApiException(
        'CATEGORY_NOT_EMPTY',
        'Kategori ini masih memiliki item galeri. Pindahkan atau hapus item tersebut terlebih dahulu.',
        409,
      );
    }
    try {
      await this.prisma.galleryCategory.delete({ where: { id } });
    } catch (error) {
      if (this.isCategoryDeleteRestrictedByItems(error)) {
        throw new ApiException(
          'CATEGORY_NOT_EMPTY',
          'Kategori ini masih memiliki item galeri. Pindahkan atau hapus item tersebut terlebih dahulu.',
          409,
        );
      }
      throw error;
    }
    return { deleted: true };
  }

  /** True only for the unique-constraint violation on `GalleryCategory.slug` — never a false
   * positive on some other unrelated DB error. Defense-in-depth for the TOCTOU race between
   * `uniqueCategorySlug()`'s read-loop and `createCategory()`'s actual write: two concurrent
   * requests can both see the same slug as free before either commits. `updateCategory()` never
   * writes `slug` (immutable after creation), so it has no equivalent race and is intentionally
   * not guarded here. Mirrors `ProductsService.isProductSlugConflict()`'s proven dual-shape
   * check (P2-1) for the identical Prisma-7 driver-adapter quirk: `P2002` is Prisma's documented
   * "unique constraint failed" code, but under Prisma 7's driver-adapter architecture this can
   * instead surface as the generic unmapped code `P2039`, with the real Postgres SQLSTATE
   * (`23505` = `unique_violation`) preserved at `error.meta.driverAdapterError.cause.originalCode`.
   * Unlike Product, a recognized conflict here does NOT become a user-facing error — the caller
   * re-resolves the next available suffix and retries instead, preserving GalleryCategory's
   * existing "always succeeds" slug-collision behavior. */
  private isGalleryCategorySlugConflict(error: unknown): boolean {
    const err = error as {
      code?: string;
      meta?: {
        target?: string[];
        driverAdapterError?: { cause?: { originalCode?: string } };
      };
    };
    if (err.code === 'P2002') {
      return !err.meta?.target || err.meta.target.includes('slug');
    }
    return (
      err.code === 'P2039' &&
      err.meta?.driverAdapterError?.cause?.originalCode === '23505'
    );
  }

  /** True only for the FK RESTRICT violation on `GalleryItem.categoryId` — never a false
   * positive on some other unrelated DB error. Closes the race between the `itemCount` check
   * above and this delete (an item inserted into the category in that window) by mirroring
   * `ProductsService.isProductDeleteRestrictedByPublishHistory()`'s proven dual-shape check
   * (P0.4-D3): `P2003` is Prisma's documented code, but under Prisma 7's driver-adapter
   * architecture this can surface as the generic unmapped code `P2039`, with the real Postgres
   * SQLSTATE (`23001` = `restrict_violation`) preserved at
   * `error.meta.driverAdapterError.cause.originalCode`. */
  private isCategoryDeleteRestrictedByItems(error: unknown): boolean {
    const err = error as {
      code?: string;
      meta?: { driverAdapterError?: { cause?: { originalCode?: string } } };
    };
    if (err.code === 'P2003') return true;
    return (
      err.code === 'P2039' &&
      err.meta?.driverAdapterError?.cause?.originalCode === '23001'
    );
  }

  private async uniqueCategorySlug(base: string) {
    let slug = base || 'category';
    let suffix = 2;
    while (await this.prisma.galleryCategory.findUnique({ where: { slug } })) {
      slug = `${base}-${suffix++}`;
    }
    return slug;
  }

  private async assertCategoryExists(id: string) {
    const category = await this.prisma.galleryCategory.findUnique({
      where: { id },
    });
    if (!category)
      throw new ApiException('NOT_FOUND', 'Gallery category not found.', 404);
    return category;
  }

  // ── Items ─────────────────────────────────────────────────────────────

  /** Admin-facing — unfiltered (includes inactive items so they can be re-activated). */
  async findAll(locale?: string) {
    const items = await this.prisma.galleryItem.findMany({
      include: ITEM_INCLUDE,
      orderBy: { order: 'asc' },
    });
    return items.map((item) => toGalleryItem(item, locale ?? DEFAULT_LOCALE));
  }

  /** Backs the admin Gallery list page (Phase 5C) — paginated, searchable, filterable. Only
   * reached when the caller explicitly passes `page` (see `AdminGalleryController.findAll()`);
   * the Admin Dashboard and the Gallery overview stat tiles still get the full unpaginated list
   * via `findAll()`. Sort stays `order asc` (unchanged) — Gallery's manual drag-reorder is tied
   * to that field, see the admin Gallery page's `canReorder` guard for how pagination and
   * reorder coexist. */
  async findAllPaginated(query: GalleryQueryDto, locale?: string) {
    const page = query.page ?? 1;
    const limit = query.limit;
    const q = query.q?.trim();
    const where = {
      ...(query.category_id ? { categoryId: query.category_id } : {}),
      ...(query.status ? { active: query.status === 'active' } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: 'insensitive' as const } },
              { caption: { contains: q, mode: 'insensitive' as const } },
              { location: { contains: q, mode: 'insensitive' as const } },
              {
                shortDescription: {
                  contains: q,
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.galleryItem.findMany({
        where,
        include: ITEM_INCLUDE,
        orderBy: { order: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.galleryItem.count({ where }),
    ]);
    return {
      items: items.map((item) => toGalleryItem(item, locale ?? DEFAULT_LOCALE)),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  /** Public-facing — active items only, optionally filtered to one category by slug. */
  async findPublic(categorySlug?: string, locale?: string) {
    const items = await this.prisma.galleryItem.findMany({
      where: {
        active: true,
        category: categorySlug ? { slug: categorySlug } : undefined,
      },
      include: ITEM_INCLUDE,
      orderBy: { order: 'asc' },
    });
    return items.map((item) => toGalleryItem(item, locale ?? DEFAULT_LOCALE));
  }

  async create(dto: CreateGalleryItemDto) {
    const mediaType = dto.media_type ?? 'image';
    assertValidExternalUrl(mediaType, dto.external_url);
    await this.assertCategoryValid(dto.category_id);
    if (dto.media_id && mediaType !== 'youtube' && mediaType !== 'tiktok') {
      await this.assertMediaValid(dto.media_id);
    }

    const count = await this.prisma.galleryItem.count();
    const item = await this.prisma.galleryItem.create({
      data: {
        mediaType,
        mediaId:
          mediaType === 'youtube' || mediaType === 'tiktok'
            ? null
            : dto.media_id,
        externalUrl:
          mediaType === 'youtube' || mediaType === 'tiktok'
            ? dto.external_url
            : null,
        categoryId: dto.category_id,
        title: dto.title,
        caption: dto.caption,
        altText: dto.alt_text,
        location: dto.location,
        capturedAt: dto.captured_at ? new Date(dto.captured_at) : undefined,
        shortDescription: dto.short_description,
        featured: dto.featured ?? false,
        order: dto.order ?? count,
        active: dto.active ?? true,
        translations: dto.translations,
      },
      include: ITEM_INCLUDE,
    });
    return toGalleryItem(item);
  }

  async update(id: string, dto: UpdateGalleryItemDto) {
    const existing = await this.findItemOrThrow(id);
    const mediaType = dto.media_type ?? existing.mediaType;
    if (dto.media_type || dto.external_url !== undefined) {
      assertValidExternalUrl(
        mediaType,
        dto.external_url ?? existing.externalUrl ?? undefined,
      );
    }
    if (dto.category_id) await this.assertCategoryValid(dto.category_id);
    const isUrlBased = mediaType === 'youtube' || mediaType === 'tiktok';
    if (dto.media_id && !isUrlBased) {
      await this.assertMediaValid(dto.media_id);
    }

    const item = await this.prisma.galleryItem.update({
      where: { id },
      data: {
        mediaType: dto.media_type,
        mediaId: isUrlBased ? null : dto.media_id,
        externalUrl: isUrlBased
          ? (dto.external_url ?? existing.externalUrl)
          : null,
        categoryId: dto.category_id,
        title: dto.title,
        caption: dto.caption,
        altText: dto.alt_text,
        location: dto.location,
        capturedAt: dto.captured_at ? new Date(dto.captured_at) : undefined,
        shortDescription: dto.short_description,
        featured: dto.featured,
        order: dto.order,
        active: dto.active,
        translations: mergeTranslations(
          existing.translations,
          dto.translations,
        ),
      },
      include: ITEM_INCLUDE,
    });
    return toGalleryItem(item);
  }

  private static readonly ITEM_TRANSLATABLE_FIELDS = [
    'title',
    'caption',
    'shortDescription',
  ] as const;

  async getTranslationStatus(id: string) {
    const item = await this.findItemOrThrow(id);
    const sourceFields: Record<string, string | null> = {};
    for (const field of GalleryService.ITEM_TRANSLATABLE_FIELDS) {
      sourceFields[field] = item[field];
    }
    return computeTranslationStatus(sourceFields, item.translations);
  }

  async generateTranslations(id: string) {
    const item = await this.findItemOrThrow(id);
    const sourceFields: Record<string, string> = {};
    for (const field of GalleryService.ITEM_TRANSLATABLE_FIELDS) {
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
      await this.prisma.galleryItem.update({
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
    await this.findItemOrThrow(id);
    await this.prisma.galleryItem.delete({ where: { id } });
    return { deleted: true };
  }

  private async findItemOrThrow(id: string) {
    const item = await this.prisma.galleryItem.findUnique({ where: { id } });
    if (!item)
      throw new ApiException('NOT_FOUND', 'Gallery item not found.', 404);
    return item;
  }

  private async assertCategoryValid(categoryId: string) {
    const category = await this.prisma.galleryCategory.findUnique({
      where: { id: categoryId },
    });
    if (!category)
      throw new ApiException('INVALID_CATEGORY', 'Kategori tidak valid.', 400);
  }

  /** Mirrors `assertCategoryValid()` — without this, a stale/deleted `media_id` (e.g. picked in
   * one browser tab while permanently deleted from Media Library in another) falls straight
   * through to Prisma and throws an unhandled FK violation, surfacing as a raw 500 instead of a
   * clean 400 (P0.4-D2). */
  private async assertMediaValid(mediaId: string) {
    const media = await this.prisma.media.findUnique({
      where: { id: mediaId },
    });
    if (!media)
      throw new ApiException('INVALID_MEDIA', 'Media tidak valid.', 400);
  }
}
