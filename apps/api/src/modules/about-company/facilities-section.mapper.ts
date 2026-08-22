import type { AboutCompanyFacilitiesSection as SharedFacilitiesSection } from '@ppn/shared-types';
import { DEFAULT_LOCALE } from '@ppn/shared-types';
import type { AboutCompanyFacilitiesSectionModel as FacilitiesSection } from '../../../generated/prisma/models';
import { translate } from '../../common/utils/i18n.util';

export function toAboutCompanyFacilitiesSection(
  entry: FacilitiesSection,
  locale: string = DEFAULT_LOCALE,
): SharedFacilitiesSection {
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
    auto_rotate: entry.autoRotate,
    rotate_interval_seconds: entry.rotateIntervalSeconds,
    translations: entry.translations as SharedFacilitiesSection['translations'],
  };
}
