import type { MoqPaymentBusinessTerm as SharedMoqPaymentBusinessTerm } from '@ppn/shared-types';
import { DEFAULT_LOCALE } from '@ppn/shared-types';
import type { MoqPaymentBusinessTermModel as MoqPaymentBusinessTerm } from '../../../generated/prisma/models';
import { translate } from '../../common/utils/i18n.util';

export function toMoqPaymentBusinessTerm(
  entry: MoqPaymentBusinessTerm,
  locale: string = DEFAULT_LOCALE,
): SharedMoqPaymentBusinessTerm {
  const t = translate(entry, entry.translations, locale, ['label', 'value']);
  return {
    id: entry.id,
    label: t.label,
    value: t.value,
    order: entry.order,
    active: entry.active,
    translations:
      entry.translations as SharedMoqPaymentBusinessTerm['translations'],
  };
}
