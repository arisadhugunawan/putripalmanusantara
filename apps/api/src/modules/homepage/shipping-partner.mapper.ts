import type {
  Media as SharedMedia,
  ShippingPartner as SharedShippingPartner,
} from '@ppn/shared-types';
import { DEFAULT_LOCALE } from '@ppn/shared-types';
import type {
  MediaModel as Media,
  ShippingPartnerModel as ShippingPartner,
} from '../../../generated/prisma/models';
import { translate } from '../../common/utils/i18n.util';

type ShippingPartnerWithRelations = ShippingPartner & { logo: Media };

function toMedia(media: Media): SharedMedia {
  return {
    id: media.id,
    file_url: media.fileUrl,
    file_type: media.fileType,
    alt_text: media.altText,
    width: media.width,
    height: media.height,
    uploaded_at: media.uploadedAt.toISOString(),
  };
}

export function toShippingPartner(
  entry: ShippingPartnerWithRelations,
  locale: string = DEFAULT_LOCALE,
): SharedShippingPartner {
  const t = translate(entry, entry.translations, locale, [
    'partnerName',
    'description',
  ]);
  return {
    id: entry.id,
    logo: toMedia(entry.logo),
    partner_name: t.partnerName,
    relationship_type: entry.relationshipType,
    description: t.description,
    website_url: entry.websiteUrl,
    open_in_new_tab: entry.openInNewTab,
    alt_text: entry.altText,
    order: entry.order,
    enabled: entry.enabled,
    featured: entry.featured,
    updated_at: entry.updatedAt.toISOString(),
    translations: entry.translations as SharedShippingPartner['translations'],
  };
}
