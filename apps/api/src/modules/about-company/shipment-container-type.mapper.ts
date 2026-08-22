import type { ShipmentContainerType as SharedShipmentContainerType } from '@ppn/shared-types';
import { DEFAULT_LOCALE } from '@ppn/shared-types';
import type { ShipmentContainerTypeModel as ShipmentContainerType } from '../../../generated/prisma/models';
import { translate } from '../../common/utils/i18n.util';

export function toShipmentContainerType(
  entry: ShipmentContainerType,
  locale: string = DEFAULT_LOCALE,
): SharedShipmentContainerType {
  const t = translate(entry, entry.translations, locale, ['label']);
  return {
    id: entry.id,
    label: t.label,
    order: entry.order,
    active: entry.active,
    translations:
      entry.translations as SharedShipmentContainerType['translations'],
  };
}
