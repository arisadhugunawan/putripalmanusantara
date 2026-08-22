import type { AboutCompanyWhatWeDoSection as SharedWhatWeDoSection } from '@ppn/shared-types';
import { DEFAULT_LOCALE } from '@ppn/shared-types';
import type { AboutCompanyWhatWeDoSectionModel as WhatWeDoSection } from '../../../generated/prisma/models';
import { translate } from '../../common/utils/i18n.util';

export function toAboutCompanyWhatWeDoSection(
  entry: WhatWeDoSection,
  locale: string = DEFAULT_LOCALE,
): SharedWhatWeDoSection {
  const t = translate(entry, entry.translations, locale, [
    'eyebrow',
    'heading',
    'description',
    'whoHeading',
    'whoDescription',
    'buyerCtaHeading',
    'buyerCtaDescription',
    'buyerCtaButtonText',
    'supplierCtaHeading',
    'supplierCtaDescription',
    'supplierCtaButtonText',
  ]);
  return {
    id: entry.id,
    eyebrow: t.eyebrow,
    heading: t.heading,
    description: t.description,
    who_heading: t.whoHeading,
    who_description: t.whoDescription,
    buyer_cta_heading: t.buyerCtaHeading,
    buyer_cta_description: t.buyerCtaDescription,
    buyer_cta_button_text: t.buyerCtaButtonText,
    supplier_cta_heading: t.supplierCtaHeading,
    supplier_cta_description: t.supplierCtaDescription,
    supplier_cta_button_text: t.supplierCtaButtonText,
    translations: entry.translations as SharedWhatWeDoSection['translations'],
  };
}
