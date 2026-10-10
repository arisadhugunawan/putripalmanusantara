import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { tap } from 'rxjs/operators';
import type { CurrentAdminPayload } from '../decorators/current-admin.decorator';
import { ActivityLogService } from './activity-log.service';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const ADMIN_PREFIX = '/api/v1/admin/';

export function deriveModule(path: string): string {
  const idx = path.indexOf(ADMIN_PREFIX);
  const rest = idx >= 0 ? path.slice(idx + ADMIN_PREFIX.length) : '';
  return rest.split('/').filter(Boolean)[0] ?? 'unknown';
}

export function deriveAction(
  method: string,
  path: string,
  mod: string,
): string {
  const lower = path.toLowerCase();
  if (lower.endsWith('/logout')) return 'LOGOUT';
  if (lower.endsWith('/publish')) return 'PUBLISH';
  if (lower.endsWith('/unpublish')) return 'UNPUBLISH';
  if (lower.includes('/restore')) return 'RESTORE';
  // Phase 17C: deliberately lowercase snake_case (unlike every other branch here) to match the
  // action-naming convention BusinessActivityLog already uses on the external side
  // (`login_success`, `member_approved`, ...) — these four describe a BusinessRelationship
  // lifecycle event, not a generic CRUD verb, so they intentionally don't follow this
  // interceptor's own ALL_CAPS style.
  if (lower.endsWith('/approve')) return 'relationship_approved';
  if (lower.endsWith('/reject')) return 'relationship_rejected';
  if (lower.endsWith('/suspend')) return 'relationship_suspended';
  if (lower.endsWith('/reactivate')) return 'relationship_reactivated';
  if (mod === 'media' && method === 'POST') return 'UPLOAD';
  if (mod === 'media' && method === 'DELETE') return 'MEDIA_DELETE';
  if (mod === 'ai' && lower.endsWith('/settings') && method === 'PUT')
    return 'AI_SETTINGS_UPDATE';
  if (mod === 'ai' && lower.endsWith('/sync')) return 'AI_SYNC';
  if (lower.endsWith('/status')) return 'STATUS_UPDATE';
  if (mod === 'settings' || mod === 'branding')
    return `SETTINGS_${method === 'DELETE' ? 'DELETE' : 'UPDATE'}`;
  switch (method) {
    case 'POST':
      return 'CREATE';
    case 'PUT':
    case 'PATCH':
      return 'UPDATE';
    case 'DELETE':
      return 'DELETE';
    default:
      return method;
  }
}

function deriveEntityId(
  params: Record<string, string> | undefined,
): string | null {
  if (!params) return null;
  return params.id ?? Object.values(params)[0] ?? null;
}

/**
 * Global audit-trail interceptor (bound via `APP_INTERCEPTOR`, same pattern as
 * `ResponseInterceptor` and `csrfHeaderMiddleware` before it) — covers every current and future
 * mutating `/api/v1/admin/*` controller automatically, with no per-service instrumentation to
 * remember. Deliberately reads only the URL, HTTP method, route params, the authenticated actor,
 * and the final status code — never the request/response body, so secrets and tokens can never
 * end up in the log by accident.
 *
 * `/admin/auth/login` is not covered here (no `req.user` exists yet at that point in the
 * request) — `AuthController` calls `ActivityLogService.record()` directly on successful login.
 */
@Injectable()
export class ActivityLogInterceptor implements NestInterceptor {
  constructor(private readonly activityLog: ActivityLogService) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: CurrentAdminPayload }>();
    const response = context.switchToHttp().getResponse<Response>();

    const shouldLog =
      MUTATING_METHODS.has(request.method) &&
      request.path.startsWith(ADMIN_PREFIX) &&
      !!request.user;

    if (!shouldLog) return next.handle();

    const user = request.user as CurrentAdminPayload;
    const mod = deriveModule(request.path);

    return next.handle().pipe(
      tap({
        next: () =>
          this.write(request, response, user, mod, response.statusCode || 200),
        error: (err: { status?: number }) =>
          this.write(request, response, user, mod, err?.status ?? 500),
      }),
    );
  }

  private write(
    request: Request,
    _response: Response,
    user: CurrentAdminPayload,
    mod: string,
    statusCode: number,
  ) {
    this.activityLog.record({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: deriveAction(request.method, request.path, mod),
      module: mod,
      entityId: deriveEntityId(request.params as Record<string, string>),
      method: request.method,
      path: request.path,
      statusCode,
    });
  }
}
