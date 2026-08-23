import {
  normalizeTranslationsInput,
  type TranslationsInput,
} from '../../../common/dto/translations.dto';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';

export const GALLERY_MEDIA_TYPES = [
  'image',
  'video',
  'youtube',
  'tiktok',
] as const;

export class CreateGalleryItemDto {
  @IsOptional()
  @IsIn(GALLERY_MEDIA_TYPES)
  media_type?: (typeof GALLERY_MEDIA_TYPES)[number];

  // Required for image/video, ignored for youtube/tiktok.
  @ValidateIf(
    (dto: CreateGalleryItemDto) =>
      dto.media_type !== 'youtube' && dto.media_type !== 'tiktok',
  )
  @IsString()
  @MinLength(1)
  media_id?: string;

  // Required for youtube/tiktok. Only presence/non-empty is enforced here — the specific
  // per-platform pattern (TikTokEmbed.tsx / YouTubeVideoEmbed.tsx already use the same regexes
  // client-side) is checked in GalleryService, since a single property can't cleanly host two
  // mutually-exclusive @ValidateIf-gated @Matches groups (class-validator skips the whole
  // property, not just one group, when any one of several stacked conditions is false).
  @ValidateIf(
    (dto: CreateGalleryItemDto) =>
      dto.media_type === 'youtube' || dto.media_type === 'tiktok',
  )
  @IsString()
  @MinLength(1)
  external_url?: string;

  @IsString()
  @MinLength(1)
  category_id!: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  caption?: string;

  @IsOptional()
  @IsString()
  alt_text?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsDateString()
  captured_at?: string;

  @IsOptional()
  @IsString()
  short_description?: string;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  /** Structurally normalized (unknown locale keys / non-string field values silently
   * dropped, see `normalizeTranslationsInput()`) but not field-name-whitelisted —
   * Phase P0.3-E pilot. */
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    normalizeTranslationsInput(value),
  )
  @IsObject()
  translations?: TranslationsInput;
}

export class UpdateGalleryItemDto {
  @IsOptional()
  @IsIn(GALLERY_MEDIA_TYPES)
  media_type?: (typeof GALLERY_MEDIA_TYPES)[number];

  @IsOptional()
  @IsString()
  media_id?: string;

  @IsOptional()
  @IsString()
  external_url?: string;

  @IsOptional()
  @IsString()
  category_id?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  caption?: string;

  @IsOptional()
  @IsString()
  alt_text?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsDateString()
  captured_at?: string;

  @IsOptional()
  @IsString()
  short_description?: string;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  /** Structurally normalized (unknown locale keys / non-string field values silently
   * dropped, see `normalizeTranslationsInput()`) but not field-name-whitelisted —
   * Phase P0.3-E pilot. */
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    normalizeTranslationsInput(value),
  )
  @IsObject()
  translations?: TranslationsInput;
}
