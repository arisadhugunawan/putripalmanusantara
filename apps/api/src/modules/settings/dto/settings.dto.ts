import { Type } from 'class-transformer';
import { IsArray, IsString, MinLength, ValidateNested } from 'class-validator';

export class SettingItemDto {
  @IsString()
  @MinLength(1)
  key!: string;

  @IsString()
  value!: string;

  @IsString()
  @MinLength(1)
  group!: string;
}

export class UpdateSettingsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SettingItemDto)
  settings!: SettingItemDto[];
}
