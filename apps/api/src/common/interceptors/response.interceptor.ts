import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { ApiSuccess, PaginationMeta } from '@ppn/shared-types';

export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta;
}

function isPaginated(value: unknown): value is Paginated<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'items' in value &&
    'meta' in value &&
    Array.isArray((value as Paginated<unknown>).items)
  );
}

/**
 * Wraps every controller return value in the response envelope required by
 * docs/05-api.md §1: { success, data, meta, error }.
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiSuccess<T>
> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiSuccess<T>> {
    return next.handle().pipe(
      map((result) => {
        if (isPaginated(result)) {
          return {
            success: true as const,
            data: result.items as T,
            meta: result.meta,
            error: null,
          };
        }
        return {
          success: true as const,
          data: result,
          meta: null,
          error: null,
        };
      }),
    );
  }
}
