import type {
  AboutCompanyGalleryImage as SharedGalleryImage,
  AboutCompanyProfile as SharedProfile,
  Media as SharedMedia,
} from '@ppn/shared-types';
import { DEFAULT_LOCALE } from '@ppn/shared-types';
import type {
  AboutCompanyGalleryImageModel as GalleryImage,
  AboutCompanyProfileModel as Profile,
  MediaModel as Media,
} from '../../../generated/prisma/models';
import { translate } from '../../common/utils/i18n.util';
import { sanitizeRichText } from '../../common/utils/sanitize-rich-text.util';

type ProfileWithRelations = Profile & {
  mainImage: Media | null;
  storyImage: Media | null;
  gallery: (GalleryImage & { media: Media })[];
};

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

function toGalleryImage(
  entry: GalleryImage & { media: Media },
): SharedGalleryImage {
  return {
    id: entry.id,
    media: toMedia(entry.media),
    caption: entry.caption,
    alt_text: entry.altText,
    order: entry.order,
    featured: entry.featured,
  };
}

export function toAboutCompanyProfile(
  entry: ProfileWithRelations,
  locale: string = DEFAULT_LOCALE,
): SharedProfile {
  const t = translate(entry, entry.translations, locale, [
    'headline',
    'shortDescription',
    'mainDescription',
    'vision',
    'mission',
    'companyOverview',
    'eyebrow',
    'subheading',
    'socialLabel',
    'storyLabel',
    'storyHeading',
    'storyDescription',
    'storySecondaryDescription',
    'scopeLabel',
    'scopeHeading',
    'scopeDescription',
    'factsLabel',
    'factsHeading',
    'exportLabel',
    'exportHeading',
    'exportDescription',
    'legalLabel',
    'legalHeading',
    'businessType',
    'registeredAddress',
    'closingLabel',
    'closingHeading',
    'closingDescription',
  ]);
  return {
    id: entry.id,
    headline: t.headline,
    short_description: t.shortDescription,
    // Read-time defense-in-depth on top of the write-time sanitization in
    // AboutCompanyService.updateProfile() — belt-and-suspenders against any row saved before
    // this fix shipped; a no-op for already-clean HTML, so safe to apply unconditionally.
    main_description: sanitizeRichText(t.mainDescription),
    vision: t.vision,
    mission: t.mission,
    company_overview: sanitizeRichText(t.companyOverview),
    main_image: entry.mainImage ? toMedia(entry.mainImage) : null,
    gallery: [...entry.gallery]
      .sort((a, b) => a.order - b.order)
      .map(toGalleryImage),

    eyebrow: t.eyebrow,
    subheading: t.subheading,
    cta_label: entry.ctaLabel,
    cta_href: entry.ctaHref,
    // Deliberately not translated: the same video/URL is correct in every language.
    youtube_video_url: entry.youtubeVideoUrl,
    social_label: t.socialLabel,
    social_visible: entry.socialVisible,

    story_label: t.storyLabel,
    story_heading: t.storyHeading,
    story_description: t.storyDescription,
    story_secondary_description: t.storySecondaryDescription,
    story_image: entry.storyImage ? toMedia(entry.storyImage) : null,
    story_visible: entry.storyVisible,

    scope_label: t.scopeLabel,
    scope_heading: t.scopeHeading,
    scope_description: t.scopeDescription,
    scope_visible: entry.scopeVisible,

    facts_label: t.factsLabel,
    facts_heading: t.factsHeading,
    facts_visible: entry.factsVisible,

    export_label: t.exportLabel,
    export_heading: t.exportHeading,
    export_description: t.exportDescription,
    export_visible: entry.exportVisible,

    legal_label: t.legalLabel,
    legal_heading: t.legalHeading,
    business_type: t.businessType,
    registered_address: t.registeredAddress,
    // Deliberately not translated: an identification number and a year are the same in
    // every language, and translating them would invite divergent legal data.
    business_id_number: entry.businessIdNumber,
    established_year: entry.establishedYear,
    legal_visible: entry.legalVisible,

    closing_label: t.closingLabel,
    closing_heading: t.closingHeading,
    closing_description: t.closingDescription,
    closing_cta_label: entry.closingCtaLabel,
    closing_cta_href: entry.closingCtaHref,
    closing_visible: entry.closingVisible,

    translations: entry.translations as SharedProfile['translations'],
  };
}
