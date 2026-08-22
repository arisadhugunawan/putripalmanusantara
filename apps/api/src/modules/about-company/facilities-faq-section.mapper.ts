import type { AboutCompanyFacilitiesFaqSection as SharedFacilitiesFaqSection } from '@ppn/shared-types';
import { DEFAULT_LOCALE } from '@ppn/shared-types';
import type { AboutCompanyFacilitiesFaqSectionModel as FacilitiesFaqSection } from '../../../generated/prisma/models';
import { translate } from '../../common/utils/i18n.util';

export function toAboutCompanyFacilitiesFaqSection(
  entry: FacilitiesFaqSection,
  locale: string = DEFAULT_LOCALE,
): SharedFacilitiesFaqSection {
  const t = translate(entry, entry.translations, locale, [
    'eyebrow',
    'heading',
    'description',
    'ctaTitle',
    'ctaDescription',
    'ctaPrimaryLabel',
    'ctaSecondaryLabel',
  ]);
  return {
    id: entry.id,
    eyebrow: t.eyebrow,
    heading: t.heading,
    description: t.description,
    accordion_mode: entry.accordionMode as 'single' | 'multiple',
    cta_title: t.ctaTitle,
    cta_description: t.ctaDescription,
    cta_primary_label: t.ctaPrimaryLabel,
    // Not translated — a URL is not language-dependent content.
    cta_primary_href: entry.ctaPrimaryHref,
    cta_secondary_label: t.ctaSecondaryLabel,
    cta_secondary_href: entry.ctaSecondaryHref,
    translations:
      entry.translations as SharedFacilitiesFaqSection['translations'],
  };
}
