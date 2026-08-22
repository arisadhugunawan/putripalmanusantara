import { SetMetadata } from '@nestjs/common';
import type { CurrentAdminPayload } from './current-admin.decorator';

export const ROLES_KEY = 'roles';

/** Restricts a route to the listed admin roles. Must be paired with `RolesGuard` — on its own
 * this decorator only attaches metadata, it enforces nothing. Only apply to routes that
 * genuinely need restricting (publish/restore/system settings); day-to-day content CRUD stays
 * open to every authenticated admin. */
export const Roles = (...roles: CurrentAdminPayload['role'][]) =>
  SetMetadata(ROLES_KEY, roles);
