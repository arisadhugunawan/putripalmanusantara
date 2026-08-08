import type { HomepageWhyChooseUs as SharedWhyChooseUs } from '@ppn/shared-types';
import { DEFAULT_LOCALE } from '@ppn/shared-types';
import type { HomepageWhyChooseUsModel as WhyChooseUs } from '../../../generated/prisma/models';
import { translate } from '../../common/utils/i18n.util';

export function toWhyChooseUs(
  entry: WhyChooseUs,
  locale: string = DEFAULT_LOCALE,
): SharedWhyChooseUs {
  const t = translate(entry, entry.translations, locale, ['title']);
  return {
    id: entry.id,
    icon: entry.icon,
    title: t.title,
    order: entry.order,
    enabled: entry.enabled,
    featured: entry.featured,
    translations: entry.translations as SharedWhyChooseUs['translations'],
  };
}
