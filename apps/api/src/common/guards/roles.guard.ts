import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { ApiException } from '../exceptions/api.exception';
import type { CurrentAdminPayload } from '../decorators/current-admin.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Enforces `@Roles(...)` metadata. Must run after `JwtAuthGuard` (so `req.user` is already
 * populated) — routes with no `@Roles()` decorator are left untouched (every authenticated
 * admin may call them), matching this app's existing "editor and super_admin share day-to-day
 * CRUD access" model. Only routes explicitly marked restricted enforce a role check.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<
      CurrentAdminPayload['role'][] | undefined
    >(ROLES_KEY, [context.getHandler(), context.getClass()]);
    if (!required || required.length === 0) return true;

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: CurrentAdminPayload }>();
    const role = request.user?.role;
    if (!role || !required.includes(role)) {
      throw new ApiException(
        'FORBIDDEN',
        'You do not have permission to perform this action.',
        HttpStatus.FORBIDDEN,
      );
    }
    return true;
  }
}
