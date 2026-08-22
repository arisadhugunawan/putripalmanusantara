import type { ShipmentDocument as SharedShipmentDocument } from '@ppn/shared-types';
import { DEFAULT_LOCALE } from '@ppn/shared-types';
import type { ShipmentDocumentModel as ShipmentDocument } from '../../../generated/prisma/models';
import { translate } from '../../common/utils/i18n.util';

export function toShipmentDocument(
  entry: ShipmentDocument,
  locale: string = DEFAULT_LOCALE,
): SharedShipmentDocument {
  const t = translate(entry, entry.translations, locale, [
    'name',
    'description',
  ]);
  return {
    id: entry.id,
    name: t.name,
    description: t.description,
    // Not translated — a URL is not language-dependent content.
    url: entry.url,
    order: entry.order,
    active: entry.active,
    translations: entry.translations as SharedShipmentDocument['translations'],
  };
}
