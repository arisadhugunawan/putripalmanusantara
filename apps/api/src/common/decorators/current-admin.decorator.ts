import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export interface CurrentAdminPayload {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'editor';
}

export const CurrentAdmin = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user: CurrentAdminPayload }>();
    return request.user;
  },
);
