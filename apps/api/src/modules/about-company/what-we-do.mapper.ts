import type {
  Media as SharedMedia,
  WhatWeDoItem as SharedWhatWeDoItem,
} from '@ppn/shared-types';
import { DEFAULT_LOCALE } from '@ppn/shared-types';
import type {
  MediaModel as Media,
  ProductModel as Product,
  WhatWeDoItemModel as WhatWeDoItem,
} from '../../../generated/prisma/models';
import { translate } from '../../common/utils/i18n.util';

type WhatWeDoItemWithRelations = WhatWeDoItem & {
  media: Media | null;
  product?:
    | (Pick<Product, 'id' | 'slug' | 'name'> & { coverImage: Media | null })
    | null;
};

function toMedia(media: Media): SharedMedia {
  return {
    id: media.id,
    file_url: media.fileUrl,
    file_type: media.fileType,
    alt_text: media.altText,
    width: media.width,
    height: media.height,
    uploaded_at: media.uploadedAt.toISOString(),
  };
}

export function toWhatWeDoItem(
  entry: WhatWeDoItemWithRelations,
  locale: string = DEFAULT_LOCALE,
): SharedWhatWeDoItem {
  const t = translate(entry, entry.translations, locale, [
    'title',
    'shortDescription',
    'detailedDescription',
  ]);
  return {
    id: entry.id,
    title: t.title,
    short_description: t.shortDescription,
    detailed_description: t.detailedDescription,
    key_points: entry.keyPoints,
    media: entry.media ? toMedia(entry.media) : null,
    product: entry.product
      ? {
          id: entry.product.id,
          slug: entry.product.slug,
          name: entry.product.name,
          cover_image: entry.product.coverImage
            ? toMedia(entry.product.coverImage)
            : null,
        }
      : null,
    order: entry.order,
    active: entry.active,
    featured: entry.featured,
    translations: entry.translations as SharedWhatWeDoItem['translations'],
  };
}
