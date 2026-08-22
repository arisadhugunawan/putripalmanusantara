import type { LegalDocumentCategory as SharedCategory } from '@ppn/shared-types';
import { DEFAULT_LOCALE } from '@ppn/shared-types';
import type { LegalDocumentCategoryModel as Category } from '../../../generated/prisma/models';
import { translate } from '../../common/utils/i18n.util';

export function toLegalDocumentCategory(
  entry: Category,
  locale: string = DEFAULT_LOCALE,
): SharedCategory {
  const t = translate(entry, entry.translations, locale, [
    'name',
    'description',
  ]);
  return {
    id: entry.id,
    name: t.name,
    slug: entry.slug,
    description: t.description ?? null,
    order: entry.order,
    active: entry.active,
    translations: entry.translations as SharedCategory['translations'],
  };
}
