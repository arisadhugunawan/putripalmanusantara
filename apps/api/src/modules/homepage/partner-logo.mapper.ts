import type {
  Media as SharedMedia,
  PartnerLogo as SharedPartnerLogo,
} from '@ppn/shared-types';
import { DEFAULT_LOCALE } from '@ppn/shared-types';
import type {
  MediaModel as Media,
  PartnerLogoModel as PartnerLogo,
} from '../../../generated/prisma/models';
import { translate } from '../../common/utils/i18n.util';

type PartnerLogoWithRelations = PartnerLogo & { logo: Media };

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

export function toPartnerLogo(
  entry: PartnerLogoWithRelations,
  locale: string = DEFAULT_LOCALE,
): SharedPartnerLogo {
  const t = translate(entry, entry.translations, locale, [
    'partnerName',
    'description',
  ]);
  return {
    id: entry.id,
    logo: toMedia(entry.logo),
    partner_name: t.partnerName,
    description: t.description,
    website_url: entry.websiteUrl,
    open_in_new_tab: entry.openInNewTab,
    alt_text: entry.altText,
    category: entry.category,
    order: entry.order,
    enabled: entry.enabled,
    featured: entry.featured,
    translations: entry.translations as SharedPartnerLogo['translations'],
  };
}
