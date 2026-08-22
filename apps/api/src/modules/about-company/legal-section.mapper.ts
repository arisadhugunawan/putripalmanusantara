import type { AboutCompanyLegalSection as SharedLegalSection } from '@ppn/shared-types';
import { DEFAULT_LOCALE } from '@ppn/shared-types';
import type { AboutCompanyLegalSectionModel as LegalSection } from '../../../generated/prisma/models';
import { translate } from '../../common/utils/i18n.util';

export function toAboutCompanyLegalSection(
  entry: LegalSection,
  locale: string = DEFAULT_LOCALE,
): SharedLegalSection {
  const t = translate(entry, entry.translations, locale, [
    'eyebrow',
    'heading',
    'description',
  ]);
  return {
    id: entry.id,
    eyebrow: t.eyebrow,
    heading: t.heading,
    description: t.description,
    hide_expired: entry.hideExpired,
    translations: entry.translations as SharedLegalSection['translations'],
  };
}
