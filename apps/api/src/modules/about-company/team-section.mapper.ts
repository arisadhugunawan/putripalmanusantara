import type { AboutCompanyTeamSection as SharedTeamSection } from '@ppn/shared-types';
import { DEFAULT_LOCALE } from '@ppn/shared-types';
import type { AboutCompanyTeamSectionModel as TeamSection } from '../../../generated/prisma/models';
import { translate } from '../../common/utils/i18n.util';

export function toAboutCompanyTeamSection(
  entry: TeamSection,
  locale: string = DEFAULT_LOCALE,
): SharedTeamSection {
  const t = translate(entry, entry.translations, locale, [
    'eyebrow',
    'heading',
    'description',
    'ctaLabel',
  ]);
  return {
    id: entry.id,
    eyebrow: t.eyebrow,
    heading: t.heading,
    description: t.description,
    cta_label: t.ctaLabel,
    cta_href: entry.ctaHref,
    show_counter: entry.showCounter,
    translations: entry.translations as SharedTeamSection['translations'],
  };
}
