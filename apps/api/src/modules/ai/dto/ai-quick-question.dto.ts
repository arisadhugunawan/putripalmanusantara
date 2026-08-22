import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateAiQuickQuestionDto {
  @IsString()
  @MaxLength(80)
  label!: string;

  @IsString()
  @MaxLength(300)
  question!: string;

  @IsString()
  @MaxLength(5)
  language!: string;
}

export class UpdateAiQuickQuestionDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  label?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  question?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  language?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsInt()
  order?: number;
}
