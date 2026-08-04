import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * HttpException carrying a stable machine-readable `code`, so the exception filter can
 * populate error.code in the response envelope (docs/05-api.md §1) without guessing it
 * from the HTTP status alone.
 */
export class ApiException extends HttpException {
  constructor(
    public readonly code: string,
    message: string,
    status: HttpStatus,
    public readonly details?: Record<string, unknown>,
  ) {
    super({ code, message, details }, status);
  }
}

/** docs/05-api.md §6 — form submitted without passing honeypot/anti-spam checks. */
export class SpamValidationException extends ApiException {
  constructor() {
    super(
      'SPAM_VALIDATION_FAILED',
      'Submission rejected by spam validation.',
      HttpStatus.BAD_REQUEST,
    );
  }
}
