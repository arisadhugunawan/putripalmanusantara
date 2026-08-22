/** Deliberately domain-neutral (lives in `common/`, not `modules/ai/`) — content modules only
 * need to know "something was published," never that an AI module exists or listens. Emitting
 * this event must never require a content module to import anything AI-flavored. */
export const CONTENT_PUBLISHED_EVENT = 'content.published';

export type PublishedContentSource = 'home' | 'about_company' | 'contact' | 'products';

/** Payload is intentionally minimal: an enum-like `source` plus an optional id. Never the
 * published entity itself — a listener that needs the actual content re-reads it through the
 * normal published-data read path (e.g. `ProductsService.findPublishedBySlug`), which is what
 * keeps this event safe to add without smuggling draft/unpublished data through it. */
export interface ContentPublishedEvent {
  source: PublishedContentSource;
  entityId?: string;
}
