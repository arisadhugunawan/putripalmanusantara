import type { FacilitiesFaqProductTag as SharedFacilitiesFaqProductTag } from '@ppn/shared-types';
import { DEFAULT_LOCALE } from '@ppn/shared-types';
import type { FacilitiesFaqProductTagModel as FacilitiesFaqProductTag } from '../../../generated/prisma/models';
import { translate } from '../../common/utils/i18n.util';

export function toFacilitiesFaqProductTag(
  entry: FacilitiesFaqProductTag,
  locale: string = DEFAULT_LOCALE,
): SharedFacilitiesFaqProductTag {
  const t = translate(entry, entry.translations, locale, ['name']);
  return {
    id: entry.id,
    faq_item_id: entry.faqItemId,
    name: t.name,
    order: entry.order,
    active: entry.active,
    translations:
      entry.translations as SharedFacilitiesFaqProductTag['translations'],
  };
}
