import { Injectable } from '@nestjs/common';
import type { AiAnalyticsEventType } from '@ppn/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { AiSettingsService } from './ai-settings.service';
import { AiSyncService } from './ai-sync.service';

/** Privacy-conscious usage counters (brief §AI/§AH) — coarse event counts only, keyed by the
 * same ephemeral `session_id` used for conversation logging, no other visitor-identifying data
 * ever recorded. */
@Injectable()
export class AiAnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: AiSettingsService,
    private readonly syncService: AiSyncService,
  ) {}

  async recordEvent(
    eventType: AiAnalyticsEventType,
    sessionId: string,
    language?: string,
    productId?: string | null,
  ) {
    await this.prisma.aiAnalyticsEvent.create({
      data: { eventType, sessionId, language, productId },
    });
    return { recorded: true };
  }

  async getSummary() {
    const [
      settings,
      status,
      totalConversations,
      whatsappClicks,
      quotationIntent,
      sourceSummary,
    ] = await Promise.all([
      this.settingsService.getOrCreateRaw(),
      this.syncService.getStatus(),
      this.prisma.aiConversationMessage
        .findMany({ distinct: ['sessionId'], select: { sessionId: true } })
        .then((rows) => rows.length),
      this.prisma.aiAnalyticsEvent.count({
        where: { eventType: 'whatsapp_clicked' },
      }),
      this.prisma.aiAnalyticsEvent.count({
        where: { eventType: 'quotation_intent' },
      }),
      this.syncService.getSourceSummary(),
    ]);

    return {
      assistant_active: settings.enabled,
      knowledge_sources: sourceSummary.filter((s) => s.enabled).length,
      indexed_content: status.indexed_count,
      last_sync: status.last_synced_at,
      failed_sync: status.last_status === 'failed' ? 1 : 0,
      total_conversations: totalConversations,
      whatsapp_clicks: whatsappClicks,
      quotation_intent: quotationIntent,
    };
  }
}
