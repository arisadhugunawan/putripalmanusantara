import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export const MEDIA_FILE_TYPES = ['image', 'video', 'pdf'] as const;
export const MEDIA_STATUSES = ['active', 'trash'] as const;

export class MediaQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsIn(MEDIA_FILE_TYPES)
  file_type?: (typeof MEDIA_FILE_TYPES)[number];

  /** Defaults to `active` in the service — `trash` is the Media Library's separate tab. */
  @IsOptional()
  @IsIn(MEDIA_STATUSES)
  status?: (typeof MEDIA_STATUSES)[number];
}
