import type { TranslationsInput } from '../../../common/dto/translations.dto';
import { IsBoolean, IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateExportReachSectionDto {
  @IsOptional()
  @IsString()
  heading?: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsObject()
  translations?: TranslationsInput;
}
