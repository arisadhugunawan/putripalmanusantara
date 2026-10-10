import type { ExecutionContext } from '@nestjs/common';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import type { CurrentExternalAccountPayload } from './decorators/current-external-account.decorator';

/**
 * Guards every /api/v1/external/* route that requires an authenticated ExternalAccount.
 * Deliberately bound to the "jwt-external" strategy only (never "jwt", which Admin's
 * `JwtAuthGuard` already uses) — an Admin token can never satisfy this guard, and this guard can
 * never resolve an Admin token, because they are verified against entirely different secrets and
 * strategy names.
 *
 * No dev-auth-bypass here: that convenience was requested for Admin's local development only and
 * is deliberately not extended to the External side.
 *
 * Writes the resolved identity to `req.externalAccount` (not `req.user`, which Admin's own
 * `@CurrentAdmin()` path reads) — a second, explicit layer of separation beyond the distinct
 * strategy name, so there is no shared request property either guard could accidentally read.
 */
@Injectable()
export class ExternalJwtAuthGuard extends AuthGuard('jwt-external') {
  handleRequest<TUser = CurrentExternalAccountPayload>(
    err: unknown,
    user: TUser | false,
    _info: unknown,
    context: ExecutionContext,
  ): TUser {
    if (err || !user) {
      throw err instanceof Error
        ? err
        : new UnauthorizedException('Authentication required.');
    }
    const request = context
      .switchToHttp()
      .getRequest<Request & { externalAccount: TUser }>();
    request.externalAccount = user;
    return user;
  }
}
