import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  CONTENT_PUBLISHED_EVENT,
  type ContentPublishedEvent,
} from '../../common/events/content-published.event';
import { AiSyncService } from './ai-sync.service';

/** The only thing in this codebase that knows "content was published" implies "AI knowledge
 * should refresh." Lives inside `AiModule` on purpose — content modules emit a domain-neutral
 * `content.published` event and never import anything from here, which is what avoids the
 * circular-dependency `AiModule` would otherwise have with every content module it already
 * imports (for `AiContentExtractorService`). */
@Injectable()
export class AiPublishSyncListener {
  private readonly logger = new Logger(AiPublishSyncListener.name);

  constructor(private readonly syncService: AiSyncService) {}

  @OnEvent(CONTENT_PUBLISHED_EVENT)
  handleContentPublished(event: ContentPublishedEvent): void {
    this.logger.log(
      `content.published (source="${event.source}"${event.entityId ? `, entityId="${event.entityId}"` : ''}) — scheduling AI sync.`,
    );
    this.syncService.scheduleSync(`publish:${event.source}`);
  }
}
