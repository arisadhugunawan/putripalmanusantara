import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AI_SOURCE_KEYS, type AiSourceKey } from '@ppn/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { AiContentExtractorService } from './ai-content-extractor.service';
import { AiSettingsService } from './ai-settings.service';

const SOURCE_LABELS: Record<AiSourceKey, string> = {
  home: 'Home',
  about_company: 'About Company',
  products: 'Products',
  facilities: 'Facilities',
  moq_payment_terms: 'MOQ & Payment Terms',
  shipment_terms: 'Shipment Terms',
  faq: 'FAQ',
  gallery: 'Gallery',
  news: 'News',
  contact: 'Contact',
  legal_certificates: 'Legal & Certificates',
};

let syncInFlight = false;

/** Set when a new automatic trigger arrives while a sync is already running (see
 * `scheduleSync`) — cleared and actioned as exactly one follow-up full rebuild once the
 * in-flight run finishes. Never accumulates beyond a single boolean: any number of triggers
 * during one run still produces at most one rerun afterward, never one rerun per trigger — the
 * latest published state is the source of truth for that rerun, not a queue of individual
 * triggers. */
let pendingRerun = false;

/** Consecutive failures across every trigger (manual, scheduled, publish-triggered) —
 * deliberately shared rather than tracked per-trigger-type, since a failure is evidence the
 * sync mechanism itself is broken (bad settings, DB issue, extractor bug) regardless of what
 * triggered it. */
let consecutiveFailures = 0;

/** Trips once `consecutiveFailures` reaches `AUTO_SYNC_FAILURE_THRESHOLD` — while true,
 * `scheduleSync()` (the publish-triggered path) short-circuits without attempting a new run.
 * The 5-minute cron and manual "Sync Now" are deliberately NOT gated by this flag: the cron is
 * already self-rate-limited to once per 5 minutes, so it isn't the "repeated hammering" risk a
 * burst of publish events could be, and manual Sync Now is an explicit admin action that should
 * always be reachable — it's also the intended way an admin clears this state. Cleared by any
 * successful `runSync()` regardless of trigger (in practice, while suppressed, that can only be
 * a manual or scheduled success, since the publish-triggered path is the one being suppressed).
 *
 * In-memory and module-level by design — safe only because this deployment is a single Node
 * process (`apps/api`'s `start:prod` script is plain `node dist/main`; no PM2/cluster mode,
 * Docker Compose, Kubernetes, or load-balancer config exists anywhere in this repo). If this
 * application is ever deployed multi-instance, this flag (and `syncInFlight`/`pendingRerun`
 * above) would need to move to a shared store (a DB row, Redis) since each instance would
 * otherwise track its own independent counter. */
let autoSyncSuppressed = false;

const AUTO_SYNC_FAILURE_THRESHOLD = 3;

/**
 * Owns the versioned rebuild-and-swap knowledge index (brief §Y "Version Control"): extraction
 * happens first (pure reads, side-effect-free — a failure here changes nothing), the full new
 * generation is written under a brand-new `version` while the previous generation's rows are
 * still untouched and still active, `AiSyncStatus.activeVersion` only flips to the new version
 * once every new row has committed, and only THEN are the old generation's rows deleted. A
 * failed/partial sync therefore can never take live retrieval down — the last successful
 * version stays active and old rows are simply never cleaned up until the next successful run.
 *
 * No job queue exists in this codebase (confirmed during design) and a full rebuild involves
 * zero external API calls (full-text indexing, not embeddings) — cheap enough to just run
 * synchronously, fire-and-forget, right after the write points that matter most. Those points
 * are the 4 content-publish call sites (Homepage/About Company/Contact Page/Products), which
 * emit a `content.published` event picked up by `AiPublishSyncListener` — see that class for
 * why the event indirection exists instead of a direct call.
 */
@Injectable()
export class AiSyncService {
  private readonly logger = new Logger(AiSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly extractor: AiContentExtractorService,
    private readonly settingsService: AiSettingsService,
  ) {}

