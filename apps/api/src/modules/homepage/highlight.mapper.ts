import type { HomepageHighlight as SharedHighlight } from '@ppn/shared-types';
import { DEFAULT_LOCALE } from '@ppn/shared-types';
import type { HomepageHighlightModel as Highlight } from '../../../generated/prisma/models';
import { translate } from '../../common/utils/i18n.util';

export function toHighlight(
  highlight: Highlight,
  locale: string = DEFAULT_LOCALE,
): SharedHighlight {
  const t = translate(highlight, highlight.translations, locale, [
    'title',
    'description',
  ]);
  return {
    id: highlight.id,
    icon: highlight.icon,
    title: t.title,
    description: t.description,
    order: highlight.order,
    enabled: highlight.enabled,
    translations: highlight.translations as SharedHighlight['translations'],
  };
}
