import { Injectable } from '@nestjs/common';
import {
  DEFAULT_LOCALE,
  type GalleryItem as SharedGalleryItem,
} from '@ppn/shared-types';
import { ApiException } from '../../common/exceptions/api.exception';
import { translate } from '../../common/utils/i18n.util';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  CreateGalleryItemDto,
  UpdateGalleryItemDto,
} from './dto/gallery.dto';

function toShared(
  item: {
    id: string;
    media: {
      id: string;
      fileUrl: string;
      fileType: string;
      altText: string;
      width: number | null;
      height: number | null;
      uploadedAt: Date;
    };
    category: string;
    caption: string | null;
    order: number;
    translations?: unknown;
  },
  locale: string = DEFAULT_LOCALE,
): SharedGalleryItem {
  const t = translate(item, item.translations, locale, ['caption']);
  return {
    id: item.id,
    media: {
      id: item.media.id,
      file_url: item.media.fileUrl,
      file_type: item.media.fileType as SharedGalleryItem['media']['file_type'],
      alt_text: item.media.altText,
      width: item.media.width,
      height: item.media.height,
      uploaded_at: item.media.uploadedAt.toISOString(),
    },
    category: item.category as SharedGalleryItem['category'],
    caption: t.caption,
    order: item.order,
  };
}

@Injectable()
export class GalleryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(category?: string, locale?: string) {
    const items = await this.prisma.galleryItem.findMany({
      where: category ? { category: category as never } : undefined,
      include: { media: true },
      orderBy: { order: 'asc' },
    });
    return items.map((item) => toShared(item, locale));
  }

  async create(dto: CreateGalleryItemDto) {
    const item = await this.prisma.galleryItem.create({
      data: {
        mediaId: dto.media_id,
        category: dto.category,
        caption: dto.caption,
        order: dto.order ?? 0,
        translations: dto.translations,
      },
      include: { media: true },
    });
    return toShared(item);
  }

  async update(id: string, dto: UpdateGalleryItemDto) {
    await this.assertExists(id);
    const item = await this.prisma.galleryItem.update({
      where: { id },
      data: {
        category: dto.category,
        caption: dto.caption,
        order: dto.order,
        translations: dto.translations,
      },
      include: { media: true },
    });
    return toShared(item);
  }

  async remove(id: string) {
    await this.assertExists(id);
    await this.prisma.galleryItem.delete({ where: { id } });
    return { deleted: true };
  }

  private async assertExists(id: string) {
    const item = await this.prisma.galleryItem.findUnique({ where: { id } });
    if (!item)
      throw new ApiException('NOT_FOUND', 'Gallery item not found.', 404);
  }
}
