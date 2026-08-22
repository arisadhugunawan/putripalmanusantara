import type { FacilitiesFaqItem as SharedFacilitiesFaqItem } from '@ppn/shared-types';
import { DEFAULT_LOCALE } from '@ppn/shared-types';
import type {
  FacilitiesFaqItemModel as FacilitiesFaqItem,
  FacilitiesFaqProductTagModel as FacilitiesFaqProductTag,
} from '../../../generated/prisma/models';
import { translate } from '../../common/utils/i18n.util';
import { toFacilitiesFaqProductTag } from './facilities-faq-product-tag.mapper';

type FacilitiesFaqItemWithTags = FacilitiesFaqItem & {
  tags: FacilitiesFaqProductTag[];
};

export function toFacilitiesFaqItem(
  entry: FacilitiesFaqItemWithTags,
  locale: string = DEFAULT_LOCALE,
): SharedFacilitiesFaqItem {
  const t = translate(entry, entry.translations, locale, [
    'question',
    'answer',
    'highlightText',
  ]);
  return {
    id: entry.id,
    question: t.question,
    answer: t.answer,
    category: entry.category,
    icon: entry.icon,
    featured: entry.featured,
    highlight_text: t.highlightText || null,
    order: entry.order,
    active: entry.active,
    tags: [...entry.tags]
      .sort((a, b) => a.order - b.order)
      .map((tag) => toFacilitiesFaqProductTag(tag, locale)),
    translations: entry.translations as SharedFacilitiesFaqItem['translations'],
  };
}
