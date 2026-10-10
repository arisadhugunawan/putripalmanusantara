import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import { AdminBusinessRelationshipsController } from './admin-business-relationships.controller';

// `RolesGuard`'s own pass/reject mechanics are already fully covered by
// `common/guards/roles.guard.spec.ts` — this only verifies this controller wires `@Roles()`
// onto the right handlers: state-changing actions restricted, reads left open.
//
// These method references are read purely for their attached metadata, never called as bound
// methods, so the `this`-scoping concern `unbound-method` warns about doesn't apply here.
/* eslint-disable @typescript-eslint/unbound-method */
describe('AdminBusinessRelationshipsController roles metadata', () => {
  const reflector = new Reflector();

  it('restricts approve/reject/suspend/reactivate to super_admin', () => {
    const proto = AdminBusinessRelationshipsController.prototype;
    expect(reflector.get(ROLES_KEY, proto.approve)).toEqual(['super_admin']);
    expect(reflector.get(ROLES_KEY, proto.reject)).toEqual(['super_admin']);
    expect(reflector.get(ROLES_KEY, proto.suspend)).toEqual(['super_admin']);
    expect(reflector.get(ROLES_KEY, proto.reactivate)).toEqual(['super_admin']);
  });

  it('leaves list/findOne open to any authenticated admin (no @Roles())', () => {
    const proto = AdminBusinessRelationshipsController.prototype;
    expect(reflector.get(ROLES_KEY, proto.list)).toBeUndefined();
    expect(reflector.get(ROLES_KEY, proto.findOne)).toBeUndefined();
  });
});
/* eslint-enable @typescript-eslint/unbound-method */
