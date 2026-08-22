import type {
  HomepageSupplyNetworkSection as SharedSupplyNetworkSection,
  Media as SharedMedia,
  SupplyNetworkConnection as SharedSupplyNetworkConnection,
  SupplyNetworkCountry as SharedSupplyNetworkCountry,
  SupplyNetworkIcon,
  SupplyNetworkItem as SharedSupplyNetworkItem,
  SupplyNetworkPosition,
} from '@ppn/shared-types';
import { DEFAULT_LOCALE } from '@ppn/shared-types';
import type {
  HomepageSupplyNetworkSectionModel as SupplyNetworkSection,
  MediaModel as Media,
  SupplyNetworkConnectionModel as SupplyNetworkConnection,
  SupplyNetworkCountryModel as SupplyNetworkCountry,
  SupplyNetworkItemModel as SupplyNetworkItem,
} from '../../../generated/prisma/models';
import { translate } from '../../common/utils/i18n.util';

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

export function toSupplyNetworkItem(
  entry: SupplyNetworkItem & { illustration: Media | null },
  locale: string = DEFAULT_LOCALE,
): SharedSupplyNetworkItem {
  const t = translate(entry, entry.translations, locale, [
    'label',
    'title',
    'shortTitle',
    'description',
  ]);
  return {
    id: entry.id,
    label: t.label,
    title: t.title,
    short_title: t.shortTitle,
    description: t.description,
    icon: entry.icon as SupplyNetworkIcon,
    illustration: entry.illustration ? toMedia(entry.illustration) : null,
    cta_label: entry.ctaLabel,
    cta_href: entry.ctaHref,
    position: entry.position as SupplyNetworkPosition,
    order: entry.order,
    active: entry.active,
    translations: entry.translations as SharedSupplyNetworkItem['translations'],
  };
}

export function toSupplyNetworkConnection(
  entry: SupplyNetworkConnection,
): SharedSupplyNetworkConnection {
  return {
    id: entry.id,
    from_node_id: entry.fromNodeId,
    to_node_id: entry.toNodeId,
    order: entry.order,
  };
}

export function toSupplyNetworkCountry(
  entry: SupplyNetworkCountry,
  locale: string = DEFAULT_LOCALE,
): SharedSupplyNetworkCountry {
  const t = translate(entry, entry.translations, locale, ['name', 'status']);
  return {
    id: entry.id,
    name: t.name,
    flag_emoji: entry.flagEmoji,
    status: t.status,
    order: entry.order,
    active: entry.active,
    translations:
      entry.translations as SharedSupplyNetworkCountry['translations'],
  };
}

export function toHomepageSupplyNetworkSection(
  entry: SupplyNetworkSection,
  locale: string = DEFAULT_LOCALE,
): SharedSupplyNetworkSection {
  const t = translate(entry, entry.translations, locale, [
    'eyebrow',
    'heading',
    'description',
    'centerLabel',
    'centerTitle',
    'centerDescription',
    'finalHeading',
    'finalDescription',
    'primaryCtaLabel',
    'secondaryCtaLabel',
  ]);
  return {
    id: entry.id,
    eyebrow: t.eyebrow,
    heading: t.heading,
    description: t.description,
    center_label: t.centerLabel,
    center_title: t.centerTitle,
    center_description: t.centerDescription,
    final_heading: t.finalHeading,
    final_description: t.finalDescription,
    primary_cta_label: t.primaryCtaLabel,
    primary_cta_href: entry.primaryCtaHref,
    secondary_cta_label: t.secondaryCtaLabel,
    secondary_cta_href: entry.secondaryCtaHref,
    enable_animation: entry.enableAnimation,
    auto_rotate: entry.autoRotate,
    particle_flow: entry.particleFlow,
    hover_effect: entry.hoverEffect,
    effect_3d: entry.effect3d,
    translations:
      entry.translations as SharedSupplyNetworkSection['translations'],
  };
}
