import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class AiChatMessageDto {
  @IsIn(['user', 'assistant'])
  role!: 'user' | 'assistant';

  @IsString()
  @MaxLength(1000)
  content!: string;
}

export class AiChatPageContextDto {
  @IsString()
  @MaxLength(300)
  path!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  product_slug?: string | null;
}

export class AiChatRequestDto {
  @IsString()
  @MaxLength(100)
  session_id!: string;

  @IsString()
  @MaxLength(1000)
  message!: string;

  @IsString()
  @MaxLength(5)
  language!: string;

  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => AiChatMessageDto)
  history!: AiChatMessageDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => AiChatPageContextDto)
  page_context?: AiChatPageContextDto;
}
