import type { HomepageExportReach as SharedExportReachSection } from '@ppn/shared-types';
import { DEFAULT_LOCALE } from '@ppn/shared-types';
import type { HomepageExportReachModel as ExportReachSection } from '../../../generated/prisma/models';
import { translate } from '../../common/utils/i18n.util';

export function toExportReachSection(
  entry: ExportReachSection,
  locale: string = DEFAULT_LOCALE,
): SharedExportReachSection {
  const t = translate(entry, entry.translations, locale, [
    'heading',
    'subtitle',
  ]);
  return {
    id: entry.id,
    heading: t.heading,
    subtitle: t.subtitle,
    enabled: entry.enabled,
    translations:
      entry.translations as SharedExportReachSection['translations'],
  };
}
