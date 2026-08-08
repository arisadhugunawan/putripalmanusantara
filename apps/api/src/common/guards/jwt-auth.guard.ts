import type { ExecutionContext } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import type { CurrentAdminPayload } from '../decorators/current-admin.decorator';

/** Injected as `req.user` when the dev-only bypass below is active — satisfies
 * CurrentAdminPayload so `/admin/auth/me` and every `@CurrentAdmin()` consumer keep working
 * exactly as if a real admin had logged in. */
const DEV_BYPASS_ADMIN: CurrentAdminPayload = {
  id: 'dev-bypass-admin',
  name: 'Admin PPN (Dev Bypass)',
  email: 'admin@ppn-example.com',
  role: 'super_admin',
};

/**
 * Guards every /admin/* route (docs/05-api.md §2 — admin endpoints require a valid token).
 *
 * DEV-ONLY BYPASS: requested for local convenience — when both `NODE_ENV !== 'production'`
 * AND `ADMIN_AUTH_DISABLED=true` are set, every request is treated as already logged in, so
 * the login form never appears. Both conditions are required so this can never activate in
 * a real deploy even if the env flag is accidentally left set — every production host sets
 * NODE_ENV=production. To turn real login back on, remove/flip ADMIN_AUTH_DISABLED in
 * apps/api/.env (or unset it before any deploy — it must never be set in production).
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    if (
      process.env.NODE_ENV !== 'production' &&
      process.env.ADMIN_AUTH_DISABLED === 'true'
    ) {
      const request = context
        .switchToHttp()
        .getRequest<Request & { user: CurrentAdminPayload }>();
      request.user = DEV_BYPASS_ADMIN;
      return true;
    }
    return super.canActivate(context);
  }
}
