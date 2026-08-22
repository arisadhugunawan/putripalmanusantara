import type {
  MoqPaymentQuickCard as SharedMoqPaymentQuickCard,
  MoqPaymentQuickCardIcon,
} from '@ppn/shared-types';
import { DEFAULT_LOCALE } from '@ppn/shared-types';
import type { MoqPaymentQuickCardModel as MoqPaymentQuickCard } from '../../../generated/prisma/models';
import { translate } from '../../common/utils/i18n.util';

export function toMoqPaymentQuickCard(
  entry: MoqPaymentQuickCard,
  locale: string = DEFAULT_LOCALE,
): SharedMoqPaymentQuickCard {
  const t = translate(entry, entry.translations, locale, ['label', 'value']);
  return {
    id: entry.id,
    label: t.label,
    value: t.value,
    icon: entry.icon as MoqPaymentQuickCardIcon,
    order: entry.order,
    active: entry.active,
    translations:
      entry.translations as SharedMoqPaymentQuickCard['translations'],
  };
}
