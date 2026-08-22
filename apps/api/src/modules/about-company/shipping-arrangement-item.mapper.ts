import type {
  ShippingArrangementItem as SharedShippingArrangementItem,
  ShipmentIcon,
} from '@ppn/shared-types';
import { DEFAULT_LOCALE } from '@ppn/shared-types';
import type { ShippingArrangementItemModel as ShippingArrangementItem } from '../../../generated/prisma/models';
import { translate } from '../../common/utils/i18n.util';

export function toShippingArrangementItem(
  entry: ShippingArrangementItem,
  locale: string = DEFAULT_LOCALE,
): SharedShippingArrangementItem {
  const t = translate(entry, entry.translations, locale, [
    'title',
    'value',
    'description',
  ]);
  return {
    id: entry.id,
    icon: entry.icon as ShipmentIcon,
    title: t.title,
    value: t.value,
    description: t.description,
    order: entry.order,
    active: entry.active,
    translations:
      entry.translations as SharedShippingArrangementItem['translations'],
  };
}
