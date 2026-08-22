import type { ShipmentLoadingLocation as SharedShipmentLoadingLocation } from '@ppn/shared-types';
import { DEFAULT_LOCALE } from '@ppn/shared-types';
import type { ShipmentLoadingLocationModel as ShipmentLoadingLocation } from '../../../generated/prisma/models';
import { translate } from '../../common/utils/i18n.util';

export function toShipmentLoadingLocation(
  entry: ShipmentLoadingLocation,
  locale: string = DEFAULT_LOCALE,
): SharedShipmentLoadingLocation {
  const t = translate(entry, entry.translations, locale, [
    'name',
    'region',
    'country',
  ]);
  return {
    id: entry.id,
    name: t.name,
    region: t.region,
    country: t.country,
    // Not translated — a URL is not language-dependent content.
    maps_url: entry.mapsUrl,
    order: entry.order,
    active: entry.active,
    translations:
      entry.translations as SharedShipmentLoadingLocation['translations'],
  };
}
