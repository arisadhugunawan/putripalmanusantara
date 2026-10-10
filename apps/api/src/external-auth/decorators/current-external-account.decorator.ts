import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

/** Deliberately a separate shape/decorator from Admin's `CurrentAdmin`/`CurrentAdminPayload` —
 * never reused across the two identity types. */
export interface CurrentExternalAccountPayload {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  status: string;
  emailVerifiedAt: Date | null;
  lastLoginAt: Date | null;
}

export const CurrentExternalAccount = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx
      .switchToHttp()
      .getRequest<
        Request & { externalAccount: CurrentExternalAccountPayload }
      >();
    return request.externalAccount;
  },
);
