import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/** P0.4-D3 — `syncLogs()` previously parsed `@Query('limit')` via a bare `Number(limit)`; a
 * non-numeric value became `NaN` and reached Prisma's `take` unvalidated, throwing an uncaught
 * client-side error. Mirrors `PaginationQueryDto`'s `limit` constraints, but as its own small
 * DTO rather than the full pagination shape — this endpoint has no `page`/`sort`. */
export class SyncLogsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
