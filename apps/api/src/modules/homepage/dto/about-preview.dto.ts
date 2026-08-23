import { Transform } from 'class-transformer';
import {
  normalizeTranslationsInput,
  type TranslationsInput,
} from '../../../common/dto/translations.dto';
import {
  IsBoolean,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

const VIDEO_SOURCES = ['none', 'youtube', 'vimeo', 'upload'];

export class UpdateAboutPreviewDto {
  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  heading?: string;

  @IsOptional()
  @IsString()
  paragraph_1?: string;

  @IsOptional()
  @IsString()
  paragraph_2?: string;

  @IsOptional()
  @IsString()
  paragraph_3?: string;

  @IsOptional()
  @IsString()
  cta_text?: string;

  @IsOptional()
  @IsString()
  cta_link?: string;

  @IsOptional()
  @IsIn(VIDEO_SOURCES)
  video_source?: string;

  @IsOptional()
  @IsString()
  video_url?: string;

  @IsOptional()
  @IsString()
  video_media_id?: string;

  @IsOptional()
  @IsString()
  video_thumbnail_id?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    normalizeTranslationsInput(value),
  )
  @IsObject()
  translations?: TranslationsInput;
}
