import type {
  HeroSlide as SharedHeroSlide,
  Media as SharedMedia,
} from '@ppn/shared-types';
import { DEFAULT_LOCALE } from '@ppn/shared-types';
import type {
  HeroSlideModel as HeroSlide,
  MediaModel as Media,
} from '../../../generated/prisma/models';
import { translate } from '../../common/utils/i18n.util';

type HeroSlideWithRelations = HeroSlide & {
  desktopImage: Media | null;
  mobileImage: Media | null;
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

export function toHeroSlide(
  slide: HeroSlideWithRelations,
  locale: string = DEFAULT_LOCALE,
): SharedHeroSlide {
  const t = translate(slide, slide.translations, locale, [
    'eyebrowText',
    'heading',
    'subheading',
    'description',
    'button1Text',
    'button2Text',
  ]);
  return {
    id: slide.id,
    desktop_image: slide.desktopImage ? toMedia(slide.desktopImage) : null,
    mobile_image: slide.mobileImage ? toMedia(slide.mobileImage) : null,
    eyebrow_text: t.eyebrowText,
    heading: t.heading,
    subheading: t.subheading,
    description: t.description,
    button_1_text: t.button1Text,
    button_1_link: slide.button1Link,
    button_1_enabled: slide.button1Enabled,
    button_1_style: slide.button1Style,
    button_2_text: t.button2Text,
    button_2_link: slide.button2Link,
    button_2_enabled: slide.button2Enabled,
    button_2_style: slide.button2Style,
    text_alignment: slide.textAlignment,
    overlay_opacity: slide.overlayOpacity,
    order: slide.order,
    enabled: slide.enabled,
    publish_date: slide.publishDate ? slide.publishDate.toISOString() : null,
    translations: slide.translations as SharedHeroSlide['translations'],
  };
}
