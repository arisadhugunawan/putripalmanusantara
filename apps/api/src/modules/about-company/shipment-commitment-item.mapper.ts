import type {
  ShipmentCommitmentItem as SharedShipmentCommitmentItem,
  ShipmentIcon,
} from '@ppn/shared-types';
import { DEFAULT_LOCALE } from '@ppn/shared-types';
import type { ShipmentCommitmentItemModel as ShipmentCommitmentItem } from '../../../generated/prisma/models';
import { translate } from '../../common/utils/i18n.util';

export function toShipmentCommitmentItem(
  entry: ShipmentCommitmentItem,
  locale: string = DEFAULT_LOCALE,
): SharedShipmentCommitmentItem {
  const t = translate(entry, entry.translations, locale, [
    'title',
    'description',
  ]);
  return {
    id: entry.id,
    title: t.title,
    description: t.description,
    icon: entry.icon as ShipmentIcon,
    order: entry.order,
    active: entry.active,
    translations:
      entry.translations as SharedShipmentCommitmentItem['translations'],
  };
}
