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

/** P0.4-D2 — `AdminAiController.test()` previously took raw `@Body('question')`/
 * `@Body('language')` with no validation at all, unlike the public `/ai/chat` endpoint's
 * `AiChatRequestDto` above; a missing/non-string `question` threw an unhandled TypeError
 * inside `AiChatService.chat()`. Mirrors `message`'s/`language`'s validation exactly. */
export class AdminAiTestRequestDto {
  @IsString()
  @MaxLength(1000)
  question!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  language?: string;
}
