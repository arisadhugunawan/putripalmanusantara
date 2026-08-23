import 'reflect-metadata';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import { AdminArticlesController } from './admin-articles.controller';

/** Reads `@Roles()` metadata off a controller method without ever calling it — the
 * `unbound-method` lint rule exists to catch a *detached, invoked* method losing its `this`
 * binding, which does not apply here (the function reference is only used as a Reflect
 * metadata key, never invoked). */
function rolesOf(method: (...args: never[]) => unknown): string[] | undefined {
  return Reflect.getMetadata(ROLES_KEY, method) as string[] | undefined;
}

/**
 * Phase 5F-P0.2 — proves the `@Roles('super_admin')` decorator is actually attached to the
 * publish/unpublish routes (and NOT to ordinary content CRUD), independent of `RolesGuard`'s
 * own logic (already covered by roles.guard.spec.ts / articles.service.spec.ts). A future edit
 * that accidentally deletes the decorator — the actual failure mode this guards against — would
 * pass every other test in this module (the guard and service both behave correctly on their
 * own) but fail exactly this one, since `@Roles`/`SetMetadata` writes reflection metadata
 * directly onto the method, which is what this test reads back.
 */
describe('AdminArticlesController — RBAC decorator placement (Phase 5F-P0.2)', () => {
  it('restricts publish() to super_admin', () => {
    // eslint-disable-next-line @typescript-eslint/unbound-method -- read as a Reflect metadata key only, never invoked/bound
    expect(rolesOf(AdminArticlesController.prototype.publish)).toEqual([
      'super_admin',
    ]);
  });

  it('restricts unpublish() to super_admin', () => {
    // eslint-disable-next-line @typescript-eslint/unbound-method -- read as a Reflect metadata key only, never invoked/bound
    expect(rolesOf(AdminArticlesController.prototype.unpublish)).toEqual([
      'super_admin',
    ]);
  });

  // Phase 5F-P0.2b-C — restore is exactly as sensitive as publish/unpublish (it moves an
  // Article back to `published` with new public content), so it gets the identical guard.
  it('restricts restoreSnapshot() to super_admin', () => {
    // eslint-disable-next-line @typescript-eslint/unbound-method -- read as a Reflect metadata key only, never invoked/bound
    const restoreSnapshot = AdminArticlesController.prototype.restoreSnapshot;
    expect(rolesOf(restoreSnapshot)).toEqual(['super_admin']);
  });

  // listSnapshots is a read-only history view — same open-to-any-authenticated-admin
  // convention as ProductsService's `GET :id/preview`/`GET :id/snapshots` routes (brief §23:
  // "History listing may follow existing Product permission convention").
  it('does not restrict listSnapshots() to any role', () => {
    // eslint-disable-next-line @typescript-eslint/unbound-method -- read as a Reflect metadata key only, never invoked/bound
    const listSnapshots = AdminArticlesController.prototype.listSnapshots;
    expect(rolesOf(listSnapshots)).toBeUndefined();
  });

  // Ordinary content CRUD must stay open to every authenticated admin (brief: "editor →
  // ordinary draft editing = allowed") — no `@Roles()` metadata means RolesGuard lets any
  // authenticated admin through (see roles.guard.spec.ts, "allows the request through when the
  // route declares no required roles").
  it.each([
    'create',
    'update',
    'remove',
    'duplicate',
    'findAll',
    'findOne',
  ] as const)('does not restrict %s() to any role', (method) => {
    // eslint-disable-next-line @typescript-eslint/unbound-method -- read as a Reflect metadata key only, never invoked/bound
    expect(rolesOf(AdminArticlesController.prototype[method])).toBeUndefined();
  });
});
