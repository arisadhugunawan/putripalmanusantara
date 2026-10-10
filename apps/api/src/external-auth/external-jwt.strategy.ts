import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
import type { CurrentExternalAccountPayload } from './decorators/current-external-account.decorator';
import type { ExternalJwtPayload } from './external-jwt-payload.interface';

function cookieExtractor(cookieName: string) {
  return (req: Request): string | null => {
    return (req?.cookies?.[cookieName] as string | undefined) ?? null;
  };
}

/**
 * Registered under the Passport strategy name "jwt-external" — deliberately never "jwt" (the
 * name Admin's own `JwtStrategy` already owns), so the two can never be confused by
 * `AuthGuard('jwt')` vs `AuthGuard('jwt-external')` resolving to the wrong one.
 */
@Injectable()
export class ExternalJwtStrategy extends PassportStrategy(
  Strategy,
  'jwt-external',
) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: cookieExtractor(
        config.get<string>('EXTERNAL_JWT_COOKIE_NAME', 'ppn_external_token'),
      ),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('EXTERNAL_JWT_SECRET'),
    });
  }

  /** Re-fetches the ExternalAccount fresh on every request — the JWT's own embedded email is
   * never trusted as current truth, only `sub` is used to look up the live row (same discipline
   * as Admin's `JwtStrategy.validate()`). Rejects if the account no longer exists, or if its
   * status is anything other than `active` — a `suspended` account must never pass, and a
   * `pending` account is not yet eligible for authenticated portal access either. */
  async validate(
    payload: ExternalJwtPayload,
  ): Promise<CurrentExternalAccountPayload> {
    const account = await this.prisma.externalAccount.findUnique({
      where: { id: payload.sub },
    });
    if (!account) {
      throw new UnauthorizedException('Account no longer exists.');
    }
    if (account.status !== 'active') {
      throw new UnauthorizedException('Account is not active.');
    }
    return {
      id: account.id,
      email: account.email,
      fullName: account.fullName,
      phone: account.phone,
      status: account.status,
      emailVerifiedAt: account.emailVerifiedAt,
      lastLoginAt: account.lastLoginAt,
    };
  }
}
