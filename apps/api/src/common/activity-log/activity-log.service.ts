import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { buildPaginationMeta } from '../dto/pagination-query.dto';
import { toActivityLogDto } from './activity-log.mapper';

export interface RecordActivityParams {
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  module: string;
  entityType?: string | null;
  entityId?: string | null;
  method: string;
  path: string;
  statusCode: number;
}

export interface ActivityLogQuery {
  page: number;
  limit: number;
  actorId?: string;
  action?: string;
  module?: string;
  from?: string;
  to?: string;
}

function buildSummary(p: RecordActivityParams): string {
  const target = p.entityId ? `${p.module} #${p.entityId}` : p.module;
  const outcome = p.statusCode >= 400 ? ` (failed, ${p.statusCode})` : '';
  return `${p.actorName} — ${p.action} on ${target}${outcome}`;
}

/**
 * Fire-and-forget audit trail writer. Called from `ActivityLogInterceptor` for every mutating
 * admin request, plus explicitly from `AuthController` for LOGIN (which has no authenticated
 * `req.user` yet at request time, so it can't flow through the generic interceptor path).
 * Never throws — a logging failure must never break the admin action it's describing.
 */
@Injectable()
export class ActivityLogService {
  private readonly logger = new Logger(ActivityLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  record(params: RecordActivityParams): void {
    void this.prisma.adminActivityLog
      .create({
        data: {
          actorId: params.actorId,
          actorName: params.actorName,
          actorRole: params.actorRole,
          action: params.action,
          module: params.module,
          entityType: params.entityType ?? null,
          entityId: params.entityId ?? null,
          method: params.method,
          path: params.path,
          statusCode: params.statusCode,
          summary: buildSummary(params),
        },
      })
      .catch((err) => {
        this.logger.warn(
          `Failed to record activity log entry: ${(err as Error).message}`,
        );
      });
  }

  async list(query: ActivityLogQuery) {
    const where: Record<string, unknown> = {};
    if (query.actorId) where.actorId = query.actorId;
    if (query.action) where.action = query.action;
    if (query.module) where.module = query.module;
    if (query.from || query.to) {
      where.createdAt = {
        ...(query.from ? { gte: new Date(query.from) } : {}),
        ...(query.to ? { lte: new Date(query.to) } : {}),
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.adminActivityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.adminActivityLog.count({ where }),
    ]);

    return {
      items: items.map(toActivityLogDto),
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  /** Distinct actor/action/module values for the Activity Log page's filter dropdowns. */
  async filterOptions() {
    const [actors, actions, modules] = await Promise.all([
      this.prisma.adminActivityLog.findMany({
        distinct: ['actorId'],
        select: { actorId: true, actorName: true },
        orderBy: { actorName: 'asc' },
      }),
      this.prisma.adminActivityLog.findMany({
        distinct: ['action'],
        select: { action: true },
        orderBy: { action: 'asc' },
      }),
      this.prisma.adminActivityLog.findMany({
        distinct: ['module'],
        select: { module: true },
        orderBy: { module: 'asc' },
      }),
    ]);
    return {
      actors: actors.map((a) => ({ id: a.actorId, name: a.actorName })),
      actions: actions.map((a) => a.action),
      modules: modules.map((m) => m.module),
    };
  }
}
