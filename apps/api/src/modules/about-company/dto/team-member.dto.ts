import {
  normalizeTranslationsInput,
  type TranslationsInput,
} from '../../../common/dto/translations.dto';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import {
  IsOptionalEmail,
  IsOptionalPhone,
  IsOptionalUrl,
} from './optional-contact.validators';

/** Brief items 35/36: name and position are required and capped at 100 characters. */
const NAME_MAX = 100;
const POSITION_MAX = 100;
const DEPARTMENT_MAX = 60;

/** Trims before validation, so a whitespace-only value fails `MinLength(1)` instead of being
 * stored as a blank-looking name. Without this, "   " passes every length check. */
const Trimmed = () =>
  Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  );

export class CreateTeamMemberDto {
  @Trimmed()
  @IsString()
  @MinLength(1)
  @MaxLength(NAME_MAX)
  name!: string;

  @Trimmed()
  @IsString()
  @MinLength(1)
  @MaxLength(POSITION_MAX)
  position!: string;

  @IsOptional()
  @IsString()
  biography?: string;

  @IsOptional()
  @IsString()
  responsibilities?: string;

  @IsOptional()
  @IsString()
  @MaxLength(DEPARTMENT_MAX)
  department?: string | null;

  @IsOptional()
  @IsString()
  photo_id?: string;

  @IsOptionalUrl()
  linkedin_url?: string | null;

  @IsOptionalEmail()
  email?: string | null;

  @IsOptionalPhone()
  phone?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    normalizeTranslationsInput(value),
  )
  @IsObject()
  translations?: TranslationsInput;
}

export class UpdateTeamMemberDto {
  // `ValidateIf` rather than `IsOptional` so a PATCH that *does* send `name` still has to send
  // a non-empty one — clearing a required field must fail, not silently blank the record.
  @ValidateIf((_, value) => value !== undefined)
  @Trimmed()
  @IsString()
  @MinLength(1)
  @MaxLength(NAME_MAX)
  name?: string;

  @ValidateIf((_, value) => value !== undefined)
  @Trimmed()
  @IsString()
  @MinLength(1)
  @MaxLength(POSITION_MAX)
  position?: string;

  @IsOptional()
  @IsString()
  biography?: string;

  @IsOptional()
  @IsString()
  responsibilities?: string;

  @IsOptional()
  @IsString()
  @MaxLength(DEPARTMENT_MAX)
  department?: string | null;

  @IsOptional()
  @IsString()
  photo_id?: string | null;

  @IsOptionalUrl()
  linkedin_url?: string | null;

  @IsOptionalEmail()
  email?: string | null;

  @IsOptionalPhone()
  phone?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    normalizeTranslationsInput(value),
  )
  @IsObject()
  translations?: TranslationsInput;
}

export class UpdateAboutCompanyTeamSectionDto {
  @IsOptional()
  @IsString()
  eyebrow?: string;

  @IsOptional()
  @IsString()
  heading?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  cta_label?: string | null;

  @IsOptional()
  @IsString()
  cta_href?: string | null;

  @IsOptional()
  @IsBoolean()
  show_counter?: boolean;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    normalizeTranslationsInput(value),
  )
  @IsObject()
  translations?: TranslationsInput;
}
