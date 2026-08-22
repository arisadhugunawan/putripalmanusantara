import type { NextFunction, Request, Response } from 'express';

const PROTECTED_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Lightweight CSRF defense layered on top of the auth cookie's own `SameSite=Lax`: every
 * mutating `/api/v1/admin/*` request must carry `X-Requested-With`. A plain cross-site
 * `<form>` submission — the classic CSRF vector — can only ever send a fixed, browser-controlled
 * header allowlist and can never add a custom one, so this header's presence proves the request
 * came from this app's own JS (`adminApi`'s shared fetch wrapper sets it on every call), not a
 * forged form on another origin riding the visitor's cookie.
 *
 * Deliberately global Express middleware (like `helmet()`/`cookieParser()` in `main.ts`) rather
 * than a per-controller Nest guard — one place to maintain, impossible to forget on a new admin
 * controller. Runs before Nest's routing, so it shapes its own response envelope to match
 * `HttpExceptionFilter`'s `{ success, data, meta, error }` shape.
 */
export function csrfHeaderMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (
    !PROTECTED_METHODS.has(req.method) ||
    !req.path.startsWith('/api/v1/admin/')
  ) {
    next();
    return;
  }

  if (!req.header('x-requested-with')) {
    res.status(403).json({
      success: false,
      data: null,
      meta: null,
      error: {
        code: 'CSRF_HEADER_MISSING',
        message: 'This request is missing a required header.',
      },
    });
    return;
  }

  next();
}
