import type { GalleryCategory as SharedGalleryCategory } from '@ppn/shared-types';
import { DEFAULT_LOCALE } from '@ppn/shared-types';
import type { GalleryCategoryModel as GalleryCategory } from '../../../generated/prisma/models';
import { translate } from '../../common/utils/i18n.util';

export function toGalleryCategory(
  entry: GalleryCategory,
  locale: string = DEFAULT_LOCALE,
): SharedGalleryCategory {
  const t = translate(entry, entry.translations, locale, ['name']);
  return {
    id: entry.id,
    name: t.name,
    slug: entry.slug,
    order: entry.order,
    active: entry.active,
    translations: entry.translations as SharedGalleryCategory['translations'],
  };
}
