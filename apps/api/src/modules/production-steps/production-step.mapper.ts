import type {
  HomepageProcessSection as SharedProcessSection,
  Media as SharedMedia,
  ProductionStep as SharedStep,
  ProductionStepIcon,
} from '@ppn/shared-types';
import { DEFAULT_LOCALE } from '@ppn/shared-types';
import type {
  HomepageProcessSectionModel as ProcessSection,
  MediaModel as Media,
  ProductionStepModel as ProductionStep,
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

export function toProductionStep(
  entry: ProductionStep & { illustration: Media | null },
  locale: string = DEFAULT_LOCALE,
): SharedStep {
  const t = translate(entry, entry.translations, locale, [
    'label',
    'title',
    'description',
  ]);
  return {
    id: entry.id,
    label: t.label,
    title: t.title,
    description: t.description,
    icon: entry.icon as ProductionStepIcon,
    illustration: entry.illustration ? toMedia(entry.illustration) : null,
    cta_label: entry.ctaLabel,
    cta_href: entry.ctaHref,
    order: entry.order,
    active: entry.active,
    translations: entry.translations as SharedStep['translations'],
  };
}

export function toHomepageProcessSection(
  entry: ProcessSection,
  locale: string = DEFAULT_LOCALE,
): SharedProcessSection {
  const t = translate(entry, entry.translations, locale, [
    'eyebrow',
    'heading',
    'description',
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
    final_heading: t.finalHeading,
    final_description: t.finalDescription,
    primary_cta_label: t.primaryCtaLabel,
    primary_cta_href: entry.primaryCtaHref,
    secondary_cta_label: t.secondaryCtaLabel,
    secondary_cta_href: entry.secondaryCtaHref,
    translations: entry.translations as SharedProcessSection['translations'],
  };
}
