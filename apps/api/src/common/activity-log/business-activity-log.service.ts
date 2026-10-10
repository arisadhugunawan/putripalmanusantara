import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface RecordBusinessActivityParams {
  actorId: string;
  actorName: string;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
}

/**
 * The ExternalAccount-side counterpart to `ActivityLogService`/`AdminActivityLog` — same
 * fire-and-forget, append-only, never-throws discipline, deliberately a separate table and
 * service rather than widening the admin one (Migration 14's own locked architecture: different
 * trust levels, isolated blast radius, no shared table).
 */
@Injectable()
export class BusinessActivityLogService {
  private readonly logger = new Logger(BusinessActivityLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  record(params: RecordBusinessActivityParams): void {
    void this.prisma.businessActivityLog
      .create({
        data: {
          actorId: params.actorId,
          actorName: params.actorName,
          action: params.action,
          entityType: params.entityType ?? null,
          entityId: params.entityId ?? null,
        },
      })
      .catch((err) => {
        this.logger.warn(
          `Failed to record business activity log entry: ${(err as Error).message}`,
        );
      });
  }
}
