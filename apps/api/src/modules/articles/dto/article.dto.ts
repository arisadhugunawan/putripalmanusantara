import {
  normalizeTranslationsInput,
  type TranslationsInput,
} from '../../../common/dto/translations.dto';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

const CONTENT_SOURCES = ['website', 'instagram', 'both'] as const;

export class ArticleStatisticDto {
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  value!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(60)
  label!: string;
}

export class CreateArticleDto {
  // Optional on create only — left blank, the service derives a unique slug from `title`, so
  // the "Instagram → Website" quick-draft flow never blocks on the admin picking a URL slug
  // before they've even settled on a title.
  @IsOptional()
  @IsString()
  @MaxLength(200)
  slug?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @IsString()
  @MinLength(1)
  excerpt!: string;

  @IsString()
  @MinLength(1)
  content!: string;

  @IsOptional()
  @IsString()
  cover_image_id?: string;

  @IsOptional()
  @IsString()
  category_id?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  author?: string;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsIn(CONTENT_SOURCES)
  content_source?: (typeof CONTENT_SOURCES)[number];

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  instagram_caption?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  instagram_url?: string;

  @IsOptional()
  @IsString()
  instagram_date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  instagram_username?: string;

  // Set only by the "Use This Content" step of the Import from Instagram flow — never
  // rendered as an editable field, so a manually-typed URL always leaves this unset.
  @IsOptional()
  @IsString()
  instagram_imported_at?: string;

  @IsOptional()
  @IsString()
  @MaxLength(70)
  meta_title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  meta_description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  canonical_url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  focus_keyword?: string;

  @IsOptional()
  @IsString()
  og_image_id?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  key_takeaways?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(400)
  quote_text?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  quote_author?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(6)
  @ValidateNested({ each: true })
  @Type(() => ArticleStatisticDto)
  statistics?: ArticleStatisticDto[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(60)
  reading_time_minutes?: number;

  @IsOptional()
  @IsIn(['draft', 'published'])
  status?: 'draft' | 'published';

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    normalizeTranslationsInput(value),
  )
  @IsObject()
  translations?: TranslationsInput;
}

export class UpdateArticleDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  excerpt?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  cover_image_id?: string;

  @IsOptional()
  @IsString()
  category_id?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  author?: string;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsIn(CONTENT_SOURCES)
  content_source?: (typeof CONTENT_SOURCES)[number];

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  instagram_caption?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  instagram_url?: string;

  @IsOptional()
  @IsString()
  instagram_date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  instagram_username?: string;

  @IsOptional()
  @IsString()
  instagram_imported_at?: string;

  @IsOptional()
  @IsString()
  @MaxLength(70)
  meta_title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  meta_description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  canonical_url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  focus_keyword?: string;

  @IsOptional()
  @IsString()
  og_image_id?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  key_takeaways?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(400)
  quote_text?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  quote_author?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(6)
  @ValidateNested({ each: true })
  @Type(() => ArticleStatisticDto)
  statistics?: ArticleStatisticDto[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(60)
  reading_time_minutes?: number;

  @IsOptional()
  @IsIn(['draft', 'published'])
  status?: 'draft' | 'published';

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    normalizeTranslationsInput(value),
  )
  @IsObject()
  translations?: TranslationsInput;
}

export class InstagramFetchDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  url!: string;
}

export class ArticleQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit = 10;

  @IsOptional()
  @IsString()
  sort = '-published_at';

  // Not @IsIn(SUPPORTED_LOCALES) on purpose — an unrecognized locale should gracefully fall
  // back to English (see resolveLocale()), not 400 the whole request.
  @IsOptional()
  @IsString()
  locale?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  q?: string;

  @IsOptional()
  @IsString()
  category_id?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  featured?: boolean;
}

export class CreateArticleCategoryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    normalizeTranslationsInput(value),
  )
  @IsObject()
  translations?: TranslationsInput;
}

export class UpdateArticleCategoryDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    normalizeTranslationsInput(value),
  )
  @IsObject()
  translations?: TranslationsInput;
}

export class AddArticleGalleryItemDto {
  @IsString()
  media_id!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  caption?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  alt_text?: string;
}

export class UpdateArticleGalleryItemDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  caption?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  alt_text?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;
}