  /** Fire-and-forget entry point for AUTOMATIC (publish-triggered) syncs — only
   * `AiPublishSyncListener` calls this. Never throws, never blocks the caller. Coalesces bursts
   * (a trigger arriving while a sync is already running sets `pendingRerun` instead of starting
   * a second overlapping run, so N publishes in quick succession produce at most one rerun, not
   * N reruns) and backs off after repeated failures via `autoSyncSuppressed`. The 5-minute cron
   * (`scheduledResync` below) and manual Sync Now (`AdminAiController.sync()`) intentionally
   * call `runSync()` directly instead of going through here — see the module-level
   * `autoSyncSuppressed` doc comment for why they stay unaffected by this method's backoff. */
  scheduleSync(trigger: string): void {
    if (autoSyncSuppressed) {
      this.logger.warn(
        `Automatic AI sync suppressed after ${consecutiveFailures} consecutive failures — skipping trigger="${trigger}". Use "Sync Now" to retry and clear the suppression.`,
      );
      return;
    }
    if (syncInFlight) {
      pendingRerun = true;
      this.logger.log(
        `AI sync already running — trigger="${trigger}" will run as a single follow-up rebuild once it finishes.`,
      );
      return;
    }
    void this.runThenMaybeRerun(trigger);
  }

  private async runThenMaybeRerun(trigger: string): Promise<void> {
    await this.runSync(trigger).catch((err) => {
      this.logger.error(`Background AI sync failed: ${(err as Error).message}`);
    });
    if (pendingRerun) {
      pendingRerun = false;
      await this.runSync(`${trigger}+rerun`).catch((err) => {
        this.logger.error(
          `Background AI sync (coalesced rerun) failed: ${(err as Error).message}`,
        );
      });
    }
  }

  /** Periodic reconciliation/fallback — genuinely automatic (zero admin re-typing of content)
   * even though it isn't instant; a content edit reflects in AI knowledge within one resync
   * cycle (5 minutes) at most even if the publish-triggered path above were ever suppressed or
   * missed. A full rebuild costs nothing but a handful of DB reads/writes (full-text indexing,
   * not embeddings, so no external API calls), safe to run this often. */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async scheduledResync() {
    const settings = await this.settingsService.getOrCreateRaw();
    if (!settings.enabled) return;
    await this.runSync('scheduled');
  }

  async runSync(
    trigger: string,
  ): Promise<{ success: boolean; chunksCreated: number; error?: string }> {
    if (syncInFlight) {
      this.logger.log(
        `Skipping AI sync (trigger="${trigger}") — a sync is already running.`,
      );
      return {
        success: false,
        chunksCreated: 0,
        error: 'A sync is already in progress.',
      };
    }
    syncInFlight = true;

    const version = BigInt(Date.now());
    const log = await this.prisma.aiSyncLog.create({
      data: { version, status: 'running', trigger },
    });

    try {
      const settings = await this.settingsService.getOrCreateRaw();
      const { chunks, failedSources } =
        await this.extractor.extractAll(settings);
      const statusRow = await this.getOrCreateStatusRow();

      await this.prisma.$transaction(async (tx) => {
        if (chunks.length) {
          await tx.aiKnowledgeChunk.createMany({
            data: chunks.map((c) => ({
              version,
              sourceKey: c.sourceKey,
              contentType: c.contentType,
              page: c.page,
              section: c.section,
              language: c.language,
              productId: c.productId,
              sourceUrl: c.sourceUrl,
              content: c.content,
              updatedAt: c.updatedAt,
            })),
          });
        }
        await tx.aiSyncStatus.update({
          where: { id: statusRow.id },
          data: {
            activeVersion: version,
            lastSyncedAt: new Date(),
            lastStatus: 'success',
            lastError: null,
            totalSources: AI_SOURCE_KEYS.length,
            indexedCount: chunks.length,
            failedCount: failedSources.length,
          },
        });
      });

      // Cleanup is deferred until after the new version is active and best-effort — leftover
      // old-generation rows are harmless (never queried once activeVersion has moved on).
      await this.prisma.aiKnowledgeChunk
        .deleteMany({ where: { version: { not: version } } })
        .catch((err) =>
          this.logger.warn(
            `Old-version cleanup failed (non-fatal): ${(err as Error).message}`,
          ),
        );

      await this.prisma.aiSyncLog.update({
        where: { id: log.id },
        data: {
          status: 'success',
          finishedAt: new Date(),
          chunksCreated: chunks.length,
        },
      });

      consecutiveFailures = 0;
      autoSyncSuppressed = false;

      this.logger.log(
        `AI sync succeeded (trigger="${trigger}"): ${chunks.length} chunks, version ${version}.`,
      );
      return { success: true, chunksCreated: chunks.length };
    } catch (err) {
      const message = (err as Error).message;
      this.logger.error(`AI sync failed (trigger="${trigger}"): ${message}`);
      await this.prisma.aiSyncLog.update({
        where: { id: log.id },
        data: {
          status: 'failed',
          finishedAt: new Date(),
          errorMessage: message,
        },
      });
      // Deliberately does NOT touch activeVersion — the last successful version stays live.
      const statusRow = await this.getOrCreateStatusRow();
      await this.prisma.aiSyncStatus.update({
        where: { id: statusRow.id },
        data: { lastStatus: 'failed', lastError: message },
      });

      consecutiveFailures += 1;
      if (consecutiveFailures >= AUTO_SYNC_FAILURE_THRESHOLD && !autoSyncSuppressed) {
        autoSyncSuppressed = true;
        this.logger.warn(
          `Automatic AI sync suppressed after ${consecutiveFailures} consecutive failures (threshold ${AUTO_SYNC_FAILURE_THRESHOLD}). Publish-triggered syncs will be skipped until a successful sync clears this; the 5-minute cron and manual "Sync Now" are unaffected.`,
        );
      }

      return { success: false, chunksCreated: 0, error: message };
    } finally {
      syncInFlight = false;
    }
  }

