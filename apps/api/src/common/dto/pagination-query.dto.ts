import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

/** Standard pagination query params — docs/05-api.md §5. */
export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 10;

  @IsOptional()
  @IsString()
  sort = '-created_at';
}

export function parseSort(sort: string): {
  field: string;
  direction: 'asc' | 'desc';
} {
  if (sort.startsWith('-')) {
    return { field: sort.slice(1), direction: 'desc' };
  }
  return { field: sort, direction: 'asc' };
}

export function buildPaginationMeta(
  page: number,
  limit: number,
  total: number,
) {
  return {
    page,
    limit,
    total,
    total_pages: Math.max(1, Math.ceil(total / limit)),
  };
}
