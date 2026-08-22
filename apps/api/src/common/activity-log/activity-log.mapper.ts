import type { AdminActivityLog } from '../../../generated/prisma/client';

export function toActivityLogDto(log: AdminActivityLog) {
  return {
    id: log.id,
    actor_id: log.actorId,
    actor_name: log.actorName,
    actor_role: log.actorRole,
    action: log.action,
    module: log.module,
    entity_type: log.entityType,
    entity_id: log.entityId,
    method: log.method,
    path: log.path,
    status_code: log.statusCode,
    summary: log.summary,
    created_at: log.createdAt.toISOString(),
  };
}
