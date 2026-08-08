import type { HomepagePartnersSection as SharedPartnersSection } from '@ppn/shared-types';
import { DEFAULT_LOCALE } from '@ppn/shared-types';
import type { HomepagePartnersSectionModel as PartnersSection } from '../../../generated/prisma/models';
import { translate } from '../../common/utils/i18n.util';

export function toPartnersSection(
  entry: PartnersSection,
  locale: string = DEFAULT_LOCALE,
): SharedPartnersSection {
  const t = translate(entry, entry.translations, locale, ['title', 'subtitle']);
  return {
    id: entry.id,
    title: t.title,
    subtitle: t.subtitle,
    marquee_duration_seconds: entry.marqueeDurationSeconds,
    enabled: entry.enabled,
    translations: entry.translations as SharedPartnersSection['translations'],
  };
}
