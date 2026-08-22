import type { AboutCompanyFact as SharedFact } from '@ppn/shared-types';
import { DEFAULT_LOCALE } from '@ppn/shared-types';
import type { AboutCompanyFactModel as Fact } from '../../../generated/prisma/models';
import { translate } from '../../common/utils/i18n.util';

export function toAboutCompanyFact(
  entry: Fact,
  locale: string = DEFAULT_LOCALE,
): SharedFact {
  const t = translate(entry, entry.translations, locale, ['label', 'value']);
  return {
    id: entry.id,
    label: t.label,
    value: t.value,
    icon: entry.icon,
    order: entry.order,
    active: entry.active,
    translations: entry.translations as SharedFact['translations'],
  };
}
