import type { AboutCompanySocialLink as SharedSocialLink } from '@ppn/shared-types';
import type { AboutCompanySocialLinkModel as SocialLink } from '../../../generated/prisma/models';

export function toAboutCompanySocialLink(entry: SocialLink): SharedSocialLink {
  return {
    id: entry.id,
    platform: entry.platform,
    display_name: entry.displayName,
    url: entry.url,
    active: entry.active,
    open_in_new_tab: entry.openInNewTab,
    order: entry.order,
    updated_at: entry.updatedAt.toISOString(),
  };
}
