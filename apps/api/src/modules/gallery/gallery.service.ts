import { Injectable } from '@nestjs/common';
import { DEFAULT_LOCALE } from '@ppn/shared-types';
import { ApiException } from '../../common/exceptions/api.exception';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  CreateGalleryCategoryDto,
  UpdateGalleryCategoryDto,
} from './dto/gallery-category.dto';
import type {
  CreateGalleryItemDto,
  UpdateGalleryItemDto,
} from './dto/gallery-item.dto';
import { toGalleryCategory } from './gallery-category.mapper';
import { toGalleryItem } from './gallery-item.mapper';

const YOUTUBE_URL_PATTERN =
  /^https?:\/\/(www\.|m\.|music\.)?(youtube\.com\/|youtu\.be\/)/i;
const TIKTOK_URL_PATTERN = /^https?:\/\/(www\.|vt\.|vm\.)?tiktok\.com\//i;

const ITEM_INCLUDE = { media: true, category: true } as const;

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
  constructor(private readonly prisma: PrismaService) {}

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
    const slug = await this.uniqueCategorySlug(
      dto.slug ? slugify(dto.slug) : slugify(dto.name),
    );
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
  }

  async updateCategory(id: string, dto: UpdateGalleryCategoryDto) {
    await this.assertCategoryExists(id);
    const category = await this.prisma.galleryCategory.update({
      where: { id },
      data: {
        name: dto.name,
        order: dto.order,
        active: dto.active,
        translations: dto.translations,
      },
    });
    return toGalleryCategory(category);
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
    await this.prisma.galleryCategory.delete({ where: { id } });
    return { deleted: true };
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
        translations: dto.translations,
      },
      include: ITEM_INCLUDE,
    });
    return toGalleryItem(item);
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
}
