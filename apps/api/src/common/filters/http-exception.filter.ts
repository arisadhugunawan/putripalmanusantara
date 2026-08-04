import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import type { ApiError } from '@ppn/shared-types';

const STATUS_CODE_MAP: Record<number, string> = {
  400: 'VALIDATION_ERROR',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  429: 'TOO_MANY_REQUESTS',
  500: 'INTERNAL_SERVER_ERROR',
};

/**
 * Catches every thrown exception and formats it into the error envelope required by
 * docs/05-api.md §1, so callers always get { success:false, data:null, meta:null, error }.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let code = STATUS_CODE_MAP[status] ?? 'INTERNAL_SERVER_ERROR';
    let message = 'An unexpected error occurred.';
    let details: Record<string, unknown> | undefined;

    if (exception instanceof HttpException) {
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else if (typeof body === 'object' && body !== null) {
        const parsed = body as {
          code?: string;
          message?: string | string[];
          details?: Record<string, unknown>;
          error?: string;
        };
        if (parsed.code) code = parsed.code;
        if (Array.isArray(parsed.message)) {
          message = 'Validation failed.';
          details = { fields: parsed.message };
        } else if (parsed.message) {
          message = parsed.message;
        }
        if (parsed.details) details = parsed.details;
      }
    } else if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
    } else {
      this.logger.error('Unknown exception', JSON.stringify(exception));
    }

    const errorBody: ApiError = {
      success: false,
      data: null,
      meta: null,
      error: { code, message, details },
    };

    response.status(status).json(errorBody);
  }
}