  // P1-6 — `upsert()` on the `singleton` marker (always `true`, `@unique`) closes the
  // findFirst()-then-create() TOCTOU race: two concurrent calls now resolve to the SAME
  // database-enforced row instead of racing to create two.
  private async getOrCreateStatusRow() {
    return this.prisma.aiSyncStatus.upsert({
      where: { singleton: true },
      create: { singleton: true },
      update: {},
    });
  }

  async getStatus() {
    const status = await this.prisma.aiSyncStatus.findFirst();
    return {
      active_version: status?.activeVersion?.toString() ?? null,
      last_synced_at: status?.lastSyncedAt?.toISOString() ?? null,
      last_status: status?.lastStatus ?? 'success',
      last_error: status?.lastError ?? null,
      total_sources: status?.totalSources ?? 0,
      indexed_count: status?.indexedCount ?? 0,
      failed_count: status?.failedCount ?? 0,
      updated_at: status?.updatedAt?.toISOString() ?? new Date().toISOString(),
      auto_sync_suppressed: autoSyncSuppressed,
    };
  }

  async getLogs(limit = 20) {
    const logs = await this.prisma.aiSyncLog.findMany({
      orderBy: { startedAt: 'desc' },
      take: limit,
    });
    return logs.map((l) => ({
      id: l.id,
      version: l.version.toString(),
      status: l.status,
      trigger: l.trigger,
      started_at: l.startedAt.toISOString(),
      finished_at: l.finishedAt?.toISOString() ?? null,
      chunks_created: l.chunksCreated,
      error_message: l.errorMessage,
    }));
  }

  async getSourceSummary() {
    const [status, settings] = await Promise.all([
      this.prisma.aiSyncStatus.findFirst(),
      this.settingsService.getOrCreateRaw(),
    ]);
    const activeVersion = status?.activeVersion;
    const counts = activeVersion
      ? await this.prisma.aiKnowledgeChunk.groupBy({
          by: ['sourceKey'],
          where: { version: activeVersion },
          _count: { _all: true },
        })
      : [];
    const countBySource = new Map(
      counts.map((c) => [c.sourceKey, c._count._all]),
    );
    const enabledBySource: Record<AiSourceKey, boolean> = {
      home: settings.includeHome,
      about_company: settings.includeAboutCompany,
      products: settings.includeProducts,
      facilities: settings.includeFacilities,
      moq_payment_terms: settings.includeMoqPaymentTerms,
      shipment_terms: settings.includeShipmentTerms,
      faq: settings.includeFaq,
      gallery: settings.includeGallery,
      news: settings.includeNews,
      contact: settings.includeContact,
      legal_certificates: settings.includeLegalCertificates,
    };
    return AI_SOURCE_KEYS.map((key) => ({
      source_key: key,
      label: SOURCE_LABELS[key],
      enabled: enabledBySource[key],
      chunk_count: countBySource.get(key) ?? 0,
    }));
  }
}
