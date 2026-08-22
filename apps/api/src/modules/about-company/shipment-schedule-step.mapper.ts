import type {
  ShipmentScheduleStep as SharedShipmentScheduleStep,
  ShipmentIcon,
} from '@ppn/shared-types';
import { DEFAULT_LOCALE } from '@ppn/shared-types';
import type { ShipmentScheduleStepModel as ShipmentScheduleStep } from '../../../generated/prisma/models';
import { translate } from '../../common/utils/i18n.util';

export function toShipmentScheduleStep(
  entry: ShipmentScheduleStep,
  locale: string = DEFAULT_LOCALE,
): SharedShipmentScheduleStep {
  const t = translate(entry, entry.translations, locale, [
    'name',
    'description',
  ]);
  return {
    id: entry.id,
    name: t.name,
    description: t.description,
    icon: entry.icon as ShipmentIcon,
    order: entry.order,
    active: entry.active,
    translations:
      entry.translations as SharedShipmentScheduleStep['translations'],
  };
}
