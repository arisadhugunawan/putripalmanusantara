import type { HomepageShippingSection as SharedShippingSection } from '@ppn/shared-types';
import { DEFAULT_LOCALE } from '@ppn/shared-types';
import type { HomepageShippingSectionModel as ShippingSection } from '../../../generated/prisma/models';
import { translate } from '../../common/utils/i18n.util';

export function toShippingSection(
  entry: ShippingSection,
  locale: string = DEFAULT_LOCALE,
): SharedShippingSection {
  const t = translate(entry, entry.translations, locale, ['title', 'subtitle']);
  return {
    id: entry.id,
    title: t.title,
    subtitle: t.subtitle,
    marquee_duration_seconds: entry.marqueeDurationSeconds,
    show_partner_name: entry.showPartnerName,
    show_relationship_type: entry.showRelationshipType,
    enabled: entry.enabled,
    translations: entry.translations as SharedShippingSection['translations'],
  };
}
