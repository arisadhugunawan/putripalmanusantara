import type { AboutCompanyMoqPaymentSection as SharedMoqPaymentSection } from '@ppn/shared-types';
import { DEFAULT_LOCALE } from '@ppn/shared-types';
import type { AboutCompanyMoqPaymentSectionModel as MoqPaymentSection } from '../../../generated/prisma/models';
import { translate } from '../../common/utils/i18n.util';

export function toAboutCompanyMoqPaymentSection(
  entry: MoqPaymentSection,
  locale: string = DEFAULT_LOCALE,
): SharedMoqPaymentSection {
  const t = translate(entry, entry.translations, locale, [
    'eyebrow',
    'heading',
    'introduction',
    'supplyCapacityTitle',
    'supplyCapacityDescription',
    'commitmentTitle',
    'commitmentDescription',
    'ctaTitle',
    'ctaDescription',
    'ctaButtonLabel',
  ]);
  return {
    id: entry.id,
    eyebrow: t.eyebrow,
    heading: t.heading,
    introduction: t.introduction,
    supply_capacity_title: t.supplyCapacityTitle,
    supply_capacity_description: t.supplyCapacityDescription,
    commitment_title: t.commitmentTitle,
    commitment_description: t.commitmentDescription,
    cta_title: t.ctaTitle,
    cta_description: t.ctaDescription,
    cta_button_label: t.ctaButtonLabel,
    // Not translated — a URL/anchor is not language-dependent content.
    cta_button_href: entry.ctaButtonHref,
    translations: entry.translations as SharedMoqPaymentSection['translations'],
  };
}
