import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { ApiException } from '../exceptions/api.exception';
import type { CurrentAdminPayload } from '../decorators/current-admin.decorator';
import { RolesGuard } from './roles.guard';

function buildContext(user?: CurrentAdminPayload): ExecutionContext {
  return {
    getHandler: () => ({}) as never,
    getClass: () => ({}) as never,
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

function buildGuard(requiredRoles: CurrentAdminPayload['role'][] | undefined) {
  const reflector = {
    getAllAndOverride: () => requiredRoles,
  } as unknown as Reflector;
  return new RolesGuard(reflector);
}

describe('RolesGuard', () => {
  // A route with no @Roles() decorator must stay open to every authenticated admin — this is
  // the "restricted by exception, not by default" model the whole app relies on.
  it('allows the request through when the route declares no required roles', () => {
    const guard = buildGuard(undefined);
    expect(
      guard.canActivate(
        buildContext({
          id: '1',
          name: 'Editor',
          email: 'e@x.com',
          role: 'editor',
        }),
      ),
    ).toBe(true);
  });

  it('allows a super_admin through a route restricted to super_admin', () => {
    const guard = buildGuard(['super_admin']);
    expect(
      guard.canActivate(
        buildContext({
          id: '1',
          name: 'Admin',
          email: 'a@x.com',
          role: 'super_admin',
        }),
      ),
    ).toBe(true);
  });

  // The concrete scenario this guard exists for: publish/restore must reject an editor, not
  // silently let them through because a role field merely exists in the schema.
  it('rejects an editor on a route restricted to super_admin', () => {
    const guard = buildGuard(['super_admin']);
    expect(() =>
      guard.canActivate(
        buildContext({
          id: '1',
          name: 'Editor',
          email: 'e@x.com',
          role: 'editor',
        }),
      ),
    ).toThrow(ApiException);
  });

  it('rejects a request with no authenticated user at all', () => {
    const guard = buildGuard(['super_admin']);
    expect(() => guard.canActivate(buildContext(undefined))).toThrow(
      ApiException,
    );
  });
});
