import type { WhoWeSupplyItem as SharedWhoWeSupplyItem } from '@ppn/shared-types';
import { DEFAULT_LOCALE } from '@ppn/shared-types';
import type { WhoWeSupplyItemModel as WhoWeSupplyItem } from '../../../generated/prisma/models';
import { translate } from '../../common/utils/i18n.util';

export function toWhoWeSupplyItem(
  entry: WhoWeSupplyItem,
  locale: string = DEFAULT_LOCALE,
): SharedWhoWeSupplyItem {
  const t = translate(entry, entry.translations, locale, [
    'title',
    'description',
  ]);
  return {
    id: entry.id,
    title: t.title,
    description: t.description,
    icon: entry.icon,
    order: entry.order,
    active: entry.active,
    translations: entry.translations as SharedWhoWeSupplyItem['translations'],
  };
}
