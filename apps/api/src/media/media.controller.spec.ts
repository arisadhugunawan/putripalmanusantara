/* eslint-disable @typescript-eslint/unbound-method -- every `MediaController.prototype.x`
 * reference below is a metadata lookup key (passed to `Reflect.getMetadata` or returned from a
 * mock `getHandler()`), never an actual unbound method call — `this` binding is irrelevant. */
import { ROLES_KEY } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { MediaController } from './media.controller';

/** `RolesGuard`'s own logic (allow/reject by role) is already covered generically in
 * `roles.guard.spec.ts`. What's specific to this controller — and what a future edit could
 * silently break — is which exact method carries `@Roles('super_admin')`. These tests read
 * that metadata directly off the controller class, the same way Nest's `Reflector` does at
 * request time, rather than standing up a full HTTP harness this codebase doesn't otherwise use. */
describe('MediaController — permanent-delete authorization', () => {
  it('restricts permanentDelete to super_admin only', () => {
    const roles = Reflect.getMetadata(
      ROLES_KEY,
      MediaController.prototype.permanentDelete,
    ) as string[] | undefined;

    expect(roles).toEqual(['super_admin']);
  });

  it('leaves trash, restore, upload, findAll, and getUsage open to every authenticated admin', () => {
    const unrestrictedMethods = [
      'findAll',
      'upload',
      'getUsage',
      'trash',
      'restore',
    ] as const;

    for (const method of unrestrictedMethods) {
      const roles = Reflect.getMetadata(
        ROLES_KEY,
        MediaController.prototype[method],
      ) as string[] | undefined;
      expect(roles).toBeUndefined();
    }
  });

  it('RolesGuard rejects an editor and admits a super_admin for the exact metadata this controller declares', () => {
    const reflector = {
      getAllAndOverride: () =>
        Reflect.getMetadata(
          ROLES_KEY,
          MediaController.prototype.permanentDelete,
        ) as string[] | undefined,
    } as never;
    const guard = new RolesGuard(reflector);
    const buildContext = (role?: 'editor' | 'super_admin') =>
      ({
        getHandler: () => MediaController.prototype.permanentDelete,
        getClass: () => MediaController,
        switchToHttp: () => ({
          getRequest: () => ({
            user: role
              ? { id: '1', name: 'A', email: 'a@x.com', role }
              : undefined,
          }),
        }),
      }) as never;

    expect(() => guard.canActivate(buildContext('editor'))).toThrow();
    expect(guard.canActivate(buildContext('super_admin'))).toBe(true);
  });
});
