import type { AboutCompanyShipmentTermsSection as SharedShipmentTermsSection } from '@ppn/shared-types';
import { DEFAULT_LOCALE } from '@ppn/shared-types';
import type { AboutCompanyShipmentTermsSectionModel as ShipmentTermsSection } from '../../../generated/prisma/models';
import { translate } from '../../common/utils/i18n.util';

export function toAboutCompanyShipmentTermsSection(
  entry: ShipmentTermsSection,
  locale: string = DEFAULT_LOCALE,
): SharedShipmentTermsSection {
  const t = translate(entry, entry.translations, locale, [
    'eyebrow',
    'heading',
    'introduction',
    'commitmentTitle',
    'commitmentDescription',
    'ctaLabel',
  ]);
  return {
    id: entry.id,
    eyebrow: t.eyebrow,
    heading: t.heading,
    introduction: t.introduction,
    commitment_title: t.commitmentTitle,
    commitment_description: t.commitmentDescription,
    cta_label: t.ctaLabel,
    // Not translated — a URL/anchor and a boolean toggle are not language-dependent content.
    cta_href: entry.ctaHref,
    cta_open_new_tab: entry.ctaOpenNewTab,
    translations:
      entry.translations as SharedShipmentTermsSection['translations'],
  };
}
